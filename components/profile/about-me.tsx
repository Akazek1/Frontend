"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export function AboutMe({ bio }: { bio?: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!bio || bio.trim().length === 0) return null;

  return (
    <section className="mx-4 mt-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h2 className="text-lg font-bold text-ink mb-2">About Me</h2>
      <p
        className={`text-sm text-ink leading-relaxed whitespace-pre-line ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {bio}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand"
      >
        {expanded ? "Show less" : "Read more"}
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
    </section>
  );
}
