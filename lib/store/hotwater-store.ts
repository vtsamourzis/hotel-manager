/**
 * Zustand hot water store -- client-side state for solar heaters and room boilers.
 *
 * HAProvider populates this store from SSE events (hot water entity deltas).
 * React components subscribe to slices for hot water dashboard rendering.
 *
 * Flow: HA WebSocket -> HAWebSocketService -> SSE -> HAProvider -> this store -> React
 */
import { create } from "zustand";
import {
  HEATER_ENTITIES,
  ROOMS,
  roomBoilerSwitch,
  roomBoilerRuntime,
} from "@/lib/ha/entity-map";
import type { RoomId } from "@/lib/ha/entity-map";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CentralHeater {
  id: string;
  temp: number;
  collectorTemp: number;
  elementOn: boolean;
  minThreshold: number;
  maxThreshold: number;
}

interface RoomBoiler {
  roomId: string;
  on: boolean;
  runtime: number; // minutes
}

export interface HotWaterStore {
  heaters: CentralHeater[];
  roomBoilers: RoomBoiler[];

  /** Update a single hot water entity from an SSE delta */
  setHotWaterEntity(
    entityId: string,
    state: string,
    attributes: Record<string, unknown>
  ): void;

  /** Populate all hot water entities from an SSE snapshot */
  setAllHotWaterEntities(
    snapshot: Record<string, { state: string; attributes: Record<string, unknown> }>
  ): void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeParse(value: string): number {
  const n = parseFloat(value);
  return Number.isNaN(n) ? 0 : n;
}

/** Build reverse map: entity_id -> { heaterIndex, field } */
type HeaterField = "temp" | "collectorTemp" | "elementOn" | "minThreshold" | "maxThreshold";

const HEATER_ENTITY_MAP: Record<string, { index: number; field: HeaterField }> = {};
HEATER_ENTITIES.forEach((h, index) => {
  HEATER_ENTITY_MAP[h.temp] = { index, field: "temp" };
  HEATER_ENTITY_MAP[h.collectorTemp] = { index, field: "collectorTemp" };
  HEATER_ENTITY_MAP[h.elementOn] = { index, field: "elementOn" };
  HEATER_ENTITY_MAP[h.minThreshold] = { index, field: "minThreshold" };
  HEATER_ENTITY_MAP[h.maxThreshold] = { index, field: "maxThreshold" };
});

/** Reverse map: boiler switch entity_id -> roomId */
const BOILER_SWITCH_MAP: Record<string, RoomId> = {};
for (const roomId of ROOMS) {
  BOILER_SWITCH_MAP[roomBoilerSwitch(roomId)] = roomId;
}

/** Reverse map: boiler runtime entity_id -> roomId */
const BOILER_RUNTIME_MAP: Record<string, RoomId> = {};
for (const roomId of ROOMS) {
  BOILER_RUNTIME_MAP[roomBoilerRuntime(roomId)] = roomId;
}

function defaultHeaters(): CentralHeater[] {
  return HEATER_ENTITIES.map((h) => ({
    id: h.id,
    temp: 0,
    collectorTemp: 0,
    elementOn: false,
    minThreshold: 40,
    maxThreshold: 65,
  }));
}

function defaultBoilers(): RoomBoiler[] {
  return ROOMS.map((roomId) => ({
    roomId,
    on: false,
    runtime: 0,
  }));
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useHotWaterStore = create<HotWaterStore>((set, get) => ({
  heaters: defaultHeaters(),
  roomBoilers: defaultBoilers(),

  setHotWaterEntity(entityId, state, _attributes) {
    // Check central heater entities
    const heaterMapping = HEATER_ENTITY_MAP[entityId];
    if (heaterMapping) {
      set((prev) => ({
        heaters: prev.heaters.map((h, i) => {
          if (i !== heaterMapping.index) return h;
          switch (heaterMapping.field) {
            case "temp":
              return { ...h, temp: safeParse(state) };
            case "collectorTemp":
              return { ...h, collectorTemp: safeParse(state) };
            case "elementOn":
              return { ...h, elementOn: state === "on" };
            case "minThreshold":
              return { ...h, minThreshold: safeParse(state) };
            case "maxThreshold":
              return { ...h, maxThreshold: safeParse(state) };
            default:
              return h;
          }
        }),
      }));
      return;
    }

    // Check room boiler switch
    const switchRoom = BOILER_SWITCH_MAP[entityId];
    if (switchRoom) {
      set((prev) => ({
        roomBoilers: prev.roomBoilers.map((b) =>
          b.roomId === switchRoom ? { ...b, on: state === "on" } : b
        ),
      }));
      return;
    }

    // Check room boiler runtime
    const runtimeRoom = BOILER_RUNTIME_MAP[entityId];
    if (runtimeRoom) {
      set((prev) => ({
        roomBoilers: prev.roomBoilers.map((b) =>
          b.roomId === runtimeRoom ? { ...b, runtime: safeParse(state) } : b
        ),
      }));
      return;
    }
  },

  setAllHotWaterEntities(snapshot) {
    const store = get();
    // Process heater entities
    for (const h of HEATER_ENTITIES) {
      for (const eid of [h.temp, h.collectorTemp, h.elementOn, h.minThreshold, h.maxThreshold]) {
        const entry = snapshot[eid];
        if (entry) {
          store.setHotWaterEntity(eid, entry.state, entry.attributes);
        }
      }
    }
    // Process room boiler entities
    for (const roomId of ROOMS) {
      const switchEid = roomBoilerSwitch(roomId);
      const runtimeEid = roomBoilerRuntime(roomId);
      const switchEntry = snapshot[switchEid];
      if (switchEntry) {
        store.setHotWaterEntity(switchEid, switchEntry.state, switchEntry.attributes);
      }
      const runtimeEntry = snapshot[runtimeEid];
      if (runtimeEntry) {
        store.setHotWaterEntity(runtimeEid, runtimeEntry.state, runtimeEntry.attributes);
      }
    }
  },
}));
