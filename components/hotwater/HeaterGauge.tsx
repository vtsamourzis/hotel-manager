"use client";

/**
 * HeaterGauge -- SVG semicircular gauge for a central solar heater.
 *
 * Pure display component: reads temperature and element state from store (SSE).
 * No client-side simulation. All hysteresis and heating logic runs in HA automations.
 *
 * Hand-built SVG arc (no library). Animated fill via CSS transition on
 * stroke-dashoffset. Color transitions: cold (blue) -> warm (amber) -> hot (red).
 *
 * Visual indicators on the arc: min marker (amber dot), max marker (red dot),
 * zone highlight arc between min/max, tip dot at current temperature.
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
  index: number;
  onElementToggle: (on: boolean) => void;
  onSetMin: (val: number) => void;
  onSetMax: (val: number) => void;
  onSetSimTemp: (val: number) => void;
  compact?: boolean;
}

// SVG geometry
const CX = 100;
const CY = 110;
const R = 80;
const ARC_CIRCUMFERENCE = Math.PI * R; // ~251.3

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

/** Convert a temperature to a point on the semicircular arc */
function tempToPoint(temp: number): { x: number; y: number } {
  const p = tempToPercent(temp);
  const angle = Math.PI * (1 - p);
  return {
    x: CX + R * Math.cos(angle),
    y: CY - R * Math.sin(angle),
  };
}

/** Build an SVG arc path between two temperatures on the semicircle */
function arcBetween(temp1: number, temp2: number): string {
  const p1 = tempToPoint(temp1);
  const p2 = tempToPoint(temp2);
  const a1 = Math.PI * (1 - tempToPercent(temp1));
  const a2 = Math.PI * (1 - tempToPercent(temp2));
  const largeArc = Math.abs(a1 - a2) > Math.PI ? 1 : 0;
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${R} ${R} 0 ${largeArc} 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
}

