/**
 * Zustand energy store -- client-side state for hotel energy monitoring.
 *
 * HAProvider populates this store from SSE events (energy entity deltas).
 * React components subscribe to slices for energy dashboard rendering.
 *
 * Flow: HA WebSocket -> HAWebSocketService -> SSE -> HAProvider -> this store -> React
 */
import { create } from "zustand";
import {
  ENERGY_ENTITIES,
  roomPowerEntity,
  ROOMS,
} from "@/lib/ha/entity-map";
import type { RoomId } from "@/lib/ha/entity-map";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EnergyCategory {
  id: string;
  label: string;
  kw: number;
  color: string;
}

export interface EnergyStore {
  totalPowerKw: number;
  todayKwh: number;
  savingsKwh: number;
  categories: EnergyCategory[];
  roomPower: Record<string, number>; // roomId -> kW

  /** Update a single energy entity from an SSE delta */
  setEnergyEntity(
    entityId: string,
    state: string,
    attributes: Record<string, unknown>
  ): void;

  /** Populate all energy entities from an SSE snapshot */
  setAllEnergyEntities(
    snapshot: Record<string, { state: string; attributes: Record<string, unknown> }>
  ): void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reverse lookup: energy entity_id -> store field key */
const ENERGY_ENTITY_MAP: Record<string, string> = {};
for (const [key, entityId] of Object.entries(ENERGY_ENTITIES)) {
  ENERGY_ENTITY_MAP[entityId] = key;
}

/** Room power entity_ids -> roomId */
const ROOM_POWER_MAP: Record<string, RoomId> = {};
for (const roomId of ROOMS) {
  ROOM_POWER_MAP[roomPowerEntity(roomId)] = roomId;
}

/** Default category definitions */
function defaultCategories(): EnergyCategory[] {
  return [
    { id: "ac",       label: "\u039A\u03BB\u03B9\u03BC\u03B1\u03C4\u03B9\u03C3\u03BC\u03CC\u03C2", kw: 0, color: "hsl(198, 72%, 24%)" },
    { id: "lighting", label: "\u03A6\u03C9\u03C4\u03B9\u03C3\u03BC\u03CC\u03C2",                     kw: 0, color: "hsl(38, 82%, 44%)" },
    { id: "boilers",  label: "\u0398\u03B5\u03C1\u03BC\u03BF\u03C3\u03AF\u03C6\u03C9\u03BD\u03B5\u03C2", kw: 0, color: "hsl(8, 60%, 43%)" },
    { id: "other",    label: "\u039B\u03BF\u03B9\u03C0\u03AC",                                       kw: 0, color: "hsl(210, 18%, 50%)" },
  ];
}

/** Category id to ENERGY_ENTITIES key */
const CATEGORY_ENTITY_KEY: Record<string, string> = {
  ac: "acPower",
  lighting: "lightingPower",
  boilers: "boilerPower",
  other: "otherPower",
};

function safeParse(value: string): number {
  const n = parseFloat(value);
  return Number.isNaN(n) ? 0 : n;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useEnergyStore = create<EnergyStore>((set, get) => ({
  totalPowerKw: 0,
  todayKwh: 0,
  savingsKwh: 0,
  categories: defaultCategories(),
  roomPower: Object.fromEntries(ROOMS.map((r) => [r, 0])),

  setEnergyEntity(entityId, state, _attributes) {
    // Check if it's a global energy entity
    const fieldKey = ENERGY_ENTITY_MAP[entityId];
    if (fieldKey) {
      const val = safeParse(state);
      set((prev) => {
        switch (fieldKey) {
          case "totalPower":
            return { totalPowerKw: val };
          case "todayEnergy":
            return { todayKwh: val };
          case "savings":
            return { savingsKwh: val };
          case "acPower":
          case "lightingPower":
          case "boilerPower":
          case "otherPower": {
            const catId = Object.entries(CATEGORY_ENTITY_KEY).find(
              ([, v]) => v === fieldKey
            )?.[0];
            if (!catId) return {};
            return {
              categories: prev.categories.map((c) =>
                c.id === catId ? { ...c, kw: val } : c
              ),
            };
          }
          default:
            return {};
        }
      });
      return;
    }

    // Check if it's a room power entity
    const roomId = ROOM_POWER_MAP[entityId];
    if (roomId) {
      const val = safeParse(state);
      set((prev) => ({
        roomPower: { ...prev.roomPower, [roomId]: val },
      }));
      return;
    }
  },

  setAllEnergyEntities(snapshot) {
    // Process all known energy entity IDs from the snapshot
    const store = get();
    for (const entityId of Object.values(ENERGY_ENTITIES)) {
      const entry = snapshot[entityId];
      if (entry) {
        store.setEnergyEntity(entityId, entry.state, entry.attributes);
      }
    }
    for (const roomId of ROOMS) {
      const eid = roomPowerEntity(roomId);
      const entry = snapshot[eid];
      if (entry) {
        store.setEnergyEntity(eid, entry.state, entry.attributes);
      }
    }
  },
}));
