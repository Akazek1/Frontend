"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";

/**
 * Subscribe to a socket event, tolerating the socket not existing yet.
 *
 * The socket singleton is created by `useSocketConnection` in the app layout,
 * which can run after a consumer mounts. A one-shot `getSocket()` therefore
 * silently returns null and the listener is never attached — so retry until the
 * socket appears, then bind once.
 */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (payload: T) => void,
  enabled = true,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    let bound: ReturnType<typeof getSocket> | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    const listener = (payload: T) => handlerRef.current(payload);

    /** Returns true once the listener is attached. */
    const bind = (): boolean => {
      if (bound) return true;
      const socket = getSocket();
      if (!socket) return false;
      socket.on(event, listener as never);
      bound = socket;
      return true;
    };

    if (!bind()) {
      timer = setInterval(() => {
        if (bind() && timer) {
          clearInterval(timer);
          timer = null;
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
      bound?.off(event, listener as never);
    };
  }, [event, enabled]);
}
