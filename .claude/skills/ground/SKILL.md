---
name: ground
description: Pre-build gate for Tekiō. Run before implementing any change that writes, moves, or reinterprets a number claiming physiological meaning — recovery weights, adaptation targets, rep-range boundaries, FRS coefficients, recovery windows, deload placement. Checks the trigger, checks the doctrine, dispatches the science-scout subagent, and lands the result as a `## Grounding` block in the roadmap brief plus a source comment on the constant. Also invoked deliberately to back-fill a number already shipped.
---

# /ground — the pre-build gate

Tekiō's purpose sentence rests on numbers. A wrong weight tints a card; a wrong
target makes the app confidently name the wrong gap. This skill is the one
moment where that gets checked — before the brief becomes code.

**What it is not: a blocker.** The gate never stops you shipping a number. It
stops you shipping one *unlabelled*. `convention only` is a legitimate verdict
that unblocks implementation immediately. Silence is not a verdict.

**What it is not: a review panel.** This gate answers one question — *is this
number defensible?* — at one moment, before the brief becomes code. Three
neighbouring questions are deliberately out of scope, and keeping them out is
the point:

| Question | Whose job | Why not this skill's |
|---|---|---|
| Is the code clean and extendable? | `/simplify`, `/code-review`, plus the mechanical layer (ESLint, dead-code detection) | It mostly exists already; a third overlapping judge yields three inconsistent opinions |
| Did smoothness degrade? | the measured perf budget | An LLM reading code and guessing at render cost produces plausible noise, not a finding |
| Does the UI read well? | `frontend-design` | Craft, and it belongs after the diff exists |

Growing `/ground` to cover those rebuilds the single all-purpose panel that
[009-feature-grounding.md](../../../docs/roadmap/done/009-feature-grounding.md) was written
to reject. Four concerns, two moments — don't re-merge them.

Prerequisite: [docs/doctrine.md](../../../docs/doctrine.md) — §4 is the
checklist this skill runs. It is imported from the workspace `CLAUDE.md`, so it
should already be in context.

---

## Step 0 — Does the trigger fire?

> The gate fires when a change **writes, moves, or reinterprets a number in the
> app that claims physiological meaning** — a weight, threshold, target, window,
> or coefficient whose value asserts something about how a body adapts or
> recovers.

This is the canonical trigger spec. Doctrine §4.5 points here.

### Gated — the live surfaces

| Where | Numbers |
|---|---|
| [src/constants/app.ts](../../../src/constants/app.ts) | `RECOVERY_WEIGHTS`, `RECOVERY_TARGETS`, `CYCLE` |
| [src/constants/adaptations.ts](../../../src/constants/adaptations.ts) | `weeklyMuscleTarget`, `weeklySessionTarget`, `repRange`, every `rx` field (load / reps / sets / rest / effort / **cue**) |
| `adaptation_targets` (DB) | seeded defaults and any migration that writes `weekly_muscle_target` / `weekly_session_target` |
| [Nutrition FRS](../../../docs/roadmap/007-nutrition-food-recovery-score.md) | the six sub-score weights and their cut-points |
| Local recovery | hours-since-stimulus thresholds, volume-load decay |
| Deload | which week of the cycle deloads, and by how much |

`rx.cue` is gated because prose states numbers too — see the known debt below.

**Defaults, not runtime edits.** `adaptation_targets` overrides the
`adaptations.ts` defaults per row and is editable from inside the app
([src/lib/db/adaptationTargets.ts](../../../src/lib/db/adaptationTargets.ts)).
The gate fires on the **default** — the constant, the seed row, the migration —
and never on the user changing their own target in the UI. A gate that fired on
runtime writes would be unenforceable, which is the precise failure mode this
trigger was rewritten to avoid.

### Not gated

Chart colours, layout, spacing, icons, copy that states no number, export
fields, DB column names, sort order, `USER_ID`, anything in `src/components/ui/`.

