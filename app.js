"use strict";

/* The Odyssey renders data.json.

   Pages, and how they nest:
     #/                  home: today, what's live, what hasn't begun
       #/way             the whole phase ........ #/way/<id> lands on one capability
         #/c/<id>        one capability ......... #/c/<id>/<n> lands on step n
       #/protocol        the protocol ........... #/protocol/<part> lands on a part

   How you move between them:
   - A heading is the door to the thing it names: the phase title opens the whole
     phase, a capability's name opens that capability, a step opens that step.
   - Each home section says in its heading row where its full page is.
   - "Up" goes one level up the nesting above, back to where you'd expect to be.
   - The byline always goes home. */

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const MO = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WD = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_KEYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const STATE_LABEL = {active:"In play", queued:"Up next", horizon:"Further out"};
const STALE_AFTER_DAYS = 10;

let DATA = null;

/* ---------- Dates ---------- */
function parseDate(k){ const [y,m,d] = k.split("-").map(Number); return new Date(y, m-1, d); }
const fmtDate = d => `${d.getDate()} ${MO[d.getMonth()]}`;
function daysSince(k){
  const t = new Date(); t.setHours(0,0,0,0);
  return Math.round((t - parseDate(k)) / 86400000);
}
const todayKey = () => DAY_KEYS[new Date().getDay()];

/* ---------- Links ---------- */
const to = {
  home: "#/",
  way: id => id ? `#/way/${id}` : "#/way",
  cap: (id, n) => n ? `#/c/${id}/${n}` : `#/c/${id}`,
  protocol: part => part ? `#/protocol/${part}` : "#/protocol",
};
const go = `<span class="go" aria-hidden="true">→</span>`;
const up = (href, label) => `<a class="up" href="${href}">← ${esc(label)}</a>`;
const secHead = (title, href, label) =>
  `<div class="sec-h"><h2>${esc(title)}</h2>${href ? `<a href="${href}">${esc(label)} ${go}</a>` : ""}</div>`;

/* ---------- Plan helpers ---------- */
const isLines = c => c.kind === "lines";
const liveRungs = c => c.rungs.filter(r => r.status === "live");
const stepNo = (c, r) => c.rungs.indexOf(r) + 1;

function position(c){
  const n = c.rungs.length;
  if (isLines(c)) return `${liveRungs(c).length} of ${n} lines live`;
  const i = c.rungs.findIndex(r => r.status === "live");
  return i >= 0 ? `step ${i + 1} of ${n}` : `${n} steps`;
}

// What finishing the phase means for this capability.
function completeWhen(c){
  if (c.gate) return c.gate;
  if (isLines(c)) return "Every line finished.";
  return `All ${c.rungs.length} steps finished, ending with ${c.rungs[c.rungs.length - 1].title}.`;
}

// The whole path on one line, lit where you are; every step is a door to itself.
const pathLine = c => `<p class="path">${c.rungs.map((r, i) =>
  `<a class="${r.status}" href="${to.cap(c.id, i + 1)}">${esc(r.title)}</a>`)
  .join(`<span class="sep">${isLines(c) ? " · " : " → "}</span>`)}</p>`;

const rungTitle = (r, i) =>
  `<span class="num">${i + 1}</span>${esc(r.title)}<span class="st">${esc(r.status)}</span>`;

/* ---------- Shared pieces ---------- */
const byline = () => {
  const now = new Date();
  return `<p class="byline"><a href="${to.home}">${esc(DATA.owner)}</a><span>${WD[now.getDay()]} ${fmtDate(now)}</span></p>`;
};

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
      ${p.never_how.map(h => `<p class="never-how">${esc(h)}</p>`).join("")}
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
  const lr = liveRungs(c);
  const finish = !isLines(c) && lr[0]?.done_when
    ? `<p class="finish"><em>Finished when</em> ${esc(lr[0].done_when)}</p>` : "";
  const titles = lr.map(r => `<a href="${to.cap(c.id, stepNo(c, r))}">${esc(r.title)}</a>`).join(`<span class="sep"> · </span>`);
  return `<article class="cap">
    <a class="cap-name" href="${to.cap(c.id)}">${esc(c.name)} ${go}</a>
    <h3 class="cap-live">${titles || "Nothing live yet"}</h3>
    <p class="nowtext">${esc(c.now)}</p>
    ${finish}
    ${pathLine(c)}
  </article>`;
}

