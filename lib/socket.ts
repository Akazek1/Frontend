import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3003";

let socket: Socket | null = null;
let socketAuthKey: string | null = null;

export const initializeSocket = (token: string, userId: string) => {
  const normalizedToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  const authKey = `${userId}:${normalizedToken}`;

  // If a socket already exists (connected, connecting, or auto-reconnecting),
  // return it immediately. Multiple components call initializeSocket and they
  // must all share the same instance. Only disconnectSocket() (called on logout)
  // should null the reference and allow a fresh socket to be created.
  if (socket !== null) {
    if (socketAuthKey !== authKey) {
      socket.off();
      socket.disconnect();
      socket = null;
      socketAuthKey = null;
    } else {
      socket.auth = { token: normalizedToken, userId };
      socket.io.opts.extraHeaders = { Authorization: normalizedToken };
      if (!socket.connected && !socket.active) socket.connect();
      return socket;
    }
  }

  if (socket !== null) {
    return socket;
  }

  socketAuthKey = authKey;
  socket = io(SOCKET_URL, {
    auth: {
      token: normalizedToken,
      userId,
    },
    extraHeaders: {
      Authorization: normalizedToken,
    },
    transports: ["polling", "websocket"],
    timeout: 15000,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    forceNew: false,
    upgrade: true,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("⚠️ Socket connection error:", error.message);
  });

  socket.on("reconnect", (attempt) => {
    console.log("🔄 Socket reconnected after", attempt, "attempts");
  });

  socket.on("reconnect_error", (error) => {
    console.error("Socket reconnection error:", error.message);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.warn("Socket not initialized");
    return null;
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.off();
    socket.disconnect();
    socket = null;
    socketAuthKey = null;
  }
};

export const isSocketConnected = () => {
  return socket?.connected || false;
};
