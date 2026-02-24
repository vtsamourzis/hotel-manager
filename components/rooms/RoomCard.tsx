"use client";

import { Lightbulb } from "lucide-react";
import { useRoomStore } from "@/lib/store/room-store";
import styles from "./rooms.module.css";

interface RoomCardProps {
  roomId: string;
  onClick: () => void;
  isSelected?: boolean;
}

const STATUS_BAR_CLASS: Record<string, string> = {
  Occupied:  styles.statusBarOccupied,
  Vacant:    styles.statusBarVacant,
  Cleaning:  styles.statusBarCleaning,
  Preparing: styles.statusBarPreparing,
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  Occupied:  styles.statusBadgeOccupied,
  Vacant:    styles.statusBadgeVacant,
  Cleaning:  styles.statusBadgeCleaning,
  Preparing: styles.statusBadgePreparing,
};

const STATUS_LABEL: Record<string, string> = {
  Occupied:  "Κατειλημμένο",
  Vacant:    "Ελεύθερο",
  Cleaning:  "Καθαρισμός",
  Preparing: "Προετοιμασία",
};

export function RoomCard({ roomId, onClick, isSelected }: RoomCardProps) {
  // Subscribe to only this room's slice — prevents re-renders from other rooms
  const room = useRoomStore((state) => state.rooms[roomId]);

  // Skeleton card while room data isn't available yet
  if (!room) {
    return (
      <div className={styles.skeletonCard}>
        <div className={styles.skeletonBar} />
        <div className={styles.skeletonBody}>
          <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
          <div className={styles.skeletonLine} />
        </div>
      </div>
    );
  }

  const status = room.status ?? "Vacant";
  const barClass = STATUS_BAR_CLASS[status] ?? styles.statusBarVacant;
  const badgeClass = STATUS_BADGE_CLASS[status] ?? styles.statusBadgeVacant;
  const badgeLabel = STATUS_LABEL[status] ?? status;

  const anyLightOn = [
    room.lights.ceiling,
    room.lights.side1,
    room.lights.side2,
    room.lights.ambient,
  ].some((l) => l?.state === "on");

  return (
    <article
      className={`${styles.roomCard} ${isSelected ? styles.roomCardSelected : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Δωμάτιο ${roomId}, ${badgeLabel}`}
    >
      {/* Status accent bar */}
      <div className={`${styles.statusBar} ${barClass}`} />

      {/* Card body */}
      <div className={styles.cardBody}>
        <div className={styles.cardTopRow}>
          <span className={styles.roomNumber}>{roomId}</span>
          <Lightbulb
            size={16}
            className={anyLightOn ? styles.lightBulbIcon : styles.lightBulbIconHidden}
            aria-label={anyLightOn ? "Φώτα ανοιχτά" : undefined}
          />
        </div>
        <span className={`${styles.statusBadge} ${badgeClass}`}>{badgeLabel}</span>
      </div>
    </article>
  );
}
