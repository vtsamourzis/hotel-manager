"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/store/ui-store";
import { useRoomStore } from "@/lib/store/room-store";
import { guardOffline } from "@/lib/hooks/useServerOnline";
import { ROOMS } from "@/lib/ha/entity-map";
import styles from "./rooms.module.css";

const BOOKING_SOURCES = ["Airbnb", "Booking.com", "Direct", "Walk-in"] as const;

// Generate 24h time slots at 30-min intervals: "00:00", "00:30", "01:00", ..., "23:30"
const TIME_SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

/** Format a Date as DD-MM-YYYY for display */
function formatDMY(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

/** Parse DD-MM-YYYY back to YYYY-MM-DD for API/Date constructor */
function dmyToISO(dmy: string): string {
  const [dd, mm, yyyy] = dmy.split("-");
  return `${yyyy}-${mm}-${dd}`;
}

function todayDMY() {
  return formatDMY(new Date());
}

function tomorrowDMY() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDMY(d);
}

/** Round current time to nearest 30-min slot */
function nearestTimeSlot(): string {
  const now = new Date();
  const minutes = now.getMinutes() >= 30 ? 30 : 0;
  return `${String(now.getHours()).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function CheckInModal() {
  const { isCheckinModalOpen, closeCheckinModal, selectedRoomId, serverOnline } = useUIStore();
  const rooms = useRoomStore((s) => s.rooms);

  const availableRooms = ROOMS.filter(
    (id) => rooms[id]?.status === "Vacant" || rooms[id]?.status === "Preparing"
  );

  const defaultRoom =
    selectedRoomId && availableRooms.includes(selectedRoomId as (typeof ROOMS)[number])
      ? selectedRoomId
      : availableRooms[0] ?? "";

  const [guestName, setGuestName]         = useState("");
  const [checkInDate, setCheckInDate]     = useState(todayDMY);
  const [checkInTime, setCheckInTime]     = useState(nearestTimeSlot);
  const [checkOutDate, setCheckOutDate]   = useState(tomorrowDMY);
  const [checkOutTime, setCheckOutTime]   = useState("12:00");
  const [roomId, setRoomId]               = useState(defaultRoom);
  const [bookingSource, setBookingSource] = useState<string>("Direct");
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const queryClient = useQueryClient();

  if (!isCheckinModalOpen) return null;

  const handleClose = () => {
    closeCheckinModal();
    setGuestName("");
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardOffline(serverOnline)) return;
    if (!roomId || !guestName || !checkInDate || !checkOutDate) return;

    closeCheckinModal();

    try {
      const checkIn = new Date(`${dmyToISO(checkInDate)}T${checkInTime}`).toISOString();
      const checkOut = new Date(`${dmyToISO(checkOutDate)}T${checkOutTime}`).toISOString();

      const res = await fetch(`/api/rooms/${roomId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName, checkIn, checkOut, bookingSource }),
      });

      if (!res.ok) throw new Error("checkin failed");

      // Refresh the schedule timeline on the overview page
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
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

          {/* Check-in date + time */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Ημ/νία & Ώρα Άφιξης</label>
            <div className={styles.dateTimeRow}>
              <input
                type="text"
                inputMode="numeric"
                className={styles.formInput}
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                placeholder="ΗΗ-ΜΜ-ΕΕΕΕ"
                pattern="\d{2}-\d{2}-\d{4}"
                required
              />
              <select
                className={styles.formSelect}
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Check-out date + time */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Ημ/νία & Ώρα Αναχώρησης</label>
            <div className={styles.dateTimeRow}>
              <input
                type="text"
                inputMode="numeric"
                className={styles.formInput}
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                placeholder="ΗΗ-ΜΜ-ΕΕΕΕ"
                pattern="\d{2}-\d{2}-\d{4}"
                required
              />
              <select
                className={styles.formSelect}
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Room selector */}
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
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className={styles.modalActions}>
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Ακύρωση
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !roomId || !guestName || !serverOnline}
              style={{ opacity: serverOnline ? 1 : 0.5, cursor: serverOnline ? "pointer" : "not-allowed" }}
            >
              {isSubmitting ? "Αποθήκευση…" : "Επιβεβαίωση"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
