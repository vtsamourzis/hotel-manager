"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Label,
} from "recharts";
import { useEnergyStore } from "@/lib/store/energy-store";
import styles from "./energy.module.css";

// ---------------------------------------------------------------------------
// Category colors -- fixed HSL strings for Recharts compatibility
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<string, string> = {
  ac: "hsl(198, 72%, 24%)",
  lighting: "hsl(38, 82%, 44%)",
  boilers: "hsl(8, 60%, 43%)",
  other: "hsl(210, 18%, 50%)",
};

const CATEGORY_LABELS: Record<string, string> = {
  ac: "\u039A\u03BB\u03B9\u03BC\u03B1\u03C4\u03B9\u03C3\u03BC\u03CC\u03C2",
  lighting: "\u03A6\u03C9\u03C4\u03B9\u03C3\u03BC\u03CC\u03C2",
  boilers: "\u0398\u03B5\u03C1\u03BC\u03BF\u03C3\u03AF\u03C6\u03C9\u03BD\u03B5\u03C2",
  other: "\u039B\u03BF\u03B9\u03C0\u03AC",
};

// ---------------------------------------------------------------------------
// Custom donut tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: { id: string; color: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function DonutTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border-2)",
        borderRadius: "var(--r-sm)",
        padding: "6px 10px",
        fontSize: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: item.payload.color,
            flexShrink: 0,
          }}
        />
        <span style={{ color: "var(--ink-3)" }}>
          {CATEGORY_LABELS[item.payload.id] ?? item.name}:
        </span>
        <span style={{ fontWeight: 600 }}>{item.value.toFixed(1)} kW</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Center label renderer for Recharts <Label>
// ---------------------------------------------------------------------------

interface CenterLabelProps {
  viewBox?: { cx: number; cy: number };
  totalKw: number;
}

function CenterLabelContent({ viewBox, totalKw }: CenterLabelProps) {
  if (!viewBox) return null;
  const { cx, cy } = viewBox;
  return (
    <g>
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 20, fontWeight: 700, fill: "hsl(222, 28%, 11%)" }}
      >
        {totalKw.toFixed(1)}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: 10,
          fontWeight: 500,
          fill: "hsl(30, 7%, 50%)",
          letterSpacing: "0.04em",
        }}
      >
        kW
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CategoryBreakdown() {
  const categories = useEnergyStore((s) => s.categories);
  const totalKw = categories.reduce((sum, c) => sum + c.kw, 0);

  // Sort categories descending by kW for the horizontal bars
  const sorted = [...categories].sort((a, b) => b.kw - a.kw);

  // Pie data needs a "value" field -- avoid zero-size slices
  const pieData = categories.map((c) => ({
    id: c.id,
    name: c.label,
    value: c.kw || 0.01,
    color: c.color,
  }));

  return (
    <div className={styles.breakdownCard}>
      <div className={styles.sectionTitle}>
        {"\u039A\u03B1\u03C4\u03B1\u03BD\u03BF\u03BC\u03AE \u03B1\u03BD\u03AC \u039A\u03B1\u03C4\u03B7\u03B3\u03BF\u03C1\u03AF\u03B1"}
      </div>
      <div className={styles.breakdownGrid}>
        {/* Left column: Donut chart */}
        <div className={styles.donutWrap}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                stroke="none"
                animationDuration={800}
                animationEasing="ease-in-out"
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.color}
                    fillOpacity={0.85}
                  />
                ))}
                <Label
                  position="center"
                  content={<CenterLabelContent totalKw={totalKw} />}
                />
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Right column: Horizontal bars (pure CSS, no Recharts) */}
        <div className={styles.barsSection}>
          {sorted.map((cat) => {
            const pct = totalKw > 0 ? (cat.kw / totalKw) * 100 : 0;
            return (
              <div key={cat.id} className={styles.barRow}>
                <span
                  className={styles.barDot}
                  style={{ background: CATEGORY_COLORS[cat.id] ?? cat.color }}
                />
                <span className={styles.barLabel}>
                  {CATEGORY_LABELS[cat.id] ?? cat.label}
                </span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${pct}%`,
                      background: CATEGORY_COLORS[cat.id] ?? cat.color,
                    }}
                  />
                </div>
                <span className={styles.barValue}>
                  {cat.kw.toFixed(1)} kW
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
