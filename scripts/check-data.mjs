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
need(Array.isArray(data.reading), "reading must be a list");
need(data.destination?.throughout === undefined || data.destination.throughout.every(g => g.title && Array.isArray(g.items)),
  "destination.throughout must be a list of {title, note?, items}");
need(data.works === undefined || (Array.isArray(data.works.shipped) && Array.isArray(data.works.queue)), "works needs shipped and queue lists");

const p = data.protocol ?? {};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const isItem = i => typeof i === "string" ? i.length > 0 : typeof i?.text === "string";
need(Array.isArray(p.day) && p.day.every(b => typeof b.when === "string" && Array.isArray(b.do) && b.do.every(isItem)),
  "protocol.day must be a list of {when, do: [text or {text, note}]}");
need(typeof p.never === "string", "protocol.never is missing");
need(Array.isArray(p.never_how), "protocol.never_how must be a list");
need(Array.isArray(p.week) && p.week.every(w => isItem(w) && (w.day === undefined || DAYS.includes(w.day))),
  "protocol.week must be a list of {text, day?} with day one of Mon..Sun");
need(Array.isArray(p.month), "protocol.month must be a list");
need(DAYS.every(k => typeof p.training?.split?.[k] === "string"), "protocol.training.split needs an entry for every day Mon..Sun");
need(Array.isArray(p.training?.rules), "protocol.training.rules must be a list");
need(Array.isArray(p.stack) && p.stack.every(s => s.when && s.what), "protocol.stack must be a list of {when, what}");
need(Array.isArray(p.recovery), "protocol.recovery must be a list");
need(Array.isArray(data.capabilities) && data.capabilities.length, "capabilities must be a non-empty list");

const ids = new Set();
for (const [i, c] of (data.capabilities ?? []).entries()) {
  const at = `capabilities[${i}] (${c.id ?? "?"})`;
  need(/^[\w-]+$/.test(c.id ?? ""), `${at}: id must be letters, digits, - or _`);
  need(!ids.has(c.id), `${at}: duplicate id`); ids.add(c.id);
  for (const k of ["name", "goal", "why", "now"]) need(typeof c[k] === "string" && c[k], `${at}: ${k} is missing`);
  need(STATES.includes(c.state), `${at}: state must be one of ${STATES.join(", ")}`);
  need(c.kind === undefined || c.kind === "lines", `${at}: kind must be "lines" or absent`);
  need(c.method === undefined || typeof c.method === "string", `${at}: method must be text`);
  need(c.continuous === undefined || Array.isArray(c.continuous), `${at}: continuous must be a list`);
  for (const [j, r] of (c.rungs ?? []).entries())
    need(r.items === undefined || (Array.isArray(r.items) && r.items.every(x => typeof x === "string")), `${at} rung ${j}: items must be a list of text`);
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
