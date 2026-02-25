"use client";

/**
 * HeaterGauge -- SVG semicircular gauge for a central solar heater.
 *
 * Hand-built SVG arc (no library). Animated fill via CSS transition on
 * stroke-dashoffset. Color transitions: cold (blue) -> warm (amber) -> hot (red).
 *
 * Threshold sliders follow Phase 2 pattern: update local state on onChange,
 * call API only on mouseUp/touchEnd to prevent API floods.
 */
import { useState, useCallback } from "react";
import styles from "./hotwater.module.css";

interface CentralHeater {
  id: string;
  temp: number;
  collectorTemp: number;
  elementOn: boolean;
  minThreshold: number;
  maxThreshold: number;
}

interface HeaterGaugeProps {
  heater: CentralHeater;
  /** Index for display label: "Ηλιακός 1" or "Ηλιακός 2" */
  index: number;
  onElementToggle: (on: boolean) => void;
  onSetMin: (val: number) => void;
  onSetMax: (val: number) => void;
  /** If true, render a smaller gauge for variant B inline layout */
  compact?: boolean;
}

// Half-circle arc circumference: pi * radius = pi * 80 = ~251.3
const ARC_CIRCUMFERENCE = Math.PI * 80;

// Temperature range for gauge display
const TEMP_MIN = 20;
const TEMP_MAX = 80;

function tempToPercent(temp: number): number {
  return Math.max(0, Math.min(1, (temp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)));
}

function tempToColor(temp: number): string {
  if (temp < 35) return "var(--aegean)";
  if (temp <= 55) return "var(--amber)";
  return "var(--clay)";
}

export default function HeaterGauge({
  heater,
  index,
  onElementToggle,
  onSetMin,
  onSetMax,
  compact = false,
}: HeaterGaugeProps) {
  // Local slider state -- API only fires on mouseUp/touchEnd (Phase 2 pattern)
  const [localMin, setLocalMin] = useState(heater.minThreshold);
  const [localMax, setLocalMax] = useState(heater.maxThreshold);

  // Sync local state when store pushes new values (SSE update)
  // We compare against heater props -- if they changed externally, update local
  const [prevMin, setPrevMin] = useState(heater.minThreshold);
  const [prevMax, setPrevMax] = useState(heater.maxThreshold);
  if (heater.minThreshold !== prevMin) {
    setPrevMin(heater.minThreshold);
    setLocalMin(heater.minThreshold);
  }
  if (heater.maxThreshold !== prevMax) {
    setPrevMax(heater.maxThreshold);
    setLocalMax(heater.maxThreshold);
  }

  const percent = tempToPercent(heater.temp);
  const dashoffset = ARC_CIRCUMFERENCE * (1 - percent);
  const strokeColor = tempToColor(heater.temp);

  const handleMinRelease = useCallback(() => {
    onSetMin(localMin);
  }, [localMin, onSetMin]);

  const handleMaxRelease = useCallback(() => {
    onSetMax(localMax);
  }, [localMax, onSetMax]);

  return (
    <div className={styles.gaugeCard}>
      <div className={styles.gaugeCardAccent} />
      <div className={styles.gaugeCardBody}>
        <div className={styles.gaugeCenter}>
          {/* SVG semicircular gauge */}
          <svg
            viewBox="0 0 200 130"
            className={compact ? styles.inlineGaugeSmall : styles.gaugeSvg}
          >
            {/* Background arc */}
            <path
              d="M 20 110 A 80 80 0 0 1 180 110"
              className={styles.gaugeArcBg}
            />
            {/* Filled arc */}
            <path
              d="M 20 110 A 80 80 0 0 1 180 110"
              className={styles.gaugeArcFill}
              style={{
                stroke: strokeColor,
                strokeDasharray: ARC_CIRCUMFERENCE,
                strokeDashoffset: dashoffset,
              }}
            />
            {/* Temperature value */}
            <text x="100" y="92" className={styles.gaugeTempText}>
              {Math.round(heater.temp)}
            </text>
            <text x="100" y="110" className={styles.gaugeTempUnit}>
              °C
            </text>
          </svg>

          <div className={styles.gaugeLabel}>
            Ηλιακός {index + 1}
          </div>
          <div className={styles.collectorLabel}>
            Συλλέκτης: {Math.round(heater.collectorTemp)}°C
          </div>
        </div>

        {/* Electric element toggle */}
        <div className={styles.elementRow}>
          <span className={styles.elementLabel}>
            Αντίσταση:{" "}
            <span
              className={`${styles.elementStatus} ${
                heater.elementOn ? styles.elementStatusOn : styles.elementStatusOff
              }`}
            >
              {heater.elementOn ? "ON" : "OFF"}
            </span>
          </span>
          <button
            type="button"
            className={`${styles.toggleSwitch} ${
              heater.elementOn ? styles.toggleSwitchOn : ""
            }`}
            onClick={() => onElementToggle(!heater.elementOn)}
            aria-label={`Αντίσταση Ηλιακός ${index + 1}`}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        {/* Threshold sliders */}
        <div className={styles.sliderGroup}>
          <span className={styles.sliderLabel}>Ελάχιστη</span>
          <input
            type="range"
            min={20}
            max={80}
            step={1}
            value={localMin}
            onChange={(e) => setLocalMin(Number(e.target.value))}
            onMouseUp={handleMinRelease}
            onTouchEnd={handleMinRelease}
            className={styles.sliderInput}
          />
          <span className={styles.sliderValue}>{localMin}°C</span>
        </div>
        <div className={styles.sliderGroup}>
          <span className={styles.sliderLabel}>Μέγιστη</span>
          <input
            type="range"
            min={20}
            max={80}
            step={1}
            value={localMax}
            onChange={(e) => setLocalMax(Number(e.target.value))}
            onMouseUp={handleMaxRelease}
            onTouchEnd={handleMaxRelease}
            className={styles.sliderInput}
          />
          <span className={styles.sliderValue}>{localMax}°C</span>
        </div>
      </div>
    </div>
  );
}
