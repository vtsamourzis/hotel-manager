/**
 * Node.js WebSocket polyfill for home-assistant-js-websocket.
 *
 * home-assistant-js-websocket expects a browser-like WebSocket API.
 * In Node.js (Next.js server runtime), we must use the `ws` package.
 *
 * The createSocket function is passed to createConnection() as the socket factory.
 * It must return a Promise<HaWebSocket> matching the ha-js-websocket interface.
 *
 * Source: home-assistant-js-websocket Node.js usage pattern
 */
import WebSocket from "ws";
import type { ConnectionOptions } from "home-assistant-js-websocket";
import type { HaWebSocket } from "home-assistant-js-websocket";

// Polyfill global WebSocket so ha-js-websocket internal checks pass
(global as unknown as Record<string, unknown>).WebSocket = WebSocket;

export function createSocket(
  options: ConnectionOptions
): Promise<HaWebSocket> {
  const auth = options.auth;
  if (!auth) {
    return Promise.reject(new Error("No auth provided to createSocket"));
  }
  const wsUrl = auth.wsUrl;
  const socket = new WebSocket(wsUrl, { rejectUnauthorized: false });
  // ha-js-websocket checks socket.haVersion; set it once auth_ok received
  (socket as unknown as HaWebSocket).haVersion = "";
  return Promise.resolve(socket as unknown as HaWebSocket);
}
