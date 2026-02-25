import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AUTOMATION_ENTITIES } from "@/lib/ha/entity-map";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ automations: AUTOMATION_ENTITIES });
}
