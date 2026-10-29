import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitAppEvent } from "@/lib/events";
import { dispatchProjectWebhooks } from "@/lib/webhooks";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
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
        assignee: true,
        reporter: true,
        project: {
          include: {
            workflow: {
              include: {
                statuses: { orderBy: { order: "asc" } },
                transitions: {
                  include: {
                    toStatus: true,
                  },
                },
              },
            },
          },
        },
        sprint: true,
        epic: {
          select: { id: true, key: true, title: true },
        },
        parent: {
          select: { id: true, key: true, title: true, type: true },
        },
        childIssues: {
          include: {
            status: { select: { id: true, name: true, category: true, color: true } },
            assignee: { select: { id: true, name: true, avatarUrl: true } },
            subTasks: {
              select: { id: true, estimatedHours: true, loggedHours: true, status: true },
            },
          },
          orderBy: { numId: "asc" },
        },
        subTasks: {
          include: {
            status: { select: { id: true, name: true, category: true, color: true } },
            assignee: { select: { id: true, name: true, avatarUrl: true, role: true } },
            worklogs: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true, role: true } },
              },
            },
          },
          orderBy: { numId: "asc" },
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
        worklogs: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, role: true } },
          },
          orderBy: { dateWorked: "desc" },
        },
        gitCommits: {
          orderBy: { createdAt: "desc" },
        },
        gitPullRequests: {
          orderBy: { createdAt: "desc" },
        },
        customFieldValues: {
          include: { customField: true },
        },
        auditLogs: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Failed to fetch issue:", error);
    return NextResponse.json({ error: "Failed to fetch issue" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { statusId, assigneeId, priority, storyPoints, estimatedHours, sprintId, title, description, userRole, epicId, parentId } = body;

    const session = await getServerSession(authOptions);
    const effectiveRole = session?.user?.role || userRole || "ADMIN";
    
    // Ensure audit log userId is a valid User foreign key
    let validUserId: string | null = null;
    if (session?.user?.id) {
      const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
      if (u) validUserId = u.id;
    }
    if (!validUserId) {
      const firstUser = await prisma.user.findFirst({ select: { id: true } });
      validUserId = firstUser?.id || null;
    }

    const existingIssue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: {
        status: true,
        project: {
          include: {
            workflow: {
              include: { transitions: true, statuses: true },
            },
          },
        },
      },
    });

    if (!existingIssue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const updates: any = {};
    const auditEntries: Array<{ field: string; oldValue: string | null; newValue: string | null }> = [];

    // State machine transition validation
    if (statusId && statusId !== existingIssue.statusId) {
      const allowedTransitions = existingIssue.project.workflow?.transitions.filter(
        (t) => t.fromStatusId === existingIssue.statusId
      ) || [];

      const targetTransition = allowedTransitions.find((t) => t.toStatusId === statusId);

      // Check if direct transition exists or if caller is ADMIN/overriding
      if (!targetTransition && effectiveRole !== "ADMIN") {
        return NextResponse.json(
          {
            error: `Invalid workflow transition from "${existingIssue.status.name}". Allowed transitions are restricted by project governance rules.`,
          },
          { status: 400 }
        );
      }

      // Check role constraint if transition has requiredRole
      if (
        targetTransition &&
        targetTransition.requiredRole &&
        effectiveRole &&
        effectiveRole !== targetTransition.requiredRole &&
        effectiveRole !== "ADMIN"
      ) {
        return NextResponse.json(
          {
            error: `Permission Denied: Transition "${targetTransition.name}" requires role "${targetTransition.requiredRole}". Current user is "${effectiveRole}".`,
          },
          { status: 403 }
        );
      }

      const newStatus = existingIssue.project.workflow?.statuses.find((s) => s.id === statusId);
      updates.statusId = statusId;
      auditEntries.push({
        field: "status",
        oldValue: existingIssue.status.name,
        newValue: newStatus ? newStatus.name : statusId,
      });

      // If transition to DONE / Resolved category
      if (newStatus?.category === "DONE") {
        const now = new Date();
        updates.slaResolveAt = now;
        if (existingIssue.slaResolveTarget && now > existingIssue.slaResolveTarget) {
          updates.slaBreached = true;
        }
      }
    }

    if (assigneeId !== undefined && assigneeId !== existingIssue.assigneeId) {
      updates.assigneeId = assigneeId || null;
      auditEntries.push({
        field: "assignee",
        oldValue: existingIssue.assigneeId,
        newValue: assigneeId || "Unassigned",
      });
    }

    if (priority && priority !== existingIssue.priority) {
      updates.priority = priority;
      auditEntries.push({
        field: "priority",
        oldValue: existingIssue.priority,
        newValue: priority,
      });
    }

    if (storyPoints !== undefined && storyPoints !== existingIssue.storyPoints) {
      updates.storyPoints = storyPoints ? parseInt(storyPoints, 10) : null;
      auditEntries.push({
        field: "storyPoints",
        oldValue: existingIssue.storyPoints?.toString() || null,
        newValue: storyPoints?.toString() || null,
      });
    }

    if (estimatedHours !== undefined && estimatedHours !== existingIssue.estimatedHours) {
      updates.estimatedHours = estimatedHours !== null && estimatedHours !== "" ? parseFloat(estimatedHours) : null;
      auditEntries.push({
        field: "estimatedHours",
        oldValue: existingIssue.estimatedHours?.toString() || null,
        newValue: estimatedHours?.toString() || null,
      });
    }

    if (sprintId !== undefined && sprintId !== existingIssue.sprintId) {
      updates.sprintId = sprintId || null;
      auditEntries.push({
        field: "sprint",
        oldValue: existingIssue.sprintId,
        newValue: sprintId || "Backlog",
      });
    }

    if (title && title !== existingIssue.title) {
      updates.title = title;
      auditEntries.push({ field: "title", oldValue: existingIssue.title, newValue: title });
    }

    if (description !== undefined && description !== existingIssue.description) {
      updates.description = description;
      auditEntries.push({ field: "description", oldValue: "Updated", newValue: "Updated" });
    }

    if (epicId !== undefined && epicId !== existingIssue.epicId) {
      updates.epicId = epicId || null;
      auditEntries.push({ field: "epic", oldValue: existingIssue.epicId, newValue: epicId || "None" });
    }

    if (parentId !== undefined && parentId !== existingIssue.parentId) {
      updates.parentId = parentId || null;
      auditEntries.push({ field: "parent", oldValue: existingIssue.parentId, newValue: parentId || "None" });
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: params.id },
      data: updates,
      include: {
        status: {
          include: {
            fromTrans: {
              include: {
                toStatus: { select: { id: true, name: true, category: true, color: true } },
              },
            },
          },
        },
        assignee: true,
        reporter: true,
        epic: { select: { id: true, key: true, title: true } },
        parent: { select: { id: true, key: true, title: true } },
      },
    });

    // Update dynamic custom field values if provided
    if (body.customFieldValues && typeof body.customFieldValues === "object") {
      for (const [cfId, val] of Object.entries(body.customFieldValues)) {
        await prisma.customFieldValue.upsert({
          where: {
            customFieldId_issueId: {
              customFieldId: cfId,
              issueId: params.id,
            },
          },
          update: { value: val !== null && val !== undefined ? String(val) : null },
          create: {
            customFieldId: cfId,
            issueId: params.id,
            value: val !== null && val !== undefined ? String(val) : null,
          },
        });
      }
    }

    // Write audit logs
    for (const entry of auditEntries) {
      await prisma.auditLog.create({
        data: {
          issueId: updatedIssue.id,
          userId: validUserId,
          field: entry.field,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
        },
      });
    }

    // Dispatch automation webhook notifications
    if (statusId && statusId !== existingIssue.statusId) {
      dispatchProjectWebhooks(existingIssue.projectId, "STATUS_CHANGED", {
        issueKey: updatedIssue.key,
        oldStatus: existingIssue.status.name,
        newStatus: updatedIssue.status.name,
        priority: updatedIssue.priority,
        assignee: updatedIssue.assignee?.name,
      });
    }

    // Emit real-time live synchronization event
    emitAppEvent({
      type: "ISSUE_UPDATED",
      issueId: updatedIssue.id,
      projectKey: existingIssue.project.key,
      field: auditEntries.map((e) => e.field).join(","),
    });

    return NextResponse.json(updatedIssue);
  } catch (error) {
    console.error("Failed to update issue:", error);
    return NextResponse.json({ error: "Failed to update issue" }, { status: 500 });
  }
}

// Add comment to issue
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { body: commentText, isInternal, authorId } = body;

    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: { project: true },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const user =
      (authorId ? await prisma.user.findUnique({ where: { id: authorId } }) : null) ||
      (await prisma.user.findFirst());

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        issueId: issue.id,
        authorId: user.id,
        body: commentText,
        isInternal: Boolean(isInternal),
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });

    // If support issue and this is first response, record slaFirstRespAt
    if (issue.slaFirstRespTarget && !issue.slaFirstRespAt) {
      const now = new Date();
      await prisma.issue.update({
        where: { id: issue.id },
        data: {
          slaFirstRespAt: now,
          slaBreached: now > issue.slaFirstRespTarget ? true : issue.slaBreached,
        },
      });
    }

    emitAppEvent({
      type: "COMMENT_ADDED",
      issueId: issue.id,
      commentId: comment.id,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Failed to add comment:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
