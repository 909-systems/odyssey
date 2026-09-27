"use strict";

/* The Odyssey renders data.json. Four views, all reached by plain links:
   #/            home: the day's prescription, what's live, what hasn't begun, recovery
   #/way         the whole phase: every capability and every step
   #/c/<id>      one capability in full
   #/protocol    the full protocol: day, week, month, training, stack, recovery */

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

/* ---------- Plan helpers ---------- */
const isLines = c => c.kind === "lines";
const liveRungs = c => c.rungs.filter(r => r.status === "live");

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

// The whole path on one line, lit where you are.
const pathLine = c => `<p class="path">${c.rungs.map(r => `<span class="${r.status}">${esc(r.title)}</span>`)
  .join(`<span class="sep">${isLines(c) ? " · " : " → "}</span>`)}</p>`;

const rungTitle = (r, i) =>
  `<p class="rt"><span class="num">${i + 1}</span>${esc(r.title)}<span class="st">${esc(r.status)}</span></p>`;

/* ---------- Shared pieces ---------- */
const byline = () => {
  const now = new Date();
  return `<p class="byline"><span>${esc(DATA.owner)}</span><span>${WD[now.getDay()]} ${fmtDate(now)}</span></p>`;
};
const home = `<a class="back" href="#/">← home</a>`;
const more = (href, text) => `<a class="more" href="${href}">${text} →</a>`;

