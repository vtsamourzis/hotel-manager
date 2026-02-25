"use client";

import styles from "./automations.module.css";

interface LogEntry {
  timestamp: string;
  automationId: string;
  automationLabel: string;
  detail: string;
  room?: string;
}

interface ActivityLogProps {
  entries?: LogEntry[];
}

/** Format timestamp as DD/MM HH:mm in Greek locale */
function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("el-GR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.logSkeleton}>
          <div className={`${styles.skeletonLine} ${styles.skeletonLineFull}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
        </div>
      ))}
    </>
  );
}

export function ActivityLog({ entries }: ActivityLogProps) {
  const loading = entries === undefined;

  return (
    <section className={styles.logSection}>
      <h2 className={styles.logTitle}>Ιστορικό Εκτελέσεων</h2>
      <div className={styles.logCard}>
        {loading ? (
          <SkeletonRows />
        ) : entries.length === 0 ? (
          <div className={styles.logSkeleton}>
            <div
              style={{
                fontSize: "12px",
                color: "var(--ink-3)",
                padding: "8px 0",
              }}
            >
              Δεν υπάρχουν εκτελέσεις.
            </div>
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div key={`${entry.automationId}-${idx}`} className={styles.logEntry}>
              <div className={styles.logTimestamp}>
                {formatTimestamp(entry.timestamp)}
              </div>
              <div className={styles.logContent}>
                <div className={styles.logAutomation}>
                  {entry.automationLabel}
                  {entry.room && (
                    <span className={styles.logRoomPill}>
                      Δωμ. {entry.room}
                    </span>
                  )}
                </div>
                <div className={styles.logDetail}>{entry.detail}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
