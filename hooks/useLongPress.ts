"use client";

import { useCallback, useRef } from "react";

interface UseLongPressOptions {
  threshold?: number;
  onClick?: () => void;
  onDoubleTap?: () => void;
}

const MOVE_CANCEL_THRESHOLD_PX = 10;
const DOUBLE_TAP_MS = 300;

/**
 * Returns mouse/touch handlers for a "long-press to open a context menu"
 * gesture, with a plain tap falling through to `onClick` and an optional
 * `onDoubleTap` (two quick taps). Cancels the pending long-press if the
 * pointer drags past a small threshold, so it doesn't fire on every
 * scroll-start touch inside a scrollable chat list.
 */
export function useLongPress(
  onLongPress: () => void,
  { threshold = 450, onClick, onDoubleTap }: UseLongPressOptions = {},
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);
  const lastTapRef = useRef(0);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const start = useCallback(
    (x: number, y: number) => {
      firedRef.current = false;
      startPosRef.current = { x, y };
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        firedRef.current = true;
        onLongPress();
      }, threshold);
    },
    [onLongPress, threshold],
  );

  const move = useCallback(
    (x: number, y: number) => {
      if (!startPosRef.current) return;
      const dx = Math.abs(x - startPosRef.current.x);
      const dy = Math.abs(y - startPosRef.current.y);
      if (dx > MOVE_CANCEL_THRESHOLD_PX || dy > MOVE_CANCEL_THRESHOLD_PX) {
        clear();
      }
    },
    [clear],
  );

  const end = useCallback(() => {
    const wasPending = timerRef.current !== null;
    clear();
    // Only a short press (long-press timer hadn't fired) counts as a tap.
    if (wasPending && !firedRef.current) {
      const now = Date.now();
      if (onDoubleTap && now - lastTapRef.current < DOUBLE_TAP_MS) {
        lastTapRef.current = 0; // consume, so a third tap starts fresh
        onDoubleTap();
      } else {
        lastTapRef.current = now;
        onClick?.();
      }
    }
  }, [clear, onClick, onDoubleTap]);

  return {
    onMouseDown: (e: React.MouseEvent) => start(e.clientX, e.clientY),
    onMouseMove: (e: React.MouseEvent) => move(e.clientX, e.clientY),
    onMouseUp: end,
    onMouseLeave: clear,
    onTouchStart: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) start(touch.clientX, touch.clientY);
    },
    onTouchMove: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) move(touch.clientX, touch.clientY);
    },
    onTouchEnd: end,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}
