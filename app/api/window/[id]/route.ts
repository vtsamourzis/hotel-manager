import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { haCallService } from "@/lib/ha/connection";
import { entityIds, type RoomId } from "@/lib/ha/entity-map";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action } = body as { action?: string };

  if (action !== "open" && action !== "close") {
    return NextResponse.json(
      { error: "Invalid action. Must be 'open' or 'close'" },
      { status: 400 }
    );
  }

  const entity_id = entityIds(id as RoomId).windowOpen;

  try {
    await haCallService(
      "input_boolean",
      action === "open" ? "turn_on" : "turn_off",
      { entity_id }
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Αποτυχία σύνδεσης" }, { status: 503 });
  }
}
