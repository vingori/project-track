import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { key: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";
    const projectKey = params.key.toUpperCase();

    const project = await prisma.project.findUnique({
      where: { key: projectKey },
      include: {
        issues: {
          include: {
            status: true,
            assignee: true,
            reporter: true,
            sprint: true,
          },
          orderBy: { numId: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (format === "json") {
      const jsonContent = JSON.stringify(project.issues, null, 2);
      return new Response(jsonContent, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${projectKey}-export-${Date.now()}.json"`,
        },
      });
    }

    // Generate CSV
    const headers = [
      "Key",
      "Title",
      "Type",
      "Status",
      "Priority",
      "Assignee",
      "StoryPoints",
      "EstimatedHours",
      "LoggedHours",
      "DueDate",
      "CustomerEmail",
      "CreatedAt",
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = project.issues.map((issue) => [
      escapeCsv(issue.key),
      escapeCsv(issue.title),
      escapeCsv(issue.type),
      escapeCsv(issue.status.name),
      escapeCsv(issue.priority),
      escapeCsv(issue.assignee?.name || "Unassigned"),
      escapeCsv(issue.storyPoints ?? ""),
      escapeCsv(issue.estimatedHours ?? ""),
      escapeCsv(issue.loggedHours ?? "0"),
      escapeCsv(issue.dueDate ? issue.dueDate.toISOString().slice(0, 10) : ""),
      escapeCsv(issue.customerEmail || ""),
      escapeCsv(issue.createdAt.toISOString().slice(0, 10)),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${projectKey}-issues-export-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ error: "Failed to export project issues" }, { status: 500 });
  }
}
