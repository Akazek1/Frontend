"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

/**
 * Online/offline state for a set of users, kept live.
 *
 * The client inbox tracks presence inside its (booking-coupled) socket effect;
 * this is the standalone version any other list can use so every inbox can show
 * the same presence dot.
 */
export function usePresenceMap(userIds: string[]): Record<string, boolean> {
  const [presence, setPresence] = useState<Record<string, boolean>>({});
  const key = userIds.filter(Boolean).sort().join(",");

  useEffect(() => {
    const ids = key ? key.split(",") : [];
    if (ids.length === 0) return;

    const socket = getSocket();
    if (!socket) return;

    const checkAll = () => {
      ids.forEach((id) => {
        socket.emit("checkPresence", id, (res: { isOnline: boolean }) => {
          setPresence((prev) => ({ ...prev, [id]: res.isOnline }));
        });
      });
    };
    const setOne = (id: string, isOnline: boolean) =>
      setPresence((prev) => (ids.includes(id) ? { ...prev, [id]: isOnline } : prev));

    const onOnline = (id: string) => setOne(id, true);
    const onOffline = (id: string) => setOne(id, false);

    socket.on("connect", checkAll);
    socket.on("userOnline", onOnline);
    socket.on("userOffline", onOffline);
    if (socket.connected) checkAll();

    return () => {
      socket.off("connect", checkAll);
      socket.off("userOnline", onOnline);
      socket.off("userOffline", onOffline);
    };
  }, [key]);

  return presence;
}
