import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { haCallService } from "@/lib/ha/connection";
import { AUTOMATION_ENTITIES } from "@/lib/ha/entity-map";

const ID_TO_ENTITY: Record<string, string> = Object.fromEntries(
  AUTOMATION_ENTITIES.map((a) => [a.id, a.entityId])
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entityId = ID_TO_ENTITY[id];

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
