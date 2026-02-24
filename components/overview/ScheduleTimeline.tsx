"use client";

import { useQuery } from "@tanstack/react-query";
import type { Booking } from "@/lib/db/bookings";
import styles from "./overview.module.css";

interface BookingsResponse {
  checkIns: Booking[];
  checkOuts: Booking[];
  bookings: Booking[];
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("el-GR", {
    day: "numeric",
    month: "short",
  });
}

function SkeletonLines() {
  return (
    <div>
      <div className={styles.skeletonLine} style={{ width: "90%" }} />
      <div className={styles.skeletonLine} style={{ width: "75%" }} />
      <div className={styles.skeletonLine} />
    </div>
  );
}

export function ScheduleTimeline() {
  const today = new Date().toISOString().split("T")[0];

  const { data, isLoading } = useQuery<BookingsResponse>({
    queryKey: ["bookings", today],
    queryFn: () =>
      fetch(`/api/bookings?date=${today}`).then((r) => r.json()),
    staleTime: 2 * 60 * 1000, // 2 min
  });

  const checkIns = data?.checkIns ?? [];
  const checkOuts = data?.checkOuts ?? [];
  const hasAnyEvents = checkIns.length > 0 || checkOuts.length > 0;

  return (
    <div className={styles.timelineCard}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Πρόγραμμα σήμερα</span>
        {!isLoading && hasAnyEvents && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              background: "var(--aegean-surface)",
              color: "var(--aegean-text)",
              border: "1px solid var(--aegean-border)",
              borderRadius: "var(--r-pill)",
              padding: "2px 7px",
            }}
          >
            {checkIns.length + checkOuts.length} κινήσεις
          </span>
        )}
      </div>
      <div className={styles.cardBody}>
        {isLoading ? (
          <div className={styles.timelineContent}>
            <div className={styles.timelineSection}>
              <div className={styles.timelineSectionTitle}>Αφίξεις</div>
              <SkeletonLines />
            </div>
            <div className={styles.timelineSection}>
              <div className={styles.timelineSectionTitle}>Αναχωρήσεις</div>
              <SkeletonLines />
            </div>
          </div>
        ) : !hasAnyEvents ? (
          <p className={styles.timelineEmpty}>
            Δεν υπάρχουν αφίξεις ή αναχωρήσεις σήμερα
          </p>
        ) : (
          <div className={styles.timelineContent}>
            {/* Check-ins */}
            <div className={styles.timelineSection}>
              <div className={styles.timelineSectionTitle}>
                Αφίξεις ({checkIns.length})
              </div>
              {checkIns.length === 0 ? (
                <p className={styles.timelineEmpty} style={{ fontSize: "12px" }}>
                  Καμία άφιξη
                </p>
              ) : (
                checkIns.map((booking) => (
                  <div key={booking.id} className={styles.timelineItem}>
                    <div className={styles.timelineRoom}>{booking.room_id}</div>
                    <div className={styles.timelineInfo}>
                      <div className={styles.timelineGuest}>{booking.guest_name}</div>
                      <div className={styles.timelineMeta}>
                        Έως {formatDate(booking.check_out)}
                      </div>
                    </div>
                    <span className={styles.timelineSourceBadge}>
                      {booking.booking_source}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Check-outs */}
            <div className={styles.timelineSection}>
              <div className={styles.timelineSectionTitle}>
                Αναχωρήσεις ({checkOuts.length})
              </div>
              {checkOuts.length === 0 ? (
                <p className={styles.timelineEmpty} style={{ fontSize: "12px" }}>
                  Καμία αναχώρηση
                </p>
              ) : (
                checkOuts.map((booking) => (
                  <div key={booking.id} className={styles.timelineItem}>
                    <div className={styles.timelineRoom}>{booking.room_id}</div>
                    <div className={styles.timelineInfo}>
                      <div className={styles.timelineGuest}>{booking.guest_name}</div>
                      <div className={styles.timelineMeta}>
                        Από {formatDate(booking.check_in)}
                      </div>
                    </div>
                    <span className={styles.timelineSourceBadge}>
                      {booking.booking_source}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
