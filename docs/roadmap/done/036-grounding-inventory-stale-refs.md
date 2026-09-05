# Roadmap: Grounding inventory — sweep stale references

**Label:** bug
**Status:** done — shipped 2026-09-05 (v1.18.1): 25 dead links fixed across `docs/`, §4 of the inventory re-indexed against `fusedRead.ts`, all 74 line anchors re-read.

[docs/grounding-inventory.md](../../grounding-inventory.md) still links
`src/components/tabs/home/RecoveryCard.tsx` (5×) and
`src/components/tabs/OverviewTab.tsx` (2×) — both deleted 2026-08-31 when the
fused Home shipped. Per [done/014](014-doctrine-ledger-execution.md),
rows 4.6–4.9 (`RECOVERY_WEIGHTS`) retired with the constant but the inventory
rows were never marked so.

## Scope

- Mark rows 4.6–4.9 retired (constant deleted, not grounded — cite 014's
  readiness comparison); repoint or retire the other RecoveryCard/OverviewTab
  rows against what actually computes today (`src/lib/fusedRead.ts`).
- Rows 4.5, 4.10 and 7.3 are the Habits-side numbers — the adherence target,
  the 0.10 weight, and `habitCompletionSets`' one-set-per-completion. All three
  still say "being deleted"; the deletion ran on 2026-09-05
  ([done/035](035-habits-expiry-deletion.md)), so they retire the same way
  as 4.6–4.9, pointing at 014 and 035.
- Re-run the link check over `docs/` (extract every relative link target, `test -e`) and
  fix any other dead target it finds. A first pass over `done/026–032`
  (2026-09-03, folded in here rather than filed on its own) found 14, all
  mechanical — relative paths not adjusted when the brief moved into `done/`,
  and three source links one directory too shallow:
  - `026` → `../032-profile-admin-signal-restyle.md` (032 is in `done/` now)
  - `027` → `034-v2-1-candidates-tbc.md`, `038-favicon-and-app-icon.md` (need `../`)
  - `028` → `005-hr-zone-intensity-classification.md`, `034-…` (need `../`)
  - `029` → `038-favicon-and-app-icon.md` (needs `../`)
  - `030` → `../032-…` (in `done/`), `../../src/constants/program.ts` (needs `../../../`)
  - `032` → `033-…`, `034-…` (need `../`; its `035-…` link became correct when
    035 moved into `done/` on 2026-09-05), `done/026-…` (same
    folder — drop `done/`), `../../src/components/layout/ExportPane.tsx` and
    `ImportPane.tsx` (need `../../../`)
- **Repoint the drifted `#L<n>` anchors.** Found 2026-09-01 while reindexing §1–§3
  for [019](019-adaptation-model-simplification.md): the anchors into
  `src/lib/adaptations.ts` are off by 8–14 lines (e.g. §2's `classifyWeightSet`
  row points at `#L23`, the duration heuristic rows at `#L38`/`#L39`, and the
  `statusFor` row at `#L135`, which is now a field declaration). 019 repointed
  only the rows it rewrote, in §1–§3 — the rest of the file was not touched, and
  every unvisited anchor should be assumed stale. A line anchor is not a dead
  link, so the `test -e` check above will not catch these; they need reading the
  target line and confirming it is the claim the row names.
- The inventory is reference-only: state what *is*, no follow-ups added.

## Acceptance

- [x] The link check over `docs/` reports zero dead relative targets.
- [x] Rows 4.6–4.9 carry a retired state pointing at done/014.
- [x] Every `#L<n>` anchor in the inventory lands on the line its row describes.

## Shipped 2026-09-05

The check found 25 dead targets, not 21: the 14 listed above, the seven
RecoveryCard / OverviewTab links, `colors.ts` (deleted by 033), and two in
`done/014` that 035 broke (the editor's old `habits/` path and the deleted
`habits.test.ts`). Of the 76 line anchors, 63 were off — every one outside the
rows 019 had touched.

Wider than the brief said, for one reason: `RECOVERY_TARGETS` went with
`RECOVERY_WEIGHTS`, so rows 4.1–4.4 retired too, and §12 still called four
shipped readiness numbers "not in the app yet". They are now rows 1.12 and
4.15–4.17, and 4.11 / 4.12 describe the sleep + HRV blend and `PUSH_THRESHOLD`
that compute today. Counts recounted: 81 rows, 50 firing, 22 struck.
