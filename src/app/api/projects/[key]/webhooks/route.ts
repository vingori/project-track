import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchProjectWebhooks } from "@/lib/webhooks";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { key: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { key: params.key.toUpperCase() },
      include: {
        webhooks: {
          include: {
            deliveries: {
              take: 5,
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project.webhooks);
  } catch (error) {
    console.error("Failed to fetch webhooks:", error);
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 });
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

    // Check if this is a test delivery trigger
    if (body.action === "test") {
      await dispatchProjectWebhooks(project.id, "TEST_PING", {
        message: "Test ping notification from Zenith Governance Hub",
        projectKey: project.key,
        triggeredAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, message: "Test payload dispatched." });
    }

    const { name, url, events, secret } = body;

    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        events: events || "ISSUE_CREATED,STATUS_CHANGED,SLA_BREACHED",
        secret: secret || null,
        active: true,
        projectId: project.id,
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error("Failed to create webhook:", error);
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
  }
}