function renderHome(){
  const d = DATA.destination;
  const caps = DATA.capabilities;
  const active = caps.filter(c => c.state === "active");
  const waiting = caps.filter(c => c.state !== "active");
  const age = daysSince(DATA.updated);

  $("#view").innerHTML = `
    ${byline()}
    <header class="opening">
      <a class="door" href="${to.way()}">
        <p class="eyebrow">${esc(d.phase)}</p>
        <h1 class="title">${esc(d.title)} ${go}</h1>
      </a>
      <p class="why">${esc(d.why)}</p>
      ${age > STALE_AFTER_DAYS ? `<p class="stale">The plan was last tended ${age} days ago.</p>` : ""}
    </header>

    <section class="sec">
      ${secHead("Today", to.protocol(), "the protocol")}
      ${theDay()}
    </section>

    <section class="sec">
      ${secHead("What's live", to.way(), `all of ${d.phase.toLowerCase()}`)}
      ${active.map(liveEntry).join("")}
    </section>

    ${waiting.length ? `<section class="sec">
      ${secHead("Not yet begun")}
      ${waiting.map(c => `<a class="quiet" href="${to.cap(c.id)}"><span class="name">${esc(c.name)} ${go}</span>
        <span class="sub">${esc(STATE_LABEL[c.state] || c.state)}, beginning with <span class="rn">${esc(c.rungs[0].title)}</span></span></a>`).join("")}
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
      ${DATA.reading.map(r => `<p class="why">${esc(r)}</p>`).join("")}
      <p class="asof">The plan as of ${fmtDate(parseDate(DATA.updated))}.</p>
      <nav class="index" aria-label="Parts of the phase"><a href="${to.way("throughout")}">Throughout</a><span class="sep"> · </span><a href="${to.way("capabilities")}">The capabilities</a><span class="sep"> · </span><a href="${to.way("works")}">Published work</a></nav>
    </header>
    ${throughout()}
    <div id="cap-capabilities"></div>
    ${DATA.capabilities.map(c => `<section class="waycap" id="cap-${esc(c.id)}">
      <a class="cap-name" href="${to.cap(c.id)}">${esc(c.name)} ${go}</a>
      <p class="state">${esc(STATE_LABEL[c.state] || c.state)} · ${position(c)}</p>
      <ol class="rungs">${c.rungs.map((r, i) =>
        `<li class="rung ${r.status}"><a class="rt" href="${to.cap(c.id, i + 1)}">${rungTitle(r, i)}</a></li>`).join("")}</ol>
      <p class="complete"><em>Complete when</em> ${esc(completeWhen(c))}</p>
    </section>`).join("")}
    ${works()}`;
}

function throughout(){
  const t = DATA.destination.throughout;
  if (!t) return "";
  return `<section class="part" id="cap-throughout"><h2 class="part-h">Throughout: conditions on all the work</h2>
    ${t.map(g => `<div class="group"><p class="when-h">${esc(g.title)}${g.note ? ` · ${esc(g.note)}` : ""}</p>
      <ul class="items">${g.items.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}
  </section>`;
}

function works(){
  const w = DATA.works;
  if (!w) return "";
  const piece = x => `<li><span class="wname">${esc(x.name)}</span> ${esc(x.what)}${x.rides ? `<span class="note">Rides ${esc(x.rides.charAt(0).toLowerCase() + x.rides.slice(1))}; ${esc(x.size)}.</span>` : ""}</li>`;
  return `<section class="part" id="cap-works"><h2 class="part-h">Published work</h2>
    <p>${esc(w.about)}</p>
    <div class="group"><p class="when-h">Next, in order</p><ul class="items works">${w.queue.map(piece).join("")}</ul></div>
    <div class="group"><p class="when-h">Shipped</p><ul class="items works">${w.shipped.map(piece).join("")}</ul></div>
  </section>`;
}

/* ---------- Capability ---------- */
function renderCap(id){
  const caps = DATA.capabilities;
  const k = caps.findIndex(x => x.id === id);
  if (k < 0){ location.replace(to.home); return; }
  const c = caps[k], prev = caps[k - 1], next = caps[k + 1];
  // Every step in full; how brightly it's lit says where attention belongs.
  const rung = (r, i) => `<li class="rung ${r.status}" id="step-${i + 1}">
    <p class="rt">${rungTitle(r, i)}</p>
    ${r.because ? `<p class="because">${esc(r.because)}</p>` : ""}
    ${r.items ? `<ul class="items">${r.items.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    ${r.what ? `<p class="what">${esc(r.what)}</p>` : ""}
    ${r.progress ? `<p class="sofar"><em>So far</em> ${esc(r.progress)}</p>` : ""}
    ${r.done_when ? `<p class="dw"><em>Finished when</em> ${esc(r.done_when)}</p>` : ""}
  </li>`;

  $("#view").innerHTML = `
    ${byline()}
    ${up(to.way(c.id), DATA.destination.title)}
    <header class="opening">
      <p class="eyebrow">${c.code ? `${esc(c.code)} · ` : ""}${esc(STATE_LABEL[c.state] || c.state)} · ${position(c)}</p>
      <h1 class="title">${esc(c.name)}</h1>
      <p class="goal">${esc(c.goal)}</p>
    </header>

    <section class="part"><h2 class="part-h">Now</h2><p class="focus">${esc(c.now)}</p></section>
    <section class="part"><h2 class="part-h">Why it matters</h2><p>${esc(c.why)}</p></section>
    <section class="part"><h2 class="part-h">${isLines(c) ? "The lines, side by side" : "The path"}</h2>
      ${pathLine(c)}
      <ol class="rungs full">${c.rungs.map(rung).join("")}</ol>
    </section>
    ${c.method ? `<section class="part"><h2 class="part-h">The method</h2><p>${esc(c.method)}</p></section>` : ""}
    ${c.continuous ? `<section class="part"><h2 class="part-h">Throughout</h2><ul class="items">${c.continuous.map(x => `<li>${esc(x)}</li>`).join("")}</ul></section>` : ""}
    <section class="part"><h2 class="part-h">${esc(DATA.destination.phase)} is complete when</h2><p class="endline">${esc(completeWhen(c))}</p></section>

    <nav class="capnav" aria-label="Other capabilities">
      ${prev ? `<a href="${to.cap(prev.id)}"><span>← previous</span>${esc(prev.name)}</a>` : "<span></span>"}
      ${next ? `<a class="nx" href="${to.cap(next.id)}"><span>next →</span>${esc(next.name)}</a>` : "<span></span>"}
    </nav>`;
}

/* ---------- The protocol ---------- */
const PROTOCOL_PARTS = [["day","Day"],["week","Week"],["month","Month"],["training","Training"],["stack","Stack"]];

function renderProtocol(){
  const p = DATA.protocol;
  const today = todayKey();
  const list = items => `<ul class="do">${items.map(i => `<li>${esc(typeof i === "string" ? i : i.text)}</li>`).join("")}</ul>`;
  const part = (key, title, body) => `<section class="part" id="p-${key}"><h2 class="part-h">${title}</h2>${body}</section>`;
  $("#view").innerHTML = `
    ${byline()}
    ${up(to.home, "home")}
    <header class="opening">
      <p class="eyebrow">The protocol</p>
      <h1 class="title">How the days go</h1>
      <p class="why">The behaviours everything else rests on. Kept by default, not by willpower.</p>
      <nav class="index" aria-label="Parts of the protocol">${PROTOCOL_PARTS.map(([k, t]) => `<a href="${to.protocol(k)}">${t}</a>`).join(`<span class="sep"> · </span>`)}</nav>
    </header>

    ${part("day", "Every day", theDay())}
    ${part("week", "Every week", list(p.week))}
    ${part("month", "Every month", list(p.month))}
    ${part("training", "Training", `
      <ul class="split">${DAY_KEYS.slice(1).concat("Sun").map(k =>
        `<li class="${k === today ? "on" : ""}"><span class="dk">${k}</span>${esc(p.training.split[k])}</li>`).join("")}</ul>
      ${list(p.training.rules)}`)}
    ${part("stack", "The stack", p.stack.map(s => `<div class="stack"><p class="when-h">${esc(s.when)}</p><p>${esc(s.what)}</p></div>`).join(""))}
    ${recovery()}`;
}

/* ---------- Routing ---------- */
// A location is a page plus an optional place on it.
function locate(){
  const [kind, a, b] = (location.hash.replace(/^#\/?/, "")).split("/");
  if (kind === "c" && a)                   return {page: `c/${a}`, render: () => renderCap(a), anchor: b && `step-${b}`};
  if (kind === "way" || kind === "map")    return {page: "way", render: renderWay, anchor: a && `cap-${a}`};
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
