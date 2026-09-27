// Validates data.json so a bad edit fails the deploy instead of breaking the app.
// Run: node scripts/check-data.mjs
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../data.json", import.meta.url), "utf8"));
const errors = [];
const need = (cond, msg) => { if (!cond) errors.push(msg); };
const STATES = ["active", "queued", "horizon"];
const STATUSES = ["done", "live", "ongoing", "next", "later"];

need(typeof data.owner === "string" && data.owner, "owner is missing");
need(/^\d{4}-\d{2}-\d{2}$/.test(data.updated ?? ""), "updated must be YYYY-MM-DD");
for (const k of ["phase", "title", "why"]) need(typeof data.destination?.[k] === "string", `destination.${k} is missing`);
need(Array.isArray(data.rules), "rules must be a list");
need(Array.isArray(data.capabilities) && data.capabilities.length, "capabilities must be a non-empty list");

const ids = new Set();
for (const [i, c] of (data.capabilities ?? []).entries()) {
  const at = `capabilities[${i}] (${c.id ?? "?"})`;
  need(/^[\w-]+$/.test(c.id ?? ""), `${at}: id must be letters, digits, - or _`);
  need(!ids.has(c.id), `${at}: duplicate id`); ids.add(c.id);
  for (const k of ["name", "goal", "why", "now"]) need(typeof c[k] === "string" && c[k], `${at}: ${k} is missing`);
  need(STATES.includes(c.state), `${at}: state must be one of ${STATES.join(", ")}`);
  need(c.kind === undefined || c.kind === "lines", `${at}: kind must be "lines" or absent`);
  need(Array.isArray(c.rungs) && c.rungs.length, `${at}: rungs must be a non-empty list`);
  for (const [j, r] of (c.rungs ?? []).entries()) {
    need(typeof r.title === "string" && r.title, `${at} rung ${j}: title is missing`);
    need(STATUSES.includes(r.status), `${at} rung ${j}: status must be one of ${STATUSES.join(", ")}`);
  }
  if (c.kind !== "lines" && Array.isArray(c.rungs)) {
    const order = c.rungs.map(r => STATUSES.indexOf(r.status === "ongoing" ? "live" : r.status));
    need(order.every((v, k) => k === 0 || v >= order[k - 1]), `${at}: a ladder's rungs must go done → live → next → later`);
    need(c.rungs.filter(r => r.status === "live").length <= 1, `${at}: a ladder has at most one live rung`);
    if (c.state === "active") need(c.rungs.some(r => r.status === "live"), `${at}: an active ladder needs a live rung`);
  }
}

if (errors.length) { console.error(errors.map(e => "✗ " + e).join("\n")); process.exit(1); }
console.log(`✓ data.json ok: ${data.capabilities.length} capabilities, updated ${data.updated}`);
