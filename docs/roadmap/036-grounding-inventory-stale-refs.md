# Roadmap: Grounding inventory — sweep stale references

**Label:** bug
**Status:** planned — found 2026-09-01 by a link check while retiring briefs 009/014.

[docs/grounding-inventory.md](../grounding-inventory.md) still links
`src/components/tabs/home/RecoveryCard.tsx` (5×) and
`src/components/tabs/OverviewTab.tsx` (2×) — both deleted 2026-08-31 when the
fused Home shipped. Per [done/014](done/014-doctrine-ledger-execution.md),
rows 4.6–4.9 (`RECOVERY_WEIGHTS`) retired with the constant but the inventory
rows were never marked so.

## Scope

- Mark rows 4.6–4.9 retired (constant deleted, not grounded — cite 014's
  readiness comparison); repoint or retire the other RecoveryCard/OverviewTab
  rows against what actually computes today (`src/lib/fusedRead.ts`).
- Re-run the link check over `docs/` (extract `](…)` targets, `test -e`) and
  fix any other dead target it finds.
- **Repoint the drifted `#L<n>` anchors.** Found 2026-09-01 while reindexing §1–§3
  for [019](done/019-adaptation-model-simplification.md): the anchors into
  `src/lib/adaptations.ts` are off by 8–14 lines (e.g. §2's `classifyWeightSet`
  row points at `#L23`, the duration heuristic rows at `#L38`/`#L39`, and the
  `statusFor` row at `#L135`, which is now a field declaration). 019 repointed
  only the rows it rewrote, in §1–§3 — the rest of the file was not touched, and
  every unvisited anchor should be assumed stale. A line anchor is not a dead
  link, so the `test -e` check above will not catch these; they need reading the
  target line and confirming it is the claim the row names.
- The inventory is reference-only: state what *is*, no follow-ups added.

## Acceptance

- [ ] The link check over `docs/` reports zero dead relative targets.
- [ ] Rows 4.6–4.9 carry a retired state pointing at done/014.
- [ ] Every `#L<n>` anchor in the inventory lands on the line its row describes.
