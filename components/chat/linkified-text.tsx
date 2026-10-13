"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { tokenizeChatLinks } from "@/lib/chat-links";
import { ConfirmActionDialog } from "./confirm-action-dialog";

// The bubble around this text listens for taps, long-presses and swipes. React
// events bubble through portals, so both the link and the warning dialog have
// to stop them or a tap would also react to / reply to the message.
const stop = (e: React.SyntheticEvent) => e.stopPropagation();
const stopGestures = {
  onClick: stop,
  onMouseDown: stop,
  onMouseUp: stop,
  onTouchStart: stop,
  onTouchMove: stop,
  onTouchEnd: stop,
  onContextMenu: stop,
};

/**
 * Renders message text with any links made tappable. No network fetch /
 * preview card — just linkification (see lib/chat-links.ts for what counts).
 *
 * - A link to this app navigates in place instead of opening a second copy.
 * - Any other link opens in a new tab.
 * - A link that hides where it goes asks first, showing the real destination.
 */
export function LinkifiedText({ text, isMe }: { text: string; isMe: boolean }) {
  const t = useTranslations("chatRoom");
  const router = useRouter();
  const tokens = useMemo(() => tokenizeChatLinks(text), [text]);
  const [pending, setPending] = useState<{ href: string; host: string } | null>(null);

  const handleClick = (e: React.MouseEvent, href: string, host: string, suspicious: boolean) => {
    e.stopPropagation();
    if (suspicious) {
      e.preventDefault();
      setPending({ href, host });
      return;
    }
    const url = new URL(href);
    if (url.host === window.location.host) {
      e.preventDefault();
      router.push(`${url.pathname}${url.search}${url.hash}`);
    }
  };

  return (
    <span className="whitespace-pre-wrap break-words">
      {tokens.map((token, i) =>
        token.type === "text" ? (
          <React.Fragment key={i}>{token.text}</React.Fragment>
        ) : (
          <a
            key={i}
            href={token.href}
            target="_blank"
            rel="noopener noreferrer"
            {...stopGestures}
            onClick={(e) => handleClick(e, token.href, token.host, token.suspicious)}
            className={cn("underline underline-offset-2 break-all", isMe ? "text-white" : "text-brand")}
          >
            {token.text}
          </a>
        ),
      )}
      {pending && (
        <span {...stopGestures}>
          <ConfirmActionDialog
            open
            tone="danger"
            title={t("linkWarningTitle")}
            body={t("linkWarningBody", { host: pending.host })}
            confirmLabel={t("linkWarningOpen")}
            dismissLabel={t("linkWarningStay")}
            onConfirm={() => {
              window.open(pending.href, "_blank", "noopener,noreferrer");
              setPending(null);
            }}
            onDismiss={() => setPending(null)}
          />
        </span>
      )}
    </span>
  );
}
