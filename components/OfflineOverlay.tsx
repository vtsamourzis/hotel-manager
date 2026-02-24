"use client";

/**
 * OfflineOverlay — full-screen error state when HA connection is lost.
 *
 * Renders over the entire app (z-index 9999) with:
 * - Greek heading: "Αποσύνδεση από το Home Assistant"
 * - Last connected timestamp in Greek locale
 * - Auto-retry spinner with Greek subtext
 *
 * Returns null when connection is healthy — silence means connected.
 * Uses design system CSS variables: var(--canvas), var(--aegean), var(--ink-1), var(--ink-2)
 */
import { useRoomStore } from "@/lib/store/room-store";

export function OfflineOverlay() {
  const connection = useRoomStore((s) => s.connection);
  const lastConnected = useRoomStore((s) => s.lastConnected);

  if (connection !== "error") return null;

  const lastConnectedFormatted = lastConnected
    ? new Intl.DateTimeFormat("el-GR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(lastConnected))
    : "—";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "var(--canvas)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "3px solid var(--aegean)",
          borderTopColor: "transparent",
          animation: "ha-spin 0.9s linear infinite",
          marginBottom: "0.5rem",
        }}
      />

      {/* Heading */}
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "var(--ink-1)",
          margin: 0,
        }}
      >
        Αποσύνδεση από το Home Assistant
      </h2>

      {/* Last connected */}
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--ink-2)",
          margin: 0,
        }}
      >
        Τελευταία σύνδεση: {lastConnectedFormatted}
      </p>

      {/* Retry subtext */}
      <p
        style={{
          fontSize: "0.8125rem",
          color: "var(--ink-2)",
          margin: 0,
          opacity: 0.75,
        }}
      >
        Επανασύνδεση σε εξέλιξη...
      </p>

      {/* Spinner keyframe injected inline — avoids needing a CSS file */}
      <style>{`
        @keyframes ha-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
