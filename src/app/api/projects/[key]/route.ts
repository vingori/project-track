import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { key: string } }
) {
  try {
    const projectKey = params.key.toUpperCase();

    const project = await prisma.project.findUnique({
      where: { key: projectKey },
      include: {
        lead: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
        workflow: {
          include: {
            statuses: {
              orderBy: { order: "asc" },
            },
            transitions: {
              include: {
                toStatus: {
                  select: { id: true, name: true, category: true, color: true },
                },
              },
            },
          },
        },
        milestones: {
          orderBy: { order: "asc" },
          include: {
            _count: {
              select: { issues: true },
            },
          },
        },
        healthChecks: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true, role: true } },
          },
        },
        sprints: {
          orderBy: { createdAt: "desc" },
        },
        slaPolicies: true,
        issues: {
          select: {
            id: true,
            type: true,
            priority: true,
            estimatedHours: true,
            loggedHours: true,
            status: { select: { category: true } },
            slaBreached: true,
            worklogs: {
              select: {
                timeSpentHours: true,
                billable: true,
                dateWorked: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalIssues = project.issues.length;
    const doneIssues = project.issues.filter((i) => i.status.category === "DONE").length;
    const breachedCount = project.issues.filter((i) => i.slaBreached).length;
    const totalEstimatedHours = project.issues.reduce((acc, curr) => acc + (curr.estimatedHours || 0), 0);

    let totalLoggedHours = 0;
    let billableHours = 0;
    let monthLoggedHours = 0;

    project.issues.forEach((issue) => {
      issue.worklogs.forEach((w) => {
        totalLoggedHours += w.timeSpentHours;
        if (w.billable) billableHours += w.timeSpentHours;
        if (new Date(w.dateWorked) >= startOfMonth) {
          monthLoggedHours += w.timeSpentHours;
        }
      });
    });

    const retainerMonthly = project.retainerHours || 0;
    const retainerRollover = project.retainerRolloverHours || 0;
    const retainerAvailableHours = retainerMonthly + retainerRollover;
    const retainerUsedHours = monthLoggedHours;
    const retainerRemainingHours = Math.max(0, retainerAvailableHours - retainerUsedHours);
    const isOverage = retainerUsedHours > retainerAvailableHours;
    const overageHours = isOverage ? retainerUsedHours - retainerAvailableHours : 0;
    const retainerBurnPercent = retainerAvailableHours > 0
      ? Math.round((retainerUsedHours / retainerAvailableHours) * 100)
      : 0;

    const stats = {
      totalIssues,
      doneIssues,
      progressPercent: totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0,
      breachedCount,
      totalEstimatedHours,
      totalLoggedHours: Math.round(totalLoggedHours * 10) / 10,
      billableHours: Math.round(billableHours * 10) / 10,
      monthLoggedHours: Math.round(monthLoggedHours * 10) / 10,
      retainerAvailableHours,
      retainerUsedHours: Math.round(retainerUsedHours * 10) / 10,
      retainerRemainingHours: Math.round(retainerRemainingHours * 10) / 10,
      retainerBurnPercent,
      isOverage,
      overageHours: Math.round(overageHours * 10) / 10,
    };

    return NextResponse.json({ ...project, stats });
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { key: string } }
) {
  try {
    const projectKey = params.key.toUpperCase();
    const body = await req.json();

    const updated = await prisma.project.update({
      where: { key: projectKey },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.ragStatus !== undefined && { ragStatus: body.ragStatus }),
        ...(body.clientName !== undefined && { clientName: body.clientName }),
        ...(body.budgetHours !== undefined && { budgetHours: parseFloat(body.budgetHours) }),
        ...(body.budgetAmount !== undefined && { budgetAmount: parseFloat(body.budgetAmount) }),
        ...(body.retainerHours !== undefined && { retainerHours: parseFloat(body.retainerHours) }),
        ...(body.retainerRolloverHours !== undefined && { retainerRolloverHours: parseFloat(body.retainerRolloverHours) }),
        ...(body.retainerHourlyRate !== undefined && { retainerHourlyRate: parseFloat(body.retainerHourlyRate) }),
        ...(body.retainerOverageRate !== undefined && { retainerOverageRate: parseFloat(body.retainerOverageRate) }),
        ...(body.kickoffChecklist !== undefined && { kickoffChecklist: typeof body.kickoffChecklist === "string" ? body.kickoffChecklist : JSON.stringify(body.kickoffChecklist) }),
        ...(body.onboardingStatus !== undefined && { onboardingStatus: body.onboardingStatus }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Failed to update project:", error);
    return NextResponse.json({ error: error.message || "Failed to update project" }, { status: 500 });
  }
}
