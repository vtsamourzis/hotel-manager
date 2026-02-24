"use client";

/**
 * HAProvider — client component that establishes the SSE connection to /api/ha/sse
 * and populates the Zustand room store from incoming events.
 *
 * Mounted once in app/(app)/layout.tsx so it runs for the entire authenticated session.
 *
 * Event types:
 * - "snapshot": Full entity state on initial connect → calls setAllEntities()
 * - "delta": Single entity update → calls setEntityState()
 * - "connection": Connection status change from server → calls setConnection()
 */
import { useEffect } from "react";
import { useRoomStore } from "@/lib/store/room-store";

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

        const store = useRoomStore.getState();

        switch (payload.type) {
          case "snapshot":
            if (payload.entities) {
              store.setAllEntities(
                payload.entities as Parameters<typeof store.setAllEntities>[0]
              );
            }
            break;

          case "delta":
            if (payload.entity_id && payload.state) {
              store.setEntityState(
                payload.entity_id,
                payload.state as Parameters<typeof store.setEntityState>[1]
              );
            }
            break;

          case "connection":
            if (payload.status) {
              store.setConnection(payload.status);
            }
            break;
        }
      } catch {
        // Malformed SSE payload — ignore; next event will correct state
      }
    };

    es.onerror = () => {
      // SSE stream error — update connection status so OfflineOverlay appears
      useRoomStore.getState().setConnection("error");
    };

    return () => {
      es.close();
    };
  }, []); // Run once on mount

  return <>{children}</>;
}
