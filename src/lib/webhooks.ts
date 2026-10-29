import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function dispatchProjectWebhooks(
  projectId: string,
  event: string,
  payload: Record<string, any>
) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        projectId,
        active: true,
      },
    });

    const bodyString = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    for (const webhook of webhooks) {
      // Check if webhook is listening to this event
      const listenedEvents = webhook.events.split(",").map((e) => e.trim());
      if (!listenedEvents.includes(event) && !listenedEvents.includes("*")) {
        continue;
      }

      // Generate HMAC signature if secret configured
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Zenith-Event": event,
        "User-Agent": "Zenith-Governance-Webhook/1.0",
      };

      if (webhook.secret) {
        const hmac = crypto
          .createHmac("sha256", webhook.secret)
          .update(bodyString)
          .digest("hex");
        headers["X-Zenith-Signature"] = `sha256=${hmac}`;
      }

      const start = Date.now();
      let statusCode = 0;
      let responseBody = "";

      try {
        const res = await fetch(webhook.url, {
          method: "POST",
          headers,
          body: bodyString,
        });
        statusCode = res.status;
        responseBody = (await res.text()).slice(0, 500);
      } catch (err: any) {
        statusCode = 500;
        responseBody = err?.message || "Delivery connection failed";
      }

      const durationMs = Date.now() - start;

      // Log delivery attempt
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          statusCode,
          responseBody,
          durationMs,
        },
      });
    }
  } catch (error) {
    console.error("Failed to dispatch webhooks:", error);
  }
}
