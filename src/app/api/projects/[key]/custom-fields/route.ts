import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { key: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { key: params.key.toUpperCase() },
      include: {
        customFields: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project.customFields);
  } catch (error) {
    console.error("Failed to fetch custom fields:", error);
    return NextResponse.json({ error: "Failed to fetch custom fields" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { key: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { key: params.key.toUpperCase() },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, key, fieldType, optionsJson, required } = body;

    const formattedKey = (key || name).toLowerCase().replace(/[^a-z0-9_]/g, "_");

    const customField = await prisma.customField.create({
      data: {
        name,
        key: formattedKey,
        fieldType: fieldType || "TEXT",
        optionsJson: optionsJson || null,
        required: Boolean(required),
        projectId: project.id,
      },
    });

    return NextResponse.json(customField, { status: 201 });
  } catch (error) {
    console.error("Failed to create custom field:", error);
    return NextResponse.json({ error: "Failed to create custom field" }, { status: 500 });
  }
}
