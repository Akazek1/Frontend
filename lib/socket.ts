import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

let socket: Socket | null = null;

export const initializeSocket = (token: string, userId: string) => {
  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      userId: userId,
    },
    // Add extra headers that might help with JWT auth
    extraHeaders: {
      Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
    },
    transports: ["polling", "websocket"],
    timeout: 15000,
    reconnection: true,
    reconnectionAttempts: 3, 
    reconnectionDelay: 3000,
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
  }
};

export const isSocketConnected = () => {
  return socket?.connected || false;
};
