import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectKey = searchParams.get("projectKey");

    const projects = await prisma.project.findMany({
      where: projectKey && projectKey !== "ALL" ? { key: projectKey.toUpperCase() } : {},
      include: {
        milestones: {
          orderBy: { targetDate: "asc" },
        },
        healthChecks: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        issues: {
          include: {
            assignee: true,
            status: true,
            sprint: true,
            milestone: true,
            collaborators: {
              include: { user: true },
            },
            worklogs: {
              include: { user: true },
            },
          },
        },
        sprints: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemainingInMonth = Math.max(0, daysInMonth - now.getDate());

    const allIssues = projects.flatMap((p) => p.issues);
    const allWorklogs = allIssues.flatMap((i) => i.worklogs);

    // 1. Greenfield Milestone Portfolio Analytics
    const greenfieldProjects = projects.filter(
      (p) => p.type === "GREENFIELD_MILESTONE" || p.type === "HYBRID_MILESTONE"
    );

    const greenfieldSummary = greenfieldProjects.map((proj) => {
      const totalMilestones = proj.milestones.length;
      const reachedMilestones = proj.milestones.filter((m) => m.status === "REACHED").length;
      const overdueMilestones = proj.milestones.filter(
        (m) => m.status !== "REACHED" && new Date(m.targetDate) < now
      ).length;

      let estHours = proj.budgetHours || 0;
      let loggedHours = 0;
      proj.issues.forEach((i) => {
        i.worklogs.forEach((w) => {
          loggedHours += w.timeSpentHours;
        });
      });

      const totalIssues = proj.issues.length;
      const doneIssues = proj.issues.filter((i) => i.status.category === "DONE").length;
      const completionPercent = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0;

      return {
        id: proj.id,
        key: proj.key,
        name: proj.name,
        clientName: proj.clientName,
        ragStatus: proj.ragStatus,
        totalMilestones,
        reachedMilestones,
        overdueMilestones,
        completionPercent,
        budgetHours: estHours,
        loggedHours: Math.round(loggedHours * 10) / 10,
        milestones: proj.milestones,
      };
    });

    // 2. Retainer Portfolio Analytics
    const retainerProjects = projects.filter((p) => p.type === "RETAINER");
    const retainerSummary = retainerProjects.map((proj) => {
      const monthlyAllocated = (proj.retainerHours || 0) + (proj.retainerRolloverHours || 0);
      let monthLogged = 0;
      let totalLogged = 0;

      proj.issues.forEach((i) => {
        i.worklogs.forEach((w) => {
          totalLogged += w.timeSpentHours;
          if (new Date(w.dateWorked) >= startOfMonth && w.billable) {
            monthLogged += w.timeSpentHours;
          }
        });
      });

      const remainingHours = Math.max(0, monthlyAllocated - monthLogged);
      const isOverage = monthLogged > monthlyAllocated;
      const overageHours = isOverage ? monthLogged - monthlyAllocated : 0;
      const burnPercent = monthlyAllocated > 0 ? Math.round((monthLogged / monthlyAllocated) * 100) : 0;

      // Retainer burn rate risk
      const expectedBurnRate = (now.getDate() / daysInMonth) * 100;
      const isHighBurnRisk = burnPercent > expectedBurnRate + 25 && monthLogged > 15;

      return {
        id: proj.id,
        key: proj.key,
        name: proj.name,
        clientName: proj.clientName,
        ragStatus: proj.ragStatus,
        monthlyHours: proj.retainerHours || 0,
        rolloverHours: proj.retainerRolloverHours || 0,
        totalAvailable: monthlyAllocated,
        usedHours: Math.round(monthLogged * 10) / 10,
        remainingHours: Math.round(remainingHours * 10) / 10,
        burnPercent,
        isOverage,
        overageHours: Math.round(overageHours * 10) / 10,
        hourlyRate: proj.retainerHourlyRate || 180,
        overageRate: proj.retainerOverageRate || 220,
        daysRemainingInMonth,
        isHighBurnRisk,
      };
    });

    // 3. Contributor Workload & Hours
    const userWorkloadMap = new Map<string, {
      id: string;
      name: string;
      avatarUrl: string | null;
      role: string;
      points: number;
      tickets: number;
      hoursLogged: number;
      collaborativeTickets: number;
    }>();

    allIssues.forEach((issue) => {
      if (issue.assignee) {
        const existing = userWorkloadMap.get(issue.assignee.id) || {
          id: issue.assignee.id,
          name: issue.assignee.name,
          avatarUrl: issue.assignee.avatarUrl,
          role: issue.assignee.role,
          points: 0,
          tickets: 0,
          hoursLogged: 0,
          collaborativeTickets: 0,
        };
        existing.points += issue.storyPoints || 0;
        existing.tickets += 1;
        if (issue.collaborators.length > 0) {
          existing.collaborativeTickets += 1;
        }
        userWorkloadMap.set(issue.assignee.id, existing);
      }
    });

    allWorklogs.forEach((w) => {
      const existing = userWorkloadMap.get(w.userId);
      if (existing) {
        existing.hoursLogged += w.timeSpentHours;
      }
    });

    const contributorWorkload = Array.from(userWorkloadMap.values()).map((c) => ({
      ...c,
      hoursLogged: Math.round(c.hoursLogged * 10) / 10,
    }));

    // 4. Time Tracking & Category Breakdown
    let totalLoggedHours = 0;
    let billableLoggedHours = 0;
    const categoryHoursMap: Record<string, number> = {};

    allWorklogs.forEach((w) => {
      totalLoggedHours += w.timeSpentHours;
      if (w.billable) billableLoggedHours += w.timeSpentHours;
      const cat = w.category || "DEVELOPMENT";
      categoryHoursMap[cat] = (categoryHoursMap[cat] || 0) + w.timeSpentHours;
    });

    const timeByCategory = Object.entries(categoryHoursMap).map(([name, hours]) => ({
      name,
      hours: Math.round(hours * 10) / 10,
    }));

    // 5. Collaborative Tasks count
    const collaborativeIssuesCount = allIssues.filter((i) => i.collaborators.length > 0).length;

    // 6. SLA Metrics
    const supportIssues = allIssues.filter(
      (i) => i.type === "INCIDENT" || i.type === "SERVICE_REQUEST" || i.slaResolveTarget
    );
    const totalSlaTickets = supportIssues.length;
    const breachedSlaTickets = supportIssues.filter((i) => i.slaBreached).length;
    const compliantSlaTickets = totalSlaTickets - breachedSlaTickets;
    const slaComplianceRate = totalSlaTickets > 0
      ? Math.round((compliantSlaTickets / totalSlaTickets) * 100)
      : 100;

    // 7. Burndown & Velocity for Scrum/Agile
    const activeSprint = projects
      .flatMap((p) => p.sprints)
      .find((s) => s.status === "ACTIVE");

    const burndownDays = [
      { day: "Day 1", ideal: 40, actual: 40 },
      { day: "Day 2", ideal: 36, actual: 39 },
      { day: "Day 3", ideal: 32, actual: 35 },
      { day: "Day 4", ideal: 28, actual: 32 },
      { day: "Day 5", ideal: 24, actual: 29 },
      { day: "Day 6", ideal: 20, actual: 26 },
      { day: "Day 7", ideal: 16, actual: null },
      { day: "Day 8", ideal: 12, actual: null },
      { day: "Day 9", ideal: 8, actual: null },
      { day: "Day 10", ideal: 0, actual: null },
    ];

    const velocityData = [
      { sprint: "Sprint 19", committed: 32, completed: 30 },
      { sprint: "Sprint 20", committed: 36, completed: 34 },
      { sprint: "Sprint 21", committed: 38, completed: 34 },
      { sprint: "Sprint 22 (Current)", committed: 40, completed: 14 },
    ];

    return NextResponse.json({
      greenfieldSummary,
      retainerSummary,
      contributorWorkload,
      timeTracking: {
        totalLoggedHours: Math.round(totalLoggedHours * 10) / 10,
        billableLoggedHours: Math.round(billableLoggedHours * 10) / 10,
        billablePercent: totalLoggedHours > 0 ? Math.round((billableLoggedHours / totalLoggedHours) * 100) : 0,
        timeByCategory,
      },
      collaborativeIssuesCount,
      sla: {
        totalTickets: totalSlaTickets,
        breached: breachedSlaTickets,
        compliant: compliantSlaTickets,
        complianceRate: slaComplianceRate,
        avgFirstResponseMins: 18,
        avgResolutionHours: 3.4,
      },
      burndown: burndownDays,
      velocity: velocityData,
      totalProjectsCount: projects.length,
      totalIssuesCount: allIssues.length,
      activeSprint: activeSprint ? { name: activeSprint.name, goal: activeSprint.goal } : null,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
