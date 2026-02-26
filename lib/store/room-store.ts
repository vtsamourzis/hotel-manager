/**
 * Zustand room store — client-side state for all 10 hotel rooms.
 *
 * HAProvider populates this store from SSE events.
 * React components subscribe to individual room slices to minimize re-renders.
 *
 * Flow: HA WebSocket → HAWebSocketService → SSE → HAProvider → this store → React
 */
import { create } from "zustand";
import type { ConnectionStatus, HAEntityState, RoomState } from "@/lib/ha/types";
import { ROOMS, ENTITY_TO_ROOM } from "@/lib/ha/entity-map";
import type { RoomId, EntityField } from "@/lib/ha/entity-map";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoomStore {
  rooms: Record<string, RoomState>;
  connection: ConnectionStatus;
  lastConnected: number | null;

  /** Replace all entity states (called on SSE snapshot event) */
  setAllEntities(entities: Record<string, HAEntityState>): void;

  /** Merge one entity delta into the correct room (called on SSE delta event) */
  setEntityState(entityId: string, state: HAEntityState): void;

  /** Update connection status */
  setConnection(status: ConnectionStatus, timestamp?: number): void;

  /**
   * Apply an optimistic patch to a room.
   * Returns a rollback function — call it if the server request fails.
   */
  optimisticUpdate(roomId: string, patch: Partial<RoomState>): () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create an empty RoomState with all fields null */
function emptyRoom(roomId: string): RoomState {
  return {
    roomId,
    status: "Vacant",
    acState: null,
    lights: { ceiling: null, side1: null, side2: null, ambient: null },
    lock: null,
    boilerSource: null,
    temperature: null,
    humidity: null,
    smokeAlert: null,
    leakAlert: null,
    windowOpen: null,
  };
}

/**
 * Build RoomState objects from a flat entity cache.
 * Called when the SSE snapshot arrives — replaces all room state at once.
 */
function buildRoomsFromEntities(
  entities: Record<string, HAEntityState>
): Record<string, RoomState> {
  // Initialise all 10 rooms with empty state
  const rooms: Record<string, RoomState> = {};
  for (const roomId of ROOMS) {
    rooms[roomId] = emptyRoom(roomId);
  }

  // Apply each entity that belongs to a room
  for (const [entityId, entityState] of Object.entries(entities)) {
    const mapping = ENTITY_TO_ROOM[entityId];
    if (!mapping) continue;
    rooms[mapping.roomId] = applyEntityToRoom(
      rooms[mapping.roomId],
      mapping.field,
      entityState
    );
  }

  return rooms;
}

/**
 * Apply a single entity update to the appropriate field in a RoomState.
 * Returns a new RoomState object (immutable update).
 */
function applyEntityToRoom(
  room: RoomState,
  field: EntityField,
  entityState: HAEntityState
): RoomState {
  switch (field) {
    case "status":
      return {
        ...room,
        status: entityState.state as RoomState["status"],
      };
    case "ac":
      return { ...room, acState: entityState };
    case "lightCeiling":
      return { ...room, lights: { ...room.lights, ceiling: entityState } };
    case "lightSide1":
      return { ...room, lights: { ...room.lights, side1: entityState } };
    case "lightSide2":
      return { ...room, lights: { ...room.lights, side2: entityState } };
    case "lightAmbient":
      return { ...room, lights: { ...room.lights, ambient: entityState } };
    case "lock":
      return { ...room, lock: entityState };
    case "boilerSource":
      return { ...room, boilerSource: entityState };
    case "temperature":
      return { ...room, temperature: entityState };
    case "humidity":
      return { ...room, humidity: entityState };
    case "smokeAlert":
      return { ...room, smokeAlert: entityState };
    case "leakAlert":
      return { ...room, leakAlert: entityState };
    case "windowOpen":
      return { ...room, windowOpen: entityState };
    default:
      return room;
  }
}

/**
 * Merge one entity delta into the current rooms map.
 * Only processes entity IDs that appear in ENTITY_TO_ROOM.
 */
function mergeEntityIntoRooms(
  rooms: Record<string, RoomState>,
  entityId: string,
  entityState: HAEntityState
): Record<string, RoomState> {
  const mapping = ENTITY_TO_ROOM[entityId];
  if (!mapping) return rooms; // Not a room entity — ignore

  const prevRoom = rooms[mapping.roomId] ?? emptyRoom(mapping.roomId);
  const updatedRoom = applyEntityToRoom(prevRoom, mapping.field, entityState);

  return { ...rooms, [mapping.roomId]: updatedRoom };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useRoomStore = create<RoomStore>((set, get) => ({
  rooms: Object.fromEntries(ROOMS.map((id: RoomId) => [id, emptyRoom(id)])),
  connection: "connecting",
  lastConnected: null,

  setAllEntities(entities) {
    set({
      rooms: buildRoomsFromEntities(entities),
      connection: "connected",
      lastConnected: Date.now(),
    });
  },

  setEntityState(entityId, state) {
    set((prev) => ({
      rooms: mergeEntityIntoRooms(prev.rooms, entityId, state),
    }));
  },

  setConnection(status, timestamp) {
    set({
      connection: status,
      ...(status === "connected"
        ? { lastConnected: timestamp ?? Date.now() }
        : {}),
    });
  },

  optimisticUpdate(roomId, patch) {
    const prev = get().rooms[roomId];
    set((s) => ({
      rooms: {
        ...s.rooms,
        [roomId]: { ...s.rooms[roomId], ...patch },
      },
    }));
    // Return a rollback function that restores the exact previous state
    return () =>
      set((s) => ({
        rooms: { ...s.rooms, [roomId]: prev },
      }));
  },
}));
