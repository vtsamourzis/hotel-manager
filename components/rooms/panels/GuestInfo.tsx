"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoomStore } from "@/lib/store/room-store";
import type { Booking } from "@/lib/db/bookings";
import styles from "../rooms.module.css";

interface GuestInfoProps {
  roomId: string;
  currentStatus: string;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("el-GR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SOURCE_LABELS: Record<string, string> = {
  "Airbnb": "Airbnb",
  "Booking.com": "Booking.com",
  "Direct": "Άμεση",
  "Walk-in": "Walk-in",
};

export function GuestInfo({ roomId, currentStatus }: GuestInfoProps) {
  const [showMoveSection, setShowMoveSection] = useState(false);
  const [targetRoom, setTargetRoom] = useState("");
  const [isMoving, setIsMoving] = useState(false);

  const allRooms = useRoomStore((s) => s.rooms);
  const optimisticUpdate = useRoomStore((s) => s.optimisticUpdate);

  const { data, isLoading } = useQuery<{ booking: Booking | null }>({
    queryKey: ["booking", roomId],
    queryFn: () =>
      fetch(`/api/bookings/room/${roomId}`).then((r) => r.json()),
    enabled: currentStatus === "Occupied",
    staleTime: 30_000,
  });

  if (currentStatus !== "Occupied") return null;

  if (isLoading) {
    return (
      <div className={styles.guestName} style={{ color: "var(--ink-4)", fontWeight: 400, fontSize: "13px" }}>
        Φόρτωση στοιχείων επισκέπτη…
      </div>
    );
  }

  const booking = data?.booking;

  if (!booking) {
    return (
      <div className={styles.unavailable}>Δεν βρέθηκε κράτηση</div>
    );
  }

  // Available rooms for move: those not Occupied and not current room
  const availableRooms = Object.entries(allRooms)
    .filter(([id, room]) => id !== roomId && room.status !== "Occupied")
    .map(([id]) => id)
    .sort();

  const handleCheckout = () => {
    const rollback = optimisticUpdate(roomId, { status: "Vacant" });
    fetch(`/api/rooms/${roomId}/checkout`, { method: "POST" }).catch(() => {
      rollback();
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { message: "Αποτυχία αποχώρησης", type: "error" },
        })
      );
    });
  };

  const handleMove = async () => {
    if (!targetRoom) return;
    setIsMoving(true);

    try {
      // 1. Checkout from current room
      const r1 = await fetch(`/api/rooms/${roomId}/checkout`, { method: "POST" });
      if (!r1.ok) throw new Error("checkout failed");

      // 2. Checkin to new room with same guest details
      const r2 = await fetch(`/api/rooms/${targetRoom}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: booking.guest_name,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          bookingSource: booking.booking_source,
        }),
      });
      if (!r2.ok) throw new Error("checkin failed");

      // Optimistic: current room → Vacant, new room → Occupied
      optimisticUpdate(roomId, { status: "Vacant" });
      optimisticUpdate(targetRoom, { status: "Occupied" });
      setShowMoveSection(false);
    } catch {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { message: "Αποτυχία μεταφοράς δωματίου", type: "error" },
        })
      );
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div>
      <div className={styles.guestName}>{booking.guest_name}</div>
      <div className={styles.guestMeta}>
        Άφιξη: {formatDateTime(booking.check_in)}
      </div>
      <div className={styles.guestMeta}>
        Αναχώρηση: {formatDateTime(booking.check_out)}
      </div>
      <div className={styles.guestMeta}>
        Πηγή:{" "}
        <span className="s-badge occupied" style={{ fontSize: "9.5px" }}>
          {SOURCE_LABELS[booking.booking_source] ?? booking.booking_source}
        </span>
      </div>

      <div className={styles.guestActions}>
        <button className="btn-secondary" style={{ fontSize: "12px", padding: "6px 12px" }} onClick={handleCheckout}>
          Αποχώρηση
        </button>
        <button
          className="btn-secondary"
          style={{ fontSize: "12px", padding: "6px 12px" }}
          onClick={() => setShowMoveSection((v) => !v)}
        >
          Μεταφορά Δωματίου
        </button>
      </div>

      {showMoveSection && (
        <div className={styles.roomMoveSection}>
          <div className={styles.roomMoveTitle}>Επιλογή νέου δωματίου</div>
          <select
            className={styles.roomMoveSelect}
            value={targetRoom}
            onChange={(e) => setTargetRoom(e.target.value)}
          >
            <option value="">— Επιλέξτε δωμάτιο —</option>
            {availableRooms.map((id) => (
              <option key={id} value={id}>
                Δωμάτιο {id} ({allRooms[id]?.status ?? "?"})
              </option>
            ))}
          </select>
          <div className={styles.roomMoveActions}>
            <button
              className="btn-primary"
              style={{ fontSize: "12px", padding: "6px 14px" }}
              onClick={handleMove}
              disabled={!targetRoom || isMoving}
            >
              {isMoving ? "Μεταφορά…" : "Επιβεβαίωση"}
            </button>
            <button
              className="btn-secondary"
              style={{ fontSize: "12px", padding: "6px 12px" }}
              onClick={() => setShowMoveSection(false)}
            >
              Ακύρωση
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
