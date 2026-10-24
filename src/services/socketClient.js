// Klien Socket.io — siap dihubungkan ke backend orkestrator.
// Digunakan oleh page.jsx: socket.on("AGENT_STATUS_UPDATE", handleSocketEvent) dst.
// Listener ganda sengaja pakai .off() pas cleanup biar aman di-double-mount (React strict).

import { io } from "socket.io-client";

let socket = null;

export function connectSocket({ url = import.meta.env.VITE_SOCKET_URL, store } = {}) {
  if (!url) return null; // mode demo/simulasi offline — tanpa server, tetap jalan via store.handleSocketEvent
  if (socket) return socket;

  socket = io(url, { transports: ["websocket"], autoConnect: true });
  socket.on("connect", () => store?.setWsConnected?.(true));
  socket.on("disconnect", () => store?.setWsConnected?.(false));

  // Map event backend → store (prefix "OFFICE:")
  ["AGENT_STATUS_UPDATE", "TASK_HANDOFF", "COMMISSIONER_INJECT"].forEach((evt) => {
    socket.on(evt, (payload) => store?.handleSocketEvent({ event: evt, ...payload }));
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export default socket;
