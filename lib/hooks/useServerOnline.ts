"use client";
import { useState, useEffect, useCallback } from "react";

/**
 * Guard a write action when the server is offline.
 * Shows a Greek toast and returns true (blocked) if offline.
 */
export function guardOffline(serverOnline: boolean): boolean {
  if (!serverOnline) {
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: {
          message:
            "Δεν υπάρχει σύνδεση — η ενέργεια δεν μπορεί να εκτελεστεί",
          type: "error",
        },
      })
    );
    return true; // blocked
  }
  return false; // allowed
}

export function useServerOnline() {
  const [serverOnline, setServerOnline] = useState(true);

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      setServerOnline(res.ok);
    } catch {
      setServerOnline(false);
    }
  }, []);

  useEffect(() => {
    check();

    const onOnline = () => check();
    const onOffline = () => setServerOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Check every 15 seconds when tab is visible
    const interval = setInterval(() => {
      if (!document.hidden) check();
    }, 15_000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(interval);
    };
  }, [check]);

  return serverOnline;
}
