import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitAppEvent } from "@/lib/events";

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
        milestones: {
          orderBy: { targetDate: "asc" },
        },
        issues: {
          include: {
            status: true,
            worklogs: true,
          },
        },
        healthChecks: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const now = new Date();

    // 1. Automated Schedule Health Check
    let overdueMilestones = 0;
    project.milestones.forEach((m) => {
      if (m.status !== "REACHED" && new Date(m.targetDate) < now) {
        overdueMilestones++;
      }
    });

    let autoScheduleHealth = "GREEN";
    if (overdueMilestones > 1) autoScheduleHealth = "RED";
    else if (overdueMilestones === 1) autoScheduleHealth = "AMBER";

    // 2. Automated Budget / Burn Health Check
    let autoBudgetHealth = "GREEN";
    if (project.type === "RETAINER") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const currentDay = now.getDate();
      const expectedBurnRate = currentDay / daysInMonth;

      const monthlyPool = (project.retainerHours || 0) + (project.retainerRolloverHours || 0);
      let monthLogged = 0;
      project.issues.forEach((i) => {
        i.worklogs.forEach((w) => {
          if (new Date(w.dateWorked) >= startOfMonth && w.billable) {
            monthLogged += w.timeSpentHours;
          }
        });
      });

      const actualBurnRate = monthlyPool > 0 ? monthLogged / monthlyPool : 0;
      if (actualBurnRate > 1.0) {
        autoBudgetHealth = "RED"; // Already exceeded retainer
      } else if (actualBurnRate > expectedBurnRate * 1.35 && monthLogged > 15) {
        autoBudgetHealth = "AMBER"; // Burning hours 35% faster than month timeline
      }
    } else {
      // Greenfield
      if (project.budgetHours && project.budgetHours > 0) {
        let totalLogged = 0;
        project.issues.forEach((i) => {
          i.worklogs.forEach((w) => {
            totalLogged += w.timeSpentHours;
          });
        });
        const burn = totalLogged / project.budgetHours;
        const totalIssues = project.issues.length;
        const doneIssues = project.issues.filter((i) => i.status.category === "DONE").length;
        const progress = totalIssues > 0 ? doneIssues / totalIssues : 0;

        if (burn > 1.0 && progress < 0.9) autoBudgetHealth = "RED";
        else if (burn > 0.8 && progress < 0.5) autoBudgetHealth = "AMBER";
      }
    }

    // 3. Automated Risk / Defect Health Check
    const openBlockers = project.issues.filter(
      (i) => (i.priority === "CRITICAL" || i.priority === "BLOCKER") && i.status.category !== "DONE"
    ).length;

    let autoScopeHealth = "GREEN";
    if (openBlockers >= 3) autoScopeHealth = "RED";
    else if (openBlockers >= 1) autoScopeHealth = "AMBER";

    // Recommended composite RAG
    let recommendedRAG = "GREEN";
    if (autoScheduleHealth === "RED" || autoBudgetHealth === "RED" || autoScopeHealth === "RED") {
      recommendedRAG = "RED";
    } else if (autoScheduleHealth === "AMBER" || autoBudgetHealth === "AMBER" || autoScopeHealth === "AMBER") {
      recommendedRAG = "AMBER";
    }

    return NextResponse.json({
      project: {
        id: project.id,
        key: project.key,
        name: project.name,
        type: project.type,
        ragStatus: project.ragStatus,
        clientName: project.clientName,
      },
      healthChecks: project.healthChecks,
      automatedDiagnostics: {
        scheduleHealth: autoScheduleHealth,
        budgetHealth: autoBudgetHealth,
        scopeHealth: autoScopeHealth,
        recommendedRAG,
        metrics: {
          overdueMilestones,
          openBlockers,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch project health:", error);
    return NextResponse.json({ error: "Failed to fetch project health" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const projectKey = params.key.toUpperCase();
    const body = await req.json();

    const {
      status,
      scheduleHealth,
      budgetHealth,
      scopeHealth,
      clientSentiment,
      summary,
      blockers,
      nextSteps,
    } = body;

    if (!summary?.trim()) {
      return NextResponse.json({ error: "A health check summary narrative is required." }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { key: projectKey },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const userId = session?.user?.id || (await prisma.user.findFirst())?.id;
    if (!userId) {
      return NextResponse.json({ error: "No user found" }, { status: 400 });
    }

    // 1. Create Health Check
    const healthCheck = await prisma.projectHealthCheck.create({
      data: {
        projectId: project.id,
        status: status || "GREEN",
        scheduleHealth: scheduleHealth || "GREEN",
        budgetHealth: budgetHealth || "GREEN",
        scopeHealth: scopeHealth || "GREEN",
        clientSentiment: clientSentiment || "GOOD",
        summary: summary.trim(),
        blockers: blockers?.trim() || null,
        nextSteps: nextSteps?.trim() || null,
        authorId: userId,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });

    // 2. Automatically sync project RAG status
    await prisma.project.update({
      where: { id: project.id },
      data: {
        ragStatus: status || "GREEN",
      },
    });

    // 3. Emit SSE Event
    emitAppEvent({
      type: "PROJECT_HEALTH_CHECK_CREATED",
      projectId: project.id,
      data: { projectKey, status, summary },
    });

    return NextResponse.json(healthCheck, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create project health check:", error);
    return NextResponse.json({ error: error.message || "Failed to create project health check" }, { status: 500 });
  }
}
