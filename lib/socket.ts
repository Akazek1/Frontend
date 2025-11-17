import { io, type Socket } from "socket.io-client";

// Get Socket URL - use environment variable or detect from window location
const getSocketUrl = () => {
  if (typeof window !== "undefined") {
    // If running on mobile/network, use the host's IP
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      // Replace port 3000 with 3001 for backend
      return `http://${hostname}:3001`;
    }
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
};

const SOCKET_URL = getSocketUrl();

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
    
  });

  socket.on("disconnect", () => {
   
  });

  socket.on("connect_error", () => {
   
  });

  socket.on("reconnect", () => {
    
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
