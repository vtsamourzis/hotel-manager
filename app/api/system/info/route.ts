import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getHAConnection,
  getCurrentEntitySnapshot,
  getConnectionStatus,
} from "@/lib/ha/connection";
import { getConfig, type HassConfig } from "home-assistant-js-websocket";
import { getMachineId, getNetworkInfo, getAppVersion } from "@/lib/system-info";

// Cache HA config to avoid excessive WebSocket calls (60s TTL)
let cachedConfig: { data: HassConfig; ts: number } | null = null;
const CONFIG_TTL = 60_000;

async function getHAConfigCached(): Promise<HassConfig | null> {
  if (cachedConfig && Date.now() - cachedConfig.ts < CONFIG_TTL) {
    return cachedConfig.data;
  }
  try {
    const conn = await getHAConnection();
    const config = await getConfig(conn);
    cachedConfig = { data: config, ts: Date.now() };
    return config;
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // HA data
  let ha: {
    connected: boolean;
    version: string;
    state: string;
    entityCount: number;
    unavailableCount: number;
  };

  try {
    const config = await getHAConfigCached();
    const status = getConnectionStatus();
    const snapshot = getCurrentEntitySnapshot();
    const entities = Object.values(snapshot);

    ha = {
      connected: status === "connected",
      version: config?.version ?? "\u2014",
      state: config?.state ?? "disconnected",
      entityCount: entities.length,
      unavailableCount: entities.filter((e) => e.state === "unavailable").length,
    };
  } catch {
    ha = {
      connected: false,
      version: "\u2014",
      state: "disconnected",
      entityCount: 0,
      unavailableCount: 0,
    };
  }

  // System data
  const networkInfo = getNetworkInfo();
  const system = {
    machineId: getMachineId(),
    mac: networkInfo.mac,
    ip: networkInfo.ip,
    appVersion: getAppVersion(),
  };

  return NextResponse.json({ ha, system });
}
