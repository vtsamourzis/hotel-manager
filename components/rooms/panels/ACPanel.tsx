"use client";

import { useState, useEffect } from "react";
import { Thermometer, Wind, Sun, Snowflake } from "lucide-react";
import type { HAEntityState } from "@/lib/ha/types";
import styles from "../rooms.module.css";

interface ACPanelProps {
  roomId: string;
  acState: HAEntityState | null;
}

const HVAC_MODES = [
  { value: "heat", label: "Θέρμανση", icon: <Sun size={13} /> },
  { value: "cool", label: "Ψύξη",     icon: <Snowflake size={13} /> },
  { value: "auto", label: "Αυτόματο", icon: <Wind size={13} /> },
] as const;

export function ACPanel({ roomId, acState }: ACPanelProps) {
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

  const callAC = (payload: Record<string, unknown>) => {
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
    callAC({ mode: isOn ? "off" : "auto" });
  };

  const handleMode = (mode: string) => {
    callAC({ mode });
  };

  const handleTempCommit = () => {
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
        <label className={styles.toggle} aria-label="Ενεργοποίηση κλιματιστικού">
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
        <div className={styles.acControls}>
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
            {HVAC_MODES.map(({ value, label, icon }) => (
              <button
                key={value}
                className={`${styles.acModeBtn} ${currentMode === value ? styles.acModeBtnActive : ""}`}
                onClick={() => handleMode(value)}
                aria-pressed={currentMode === value}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
