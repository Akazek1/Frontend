#!/usr/bin/env node
/**
 * Reports Kinyarwanda translation progress: how many leaf strings in
 * messages/rw.json actually differ from messages/en.json (translated) vs.
 * are missing or still byte-identical to the English source (untranslated
 * placeholder from i18n-sync-rw.mjs).
 *
 * Run via `npm run i18n:progress` for a per-namespace summary, or
 * `npm run i18n:progress -- --list` to also print every untranslated key.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const en = JSON.parse(readFileSync(path.join(dir, "..", "messages", "en.json"), "utf8"));
const rw = JSON.parse(readFileSync(path.join(dir, "..", "messages", "rw.json"), "utf8"));

const showList = process.argv.includes("--list");

function isNamespace(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function walk(enObj, rwObj, pathPrefix) {
  let total = 0;
  let translated = 0;
  const untranslated = [];

  for (const [key, enValue] of Object.entries(enObj)) {
    const keyPath = pathPrefix ? `${pathPrefix}.${key}` : key;
    if (isNamespace(enValue)) {
      const sub = walk(enValue, isNamespace(rwObj?.[key]) ? rwObj[key] : {}, keyPath);
      total += sub.total;
      translated += sub.translated;
      untranslated.push(...sub.untranslated);
    } else {
      total++;
      const rwValue = rwObj?.[key];
      if (rwValue !== undefined && rwValue !== enValue) {
        translated++;
      } else {
        untranslated.push(keyPath);
      }
    }
  }
  return { total, translated, untranslated };
}

// Per-namespace breakdown (top-level keys of en.json).
const rows = [];
let grandTotal = 0;
let grandTranslated = 0;
const allUntranslated = [];

for (const [namespace, enValue] of Object.entries(en)) {
  if (!isNamespace(enValue)) continue; // top level is namespaces only in this schema
  const { total, translated, untranslated } = walk(enValue, isNamespace(rw[namespace]) ? rw[namespace] : {}, namespace);
  rows.push({ namespace, total, translated, pct: total ? Math.round((translated / total) * 100) : 100 });
  grandTotal += total;
  grandTranslated += translated;
  allUntranslated.push(...untranslated);
}

rows.sort((a, b) => a.pct - b.pct);

const nameWidth = Math.max(...rows.map((r) => r.namespace.length), "NAMESPACE".length);
console.log("NAMESPACE".padEnd(nameWidth), " DONE/TOTAL", "  PCT");
for (const r of rows) {
  const bar = "█".repeat(Math.round(r.pct / 5)).padEnd(20, "░");
  console.log(r.namespace.padEnd(nameWidth), ` ${String(r.translated).padStart(3)}/${String(r.total).padEnd(3)}`, ` ${String(r.pct).padStart(3)}%  ${bar}`);
}

const grandPct = grandTotal ? Math.round((grandTranslated / grandTotal) * 100) : 100;
console.log("\n" + "-".repeat(nameWidth + 30));
console.log(`TOTAL: ${grandTranslated}/${grandTotal} strings translated (${grandPct}%)`);

if (showList) {
  console.log("\nUntranslated keys:");
  for (const k of allUntranslated) console.log(" -", k);
} else if (allUntranslated.length > 0) {
  console.log(`\nRun with --list to see all ${allUntranslated.length} untranslated key paths.`);
}
