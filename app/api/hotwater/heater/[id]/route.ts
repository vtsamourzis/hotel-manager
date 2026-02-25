import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { haCallService } from "@/lib/ha/connection";
import { HEATER_ENTITIES } from "@/lib/ha/entity-map";

const VALID_HEATER_IDS: readonly string[] = HEATER_ENTITIES.map((h) => h.id);
const VALID_ACTIONS = ["element_toggle", "set_min", "set_max"] as const;
type HeaterAction = (typeof VALID_ACTIONS)[number];

/**
 * POST /api/hotwater/heater/[id]
 * Controls a central solar heater: element toggle or threshold set.
 *
 * Body: { action: "element_toggle" | "set_min" | "set_max", value?: number | boolean }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Validate heater id -- expect "heater_1" or "heater_2"
  if (!VALID_HEATER_IDS.includes(id)) {
    return NextResponse.json(
      { error: `Invalid heater id. Must be one of: ${VALID_HEATER_IDS.join(", ")}` },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { action, value } = body as { action?: string; value?: number | boolean };

  if (!action || !(VALID_ACTIONS as readonly string[]).includes(action)) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const heaterConfig = HEATER_ENTITIES.find((h) => h.id === id)!;
  const typedAction = action as HeaterAction;

  try {
    switch (typedAction) {
      case "element_toggle": {
        const on = typeof value === "boolean" ? value : true;
        await haCallService("switch", on ? "turn_on" : "turn_off", {
          entity_id: heaterConfig.elementOn,
        });
        break;
      }
      case "set_min": {
        if (typeof value !== "number" || value < 20 || value > 80) {
          return NextResponse.json(
            { error: "Value must be a number between 20 and 80" },
            { status: 400 }
          );
        }
        await haCallService("input_number", "set_value", {
          entity_id: heaterConfig.minThreshold,
          value,
        });
        break;
      }
      case "set_max": {
        if (typeof value !== "number" || value < 20 || value > 80) {
          return NextResponse.json(
            { error: "Value must be a number between 20 and 80" },
            { status: 400 }
          );
        }
        await haCallService("input_number", "set_value", {
          entity_id: heaterConfig.maxThreshold,
          value,
        });
        break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Αποτυχία σύνδεσης" }, { status: 503 });
  }
}
