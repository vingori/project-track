import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitAppEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { key: string } }
) {
  try {
    const projectKey = params.key.toUpperCase();
    const project = await prisma.project.findUnique({
      where: { key: projectKey },
      include: {
        workflow: {
          include: { statuses: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!project || !project.workflow?.statuses.length) {
      return NextResponse.json({ error: "Project or workflow not found" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") || "";
    let itemsToImport: Array<{
      title: string;
      description?: string;
      type?: string;
      priority?: string;
      storyPoints?: number;
      estimatedHours?: number;
    }> = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        return NextResponse.json({ error: "CSV file must contain a header and at least one row." }, { status: 400 });
      }

      // Simple CSV row parser handling quoted strings
      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            result.push(cur.trim());
            cur = "";
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
      const titleIdx = header.findIndex((h) => h.includes("title") || h.includes("summary"));
      const typeIdx = header.findIndex((h) => h.includes("type"));
      const priorityIdx = header.findIndex((h) => h.includes("priority"));
      const pointsIdx = header.findIndex((h) => h.includes("point") || h.includes("story"));
      const estIdx = header.findIndex((h) => h.includes("estimat"));

      for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i]);
        const title = row[titleIdx >= 0 ? titleIdx : 1] || row[0];
        if (!title) continue;

        const type = (row[typeIdx] || "TASK").toUpperCase();
        const priority = (row[priorityIdx] || "MEDIUM").toUpperCase();
        const storyPoints = pointsIdx >= 0 && row[pointsIdx] ? parseInt(row[pointsIdx], 10) : undefined;
        const estimatedHours = estIdx >= 0 && row[estIdx] ? parseFloat(row[estIdx]) : undefined;

        itemsToImport.push({
          title,
          type: ["STORY", "TASK", "BUG", "EPIC", "INCIDENT", "SERVICE_REQUEST"].includes(type) ? type : "TASK",
          priority: ["LOW", "MEDIUM", "HIGH", "CRITICAL", "BLOCKER"].includes(priority) ? priority : "MEDIUM",
          storyPoints: isNaN(storyPoints as any) ? undefined : storyPoints,
          estimatedHours: isNaN(estimatedHours as any) ? undefined : estimatedHours,
        });
      }
    } else {
      const body = await req.json();
      if (Array.isArray(body)) {
        itemsToImport = body;
      } else if (Array.isArray(body.items)) {
        itemsToImport = body.items;
      }
    }

    if (itemsToImport.length === 0) {
      return NextResponse.json({ error: "No valid issues found to import." }, { status: 400 });
    }

    const defaultStatusId = project.workflow.statuses[0].id;
    const defaultUser = await prisma.user.findFirst();

    // Get latest issue number for project
    const lastIssue = await prisma.issue.findFirst({
      where: { projectId: project.id },
      orderBy: { numId: "desc" },
    });
    let currentNum = lastIssue?.numId || 0;

    const createdIssues: any[] = [];
    for (const item of itemsToImport) {
      currentNum++;
      const issueKey = `${project.key}-${currentNum}`;

      const issue = await prisma.issue.create({
        data: {
          key: issueKey,
          numId: currentNum,
          title: item.title,
          description: item.description || null,
          type: item.type || "TASK",
          priority: item.priority || "MEDIUM",
          statusId: defaultStatusId,
          projectId: project.id,
          reporterId: defaultUser?.id,
          storyPoints: item.storyPoints || null,
          estimatedHours: item.estimatedHours || null,
        },
      });

      createdIssues.push(issue.key);
    }

    emitAppEvent({
      type: "ISSUE_CREATED",
      issueId: createdIssues[0],
      projectKey: project.key,
    });

    return NextResponse.json({
      success: true,
      count: createdIssues.length,
      keys: createdIssues,
      message: `Successfully imported ${createdIssues.length} issues into project [${project.key}].`,
    });
  } catch (error) {
    console.error("Import failed:", error);
    return NextResponse.json({ error: "Failed to import issues" }, { status: 500 });
  }
}
