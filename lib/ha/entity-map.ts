export const ROOMS = ["101", "102", "103", "104", "105", "201", "202", "203", "301", "302"] as const;
export type RoomId = (typeof ROOMS)[number];

export const ROOM_STATUS_OPTIONS = ["Occupied", "Vacant", "Cleaning", "Preparing"] as const;
export type RoomStatus = (typeof ROOM_STATUS_OPTIONS)[number];

export const BOILER_SOURCE_OPTIONS = ["Solar", "Electrical"] as const;

export function entityIds(roomId: RoomId) {
  return {
    status:       `input_select.room_${roomId}_status`,
    ac:           `climate.room_${roomId}_ac`,
    lightCeiling: `light.room_${roomId}_ceiling`,
    lightSide1:   `light.room_${roomId}_side_1`,
    lightSide2:   `light.room_${roomId}_side_2`,
    lightAmbient: `light.room_${roomId}_ambient`,
    lock:         `lock.room_${roomId}_door`,
    boilerSource: `input_select.room_${roomId}_boiler_source`,
    hotWaterTemp: `input_number.room_${roomId}_hot_water_temp`,
    humidity:     `input_number.room_${roomId}_humidity`,
    smokeAlert:   `input_boolean.room_${roomId}_smoke_alert`,
    leakAlert:    `input_boolean.room_${roomId}_leak_alert`,
  } as const;
}

export type EntityField = keyof ReturnType<typeof entityIds>;

// Reverse map: entity_id → { roomId, field }
// This drives the WebSocket filter — only entity IDs in this map are processed
export const ENTITY_TO_ROOM: Record<string, { roomId: RoomId; field: EntityField }> =
  Object.fromEntries(
    ROOMS.flatMap((roomId) =>
      Object.entries(entityIds(roomId)).map(([field, entityId]) => [
        entityId,
        { roomId, field: field as EntityField },
      ])
    )
  );

// All entity IDs for subscription filtering
export const ALL_ROOM_ENTITY_IDS = Object.keys(ENTITY_TO_ROOM);

// Floor grouping for UI tabs
export const FLOOR_ROOMS: Record<"1" | "2" | "3", RoomId[]> = {
  "1": ["101", "102", "103", "104", "105"],
  "2": ["201", "202", "203"],
  "3": ["301", "302"],
};
