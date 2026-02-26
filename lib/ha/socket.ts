/**
 * Node.js WebSocket factory for home-assistant-js-websocket.
 *
 * The createSocket function is passed to createConnection() as the socket factory.
 * It must return a Promise<HaWebSocket> — a FULLY AUTHENTICATED socket.
 *
 * The default browser implementation handles the full auth exchange:
 *   open → auth_required → send auth → auth_ok → resolve
 *
 * We replicate this flow using the `ws` package for Node.js.
 */
import WebSocket from "ws";
import type { ConnectionOptions } from "home-assistant-js-websocket";
import type { HaWebSocket } from "home-assistant-js-websocket";

// Polyfill global WebSocket so ha-js-websocket internal checks pass
(global as unknown as Record<string, unknown>).WebSocket = WebSocket;

/** Message types in the HA WebSocket auth exchange */
interface HAMessage {
  type: string;
  ha_version?: string;
  message?: string;
}

export function createSocket(
  options: ConnectionOptions
): Promise<HaWebSocket> {
  const auth = options.auth;
  if (!auth) {
    return Promise.reject(new Error("No auth provided to createSocket"));
  }
  const wsUrl = auth.wsUrl;

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl, { rejectUnauthorized: false });

    const onOpen = () => {
      // Socket is open — HA will send auth_required next.
      // We handle auth in the message handler below.
    };

    const onMessage = (event: WebSocket.MessageEvent) => {
      const data = typeof event.data === "string"
        ? event.data
        : event.data.toString();

      let msg: HAMessage;
      try {
        msg = JSON.parse(data) as HAMessage;
      } catch {
        return; // Ignore non-JSON messages
      }

      switch (msg.type) {
        case "auth_required":
          // HA is asking for authentication — send our token
          socket.send(
            JSON.stringify({
              type: "auth",
              access_token: auth.accessToken,
            })
          );
          break;

        case "auth_ok":
          // Authentication succeeded — socket is ready
          cleanup();
          const haSocket = socket as unknown as HaWebSocket;
          haSocket.haVersion = msg.ha_version || "";
          resolve(haSocket);
          break;

        case "auth_invalid":
          // Authentication failed
          cleanup();
          socket.close();
          reject(new Error(`HA auth failed: ${msg.message || "invalid token"}`));
          break;
      }
    };

    const onError = (event: WebSocket.ErrorEvent) => {
      cleanup();
      reject(new Error(`WebSocket error: ${event.message || "unknown"}`));
    };

    const onClose = () => {
      cleanup();
      reject(new Error("WebSocket closed before auth completed"));
    };

    const cleanup = () => {
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("close", onClose);
    };

    socket.addEventListener("open", onOpen);
    socket.addEventListener("message", onMessage);
    socket.addEventListener("error", onError);
    socket.addEventListener("close", onClose);
  });
}
