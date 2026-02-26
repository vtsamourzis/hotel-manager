import { db } from "@/lib/db";

export interface SupportTicket {
  id: number;
  type: "bug" | "general";
  description: string;
  status: "open" | "in_progress" | "closed";
  machine_id: string;
  app_version: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketInput {
  type: SupportTicket["type"];
  description: string;
  machine_id: string;
  app_version: string;
}

export function createTicket(input: CreateTicketInput): SupportTicket {
  return db
    .prepare(
      `INSERT INTO support_tickets (type, description, machine_id, app_version)
       VALUES (?, ?, ?, ?) RETURNING *`
    )
    .get(input.type, input.description, input.machine_id, input.app_version) as SupportTicket;
}

export function listTickets(limit = 50): SupportTicket[] {
  return db
    .prepare(`SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT ?`)
    .all(limit) as SupportTicket[];
}
