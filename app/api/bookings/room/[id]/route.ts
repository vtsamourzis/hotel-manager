import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveBookingForRoom } from "@/lib/db/bookings";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const booking = getActiveBookingForRoom(id);

  return NextResponse.json({ booking });
}
