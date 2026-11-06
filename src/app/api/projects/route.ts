import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        lead: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
        issues: {
          select: {
            id: true,
            type: true,
            priority: true,
            estimatedHours: true,
            loggedHours: true,
            status: { select: { category: true } },
            slaBreached: true,
            storyPoints: true,
            worklogs: {
              select: {
                timeSpentHours: true,
                billable: true,
                dateWorked: true,
              },
            },
          },
        },
        milestones: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            targetDate: true,
            status: true,
            estimatedHours: true,
            loggedHours: true,
            progressPercent: true,
            order: true,
          },
        },
        healthChecks: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            scheduleHealth: true,
            budgetHealth: true,
            scopeHealth: true,
            clientSentiment: true,
            summary: true,
            createdAt: true,
          },
        },
        sprints: {
          where: { status: "ACTIVE" },
          select: { id: true, name: true, endDate: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const formatted = projects.map((proj) => {
      const totalIssues = proj.issues.length;
      const doneIssues = proj.issues.filter(
        (i) => i.status.category === "DONE"
      ).length;
      const breachedCount = proj.issues.filter((i) => i.slaBreached).length;
      const totalPoints = proj.issues.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);
      const totalEstimatedHours = proj.issues.reduce((acc, curr) => acc + (curr.estimatedHours || 0), 0);

      // Aggregate all worklogs for this project
      let totalLoggedHours = 0;
      let billableHours = 0;
      let monthLoggedHours = 0;

      proj.issues.forEach((issue) => {
        issue.worklogs.forEach((w) => {
          totalLoggedHours += w.timeSpentHours;
          if (w.billable) billableHours += w.timeSpentHours;
          if (new Date(w.dateWorked) >= startOfMonth) {
            monthLoggedHours += w.timeSpentHours;
          }
        });
      });

      // Retainer specific calculations
      const retainerMonthly = proj.retainerHours || 0;
      const retainerRollover = proj.retainerRolloverHours || 0;
      const retainerAvailableHours = retainerMonthly + retainerRollover;
      const retainerUsedHours = monthLoggedHours;
      const retainerRemainingHours = Math.max(0, retainerAvailableHours - retainerUsedHours);
      const isOverage = retainerUsedHours > retainerAvailableHours;
      const overageHours = isOverage ? retainerUsedHours - retainerAvailableHours : 0;
      const retainerBurnPercent = retainerAvailableHours > 0
        ? Math.round((retainerUsedHours / retainerAvailableHours) * 100)
        : 0;

      return {
        id: proj.id,
        key: proj.key,
        name: proj.name,
        description: proj.description,
        type: proj.type,
        ragStatus: proj.ragStatus,
        clientName: proj.clientName,
        startDate: proj.startDate,
        targetDate: proj.targetDate,
        budgetHours: proj.budgetHours,
        budgetAmount: proj.budgetAmount,
        retainerHours: proj.retainerHours,
        retainerPeriod: proj.retainerPeriod,
        retainerRolloverHours: proj.retainerRolloverHours,
        retainerRolloverCap: proj.retainerRolloverCap,
        retainerHourlyRate: proj.retainerHourlyRate,
        retainerOverageRate: proj.retainerOverageRate,
        retainerStartDate: proj.retainerStartDate,
        retainerRenewalDate: proj.retainerRenewalDate,
        onboardingStatus: proj.onboardingStatus,
        lead: proj.lead,
        milestones: proj.milestones,
        latestHealthCheck: proj.healthChecks[0] || null,
        activeSprint: proj.sprints[0] || null,
        stats: {
          totalIssues,
          doneIssues,
          progressPercent: totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0,
          breachedCount,
          totalPoints,
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
        },
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      key,
      name,
      description,
      type,
      leadId,
      ragStatus,
      clientName,
      startDate,
      targetDate,
      budgetHours,
      budgetAmount,
      retainerHours,
      retainerPeriod,
      retainerRolloverHours,
      retainerRolloverCap,
      retainerHourlyRate,
      retainerOverageRate,
      initialMilestones,
      kickoffChecklist,
      initialIssues,
    } = body;

    const workspace = await prisma.workspace.findFirst();
    if (!workspace) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 });
    }

    const cleanKey = (key || name.substring(0, 4)).toUpperCase().trim().replace(/[^A-Z0-9]/g, "");

    const existing = await prisma.project.findUnique({ where: { key: cleanKey } });
    if (existing) {
      return NextResponse.json({ error: `Project key '${cleanKey}' already exists. Please choose another.` }, { status: 400 });
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 1. Create Project
    const project = await prisma.project.create({
      data: {
        key: cleanKey,
        name,
        description: description || null,
        type: type || "GREENFIELD_MILESTONE",
        ragStatus: ragStatus || "GREEN",
        leadId: leadId || null,
        workspaceId: workspace.id,
        clientName: clientName || null,
        startDate: startDate ? new Date(startDate) : now,
        targetDate: targetDate ? new Date(targetDate) : null,
        budgetHours: budgetHours ? parseFloat(budgetHours) : null,
        budgetAmount: budgetAmount ? parseFloat(budgetAmount) : null,
        retainerHours: retainerHours ? parseFloat(retainerHours) : null,
        retainerPeriod: retainerPeriod || "MONTHLY",
        retainerRolloverHours: retainerRolloverHours ? parseFloat(retainerRolloverHours) : 0,
        retainerRolloverCap: retainerRolloverCap ? parseFloat(retainerRolloverCap) : 0,
        retainerHourlyRate: retainerHourlyRate ? parseFloat(retainerHourlyRate) : null,
        retainerOverageRate: retainerOverageRate ? parseFloat(retainerOverageRate) : null,
        retainerStartDate: currentMonthStart,
        retainerRenewalDate: nextMonthStart,
        onboardingStatus: "COMPLETED",
        kickoffChecklist: kickoffChecklist ? JSON.stringify(kickoffChecklist) : null,
      },
    });

    // 2. Create Workflow & Statuses based on Typology
    const workflow = await prisma.workflow.create({
      data: {
        name: `${project.name} Delivery Workflow`,
        projectId: project.id,
      },
    });

    if (type === "RETAINER") {
      const s1 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "Scheduled Queue", category: "TODO", color: "#64748b", order: 1 },
      });
      const s2 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "This Cycle", category: "TODO", color: "#3b82f6", order: 2 },
      });
      const s3 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "In Progress", category: "IN_PROGRESS", color: "#f59e0b", order: 3 },
      });
      const s4 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "Client Review", category: "IN_REVIEW", color: "#8b5cf6", order: 4 },
      });
      const s5 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "Completed & Billed", category: "DONE", color: "#10b981", order: 5 },
      });

      await prisma.workflowTransition.createMany({
        data: [
          { workflowId: workflow.id, name: "Activate in Cycle", fromStatusId: s1.id, toStatusId: s2.id },
          { workflowId: workflow.id, name: "Start Retainer Work", fromStatusId: s2.id, toStatusId: s3.id },
          { workflowId: workflow.id, name: "Submit for Review", fromStatusId: s3.id, toStatusId: s4.id },
          { workflowId: workflow.id, name: "Complete Work", fromStatusId: s4.id, toStatusId: s5.id },
          { workflowId: workflow.id, name: "Reopen", fromStatusId: s5.id, toStatusId: s2.id },
        ],
      });
    } else if (type === "SUPPORT_DESK") {
      const s1 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "Triage Queue", category: "TODO", color: "#6366f1", order: 1 },
      });
      const s2 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "Investigating", category: "IN_PROGRESS", color: "#f59e0b", order: 2 },
      });
      const s3 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "Waiting on Customer", category: "IN_PROGRESS", color: "#3b82f6", order: 3 },
      });
      const s4 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "Resolved", category: "DONE", color: "#10b981", order: 4 },
      });

      await prisma.workflowTransition.createMany({
        data: [
          { workflowId: workflow.id, name: "Start Investigation", fromStatusId: s1.id, toStatusId: s2.id },
          { workflowId: workflow.id, name: "Wait for Customer", fromStatusId: s2.id, toStatusId: s3.id },
          { workflowId: workflow.id, name: "Resolve Ticket", fromStatusId: s2.id, toStatusId: s4.id },
          { workflowId: workflow.id, name: "Reopen", fromStatusId: s4.id, toStatusId: s1.id },
        ],
      });
    } else {
      // Greenfield or Scrum
      const s1 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "Backlog", category: "TODO", color: "#64748b", order: 1 },
      });
      const s2 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "To Do", category: "TODO", color: "#3b82f6", order: 2 },
      });
      const s3 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "In Progress", category: "IN_PROGRESS", color: "#f59e0b", order: 3 },
      });
      const s4 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "Review", category: "IN_REVIEW", color: "#8b5cf6", order: 4 },
      });
      const s5 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "Done", category: "DONE", color: "#10b981", order: 5 },
      });

      await prisma.workflowTransition.createMany({
        data: [
          { workflowId: workflow.id, name: "Plan", fromStatusId: s1.id, toStatusId: s2.id },
          { workflowId: workflow.id, name: "Start Work", fromStatusId: s2.id, toStatusId: s3.id },
          { workflowId: workflow.id, name: "Code Review", fromStatusId: s3.id, toStatusId: s4.id },
          { workflowId: workflow.id, name: "Sign Off to Done", fromStatusId: s4.id, toStatusId: s5.id },
          { workflowId: workflow.id, name: "Reopen", fromStatusId: s5.id, toStatusId: s2.id },
        ],
      });
    }

    // 3. Create Initial Milestones if provided (Greenfield)
    if (Array.isArray(initialMilestones) && initialMilestones.length > 0) {
      for (let i = 0; i < initialMilestones.length; i++) {
        const m = initialMilestones[i];
        if (m.title?.trim()) {
          await prisma.milestone.create({
            data: {
              projectId: project.id,
              title: m.title.trim(),
              description: m.description || null,
              targetDate: m.targetDate ? new Date(m.targetDate) : new Date(now.getTime() + (i + 1) * 21 * 86400000),
              estimatedHours: m.estimatedHours ? parseFloat(m.estimatedHours) : null,
              loggedHours: 0,
              order: i + 1,
              status: "OPEN",
              progressPercent: 0,
            },
          });
        }
      }
    }

    // 4. Initial Health Check
    await prisma.projectHealthCheck.create({
      data: {
        projectId: project.id,
        status: "GREEN",
        scheduleHealth: "GREEN",
        budgetHealth: "GREEN",
        scopeHealth: "GREEN",
        clientSentiment: "EXCELLENT",
        summary: `Project ${project.name} successfully onboarded and initiated.`,
        nextSteps: "Conduct kickoff meeting and confirm initial task assignments.",
        authorId: leadId || (await prisma.user.findFirst())?.id || "",
      },
    });

    // 5. Initial Kickoff Issues if provided
    if (Array.isArray(initialIssues) && initialIssues.length > 0) {
      const firstStatus = await prisma.workflowStatus.findFirst({
        where: { workflowId: workflow.id },
        orderBy: { order: "asc" },
      });

      if (firstStatus) {
        for (let i = 0; i < initialIssues.length; i++) {
          const item = initialIssues[i];
          if (item.title?.trim()) {
            await prisma.issue.create({
              data: {
                key: `${project.key}-${i + 1}`,
                numId: i + 1,
                title: item.title.trim(),
                description: item.description || null,
                type: item.type || "TASK",
                priority: item.priority || "MEDIUM",
                category: item.category || (type === "RETAINER" ? "MAINTENANCE" : "FEATURE"),
                statusId: firstStatus.id,
                projectId: project.id,
                assigneeId: item.assigneeId || leadId || null,
                estimatedHours: item.estimatedHours ? parseFloat(item.estimatedHours) : 8,
              },
            });
          }
        }
      }
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: error.message || "Failed to create project" }, { status: 500 });
  }
}
