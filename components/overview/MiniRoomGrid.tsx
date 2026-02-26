"use client";

import { useShallow } from "zustand/react/shallow";
import { useRoomStore } from "@/lib/store/room-store";
import { useUIStore } from "@/lib/store/ui-store";
import { ROOMS, FLOOR_ROOMS } from "@/lib/ha/entity-map";
import type { RoomState } from "@/lib/ha/types";
import styles from "./overview.module.css";

const FLOOR_LABELS: Record<string, string> = {
  "1": "1\u03BF\u03C2",
  "2": "2\u03BF\u03C2",
  "3": "3\u03BF\u03C2",
};

const STATUS_COLORS: Record<RoomState["status"], string> = {
  Occupied:  "occupied",
  Vacant:    "vacant",
  Cleaning:  "cleaning",
  Preparing: "arriving",
};

const LEGEND: { key: string; label: string }[] = [
  { key: "occupied", label: "\u039A\u03B1\u03C4\u03B5\u03B9\u03BB\u03B7\u03BC\u03BC\u03AD\u03BD\u03BF" },
  { key: "vacant",   label: "\u0395\u03BB\u03B5\u03CD\u03B8\u03B5\u03C1\u03BF" },
  { key: "cleaning", label: "\u039A\u03B1\u03B8\u03B1\u03C1\u03B9\u03C3\u03BC\u03CC\u03C2" },
  { key: "arriving", label: "\u0391\u03C6\u03B9\u03BA\u03BD\u03B5\u03AF\u03C4\u03B1\u03B9" },
];

export function MiniRoomGrid() {
  const rooms = useRoomStore(useShallow((state) => state.rooms));
  const connection = useRoomStore((state) => state.connection);
  const selectRoom = useUIStore((state) => state.selectRoom);

  // Skeleton while connecting
  if (connection !== "connected") {
    return (
      <div className={styles.gridCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>
            {"\u039A\u03B1\u03C4\u03AC\u03C3\u03C4\u03B1\u03C3\u03B7 \u0394\u03C9\u03BC\u03B1\u03C4\u03AF\u03C9\u03BD"}
          </span>
        </div>
        <div className={styles.occStatRow}>
          <div className={styles.skeletonLine} style={{ width: "120px", height: "32px" }} />
        </div>
        <div className={styles.miniGridWrap}>
          {(["1", "2", "3"] as const).map((floor) => (
            <div key={floor} className={styles.miniFloor}>
              <div className={styles.miniFloorLabel}>{FLOOR_LABELS[floor]}</div>
              <div className={styles.miniRooms}>
                {FLOOR_ROOMS[floor].map((id) => (
                  <div key={id} className={styles.miniSqSkeleton} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Count occupied rooms
  const occupiedCount = ROOMS.filter((id) => rooms[id]?.status === "Occupied").length;
  const occupancyPct = Math.round((occupiedCount / ROOMS.length) * 100);

  return (
    <div className={styles.gridCard}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>
          {"\u039A\u03B1\u03C4\u03AC\u03C3\u03C4\u03B1\u03C3\u03B7 \u0394\u03C9\u03BC\u03B1\u03C4\u03AF\u03C9\u03BD"}
        </span>
      </div>

      {/* Occupancy stat */}
      <div className={styles.occStatRow}>
        <div className={styles.occBig}>
          {occupiedCount}<span>/{ROOMS.length}</span>
        </div>
        <div className={styles.occMeta}>
          <div className={styles.occLabel}>
            {"\u03B4\u03C9\u03BC\u03AC\u03C4\u03B9\u03B1 \u03BA\u03B1\u03C4\u03B5\u03B9\u03BB\u03B7\u03BC\u03BC\u03AD\u03BD\u03B1"}
          </div>
          <div className={styles.occRate}>
            {occupancyPct}% {"\u03C0\u03BB\u03B7\u03C1\u03CC\u03C4\u03B7\u03C4\u03B1 \u03C3\u03AE\u03BC\u03B5\u03C1\u03B1"}
          </div>
        </div>
      </div>

      {/* Floor-grouped mini squares */}
      <div className={styles.miniGridWrap}>
        {(["1", "2", "3"] as const).map((floor) => (
          <div key={floor} className={styles.miniFloor}>
            <div className={styles.miniFloorLabel}>{FLOOR_LABELS[floor]}</div>
            <div className={styles.miniRooms}>
              {FLOOR_ROOMS[floor].map((roomId) => {
                const room = rooms[roomId];
                const colorKey = room ? STATUS_COLORS[room.status] : "vacant";

                return (
                  <div
                    key={roomId}
                    className={`${styles.miniRoom} ${styles[`miniRoom_${colorKey}`]}`}
                    onClick={() => selectRoom(roomId)}
                  >
                    <div className={styles.miniSq}>
                      <span className={styles.miniSqNum}>{roomId}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className={styles.miniLegend}>
        {LEGEND.map((item) => (
          <span key={item.key} className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles[`legendDot_${item.key}`]}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
