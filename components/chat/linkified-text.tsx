"use client";

import React from "react";
import { cn } from "@/lib/utils";

// Matches http(s) URLs and bare www. links. A trailing run of punctuation is
// trimmed off the match (so "see https://x.com." doesn't swallow the period).
const URL_REGEX = /(\bhttps?:\/\/[^\s]+|\bwww\.[^\s]+)/gi;
const TRAILING_PUNCT = /[.,!?;:)\]}'"]+$/;

/**
 * Renders message text with any URLs turned into tappable links (opening in a
 * new tab). No network fetch / preview card — just linkification.
 */
export function LinkifiedText({ text, isMe }: { text: string; isMe: boolean }) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    const raw = match[0];
    const trailing = raw.match(TRAILING_PUNCT)?.[0] ?? "";
    const url = trailing ? raw.slice(0, raw.length - trailing.length) : raw;
    const start = match.index;

    if (start > lastIndex) parts.push(text.slice(lastIndex, start));

    const href = url.startsWith("http") ? url : `https://${url}`;
    parts.push(
      <a
        key={start}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        // Don't let a tap on the link also trigger the bubble's gesture handlers.
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className={cn("underline underline-offset-2 break-all", isMe ? "text-white" : "text-brand")}
      >
        {url}
      </a>,
    );
    if (trailing) parts.push(trailing);
    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return <span className="whitespace-pre-wrap break-words">{parts}</span>;
}
