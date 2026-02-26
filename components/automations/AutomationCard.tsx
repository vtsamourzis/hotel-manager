"use client";

import { useCallback } from "react";
import { Wind, Eye, Sparkles, Leaf, Sun, Moon, Timer } from "lucide-react";
import { useAutomationsStore } from "@/lib/store/automations-store";
import { useUIStore } from "@/lib/store/ui-store";
import { guardOffline } from "@/lib/hooks/useServerOnline";
import styles from "./automations.module.css";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  wind: Wind,
  eye: Eye,
  sparkles: Sparkles,
  leaf: Leaf,
  sun: Sun,
  moon: Moon,
  timer: Timer,
};

interface AutomationCardProps {
  automation: {
    id: string;
    entityId: string;
    label: string;
    desc: string;
    icon: string;
    enabled: boolean;
    lastTriggered: string | null;
  };
}

/** Format a relative time string in Greek */
function relativeTime(isoString: string | null): string {
  if (!isoString) return "Ποτέ";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Μόλις τώρα";
  if (minutes < 60) return `πριν ${minutes} λεπτά`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `πριν ${hours} ώρ${hours === 1 ? "α" : "ες"}`;
  const days = Math.floor(hours / 24);
  return `πριν ${days} ημέρ${days === 1 ? "α" : "ες"}`;
}

export function AutomationCard({ automation }: AutomationCardProps) {
  const { id, entityId, label, desc, icon, enabled, lastTriggered } =
    automation;

  const IconComponent = ICON_MAP[icon] ?? Wind;
  const serverOnline = useUIStore((s) => s.serverOnline);

  const handleToggle = useCallback(async () => {
    if (guardOffline(serverOnline)) return;
    const newEnabled = !enabled;
    const rollback = useAutomationsStore
      .getState()
      .optimisticToggle(entityId, newEnabled);

    try {
      const res = await fetch(`/api/automations/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newEnabled }),
      });

      if (!res.ok) {
        rollback();
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              message: "Αποτυχία εναλλαγής αυτοματισμού",
              type: "error",
            },
          })
        );
      }
    } catch {
      rollback();
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            message: "Αποτυχία εναλλαγής αυτοματισμού",
            type: "error",
          },
        })
      );
    }
  }, [id, entityId, enabled, serverOnline]);

  return (
    <div
      className={`${styles.card} ${!enabled ? styles.cardDisabled : ""}`}
    >
      {/* 3px accent bar */}
      <div
        className={styles.cardAccent}
        style={{
          background: enabled ? "var(--aegean)" : "var(--border-2)",
        }}
      />

      <div className={styles.cardBody}>
        {/* Top row: icon + toggle */}
        <div className={styles.cardTopRow}>
          <div className={styles.iconWrap}>
            <IconComponent size={18} />
          </div>
          <div className={styles.cardRight}>
            <div
              className={styles.statusDot}
              style={{
                background: enabled ? "var(--sage)" : "var(--ink-4)",
              }}
            />
            <button
              className={styles.toggleBtn}
              onClick={handleToggle}
              aria-label={`${enabled ? "Απενεργοποίηση" : "Ενεργοποίηση"} ${label}`}
              style={{ opacity: serverOnline ? 1 : 0.5, cursor: serverOnline ? "pointer" : "not-allowed" }}
            >
              <span
                className={`${styles.toggleTrack} ${enabled ? styles.toggleOn : styles.toggleOff}`}
              >
                <span className={styles.toggleThumb} />
              </span>
            </button>
          </div>
        </div>

        {/* Label + description */}
        <div className={styles.cardLabel}>{label}</div>
        <div className={styles.cardDesc}>{desc}</div>

        {/* Last triggered */}
        <div className={styles.lastRun}>{relativeTime(lastTriggered)}</div>
      </div>
    </div>
  );
}