### Three exemptions — the number moves, but no new claim is made

1. **Renormalisation.** Dropping an input and rescaling the rest proportionally
   preserves every relative claim. (This is exactly the Habits reweight; the
   doctrine ledger already says so.)
2. **Unit or shape change.** Same claim, different representation — per-week to
   per-day, array to map, seconds to minutes.
3. **Rounding inside an already-grounded range.** If a `## Grounding` block gave
   48–72 h, picking 60 h is a defaults decision, not a claim.

Name the exemption you are using, in the brief or the commit message, and
proceed. **If you are arguing about whether one applies, it doesn't** — run the
scout; it is cheaper than the argument.

**If nothing fires:** say so in one line and stop. Do not run the scout for
thoroughness — a gate that fires on everything is a gate nobody reads.

---

## Step 1 — Doctrine check

Cheaper than a scout run, and it kills more numbers. Answer §4.1–4.4 for the
change that carries this one (§4.5 is the trigger, already answered in Step 0):

1. Which existing read does this sharpen? — name the surface.
2. What does it let me stop doing?
3. Input or destination? (default: input — P3)
4. What's the honest shape of the data? (P2)

Then the four doctrine rules that kill *numbers* specifically. Each is a stop,
not a caveat:

- **A number I can't act on doesn't get shown.** If the value could be anything
  and nothing about what the user trains or how they recover would change, it
  does not ship — and it does not get grounded either. The cheapest kill
  available, and it comes before any search.
- **P4 — configurability is not a decision.** "It's tunable" and "you can hide
  it" are not defences for a number. With one user, a default that has to be
  overridden to be right is simply a wrong default.
- **P5 — one fact must not wear N costumes.** If the number is a global value
  divided across N surfaces and presented as N per-surface facts, that is a P2
  violation and the scout cannot rescue it. P5 hands number encodings to §4;
  §4 hands this class back as a redesign, not a search.
- **R1 / R3 — the caps.** If the number needs a fifth menu section, name the
  trade before spending a scout run. If it needs new machinery to manage it,
  R3 already answered.

Last, check the §5 ledger. Grounding a number on a surface marked **Fold** or
**Shelf** is work with a delete-by date on it — ground the surface it folds
*into* instead.

A number that fails Step 1 never reaches Step 2. Say which rule it failed.

---

## Step 2 — Dispatch science-scout

Run [.claude/agents/science-scout.md](../../agents/science-scout.md) as a
subagent (`subagent_type: science-scout`) so the search context stays isolated
from this session.

Hand it all five inputs — it will stop and ask if any are missing:

- the claim in plain language
- the constant or field it will be written to (path + name)
- its current value, if one exists
- the brief it belongs to
- today's date

