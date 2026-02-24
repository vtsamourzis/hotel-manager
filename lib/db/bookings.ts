import { db } from "@/lib/db";

export interface Booking {
  id: number;
  room_id: string;
  guest_name: string;
  check_in: string;   // ISO 8601
  check_out: string;  // ISO 8601
  booking_source: "Airbnb" | "Booking.com" | "Direct" | "Walk-in";
  status: "active" | "checked_out" | "cancelled";
  created_at: string;
}

// Returns bookings where check_in <= dateStr <= check_out (for timeline display)
export function getBookingsByDate(dateStr: string): Booking[] {
  return db
    .prepare(
      `SELECT * FROM bookings WHERE status = 'active'
       AND date(check_in) <= date(?) AND date(check_out) >= date(?)
       ORDER BY check_in ASC`
    )
    .all(dateStr, dateStr) as Booking[];
}

// Returns today's check-ins (arriving today)
export function getTodayCheckIns(dateStr: string): Booking[] {
  return db
    .prepare(`SELECT * FROM bookings WHERE status = 'active' AND date(check_in) = date(?) ORDER BY check_in ASC`)
    .all(dateStr) as Booking[];
}

// Returns today's check-outs (departing today)
export function getTodayCheckOuts(dateStr: string): Booking[] {
  return db
    .prepare(`SELECT * FROM bookings WHERE status = 'active' AND date(check_out) = date(?) ORDER BY check_out ASC`)
    .all(dateStr) as Booking[];
}

export function getActiveBookingForRoom(roomId: string): Booking | null {
  return (
    db
      .prepare(`SELECT * FROM bookings WHERE room_id = ? AND status = 'active' ORDER BY check_in DESC LIMIT 1`)
      .get(roomId) as Booking | undefined
  ) ?? null;
}

export interface CreateBookingInput {
  room_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  booking_source: Booking["booking_source"];
}

export function createBooking(input: CreateBookingInput): Booking {
  const result = db
    .prepare(
      `INSERT INTO bookings (room_id, guest_name, check_in, check_out, booking_source)
       VALUES (?, ?, ?, ?, ?) RETURNING *`
    )
    .get(input.room_id, input.guest_name, input.check_in, input.check_out, input.booking_source) as Booking;
  return result;
}

export function checkoutRoom(roomId: string): void {
  db.prepare(
    `UPDATE bookings SET status = 'checked_out' WHERE room_id = ? AND status = 'active'`
  ).run(roomId);
}
