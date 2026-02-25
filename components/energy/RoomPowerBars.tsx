"use client";

import { useEnergyStore } from "@/lib/store/energy-store";
import { useRoomStore } from "@/lib/store/room-store";
import { useShallow } from "zustand/react/shallow";
import type { RoomStatus } from "@/lib/ha/entity-map";
import styles from "./energy.module.css";

// ---------------------------------------------------------------------------
// Status color mapping -- matches room card status colors
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<RoomStatus, string> = {
  Occupied: "var(--amber)",
  Vacant: "var(--sage)",
  Cleaning: "var(--slate)",
  Preparing: "var(--violet)",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RoomPowerBars() {
  const roomPower = useEnergyStore((s) => s.roomPower);

  // Get room statuses from room store using useShallow to prevent unnecessary re-renders
  const roomStatuses = useRoomStore(
    useShallow((s) =>
      Object.fromEntries(
        Object.keys(s.rooms).map((id) => [id, s.rooms[id]?.status ?? "Vacant"])
      )
    )
  );

  // Build sorted entries (descending by kW)
  const entries = Object.entries(roomPower)
    .map(([roomId, kw]) => ({
      roomId,
      kw,
      status: (roomStatuses[roomId] ?? "Vacant") as RoomStatus,
    }))
    .sort((a, b) => b.kw - a.kw);

  // Max power for proportional bar calculation
  const maxKw = Math.max(...entries.map((e) => e.kw), 0.1);

  return (
    <div className={styles.roomPowerCard}>
      <div className={styles.sectionTitle}>
        {"\u039A\u03B1\u03C4\u03B1\u03BD\u03AC\u03BB\u03C9\u03C3\u03B7 \u03B1\u03BD\u03AC \u0394\u03C9\u03BC\u03AC\u03C4\u03B9\u03BF"}
      </div>
      <div className={styles.roomBarList}>
        {entries.map((entry) => {
          const pct = (entry.kw / maxKw) * 100;
          const dotColor = STATUS_COLORS[entry.status] ?? "var(--slate)";
          return (
            <div key={entry.roomId} className={styles.roomBarRow}>
              <span
                className={styles.roomDot}
                style={{ background: dotColor }}
              />
              <span className={styles.roomNumber}>{entry.roomId}</span>
              <div className={styles.roomBarTrack}>
                <div
                  className={styles.roomBarFill}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={styles.roomBarValue}>
                {entry.kw.toFixed(2)} kW
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
