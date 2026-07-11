"use client";

import React from "react";
import { Reply } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { QUICK_REACTION_EMOJIS } from "@/constant";
import { cn } from "@/lib/utils";

interface MessageActionsPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: "start" | "center" | "end";
  myReaction?: string | null;
  onReact: (emoji: string) => void;
  onReply: () => void;
  children: React.ReactNode;
}

/**
 * Long-press context menu for a chat bubble: a quick-reaction row plus a
 * Reply action. Opened programmatically (via `open`), not by tapping the
 * anchor — a `PopoverAnchor` is used instead of `PopoverTrigger` so a plain
 * tap on the bubble doesn't also toggle it open.
 */
export function MessageActionsPopover({
  open,
  onOpenChange,
  align = "center",
  myReaction,
  onReact,
  onReply,
  children,
}: MessageActionsPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-auto rounded-full border-gray-100 bg-white p-1.5 shadow-lg"
      >
        <div className="flex items-center gap-0.5">
          {QUICK_REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(emoji)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-[18px] transition hover:bg-gray-100 active:scale-90",
                myReaction === emoji && "bg-brand/10",
              )}
            >
              {emoji}
            </button>
          ))}
          <div className="mx-1 h-6 w-px bg-gray-100" />
          <button
            type="button"
            onClick={onReply}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 active:scale-90"
            aria-label="Reply"
          >
            <Reply className="h-4 w-4" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
