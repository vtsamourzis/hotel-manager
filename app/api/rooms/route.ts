import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCurrentEntitySnapshot } from "@/lib/ha/connection";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ entities: getCurrentEntitySnapshot() });
}
