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
- **reading**: how to read the plan (the live step, priority order).
- **protocol**: the daily prescription and everything under it.
  - `day`: blocks by time of day, each a list of things to do. `{training}` is replaced with
    today's session from the split, and an item can carry a quiet `note`.
  - `never`, `never_how`: the don'ts, and how they're kept.
  - `week` (an item with `"day": "Sun"` also shows that evening), `month`.
  - `training.split` (Mon to Sun) and `training.rules`, `stack`, `recovery`.
- **capabilities**, in priority order, each with a `state`:
  - `active`: in play now
  - `queued`: up next, not started
  - `horizon`: further out
- Each capability has **rungs** (steps), and each has a `status`: `done`, `live`, `next`,
  `later`, or `ongoing`. The live step is the lowest one whose `done_when` isn't met.
  A capability with `"kind": "lines"` has parallel tracks instead of a ladder, so more
  than one can be live. `gate` (optional) says what finishing the phase means for it;
  `method` (optional) describes how the work is done.

## The views

- **Home**: today's prescription, what's live (with each capability's whole path on one
  line), what hasn't begun, and what to do when a day goes wrong.
- **The whole way** (`#/way`): every capability and every step in the phase.
- **A capability** (`#/c/<id>`): now, why, every step in full, and what completes it.
- **The protocol** (`#/protocol`): the day, the week, the month, training, the stack.

Moving around: a heading opens the thing it names (the phase title opens the whole phase,
a capability's name opens it, any step opens that step). Each home section says in its
heading row where its full page is. "Up" goes one level: a capability back to its place in
the phase, the phase and the protocol back home. The byline always goes home. Deep links
land on the right spot: `#/c/<id>/<step>`, `#/way/<id>`, `#/protocol/<part>`.

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
