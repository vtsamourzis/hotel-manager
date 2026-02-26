/**
 * Shared type definitions for Home Assistant WebSocket integration.
 * These types flow through: HA WebSocket → HAWebSocketService → SSE → HAProvider → Zustand → React
 */

export interface HAEntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export type RoomStatus = "Occupied" | "Vacant" | "Cleaning" | "Preparing";

export type ConnectionStatus = "connecting" | "connected" | "error";

export interface RoomState {
  roomId: string;
  status: RoomStatus;
  acState: HAEntityState | null;
  lights: {
    ceiling: HAEntityState | null;
    side1: HAEntityState | null;
    side2: HAEntityState | null;
    ambient: HAEntityState | null;
  };
  lock: HAEntityState | null;
  boilerSource: HAEntityState | null;
  temperature: HAEntityState | null;
  humidity: HAEntityState | null;
  smokeAlert: HAEntityState | null;
  leakAlert: HAEntityState | null;
  windowOpen: HAEntityState | null;
}
