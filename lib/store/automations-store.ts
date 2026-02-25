/**
 * Zustand automations store -- client-side state for HA automation entities.
 *
 * HAProvider populates this store from SSE events (automation entity deltas).
 * React components subscribe to slices for automations dashboard rendering.
 *
 * Flow: HA WebSocket -> HAWebSocketService -> SSE -> HAProvider -> this store -> React
 */
import { create } from "zustand";
import { AUTOMATION_ENTITIES } from "@/lib/ha/entity-map";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AutomationState {
  id: string;        // e.g., "ac_window_shutoff"
  entityId: string;  // e.g., "automation.ac_window_shutoff"
  label: string;     // Greek label from AUTOMATION_ENTITIES
  desc: string;      // Greek description
  icon: string;      // Lucide icon name
  enabled: boolean;  // "on" = enabled, "off" = disabled
  lastTriggered: string | null; // from HA attributes.last_triggered
}

export interface AutomationsStore {
  automations: AutomationState[];

  /** Update a single automation entity from an SSE delta */
  setAutomationState(
    entityId: string,
    state: string,
    attributes: Record<string, unknown>
  ): void;

  /** Populate all automation entities from an SSE snapshot */
  setAllAutomationEntities(
    snapshot: Record<string, { state: string; attributes: Record<string, unknown> }>
  ): void;

  /**
   * Optimistic toggle -- immediately updates enabled state.
   * Returns a rollback closure to revert if the server call fails.
   */
  optimisticToggle(entityId: string, enabled: boolean): () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reverse lookup: entityId -> automation index */
const AUTOMATION_ENTITY_INDEX: Record<string, number> = {};
AUTOMATION_ENTITIES.forEach((a, i) => {
  AUTOMATION_ENTITY_INDEX[a.entityId] = i;
});

function defaultAutomations(): AutomationState[] {
  return AUTOMATION_ENTITIES.map((a) => ({
    id: a.id,
    entityId: a.entityId,
    label: a.label,
    desc: a.desc,
    icon: a.icon,
    enabled: true,
    lastTriggered: null,
  }));
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAutomationsStore = create<AutomationsStore>((set, get) => ({
  automations: defaultAutomations(),

  setAutomationState(entityId, state, attributes) {
    const idx = AUTOMATION_ENTITY_INDEX[entityId];
    if (idx === undefined) return; // Not a known automation

    set((prev) => ({
      automations: prev.automations.map((a, i) => {
        if (i !== idx) return a;
        return {
          ...a,
          enabled: state === "on",
          lastTriggered:
            typeof attributes.last_triggered === "string"
              ? attributes.last_triggered
              : a.lastTriggered,
        };
      }),
    }));
  },

  setAllAutomationEntities(snapshot) {
    const store = get();
    for (const a of AUTOMATION_ENTITIES) {
      const entry = snapshot[a.entityId];
      if (entry) {
        store.setAutomationState(a.entityId, entry.state, entry.attributes);
      }
    }
  },

  optimisticToggle(entityId, enabled) {
    const idx = AUTOMATION_ENTITY_INDEX[entityId];
    if (idx === undefined) return () => {}; // noop rollback

    // Capture previous state for rollback
    const prev = get().automations[idx];

    set((s) => ({
      automations: s.automations.map((a, i) =>
        i === idx ? { ...a, enabled } : a
      ),
    }));

    // Return rollback function
    return () =>
      set((s) => ({
        automations: s.automations.map((a, i) =>
          i === idx ? { ...a, enabled: prev.enabled } : a
        ),
      }));
  },
}));
