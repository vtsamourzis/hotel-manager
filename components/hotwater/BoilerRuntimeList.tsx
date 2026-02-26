"use client";

/**
 * BoilerRuntimeList -- per-room boiler on/off toggle + runtime progress bars.
 * Grouped by floor (1ος, 2ος, 3ος).
 *
 * Runtime bar colors:
 * - sage (< 30 min)
 * - amber (30-45 min)
 * - clay (> 45 min) with auto-shutoff warning badge
 */
import { useCallback } from "react";
import { useHotWaterStore } from "@/lib/store/hotwater-store";
import { useUIStore } from "@/lib/store/ui-store";
import { guardOffline } from "@/lib/hooks/useServerOnline";
import { FLOOR_ROOMS, type RoomId } from "@/lib/ha/entity-map";
import styles from "./hotwater.module.css";

const MAX_RUNTIME = 60; // minutes

const FLOOR_LABELS: Record<string, string> = {
  "1": "1ος Όροφος",
  "2": "2ος Όροφος",
  "3": "3ος Όροφος",
};

function runtimeColor(runtime: number): string {
  if (runtime > 45) return styles.boilerFillClay;
  if (runtime >= 30) return styles.boilerFillAmber;
  return styles.boilerFillSage;
}

export default function BoilerRuntimeList() {
  const roomBoilers = useHotWaterStore((s) => s.roomBoilers);
  const serverOnline = useUIStore((s) => s.serverOnline);

  const handleToggle = useCallback((roomId: string, currentOn: boolean) => {
    if (guardOffline(serverOnline)) return;
    fetch(`/api/hotwater/boiler/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", value: !currentOn }),
    });
  }, [serverOnline]);

  // Build a lookup for quick access
  const boilerMap = new Map(roomBoilers.map((b) => [b.roomId, b]));

  return (
    <div className={styles.boilerList}>
      <div className={styles.boilerListHeader}>Θερμοσίφωνες Δωματίων</div>

      {(Object.entries(FLOOR_ROOMS) as [string, RoomId[]][]).map(
        ([floor, rooms]) => (
          <div key={floor}>
            <div className={styles.floorHeader}>{FLOOR_LABELS[floor]}</div>
            {rooms.map((roomId) => {
              const boiler = boilerMap.get(roomId);
              if (!boiler) return null;

              const widthPercent = boiler.on
                ? Math.min((boiler.runtime / MAX_RUNTIME) * 100, 100)
                : 0;

              return (
                <div key={roomId} className={styles.boilerRow}>
                  <span className={styles.boilerRoomNum}>{roomId}</span>

                  {/* Toggle switch */}
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${
                      boiler.on ? styles.toggleSwitchOn : ""
                    }`}
                    onClick={() => handleToggle(roomId, boiler.on)}
                    aria-label={`Θερμοσίφωνας ${roomId}`}
                    style={{ opacity: serverOnline ? 1 : 0.5, cursor: serverOnline ? "pointer" : "not-allowed" }}
                  >
                    <span className={styles.toggleKnob} />
                  </button>

                  {boiler.on ? (
                    <>
                      {/* Runtime bar */}
                      <div className={styles.boilerBar}>
                        <div
                          className={`${styles.boilerFill} ${runtimeColor(boiler.runtime)}`}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                      <span className={styles.boilerRuntime}>
                        {boiler.runtime} λεπτά
                      </span>
                      {boiler.runtime > 50 && (
                        <span className={styles.boilerWarning}>
                          Σύντομη απενεργοποίηση
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={styles.boilerOff}>Απενεργοποιημένος</span>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
