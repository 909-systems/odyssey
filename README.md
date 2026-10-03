# The Odyssey

An installable web app (PWA) that shows, at a glance, what's live and what comes next.

Live at **https://909-systems.github.io/odyssey/**.

## Install on iPhone

Open the link in Safari → Share → **Add to Home Screen**. It opens full-screen and works
offline, and picks up plan changes the next time you open it online.

## The pages

- **Home**: today's protocol, each capability's live rung, and what comes later.
- **The whole phase** (`#/way`): every capability and every rung, in priority order.
- **A capability** (`#/c/<id>`): its standing rhythm and every rung in full.
- **Later** (`#/later`): the phases after this one.
- **The protocol** (`#/protocol`): the day, the week and training.

A heading opens the thing it names. "Up" goes one level. The byline always goes home.
Deep links land on the right spot: `#/c/<id>/<rung>`, `#/way/<id>`, `#/later/<id>`,
`#/protocol/<part>`.

## The data

Everything lives in [`data.json`](data.json):

- **destination**: `phase`, `title`, one line of direction (`why`), and how to order the work (`order`).
- **protocol**: `day` (blocks by time of day; `{training}` is filled from today's split),
  `never`, `week` (an item with `"day": "Sun"` also shows that evening), `month`,
  `training.split` and `training.rules`, `stack`, and `recovery`.
- **capabilities**, in priority order. Each has an optional `cadence` (its standing rhythm,
  as `{label, text}` or `{label, items}`) and its `rungs`, in order.
- A **rung** has a `title`, a `status` (`done`, `live`, `next`, `later`), and its parts as
  lists: `study`, `practise`, `build`, `daily`. `after: {id, rung}` names another
  capability's rung it waits on.
- **later**: the phases after this one, as `{id, name, note?, parts: [{label, items}]}`.

## Updating it

Edit `data.json` and push. The deploy runs `scripts/check-data.mjs` first, so a malformed
edit fails the build instead of breaking the app. You can also ask Claude, for example
"Analysis is done". See [`CLAUDE.md`](CLAUDE.md).

## Files

- `index.html`, `styles.css`, `app.js`: the app. No build step.
- `sw.js`: offline cache (the plan is network-first, the rest is served from cache).
- `icons/`: `icon.svg` is the source; `node scripts/render-icons.mjs` regenerates the PNGs.
- `fonts/`: Newsreader, self-hosted for offline use (SIL OFL, see `fonts/OFL.txt`).
