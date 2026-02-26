/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkOnly } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Auth routes MUST be NetworkOnly — cached OAuth responses cause login failures
    {
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && url.pathname.startsWith("/api/auth/"),
      handler: new NetworkOnly(),
    },
    // SSE stream — real-time, cannot be cached
    {
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && url.pathname === "/api/ha/sse",
      handler: new NetworkOnly(),
    },
    // All other API routes — NetworkOnly per user decision (no cached API data)
    {
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    // Navigation requests (HTML pages) — bypass SW, go straight to server.
    // iOS Safari's SW implementation adds 1-2s latency on navigation interception.
    // Static assets still get cached below; only page navigations skip the SW.
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkOnly(),
    },
    // Default cache for static assets (JS, CSS, images, fonts including Google Fonts)
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
