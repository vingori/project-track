import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitAppEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectKey = searchParams.get("projectKey");
    const userId = searchParams.get("userId");
    const billable = searchParams.get("billable");
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (projectKey && projectKey !== "ALL") {
      where.issue = {
        project: { key: projectKey.toUpperCase() },
      };
    }

    if (userId && userId !== "ALL") {
      where.userId = userId;
    }

    if (billable !== null && billable !== undefined && billable !== "ALL") {
      where.billable = billable === "true";
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (startDate || endDate) {
      where.dateWorked = {};
      if (startDate) where.dateWorked.gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        where.dateWorked.lte = e;
      }
    }

    const worklogs = await prisma.worklog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true },
        },
        issue: {
          select: {
            id: true,
            key: true,
            title: true,
            type: true,
            milestone: {
              select: { id: true, title: true },
            },
            project: {
              select: { id: true, key: true, name: true, type: true },
            },
          },
        },
      },
      orderBy: { dateWorked: "desc" },
    });

    // Compute aggregations
    let totalHours = 0;
    let billableHours = 0;
    const userBreakdown: Record<string, { name: string; avatarUrl: string | null; role: string; hours: number; billableHours: number }> = {};
    const projectBreakdown: Record<string, { key: string; name: string; type: string; hours: number }> = {};
    const categoryBreakdown: Record<string, number> = {};

    worklogs.forEach((w) => {
      totalHours += w.timeSpentHours;
      if (w.billable) billableHours += w.timeSpentHours;

      // User Breakdown
      if (!userBreakdown[w.user.id]) {
        userBreakdown[w.user.id] = {
          name: w.user.name,
          avatarUrl: w.user.avatarUrl,
          role: w.user.role,
          hours: 0,
          billableHours: 0,
        };
      }
      userBreakdown[w.user.id].hours += w.timeSpentHours;
      if (w.billable) userBreakdown[w.user.id].billableHours += w.timeSpentHours;

      // Project Breakdown
      const pKey = w.issue.project.key;
      if (!projectBreakdown[pKey]) {
        projectBreakdown[pKey] = {
          key: pKey,
          name: w.issue.project.name,
          type: w.issue.project.type,
          hours: 0,
        };
      }
      projectBreakdown[pKey].hours += w.timeSpentHours;

      // Category Breakdown
      const cat = w.category || "DEVELOPMENT";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + w.timeSpentHours;
    });

    const billablePercent = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;

    return NextResponse.json({
      worklogs,
      summary: {
        totalHours: Math.round(totalHours * 10) / 10,
        billableHours: Math.round(billableHours * 10) / 10,
        billablePercent,
        userBreakdown: Object.values(userBreakdown).map((u) => ({
          ...u,
          hours: Math.round(u.hours * 10) / 10,
          billableHours: Math.round(u.billableHours * 10) / 10,
        })),
        projectBreakdown: Object.values(projectBreakdown).map((p) => ({
          ...p,
          hours: Math.round(p.hours * 10) / 10,
        })),
        categoryBreakdown: Object.entries(categoryBreakdown).map(([name, hours]) => ({
          name,
          hours: Math.round(hours * 10) / 10,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch timesheet worklogs:", error);
    return NextResponse.json({ error: "Failed to fetch timesheet worklogs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { issueId, timeSpentHours, description, billable, category, dateWorked, userId: explicitUserId } = body;

    const hours = parseFloat(timeSpentHours);
    if (isNaN(hours) || hours <= 0) {
      return NextResponse.json({ error: "Valid time in hours is required (e.g. 2.5)" }, { status: 400 });
    }

    if (!issueId) {
      return NextResponse.json({ error: "Issue ID is required" }, { status: 400 });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { project: true, milestone: true },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const userId = explicitUserId || session?.user?.id || (await prisma.user.findFirst())?.id;
    if (!userId) {
      return NextResponse.json({ error: "No user found to associate with worklog" }, { status: 400 });
    }

    const isBillable = billable !== undefined ? Boolean(billable) : true;
    const cat = category || (issue.project.type === "RETAINER" ? "MAINTENANCE" : "DEVELOPMENT");
    const workedDate = dateWorked ? new Date(dateWorked) : new Date();

    // 1. Create Worklog
    const worklog = await prisma.worklog.create({
      data: {
        issueId: issue.id,
        userId,
        timeSpentHours: hours,
        description: description?.trim() || null,
        billable: isBillable,
        category: cat,
        dateWorked: workedDate,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });

    // 2. Increment Issue loggedHours
    const updatedIssue = await prisma.issue.update({
      where: { id: issue.id },
      data: {
        loggedHours: { increment: hours },
      },
    });

    // 3. If Issue is attached to a Milestone, also increment Milestone loggedHours
    if (issue.milestoneId) {
      await prisma.milestone.update({
        where: { id: issue.milestoneId },
        data: {
          loggedHours: { increment: hours },
        },
      });
    }

    // 4. Audit Log
    await prisma.auditLog.create({
      data: {
        issueId: issue.id,
        userId,
        field: "worklog",
        oldValue: `${issue.loggedHours || 0}h`,
        newValue: `${updatedIssue.loggedHours}h (+${hours}h: ${description || cat})`,
      },
    });

    // 5. Emit real-time update
    emitAppEvent({
      type: "WORKLOG_CREATED",
      issueId: issue.id,
      projectId: issue.projectId,
      data: { hours, category: cat, user: worklog.user.name },
    });

    return NextResponse.json(worklog, { status: 201 });
  } catch (error: any) {
    console.error("Failed to log time:", error);
    return NextResponse.json({ error: error.message || "Failed to log time" }, { status: 500 });
  }
}
