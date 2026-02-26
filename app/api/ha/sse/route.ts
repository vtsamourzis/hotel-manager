/**
 * SSE endpoint: GET /api/ha/sse
 *
 * Streams Home Assistant entity updates to the browser.
 * - Sends a full entity snapshot immediately on connect
 * - Streams entity deltas as they arrive from the HA WebSocket
 * - Cleans up on browser disconnect
 *
 * Security: Auth session required. HA token never appears in this response.
 */
import { auth } from "@/lib/auth-edge";
import {
  registerSSEClient,
  unregisterSSEClient,
} from "@/lib/ha/sse-registry";
import {
  getCurrentEntitySnapshot,
  getHAConnection,
} from "@/lib/ha/connection";

// Force dynamic rendering — SSE must never be cached
export const dynamic = "force-dynamic";

export async function GET() {
  // Auth gate: reject unauthenticated requests
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clientId = crypto.randomUUID();

  // Ensure the HA WebSocket connection is alive before we send the snapshot
  // (non-blocking if already connected)
  try {
    await getHAConnection();
  } catch {
    // HA is unreachable — still open the SSE stream so the client receives
    // a connection:error event when HA comes back
  }

  const encoder = new TextEncoder();
  let keepaliveTimer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial snapshot so the browser has full state immediately
      const snapshot = getCurrentEntitySnapshot();
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "snapshot", entities: snapshot })}\n\n`
        )
      );

      // Register this client to receive future delta broadcasts from connection.ts
      registerSSEClient(clientId, (payload: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          // Stream closed — remove from registry so we stop trying to write
          unregisterSSEClient(clientId);
        }
      });

      // Keepalive ping every 30s — prevents Cloudflare Tunnel (and other
      // reverse proxies) from killing the connection due to idle timeout.
      // SSE comment lines (starting with `:`) are ignored by EventSource.
      keepaliveTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepaliveTimer);
        }
      }, 30_000);
    },
    cancel() {
      // Browser disconnected — clean up registry slot and keepalive
      clearInterval(keepaliveTimer);
      unregisterSSEClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
