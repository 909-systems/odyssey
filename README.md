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

- **destination**: the phase (`phase`, `title`), one line of direction (`why`), and the
  priority order in words (`order`).
- **protocol**: the daily prescription. `day` blocks by time of day (`{training}` is filled
  from today's split), `never`, `week` (an item with `"day": "Sun"` also shows that evening),
  `training.split` and `training.rules`, and `recovery`.
- **capabilities**, in priority order. Each has an optional `cadence` (standing rhythm, as
  `{label, text}` or `{label, items}`) and its **rungs**, in order.
- A rung has a `title`, a `status` (`done`, `live`, `next`, `later`), and its parts as lists:
  `study`, `practise`, `build`, `daily`. `after` names what it waits on.
- **later**: the outline of the phases after this one, as `{id, name, note?, parts}`.

## The views

- **Home**: today, each capability's live rung, and what comes later.
- **The whole phase** (`#/way`): every capability and every rung.
- **A capability** (`#/c/<id>`): its rhythm and every rung in full.
- **Later** (`#/later`): the phases after this one.
- **The protocol** (`#/protocol`): the day, the week and training.

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
