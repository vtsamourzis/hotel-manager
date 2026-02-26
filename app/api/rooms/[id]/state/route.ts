import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { haCallService } from "@/lib/ha/connection";
import { ROOM_STATUS_OPTIONS } from "@/lib/ha/entity-map";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!status || !(ROOM_STATUS_OPTIONS as readonly string[]).includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${ROOM_STATUS_OPTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    await haCallService("input_select", "select_option", {
      entity_id: `input_select.room_${id}_status`,
      option: status,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Αποτυχία σύνδεσης" }, { status: 503 });
  }
}
