import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitAppEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const worklogs = await prisma.worklog.findMany({
      where: { issueId: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
      },
      orderBy: { dateWorked: "desc" },
    });

    return NextResponse.json(worklogs);
  } catch (error) {
    console.error("Failed to fetch worklogs:", error);
    return NextResponse.json({ error: "Failed to fetch worklogs" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { timeSpentHours, description, dateWorked, remainingHours } = body;

    const hours = parseFloat(timeSpentHours);
    if (isNaN(hours) || hours <= 0) {
      return NextResponse.json(
        { error: "Valid time spent in hours is required (e.g. 1.5)." },
        { status: 400 }
      );
    }

    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: { project: true },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const userId = session?.user?.id || (await prisma.user.findFirst())?.id;
    if (!userId) {
      return NextResponse.json({ error: "No user found" }, { status: 400 });
    }

    // 1. Create Worklog
    const worklog = await prisma.worklog.create({
      data: {
        timeSpentHours: hours,
        description: description?.trim() || null,
        dateWorked: dateWorked ? new Date(dateWorked) : new Date(),
        issueId: issue.id,
        userId,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });

    // 2. Increment loggedHours on Issue (and optionally update remainingHours)
    const updateData: any = {
      loggedHours: { increment: hours },
    };
    if (remainingHours !== undefined && remainingHours !== null && !isNaN(parseFloat(remainingHours))) {
      updateData.remainingHours = parseFloat(remainingHours);
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issue.id },
      data: updateData,
    });

    // 3. Write Audit Log
    await prisma.auditLog.create({
      data: {
        issueId: issue.id,
        userId,
        field: "worklog",
        oldValue: `${(issue.loggedHours || 0)}h`,
        newValue: `${updatedIssue.loggedHours}h (+${hours}h: ${description || "Work logged"})`,
      },
    });

    // 4. Real-time broadcast
    emitAppEvent({
      type: "ISSUE_UPDATED",
      issueId: issue.id,
      projectKey: issue.project.key,
      field: "worklog",
    });

    return NextResponse.json(worklog, { status: 201 });
  } catch (error) {
    console.error("Failed to log work:", error);
    return NextResponse.json({ error: "Failed to log work" }, { status: 500 });
  }
}
