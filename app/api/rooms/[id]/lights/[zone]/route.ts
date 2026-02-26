import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { haCallService } from "@/lib/ha/connection";
import { entityIds, type RoomId, type EntityField } from "@/lib/ha/entity-map";

export const dynamic = "force-dynamic";

const VALID_ZONES = ["ceiling", "side1", "side2", "ambient"] as const;
type ZoneName = (typeof VALID_ZONES)[number];

const ZONE_TO_FIELD: Record<ZoneName, EntityField> = {
  ceiling: "lightCeiling",
  side1: "lightSide1",
  side2: "lightSide2",
  ambient: "lightAmbient",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; zone: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, zone } = await params;
  const body = await req.json();
  const { on, brightness } = body as { on: boolean; brightness?: number };

  if (typeof on !== "boolean") {
    return NextResponse.json(
      { error: "Field 'on' must be a boolean" },
      { status: 400 }
    );
  }

  if (!(VALID_ZONES as readonly string[]).includes(zone)) {
    return NextResponse.json(
      { error: `Invalid zone. Must be one of: ${VALID_ZONES.join(", ")}` },
      { status: 400 }
    );
  }

  const entityField = ZONE_TO_FIELD[zone as ZoneName];
  const entity_id = entityIds(id as RoomId)[entityField] as string;

  try {
    if (on) {
      await haCallService("light", "turn_on", {
        entity_id,
        ...(brightness !== undefined ? { brightness_pct: Math.round(brightness) } : {}),
      });
    } else {
      await haCallService("light", "turn_off", { entity_id });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Αποτυχία σύνδεσης" }, { status: 503 });
  }
}
