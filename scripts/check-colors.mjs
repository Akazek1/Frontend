#!/usr/bin/env node
/**
 * Anti-drift guard for the centralized color tokens.
 *
 * Fails if any color we already tokenized reappears as a Tailwind arbitrary
 * value (e.g. `bg-[#145B10]` instead of `bg-brand`). It only checks the exact
 * hexes that HAVE a token, so it never fires on the remaining one-off colors —
 * zero false positives, and it passes today because those were all migrated.
 *
 * Run via `npm run lint` (chained) or `npm run lint:colors`.
 * To extend: add a hex -> token entry below after introducing the token in
 * tailwind.config.ts and codemodding existing usages.
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const HEX_TO_TOKEN = {
  "145b10": "brand",
  "0f4d0c": "brand-dark",
  "1b5e20": "brand-strong",
  "1b2431": "ink",
  "212121": "ink",
  "475467": "ink-muted",
  "616161": "ink-muted",
  "424242": "ink-muted",
  "344054": "ink-muted",
  "667085": "ink-subtle",
  "757575": "ink-subtle",
  "f1fcef": "surface",
};

const files = execSync(
  "find app components constant context hooks lib store utils -type f \\( -name '*.tsx' -o -name '*.ts' \\) 2>/dev/null",
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);

const violations = [];
for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const [hex, token] of Object.entries(HEX_TO_TOKEN)) {
      const re = new RegExp("\\[#" + hex + "\\]", "gi");
      if (re.test(line)) {
        violations.push({ file, line: i + 1, hex, token, text: line.trim().slice(0, 90) });
      }
    }
  });
}

if (violations.length === 0) {
  console.log("✓ color guard: no tokenized hex reused as an arbitrary value");
  process.exit(0);
}

console.error(`\n✗ color guard: ${violations.length} hardcoded color(s) that have a token.\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}`);
  console.error(`    found #${v.hex} -> use the "${v.token}" token (e.g. bg-${v.token}, text-${v.token})`);
  console.error(`    ${v.text}`);
}
console.error("\nReplace the arbitrary value with the token, then re-run.\n");
process.exit(1);
