import { eventBus, AppEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));

      const onEvent = (event: AppEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`event: message\ndata: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // Stream might be closed by client
        }
      };

      eventBus.on("app-event", onEvent);

      // Periodic keep-alive ping every 15 seconds
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));
        } catch {
          clearInterval(interval);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        eventBus.off("app-event", onEvent);
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
