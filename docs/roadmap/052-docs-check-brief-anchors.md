# Roadmap: Extend the docs check to line anchors in briefs

**Label:** infra
**Status:** backlog — raised 2026-09-05 at the 2.1.0 planning; Peter asked what it is and has not decided. About thirty minutes of work once he does.

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
