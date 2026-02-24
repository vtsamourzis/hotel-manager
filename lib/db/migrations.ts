import type Database from "better-sqlite3"

export function runMigrations(database: InstanceType<typeof Database>) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      guest_name TEXT NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      booking_source TEXT NOT NULL CHECK(booking_source IN ('Airbnb', 'Booking.com', 'Direct', 'Walk-in')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'checked_out', 'cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON bookings(check_in);
    CREATE INDEX IF NOT EXISTS idx_bookings_check_out ON bookings(check_out);
  `)
}
