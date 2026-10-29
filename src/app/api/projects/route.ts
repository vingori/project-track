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
            status: { select: { category: true } },
            slaBreached: true,
            storyPoints: true,
          },
        },
        sprints: {
          where: { status: "ACTIVE" },
          select: { id: true, name: true, endDate: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = projects.map((proj) => {
      const totalIssues = proj.issues.length;
      const doneIssues = proj.issues.filter(
        (i) => i.status.category === "DONE"
      ).length;
      const breachedCount = proj.issues.filter((i) => i.slaBreached).length;
      const totalPoints = proj.issues.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);

      return {
        id: proj.id,
        key: proj.key,
        name: proj.name,
        description: proj.description,
        type: proj.type,
        ragStatus: proj.ragStatus,
        lead: proj.lead,
        activeSprint: proj.sprints[0] || null,
        stats: {
          totalIssues,
          doneIssues,
          progressPercent: totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0,
          breachedCount,
          totalPoints,
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
    const { key, name, description, type, leadId, ragStatus } = body;

    const workspace = await prisma.workspace.findFirst();
    if (!workspace) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        key: key.toUpperCase().trim(),
        name,
        description,
        type: type || "SOFTWARE_SCRUM",
        ragStatus: ragStatus || "GREEN",
        leadId,
        workspaceId: workspace.id,
      },
    });

    // Create default workflow
    const workflow = await prisma.workflow.create({
      data: {
        name: `${project.name} Workflow`,
        projectId: project.id,
      },
    });

    const isSupport = project.type === "SUPPORT_DESK";

    if (isSupport) {
      const s1 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "Triage Queue", category: "TODO", color: "#6366f1", order: 1 },
      });
      const s2 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "Investigating", category: "IN_PROGRESS", color: "#f59e0b", order: 2 },
      });
      const s3 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "Resolved", category: "DONE", color: "#10b981", order: 3 },
      });

      await prisma.workflowTransition.createMany({
        data: [
          { workflowId: workflow.id, name: "Start Investigation", fromStatusId: s1.id, toStatusId: s2.id },
          { workflowId: workflow.id, name: "Resolve Ticket", fromStatusId: s2.id, toStatusId: s3.id },
          { workflowId: workflow.id, name: "Reopen", fromStatusId: s3.id, toStatusId: s1.id },
        ],
      });
    } else {
      const s1 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "Backlog", category: "TODO", color: "#64748b", order: 1 },
      });
      const s2 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "In Progress", category: "IN_PROGRESS", color: "#3b82f6", order: 2 },
      });
      const s3 = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: "Done", category: "DONE", color: "#10b981", order: 3 },
      });

      await prisma.workflowTransition.createMany({
        data: [
          { workflowId: workflow.id, name: "Start Work", fromStatusId: s1.id, toStatusId: s2.id },
          { workflowId: workflow.id, name: "Complete Work", fromStatusId: s2.id, toStatusId: s3.id },
          { workflowId: workflow.id, name: "Reopen", fromStatusId: s3.id, toStatusId: s1.id },
        ],
      });
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
