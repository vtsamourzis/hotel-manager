"use client";

import { useRoomStore } from "@/lib/store/room-store";
import { useUIStore } from "@/lib/store/ui-store";
import { guardOffline } from "@/lib/hooks/useServerOnline";
import type { HAEntityState } from "@/lib/ha/types";
import styles from "../rooms.module.css";

interface WindowToggleProps {
  roomId: string;
  windowState: HAEntityState | null;
}

export function WindowToggle({ roomId, windowState }: WindowToggleProps) {
  const optimisticUpdate = useRoomStore((s) => s.optimisticUpdate);
  const serverOnline = useUIStore((s) => s.serverOnline);
  const isOpen = windowState?.state === "on";

  const toggle = () => {
    if (guardOffline(serverOnline)) return;
    const next = isOpen ? "close" : "open";
    optimisticUpdate(roomId, {
      windowOpen: windowState
        ? { ...windowState, state: next === "open" ? "on" : "off" }
        : null,
    });
    fetch(`/api/window/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: next }),
    }).catch(() => {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { message: "Αποτυχία εντολής παραθύρου", type: "error" },
        })
      );
    });
  };

  return (
    <div className={styles.windowRow}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={isOpen ? "var(--amber)" : "var(--ink-4)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="4" width="20" height="16" rx="1" />
        <line x1="12" y1="4" x2="12" y2="20" />
        <line x1="2" y1="12" x2="22" y2="12" />
        {isOpen && <path d="M2 4 L8 12 L2 20" />}
      </svg>
      <span className={styles.windowLabel}>
        {isOpen ? "Ανοιχτό" : "Κλειστό"}
      </span>
      <button
        className={`${styles.windowBtn} ${isOpen ? styles.windowBtnOpen : ""}`}
        onClick={toggle}
        aria-label={isOpen ? "Κλείσιμο παραθύρου" : "Άνοιγμα παραθύρου"}
        style={{ opacity: serverOnline ? 1 : 0.5, cursor: serverOnline ? "pointer" : "not-allowed" }}
      >
        {isOpen ? "Κλείσιμο" : "Άνοιγμα"}
      </button>
      {isOpen && (
        <span className={styles.windowHint}>
          AC θα απενεργοποιηθεί αυτόματα
        </span>
      )}
    </div>
  );
}
