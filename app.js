"use strict";

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const MO = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const STATUS_LABEL = {done:"done", live:"live", ongoing:"ongoing", next:"next", later:"later"};
const STATE_LABEL = {active:"In play", queued:"Up next", horizon:"On the horizon"};
const STALE_AFTER_DAYS = 10;

let DATA = null;

function parseDate(k){ const [y,m,d] = k.split("-").map(Number); return new Date(y, m-1, d); }
function fmtDate(k){ const d = parseDate(k); return `${d.getDate()} ${MO[d.getMonth()]}`; }
function daysSince(k){
  const t = new Date(); t.setHours(0,0,0,0);
  return Math.round((t - parseDate(k)) / 86400000);
}

const liveRungs = c => c.rungs.filter(r => r.status === "live");
const nextRung = c => c.rungs.find(r => r.status === "next");
const isLines = c => c.kind === "lines";
// Where you stand on the path, e.g. "step 1 of 4" or "3 of 5 lines live".
function position(c){
  const n = c.rungs.length;
  if (isLines(c)) return `${liveRungs(c).length} of ${n} lines live`;
  const i = c.rungs.findIndex(r => r.status === "live");
  return i >= 0 ? `step ${i + 1} of ${n}` : `${n} steps`;
}
// What finishing phase one means for this capability.
function completeWhen(c){
  if (c.gate) return c.gate;
  const n = c.rungs.length, last = c.rungs[n - 1];
  return isLines(c) ? `Every line finished.` : `All ${n} steps finished, the last being ${last.title.charAt(0).toLowerCase() + last.title.slice(1)}.`;
}
function pathLine(c){
  return `<p class="path">${c.rungs.map(r => `<span class="${r.status}">${esc(r.title)}</span>`).join(`<span class="sep">${isLines(c) ? " · " : " → "}</span>`)}</p>`;
}
const byline = () => `<p class="byline"><span>${esc(DATA.owner)}</span><span>${fmtDate(DATA.updated)}</span></p>`;
const back = `<a class="back" href="#/" onclick="if(history.length>1){history.back();return false}">← back</a>`;

/* ---------- Now ---------- */
function live(c){
  const lr = liveRungs(c);
  const finish = !isLines(c) && lr[0]?.done_when
    ? `<p class="finish"><em>Finished when</em> — ${esc(lr[0].done_when)}</p>` : "";
  return `<a class="cap" href="#/c/${esc(c.id)}">
    <p class="cap-name">${esc(c.name)} <span class="pos">· ${position(c)}</span></p>
    <h3 class="cap-live">${lr.map(r => esc(r.title)).join(" · ") || "Nothing live yet"}</h3>
    <p class="nowtext">${esc(c.now)}</p>
    ${finish}
    ${pathLine(c)}
  </a>`;
}

const quiet = (c, sub) =>
  `<a class="quiet" href="#/c/${esc(c.id)}"><span class="name">${esc(c.name)}</span><span class="sub">${sub}</span></a>`;

function renderNow(){
  const d = DATA.destination;
  const caps = DATA.capabilities;
  const active = caps.filter(c => c.state === "active");
  const queued = caps.filter(c => c.state === "queued");
  const horizon = caps.filter(c => c.state === "horizon");
  const thens = active.map(c => ({c, r: nextRung(c)})).filter(x => x.r);
  const age = daysSince(DATA.updated);

  $("#view").innerHTML = `
    ${byline()}
    <header class="opening">
      <p class="eyebrow">${esc(d.phase)}</p>
      <h1 class="title">${esc(d.title)}</h1>
      <p class="why">${esc(d.why)}</p>
      ${age > STALE_AFTER_DAYS ? `<p class="stale">Last tended ${age} days ago.</p>` : ""}
      <a class="explore" href="#/map">See the whole of ${esc(d.phase.toLowerCase())} →</a>
    </header>

    <section class="sec">
      <h2 class="sec-h">What's live</h2>
      ${active.map(live).join("")}
    </section>

    <section class="sec">
      <h2 class="sec-h">After this</h2>
      ${queued.map(c => quiet(c, `begins with <span class="rn">${esc((liveRungs(c)[0] || c.rungs[0]).title)}</span>`)).join("")}
      ${thens.map(({c, r}) => quiet(c, `then <span class="rn">${esc(r.title)}</span>`)).join("")}
      ${horizon.map(c => quiet(c, "further out")).join("")}
    </section>

    <section class="closing">
      <span class="flame" aria-hidden="true"></span>
      ${DATA.rules.map(r => `<p>${esc(r)}</p>`).join("")}
    </section>

    <a class="onward" href="#/map">The whole way <span>→</span></a>`;
}

