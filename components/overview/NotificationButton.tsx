"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Thermometer, X } from "lucide-react";
import { useRoomStore } from "@/lib/store/room-store";
import { useUIStore } from "@/lib/store/ui-store";
import { ROOMS } from "@/lib/ha/entity-map";
import styles from "./overview.module.css";

interface Notification {
  id: string;
  roomId: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * Bell button in the hero row — shows operational (non-critical) notifications.
 * Currently: AC left on in vacant rooms.
 * Dropdown list on click, closes on outside click.
 */
export function NotificationButton() {
  const rooms = useRoomStore((state) => state.rooms);
  const selectRoom = useUIStore((s) => s.selectRoom);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const notifications: Notification[] = [];

  for (const roomId of ROOMS) {
    const room = rooms[roomId];
    if (!room) continue;

    // AC on in vacant room
    if (
      room.status === "Vacant" &&
      room.acState?.state !== "off" &&
      room.acState !== null
    ) {
      notifications.push({
        id: `${roomId}-ac`,
        roomId,
        label: `${roomId} \u2014 A/C \u03B1\u03BD\u03BF\u03B9\u03C7\u03C4\u03CC \u03C3\u03B5 \u03BA\u03B5\u03BD\u03CC \u03B4\u03C9\u03BC\u03AC\u03C4\u03B9\u03BF`,
        icon: <Thermometer size={14} strokeWidth={2} />,
      });
    }
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const count = notifications.length;

  return (
    <div className={styles.notifWrapper} ref={ref}>
      <button
        className={styles.notifBtn}
        onClick={() => setOpen((v) => !v)}
        aria-label={`\u0395\u03B9\u03B4\u03BF\u03C0\u03BF\u03B9\u03AE\u03C3\u03B5\u03B9\u03C2${count > 0 ? ` (${count})` : ""}`}
      >
        <Bell size={16} strokeWidth={2} />
        {count > 0 && <span className={styles.notifBadge}>{count}</span>}
      </button>

      {open && (
        <div className={styles.notifDropdown}>
          <div className={styles.notifHeader}>
            <span className={styles.notifHeaderTitle}>
              {"\u0395\u03B9\u03B4\u03BF\u03C0\u03BF\u03B9\u03AE\u03C3\u03B5\u03B9\u03C2"}
            </span>
            <button
              className={styles.notifClose}
              onClick={() => setOpen(false)}
              aria-label="\u039A\u03BB\u03B5\u03AF\u03C3\u03B9\u03BC\u03BF"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className={styles.notifEmpty}>
              {"\u039A\u03B1\u03BC\u03AF\u03B1 \u03B5\u03B9\u03B4\u03BF\u03C0\u03BF\u03AF\u03B7\u03C3\u03B7"}
            </div>
          ) : (
            <div className={styles.notifList}>
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className={styles.notifItem}
                  onClick={() => {
                    selectRoom(n.roomId);
                    setOpen(false);
                  }}
                >
                  <span className={styles.notifItemIcon}>{n.icon}</span>
                  <span className={styles.notifItemLabel}>{n.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
