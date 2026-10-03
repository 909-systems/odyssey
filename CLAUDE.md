# The Odyssey

A static PWA (no build step) served from GitHub Pages. The plan lives in `data.json`;
the app only renders it. Most requests here are plan updates, not code changes.

## Updating the plan

- Change `data.json` only, and set `updated` to today's date.
- Moving on from a rung: set it to `done`, the next one to `live`, the one after that to
  `next`. Rungs must read done → live → next → later, with exactly one `live`.
- Array order of `capabilities` is priority order.
- Rungs carry direction only: `study`, `practise`, `build`, `daily`, and `after`. No goals,
  reasons, commentary or "done when" lines.
- One idea per list item. No semicolon-joined sentences.
- No binding dates anywhere: only what's live and what's upcoming.
- Plain, warm, specific wording, British spelling.
- This page is public: no names, and no mention of interviews or employers.
- Run `node scripts/check-data.mjs` before committing.

## Code changes

- The look: always dark, warm black with parchment text, Newsreader serif, and amber only
  for what's live. Space separates things, not lines, boxes or cards.
- A heading is the door to what it names; "up" goes one level.
- If you change any file listed in `SHELL` in `sw.js`, or add one, bump `CACHE` in `sw.js`
  so installed copies drop the old cache.
