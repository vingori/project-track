import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { emitAppEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const issueId = formData.get("issueId") as string | null;

    if (!file || !issueId) {
      return NextResponse.json(
        { error: "File and issueId are required." },
        { status: 400 }
      );
    }

    // Validate issue exists
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename and create unique storage name
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${timestamp}-${sanitizedName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, uniqueFileName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFileName}`;

    // Create database attachment record
    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        issueId: issue.id,
      },
    });

    // Write audit log entry
    await prisma.auditLog.create({
      data: {
        issueId: issue.id,
        field: "attachment",
        oldValue: null,
        newValue: `Uploaded file ${file.name} (${Math.round(file.size / 1024)} KB)`,
      },
    });

    // Real-time synchronization
    emitAppEvent({
      type: "ISSUE_UPDATED",
      issueId: issue.id,
      field: "attachment",
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("Failed to upload attachment:", error);
    return NextResponse.json({ error: "Failed to upload file." }, { status: 500 });
  }
}
