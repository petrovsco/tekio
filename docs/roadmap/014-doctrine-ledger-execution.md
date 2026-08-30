# Roadmap: Execute the doctrine ledger — four folds and the Habits shelf

**Label:** feature
**Status:** blocked — step 1 and the Sports fold shipped 2026-08-27 (menu sections 8 → 6). The remaining three folds all inherit the RECOVERY_WEIGHTS surgery, which cannot be done twice — so they wait on 010.
**Depends:** 010

[doctrine.md](../doctrine.md) §5 rules five surfaces out of the menu. Before
2026-08-27 the code shipped all five: `DEFAULTS` in
[sectionConfig.ts](../../src/lib/db/sectionConfig.ts#L11) seeded **eight** menu
sections against R1's cap of **four**, so the app was at double its own hard
limit and the cap that "is the argument" had never been enforced. It now seeds
**six** — the first enforcement, still two over.

## Why this is a brief and not just a ledger row

Doctrine R3 says shelving and folding are *decisions*, executed by editing the
ledger and flipping existing config — not by building machinery. That is still
true, and this brief builds nothing. But a decision with unexecuted code behind
it is pending work, and per the `pending-work-in-roadmap` house rule it needs a
file `/roadmap` can see. The ledger keeps the verdicts; the steps live here.

## Shipped 2026-08-27

Menu sections went from **8 to 6** — still over R1's cap of 4, but enforced for
the first time.

- **Habits shelved.** `DEFAULTS` seeds it `showInMenu: false / showInHome: false`
  and the live `user_section_config` row was flipped to match. No code deleted,
  no numbers touched: the tab is still reachable from the Recovery card's Habits
  sub-score link, and one toggle in Profile brings it back. Delete-by date is
  unchanged at **2026-10-07**.
  - Note for the deletion pass: the Habits row is **kept** rather than dropped
    from `DEFAULTS`, because `homeOn()` in `OverviewTab` treats a *missing*
    section as visible. Dropping the row would put the Home card back.
- **Sports folded into Cardio (UI).** `SportsTab.tsx` is gone; its parts live in
  `src/components/tabs/cardio/` as `SportLogForm`, `SportProgress` and a shared
  `SessionList`. Cardio now has a Cardio/Sport switch on the log card, and — the
  part that actually folds a *read* — **one Sessions history covering both**,
  since a sport session is cardio stimulus. `TodaysPlan`'s sport block now says
  "Log in Cardio". The DB merge remains out of scope.
- **Orphan config rows no longer render.** Profile listed a dead `Skills` toggle
  (renamed away in Jul 2026) and would have listed `Sports`; the settings list
  is now filtered to sections the app can still render. The rows themselves are
  untouched in the DB.

Verified in the browser: drawer, Cardio in both modes (including the
conditional competitor/result fields), Profile sections, Home, and that the
shelved Habits tab is still reachable. Build and 96 tests green.

## Why the folds are not parallel after all

This brief originally said "steps 1 and 2 are independent of the four folds —
the folds can proceed in parallel." **That is wrong for three of the four**, and
the brief's own reasoning is what refutes it.

Step 3 is blocked on [010-home-fused-reads.md](010-home-fused-reads.md) because
rebalancing today's recovery weights is wasted if the recovery read is about to
be rebuilt. The same argument applies to the fold *destinations*:

| Fold | Destination | Blocked? |
|---|---|---|
| Sports → Cardio | Cardio | **No** — Cardio is not being redesigned. **Shipped.** |
| Water → Recovery | `RecoveryCard` | **Yes** — home-fused-reads replaces it with systemic + local |
| Donations → Recovery | `RecoveryCard` | **Yes** — same |
| Body Weight → Home stat | Home | **Yes** — home-fused-reads reshapes Home |

Wiring hydration and donation inputs into a `RecoveryCard` that is about to be
replaced is the same throwaway work step 3 is being protected from. So the real
order is:

1. ~~Shelf the Habits tab~~ — **done 2026-08-27**.
2. ~~Fold Sports → Cardio (UI)~~ — **done 2026-08-27**.
3. **Decide the fused stimulus × recovery model** (home-fused-reads §6). Now the
   only thing standing between the app and R1.
4. Then the remaining three folds *and* the `RECOVERY_WEIGHTS` surgery, once,
   into whatever shape survives.

The cap is still violated (6 of 4) and stays violated until step 3 is decided.
That is the honest cost of not doing throwaway work, and it should be visible
rather than papered over.

## Target state

| Surface | Ledger verdict | What that means in code |
|---|---|---|
| Sports | Fold → Cardio | UI fold first: a sport session is a cardio session with a name and a quality rating. **The DB merge is explicitly a separate brief** — do not start it here |
| Water | Fold → Recovery | Hydration becomes an FRS sub-score input on the Recovery card |
| Donations | Fold → Recovery | A readiness input; eligibility windows already tracked |
| Body Weight | Fold → Home stat | Inline logging on Home; FRS needs the number anyway |
| Habits | **Shelf — delete by 2026-10-07** | Default-off now; component, tests and unused tables deleted at expiry |

End state: **Weights, Cardio, Mobility** in the menu, one slot of headroom, and
Recovery still Home-only (the precedent the folds follow).

## Sequencing — this is the part that matters

[010-home-fused-reads.md](010-home-fused-reads.md) §5 sets the order, and it exists to
stop one specific mistake:

1. **Shelf the Habits *tab*** — config-level, reversible, no numbers touched.
   Flip `show_in_menu` / `show_in_home` false, or drop it from `DEFAULTS`.
2. **Decide the fused stimulus × recovery model** (home-fused-reads).
3. **Do the `RECOVERY_WEIGHTS` surgery once**, in whatever shape survives.

Doing step 3 before step 2 is work that gets thrown away: if the recovery read is
about to be rebuilt as systemic-plus-local, rebalancing today's weekly-rollup
weights is wasted.

This section used to add "**steps 1 and 2 are independent of the four folds** —
the folds can proceed in parallel." **Superseded 2026-08-27** — that holds only
for Sports. See §"Why the folds are not parallel after all" above for why the
other three inherit step 3's blocker.

## The two things the shelf must not break

Both are called out in the ledger; repeated here because they are easy to miss
while deleting a directory.

1. **`ExerciseMuscleEditor.tsx` moves to Admin, it is not deleted.** It lives at
   [src/components/tabs/habits/ExerciseMuscleEditor.tsx](../../src/components/tabs/habits/ExerciseMuscleEditor.tsx)
   but edits exercise→muscle mappings, which power the body map and muscle
   coverage — Core infrastructure that happens to sit nearby. Its natural home is
   next to [MuscleGroupEditor.tsx](../../src/components/tabs/admin/MuscleGroupEditor.tsx),
   which already does the adjacent job. Same for the `muscle_groups` /
   `exercise_muscle_groups` tables: they stay.
2. **`RECOVERY_WEIGHTS.habits` (0.10) must be reweighted, not just dropped.**
   [app.ts:91-97](../../src/constants/app.ts#L91) currently reads
   sleep 0.45 / mobility 0.15 / sauna 0.15 / cold 0.15 / habits 0.10. Removing
   the input without renormalising the other four silently drags readiness down
   for every day the app has ever scored.

## The grounding trap (inventory §13.7 — read before ticking anything off)

Proportional renormalisation preserves the four survivors' existing relative
claims, so it is `/ground` **exemption 1** and does **not** trip §4.5. That is
correct, and it is also the trap:

> Renormalisation preserves relative claims; it does not create them. If the
> weights were `unknown` before, they are `unknown` after, and the inventory row
> does not clear.

`0.45 : 0.15 : 0.15 : 0.15` has never been checked. **After this reweight ships,
inventory rows 4.6–4.9 are still `unknown`** and must not be marked handled.
Worse, because the reweight is exempt by construction, `RECOVERY_WEIGHTS` can be
edited indefinitely without ever firing the gate — pushback #7's "forward-only"
complaint reappearing inside an exemption. The proposed fix (exemption 1 applies
only to a `grounded` / `convention` base) is
[015-ground-trigger-spec-fixes.md](015-ground-trigger-spec-fixes.md) §13.7 and is a
prerequisite if you want the reweight to actually pull the run in.

## Also resolved by the same decision

Habit-derived **muscle** contributions go too — the muscle read counts logged
sets only, which is the more honest answer anyway. That touches
`habitCompletionSets` in [utils.ts:500](../../src/lib/utils.ts#L500) and its
three call sites ([adaptations.ts:262](../../src/lib/adaptations.ts#L262),
[utils.ts:607](../../src/lib/utils.ts#L607), [utils.ts:651](../../src/lib/utils.ts#L651)),
plus [src/test/habits.test.ts](../../src/test/habits.test.ts).

## Scope

- ~~Step 1 (shelf Habits, config-only)~~ — **done 2026-08-27**, reversible.
- ~~Sports → Cardio (UI fold)~~ — **done 2026-08-27**.
- The remaining three UI folds — Water, Donations, Body Weight. Each removes a
  `DRAWER_TABS` entry in [App.tsx:20](../../src/App.tsx#L20) and a `DEFAULTS` row
  — but all three are **blocked on home-fused-reads**, because their destination
  is the surface that brief rebuilds.
- Step 3 (reweight) — **blocked on home-fused-reads**.
- At expiry (2026-10-07): delete `HabitsTab.tsx`, `habits/HabitForm.tsx`,
  `habits/habitFields.ts`, `habits.test.ts`, `habitCompletionSets`, and the
  unused habit tables — *after* moving `ExerciseMuscleEditor.tsx`.

## Out of scope

- **The Sports → Cardio DB merge.** UI folds are cheap; the schema merge is not,
  and the ledger already says it is its own brief.
- Grounding any recovery number — see the trap above.
- Any new machinery for managing sections (tier fields, category admin). R3
  forbids it explicitly: that is solving feature bloat by adding features.

## Acceptance

- [ ] `DEFAULTS` seeds at most four menu sections, and R1 is satisfied for the first
  time.
- [ ] Water, Donations and Body Weight are reachable as inputs on Recovery / Home; no
  logging capability is lost, only destinations.
- [ ] `ExerciseMuscleEditor` is under Admin and the body map still renders.
- [ ] Readiness scores computed before and after the reweight are compared on real
  data, and the difference is explained rather than discovered.
