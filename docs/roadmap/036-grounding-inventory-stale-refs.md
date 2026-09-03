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
  fix any other dead target it finds. A first pass over `done/026–032`
  (2026-09-03, folded in here rather than filed on its own) found 14, all
  mechanical — relative paths not adjusted when the brief moved into `done/`,
  and three source links one directory too shallow:
  - `026` → `../032-profile-admin-signal-restyle.md` (032 is in `done/` now)
  - `027` → `034-v2-1-candidates-tbc.md`, `038-favicon-and-app-icon.md` (need `../`)
  - `028` → `005-hr-zone-intensity-classification.md`, `034-…` (need `../`)
  - `029` → `038-favicon-and-app-icon.md` (needs `../`)
  - `030` → `../032-…` (in `done/`), `../../src/constants/program.ts` (needs `../../../`)
  - `032` → `033-…`, `034-…`, `035-…` (need `../`), `done/026-…` (same
    folder — drop `done/`), `../../src/components/layout/ExportPane.tsx` and
    `ImportPane.tsx` (need `../../../`)
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
