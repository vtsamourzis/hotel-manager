"use client";

import dynamic from "next/dynamic";

// Recharts uses ResponsiveContainer which measures parent width on mount --
// this causes hydration mismatch if rendered server-side. Same pattern as rooms/page.tsx.
const EnergyPage = dynamic(
  () => import("@/components/energy/EnergyPage").then((m) => ({ default: m.EnergyPage })),
  { ssr: false }
);

export default function EnergyRoute() {
  return <EnergyPage />;
}
