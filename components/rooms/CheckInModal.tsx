"use client";

import { useState } from "react";
import { useUIStore } from "@/lib/store/ui-store";
import { useRoomStore } from "@/lib/store/room-store";
import { ROOMS } from "@/lib/ha/entity-map";
import styles from "./rooms.module.css";

const BOOKING_SOURCES = ["Airbnb", "Booking.com", "Direct", "Walk-in"] as const;

function nowLocalDateTimeString() {
  const now = new Date();
  // Format: YYYY-MM-DDTHH:mm (required for datetime-local input)
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function tomorrowLocalDateTimeString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;
}

export function CheckInModal() {
  const { isCheckinModalOpen, closeCheckinModal, selectedRoomId } = useUIStore();
  const rooms = useRoomStore((s) => s.rooms);

  // Available rooms: Vacant or Preparing
  const availableRooms = ROOMS.filter(
    (id) => rooms[id]?.status === "Vacant" || rooms[id]?.status === "Preparing"
  );

  // Pre-select the currently selected room if it's available
  const defaultRoom =
    selectedRoomId && availableRooms.includes(selectedRoomId as (typeof ROOMS)[number])
      ? selectedRoomId
      : availableRooms[0] ?? "";

  const [guestName, setGuestName]         = useState("");
  const [checkIn, setCheckIn]             = useState(nowLocalDateTimeString);
  const [checkOut, setCheckOut]           = useState(tomorrowLocalDateTimeString);
  const [roomId, setRoomId]               = useState(defaultRoom);
  const [bookingSource, setBookingSource] = useState<string>("Direct");
  const [isSubmitting, setIsSubmitting]   = useState(false);

  if (!isCheckinModalOpen) return null;

  const handleClose = () => {
    closeCheckinModal();
    setGuestName("");
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !guestName || !checkIn || !checkOut) return;

    // Close modal immediately — optimistic UX
    closeCheckinModal();

    try {
      const res = await fetch(`/api/rooms/${roomId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName,
          checkIn: new Date(checkIn).toISOString(),
          checkOut: new Date(checkOut).toISOString(),
          bookingSource,
        }),
      });

      if (!res.ok) throw new Error("checkin failed");
    } catch {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { message: "Αποτυχία κράτησης", type: "error" },
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={styles.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Νέα Άφιξη"
    >
      <div className={styles.modal}>
        {/* Modal header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Νέα Άφιξη</h2>
          <button
            className={styles.panelCloseBtn}
            onClick={handleClose}
            aria-label="Κλείσιμο"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Guest name */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="guest-name">
              Όνομα Επισκέπτη
            </label>
            <input
              id="guest-name"
              type="text"
              className={styles.formInput}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="π.χ. Νίκος Παπαδόπουλος"
              required
              autoFocus
            />
          </div>

          {/* Check-in date/time */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="check-in">
              Ημ/νία & Ώρα Άφιξης
            </label>
            <input
              id="check-in"
              type="datetime-local"
              className={styles.formInput}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </div>

          {/* Check-out date/time */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="check-out">
              Ημ/νία & Ώρα Αναχώρησης
            </label>
            <input
              id="check-out"
              type="datetime-local"
              className={styles.formInput}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </div>

          {/* Room selector (available rooms only) */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="room-select">
              Δωμάτιο
            </label>
            <select
              id="room-select"
              className={styles.formSelect}
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
            >
              <option value="">— Επιλέξτε δωμάτιο —</option>
              {availableRooms.map((id) => (
                <option key={id} value={id}>
                  Δωμάτιο {id} ({rooms[id]?.status === "Preparing" ? "Σε Προετοιμασία" : "Ελεύθερο"})
                </option>
              ))}
            </select>
            {availableRooms.length === 0 && (
              <p style={{ fontSize: "12px", color: "var(--clay)", marginTop: "4px" }}>
                Δεν υπάρχουν διαθέσιμα δωμάτια αυτή τη στιγμή.
              </p>
            )}
          </div>

          {/* Booking source */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="booking-source">
              Πηγή Κράτησης
            </label>
            <select
              id="booking-source"
              className={styles.formSelect}
              value={bookingSource}
              onChange={(e) => setBookingSource(e.target.value)}
            >
              {BOOKING_SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className={styles.modalActions}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !roomId || !guestName}
            >
              {isSubmitting ? "Αποθήκευση…" : "Επιβεβαίωση"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
