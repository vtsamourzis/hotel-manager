"use client";

import { useShallow } from "zustand/react/shallow";
import { Lightbulb } from "lucide-react";
import { useRoomStore } from "@/lib/store/room-store";
import { useUIStore } from "@/lib/store/ui-store";
import { ROOMS, FLOOR_ROOMS } from "@/lib/ha/entity-map";
import type { RoomState } from "@/lib/ha/types";
import styles from "./overview.module.css";

// Map room status to CSS module class
function statusClass(status: RoomState["status"]): string {
  switch (status) {
    case "Occupied":  return styles.statusOccupied;
    case "Vacant":    return styles.statusVacant;
    case "Cleaning":  return styles.statusCleaning;
    case "Preparing": return styles.statusPreparing;
    default:          return styles.statusVacant;
  }
}

// Greek status labels
const STATUS_LABELS: Record<RoomState["status"], string> = {
  Occupied:  "Κατειλημμένο",
  Vacant:    "Ελεύθερο",
  Cleaning:  "Καθαρισμός",
  Preparing: "Προετοιμασία",
};

function hasLightsOn(room: RoomState): boolean {
  return (
    room.lights.ceiling?.state === "on" ||
    room.lights.side1?.state === "on" ||
    room.lights.side2?.state === "on" ||
    room.lights.ambient?.state === "on"
  );
}

export function MiniRoomGrid() {
  const rooms = useRoomStore(useShallow((state) => state.rooms));
  const selectRoom = useUIStore((state) => state.selectRoom);

  // Check if store is populated (i.e. SSE snapshot has arrived)
  const isLoaded = Object.values(rooms).some(
    (r) => r.acState !== null || r.status !== "Vacant"
  );

  if (!isLoaded) {
    // Show skeleton tiles while initial SSE connection is pending
    return (
      <div className={styles.gridCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Δωμάτια</span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.miniGrid}>
            {ROOMS.map((id) => (
              <div key={id} className={styles.miniTileSkeleton} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gridCard}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Δωμάτια</span>
        <div style={{ display: "flex", gap: "8px", fontSize: "11px", color: "var(--ink-3)" }}>
          <span>Όροφος 1: {FLOOR_ROOMS["1"].join(", ")}</span>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.miniGrid}>
          {ROOMS.map((roomId) => {
            const room = rooms[roomId];
            if (!room) return null;

            const cls = statusClass(room.status);
            const lightsOn = hasLightsOn(room);

            return (
              <button
                key={roomId}
                className={`${styles.miniTile} ${cls}`}
                onClick={() => selectRoom(roomId)}
                aria-label={`Δωμάτιο ${roomId} — ${STATUS_LABELS[room.status]}`}
                type="button"
              >
                {/* 3px top accent bar */}
                <div className={styles.miniTileBar} />

                {/* Light icon (top-right) */}
                {lightsOn && (
                  <div className={styles.miniTileIcons}>
                    <Lightbulb
                      size={11}
                      strokeWidth={2}
                      style={{ color: "var(--amber)" }}
                    />
                  </div>
                )}

                {/* Room number */}
                <div className={styles.miniTileRoomNum}>{roomId}</div>

                {/* Status badge */}
                <div className={styles.miniTileBadge}>
                  {STATUS_LABELS[room.status]}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
