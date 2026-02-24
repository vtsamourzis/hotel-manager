"use client";

import { Sun, Zap, Droplets } from "lucide-react";
import type { HAEntityState } from "@/lib/ha/types";
import styles from "../rooms.module.css";

interface BoilerPanelProps {
  boilerSource: HAEntityState | null;
  hotWaterTemp: HAEntityState | null;
}

export function BoilerPanel({ boilerSource, hotWaterTemp }: BoilerPanelProps) {
  const source = boilerSource?.state ?? null;
  const temp = hotWaterTemp?.state != null ? Number(hotWaterTemp.state) : null;

  const isSolar = source === "Solar";
  const isElectrical = source === "Electrical";

  return (
    <div className={styles.boilerRow}>
      {isSolar ? (
        <Sun size={18} className={styles.boilerIcon} aria-label="Ηλιακός" />
      ) : isElectrical ? (
        <Zap size={18} className={styles.boilerIconElectric} aria-label="Ηλεκτρικός" />
      ) : (
        <Droplets size={18} color="var(--ink-4)" aria-label="Άγνωστη πηγή" />
      )}
      <span className={styles.boilerLabel}>
        {isSolar
          ? "Ηλιακός θερμοσίφωνας"
          : isElectrical
          ? "Ηλεκτρικός θερμοσίφωνας"
          : "Θερμοσίφωνας"}
      </span>
      <span className={styles.boilerTemp}>
        {temp != null ? `${temp}°C` : "—"}
      </span>
    </div>
  );
}
