"use client";

import { useState, useEffect } from "react";
import { Thermometer, Wind, Sun, Snowflake } from "lucide-react";
import { useRoomStore } from "@/lib/store/room-store";
import { useUIStore } from "@/lib/store/ui-store";
import { guardOffline } from "@/lib/hooks/useServerOnline";
import type { HAEntityState } from "@/lib/ha/types";
import styles from "../rooms.module.css";

interface ACPanelProps {
  roomId: string;
  acState: HAEntityState | null;
}

const HVAC_MODES = [
  { value: "heat", label: "Θέρμανση", icon: <Sun size={13} /> },
  { value: "cool", label: "Ψύξη",     icon: <Snowflake size={13} /> },
] as const;

/** Oct–Apr → heat, May–Sep → cool */
function seasonalMode(): "heat" | "cool" {
  const month = new Date().getMonth(); // 0-indexed: 0=Jan
  return month >= 4 && month <= 8 ? "cool" : "heat";
}

export function ACPanel({ roomId, acState }: ACPanelProps) {
  const optimisticUpdate = useRoomStore((s) => s.optimisticUpdate);
  const serverOnline = useUIStore((s) => s.serverOnline);

  if (!acState) {
    return <p className={styles.unavailable}>Δεν υπάρχει κλιματιστικό</p>;
  }

  const isOn = acState.state !== "off" && acState.state !== "unavailable";
  const currentMode = isOn ? acState.state : "auto";
  const currentTemp = Number(acState.attributes.temperature ?? 22);

  // Local slider state — only send API call on mouse/touch up to avoid floods
  const [sliderTemp, setSliderTemp] = useState(currentTemp);

  // Keep slider in sync when external state changes
  useEffect(() => {
    setSliderTemp(currentTemp);
  }, [currentTemp]);

  const callAC = (payload: Record<string, unknown>, optimisticState?: Partial<HAEntityState>) => {
    // Optimistic: update store instantly
    if (optimisticState && acState) {
      optimisticUpdate(roomId, {
        acState: { ...acState, ...optimisticState, attributes: { ...acState.attributes, ...optimisticState.attributes } },
      });
    }
    fetch(`/api/rooms/${roomId}/ac`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { message: "Αποτυχία σύνδεσης κλιματιστικού", type: "error" },
        })
      );
    });
  };

  const handleToggle = () => {
    if (guardOffline(serverOnline)) return;
    const newMode = isOn ? "off" : seasonalMode();
    callAC({ mode: newMode }, { state: newMode });
  };

  const handleMode = (mode: string) => {
    if (guardOffline(serverOnline)) return;
    callAC({ mode }, { state: mode });
  };

  const handleTempCommit = () => {
    if (guardOffline(serverOnline)) return;
    callAC({ temperature: sliderTemp });
  };

  return (
    <div>
      {/* Power toggle row */}
      <div className={styles.acToggleRow}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Thermometer size={15} color="var(--ink-3)" />
          <span className={styles.acLabel}>Κλιματιστικό</span>
        </div>
        <label className={styles.toggle} aria-label="Ενεργοποίηση κλιματιστικού" style={{ opacity: serverOnline ? 1 : 0.5, cursor: serverOnline ? "pointer" : "not-allowed" }}>
          <input
            type="checkbox"
            checked={isOn}
            onChange={handleToggle}
          />
          <span className={styles.toggleSlider} />
        </label>
      </div>

      {/* Controls: only when on */}
      {isOn && (
        <div className={styles.acControls} style={{ opacity: serverOnline ? 1 : 0.5, cursor: serverOnline ? "default" : "not-allowed" }}>
          {/* Temperature slider */}
          <div className={styles.acTempRow}>
            <span className={styles.acTempValue}>{sliderTemp.toFixed(1)}°</span>
            <input
              type="range"
              className={styles.acSlider}
              min={16}
              max={30}
              step={0.5}
              value={sliderTemp}
              onChange={(e) => setSliderTemp(Number(e.target.value))}
              onMouseUp={handleTempCommit}
              onTouchEnd={handleTempCommit}
              aria-label={`Θερμοκρασία: ${sliderTemp}°C`}
            />
          </div>

          {/* Mode selector */}
          <div className={styles.acModes}>
            {HVAC_MODES.map(({ value, label, icon }) => {
              const isActive = currentMode === value;
              const activeClass = isActive
                ? value === "heat" ? styles.acModeBtnHeat : styles.acModeBtnCool
                : "";
              return (
                <button
                  key={value}
                  className={`${styles.acModeBtn} ${activeClass}`}
                  onClick={() => handleMode(value)}
                  aria-pressed={isActive}
                >
                  {icon} {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
