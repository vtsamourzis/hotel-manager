"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEnergyStore } from "@/lib/store/energy-store";
import { EnergyChart } from "./EnergyChart";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { RoomPowerBars } from "./RoomPowerBars";
import styles from "./energy.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimeRange = "today" | "week" | "month";

interface HourlyPoint {
  hour: string;
  ac: number;
  lighting: number;
  boilers: number;
  other: number;
}

interface EnergyApiResponse {
  hourly: HourlyPoint[];
  currentStats: {
    totalPowerKw: number;
    todayKwh: number;
    savingsKwh: number;
  };
}

// ---------------------------------------------------------------------------
// Range labels (Greek)
// ---------------------------------------------------------------------------

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "today", label: "\u03A3\u03AE\u03BC\u03B5\u03C1\u03B1" },
  { value: "week", label: "\u0395\u03B2\u03B4\u03BF\u03BC\u03AC\u03B4\u03B1" },
  { value: "month", label: "\u039C\u03AE\u03BD\u03B1\u03C2" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EnergyPage() {
  const [range, setRange] = useState<TimeRange>("today");

  // Live stat chip values from Zustand store (pushed via SSE)
  const totalPowerKw = useEnergyStore((s) => s.totalPowerKw);
  const todayKwh = useEnergyStore((s) => s.todayKwh);
  const savingsKwh = useEnergyStore((s) => s.savingsKwh);

  // Chart data from API route (refetches when range changes)
  const { data, isLoading } = useQuery<EnergyApiResponse>({
    queryKey: ["energy", range],
    queryFn: async () => {
      const res = await fetch(`/api/energy?range=${range}`);
      if (!res.ok) throw new Error("Failed to fetch energy data");
      return res.json() as Promise<EnergyApiResponse>;
    },
  });

  return (
    <div className={`${styles.energyPage} page-scroll`}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>{"\u0395\u03BD\u03AD\u03C1\u03B3\u03B5\u03B9\u03B1"}</h2>
        <div className={styles.rangeGroup}>
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.rangeBtn} ${range === opt.value ? styles.rangeBtnActive : ""}`}
              onClick={() => setRange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat chips */}
      <div className={styles.statRow}>
        <div className={styles.statChip}>
          <div className={styles.statAccent} />
          <div className={styles.statValue}>{totalPowerKw.toFixed(1)}</div>
          <div className={styles.statLabel}>{"kW \u03C4\u03CE\u03C1\u03B1"}</div>
        </div>
        <div className={styles.statChip}>
          <div className={styles.statAccent} />
          <div className={styles.statValue}>{todayKwh.toFixed(1)}</div>
          <div className={styles.statLabel}>{"kWh \u03C3\u03AE\u03BC\u03B5\u03C1\u03B1"}</div>
        </div>
        <div className={styles.statChip}>
          <div className={`${styles.statAccent} ${styles.statAccentSage}`} />
          <div className={styles.statValue}>{savingsKwh.toFixed(1)}</div>
          <div className={styles.statLabel}>{"kWh \u03B5\u03BE\u03BF\u03B9\u03BA\u03BF\u03BD\u03CC\u03BC\u03B7\u03C3\u03B7"}</div>
        </div>
      </div>

      {/* Stacked area chart */}
      <div className={styles.chartCard}>
        <div className={styles.sectionTitle}>
          {"\u039A\u03B1\u03C4\u03B1\u03BD\u03AC\u03BB\u03C9\u03C3\u03B7 \u03B1\u03BD\u03AC \u039A\u03B1\u03C4\u03B7\u03B3\u03BF\u03C1\u03AF\u03B1"}
        </div>
        {isLoading ? (
          <div className={styles.chartSkeleton} />
        ) : (
          <EnergyChart data={data?.hourly ?? []} range={range} />
        )}
      </div>

      {/* Category breakdown (donut + bars) */}
      <CategoryBreakdown />

      {/* Per-room power bars */}
      <RoomPowerBars />
    </div>
  );
}
