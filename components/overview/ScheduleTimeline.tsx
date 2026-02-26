"use client";

import { useQuery } from "@tanstack/react-query";
import { useUIStore } from "@/lib/store/ui-store";
import type { Booking } from "@/lib/db/bookings";
import styles from "./overview.module.css";

interface BookingsResponse {
  checkIns: Booking[];
  checkOuts: Booking[];
  bookings: Booking[];
}

interface TimelineEvent {
  id: string;
  time: string;
  type: "arrival" | "checkout";
  typeLabel: string;
  roomId: string;
  guestName: string;
  /** Whether check-in time has passed */
  isPast: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function SkeletonEvents() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.evSkeleton}>
          <div className={styles.skeletonLine} style={{ width: "30px" }} />
          <div style={{ flex: 1 }}>
            <div className={styles.skeletonLine} style={{ width: "70%" }} />
            <div className={styles.skeletonLine} style={{ width: "50%", marginTop: "6px" }} />
          </div>
        </div>
      ))}
    </>
  );
}

export function ScheduleTimeline() {
  const today = new Date().toISOString().split("T")[0];
  const selectRoom = useUIStore((s) => s.selectRoom);

  const { data, isLoading } = useQuery<BookingsResponse>({
    queryKey: ["bookings", today],
    queryFn: () =>
      fetch(`/api/bookings?date=${today}`).then((r) => r.json()),
    staleTime: 2 * 60 * 1000,
  });

  const now = new Date();

  // Build unified timeline
  const events: TimelineEvent[] = [];

  for (const b of data?.checkIns ?? []) {
    const t = new Date(b.check_in);
    events.push({
      id: `ci-${b.id}`,
      time: formatTime(b.check_in),
      type: "arrival",
      typeLabel: "\u0386\u03C6\u03B9\u03BE\u03B7",
      roomId: b.room_id,
      guestName: b.guest_name,
      isPast: t <= now,
    });
  }

  for (const b of data?.checkOuts ?? []) {
    const t = new Date(b.check_out);
    events.push({
      id: `co-${b.id}`,
      time: formatTime(b.check_out),
      type: "checkout",
      typeLabel: "\u0391\u03BD\u03B1\u03C7\u03CE\u03C1\u03B7\u03C3\u03B7",
      roomId: b.room_id,
      guestName: b.guest_name,
      isPast: t <= now,
    });
  }

  // Sort chronologically
  events.sort((a, b) => a.time.localeCompare(b.time));

  // Date info for header
  const dateStr = now.toLocaleDateString("el-GR", {
    day: "numeric",
    month: "long",
  });
  const dayName = now.toLocaleDateString("el-GR", { weekday: "long" });
  const dayCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  return (
    <div className={styles.timelineCard}>
      <div className={styles.cardHeader}>
        <div>
          <span className={styles.cardTitle}>{"\u03A3\u03AE\u03BC\u03B5\u03C1\u03B1"}</span>
          <div className={styles.cardSub}>
            {dateStr} {"\u00B7"} {events.length} {"\u03BA\u03B9\u03BD\u03AE\u03C3\u03B5\u03B9\u03C2"}
          </div>
        </div>
        <span className={styles.dayChip}>{dayCapitalized}</span>
      </div>

      {isLoading ? (
        <SkeletonEvents />
      ) : events.length === 0 ? (
        <div className={styles.evEmpty}>
          {"\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03B1\u03C6\u03AF\u03BE\u03B5\u03B9\u03C2 \u03AE \u03B1\u03BD\u03B1\u03C7\u03C9\u03C1\u03AE\u03C3\u03B5\u03B9\u03C2 \u03C3\u03AE\u03BC\u03B5\u03C1\u03B1"}
        </div>
      ) : (
        events.map((ev) => (
          <div
            key={ev.id}
            className={`${styles.ev} ${ev.type === "arrival" ? styles.evUpcoming : styles.evUrgent} ${ev.isPast ? styles.evDone : ""}`}
            onClick={() => selectRoom(ev.roomId)}
          >
            <div className={styles.evTime}>{ev.time}</div>
            <div className={styles.evBody}>
              <div className={styles.evRow1}>
                <span
                  className={`${styles.evTypePill} ${ev.type === "arrival" ? styles.evPillArrival : styles.evPillCheckout}`}
                >
                  {ev.typeLabel}
                </span>
                <span className={styles.evRoomChip}>
                  {"\u0394\u03C9\u03BC. "}{ev.roomId}
                </span>
                {ev.isPast && (
                  <span className={styles.evDoneTag}>
                    {"\u039F\u03BB\u03BF\u03BA\u03BB\u03B7\u03C1\u03CE\u03B8\u03B7\u03BA\u03B5"}
                  </span>
                )}
                {!ev.isPast && ev.type === "checkout" && (
                  <span className={styles.evUrgentTag}>
                    {"\u26A0 \u0395\u03BA\u03BA\u03C1\u03B5\u03BC\u03B5\u03AF"}
                  </span>
                )}
              </div>
              <div className={`${styles.evGuest} ${ev.isPast ? styles.evGuestMuted : ""}`}>
                {ev.guestName}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
