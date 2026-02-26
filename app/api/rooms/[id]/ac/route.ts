import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { haCallService } from "@/lib/ha/connection";
import { entityIds, type RoomId } from "@/lib/ha/entity-map";

export const dynamic = "force-dynamic";

const VALID_MODES = ["heat", "cool", "auto", "off"] as const;
type HvacMode = (typeof VALID_MODES)[number];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { mode, temperature } = body as { mode?: string; temperature?: number };

  if (mode === undefined && temperature === undefined) {
    return NextResponse.json(
      { error: "At least one of mode or temperature must be provided" },
      { status: 400 }
    );
  }

  if (mode !== undefined && !(VALID_MODES as readonly string[]).includes(mode)) {
    return NextResponse.json(
      { error: `Invalid mode. Must be one of: ${VALID_MODES.join(", ")}` },
      { status: 400 }
    );
  }

  if (temperature !== undefined && (temperature < 16 || temperature > 30)) {
    return NextResponse.json(
      { error: "Temperature must be between 16 and 30 (inclusive)" },
      { status: 400 }
    );
  }

  const entity_id = entityIds(id as RoomId).ac;

  try {
    if (mode !== undefined) {
      await haCallService("climate", "set_hvac_mode", {
        entity_id,
        hvac_mode: mode as HvacMode,
      });
    }

    if (temperature !== undefined && mode !== "off") {
      await haCallService("climate", "set_temperature", {
        entity_id,
        temperature,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Αποτυχία σύνδεσης" }, { status: 503 });
  }
}
