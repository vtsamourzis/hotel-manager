import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/hotwater
 * Returns static 24-point solar vs electric dataset for the solar chart.
 * Current heater/boiler state comes from Zustand (SSE), not from this API.
 */
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Realistic 24h solar vs electric breakdown for Thessaloniki climate.
  // Solar peaks at 10:00-16:00 (70-90%), electric compensates inversely.
  const solarVsElectric = [
    { hour: "00:00", solar: 0,  electric: 100 },
    { hour: "01:00", solar: 0,  electric: 100 },
    { hour: "02:00", solar: 0,  electric: 100 },
    { hour: "03:00", solar: 0,  electric: 100 },
    { hour: "04:00", solar: 0,  electric: 100 },
    { hour: "05:00", solar: 0,  electric: 95  },
    { hour: "06:00", solar: 5,  electric: 85  },
    { hour: "07:00", solar: 15, electric: 70  },
    { hour: "08:00", solar: 30, electric: 55  },
    { hour: "09:00", solar: 50, electric: 40  },
    { hour: "10:00", solar: 70, electric: 25  },
    { hour: "11:00", solar: 82, electric: 15  },
    { hour: "12:00", solar: 90, electric: 10  },
    { hour: "13:00", solar: 88, electric: 10  },
    { hour: "14:00", solar: 85, electric: 12  },
    { hour: "15:00", solar: 78, electric: 18  },
    { hour: "16:00", solar: 65, electric: 28  },
    { hour: "17:00", solar: 45, electric: 42  },
    { hour: "18:00", solar: 25, electric: 60  },
    { hour: "19:00", solar: 10, electric: 75  },
    { hour: "20:00", solar: 2,  electric: 88  },
    { hour: "21:00", solar: 0,  electric: 95  },
    { hour: "22:00", solar: 0,  electric: 100 },
    { hour: "23:00", solar: 0,  electric: 100 },
  ];

  return NextResponse.json({ solarVsElectric });
}
