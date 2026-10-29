import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        lead: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
        workflow: {
          include: {
            statuses: {
              orderBy: { order: "asc" },
            },
            transitions: {
              include: {
                toStatus: {
                  select: { id: true, name: true, category: true, color: true },
                },
              },
            },
          },
        },
        sprints: {
          orderBy: { createdAt: "desc" },
        },
        slaPolicies: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}
