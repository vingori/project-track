import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectKey = searchParams.get("projectKey");

    const projects = await prisma.project.findMany({
      where: projectKey ? { key: projectKey.toUpperCase() } : {},
      include: {
        issues: {
          include: {
            assignee: true,
            status: true,
            sprint: true,
          },
        },
        sprints: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const allIssues = projects.flatMap((p) => p.issues);

    // 1. Burndown Data for active sprint
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

    // 2. Velocity History
    const velocityData = [
      { sprint: "Sprint 19", committed: 32, completed: 30 },
      { sprint: "Sprint 20", committed: 36, completed: 34 },
      { sprint: "Sprint 21", committed: 38, completed: 34 },
      { sprint: "Sprint 22 (Current)", committed: 40, completed: 14 },
    ];

    // 3. Contributor Workload
    const userWorkloadMap = new Map<string, { name: string; avatarUrl: string | null; role: string; points: number; tickets: number }>();
    allIssues.forEach((issue) => {
      if (issue.assignee) {
        const existing = userWorkloadMap.get(issue.assignee.id) || {
          name: issue.assignee.name,
          avatarUrl: issue.assignee.avatarUrl,
          role: issue.assignee.role,
          points: 0,
          tickets: 0,
        };
        existing.points += issue.storyPoints || 0;
        existing.tickets += 1;
        userWorkloadMap.set(issue.assignee.id, existing);
      }
    });

    const contributorWorkload = Array.from(userWorkloadMap.values());

    // 4. SLA Metrics (Support & Incidents)
    const supportIssues = allIssues.filter(
      (i) => i.type === "INCIDENT" || i.type === "SERVICE_REQUEST" || i.slaResolveTarget
    );
    const totalSlaTickets = supportIssues.length;
    const breachedSlaTickets = supportIssues.filter((i) => i.slaBreached).length;
    const compliantSlaTickets = totalSlaTickets - breachedSlaTickets;
    const slaComplianceRate = totalSlaTickets > 0
      ? Math.round((compliantSlaTickets / totalSlaTickets) * 100)
      : 100;

    // 5. Issue Type Distribution
    const typeDistribution = [
      { name: "Stories", value: allIssues.filter((i) => i.type === "STORY").length, color: "#3b82f6" },
      { name: "Bugs", value: allIssues.filter((i) => i.type === "BUG").length, color: "#ef4444" },
      { name: "Tasks", value: allIssues.filter((i) => i.type === "TASK").length, color: "#10b981" },
      { name: "Epics", value: allIssues.filter((i) => i.type === "EPIC").length, color: "#8b5cf6" },
      { name: "Incidents", value: allIssues.filter((i) => i.type === "INCIDENT").length, color: "#f97316" },
      { name: "Service Reqs", value: allIssues.filter((i) => i.type === "SERVICE_REQUEST").length, color: "#06b6d4" },
    ].filter((item) => item.value > 0);

    return NextResponse.json({
      burndown: burndownDays,
      velocity: velocityData,
      contributorWorkload,
      sla: {
        totalTickets: totalSlaTickets,
        breached: breachedSlaTickets,
        compliant: compliantSlaTickets,
        complianceRate: slaComplianceRate,
        avgFirstResponseMins: 18,
        avgResolutionHours: 3.4,
      },
      typeDistribution,
      totalIssuesCount: allIssues.length,
      activeSprint: activeSprint ? { name: activeSprint.name, goal: activeSprint.goal } : null,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
