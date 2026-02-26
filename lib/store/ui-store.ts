/**
 * Zustand UI store — transient UI state for the dashboard.
 *
 * Controls: which room is selected, panel/modal open states, active floor/filter.
 * This state is ephemeral — not persisted to localStorage (panel state resets on reload).
 */
import { create } from "zustand";

export interface UIStore {
  /** Currently selected room ID (null if no room is selected) */
  selectedRoomId: string | null;
  /** Whether the room detail panel is open */
  isPanelOpen: boolean;
  /** Whether the check-in modal is open */
  isCheckinModalOpen: boolean;
  /** Active floor filter in Rooms view */
  activeFloor: "all" | "1" | "2" | "3";
  /** Active status filter in Rooms view */
  activeFilter: "all" | "occupied" | "vacant" | "cleaning" | "preparing";
  /** Whether the Next.js server is reachable (from /api/health pings) */
  serverOnline: boolean;

  /** Select a room and open the detail panel */
  selectRoom(roomId: string | null): void;
  /** Programmatically open the panel (used internally) */
  openPanel(): void;
  /** Close the detail panel and deselect the room */
  closePanel(): void;
  /** Open the check-in modal */
  openCheckinModal(): void;
  /** Close the check-in modal */
  closeCheckinModal(): void;
  /** Set the active floor filter */
  setFloor(floor: UIStore["activeFloor"]): void;
  /** Set the active status filter */
  setFilter(filter: UIStore["activeFilter"]): void;
  /** Update server online status */
  setServerOnline(online: boolean): void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedRoomId: null,
  isPanelOpen: false,
  isCheckinModalOpen: false,
  activeFloor: "all",
  activeFilter: "all",
  serverOnline: true,

  selectRoom(roomId) {
    // Setting a room opens the panel; passing null closes it
    set({ selectedRoomId: roomId, isPanelOpen: roomId !== null });
  },

  openPanel() {
    set({ isPanelOpen: true });
  },

  closePanel() {
    // Close immediately — selectedRoomId stays set until animation completes
    // Panel is always in DOM (per RESEARCH.md anti-pattern warning P6);
    // use CSS translateX to slide out, then clear selectedRoomId via CSS transition end.
    // For simplicity: clear both together — panel CSS handles animation separately.
    set({ isPanelOpen: false, selectedRoomId: null });
  },

  openCheckinModal() {
    set({ isCheckinModalOpen: true });
  },

  closeCheckinModal() {
    set({ isCheckinModalOpen: false });
  },

  setFloor(floor) {
    set({ activeFloor: floor });
  },

  setFilter(filter) {
    set({ activeFilter: filter });
  },

  setServerOnline(online) {
    set({ serverOnline: online });
  },
}));
