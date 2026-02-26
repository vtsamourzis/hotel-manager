"use client";

import { FlameKindling, Droplets, ArrowRight } from "lucide-react";
import { useRoomStore } from "@/lib/store/room-store";
import { useUIStore } from "@/lib/store/ui-store";
import { ROOMS } from "@/lib/ha/entity-map";
import styles from "./overview.module.css";

interface CriticalAlert {
  id: string;
  roomId: string;
  type: "smoke" | "leak";
  title: string;
  sub: string;
  icon: React.ReactNode;
}

/**
 * Critical-only alert bar — sits between hero and content grid.
 * Only shows smoke/leak alerts. Hidden when there are none.
 * Matches the mockup's home-alert-bar pattern.
 */
export function AlertBar() {
  const rooms = useRoomStore((state) => state.rooms);
  const selectRoom = useUIStore((s) => s.selectRoom);

  const alerts: CriticalAlert[] = [];

  for (const roomId of ROOMS) {
    const room = rooms[roomId];
    if (!room) continue;

    if (room.smokeAlert?.state === "on") {
      alerts.push({
        id: `${roomId}-smoke`,
        roomId,
        type: "smoke",
        title: `${roomId} — ${"\u0391\u03BD\u03AF\u03C7\u03BD\u03B5\u03C5\u03C3\u03B7 \u039A\u03B1\u03C0\u03BD\u03BF\u03CD"}`,
        sub: "\u0395\u03BB\u03AD\u03B3\u03BE\u03C4\u03B5 \u03AC\u03BC\u03B5\u03C3\u03B1",
        icon: <FlameKindling size={18} strokeWidth={2} />,
      });
    }

    if (room.leakAlert?.state === "on") {
      alerts.push({
        id: `${roomId}-leak`,
        roomId,
        type: "leak",
        title: `${roomId} — ${"\u0394\u03B9\u03B1\u03C1\u03C1\u03BF\u03AE \u039D\u03B5\u03C1\u03BF\u03CD"}`,
        sub: "\u0395\u03BB\u03AD\u03B3\u03BE\u03C4\u03B5 \u03AC\u03BC\u03B5\u03C3\u03B1",
        icon: <Droplets size={18} strokeWidth={2} />,
      });
    }
  }

  if (alerts.length === 0) return null;

  return (
    <div className={styles.criticalAlerts}>
      {alerts.map((alert) => (
        <div key={alert.id} className={styles.criticalBar}>
          <span className={styles.criticalIcon}>{alert.icon}</span>
          <div className={styles.criticalText}>
            <div className={styles.criticalTitle}>{alert.title}</div>
            <div className={styles.criticalSub}>{alert.sub}</div>
          </div>
          <button
            className={styles.criticalBtn}
            onClick={() => selectRoom(alert.roomId)}
          >
            {"\u03A0\u03C1\u03BF\u03B2\u03BF\u03BB\u03AE"}{" "}
            <ArrowRight size={12} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
}
