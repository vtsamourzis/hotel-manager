import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { haCallService } from "@/lib/ha/connection";
import { ROOMS, roomBoilerSwitch, type RoomId } from "@/lib/ha/entity-map";

export const dynamic = "force-dynamic";

/**
 * POST /api/hotwater/boiler/[id]
 * Toggles a per-room boiler on or off.
 *
 * Body: { action: "toggle", value: boolean }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Validate room id
  if (!(ROOMS as readonly string[]).includes(id)) {
    return NextResponse.json(
      { error: `Invalid room id. Must be one of: ${ROOMS.join(", ")}` },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { action, value } = body as { action?: string; value?: boolean };

  if (action !== "toggle" || typeof value !== "boolean") {
    return NextResponse.json(
      { error: "Body must contain { action: \"toggle\", value: boolean }" },
      { status: 400 }
    );
  }

  const entity_id = roomBoilerSwitch(id as RoomId);

  try {
    await haCallService("switch", value ? "turn_on" : "turn_off", { entity_id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Αποτυχία σύνδεσης" }, { status: 503 });
  }
}
