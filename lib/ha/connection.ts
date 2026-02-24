/**
 * HAWebSocketService — server-side singleton.
 *
 * Connects to Home Assistant WebSocket on first import, subscribes to all
 * room entity updates, and maintains an in-memory entity cache. Deltas are
 * broadcast to browser clients via SSE (see sse-registry.ts).
 *
 * SECURITY: HA_URL and HA_TOKEN are server-only env vars — NEVER NEXT_PUBLIC_.
 * The token must never appear in any client bundle or SSE payload.
 */
import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  callService,
  getStates,
  type Connection,
  type HassEntities,
} from "home-assistant-js-websocket";
import { createSocket } from "./socket";
import { broadcastToSSEClients } from "./sse-registry";
import type { HAEntityState, ConnectionStatus } from "./types";
// ENTITY_TO_ROOM is created in plan 02-02 (same Wave 1).
// Import is declared here; TypeScript may report an unresolved module error
// until entity-map.ts is created in plan 02-02.
import { ENTITY_TO_ROOM } from "./entity-map";

// Module-level singleton state
let _connection: Connection | null = null;
let _entityCache: Record<string, HAEntityState> = {};
let _connectionStatus: ConnectionStatus = "connecting";

/**
 * Get (or create) the HA WebSocket connection.
 * Idempotent — safe to call from multiple route handlers concurrently.
 */
export async function getHAConnection(): Promise<Connection> {
  if (_connection) return _connection;

  const auth = createLongLivedTokenAuth(
    process.env.HA_URL!,
    process.env.HA_TOKEN!
  );

  _connection = await createConnection({ auth, createSocket });

  // Seed entity cache with full state on connect
  const states = await getStates(_connection);
  for (const s of states) {
    _entityCache[s.entity_id] = s as unknown as HAEntityState;
  }
  _connectionStatus = "connected";

  // Subscribe to all entity updates
  subscribeEntities(_connection, (entities: HassEntities) => {
    for (const [entityId, entityState] of Object.entries(entities)) {
      // Update cache (all entities — getStates may have missed some)
      _entityCache[entityId] = entityState as unknown as HAEntityState;

      // Only broadcast room entities to SSE clients (filter noise)
      if (!(entityId in ENTITY_TO_ROOM)) continue;

      broadcastToSSEClients(
        JSON.stringify({
          type: "delta",
          entity_id: entityId,
          state: entityState as unknown as HAEntityState,
        })
      );
    }
  });

  // Handle disconnect events
  _connection.addEventListener("disconnected", () => {
    _connectionStatus = "error";
    broadcastToSSEClients(
      JSON.stringify({ type: "connection", status: "error" })
    );
  });

  // Handle reconnect — re-fetch full state to reconcile any missed updates
  _connection.addEventListener("ready", async () => {
    _connectionStatus = "connected";
    try {
      const freshStates = await getStates(_connection!);
      for (const s of freshStates) {
        _entityCache[s.entity_id] = s as unknown as HAEntityState;
      }
    } catch {
      // Non-fatal — entity cache may be slightly stale until next push
    }
    broadcastToSSEClients(
      JSON.stringify({ type: "connection", status: "connected" })
    );
  });

  return _connection;
}

/**
 * Call a HA service via the BFF connection.
 * Commands flow: browser → Next.js API route → haCallService → HA
 */
export async function haCallService(
  domain: string,
  service: string,
  serviceData: Record<string, unknown>
): Promise<void> {
  const conn = await getHAConnection();
  await callService(conn, domain, service, serviceData);
}

/**
 * Returns a shallow copy of the current entity cache.
 * Used by the SSE route to send an initial snapshot to newly connected browsers.
 */
export function getCurrentEntitySnapshot(): Record<string, HAEntityState> {
  return { ..._entityCache };
}

/**
 * Returns the current connection status.
 * Useful for health-check endpoints.
 */
export function getConnectionStatus(): ConnectionStatus {
  return _connectionStatus;
}
