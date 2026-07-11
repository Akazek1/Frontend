"use client";

import { useCallback, useRef, useState } from "react";

interface UseMessageGesturesOptions {
  enabled?: boolean;
  onLongPress: () => void;
  onDoubleTap?: () => void;
  onSwipeReply?: () => void;
}

const LONG_PRESS_MS = 450;
const DOUBLE_TAP_MS = 300;
const MOVE_CANCEL_PX = 10;
const SWIPE_MAX_PX = 72;
const SWIPE_TRIGGER_PX = 56;

/**
 * All touch/mouse gestures for a chat bubble in one place so they can't
 * fight each other:
 *  - long-press (hold without moving)  -> onLongPress
 *  - double-tap (two quick taps)       -> onDoubleTap
 *  - swipe-right (touch drag)          -> onSwipeReply, with live `dragX`
 *    for the slide-to-reply animation. Swipe is touch-only; a horizontal
 *    drag cancels the long-press, a vertical drag is left to scroll.
 */
export function useMessageGestures({
  enabled = true,
  onLongPress,
  onDoubleTap,
  onSwipeReply,
}: UseMessageGesturesOptions) {
  const [dragX, setDragX] = useState(0);
  const dragRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const longFiredRef = useRef(false);
  const swipingRef = useRef(false);
  const lastTapRef = useRef(0);

  const setDrag = useCallback((v: number) => {
    dragRef.current = v;
    setDragX(v);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const begin = useCallback(
    (x: number, y: number) => {
      if (!enabled) return;
      startRef.current = { x, y };
      longFiredRef.current = false;
      swipingRef.current = false;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        longFiredRef.current = true;
        onLongPress();
      }, LONG_PRESS_MS);
    },
    [enabled, onLongPress],
  );

  const move = useCallback(
    (x: number, y: number, allowSwipe: boolean) => {
      if (!startRef.current) return;
      const dx = x - startRef.current.x;
      const dy = y - startRef.current.y;
      if (Math.abs(dx) > MOVE_CANCEL_PX || Math.abs(dy) > MOVE_CANCEL_PX) clearTimer();

      if (allowSwipe && onSwipeReply && !longFiredRef.current && Math.abs(dx) > Math.abs(dy) && dx > 0) {
        swipingRef.current = true;
        setDrag(Math.min(dx, SWIPE_MAX_PX));
      } else if (Math.abs(dy) > Math.abs(dx)) {
        // Vertical intent — this is a scroll, abandon any swipe.
        swipingRef.current = false;
        if (dragRef.current !== 0) setDrag(0);
      }
    },
    [clearTimer, onSwipeReply, setDrag],
  );

  const finish = useCallback(() => {
    clearTimer();
    const hadStart = startRef.current !== null;
    startRef.current = null;

    if (swipingRef.current) {
      const reached = dragRef.current >= SWIPE_TRIGGER_PX;
      swipingRef.current = false;
      setDrag(0);
      if (reached) onSwipeReply?.();
      return;
    }

    if (hadStart && !longFiredRef.current) {
      const now = Date.now();
      if (onDoubleTap && now - lastTapRef.current < DOUBLE_TAP_MS) {
        lastTapRef.current = 0;
        onDoubleTap();
      } else {
        lastTapRef.current = now;
      }
    }
  }, [clearTimer, onDoubleTap, onSwipeReply, setDrag]);

  const cancel = useCallback(() => {
    clearTimer();
    startRef.current = null;
    swipingRef.current = false;
    if (dragRef.current !== 0) setDrag(0);
  }, [clearTimer, setDrag]);

  return {
    dragX,
    isDragging: dragX > 0,
    handlers: {
      onMouseDown: (e: React.MouseEvent) => begin(e.clientX, e.clientY),
      onMouseMove: (e: React.MouseEvent) => move(e.clientX, e.clientY, false),
      onMouseUp: finish,
      onMouseLeave: cancel,
      onTouchStart: (e: React.TouchEvent) => {
        const t = e.touches[0];
        if (t) begin(t.clientX, t.clientY);
      },
      onTouchMove: (e: React.TouchEvent) => {
        const t = e.touches[0];
        if (t) move(t.clientX, t.clientY, true);
      },
      onTouchEnd: finish,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    },
  };
}
