import type { ReactNode } from "react";

// Minimal typographic wrapper for blog article bodies (no @tailwindcss/typography
// in this project). Styles headings / paragraphs / lists / links via child
// selectors so article files stay plain JSX.
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div
      className={[
        "max-w-none text-[15px] leading-relaxed text-ink",
        "[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:tracking-tight [&_h2]:text-ink",
        "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-ink",
        "[&_p]:my-4",
        "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_li]:my-1.5",
        "[&_a]:font-medium [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-brand-dark",
        "[&_strong]:font-semibold [&_strong]:text-ink",
        "[&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-brand/30 [&_blockquote]:pl-4 [&_blockquote]:text-ink-muted",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
