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

// ---------------------------------------------------------------------------
// Phase 3: Energy entities
// ---------------------------------------------------------------------------

export const ENERGY_ENTITIES = {
  totalPower:    "sensor.hotel_total_power",
  todayEnergy:   "sensor.hotel_today_energy",
  acPower:       "sensor.hotel_ac_power",
  lightingPower: "sensor.hotel_lighting_power",
  boilerPower:   "sensor.hotel_boiler_power",
  otherPower:    "sensor.hotel_other_power",
  savings:       "sensor.hotel_energy_savings",
} as const;

export function roomPowerEntity(roomId: RoomId) {
  return `sensor.room_${roomId}_power` as const;
}

// ---------------------------------------------------------------------------
// Phase 3: Central solar heater entities
// ---------------------------------------------------------------------------

export const HEATER_ENTITIES = [
  {
    id: "heater_1",
    temp:          "sensor.solar_heater_1_temp",
    collectorTemp: "sensor.solar_heater_1_collector",
    elementOn:     "switch.solar_heater_1_element",
    minThreshold:  "input_number.solar_heater_1_min",
    maxThreshold:  "input_number.solar_heater_1_max",
  },
  {
    id: "heater_2",
    temp:          "sensor.solar_heater_2_temp",
    collectorTemp: "sensor.solar_heater_2_collector",
    elementOn:     "switch.solar_heater_2_element",
    minThreshold:  "input_number.solar_heater_2_min",
    maxThreshold:  "input_number.solar_heater_2_max",
  },
] as const;

// ---------------------------------------------------------------------------
// Phase 3: Per-room boiler entities
// ---------------------------------------------------------------------------

export function roomBoilerSwitch(roomId: RoomId) {
  return `switch.room_${roomId}_boiler` as const;
}
export function roomBoilerRuntime(roomId: RoomId) {
  return `sensor.room_${roomId}_boiler_runtime` as const;
}

// ---------------------------------------------------------------------------
// Phase 3: Automation entities
// ---------------------------------------------------------------------------

export const AUTOMATION_ENTITIES = [
  { id: "ac_window_shutoff",   entityId: "automation.ac_window_shutoff",   label: "Κλιματισμός / Παράθυρο",   desc: "Απενεργοποίηση AC όταν ανοίγει παράθυρο",           icon: "wind" },
  { id: "presence_lights",     entityId: "automation.presence_lights",     label: "Παρουσία → Φωτισμός",      desc: "Ενεργοποίηση φώτων με ανίχνευση παρουσίας",         icon: "eye" },
  { id: "checkin_prep",        entityId: "automation.checkin_prep",        label: "Προετοιμασία Δωματίου",    desc: "Welcome Scene 30 λεπτά πριν το check-in",           icon: "sparkles" },
  { id: "energy_save_ac",      entityId: "automation.energy_save_ac",      label: "Εξοικονόμηση AC",          desc: "Απενεργοποίηση AC μετά από 15 λεπτά απουσίας",      icon: "leaf" },
  { id: "solar_boiler_mgmt",   entityId: "automation.solar_boiler_mgmt",   label: "Διαχείριση Ηλιακού",       desc: "Ηλεκτρικός θερμοσίφωνας όταν ηλιακός < 45°C",      icon: "sun" },
  { id: "night_mode",          entityId: "automation.night_mode",          label: "Νυκτερινή Λειτουργία",     desc: "Μείωση κατανάλωσης μετά τις 23:00",                 icon: "moon" },
] as const;

export const AUTOMATION_IDS = AUTOMATION_ENTITIES.map(a => a.entityId);

// ---------------------------------------------------------------------------
// Phase 3: Unified tracked entity set (for SSE broadcast filter)
// ---------------------------------------------------------------------------

export const TRACKED_ENTITY_IDS: Set<string> = new Set([
  ...ALL_ROOM_ENTITY_IDS,
  ...Object.values(ENERGY_ENTITIES),
  ...ROOMS.map(roomPowerEntity),
  ...HEATER_ENTITIES.flatMap(h => [h.temp, h.collectorTemp, h.elementOn, h.minThreshold, h.maxThreshold]),
  ...ROOMS.flatMap(r => [roomBoilerSwitch(r), roomBoilerRuntime(r)]),
  ...AUTOMATION_IDS,
]);
