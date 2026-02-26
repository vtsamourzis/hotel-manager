import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface LogEntry {
  timestamp: string;
  automationId: string;
  automationLabel: string;
  detail: string;
  room?: string;
}

/**
 * Static seed dataset for automation execution log.
 * In demo environment, HA automations haven't actually run,
 * so we return realistic mock data (same approach as energy chart data).
 */
function generateLogEntries(): LogEntry[] {
  const now = Date.now();
  const h = 3_600_000; // 1 hour in ms
  const m = 60_000;    // 1 minute in ms

  return [
    {
      timestamp: new Date(now - 12 * m).toISOString(),
      automationId: "ac_window_shutoff",
      automationLabel: "Κλιματισμός / Παράθυρο",
      detail: "AC απενεργοποιήθηκε — ανοιχτό παράθυρο",
      room: "203",
    },
    {
      timestamp: new Date(now - 35 * m).toISOString(),
      automationId: "presence_lights",
      automationLabel: "Παρουσία → Φωτισμός",
      detail: "Φώτα ενεργοποιήθηκαν",
      room: "102",
    },
    {
      timestamp: new Date(now - 1 * h - 10 * m).toISOString(),
      automationId: "energy_save_ac",
      automationLabel: "Εξοικονόμηση AC",
      detail: "AC off μετά 15 λεπτά απουσίας",
      room: "301",
    },
    {
      timestamp: new Date(now - 1 * h - 45 * m).toISOString(),
      automationId: "checkin_prep",
      automationLabel: "Προετοιμασία Δωματίου",
      detail: "Welcome Scene ενεργοποιήθηκε",
      room: "104",
    },
    {
      timestamp: new Date(now - 2 * h - 5 * m).toISOString(),
      automationId: "presence_lights",
      automationLabel: "Παρουσία → Φωτισμός",
      detail: "Φώτα απενεργοποιήθηκαν — χωρίς παρουσία",
      room: "201",
    },
    {
      timestamp: new Date(now - 2 * h - 30 * m).toISOString(),
      automationId: "solar_boiler_mgmt",
      automationLabel: "Διαχείριση Ηλιακού",
      detail: "Ηλεκτρικός θερμοσίφωνας ενεργοποιήθηκε — ηλιακός < 45°C",
    },
    {
      timestamp: new Date(now - 3 * h).toISOString(),
      automationId: "ac_window_shutoff",
      automationLabel: "Κλιματισμός / Παράθυρο",
      detail: "AC απενεργοποιήθηκε — ανοιχτό παράθυρο",
      room: "105",
    },
    {
      timestamp: new Date(now - 4 * h - 15 * m).toISOString(),
      automationId: "energy_save_ac",
      automationLabel: "Εξοικονόμηση AC",
      detail: "AC off μετά 15 λεπτά απουσίας",
      room: "202",
    },
    {
      timestamp: new Date(now - 5 * h - 20 * m).toISOString(),
      automationId: "checkin_prep",
      automationLabel: "Προετοιμασία Δωματίου",
      detail: "Welcome Scene ενεργοποιήθηκε",
      room: "301",
    },
    {
      timestamp: new Date(now - 6 * h - 40 * m).toISOString(),
      automationId: "presence_lights",
      automationLabel: "Παρουσία → Φωτισμός",
      detail: "Φώτα ενεργοποιήθηκαν",
      room: "103",
    },
    {
      timestamp: new Date(now - 8 * h).toISOString(),
      automationId: "night_mode",
      automationLabel: "Νυκτερινή Λειτουργία",
      detail: "Μείωση κατανάλωσης ενεργοποιήθηκε 23:00",
    },
    {
      timestamp: new Date(now - 10 * h - 30 * m).toISOString(),
      automationId: "solar_boiler_mgmt",
      automationLabel: "Διαχείριση Ηλιακού",
      detail: "Ηλεκτρικός θερμοσίφωνας απενεργοποιήθηκε — ηλιακός > 55°C",
    },
    {
      timestamp: new Date(now - 14 * h).toISOString(),
      automationId: "ac_window_shutoff",
      automationLabel: "Κλιματισμός / Παράθυρο",
      detail: "AC απενεργοποιήθηκε — ανοιχτό παράθυρο",
      room: "101",
    },
    {
      timestamp: new Date(now - 18 * h - 15 * m).toISOString(),
      automationId: "energy_save_ac",
      automationLabel: "Εξοικονόμηση AC",
      detail: "AC off μετά 15 λεπτά απουσίας",
      room: "302",
    },
    {
      timestamp: new Date(now - 22 * h).toISOString(),
      automationId: "checkin_prep",
      automationLabel: "Προετοιμασία Δωματίου",
      detail: "Welcome Scene ενεργοποιήθηκε",
      room: "201",
    },
    {
      timestamp: new Date(now - 26 * h - 45 * m).toISOString(),
      automationId: "presence_lights",
      automationLabel: "Παρουσία → Φωτισμός",
      detail: "Φώτα απενεργοποιήθηκαν — χωρίς παρουσία",
      room: "104",
    },
    {
      timestamp: new Date(now - 32 * h).toISOString(),
      automationId: "night_mode",
      automationLabel: "Νυκτερινή Λειτουργία",
      detail: "Μείωση κατανάλωσης ενεργοποιήθηκε 23:00",
    },
    {
      timestamp: new Date(now - 38 * h - 20 * m).toISOString(),
      automationId: "solar_boiler_mgmt",
      automationLabel: "Διαχείριση Ηλιακού",
      detail: "Ηλεκτρικός θερμοσίφωνας ενεργοποιήθηκε — ηλιακός < 45°C",
    },
  ];
}

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ entries: generateLogEntries() });
}
