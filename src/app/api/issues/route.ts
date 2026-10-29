import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitAppEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectKey = searchParams.get("projectKey");
    const sprintId = searchParams.get("sprintId");
    const statusId = searchParams.get("statusId");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: any = {};

    if (projectKey) {
      where.project = { key: projectKey.toUpperCase() };
    }
    if (sprintId === "none") {
      where.sprintId = null;
    } else if (sprintId) {
      where.sprintId = sprintId;
    }
    if (statusId) {
      where.statusId = statusId;
    }
    if (type) {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { key: { contains: search.toUpperCase() } },
        { description: { contains: search } },
      ];
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
        status: {
          include: {
            fromTrans: {
              include: {
                toStatus: {
                  select: { id: true, name: true, category: true, color: true },
                },
              },
            },
          },
        },
        assignee: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
        reporter: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
        sprint: {
          select: { id: true, name: true, status: true },
        },
        epic: {
          select: { id: true, key: true, title: true },
        },
        parent: {
          select: { id: true, key: true, title: true },
        },
        subTasks: {
          select: {
            id: true,
            key: true,
            title: true,
            estimatedHours: true,
            loggedHours: true,
            status: { select: { id: true, name: true, category: true, color: true } },
          },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, avatarUrl: true, role: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        auditLogs: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { numId: "desc" },
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error("Failed to fetch issues:", error);
    return NextResponse.json({ error: "Failed to fetch issues" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      projectId,
      title,
      description,
      type,
      priority,
      statusId,
      sprintId,
      epicId,
      parentId,
      assigneeId,
      reporterId,
      storyPoints,
      estimatedHours,
      dueDate,
      customerEmail,
    } = body;

    let targetProjectId = projectId;
    let targetSprintId = sprintId;

    if (parentId && !targetProjectId) {
      const parent = await prisma.issue.findUnique({ where: { id: parentId } });
      if (parent) {
        targetProjectId = parent.projectId;
        targetSprintId = parent.sprintId;
      }
    }

    const project = await prisma.project.findUnique({
      where: { id: targetProjectId },
      include: {
        workflow: {
          include: { statuses: { orderBy: { order: "asc" } } },
        },
        slaPolicies: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Default status if not provided: first status in workflow
    const targetStatusId = statusId || project.workflow?.statuses[0]?.id;
    if (!targetStatusId) {
      return NextResponse.json({ error: "No status found for project workflow" }, { status: 400 });
    }

    // Get next issue number
    const lastIssue = await prisma.issue.findFirst({
      where: { projectId: project.id },
      orderBy: { numId: "desc" },
    });
    const nextNum = (lastIssue?.numId || 0) + 1;
    const issueKey = `${project.key}-${nextNum}`;

    // Calculate SLA deadlines if applicable
    let slaFirstRespTarget: Date | null = null;
    let slaResolveTarget: Date | null = null;

    const effectivePriority = priority || "MEDIUM";
    const slaPolicy = project.slaPolicies.find((p) => p.priority === effectivePriority);
    const now = new Date();

    if (slaPolicy) {
      slaFirstRespTarget = new Date(now.getTime() + slaPolicy.firstResponseMins * 60000);
      slaResolveTarget = new Date(now.getTime() + slaPolicy.resolutionMins * 60000);
    }

    let defaultReporter: string | null = null;
    if (reporterId) {
      const u = await prisma.user.findUnique({ where: { id: reporterId }, select: { id: true } });
      if (u) defaultReporter = u.id;
    }
    if (!defaultReporter) {
      const firstUser = await prisma.user.findFirst({ select: { id: true } });
      defaultReporter = firstUser?.id || null;
    }

    const issue = await prisma.issue.create({
      data: {
        key: issueKey,
        numId: nextNum,
        title,
        description,
        type: type || (parentId ? "SUB_TASK" : "TASK"),
        priority: effectivePriority,
        statusId: targetStatusId,
        projectId: project.id,
        sprintId: targetSprintId || null,
        epicId: epicId || null,
        parentId: parentId || null,
        assigneeId: assigneeId || null,
        reporterId: defaultReporter,
        storyPoints: storyPoints ? parseInt(storyPoints, 10) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        customerEmail: customerEmail || null,
        slaFirstRespTarget,
        slaResolveTarget,
      },
      include: {
        status: true,
        assignee: true,
        reporter: true,
        epic: true,
        parent: true,
      },
    });

    // Write initial audit log
    await prisma.auditLog.create({
      data: {
        issueId: issue.id,
        userId: defaultReporter,
        field: "created",
        oldValue: null,
        newValue: `${issue.type} created with status ${issue.status.name}`,
      },
    });

    // Emit real-time synchronization event
    emitAppEvent({
      type: "ISSUE_CREATED",
      issueId: issue.id,
      projectKey: project.key,
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error("Failed to create issue:", error);
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 });
  }
}
