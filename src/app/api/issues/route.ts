import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitAppEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectKey = searchParams.get("projectKey");
    const sprintId = searchParams.get("sprintId");
    const milestoneId = searchParams.get("milestoneId");
    const statusId = searchParams.get("statusId");
    const type = searchParams.get("type");
    const category = searchParams.get("category");
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
    if (milestoneId === "none") {
      where.milestoneId = null;
    } else if (milestoneId) {
      where.milestoneId = milestoneId;
    }
    if (statusId) {
      where.statusId = statusId;
    }
    if (type) {
      where.type = type;
    }
    if (category) {
      where.category = category;
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
        milestone: {
          select: { id: true, title: true, status: true, progressPercent: true, targetDate: true },
        },
        collaborators: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
          },
        },
        sprint: {
          select: { id: true, name: true, status: true },
        },
        epic: {
          select: { id: true, key: true, title: true },
        },
        parent: {
          select: { id: true, key: true, title: true, type: true },
        },
        subTasks: {
          select: {
            id: true,
            key: true,
            title: true,
            estimatedHours: true,
            loggedHours: true,
            status: { select: { id: true, name: true, category: true, color: true } },
            assignee: { select: { id: true, name: true, avatarUrl: true } },
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
        worklogs: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { dateWorked: "desc" },
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
      projectKey,
      title,
      description,
      type,
      priority,
      statusId,
      sprintId,
      milestoneId,
      assigneeId,
      reporterId,
      storyPoints,
      estimatedHours,
      category,
      collaboratorIds,
      parentId,
      epicId,
    } = body;

    if (!title || !projectKey) {
      return NextResponse.json({ error: "Title and projectKey are required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { key: projectKey.toUpperCase() },
      include: {
        workflow: {
          include: { statuses: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Determine Status
    let targetStatusId = statusId;
    if (!targetStatusId) {
      const defaultStatus = project.workflow?.statuses[0];
      if (!defaultStatus) {
        return NextResponse.json({ error: "No workflow status found for this project" }, { status: 400 });
      }
      targetStatusId = defaultStatus.id;
    }

    // Determine next Issue Key
    const lastIssue = await prisma.issue.findFirst({
      where: { projectId: project.id },
      orderBy: { numId: "desc" },
    });
    const nextNumId = (lastIssue?.numId || 0) + 1;
    const issueKey = `${project.key}-${nextNumId}`;

    const newIssue = await prisma.issue.create({
      data: {
        key: issueKey,
        numId: nextNumId,
        title: title.trim(),
        description: description?.trim() || null,
        type: type || "TASK",
        category: category || (project.type === "RETAINER" ? "MAINTENANCE" : "FEATURE"),
        priority: priority || "MEDIUM",
        statusId: targetStatusId,
        projectId: project.id,
        sprintId: sprintId || null,
        milestoneId: milestoneId || null,
        assigneeId: assigneeId || null,
        reporterId: reporterId || null,
        storyPoints: storyPoints !== undefined ? parseInt(storyPoints) : null,
        estimatedHours: estimatedHours !== undefined ? parseFloat(estimatedHours) : null,
        parentId: parentId || null,
        epicId: epicId || null,
      },
      include: {
        status: true,
        assignee: true,
        reporter: true,
        milestone: true,
        project: true,
      },
    });

    // Add Collaborators if provided
    if (Array.isArray(collaboratorIds) && collaboratorIds.length > 0) {
      for (const cUserId of collaboratorIds) {
        if (cUserId) {
          await prisma.issueCollaborator.create({
            data: {
              issueId: newIssue.id,
              userId: cUserId,
              role: "COLLABORATOR",
            },
          }).catch(() => {});
        }
      }
    }

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        issueId: newIssue.id,
        userId: reporterId || assigneeId || null,
        field: "created",
        oldValue: null,
        newValue: `${newIssue.type} created: ${newIssue.title}`,
      },
    });

    emitAppEvent({
      type: "ISSUE_CREATED",
      issueId: newIssue.id,
      projectId: project.id,
      data: newIssue,
    });

    return NextResponse.json(newIssue, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create issue:", error);
    return NextResponse.json({ error: error.message || "Failed to create issue" }, { status: 500 });
  }
}
