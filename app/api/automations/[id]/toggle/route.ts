import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { AUTOMATION_ENTITIES } = await import("@/lib/ha/entity-map");
  const { haCallService } = await import("@/lib/ha/connection");

  const entityId = AUTOMATION_ENTITIES.find((a) => a.id === id)?.entityId;

  if (!entityId) {
    return NextResponse.json(
      { error: "Μη έγκυρος αυτοματισμός" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { enabled } = body as { enabled?: boolean };

  if (typeof enabled !== "boolean") {
    return NextResponse.json(
      { error: "Απαιτείται πεδίο enabled (boolean)" },
      { status: 400 }
    );
  }

  try {
    await haCallService(
      "automation",
      enabled ? "turn_on" : "turn_off",
      { entity_id: entityId }
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Αποτυχία σύνδεσης" },
      { status: 503 }
    );
  }
}
