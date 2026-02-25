"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HourlyPoint {
  hour: string;
  ac: number;
  lighting: number;
  boilers: number;
  other: number;
}

interface EnergyChartProps {
  data: HourlyPoint[];
  range: "today" | "week" | "month";
}

// ---------------------------------------------------------------------------
// Category colors -- fixed HSL strings for Recharts compatibility
// (CSS custom properties don't work in SVG fill attributes in Recharts)
// ---------------------------------------------------------------------------

const CATEGORY_COLORS = {
  ac: "hsl(198, 72%, 24%)",       // aegean
  lighting: "hsl(38, 82%, 44%)",  // amber
  boilers: "hsl(8, 60%, 43%)",    // clay
  other: "hsl(210, 18%, 50%)",    // slate
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  ac: "\u039A\u03BB\u03B9\u03BC\u03B1\u03C4\u03B9\u03C3\u03BC\u03CC\u03C2",
  lighting: "\u03A6\u03C9\u03C4\u03B9\u03C3\u03BC\u03CC\u03C2",
  boilers: "\u0398\u03B5\u03C1\u03BC\u03BF\u03C3\u03AF\u03C6\u03C9\u03BD\u03B5\u03C2",
  other: "\u039B\u03BF\u03B9\u03C0\u03AC",
};

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function EnergyTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const total = payload.reduce((sum, p) => sum + (p.value ?? 0), 0);

  return (
    <div
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border-2)",
        borderRadius: "var(--r-sm)",
        padding: "8px 12px",
        fontSize: "12px",
        lineHeight: "1.6",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--ink-1)" }}>
        {label}
      </div>
      {payload.map((p) => (
        <div
          key={p.dataKey}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: p.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: "var(--ink-3)" }}>
            {CATEGORY_LABELS[p.dataKey] ?? p.dataKey}:
          </span>
          <span style={{ fontWeight: 600, marginLeft: "auto" }}>
            {p.value.toFixed(1)} kW
          </span>
        </div>
      ))}
      <div
        style={{
          borderTop: "1px solid var(--border-1)",
          marginTop: 4,
          paddingTop: 4,
          fontWeight: 700,
          color: "var(--ink-1)",
        }}
      >
        {"\u03A3\u03CD\u03BD\u03BF\u03BB\u03BF: "}{total.toFixed(1)} kW
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom legend formatter
// ---------------------------------------------------------------------------

function renderLegendValue(value: string) {
  return (
    <span style={{ color: "var(--ink-3)", fontSize: 11 }}>
      {CATEGORY_LABELS[value] ?? value}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------

export function EnergyChart({ data, range }: EnergyChartProps) {
  // Determine Y-axis unit suffix based on range
  const yUnit = range === "today" ? " kW" : " kWh";

  return (
    <ResponsiveContainer width="100%" height={200} className="energy-chart-container">
      <AreaChart
        data={data}
        margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,88,68,0.09)" />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 10, fill: "hsl(220, 8%, 70%)" }}
          stroke="hsl(220, 8%, 70%)"
          tickLine={false}
          axisLine={{ stroke: "rgba(100,88,68,0.09)" }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "hsl(220, 8%, 70%)" }}
          stroke="hsl(220, 8%, 70%)"
          unit={yUnit}
          tickLine={false}
          axisLine={false}
          width={55}
        />
        <Tooltip content={<EnergyTooltip />} />
        <Legend formatter={renderLegendValue} iconType="circle" iconSize={8} />
        <Area
          type="monotone"
          dataKey="other"
          stackId="1"
          fill={CATEGORY_COLORS.other}
          stroke="none"
          fillOpacity={0.7}
          animationDuration={800}
          animationEasing="ease-in-out"
        />
        <Area
          type="monotone"
          dataKey="boilers"
          stackId="1"
          fill={CATEGORY_COLORS.boilers}
          stroke="none"
          fillOpacity={0.7}
          animationDuration={800}
          animationEasing="ease-in-out"
        />
        <Area
          type="monotone"
          dataKey="lighting"
          stackId="1"
          fill={CATEGORY_COLORS.lighting}
          stroke="none"
          fillOpacity={0.7}
          animationDuration={800}
          animationEasing="ease-in-out"
        />
        <Area
          type="monotone"
          dataKey="ac"
          stackId="1"
          fill={CATEGORY_COLORS.ac}
          stroke="none"
          fillOpacity={0.7}
          animationDuration={800}
          animationEasing="ease-in-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
