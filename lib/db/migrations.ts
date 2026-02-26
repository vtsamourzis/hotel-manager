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

  database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('bug', 'general', 'automation')),
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'closed')),
      machine_id TEXT NOT NULL,
      app_version TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at);
  `)

  // Migrate existing support_tickets table to accept 'automation' type
  // (SQLite CHECK constraints can't be ALTERed — recreate table if needed)
  try {
    database
      .prepare(
        `INSERT INTO support_tickets (type, description, machine_id, app_version) VALUES ('automation', '__migration_test__', '', '')`
      )
      .run()
    database
      .prepare(`DELETE FROM support_tickets WHERE description = '__migration_test__'`)
      .run()
  } catch {
    database.exec(`
      ALTER TABLE support_tickets RENAME TO support_tickets_old;
      CREATE TABLE support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('bug', 'general', 'automation')),
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'closed')),
        machine_id TEXT NOT NULL,
        app_version TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO support_tickets SELECT * FROM support_tickets_old;
      DROP TABLE support_tickets_old;
      CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at);
    `)
  }
}
