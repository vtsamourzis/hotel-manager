import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createTicket, listTickets } from "@/lib/db/support";
import { getMachineId, getAppVersion } from "@/lib/system-info";

export const dynamic = "force-dynamic";

const ticketSchema = z.object({
  type: z.enum(["bug", "general", "automation"]),
  description: z.string().min(1, "Η περιγραφή είναι υποχρεωτική"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tickets = listTickets();
  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const result = ticketSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const ticket = createTicket({
    type: result.data.type,
    description: result.data.description,
    machine_id: getMachineId(),
    app_version: getAppVersion(),
  });

  return NextResponse.json({ ticket }, { status: 201 });
}
