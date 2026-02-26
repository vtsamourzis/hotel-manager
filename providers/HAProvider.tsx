"use client";

/**
 * HAProvider -- client component that establishes the SSE connection to /api/ha/sse
 * and populates all Zustand stores from incoming events.
 *
 * Mounted once in app/(app)/layout.tsx so it runs for the entire authenticated session.
 *
 * Event types:
 * - "snapshot": Full entity state on initial connect -> dispatches to all 4 stores
 * - "delta": Single entity update -> dispatches to relevant store(s)
 * - "connection": Connection status change from server -> calls setConnection()
 */
import { useEffect, useRef } from "react";
import { useRoomStore } from "@/lib/store/room-store";
import { useEnergyStore } from "@/lib/store/energy-store";
import { useHotWaterStore } from "@/lib/store/hotwater-store";
import { useAutomationsStore } from "@/lib/store/automations-store";
import { useUIStore } from "@/lib/store/ui-store";
import { useServerOnline } from "@/lib/hooks/useServerOnline";
import { ENTITY_TO_ROOM } from "@/lib/ha/entity-map";
import type { HAEntityState } from "@/lib/ha/types";

/**
 * Syncs useServerOnline() hook result into the UI Zustand store.
 * Fires a reconnection toast when transitioning from offline -> online.
 */
function ServerOnlineSync() {
  const serverOnline = useServerOnline();
  const prevRef = useRef(true);

  useEffect(() => {
    useUIStore.getState().setServerOnline(serverOnline);

    // Reconnection toast (not on initial mount)
    if (serverOnline && !prevRef.current) {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { message: "Επανασύνδεση", type: "success" },
        })
      );
    }
    prevRef.current = serverOnline;
  }, [serverOnline]);

  return null;
}

interface HAProviderProps {
  children: React.ReactNode;
}

export function HAProvider({ children }: HAProviderProps) {
  useEffect(() => {
    const es = new EventSource("/api/ha/sse");

    es.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data as string) as {
          type: "snapshot" | "delta" | "connection";
          entities?: Record<string, unknown>;
          entity_id?: string;
          state?: unknown;
          status?: "connected" | "error";
        };

        const roomStore = useRoomStore.getState();

        switch (payload.type) {
          case "snapshot":
            if (payload.entities) {
              const entities = payload.entities as Record<string, HAEntityState>;

              // Room entities -> room store
              roomStore.setAllEntities(entities);

              // Energy entities -> energy store
              useEnergyStore.getState().setAllEnergyEntities(entities);

              // Hot water entities -> hotwater store
              useHotWaterStore.getState().setAllHotWaterEntities(entities);

              // Automation entities -> automations store
              useAutomationsStore.getState().setAllAutomationEntities(entities);
            }
            break;

          case "delta":
            if (payload.entity_id && payload.state) {
              const entityId = payload.entity_id;
              const haState = payload.state as HAEntityState;

              // Room entities -> room store
              if (entityId in ENTITY_TO_ROOM) {
                roomStore.setEntityState(entityId, haState);
              }

              // Energy entities -> energy store
              useEnergyStore
                .getState()
                .setEnergyEntity(entityId, haState.state, haState.attributes);

              // Hot water entities -> hotwater store
              useHotWaterStore
                .getState()
                .setHotWaterEntity(entityId, haState.state, haState.attributes);

              // Automation entities -> automations store
              if (entityId.startsWith("automation.")) {
                useAutomationsStore
                  .getState()
                  .setAutomationState(entityId, haState.state, haState.attributes);
              }
            }
            break;

          case "connection":
            if (payload.status) {
              roomStore.setConnection(payload.status);
            }
            break;
        }
      } catch {
        // Malformed SSE payload -- ignore; next event will correct state
      }
    };

    es.onerror = () => {
      // SSE stream error -- update connection status so OfflineOverlay appears
      useRoomStore.getState().setConnection("error");
    };

    return () => {
      es.close();
    };
  }, []); // Run once on mount

  return (
    <>
      <ServerOnlineSync />
      {children}
    </>
  );
}
