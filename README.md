# The Odyssey

An installable web app (PWA) that answers, at a glance: which capabilities are in play,
what's live in each, what's on the horizon, and why it matters.

Live at **https://909-systems.github.io/odyssey/** once GitHub Pages is enabled
(Settings → Pages → Source: GitHub Actions).

## Install on iPhone

Open the link in Safari → Share → **Add to Home Screen**. It opens full-screen and works
offline; when you're online it picks up plan changes the next time you open it.

## The model

Everything lives in [`data.json`](data.json):

- **destination**: the phase you're in and why.
- **rules**: what to do when you feel lost.
- **capabilities**, in priority order, each with a `state`:
  - `active`: in play now
  - `queued`: up next, not started
  - `horizon`: further out
- Each capability has **rungs**, and each rung has a `status`: `done`, `live`, `next`,
  `later`, or `ongoing`. The live rung is the lowest one whose `done_when` isn't met.
  A capability with `"kind": "lines"` has parallel tracks instead of a ladder, so more
  than one can be live.

## Updating it

Edit `data.json`, bump `updated`, and push. The deploy runs `scripts/check-data.mjs`
first, so a malformed edit fails the build instead of breaking the app. You can also ask
Claude something like "mark Analysis done in algorithms, Containers is live now". See
[`CLAUDE.md`](CLAUDE.md).

## Files

- `index.html`, `styles.css`, `app.js`: the app. No build step.
- `sw.js`: offline cache (the plan is network-first, the rest is served from cache).
- `icons/`: `icon.svg` is the source; `node scripts/render-icons.mjs` regenerates the PNGs.
- `fonts/`: Newsreader, self-hosted for offline use (SIL OFL, see `fonts/OFL.txt`).
