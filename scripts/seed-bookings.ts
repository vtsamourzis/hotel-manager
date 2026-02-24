import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "data", "hotel.db");
const db = new Database(DB_PATH);

// Reference: today is 2026-02-24
// Seed data covers Feb 21 – Mar 03 window
const SEED_BOOKINGS = [
  // Currently occupied (check-in before today, check-out after today)
  { room_id: "101", guest_name: "Νίκος Παπαδόπουλος",   check_in: "2026-02-22 14:00", check_out: "2026-02-26 11:00", booking_source: "Booking.com" },
  { room_id: "102", guest_name: "Sophie Müller",          check_in: "2026-02-23 15:00", check_out: "2026-02-27 11:00", booking_source: "Airbnb" },
  { room_id: "103", guest_name: "Μαρία Κωνσταντίνου",    check_in: "2026-02-21 14:00", check_out: "2026-02-25 11:00", booking_source: "Direct" },
  { room_id: "201", guest_name: "James & Emily Carter",   check_in: "2026-02-20 15:00", check_out: "2026-02-28 11:00", booking_source: "Booking.com" },
  { room_id: "202", guest_name: "Γιώργης Αλεξάνδρου",    check_in: "2026-02-24 14:00", check_out: "2026-02-26 11:00", booking_source: "Walk-in" },
  { room_id: "301", guest_name: "Ελένη Θεοδωράκη",       check_in: "2026-02-22 16:00", check_out: "2026-02-25 11:00", booking_source: "Airbnb" },
  // Arriving today
  { room_id: "104", guest_name: "Thomas Dupont",          check_in: "2026-02-24 15:00", check_out: "2026-02-27 11:00", booking_source: "Booking.com" },
  { room_id: "203", guest_name: "Αντώνης Σαββίδης",      check_in: "2026-02-24 16:00", check_out: "2026-03-01 11:00", booking_source: "Direct" },
  // Future check-ins (upcoming 3 days)
  { room_id: "105", guest_name: "Laura Ricci",            check_in: "2026-02-25 14:00", check_out: "2026-02-28 11:00", booking_source: "Airbnb" },
  { room_id: "302", guest_name: "Κώστας Βασιλείου",      check_in: "2026-02-26 15:00", check_out: "2026-03-02 11:00", booking_source: "Booking.com" },
  { room_id: "102", guest_name: "Anna Kowalski",          check_in: "2026-02-28 14:00", check_out: "2026-03-03 11:00", booking_source: "Booking.com" },
];

// Clear existing seed data to prevent duplicates on re-run
db.prepare("DELETE FROM bookings").run();

const insert = db.prepare(
  `INSERT INTO bookings (room_id, guest_name, check_in, check_out, booking_source) VALUES (?, ?, ?, ?, ?)`
);

const insertAll = db.transaction(() => {
  for (const b of SEED_BOOKINGS) {
    insert.run(b.room_id, b.guest_name, b.check_in, b.check_out, b.booking_source);
  }
});

insertAll();
console.log(`Seeded ${SEED_BOOKINGS.length} demo bookings for AegeanSea`);
db.close();
