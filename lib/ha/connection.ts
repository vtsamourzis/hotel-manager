/**
 * HAWebSocketService — server-side singleton.
 *
 * Connects to Home Assistant WebSocket on first import, subscribes to all
 * room entity updates, and maintains an in-memory entity cache. Deltas are
 * broadcast to browser clients via SSE (see sse-registry.ts).
 *
 * SECURITY: HA_URL and HA_TOKEN are server-only env vars — NEVER NEXT_PUBLIC_.
 * The token must never appear in any client bundle or SSE payload.
 *
 * NOTE: All mutable singleton state lives on globalThis so it survives
 * Turbopack HMR in dev mode. Uses a Promise singleton to prevent race
 * conditions — all concurrent callers await the same initialization.
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
import { ENTITY_TO_ROOM, TRACKED_ENTITY_IDS } from "./entity-map";

// ---------------------------------------------------------------------------
// globalThis singleton — survives Turbopack HMR
// ---------------------------------------------------------------------------
const g = globalThis as unknown as {
  __ha_initPromise: Promise<Connection> | null;
  __ha_entityCache: Record<string, HAEntityState>;
  __ha_connectionStatus: ConnectionStatus;
};
if (!g.__ha_entityCache) g.__ha_entityCache = {};
if (!g.__ha_connectionStatus) g.__ha_connectionStatus = "connecting";

/**
 * Internal initialization — creates connection, seeds cache, subscribes.
 * Only called once; subsequent calls return the same Promise.
 */
async function _initConnection(): Promise<Connection> {
  const haUrl = process.env.HA_URL;
  const haToken = process.env.HA_TOKEN;

  if (!haUrl || !haToken) {
    throw new Error(
      `HA_URL or HA_TOKEN missing. HA_URL=${haUrl ? "set" : "MISSING"}, HA_TOKEN=${haToken ? "set" : "MISSING"}`
    );
  }

  console.log("[HA] Connecting to", haUrl);

  const auth = createLongLivedTokenAuth(haUrl, haToken);
  const conn = await createConnection({ auth, createSocket });

  console.log("[HA] Connected. Fetching initial states...");

  // Seed entity cache with full state on connect
  const states = await getStates(conn);
  for (const s of states) {
    g.__ha_entityCache[s.entity_id] = s as unknown as HAEntityState;
  }
  g.__ha_connectionStatus = "connected";

  console.log(
    `[HA] Cache seeded: ${states.length} entities total, ${
      Object.keys(g.__ha_entityCache).length
    } in cache`
  );

  // Subscribe to all entity updates
  subscribeEntities(conn, (entities: HassEntities) => {
    for (const [entityId, entityState] of Object.entries(entities)) {
      // Update cache
      g.__ha_entityCache[entityId] = entityState as unknown as HAEntityState;

      // Only broadcast tracked entities to SSE clients (filter noise)
      if (!TRACKED_ENTITY_IDS.has(entityId)) continue;

      broadcastToSSEClients(
        JSON.stringify({
          type: "delta",
          entity_id: entityId,
          state: entityState as unknown as HAEntityState,
        })
      );
    }
  });

  console.log("[HA] Entity subscription active");

  // Handle disconnect events
  conn.addEventListener("disconnected", () => {
    console.log("[HA] Disconnected from Home Assistant");
    g.__ha_connectionStatus = "error";
    broadcastToSSEClients(
      JSON.stringify({ type: "connection", status: "error" })
    );
  });

  // Handle reconnect — re-fetch full state to reconcile any missed updates
  conn.addEventListener("ready", async () => {
    console.log("[HA] Reconnected to Home Assistant");
    g.__ha_connectionStatus = "connected";
    try {
      const freshStates = await getStates(conn);
      for (const s of freshStates) {
        g.__ha_entityCache[s.entity_id] = s as unknown as HAEntityState;
      }
    } catch {
      // Non-fatal — entity cache may be slightly stale until next push
    }
    broadcastToSSEClients(
      JSON.stringify({ type: "connection", status: "connected" })
    );
  });

  return conn;
}

/**
 * Get (or create) the HA WebSocket connection.
 * Idempotent — all concurrent callers await the same initialization Promise.
 * If init fails, the promise is cleared so the next call retries.
 */
export function getHAConnection(): Promise<Connection> {
  if (!g.__ha_initPromise) {
    g.__ha_initPromise = _initConnection().catch((err) => {
      // Clear the promise so next call retries instead of returning cached rejection
      console.error("[HA] Connection failed:", err instanceof Error ? err.message : JSON.stringify(err));
      g.__ha_initPromise = null;
      g.__ha_connectionStatus = "error";
      throw err;
    });
  }
  return g.__ha_initPromise;
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
  return { ...g.__ha_entityCache };
}

/**
 * Returns the current connection status.
 * Useful for health-check endpoints.
 */
export function getConnectionStatus(): ConnectionStatus {
  return g.__ha_connectionStatus;
}
