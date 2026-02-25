"use client";
import { useEffect } from "react";

export function useSwUpdate() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Detect new service worker activation -> show update toast
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            message: "Ενημερώθηκε στην τελευταία έκδοση",
            type: "info",
          },
        })
      );
    });

    // Hourly update check for front-desk devices that stay open all day
    const intervalMs = 60 * 60 * 1000; // 1 hour
    let intervalId: ReturnType<typeof setInterval>;

    navigator.serviceWorker.ready.then((registration) => {
      intervalId = setInterval(() => {
        registration.update();
      }, intervalMs);
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
}
