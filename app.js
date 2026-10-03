"use strict";

/* The Odyssey renders data.json.

   Pages, and how they nest:
     #/                  home: today, what's live, what comes later
       #/way             the whole phase ........ #/way/<id> lands on one capability
         #/c/<id>        one capability ......... #/c/<id>/<n> lands on rung n
       #/later           phases 2 and 3 ......... #/later/<id> lands on one phase
       #/protocol        the protocol ........... #/protocol/<part> lands on a part

   How you move between them:
   - A heading is the door to the thing it names.
   - Each home section says in its heading row where its full page is.
   - "Up" goes one level up the nesting above. The byline always goes home. */

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const MO = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WD = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_KEYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// The parts of a rung, in the order they're read.
const FIELDS = [["after","Starts after"],["study","Study"],["practise","Practise"],["build","Build"],["daily","Daily"]];

let DATA = null;

const fmtDate = d => `${d.getDate()} ${MO[d.getMonth()]}`;
const todayKey = () => DAY_KEYS[new Date().getDay()];

/* ---------- Links ---------- */
const to = {
  home: "#/",
  way: id => id ? `#/way/${id}` : "#/way",
  cap: (id, n) => n ? `#/c/${id}/${n}` : `#/c/${id}`,
  later: id => id ? `#/later/${id}` : "#/later",
  protocol: part => part ? `#/protocol/${part}` : "#/protocol",
};
const go = `<span class="go" aria-hidden="true">→</span>`;
const up = (href, label) => `<a class="up" href="${href}">← ${esc(label)}</a>`;
const secHead = (title, href, label) =>
  `<div class="sec-h"><h2>${esc(title)}</h2>${href ? `<a href="${href}">${esc(label)} ${go}</a>` : ""}</div>`;
const byline = () => {
  const now = new Date();
  return `<p class="byline"><a href="${to.home}">${esc(DATA.owner)}</a><span>${WD[now.getDay()]} ${fmtDate(now)}</span></p>`;
};

