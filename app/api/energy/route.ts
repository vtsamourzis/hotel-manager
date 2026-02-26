import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCurrentEntitySnapshot } from "@/lib/ha/connection";
import { ENERGY_ENTITIES, ROOMS, roomPowerEntity } from "@/lib/ha/entity-map";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Static hourly dataset -- demo environment with realistic power patterns.
// AC peaks at noon-15:00, lighting peaks at evening, boilers morning 06-09.
// ---------------------------------------------------------------------------

interface HourlyPoint {
  hour: string;
  ac: number;
  lighting: number;
  boilers: number;
  other: number;
}

const HOURLY_TODAY: HourlyPoint[] = [
  { hour: "00:00", ac: 0.3, lighting: 0.1, boilers: 0.0, other: 0.2 },
  { hour: "01:00", ac: 0.2, lighting: 0.1, boilers: 0.0, other: 0.2 },
  { hour: "02:00", ac: 0.2, lighting: 0.0, boilers: 0.0, other: 0.2 },
  { hour: "03:00", ac: 0.2, lighting: 0.0, boilers: 0.0, other: 0.2 },
  { hour: "04:00", ac: 0.2, lighting: 0.0, boilers: 0.0, other: 0.2 },
  { hour: "05:00", ac: 0.3, lighting: 0.1, boilers: 0.0, other: 0.2 },
  { hour: "06:00", ac: 0.4, lighting: 0.2, boilers: 0.8, other: 0.3 },
  { hour: "07:00", ac: 0.5, lighting: 0.3, boilers: 1.1, other: 0.3 },
  { hour: "08:00", ac: 0.6, lighting: 0.3, boilers: 1.2, other: 0.3 },
  { hour: "09:00", ac: 0.8, lighting: 0.2, boilers: 0.8, other: 0.3 },
  { hour: "10:00", ac: 1.2, lighting: 0.2, boilers: 0.3, other: 0.3 },
  { hour: "11:00", ac: 1.6, lighting: 0.2, boilers: 0.2, other: 0.3 },
  { hour: "12:00", ac: 2.1, lighting: 0.2, boilers: 0.2, other: 0.3 },
  { hour: "13:00", ac: 2.4, lighting: 0.2, boilers: 0.2, other: 0.3 },
  { hour: "14:00", ac: 2.5, lighting: 0.2, boilers: 0.2, other: 0.3 },
  { hour: "15:00", ac: 2.3, lighting: 0.3, boilers: 0.2, other: 0.3 },
  { hour: "16:00", ac: 1.9, lighting: 0.4, boilers: 0.2, other: 0.3 },
  { hour: "17:00", ac: 1.5, lighting: 0.5, boilers: 0.3, other: 0.3 },
  { hour: "18:00", ac: 1.2, lighting: 0.7, boilers: 0.3, other: 0.3 },
  { hour: "19:00", ac: 1.0, lighting: 0.9, boilers: 0.3, other: 0.3 },
  { hour: "20:00", ac: 0.8, lighting: 1.1, boilers: 0.2, other: 0.3 },
  { hour: "21:00", ac: 0.7, lighting: 1.2, boilers: 0.2, other: 0.3 },
  { hour: "22:00", ac: 0.5, lighting: 0.8, boilers: 0.1, other: 0.2 },
  { hour: "23:00", ac: 0.4, lighting: 0.3, boilers: 0.0, other: 0.2 },
];

function generateWeekData(): HourlyPoint[] {
  return Array.from({ length: 7 }, (_, i) => ({
    hour: `Day ${i + 1}`,
    ac: +(HOURLY_TODAY.reduce((s, h) => s + h.ac, 0) * (0.85 + Math.random() * 0.3)).toFixed(1),
    lighting: +(HOURLY_TODAY.reduce((s, h) => s + h.lighting, 0) * (0.85 + Math.random() * 0.3)).toFixed(1),
    boilers: +(HOURLY_TODAY.reduce((s, h) => s + h.boilers, 0) * (0.85 + Math.random() * 0.3)).toFixed(1),
    other: +(HOURLY_TODAY.reduce((s, h) => s + h.other, 0) * (0.85 + Math.random() * 0.3)).toFixed(1),
  }));
}

function generateMonthData(): HourlyPoint[] {
  return Array.from({ length: 4 }, (_, i) => ({
    hour: `Week ${i + 1}`,
    ac: +(HOURLY_TODAY.reduce((s, h) => s + h.ac, 0) * 7 * (0.9 + Math.random() * 0.2)).toFixed(1),
    lighting: +(HOURLY_TODAY.reduce((s, h) => s + h.lighting, 0) * 7 * (0.9 + Math.random() * 0.2)).toFixed(1),
    boilers: +(HOURLY_TODAY.reduce((s, h) => s + h.boilers, 0) * 7 * (0.9 + Math.random() * 0.2)).toFixed(1),
    other: +(HOURLY_TODAY.reduce((s, h) => s + h.other, 0) * 7 * (0.9 + Math.random() * 0.2)).toFixed(1),
  }));
}

// ---------------------------------------------------------------------------
// GET /api/energy?range=today|week|month
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const range = req.nextUrl.searchParams.get("range") ?? "today";

  // Chart data based on time range
  let hourly: HourlyPoint[];
  switch (range) {
    case "week":
      hourly = generateWeekData();
      break;
    case "month":
      hourly = generateMonthData();
      break;
    default:
      hourly = HOURLY_TODAY;
  }

  // Current stats from entity cache
  const snapshot = getCurrentEntitySnapshot();
  const safeVal = (entityId: string) => {
    const entry = snapshot[entityId];
    if (!entry) return 0;
    const n = parseFloat(entry.state);
    return Number.isNaN(n) ? 0 : n;
  };

  const currentStats = {
    totalPowerKw: safeVal(ENERGY_ENTITIES.totalPower),
    todayKwh: safeVal(ENERGY_ENTITIES.todayEnergy),
    savingsKwh: safeVal(ENERGY_ENTITIES.savings),
    categories: [
      { id: "ac", label: "\u039A\u03BB\u03B9\u03BC\u03B1\u03C4\u03B9\u03C3\u03BC\u03CC\u03C2", kw: safeVal(ENERGY_ENTITIES.acPower) },
      { id: "lighting", label: "\u03A6\u03C9\u03C4\u03B9\u03C3\u03BC\u03CC\u03C2", kw: safeVal(ENERGY_ENTITIES.lightingPower) },
      { id: "boilers", label: "\u0398\u03B5\u03C1\u03BC\u03BF\u03C3\u03AF\u03C6\u03C9\u03BD\u03B5\u03C2", kw: safeVal(ENERGY_ENTITIES.boilerPower) },
      { id: "other", label: "\u039B\u03BF\u03B9\u03C0\u03AC", kw: safeVal(ENERGY_ENTITIES.otherPower) },
    ],
    roomPower: Object.fromEntries(
      ROOMS.map((roomId) => [roomId, safeVal(roomPowerEntity(roomId))])
    ),
  };

  return NextResponse.json({ hourly, currentStats });
}
