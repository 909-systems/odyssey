// Validates data.json so a bad edit fails the deploy instead of breaking the app.
// Run: node scripts/check-data.mjs
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../data.json", import.meta.url), "utf8"));
const errors = [];
const need = (cond, msg) => { if (!cond) errors.push(msg); };
const STATES = ["active", "queued", "horizon"];
const STATUSES = ["done", "live", "next", "later"];
const FIELDS = ["study", "practise", "build", "daily"];
const isText = v => typeof v === "string" && v.length > 0;
const isList = v => Array.isArray(v) && v.length > 0 && v.every(isText);

need(isText(data.owner), "owner is missing");
need(/^\d{4}-\d{2}-\d{2}$/.test(data.updated ?? ""), "updated must be YYYY-MM-DD");
for (const k of ["phase", "title", "why", "order"]) need(isText(data.destination?.[k]), `destination.${k} is missing`);

// The protocol
const p = data.protocol ?? {};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const isItem = i => isText(i) || isText(i?.text);
need(Array.isArray(p.day) && p.day.every(b => isText(b.when) && Array.isArray(b.do) && b.do.every(isItem)),
  "protocol.day must be a list of {when, do: [text or {text, note}]}");
need(isText(p.never), "protocol.never is missing");
need(p.never_how === undefined || Array.isArray(p.never_how), "protocol.never_how must be a list");
need(Array.isArray(p.week) && p.week.every(w => isItem(w) && (w.day === undefined || DAYS.includes(w.day))),
  "protocol.week must be a list of {text, day?} with day one of Mon..Sun");
need(p.month === undefined || Array.isArray(p.month), "protocol.month must be a list");
need(DAYS.every(k => isText(p.training?.split?.[k])), "protocol.training.split needs an entry for every day Mon..Sun");
need(Array.isArray(p.training?.rules), "protocol.training.rules must be a list");
need(p.stack === undefined || (Array.isArray(p.stack) && p.stack.every(s => s.when && s.what)), "protocol.stack must be a list of {when, what}");
need(Array.isArray(p.recovery), "protocol.recovery must be a list");

// The capabilities: array order is priority order
need(Array.isArray(data.capabilities) && data.capabilities.length, "capabilities must be a non-empty list");
const ids = new Set();
for (const [i, c] of (data.capabilities ?? []).entries()) {
  const at = `capabilities[${i}] (${c.id ?? "?"})`;
  need(/^[\w-]+$/.test(c.id ?? ""), `${at}: id must be letters, digits, - or _`);
  need(!ids.has(c.id), `${at}: duplicate id`); ids.add(c.id);
  need(isText(c.name), `${at}: name is missing`);
  need(STATES.includes(c.state), `${at}: state must be one of ${STATES.join(", ")}`);
  need(c.cadence === undefined || (Array.isArray(c.cadence) && c.cadence.every(x => isText(x.label) && (isText(x.text) || isList(x.items)))),
    `${at}: cadence must be a list of {label, text} or {label, items}`);
  need(Array.isArray(c.rungs) && c.rungs.length, `${at}: rungs must be a non-empty list`);
  for (const [j, r] of (c.rungs ?? []).entries()) {
    const rat = `${at} rung ${j + 1}`;
    need(isText(r.title), `${rat}: title is missing`);
    need(STATUSES.includes(r.status), `${rat}: status must be one of ${STATUSES.join(", ")}`);
    need(r.after === undefined || isText(r.after), `${rat}: after must be text`);
    for (const k of FIELDS) need(r[k] === undefined || isList(r[k]), `${rat}: ${k} must be a list of text`);
    need(FIELDS.some(k => r[k]), `${rat}: needs at least one of ${FIELDS.join(", ")}`);
  }
  const order = (c.rungs ?? []).map(r => STATUSES.indexOf(r.status));
  need(order.every((v, k) => k === 0 || v >= order[k - 1]), `${at}: rungs must go done → live → next → later`);
  need((c.rungs ?? []).filter(r => r.status === "live").length <= 1, `${at}: at most one live rung`);
  if (c.state === "active") need((c.rungs ?? []).some(r => r.status === "live"), `${at}: an active capability needs a live rung`);
}

// Later phases
need(data.later === undefined || (Array.isArray(data.later) && data.later.every(ph =>
  /^[\w-]+$/.test(ph.id ?? "") && isText(ph.name) && Array.isArray(ph.parts) && ph.parts.every(x => isText(x.label) && isList(x.items)))),
  "later must be a list of {id, name, note?, parts: [{label, items}]}");

if (errors.length) { console.error(errors.map(e => "✗ " + e).join("\n")); process.exit(1); }
console.log(`✓ data.json ok: ${data.capabilities.length} capabilities, updated ${data.updated}`);
