# Roadmap: Should rescaling never-checked weights skip the grounding gate?

**Label:** infra
**Status:** backlog — postponed to 3.0.0 by Peter on 2026-09-08 during [015](done/015-ground-trigger-spec-fixes.md). There is no set of weights in the app to decide it against, and the question belongs with however recovery is measured next. Split out of 015 §13.7 so the rest of that brief could close.
**Release:** 3.0.0

## The question in one line

The `/ground` gate skips its check when a set of weights is rescaled. Should it
still skip when the weights being rescaled were never checked in the first place?

## What "rescale" means here

The gate — [.claude/skills/ground/SKILL.md](../../.claude/skills/ground/SKILL.md),
Step 0 — is the checklist run before a body-related number is written into the
app. It lists three cases where the check is **skipped** because nothing new is
being claimed. The first is a rescale.

Say readiness were scored from four things, weighted so they add to 1.00:

| | before | after dropping sauna |
|---|---|---|
| sleep | 0.50 | 0.625 |
| sauna | 0.20 | — |
| cold | 0.20 | 0.25 |
| mobility | 0.10 | 0.125 |

Every number changed, but the relationships did not: sleep is still 5× mobility,
cold still 2× mobility. Same claim about the body, expressed with three numbers
instead of four. So the check is skipped.

## The hole

That argument only holds if someone once checked that sleep *should* be 5×
mobility. If nobody did, then after the rescale nobody still has — but the change
passed through a step formally stamped *"no new claim"*. And a rescale can happen
any number of times, each one exempt, so such weights could be edited forever
without the gate firing once. That is
[009](done/009-feature-grounding.md)'s original *"the gate is forward-only"*
complaint reappearing inside an exemption.

**One half of this is already settled and shipped** (015, 2026-09-08). Exemption
1 now says in plain words: *rescaling does not create a claim — if the weights
were `unknown` before, they are `unknown` after, and the inventory row does not
clear.* That stops anyone ticking the row off as handled. What is left open is
only whether the **gate should fire** in that situation.

## The two options

| Option | Effect |
|---|---|
| **(a) Narrow the exemption.** It applies only when the starting weights already carry a verdict — `grounded` or `convention`. Rescaling from `unknown` is not exempt; the scout run happens then. | Closes the hole. Self-limiting: after one run the base is labelled and the exemption applies forever after. |
| **(b) Leave it.** Rely on the 6-week clock — *anything still `unknown` after one cycle earns a deliberate run*. | Honest, but concedes that the opportunistic strategy never reaches this class, and the clock becomes the only mechanism. |

015 leaned **(a)**. Peter deferred the decision on 2026-09-08 rather than taking
it, for the reason in the next section.

## Why it is not decidable today

**There is nothing in the app with this shape.** The rule would govern a
situation that has not arrived:

| Candidate | State |
|---|---|
| The five readiness weights — sleep .45 / mobility .15 / sauna .15 / cold .15 / habits .10 | **Deleted 2026-08-31** with `RecoveryCard` ([014](done/014-doctrine-ledger-execution.md)). This was the case §13.7 was written about. It was retired, not rescaled, so the trap never sprang. |
| The Food Recovery Score's six weighted sub-scores | **Discarded 2026-09-01** ([007](done/007-nutrition-food-recovery-score.md)). |
| `LEVEL_WEIGHT = { 1: 1, 2: 0.5, 3: 0 }` in [src/lib/utils.ts](../../src/lib/utils.ts) — how much credit a muscle gets as a primary vs. secondary mover | **Alive**, and the nearest thing to this shape. It does not add to 1, but it is a set of relative weights and would face the same question if level 3 were dropped and the rest rescaled. Already `convention` with sources (039 S1, decision D13), so option (a) would wave it through untouched. |

So both options cost zero scout runs today, and no shipped number changes either
way. Deciding now would mean writing spec for a hypothetical.

## What brings it back

Peter's reason for the deferral, in his words: this *"should relate with how we
measure recovery"* — the weighted-blend shape was removed for clarity during the
Home redesign and is expected back when recovery measurement is rebuilt. When a
set of weights returns, decide (a) or (b) with that real set in front of us.

Practically, this brief wakes up when any of these lands:

- Systemic readiness gains a third input, so `systemicReadiness()`
  ([src/lib/fusedRead.ts](../../src/lib/fusedRead.ts)) stops being a plain
  50/50 mean of sleep and HRV and needs weights.
- Any new score is built from weighted sub-scores.
- `LEVEL_WEIGHT` is restructured — e.g. by [046](046-retire-tracked-muscle-groups.md)
  or a successor that drops a tier.

## Which read does this sharpen?

None — this is the gate, not a surface, same as its parent 015. Doctrine §4.5
does not apply: no number claiming physiological meaning is written, so no
`## Grounding` section is required.

## Scope

One clause in [.claude/skills/ground/SKILL.md](../../.claude/skills/ground/SKILL.md),
exemption 1. Nothing else — no app code, no scout run, no inventory rows.

## Out of scope

- The plain-words half already shipped in 015 (the "unknown before, unknown
  after" sentence). It stays whichever option wins.
- Grounding whatever weights prompt the wake-up. That is their own brief.

## Acceptance

- [ ] Option (a) or (b) is chosen, against a real set of weights, and written
  into exemption 1 in `SKILL.md`.
- [ ] The deferral pointer in exemption 1 is replaced by the decision.
- [ ] If (a): the first run it forces is named, and its brief exists.
