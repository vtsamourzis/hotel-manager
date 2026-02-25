"use client";

/**
 * SolarChart -- small 24h dual-area chart showing solar contribution vs electric backup.
 *
 * Uses Recharts AreaChart with 2 overlapping areas (not stacked).
 * Data fetched from /api/hotwater via TanStack Query.
 */
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import styles from "./hotwater.module.css";

interface SolarDataPoint {
  hour: string;
  solar: number;
  electric: number;
}

interface HotWaterApiResponse {
  solarVsElectric: SolarDataPoint[];
}

export default function SolarChart() {
  const { data, isLoading } = useQuery<HotWaterApiResponse>({
    queryKey: ["hotwater-solar"],
    queryFn: async () => {
      const res = await fetch("/api/hotwater");
      if (!res.ok) throw new Error("Failed to fetch solar data");
      return res.json() as Promise<HotWaterApiResponse>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });

  const chartData = data?.solarVsElectric ?? [];

  return (
    <div className={styles.solarCard}>
      <div className={styles.solarCardHeader}>
        Ηλιακή vs Ηλεκτρική Ενέργεια (24ω)
      </div>
      <div className={styles.solarCardBody}>
        {isLoading ? (
          <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-4)", fontSize: 12 }}>
            Φόρτωση...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 9, fill: "var(--ink-3)" }}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-2)",
                  borderRadius: "var(--r-sm)",
                }}
                formatter={(value: number | undefined) => [`${value ?? 0}%`]}
                labelStyle={{ fontWeight: 600, fontSize: 11 }}
              />
              <Area
                type="monotone"
                dataKey="solar"
                name="Ηλιακή"
                stroke="hsl(38, 82%, 44%)"
                fill="hsl(38, 82%, 44%)"
                fillOpacity={0.5}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="electric"
                name="Ηλεκτρική"
                stroke="hsl(8, 60%, 43%)"
                fill="hsl(8, 60%, 43%)"
                fillOpacity={0.5}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
