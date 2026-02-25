"use client";

/**
 * HotWaterPage -- main orchestrator for the hot water management view.
 *
 * Layout variants:
 * - Variant A (enhanced-gauge): Large gauge cards at top, chart below, boiler list at bottom
 * - Variant B (rethought/dashboard): Stats strip at top, smaller gauges inline with boiler list, chart at bottom
 *
 * Toggle between variants via "Εναλλακτική Διάταξη" button at top-right.
 */
import { useState, useCallback } from "react";
import { useHotWaterStore } from "@/lib/store/hotwater-store";
import HeaterGauge from "./HeaterGauge";
import BoilerRuntimeList from "./BoilerRuntimeList";
import SolarChart from "./SolarChart";
import styles from "./hotwater.module.css";

export default function HotWaterPage() {
  const [variant, setVariant] = useState<"A" | "B">("A");
  const heaters = useHotWaterStore((s) => s.heaters);

  const bothOn = heaters.every((h) => h.elementOn);

  // Master toggle: turn both heater elements on or off simultaneously
  const handleMasterToggle = useCallback(async () => {
    const newState = !bothOn;
    const requests = heaters.map((h) =>
      fetch(`/api/hotwater/heater/${h.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "element_toggle", value: newState }),
      })
    );
    await Promise.allSettled(requests);
  }, [bothOn, heaters]);

  // Per-heater element toggle
  const handleElementToggle = useCallback((heaterId: string, on: boolean) => {
    fetch(`/api/hotwater/heater/${heaterId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "element_toggle", value: on }),
    });
  }, []);

  // Threshold setters
  const handleSetMin = useCallback((heaterId: string, val: number) => {
    fetch(`/api/hotwater/heater/${heaterId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_min", value: val }),
    });
  }, []);

  const handleSetMax = useCallback((heaterId: string, val: number) => {
    fetch(`/api/hotwater/heater/${heaterId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_max", value: val }),
    });
  }, []);

  // Stats for Variant B
  const avgTemp = heaters.length
    ? Math.round(heaters.reduce((sum, h) => sum + h.temp, 0) / heaters.length)
    : 0;
  const avgCollector = heaters.length
    ? Math.round(heaters.reduce((sum, h) => sum + h.collectorTemp, 0) / heaters.length)
    : 0;
  const activeElements = heaters.filter((h) => h.elementOn).length;

  return (
    <div className={styles.hotwaterPage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Ζεστό Νερό</h2>
        <button
          type="button"
          className={styles.variantToggle}
          onClick={() => setVariant((v) => (v === "A" ? "B" : "A"))}
        >
          {variant === "A" ? "Εναλλακτική Διάταξη" : "Κλασική Διάταξη"}
        </button>
      </div>

      {/* Master toggle */}
      <div className={styles.masterRow}>
        <button
          type="button"
          className={`${styles.masterToggle} ${bothOn ? styles.masterToggleOff : ""}`}
          onClick={handleMasterToggle}
        >
          {bothOn ? "Απενεργοποίηση Όλων" : "Ενεργοποίηση Όλων"}
        </button>
      </div>

      {variant === "A" ? (
        /* ========== Variant A: Enhanced Gauge Layout ========== */
        <>
          {/* Heater gauge cards */}
          <div className={styles.gaugeGrid}>
            {heaters.map((h, i) => (
              <HeaterGauge
                key={h.id}
                heater={h}
                index={i}
                onElementToggle={(on) => handleElementToggle(h.id, on)}
                onSetMin={(val) => handleSetMin(h.id, val)}
                onSetMax={(val) => handleSetMax(h.id, val)}
              />
            ))}
          </div>

          {/* Solar vs Electric chart */}
          <SolarChart />

          {/* Per-room boiler list */}
          <BoilerRuntimeList />
        </>
      ) : (
        /* ========== Variant B: Dashboard/Rethought Layout ========== */
        <>
          {/* Stats strip at top */}
          <div className={styles.statsStrip}>
            <div className={styles.statChip}>
              <div className={styles.statChipLabel}>Μέση Θερμ.</div>
              <div className={styles.statChipValue}>
                {avgTemp}
                <span className={styles.statChipUnit}>°C</span>
              </div>
            </div>
            <div className={styles.statChip}>
              <div className={styles.statChipLabel}>Συλλέκτης</div>
              <div className={styles.statChipValue}>
                {avgCollector}
                <span className={styles.statChipUnit}>°C</span>
              </div>
            </div>
            <div className={styles.statChip}>
              <div className={styles.statChipLabel}>Αντιστάσεις</div>
              <div className={styles.statChipValue}>
                {activeElements}
                <span className={styles.statChipUnit}>/ {heaters.length}</span>
              </div>
            </div>
          </div>

          {/* Inline: smaller gauges beside boiler list */}
          <div className={styles.inlineGrid}>
            <div>
              {heaters.map((h, i) => (
                <HeaterGauge
                  key={h.id}
                  heater={h}
                  index={i}
                  compact
                  onElementToggle={(on) => handleElementToggle(h.id, on)}
                  onSetMin={(val) => handleSetMin(h.id, val)}
                  onSetMax={(val) => handleSetMax(h.id, val)}
                />
              ))}
            </div>
            <BoilerRuntimeList />
          </div>

          {/* Solar chart at bottom */}
          <SolarChart />
        </>
      )}
    </div>
  );
}
