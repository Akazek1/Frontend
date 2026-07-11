"use client";

import React, { useRef, useState } from "react";
import { Reply, Copy, Pencil, Trash2 } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { QUICK_REACTION_EMOJIS, SKIN_TONES, applySkinTone, supportsSkinTone } from "@/constant";
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
  skinTone: string;
  onChangeSkinTone: (tone: string) => void;
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
 * Long-pressing a tone-capable emoji (👍/🙏) opens a skin-tone chooser.
 */
export function MessageActionsPopover({
  open,
  onOpenChange,
  align = "center",
  showActions,
  canModify,
  myReaction,
  skinTone,
  onChangeSkinTone,
  onReact,
  onReply,
  onCopy,
  onEdit,
  onDelete,
  children,
}: MessageActionsPopoverProps) {
  const [tonePickerOpen, setTonePickerOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (!o) setTonePickerOpen(false);
        onOpenChange(o);
      }}
    >
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-auto rounded-2xl border-gray-100 bg-white p-1.5 shadow-lg"
      >
        {tonePickerOpen ? (
          <div className="flex items-center gap-0.5">
            {SKIN_TONES.map((tone) => (
              <button
                key={tone || "default"}
                type="button"
                onClick={() => {
                  onChangeSkinTone(tone);
                  setTonePickerOpen(false);
                }}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-[18px] transition hover:bg-gray-100 active:scale-90",
                  skinTone === tone && "bg-brand/10",
                )}
              >
                {applySkinTone("👍", tone)}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-0.5">
            {QUICK_REACTION_EMOJIS.map((emoji) => {
              const display = applySkinTone(emoji, skinTone);
              return (
                <EmojiReactButton
                  key={emoji}
                  display={display}
                  active={myReaction === display}
                  onReact={() => onReact(display)}
                  onLongPress={supportsSkinTone(emoji) ? () => setTonePickerOpen(true) : undefined}
                />
              );
            })}
          </div>
        )}

        {showActions && !tonePickerOpen && (
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

// A reaction emoji that reacts on a tap but, when it supports skin tones, opens
// the tone chooser on a long-press instead.
function EmojiReactButton({
  display,
  active,
  onReact,
  onLongPress,
}: {
  display: string;
  active: boolean;
  onReact: () => void;
  onLongPress?: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFiredRef = useRef(false);

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <button
      type="button"
      onPointerDown={() => {
        longFiredRef.current = false;
        if (onLongPress) {
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            longFiredRef.current = true;
            onLongPress();
          }, 350);
        }
      }}
      onPointerUp={() => {
        clear();
        if (!longFiredRef.current) onReact();
      }}
      onPointerLeave={clear}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-[18px] transition hover:bg-gray-100 active:scale-90",
        active && "bg-brand/10",
      )}
    >
      {display}
    </button>
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
