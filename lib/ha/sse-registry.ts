/**
 * Registry of active SSE client connections.
 *
 * When the HA WebSocket service receives entity updates, it calls
 * broadcastToSSEClients() to push the delta to all connected browser clients.
 *
 * Uses globalThis so the registry survives Turbopack HMR in dev mode.
 * Without this, module re-evaluation resets the Map — all registered SSE
 * clients are lost and deltas never reach the browser.
 */

const g = globalThis as unknown as {
  __sse_clients: Map<string, (payload: string) => void>;
};
if (!g.__sse_clients) g.__sse_clients = new Map();

/**
 * Register a new SSE client with its write handle.
 * Called when a browser connects to /api/ha/sse.
 */
export function registerSSEClient(
  id: string,
  writer: (payload: string) => void
): void {
  g.__sse_clients.set(id, writer);
}

/**
 * Unregister an SSE client.
 * Called when the browser disconnects (ReadableStream cancel) or on write error.
 */
export function unregisterSSEClient(id: string): void {
  g.__sse_clients.delete(id);
}

/**
 * Broadcast a payload to all registered SSE clients.
 * Write errors are caught per-client — one bad client cannot block others.
 */
export function broadcastToSSEClients(payload: string): void {
  for (const [id, write] of g.__sse_clients.entries()) {
    try {
      write(payload);
    } catch {
      // Client stream closed — remove from registry
      g.__sse_clients.delete(id);
    }
  }
}

/**
 * Returns the current number of connected SSE clients.
 * Used for diagnostics/logging only.
 */
export function getClientCount(): number {
  return g.__sse_clients.size;
}