/* ---------- Plan pieces ---------- */
const list = items => `<ul class="items">${items.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
// A labelled line: the label in the margin, the direction beside it.
const field = (label, body) => `<div class="field"><p class="label">${esc(label)}</p><div class="body">${body}</div></div>`;

function rungFields(r){
  return FIELDS.filter(([k]) => r[k]).map(([k, label]) =>
    field(label, Array.isArray(r[k]) ? list(r[k]) : `<p>${esc(r[k])}</p>`)).join("");
}
const cadence = c => (c.cadence || []).map(x => field(x.label, x.items ? list(x.items) : `<p>${esc(x.text)}</p>`)).join("");

const liveIndex = c => c.rungs.findIndex(r => r.status === "live");
const position = c => { const i = liveIndex(c); return i >= 0 ? `rung ${i + 1} of ${c.rungs.length}` : `${c.rungs.length} rungs`; };

// The whole ladder on one line, lit where you are; every rung is a door to itself.
const pathLine = c => `<p class="path">${c.rungs.map((r, i) =>
  `<a class="${r.status}" href="${to.cap(c.id, i + 1)}">${esc(r.title)}</a>`).join(`<span class="sep"> → </span>`)}</p>`;

const rungTitle = (r, i) => `<span class="num">${i + 1}</span>${esc(r.title)}`;

/* ---------- The day (home and protocol share it) ---------- */
function dayItem(item){
  const it = typeof item === "string" ? {text: item} : item;
  const training = DATA.protocol.training.split[todayKey()] || "rest";
  const text = esc(it.text).replace("{training}", `<a class="today" href="${to.protocol("training")}">${esc(training)}</a>`);
  return `<li>${text}${it.note ? `<span class="note">${esc(it.note)}</span>` : ""}</li>`;
}

function theDay(){
  const p = DATA.protocol;
  const tonight = p.week.filter(w => w.day === todayKey());
  const blocks = p.day.map(b => {
    const items = b.do.map(dayItem);
    if (b.when === "Evening") items.push(...tonight.map(w => `<li><span class="today">${esc(w.text)}</span></li>`));
    return `<div class="when"><p class="when-h">${esc(b.when)}</p><ul class="do">${items.join("")}</ul></div>`;
  }).join("");
  return `${blocks}
    <div class="when never"><p class="when-h">Never</p>
      <p class="never-line">${esc(p.never)}</p>
      ${(p.never_how || []).map(h => `<p class="never-how">${esc(h)}</p>`).join("")}
    </div>`;
}

function recovery(){
  return `<section class="closing">
    <span class="flame" aria-hidden="true"></span>
    <p class="closing-h">When a day goes wrong</p>
    ${DATA.protocol.recovery.map(r => `<p>${esc(r)}</p>`).join("")}
  </section>`;
}

/* ---------- Home ---------- */
function liveEntry(c){
  const i = liveIndex(c);
  const r = c.rungs[i];
  return `<article class="cap">
    <a class="cap-name" href="${to.cap(c.id)}">${esc(c.name)} ${go}</a>
    ${r ? `<h3 class="cap-live"><a href="${to.cap(c.id, i + 1)}">${rungTitle(r, i)}</a></h3>
    <div class="fields">${rungFields(r)}</div>
    ${c.cadence ? `<div class="fields standing-home">${cadence(c)}</div>` : ""}` : ""}
    ${pathLine(c)}
  </article>`;
}

function renderHome(){
  const d = DATA.destination;
  $("#view").innerHTML = `
    ${byline()}
    <header class="opening">
      <a class="door" href="${to.way()}">
        <p class="eyebrow">${esc(d.phase)}</p>
        <h1 class="title">${esc(d.title)} ${go}</h1>
      </a>
      <p class="why">${esc(d.why)}</p>
    </header>

    <section class="sec">
      ${secHead("Today", to.protocol(), "the protocol")}
      ${theDay()}
    </section>

    <section class="sec">
      ${secHead("What's live", to.way(), `all of ${d.phase.toLowerCase()}`)}
      ${DATA.capabilities.map(liveEntry).join("")}
    </section>

    ${DATA.later?.length ? `<section class="sec">
      ${secHead("Later", to.later(), "the outline")}
      ${DATA.later.map(ph => `<a class="quiet" href="${to.later(ph.id)}"><span class="name">${esc(ph.name)} ${go}</span></a>`).join("")}
    </section>` : ""}

    ${recovery()}`;
}

/* ---------- The whole phase ---------- */
function renderWay(){
  const d = DATA.destination;
  $("#view").innerHTML = `
    ${byline()}
    ${up(to.home, "home")}
    <header class="opening">
      <p class="eyebrow">${esc(d.phase)}, the whole way</p>
      <h1 class="title">${esc(d.title)}</h1>
      <p class="why">${esc(d.order)}</p>
    </header>
    ${DATA.capabilities.map(c => `<section class="waycap" id="cap-${esc(c.id)}">
      <a class="cap-name" href="${to.cap(c.id)}">${esc(c.name)} ${go}</a>
      <p class="state">${position(c)}</p>
      <ol class="rungs">${c.rungs.map((r, i) =>
        `<li class="rung ${r.status}"><a class="rt" href="${to.cap(c.id, i + 1)}">${rungTitle(r, i)}${r.after ? `<span class="st">after ${esc(r.after)}</span>` : ""}</a></li>`).join("")}</ol>
    </section>`).join("")}
    ${DATA.later?.length ? `<a class="more" href="${to.later()}">${DATA.later.map(p => esc(p.name.split(" — ")[0])).join(" and ")} ${go}</a>` : ""}`;
}

/* ---------- Capability ---------- */
function renderCap(id){
  const caps = DATA.capabilities;
  const k = caps.findIndex(x => x.id === id);
  if (k < 0){ location.replace(to.home); return; }
  const c = caps[k], prev = caps[k - 1], next = caps[k + 1];
  // Every rung in full; how brightly it's lit says where attention belongs.
  const rung = (r, i) => `<li class="rung ${r.status}" id="step-${i + 1}">
    <p class="rt">${rungTitle(r, i)}${r.status === "live" ? `<span class="st">live</span>` : ""}</p>
    <div class="fields">${rungFields(r)}</div>
  </li>`;

  $("#view").innerHTML = `
    ${byline()}
    ${up(to.way(c.id), DATA.destination.phase)}
    <header class="opening">
      <p class="eyebrow">${position(c)}</p>
      <h1 class="title">${esc(c.name)}</h1>
    </header>
    ${c.cadence ? `<div class="fields standing">${cadence(c)}</div>` : ""}
    <section class="part">
      ${pathLine(c)}
      <ol class="rungs full">${c.rungs.map(rung).join("")}</ol>
    </section>

    <nav class="capnav" aria-label="Other capabilities">
      ${prev ? `<a href="${to.cap(prev.id)}"><span>← previous</span>${esc(prev.name)}</a>` : "<span></span>"}
      ${next ? `<a class="nx" href="${to.cap(next.id)}"><span>next →</span>${esc(next.name)}</a>` : "<span></span>"}
    </nav>`;
}

/* ---------- Later phases ---------- */
function renderLater(){
  $("#view").innerHTML = `
    ${byline()}
    ${up(to.home, "home")}
    <header class="opening">
      <p class="eyebrow">After ${esc(DATA.destination.phase.toLowerCase())}</p>
      <h1 class="title">Later</h1>
    </header>
    ${DATA.later.map(ph => `<section class="part" id="later-${esc(ph.id)}">
      <h2 class="phase-h">${esc(ph.name)}</h2>
      ${ph.note ? `<p class="phase-note">${esc(ph.note)}</p>` : ""}
      <div class="fields">${ph.parts.map(x => field(x.label, list(x.items))).join("")}</div>
    </section>`).join("")}`;
}

/* ---------- The protocol ---------- */
function renderProtocol(){
  const p = DATA.protocol;
  const today = todayKey();
  const plain = items => `<ul class="do">${items.map(i => `<li>${esc(typeof i === "string" ? i : i.text)}</li>`).join("")}</ul>`;
  const part = (key, title, body) => `<section class="part" id="p-${key}"><h2 class="part-h">${title}</h2>${body}</section>`;
  const parts = [["day", "Every day", theDay()], ["week", "Every week", plain(p.week)]];
  if (p.month?.length) parts.push(["month", "Every month", plain(p.month)]);
  parts.push(["training", "Training", `
      <ul class="split">${DAY_KEYS.slice(1).concat("Sun").map(k =>
        `<li class="${k === today ? "on" : ""}"><span class="dk">${k}</span>${esc(p.training.split[k])}</li>`).join("")}</ul>
      ${plain(p.training.rules)}`]);
  if (p.stack?.length) parts.push(["stack", "The stack", p.stack.map(s => `<div class="stack"><p class="when-h">${esc(s.when)}</p><p>${esc(s.what)}</p></div>`).join("")]);
  $("#view").innerHTML = `
    ${byline()}
    ${up(to.home, "home")}
    <header class="opening">
      <p class="eyebrow">The protocol</p>
      <h1 class="title">How the days go</h1>
      <nav class="index" aria-label="Parts of the protocol">${parts.map(([k, t]) => `<a href="${to.protocol(k)}">${t.replace(/^Every /, "").replace(/^The /, "").replace(/^./, s => s.toUpperCase())}</a>`).join(`<span class="sep"> · </span>`)}</nav>
    </header>
    ${parts.map(([k, t, b]) => part(k, t, b)).join("")}
    ${recovery()}`;
}

/* ---------- Routing ---------- */
// A location is a page plus an optional place on it.
function locate(){
  const [kind, a, b] = (location.hash.replace(/^#\/?/, "")).split("/");
  if (kind === "c" && a)                   return {page: `c/${a}`, render: () => renderCap(a), anchor: b && `step-${b}`};
  if (kind === "way" || kind === "map")    return {page: "way", render: renderWay, anchor: a && `cap-${a}`};
  if (kind === "later" && DATA.later)      return {page: "later", render: renderLater, anchor: a && `later-${a}`};
  if (kind === "protocol")                 return {page: "protocol", render: renderProtocol, anchor: a && `p-${a}`};
  return {page: "home", render: renderHome};
}

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
function arrive(){
  const m = $("#view");
  m.classList.remove("enter"); void m.offsetWidth; m.classList.add("enter");
}
function scrollToAnchor(id, smooth){
  const el = id && document.getElementById(id);
  if (!el) return false;
  window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - 28, behavior: smooth && !reduceMotion ? "smooth" : "auto"});
  return true;
}

// Each page remembers how far down you were, so coming back doesn't lose your place.
const scrollMemory = {};
let here = null;

function show(){
  if (!DATA) return;
  const loc = locate();
  const samePage = here && here.page === loc.page;
  if (here) scrollMemory[here.page] = window.scrollY;
  here = loc;
  if (samePage && loc.anchor){ scrollToAnchor(loc.anchor, true); return; }
  loc.render();
  if (!samePage) arrive();
  if (!scrollToAnchor(loc.anchor, false)) window.scrollTo(0, scrollMemory[loc.page] || 0);
}
window.addEventListener("hashchange", show);

let lastText = "";
async function load(){
  try {
    const res = await fetch("data.json", {cache: "no-cache"});
    if (!res.ok) throw new Error(res.status);
    const text = await res.text();
    if (text === lastText) return;
    DATA = JSON.parse(text);
    lastText = text;
    if (!here) show();
    else { const y = window.scrollY; here.render(); window.scrollTo(0, y); }
  } catch (e) {
    if (DATA) return;
    $("#view").innerHTML = `<div class="err"><p class="eyebrow">Odyssey</p><h1 class="title">The plan isn't here yet</h1><p class="why">Open the app once while you're online and it will be kept for offline use.</p></div>`;
  }
}
load();

// Coming back to the app: pick up plan changes, and re-render so "today" is today.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" || !DATA) return;
  lastText = "";
  load();
});

if ("serviceWorker" in navigator){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
