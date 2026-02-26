import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getBookingsByDate,
  getTodayCheckIns,
  getTodayCheckOuts,
  createBooking,
} from "@/lib/db/bookings";
import type { Booking } from "@/lib/db/bookings";

export const dynamic = "force-dynamic";

const VALID_SOURCES = ["Airbnb", "Booking.com", "Direct", "Walk-in"] as const;
type BookingSource = (typeof VALID_SOURCES)[number];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date =
    req.nextUrl.searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const bookings = getBookingsByDate(date);
  const checkIns = getTodayCheckIns(date);
  const checkOuts = getTodayCheckOuts(date);

  return NextResponse.json({ bookings, checkIns, checkOuts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { roomId, guestName, checkIn, checkOut, bookingSource } = body;

  if (!roomId || !guestName || !checkIn || !checkOut || !bookingSource) {
    return NextResponse.json(
      { error: "Missing required fields: roomId, guestName, checkIn, checkOut, bookingSource" },
      { status: 400 }
    );
  }

  if (!(VALID_SOURCES as readonly string[]).includes(bookingSource)) {
    return NextResponse.json(
      { error: `Invalid bookingSource. Must be one of: ${VALID_SOURCES.join(", ")}` },
      { status: 400 }
    );
  }

  const booking: Booking = createBooking({
    room_id: roomId,
    guest_name: guestName,
    check_in: checkIn,
    check_out: checkOut,
    booking_source: bookingSource as BookingSource,
  });

  return NextResponse.json({ ok: true, booking });
}
