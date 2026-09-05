# Roadmap: Ground the 6-week cycle and the week-6 deload

**Label:** backlog
**Status:** backlog — parked 2026-09-05 by Peter: the cycle and the deload are properties of a *program*, and users must be able to build programs that are not 100% grounded. Ground these numbers only if Tekiō ships them as its *default* program; until that decision there is no scout run, and inventory section 5 stays the one domain with no grounding block.

The de-duplication is already done (three bugs fixed 2026-08-26). What is left is
the claim itself, which no one has ever checked: **a training block is 6 weeks,
it deloads in week 6, and a deload is 70% of the previous reps at unchanged load.**

## Why this is its own brief

Inventory §13.9 ranks this third in the back-fill order, and its reasoning holds:
the numbers are load-bearing and completely unexamined. `CYCLE = 6` sets how
often the user deloads for the entire life of a program, and
[doctrine.md](../doctrine.md) R2 borrows the same 6 weeks as the shelf clock — so
one unchecked number is doing two jobs in two documents.

§13.2 draws the boundary that puts this in scope rather than exempting it:

> `CYCLE = 6` is **not** definitional: "a block is 6 weeks with a deload at week
> 6" is a dose claim about deload frequency, and it is the number in §5 that most
> needs a run. `r05` is definitional: plates come in 2.5 kg pairs.

## The §4 checklist (doctrine R4)

1. **Which read does this sharpen?** Program (cycle + today's plan), and the
   deload banner on Weights. Both already exist — no new surface, so R1 is not
   engaged.
2. **What does it let me stop doing?** Nothing is removed. It converts three
   `unknown` rows into labelled ones and closes the last `(no brief)` domain in
   the inventory.
3. **Input or destination?** Input. No new UI.
4. **Honest shape of the data?** Three scalars plus a placement rule. Not
   spatial, not per-session — a block-level policy.
5. **Writes a number claiming physiological meaning?** **Yes.** This brief needs
   a `## Grounding` section before any value moves. Run `/ground`.

## Scope — the three claims to ground

| Inventory row | Constant | Value | The claim to test |
|---|---|---|---|
| 5.1 | `CYCLE` — [app.ts](../../src/constants/app.ts) | `6` | A training block runs 6 weeks before it resets |
| 5.3 | `DELOAD_WEEK` — [app.ts](../../src/constants/app.ts) | `= CYCLE` (6) | The deload is the *last* week of the block, not a mid-block week |
| 5.4 | `DELOAD_REP_FACTOR` — [app.ts](../../src/constants/app.ts) | `0.7` | A deload cuts reps to 70% and leaves load unchanged |

Three separable questions, and the scout should be allowed to answer them
differently. Deload *frequency* (5.1), deload *placement* (5.3) and deload
*method* (5.4) have distinct literatures — reduced volume at maintained
intensity is the better-supported half, and it is 5.4 that asserts it.

Rows 5.6, 5.7, 5.8 and 5.9 all derive from the three above as of 2026-08-26, so
grounding these three covers them. **5.9 has a DB shadow**: the
`programs.deload_strategy` jsonb column default still carries a literal `0.7`
that nothing reads. Per §13.3, if a value moves, the migration moves with it or
the app keeps the ungrounded number.

## Out of scope

- **Adaptive / autoregulated deloads** (trigger off readiness or logged fatigue
  instead of a fixed week). That is a feature, and it needs its own brief against
  R1 — this brief only asks whether the *current* fixed numbers are defensible.
- Doctrine R2's 6-week shelf clock. It borrowed `CYCLE`'s number as a convenient
  period, not as a physiological claim; it does not move if `CYCLE` does. Note
  the coincidence in the grounding block so a later reader does not assume one.

## Acceptance

- [ ] A `## Grounding` section here carries the scout's verdict and provenance tags
  for all three rows, with citations verified against NCBI eutils before pasting.
- [ ] Source comments on all three constants in
  [src/constants/app.ts](../../src/constants/app.ts) point back here.
- [ ] Inventory §5's `(no brief)` column names this file, and the rows carry a real
  state instead of `unknown`.
- [ ] If a value changes, the DB defaults change in the same commit and are verified
  by query.