**One decision per run, not one number per run.** Nine `weeklyMuscleTarget`
values that all rest on the same question ("weekly sets per muscle group for a
trained adult") are *one* run returning one range. Nine unrelated numbers are
nine runs. Batching unrelated claims produces a block that grounds none of them.

The scout is read-only by construction. It returns a markdown block; you paste
it. Never ask it to edit the constant.

### Check the block before you paste it

The scout's rules are its own, but enforcing them on receipt is yours. A bad
block pasted into a brief is worse than no block — it reads as grounded forever.
Send it back if any of these fail:

| Check | Why it matters |
|---|---|
| Every factual line carries exactly one provenance tag | An untagged line is the exact failure this layer exists to prevent: practitioner opinion reading as literature |
| Every `[literature]` line has a URL, plus design, population and n | "A study showed" is not a citation |
| A split is reported as a split, never averaged | The midpoint is a position nobody holds; the fork *is* the design decision, and the brief must record which side Tekiō took |
| The number is no more precise than the evidence | 48–72 h is honest; 61 h is not |
| **Coach-only support is called `convention only`** | Cavaliere and Harris are coaches, not researchers. They may inform *what to do*; they never ground a *number* |

The roster is a practitioner layer, not an evidence tier — nobody is promoted a
tier by being confident, credentialed or popular. That last row is the one that
decides the verdict, and therefore what the source comment has to say in Step 3.

---

## Step 3 — Land it in the repo

In six months nobody remembers why sleep weight is 0.45. Four destinations, in
order:

**1. The brief** — paste the scout's block verbatim as `## Grounding`,
immediately before `## Acceptance`. Verbatim: don't summarise away the
provenance tags or the "Where they split" section, which is the part that
records a real design fork.

**2. The constant** — one line above it, from the scout's `### Source comment`:

```ts
/** 0.45 — sleep dominates systemic readiness; see docs/roadmap/<brief>.md#grounding */
```

**3. The decisions ledger** — one row per *decision* the run produced (a
design call, a semantic choice, a deliberate non-change) in
[docs/grounding-inventory.md](../../../docs/grounding-inventory.md#decisions-from-scout-runs),
with its load-bearing sources and a link to the full record. Numbers get
inventory rows; decisions get ledger rows.

**4. the user's own knowledge base** — *only* if the finding is durable life-knowledge
beyond Tekiō (e.g. "full-blood donation suppresses endurance performance for
weeks"). Draft it there for `/ingest` → `wiki/health/`. The *why* behind the
number stays next to the number regardless; the inbox is not a substitute for
step 2.

### Verdict vocabulary

Record the scout's verdict word in the brief so a later grounding inventory can
read it without re-reading the block:

| Scout verdict | Inventory state | What it means for shipping |
|---|---|---|
| supported / partially supported | **grounded** | ship it |
| convention only | **convention** | ship it, and the source comment must contain the word *convention* |
| not supported | — | the value changes, or the feature doesn't ship |
| (never run) | **unknown** | the state every pre-`/ground` number is in |

### Maintenance

Source comments cite a brief path, and briefs move to `docs/roadmap/done/` when
complete. When you move one, `grep -rn "<brief-filename>" src/` and repoint every
comment. Grounding blocks travel with their brief — never copy one into a second
file.

---

## Modes

**A — New number (default).** A brief is in flight; the change hasn't been
written. Steps 0 → 3 in order.

**B — Back-fill.** An existing constant, already shipped, never grounded. Same
four steps; the difference is that Step 1 is usually already settled (the
feature exists) and the brief may need creating — a one-number brief is
legitimate. Two rules from the roadmap:

- **Opportunistic first.** A number due for rewrite trips the trigger on its
  own. Don't run a back-fill sprint.
- **Targets before weights.** `adaptations.ts` `weeklyMuscleTarget` /
  `weeklySessionTarget` decide what Home calls "missing", so the purpose
  sentence rests on them. `RECOVERY_WEIGHTS.sleep = 0.45` is more memorable and
  less consequential.

Anything still **unknown** after one cycle (6 weeks) earns a deliberate run.
That reuses R2's expiry clock — do not build new machinery to track it (R3).

---

## Known debt

[src/constants/adaptations.ts:127](../../../src/constants/adaptations.ts#L127)
ships *"Galpin's 3–5 rule"* as a coaching cue: a named
`[single-practitioner position]` presented as settled, with no provenance. It is
the clearest live example of what this gate exists to catch.

---

## Hard rules

The checks on the *block* are in Step 2. These are the rules on the *run*:

- The scout never edits a file. You paste its output.
- **"No usable evidence" is a result, not a failure.** Verdict is
  `convention only`, the number still ships, and the brief says what it is a
  convention *for*. Re-running the scout hoping for a better answer is how a
  gate turns into a ritual.
- If the scout contradicts the value already shipped, that is a decision, not a
  find-and-replace. Record it in the brief before touching the constant.
- Don't widen this skill past its one question. If the run turns up a code
  smell, a slow render or a UI nit, note it and route it — see the scope table
  at the top.
