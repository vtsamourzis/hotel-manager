"use client";

/**
 * RoomDetailPanel stub — full implementation in plan 02-05.
 *
 * This stub satisfies the import in RoomGrid.tsx and prevents TypeScript errors.
 * It reads selectedRoomId from UIStore; when 02-05 is complete this component
 * is replaced with the full slide-in panel / bottom-sheet implementation.
 */
import { useUIStore } from "@/lib/store/ui-store";
import { useRoomStore } from "@/lib/store/room-store";

export function RoomDetailPanel() {
  const { selectedRoomId, isPanelOpen, closePanel } = useUIStore((s) => ({
    selectedRoomId: s.selectedRoomId,
    isPanelOpen: s.isPanelOpen,
    closePanel: s.closePanel,
  }));
  const rooms = useRoomStore((s) => s.rooms);

  if (!isPanelOpen || !selectedRoomId) return null;

  const room = rooms[selectedRoomId];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Δωμάτιο ${selectedRoomId}`}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-end",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closePanel();
      }}
    >
      <div
        style={{
          background: "var(--surface-1)",
          borderLeft: "1px solid var(--border-2)",
          width: "min(420px, 100%)",
          height: "100%",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.8px" }}>
            Δωμάτιο {selectedRoomId}
          </h2>
          <button
            onClick={closePanel}
            style={{
              background: "transparent",
              border: "1px solid var(--border-2)",
              borderRadius: "var(--r-sm)",
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: "12px",
              color: "var(--ink-3)",
            }}
          >
            Κλείσιμο
          </button>
        </div>
        <p style={{ color: "var(--ink-3)", fontSize: "13px" }}>
          Κατάσταση: <strong>{room?.status ?? "—"}</strong>
        </p>
        <p style={{ color: "var(--ink-3)", fontSize: "12px" }}>
          Πλήρες panel διαθέσιμο στο plan 02-05.
        </p>
      </div>
    </div>
  );
}