/* ---------- The day (home and protocol share it) ---------- */
function dayItem(item){
  const it = typeof item === "string" ? {text: item} : item;
  const training = DATA.protocol.training.split[todayKey()] || "rest";
  const text = esc(it.text).replace("{training}", `<span class="today">${esc(training)}</span>`);
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
  return `<a class="cap" href="#/c/${esc(c.id)}">
    <p class="cap-name">${esc(c.name)}</p>
    <h3 class="cap-live">${lr.map(r => esc(r.title)).join(" · ") || "Nothing live yet"}</h3>
    <p class="nowtext">${esc(c.now)}</p>
    ${finish}
    ${pathLine(c)}
  </a>`;
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
      <p class="eyebrow">${esc(d.phase)}</p>
      <h1 class="title">${esc(d.title)}</h1>
      <p class="why">${esc(d.why)}</p>
      ${age > STALE_AFTER_DAYS ? `<p class="stale">The plan was last tended ${age} days ago.</p>` : ""}
    </header>

    <section class="sec">
      <h2 class="sec-h">Today</h2>
      ${theDay()}
      ${more("#/protocol", "The whole protocol")}
    </section>

    <section class="sec">
      <h2 class="sec-h">What's live</h2>
      ${active.map(liveEntry).join("")}
    </section>

    ${waiting.length ? `<section class="sec">
      <h2 class="sec-h">Not yet begun</h2>
      ${waiting.map(c => `<a class="quiet" href="#/c/${esc(c.id)}"><span class="name">${esc(c.name)}</span>
        <span class="sub">${esc(STATE_LABEL[c.state] || c.state)}, beginning with <span class="rn">${esc(c.rungs[0].title)}</span></span></a>`).join("")}
      ${more("#/way", `The whole of ${esc(d.phase.toLowerCase())}`)}
    </section>` : ""}

    ${recovery()}`;
}

/* ---------- The whole way ---------- */
function renderWay(){
  const d = DATA.destination;
  $("#view").innerHTML = `
    ${byline()}
    ${home}
    <header class="opening">
      <p class="eyebrow">${esc(d.phase)}, the whole way</p>
      <h1 class="title">${esc(d.title)}</h1>
      ${DATA.reading.map(r => `<p class="why">${esc(r)}</p>`).join("")}
      <p class="asof">The plan as of ${fmtDate(parseDate(DATA.updated))}.</p>
    </header>
    ${DATA.capabilities.map(c => `<a class="waycap" href="#/c/${esc(c.id)}">
      <span class="cap-name">${esc(c.name)}</span>
      <span class="state">${esc(STATE_LABEL[c.state] || c.state)} · ${position(c)}</span>
      <ol class="rungs">${c.rungs.map((r, i) => `<li class="rung ${r.status}">${rungTitle(r, i)}</li>`).join("")}</ol>
      <p class="complete"><em>Complete when</em> ${esc(completeWhen(c))}</p>
    </a>`).join("")}`;
}

/* ---------- Capability ---------- */
function renderCap(id){
  const caps = DATA.capabilities;
  const k = caps.findIndex(x => x.id === id);
  if (k < 0){ location.replace("#/"); return; }
  const c = caps[k], prev = caps[k - 1], next = caps[k + 1];
  // Every step in full; how brightly it's lit says where attention belongs.
  const rung = (r, i) => `<li class="rung ${r.status}">
    ${rungTitle(r, i)}
    ${r.what ? `<p class="what">${esc(r.what)}</p>` : ""}
    ${r.progress ? `<p class="sofar"><em>So far</em> ${esc(r.progress)}</p>` : ""}
    ${r.done_when ? `<p class="dw"><em>Finished when</em> ${esc(r.done_when)}</p>` : ""}
  </li>`;

  $("#view").innerHTML = `
    ${byline()}
    ${home}
    <header class="opening">
      <p class="eyebrow">${esc(STATE_LABEL[c.state] || c.state)} · ${position(c)}</p>
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
    <section class="part"><h2 class="part-h">${esc(DATA.destination.phase)} is complete when</h2><p class="endline">${esc(completeWhen(c))}</p></section>

    <nav class="capnav" aria-label="Other capabilities">
      ${prev ? `<a href="#/c/${esc(prev.id)}"><span>← previous</span>${esc(prev.name)}</a>` : "<span></span>"}
      ${next ? `<a class="nx" href="#/c/${esc(next.id)}"><span>next →</span>${esc(next.name)}</a>` : "<span></span>"}
    </nav>`;
}

/* ---------- The protocol ---------- */
function renderProtocol(){
  const p = DATA.protocol;
  const today = todayKey();
  const list = items => `<ul class="do">${items.map(i => `<li>${esc(typeof i === "string" ? i : i.text)}</li>`).join("")}</ul>`;
  $("#view").innerHTML = `
    ${byline()}
    ${home}
    <header class="opening">
      <p class="eyebrow">The protocol</p>
      <h1 class="title">How the days go</h1>
      <p class="why">The behaviours everything else rests on. Kept by default, not by willpower.</p>
    </header>

    <section class="part"><h2 class="part-h">Every day</h2>${theDay()}</section>
    <section class="part"><h2 class="part-h">Every week</h2>${list(p.week)}</section>
    <section class="part"><h2 class="part-h">Every month</h2>${list(p.month)}</section>
    <section class="part"><h2 class="part-h">Training</h2>
      <ul class="split">${DAY_KEYS.slice(1).concat("Sun").map(k =>
        `<li class="${k === today ? "on" : ""}"><span class="dk">${k}</span>${esc(p.training.split[k])}</li>`).join("")}</ul>
      ${list(p.training.rules)}
    </section>
    <section class="part"><h2 class="part-h">The stack</h2>
      ${p.stack.map(s => `<div class="stack"><p class="when-h">${esc(s.when)}</p><p>${esc(s.what)}</p></div>`).join("")}
    </section>
    ${recovery()}`;
}

/* ---------- Routing ---------- */
function arrive(){
  const m = $("#view");
  m.classList.remove("enter"); void m.offsetWidth; m.classList.add("enter");
}

const scrollMemory = {};
let currentHash = null;

function route(){
  if (!DATA) return;
  const h = location.hash.replace(/^#/, "") || "/";
  const m = h.match(/^\/c\/([\w-]+)/);
  if (m) renderCap(m[1]);
  else if (h === "/way" || h === "/map") renderWay();
  else if (h === "/protocol") renderProtocol();
  else renderHome();
}

// Remember where you were on each view, so coming back home doesn't lose your place.
window.addEventListener("hashchange", () => {
  if (currentHash !== null) scrollMemory[currentHash] = window.scrollY;
  currentHash = location.hash || "#/";
  route();
  arrive();
  window.scrollTo(0, scrollMemory[currentHash] || 0);
});

let lastText = "";
async function load(){
  try {
    const res = await fetch("data.json", {cache: "no-cache"});
    if (!res.ok) throw new Error(res.status);
    const text = await res.text();
    if (text === lastText) return;
    DATA = JSON.parse(text);
    lastText = text;
    const first = currentHash === null;
    if (first) currentHash = location.hash || "#/";
    route();
    if (first) arrive();
  } catch (e) {
    if (DATA) return;
    $("#view").innerHTML = `<div class="err"><p class="eyebrow">Odyssey</p><h1 class="title">The plan isn't here yet</h1><p class="why">Open the app once while you're online and it will be kept for offline use.</p></div>`;
  }
}
load();

// Coming back to the app: pick up plan changes, and re-render so "today" is today.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" || !DATA) return;
  const y = window.scrollY;
  lastText = "";
  load().then(() => window.scrollTo(0, y));
});

if ("serviceWorker" in navigator){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
