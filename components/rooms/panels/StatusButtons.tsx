"use client";

import { useRoomStore } from "@/lib/store/room-store";
import type { RoomStatus } from "@/lib/ha/entity-map";
import styles from "../rooms.module.css";

interface StatusButtonsProps {
  roomId: string;
  currentStatus: string;
}

const STATUS_OPTIONS: { value: RoomStatus; label: string }[] = [
  { value: "Vacant",    label: "Ελεύθερο" },
  { value: "Occupied",  label: "Κατειλημμένο" },
  { value: "Cleaning",  label: "Καθαρισμός" },
  { value: "Preparing", label: "Προετοιμασία" },
];

export function StatusButtons({ roomId, currentStatus }: StatusButtonsProps) {
  const optimisticUpdate = useRoomStore((s) => s.optimisticUpdate);

  const handleStatusChange = (newStatus: RoomStatus) => {
    if (newStatus === currentStatus) return;

    const rollback = optimisticUpdate(roomId, { status: newStatus });

    fetch(`/api/rooms/${roomId}/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => {
      rollback();
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { message: "Αποτυχία σύνδεσης", type: "error" },
        })
      );
    });
  };

  return (
    <div className={styles.statusButtons}>
      {STATUS_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          className={`${styles.statusBtn} ${currentStatus === value ? styles.statusBtnActive : ""}`}
          onClick={() => handleStatusChange(value)}
          aria-pressed={currentStatus === value}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
