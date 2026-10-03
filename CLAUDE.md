# The Odyssey

A static PWA (no build step) served from GitHub Pages. The plan lives in `data.json`;
the app only renders it. Most requests here are plan updates, not code changes.

## Updating the plan

- Change `data.json` only, and set `updated` to today's date.
- Moving on from a rung: set it to `done`, the next one to `live`, the one after that to `next`.
  Ladders must read done → live → next → later, with at most one `live`.
- Rungs carry only direction: `study`, `practise`, `build`, `daily`, and `after`. No commentary,
  reasons or "done when" lines.
- Capability `state` is `active` (in play), `queued` (up next) or `horizon`. Array order is priority order.
- The protocol lives under `protocol`; see the README for its shape. `{training}` in a day item is
  filled from `protocol.training.split` for the current weekday.
- No binding dates anywhere in the plan: only what's live and what's upcoming.
- Keep the voice of the existing text: plain, specific, British spelling. No names, and no
  mention of interviews or employers: this page is public.
- Run `node scripts/check-data.mjs` before committing.

## Code changes

If you change any file listed in `SHELL` in `sw.js`, or add one, bump `CACHE` in `sw.js`
so installed copies drop the old cache.