/* ---------- The whole way ---------- */
function rungTitle(r, i){
  return `<p class="rt"><span class="num">${i + 1}</span>${esc(r.title)}<span class="st">${STATUS_LABEL[r.status] || esc(r.status)}</span></p>`;
}

function renderMap(){
  const d = DATA.destination;
  $("#view").innerHTML = `
    ${byline()}
    ${back}
    <header class="opening">
      <p class="eyebrow">${esc(d.phase)}, the whole way</p>
      <h1 class="title">${esc(d.title)}</h1>
      <p class="why">Every capability, and every step on its path to the end of ${esc(d.phase.toLowerCase())}. Tap one to open it.</p>
    </header>
    ${DATA.capabilities.map(c => `<a class="mapcap" href="#/c/${esc(c.id)}">
      <span class="cap-name">${esc(c.name)}</span>
      <span class="state">${esc(STATE_LABEL[c.state] || c.state)} · ${position(c)}</span>
      <ol class="rungs">${c.rungs.map((r, i) => `<li class="rung ${r.status}">${rungTitle(r, i)}</li>`).join("")}</ol>
      ${completeWhen(c) ? `<p class="complete"><em>Complete when</em> — ${esc(completeWhen(c))}</p>` : ""}
    </a>`).join("")}`;
}

/* ---------- Capability ---------- */
function renderCap(id){
  const caps = DATA.capabilities;
  const k = caps.findIndex(x => x.id === id);
  if (k < 0){ location.replace("#/"); return; }
  const c = caps[k], prev = caps[k - 1], next = caps[k + 1];
  // Every step is shown in full; how brightly it's lit says where attention belongs.
  const rung = (r, i) => `<li class="rung ${r.status}">
    ${rungTitle(r, i)}
    ${r.what ? `<p class="what">${esc(r.what)}</p>` : ""}
    ${r.progress ? `<p class="sofar"><em>So far</em> — ${esc(r.progress)}</p>` : ""}
    ${r.done_when ? `<p class="dw"><em>Finished when</em> — ${esc(r.done_when)}</p>` : ""}
  </li>`;

  $("#view").innerHTML = `<div class="cap-page">
    ${byline()}
    ${back}
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
    ${completeWhen(c) ? `<section class="part"><h2 class="part-h">${esc(DATA.destination.phase)} is complete when</h2><p class="endline">${esc(completeWhen(c))}</p></section>` : ""}

    <nav class="capnav">
      ${prev ? `<a href="#/c/${esc(prev.id)}"><span>← previous</span>${esc(prev.name)}</a>` : "<span></span>"}
      ${next ? `<a class="nx" href="#/c/${esc(next.id)}"><span>next →</span>${esc(next.name)}</a>` : "<span></span>"}
    </nav>
  </div>`;
}

/* ---------- Routing ---------- */
function route(scroll = true){
  if (!DATA) return;
  const h = location.hash.replace(/^#/, "") || "/";
  const m = h.match(/^\/c\/([\w-]+)/);
  if (m) renderCap(m[1]);
  else if (h === "/map") renderMap();
  else renderNow();
  if (scroll) window.scrollTo(0, 0);
}
window.addEventListener("hashchange", () => route());

let lastText = "";
async function load(){
  try {
    const res = await fetch("data.json", {cache: "no-cache"});
    if (!res.ok) throw new Error(res.status);
    const text = await res.text();
    if (text === lastText) return;
    const first = !lastText;
    DATA = JSON.parse(text);
    lastText = text;
    route(first);
  } catch (e) {
    if (DATA) return;
    $("#view").innerHTML = `<div class="err"><p class="eyebrow">Odyssey</p><h1 class="title">The plan isn't here yet</h1><p class="why">Open the app once while you're online and it will be kept for offline use.</p></div>`;
  }
}
load();

/* Refresh when the app comes back to the foreground, so a plan update shows without relaunching. */
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && DATA) load(); });

if ("serviceWorker" in navigator){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
