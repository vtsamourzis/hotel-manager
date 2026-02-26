import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { haCallService } from "@/lib/ha/connection";
import { createBooking } from "@/lib/db/bookings";

export const dynamic = "force-dynamic";

const VALID_SOURCES = ["Airbnb", "Booking.com", "Direct", "Walk-in"] as const;
type BookingSource = (typeof VALID_SOURCES)[number];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { guestName, checkIn, checkOut, bookingSource } = body;

  if (!guestName || !checkIn || !checkOut || !bookingSource) {
    return NextResponse.json(
      { error: "Missing required fields: guestName, checkIn, checkOut, bookingSource" },
      { status: 400 }
    );
  }

  if (!(VALID_SOURCES as readonly string[]).includes(bookingSource)) {
    return NextResponse.json(
      { error: `Invalid bookingSource. Must be one of: ${VALID_SOURCES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const booking = createBooking({
      room_id: id,
      guest_name: guestName,
      check_in: checkIn,
      check_out: checkOut,
      booking_source: bookingSource as BookingSource,
    });

    await haCallService("input_select", "select_option", {
      entity_id: `input_select.room_${id}_status`,
      option: "Occupied",
    });

    return NextResponse.json({ ok: true, bookingId: booking.id });
  } catch {
    return NextResponse.json({ error: "Αποτυχία σύνδεσης" }, { status: 503 });
  }
}
