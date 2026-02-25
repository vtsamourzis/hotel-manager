"use client";
import { useState, useEffect, useCallback } from "react";

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
