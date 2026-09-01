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
- The inventory is reference-only: state what *is*, no follow-ups added.

## Acceptance

- [ ] The link check over `docs/` reports zero dead relative targets.
- [ ] Rows 4.6–4.9 carry a retired state pointing at done/014.
