# The Odyssey

A static PWA (no build step) served from GitHub Pages. The plan lives in `data.json`;
the app only renders it. Most requests here are plan updates, not code changes.

## Updating the plan

- Change `data.json` only, and set `updated` to today's date.
- Moving on from a rung: set it to `done`, the next one to `live`, the one after that to `next`.
  Ladders must read done → live → next → later, with at most one `live`.
- `now` on a capability is the concrete thing being worked on this week; one or two sentences.
- `progress` on a rung is an optional "so far" line.
- Capability `state` is `active` (in play), `queued` (up next) or `horizon`. Array order is priority order.
- Keep the voice of the existing text: plain, specific, British spelling.
- Run `node scripts/check-data.mjs` before committing.

## Code changes

If you change any file listed in `SHELL` in `sw.js`, or add one, bump `CACHE` in `sw.js`
so installed copies drop the old cache.
