/**
 * Diagnostic endpoint: GET /api/ha/diagnostic
 *
 * Returns the state of the entire HA → SSE → browser pipeline.
 * Use this to debug connectivity issues. Remove before production.
 */
import {
  getConnectionStatus,
  getCurrentEntitySnapshot,
  getHAConnection,
} from "@/lib/ha/connection";
import { getClientCount } from "@/lib/ha/sse-registry";
import { ALL_ROOM_ENTITY_IDS } from "@/lib/ha/entity-map";

export const dynamic = "force-dynamic";

export async function GET() {
  const preStatus = getConnectionStatus();
  const preCache = Object.keys(getCurrentEntitySnapshot()).length;

  // Try to connect
  let connectionError: string | null = null;
  let postStatus: string;
  let postCache: number;
  try {
    console.log("[diag] calling getHAConnection...");
    const conn = await getHAConnection();
    console.log("[diag] getHAConnection returned, conn exists:", !!conn);
    postStatus = getConnectionStatus();
    postCache = Object.keys(getCurrentEntitySnapshot()).length;
  } catch (err) {
    connectionError = err instanceof Error
      ? `${err.name}: ${err.message}`
      : JSON.stringify(err, null, 2);
    console.log("[diag] getHAConnection THREW:", connectionError);
    postStatus = getConnectionStatus();
    postCache = Object.keys(getCurrentEntitySnapshot()).length;
  }

  const snapshot = getCurrentEntitySnapshot();

  // Sample a few room entities
  const sampleEntities: Record<string, string> = {};
  for (const entityId of ALL_ROOM_ENTITY_IDS.slice(0, 5)) {
    const entity = snapshot[entityId];
    sampleEntities[entityId] = entity
      ? `${entity.state} (updated: ${entity.last_updated})`
      : "NOT IN CACHE";
  }

  return Response.json({
    pipeline: {
      preConnectStatus: preStatus,
      preConnectCacheSize: preCache,
      postConnectStatus: postStatus!,
      postConnectCacheSize: postCache!,
      connectionError,
      roomEntitiesExpected: ALL_ROOM_ENTITY_IDS.length,
      roomEntitiesInCache: ALL_ROOM_ENTITY_IDS.filter((id) => id in snapshot).length,
      sseClientsConnected: getClientCount(),
    },
    env: {
      HA_URL: process.env.HA_URL ? `${process.env.HA_URL} (set)` : "MISSING",
      HA_TOKEN: process.env.HA_TOKEN ? "set (hidden)" : "MISSING",
    },
    sampleEntities,
  });
}
