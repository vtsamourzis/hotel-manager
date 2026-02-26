import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(`${process.env.HA_URL}/api/states/weather.forecast_home`, {
      headers: { Authorization: `Bearer ${process.env.HA_TOKEN}` },
      next: { revalidate: 300 }, // cache 5 min — weather doesn't need real-time
    });
    if (!res.ok) throw new Error("HA weather fetch failed");
    const entity = await res.json();
    return NextResponse.json({ weather: entity });
  } catch {
    return NextResponse.json({ weather: null });
  }
}
