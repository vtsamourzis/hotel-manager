"use client";

import { useEffect, useState, useCallback } from "react";

interface Toast {
  id: string;
  message: string;
  type: "error" | "success" | "info";
}

export function Toast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const event = e as CustomEvent<{ message: string; type?: string }>;
      const id = `${Date.now()}-${Math.random()}`;
      const type = (event.detail.type ?? "info") as Toast["type"];

      setToasts((prev) => [...prev, { id, message: event.detail.message, type }]);

      setTimeout(() => removeToast(id), 4000);
    };

    window.addEventListener("toast", handler);
    return () => window.removeEventListener("toast", handler);
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        pointerEvents: "none",
      }}
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 16px",
            borderRadius: "var(--r-md)",
            fontSize: "13px",
            fontWeight: 500,
            pointerEvents: "auto",
            maxWidth: "320px",
            ...(toast.type === "error"
              ? {
                  background: "var(--clay-surface)",
                  color: "var(--clay-text)",
                  border: "1px solid var(--clay-border)",
                }
              : toast.type === "success"
              ? {
                  background: "var(--sage-surface)",
                  color: "var(--sage-text)",
                  border: "1px solid var(--sage-border)",
                }
              : {
                  background: "var(--aegean-surface)",
                  color: "var(--aegean-text)",
                  border: "1px solid var(--aegean-border)",
                }),
          }}
        >
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              fontSize: "14px",
              lineHeight: 1,
              padding: "0 2px",
              opacity: 0.6,
              flexShrink: 0,
            }}
            aria-label="Κλείσιμο"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