export default function HeaterGauge({
  heater,
  index,
  onElementToggle,
  onSetMin,
  onSetMax,
  onSetSimTemp,
  compact = false,
}: HeaterGaugeProps) {
  // Local slider state -- API only fires on mouseUp/touchEnd
  const [localMin, setLocalMin] = useState(heater.minThreshold);
  const [localMax, setLocalMax] = useState(heater.maxThreshold);

  // Sync local state when store pushes new values (SSE update)
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

  // Simulation slider: local state for drag UX, fires API on release
  const [localSimTemp, setLocalSimTemp] = useState(Math.round(heater.temp));

  // Sync from SSE when user is not dragging
  const [prevSimTemp, setPrevSimTemp] = useState(Math.round(heater.temp));
  if (Math.round(heater.temp) !== prevSimTemp) {
    setPrevSimTemp(Math.round(heater.temp));
    setLocalSimTemp(Math.round(heater.temp));
  }

  // Display reads directly from store (SSE) -- no local simulation
  const displayTemp = heater.temp;
  const percent = tempToPercent(displayTemp);
  const dashoffset = ARC_CIRCUMFERENCE * (1 - percent);
  const strokeColor = tempToColor(displayTemp);

  // Marker positions on the arc
  const tipPoint = tempToPoint(displayTemp);
  const minPoint = tempToPoint(localMin);
  const maxPoint = tempToPoint(localMax);

  // Zone highlight arc path (min -> max range)
  const zoneArcD =
    localMin < localMax ? arcBetween(localMin, localMax) : undefined;

  // Element state comes directly from HA via SSE
  const elementActive = heater.elementOn;

  const handleMinRelease = useCallback(() => {
    onSetMin(localMin);
  }, [localMin, onSetMin]);

  const handleMaxRelease = useCallback(() => {
    onSetMax(localMax);
  }, [localMax, onSetMax]);

  const handleSimRelease = useCallback(() => {
    onSetSimTemp(localSimTemp);
  }, [localSimTemp, onSetSimTemp]);

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

            {/* Zone highlight arc: min->max comfort range */}
            {zoneArcD && (
              <path
                d={zoneArcD}
                fill="none"
                stroke="rgba(210, 145, 45, 0.18)"
                strokeWidth={12}
                strokeLinecap="butt"
              />
            )}

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

            {/* Min threshold marker (amber dot) */}
            <circle
              cx={minPoint.x.toFixed(1)}
              cy={minPoint.y.toFixed(1)}
              r={4}
              fill="hsl(38, 76%, 48%)"
            />

            {/* Max threshold marker (red dot) */}
            <circle
              cx={maxPoint.x.toFixed(1)}
              cy={maxPoint.y.toFixed(1)}
              r={4}
              fill="hsl(8, 56%, 44%)"
            />

            {/* Tip dot at current temperature */}
            <circle
              cx={tipPoint.x.toFixed(1)}
              cy={tipPoint.y.toFixed(1)}
              r={5.5}
              fill="var(--surface-1)"
              stroke={strokeColor}
              strokeWidth={2.5}
            />

            {/* Temperature value */}
            <text x="100" y="92" className={styles.gaugeTempText}>
              {Math.round(displayTemp)}
            </text>
            <text x="100" y="110" className={styles.gaugeTempUnit}>
              °C
            </text>
          </svg>

          <div className={styles.gaugeLabel}>Ηλιακός {index + 1}</div>
        </div>

        {/* Electric element toggle -- state from HA via SSE */}
        <div className={styles.elementRow}>
          <span className={styles.elementLabel}>
            Αντίσταση:{" "}
            <span
              className={`${styles.elementStatus} ${
                elementActive
                  ? styles.elementStatusOn
                  : styles.elementStatusOff
              }`}
            >
              {elementActive ? "ON" : "OFF"}
            </span>
          </span>
          <button
            type="button"
            className={`${styles.toggleSwitch} ${
              elementActive ? styles.toggleSwitchOn : ""
            }`}
            onClick={() => onElementToggle(!heater.elementOn)}
            aria-label={`Αντίσταση Ηλιακός ${index + 1}`}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        {/* Simulation: current temperature slider -- writes to HA on release */}
        <div className={styles.simSection}>
          <div className={styles.simHeader}>Προσομοίωση Αισθητήρα</div>
          <div className={styles.sliderGroup}>
            <span className={styles.sliderLabel}>Θερμοκρ.</span>
            <input
              type="range"
              min={5}
              max={90}
              step={1}
              value={localSimTemp}
              onChange={(e) => setLocalSimTemp(Number(e.target.value))}
              onMouseUp={handleSimRelease}
              onTouchEnd={handleSimRelease}
              className={`${styles.sliderInput} ${styles.sliderSim}`}
            />
            <span className={styles.sliderValue}>{localSimTemp}°C</span>
          </div>
          <div className={styles.simHint}>
            Σύρετε κάτω από την ελάχιστη → αντίσταση ON → αυτόματη θέρμανση
          </div>
        </div>

        {/* Threshold sliders */}
        <div className={styles.sliderGroup}>
          <span className={`${styles.sliderLabel} ${styles.sliderLabelAmber}`}>
            Ελάχιστη
          </span>
          <input
            type="range"
            min={20}
            max={80}
            step={1}
            value={localMin}
            onChange={(e) => setLocalMin(Number(e.target.value))}
            onMouseUp={handleMinRelease}
            onTouchEnd={handleMinRelease}
            className={`${styles.sliderInput} ${styles.sliderAmber}`}
          />
          <span className={`${styles.sliderValue} ${styles.sliderValueAmber}`}>
            {localMin}°C
          </span>
        </div>
        <div className={styles.sliderGroup}>
          <span className={`${styles.sliderLabel} ${styles.sliderLabelClay}`}>
            Μέγιστη
          </span>
          <input
            type="range"
            min={20}
            max={80}
            step={1}
            value={localMax}
            onChange={(e) => setLocalMax(Number(e.target.value))}
            onMouseUp={handleMaxRelease}
            onTouchEnd={handleMaxRelease}
            className={`${styles.sliderInput} ${styles.sliderClay}`}
          />
          <span className={`${styles.sliderValue} ${styles.sliderValueClay}`}>
            {localMax}°C
          </span>
        </div>
      </div>
    </div>
  );
}
