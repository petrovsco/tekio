# Roadmap: Extend the docs check to line anchors in briefs

**Label:** infra
**Status:** backlog — raised 2026-09-05 at the 2.1.0 planning; Peter asked why, the case is in "Why" below, and he has not decided. Under an hour of work either way.

## Why — the case, for Peter's decision

A brief is the first thing a fresh session reads, and a `#L<n>` anchor is a
promise that the named line holds the thing the sentence is about. The
inventory kept that promise badly — 63 of its 76 anchors were stale on
2026-09-05 — and briefs drift the same way: the same day, 4 of the 12 source
anchors in active briefs already pointed at a blank or comment line
(`adaptations.ts#L26`, `#L218`, `#L261`, `#L272`). A session that follows a
stale anchor either spends context re-finding the identifier or, worse, reads
the wrong number as the one the brief meant.

The case against: briefs are short-lived, and a session kicking one off reads
the code anyway, so a stale anchor costs a grep, not a wrong answer. The
inventory is different — it is a permanent index whose whole content is
"where does this number live", so its anchors *are* the product.

Recommended shape, if this goes ahead at all: rather than verify line anchors
in briefs, **forbid them** — a brief links a file and names the symbol
(`adaptations.ts`, `classifyCardioByDuration`), never a line. The check is
then three lines (fail on `#L<n>` under `docs/roadmap/*.md`, not `done/`) and
can never itself go stale. The 17 existing anchors are rewritten to symbols in
the same change.

## The gap

`npm run check:docs` ([done/047](done/047-docs-link-anchor-check.md))
verifies every `path#L<n>` anchor in
[grounding-inventory.md](../grounding-inventory.md): the file exists and the
named line still holds the identifier or value the row claims. Active briefs
use the same anchor form — 17 today, for example
[046](046-retire-tracked-muscle-groups.md) points at
`src/lib/db/user.ts#L37` for `tracked_muscle_group_ids` — and nothing checks
those. They drift the same way the inventory's did (63 of 76 were stale on
2026-09-05, before 047).

## The change

Run the same checker over `docs/roadmap/*.md` — active briefs only; `done/`
is history and may legitimately point at code that no longer exists. Report
per file. An anchor whose line names no identifier stays "unchecked" (a
warning), exactly as the inventory's do today.

## Acceptance

- [ ] `npm run check:docs` reports the active briefs' anchors alongside the
      inventory's.
- [ ] The current anchors pass or are corrected in the same change.
