import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { haCallService } from "@/lib/ha/connection";
import { entityIds, type RoomId } from "@/lib/ha/entity-map";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action } = body as { action?: string };

  if (action !== "lock" && action !== "unlock") {
    return NextResponse.json(
      { error: "Invalid action. Must be 'lock' or 'unlock'" },
      { status: 400 }
    );
  }

  const entity_id = entityIds(id as RoomId).lock;

  try {
    await haCallService("lock", action, { entity_id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Αποτυχία σύνδεσης" }, { status: 503 });
  }
}
