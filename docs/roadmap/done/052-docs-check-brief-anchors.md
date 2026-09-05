# Roadmap: No line anchors in briefs

**Label:** infra
**Status:** done — Peter chose the "forbid" shape on 2026-09-05 and it shipped the same evening: `npm run check:docs` now fails on a `#L<n>` link in an active brief, and the 17 anchors that existed were rewritten to name the symbol.

## Why — the case Peter decided on

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

The shape chosen: rather than verify line anchors in briefs, **forbid them** —
a brief links a file and names the symbol (`adaptations.ts`,
`classifyCardioByDuration`), never a line. The check is a few lines (fail on
`#L<n>` under `docs/roadmap/*.md`, not `done/`) and can never itself go stale.

## The gap it closed

`npm run check:docs` ([047](047-docs-link-anchor-check.md)) verified every
`path#L<n>` anchor in [grounding-inventory.md](../../grounding-inventory.md)
and nothing else. Active briefs used the same anchor form — 17 on
2026-09-05, for example [046](../046-retire-tracked-muscle-groups.md)
pointed at `src/lib/db/user.ts#L37` for `tracked_muscle_group_ids` — and
nothing checked those.

## The change

`scripts/check-docs-links.mjs` gained a third mode, `--no-line-anchors <dir>`,
and `npm run check:docs` runs it over `docs/roadmap` (top-level files only;
`done/` is history and may point at code that no longer exists). Every link
whose fragment is `L<n>` fails the check. The 17 anchors in 012, 013, 015,
041 and 046 were rewritten in the same change: the source ones name the
symbol (`adaptationCoverage`, `classifyWeightSet`,
`classifyCardioByDuration`, the `app.ts` constants), and the two links into
done briefs point at the section heading instead. `docs/roadmap/README.md`
states the rule where the check is described.

The acceptance below is the chosen shape's; the original two boxes described
the "verify" shape and were replaced when Peter picked "forbid".

## Acceptance

- [x] `npm run check:docs` fails on a `#L<n>` link in an active brief and
      passes with none (run 2026-09-05: 0 line anchors across the active
      briefs).
- [x] The 17 anchors that existed on 2026-09-05 name a symbol or a heading
      instead, in the same change.
