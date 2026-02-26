"use client";

import { Lock, LockOpen } from "lucide-react";
import { useRoomStore } from "@/lib/store/room-store";
import { useUIStore } from "@/lib/store/ui-store";
import { guardOffline } from "@/lib/hooks/useServerOnline";
import type { HAEntityState } from "@/lib/ha/types";
import styles from "../rooms.module.css";

interface LockControlProps {
  roomId: string;
  lockState: HAEntityState | null;
}

export function LockControl({ roomId, lockState }: LockControlProps) {
  if (!lockState) {
    return <p className={styles.unavailable}>Δεν υπάρχει κλειδαριά</p>;
  }

  const optimisticUpdate = useRoomStore((s) => s.optimisticUpdate);
  const serverOnline = useUIStore((s) => s.serverOnline);
  const isLocked = lockState.state === "locked";

  const callLock = (action: "lock" | "unlock") => {
    if (guardOffline(serverOnline)) return;
    // Optimistic: update store instantly
    optimisticUpdate(roomId, {
      lock: { ...lockState, state: action === "lock" ? "locked" : "unlocked" },
    });
    fetch(`/api/lock/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).catch(() => {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { message: "Αποτυχία σύνδεσης κλειδαριάς", type: "error" },
        })
      );
    });
  };

  return (
    <div className={styles.lockRow}>
      {isLocked ? (
        <Lock size={18} color="var(--clay)" aria-label="Κλειδωμένο" />
      ) : (
        <LockOpen size={18} color="var(--sage)" aria-label="Ξεκλείδωτο" />
      )}
      <span className={styles.lockStateLabel}>
        {isLocked ? "Κλειδωμένο" : "Ξεκλείδωτο"}
      </span>
      <div className={styles.lockButtons} style={{ opacity: serverOnline ? 1 : 0.5, cursor: serverOnline ? "default" : "not-allowed" }}>
        <button
          className="btn-secondary"
          style={{ fontSize: "12px", padding: "5px 12px" }}
          disabled={isLocked}
          onClick={() => callLock("lock")}
          aria-label="Κλείδωμα"
        >
          Κλείδωμα
        </button>
        <button
          className="btn-secondary"
          style={{ fontSize: "12px", padding: "5px 12px" }}
          disabled={!isLocked}
          onClick={() => callLock("unlock")}
          aria-label="Ξεκλείδωμα"
        >
          Ξεκλείδωμα
        </button>
      </div>
    </div>
  );
}
