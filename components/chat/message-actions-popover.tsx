"use client";

import React from "react";
import { Reply, Copy, Pencil, Trash2 } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { QUICK_REACTION_EMOJIS } from "@/constant";
import { cn } from "@/lib/utils";

interface MessageActionsPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: "start" | "center" | "end";
  // Long-press shows the full action row (Reply/Copy/Edit/Undo); double-tap
  // opens react-only (emoji row alone).
  showActions: boolean;
  // Edit + Undo only appear for your own message, still inside the edit window.
  canModify: boolean;
  myReaction?: string | null;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

/**
 * Context menu for a chat bubble: a quick-reaction row, plus (on long-press) a
 * Reply / Copy / Edit / Undo action row. Opened programmatically (via `open`),
 * not by tapping the anchor — a `PopoverAnchor` is used instead of
 * `PopoverTrigger` so a plain tap on the bubble doesn't also toggle it open.
 */
export function MessageActionsPopover({
  open,
  onOpenChange,
  align = "center",
  showActions,
  canModify,
  myReaction,
  onReact,
  onReply,
  onCopy,
  onEdit,
  onDelete,
  children,
}: MessageActionsPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-auto rounded-2xl border-gray-100 bg-white p-1.5 shadow-lg"
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
        </div>

        {showActions && (
          <div className="mt-1 flex items-center gap-0.5 border-t border-gray-100 pt-1">
            <ActionButton icon={Reply} label="Reply" onClick={onReply} />
            <ActionButton icon={Copy} label="Copy" onClick={onCopy} />
            {canModify && (
              <>
                <ActionButton icon={Pencil} label="Edit" onClick={onEdit} />
                <ActionButton icon={Trash2} label="Undo" onClick={onDelete} danger />
              </>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition hover:bg-gray-100 active:scale-95",
        danger ? "text-red-500" : "text-gray-600",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
