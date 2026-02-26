import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import os from "os";
import { readFileSync } from "fs";
import path from "path";

// Module-level cache for machine ID — avoids repeated DB queries
let cachedMachineId: string | null = null;

/**
 * Returns a persistent machine ID.
 * Checks SQLite settings table first; generates + stores a new UUID if missing.
 */
export function getMachineId(): string {
  if (cachedMachineId) return cachedMachineId;

  const row = db
    .prepare(`SELECT value FROM settings WHERE key = ?`)
    .get("machine_id") as { value: string } | undefined;

  if (row) {
    cachedMachineId = row.value;
    return cachedMachineId;
  }

  const newId = randomUUID();
  db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`).run(
    "machine_id",
    newId
  );
  cachedMachineId = newId;
  return cachedMachineId;
}

/**
 * Returns the first non-internal IPv4 network interface's MAC and IP.
 * Falls back to "unknown" if no suitable interface is found.
 */
export function getNetworkInfo(): { mac: string; ip: string } {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;
    for (const addr of entries) {
      if (addr.family === "IPv4" && !addr.internal) {
        return { mac: addr.mac, ip: addr.address };
      }
    }
  }
  return { mac: "unknown", ip: "unknown" };
}

/**
 * Reads app version from package.json.
 * Uses readFileSync (not require) for Turbopack compatibility.
 */
export function getAppVersion(): string {
  try {
    const raw = readFileSync(
      path.join(process.cwd(), "package.json"),
      "utf8"
    );
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}
