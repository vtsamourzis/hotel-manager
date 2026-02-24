/**
 * Registry of active SSE client connections.
 *
 * When the HA WebSocket service receives entity updates, it calls
 * broadcastToSSEClients() to push the delta to all connected browser clients.
 *
 * Uses a module-level Map so the registry persists across Next.js API route calls
 * within the same server process.
 */

// Map from clientId → write function
const _clients = new Map<string, (payload: string) => void>();

/**
 * Register a new SSE client with its write handle.
 * Called when a browser connects to /api/ha/sse.
 */
export function registerSSEClient(
  id: string,
  writer: (payload: string) => void
): void {
  _clients.set(id, writer);
}

/**
 * Unregister an SSE client.
 * Called when the browser disconnects (ReadableStream cancel) or on write error.
 */
export function unregisterSSEClient(id: string): void {
  _clients.delete(id);
}

/**
 * Broadcast a payload to all registered SSE clients.
 * Write errors are caught per-client — one bad client cannot block others.
 */
export function broadcastToSSEClients(payload: string): void {
  for (const [id, write] of _clients.entries()) {
    try {
      write(payload);
    } catch {
      // Client stream closed — remove from registry
      unregisterSSEClient(id);
    }
  }
}

/**
 * Returns the current number of connected SSE clients.
 * Used for diagnostics/logging only.
 */
export function getClientCount(): number {
  return _clients.size;
}
