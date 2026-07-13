#!/usr/bin/env node
/**
 * Tops up messages/rw.json with any key that exists in messages/en.json but
 * not yet in rw.json, using the English string as a placeholder.
 *
 * Idempotent and safe to re-run any time new namespaces are added to
 * en.json: existing rw.json values (translated or not) are never touched.
 * Keys present in rw.json but no longer in en.json are dropped (stale
 * cleanup — avoids accumulating dead translations for removed strings).
 *
 * Run via `npm run i18n:sync`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const enPath = path.join(dir, "..", "messages", "en.json");
const rwPath = path.join(dir, "..", "messages", "rw.json");

const en = JSON.parse(readFileSync(enPath, "utf8"));
const rw = JSON.parse(readFileSync(rwPath, "utf8"));

function isNamespace(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

let added = 0;

function sync(enObj, rwObj) {
  const result = {};
  for (const [key, enValue] of Object.entries(enObj)) {
    if (isNamespace(enValue)) {
      const existingSub = isNamespace(rwObj?.[key]) ? rwObj[key] : {};
      result[key] = sync(enValue, existingSub);
    } else if (rwObj && Object.prototype.hasOwnProperty.call(rwObj, key)) {
      result[key] = rwObj[key];
    } else {
      result[key] = enValue;
      added++;
    }
  }
  return result;
}

const merged = sync(en, rw);
writeFileSync(rwPath, JSON.stringify(merged, null, 2) + "\n");

console.log(added === 0 ? "rw.json already up to date — no new keys." : `Added ${added} new key(s) to rw.json as English placeholders.`);
