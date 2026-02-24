"use client";

import { FlameKindling, Droplets, Thermometer } from "lucide-react";
import { useRoomStore } from "@/lib/store/room-store";
import { ROOMS } from "@/lib/ha/entity-map";
import styles from "./overview.module.css";

interface Alert {
  id: string;
  roomId: string;
  type: "smoke" | "leak" | "ac";
  label: string;
  icon: React.ReactNode;
}

export function AlertBar() {
  const rooms = useRoomStore((state) => state.rooms);

  const alerts: Alert[] = [];

  for (const roomId of ROOMS) {
    const room = rooms[roomId];
    if (!room) continue;

    // Smoke alert
    if (room.smokeAlert?.state === "on") {
      alerts.push({
        id: `${roomId}-smoke`,
        roomId,
        type: "smoke",
        label: `Δωμάτιο ${roomId}: Καπνός`,
        icon: <FlameKindling size={11} strokeWidth={2} />,
      });
    }

    // Leak alert
    if (room.leakAlert?.state === "on") {
      alerts.push({
        id: `${roomId}-leak`,
        roomId,
        type: "leak",
        label: `Δωμάτιο ${roomId}: Διαρροή`,
        icon: <Droplets size={11} strokeWidth={2} />,
      });
    }

    // Operational alert: AC on in vacant room
    if (
      room.status === "Vacant" &&
      room.acState?.state !== "off" &&
      room.acState !== null
    ) {
      alerts.push({
        id: `${roomId}-ac`,
        roomId,
        type: "ac",
        label: `Δωμάτιο ${roomId}: A/C ανοιχτό`,
        icon: <Thermometer size={11} strokeWidth={2} />,
      });
    }
  }

  return (
    <div className={styles.alertCard}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Ειδοποιήσεις</span>
        {alerts.length > 0 && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              background: "var(--clay-surface)",
              color: "var(--clay-text)",
              border: "1px solid var(--clay-border)",
              borderRadius: "var(--r-pill)",
              padding: "2px 7px",
            }}
          >
            {alerts.length}
          </span>
        )}
      </div>
      <div className={styles.cardBody}>
        {alerts.length === 0 ? (
          <p className={styles.noAlerts}>Δεν υπάρχουν ειδοποιήσεις</p>
        ) : (
          <div className={styles.alertBar}>
            {alerts.map((alert) => (
              <span key={alert.id} className={styles.alertChip}>
                {alert.icon}
                {alert.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
