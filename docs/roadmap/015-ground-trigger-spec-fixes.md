# Roadmap: `/ground` Step 0 — eight trigger-spec fixes

**Label:** infra
**Status:** planned — eight findings, each with a proposed `SKILL.md` edit. None are applied. No research needed; this is spec surgery.

Moved here 2026-08-26 from `docs/grounding-inventory.md` §13, under the
`pending-work-in-roadmap` house rule: the inventory is an *index* of the 75
numbers, and unapplied edits are pending work. **The `13.x` numbering is kept
deliberately** so existing references to "§13.7", "§13.3" and the rest still
resolve — they now point here.

## Which read does this sharpen?

None — this is tooling, not a surface. It sharpens the *gate* that protects every
read: [.claude/skills/ground/SKILL.md](../../.claude/skills/ground/SKILL.md),
Step 0. Doctrine §4.5 does not apply (no number claiming physiological meaning is
written), so no `## Grounding` block is required here.

## Scope

Edit [.claude/skills/ground/SKILL.md](../../.claude/skills/ground/SKILL.md) only.
Eight findings, seven of which carry a ready-to-paste wording edit; 13.7's second
half is a decision (option **a** vs **b**) that must be taken before its edit is
written. 13.8 is recorded as deliberately-not-fixed and needs no change.

Apply in any order — they touch different parts of the skill and do not conflict.
13.1 is the highest-value one: it alone would have caught five of the misses.

## Out of scope

- Any scout run. Applying these edits grounds nothing — the back-fill running
  order lives in [009-feature-grounding.md](done/009-feature-grounding.md) under pushback #7(b).
- The three bugs the inventory found in the app itself; all were fixed 2026-08-26.

## Acceptance

- [ ] All seven wording edits are in `SKILL.md`, and 13.7's option is chosen and applied.
- [ ] A reader who knows only `SKILL.md` would gate `reps <= 5` at
  [lib/adaptations.ts:26](../../src/lib/adaptations.ts#L26), the Epley/Brzycki
  blend, and `ADAPTATION_PRINCIPLE` — the three classes the current spec misses.
- [ ] The inventory's `†` rows can be marked `n/a — definitional` without inventing a
  fifth scout verdict.

---

## The findings

Pushback #5 replaced an unenforceable gate with "a crisp trigger". This is its
first test against real numbers rather than the four examples it was written
from. Result: **8 of 75 rows (11%) needed a judgement call Step 0 does not
make** — inside the bar #5 set. But the misses are not random. They cluster, and
one edit fixes most of them.

**Eight findings, each with a proposed SKILL.md edit. None are applied yet.**
§13.7's second half is the one that changes plans rather than wording: it means
#7(b)'s opportunistic strategy does not reach `RECOVERY_WEIGHTS` at all.

### 13.1 The gated table is a location list

**31 of 64 firing rows are `unnamed`.** Step 0 opens with a claim-shaped sentence
— *"writes, moves, or reinterprets a number that claims physiological meaning"* —
and then hands you a table of five locations. In practice the table is what gets
read, and every miss is a number that entered somewhere the table does not name:
`src/lib/`, `src/components/tabs/`, a jsonb column default, a magic literal. Note
that even for `src/constants/app.ts` the table lists *constants*, not the file —
so `WATER_GOAL_ML` and `DONATION_ELIGIBILITY_DAYS` sit two lines from `CYCLE` and
are not named.

The sharpest case is rows 2.1–2.5. `repRange` is gated by name and is **dead
code** — declared, never read. The live rep-range boundaries are `reps <= 5` /
`reps <= 15` at [lib/adaptations.ts:26-27](../../src/lib/adaptations.ts#L26), which
the table does not name. Someone changing hypertrophy's rep range by editing the
gated constant would ship nothing, pass the gate, and believe they had grounded
the app's classifier.

**Proposed edit — reframe the "Gated" table.** Keep it, retitle it *"Where these
claims live today (non-exhaustive)"*, and add above it:

> The trigger is on the **claim**, not the file. This table maps the claims
> currently in the app; it is not the boundary of the gate. A copy in an unlisted
> file is still gated.

And add a Step 0 closing line:

> **Before you proceed, enumerate the copies.** `grep` the value and its
> siblings. If the number appears more than once, the grounding block covers
> every copy and the brief says so. Two copies that disagree are a bug the gate
> has just found — fix it in the same change.

That last sentence alone would have caught 5.4 vs 5.5 (two deload models, one
screen apart), 5.1/5.2/5.7/5.10 (`6, 6, 6, 4`), 2.1–2.5, and 10.2 vs 10.4.

### 13.2 A fourth inventory state

`convention` is defined as a *scout verdict*. Before any scout has run, all 75
rows are `unknown` — the column carries no information, and Mode B's clock
("anything still `unknown` after one cycle earns a deliberate run") points a
scout at `r05` rounding to the nearest 0.5 kg and at Brzycki's `reps >= 37`
divide-by-zero guard.

**Proposed edit — Step 3, verdict vocabulary table.** Add one row:

| Scout verdict | Inventory state | What it means for shipping |
|---|---|---|
| *(no run needed)* | **n/a — definitional** | The number fixes a unit, period or guard rather than asserting a dose–response. No search could return "supported", because there is no proposition to test. Record why in one line; it never enters the 6-week clock. |

This is an **inventory-only** state, not a fifth scout verdict — the scout's four
verdicts are unchanged. It applies to the 11 rows marked **†** and should stay
that small: if a row is arguable, it is `unknown`.

Note the boundary. `CYCLE = 6` is **not** definitional: "a block is 6 weeks with
a deload at week 6" is a dose claim about deload frequency, and it is the number
in §5 that most needs a run. `r05` is definitional: plates come in 2.5 kg pairs.

### 13.3 The DB shadow makes "defaults, not runtime edits" undecidable

Step 0 says the gate fires on *"the default — the constant, the seed row, the
migration"* and never on a runtime edit. `adaptation_targets` breaks this
cleanly: its 9 rows are byte-identical to the `adaptations.ts` defaults, they
**override** them at [lib/adaptations.ts:261](../../src/lib/adaptations.ts#L261),
and no column records whether a row is still seeded or has been edited. So "is
this a default or a runtime edit?" has no answer, and the carve-out cannot be
applied. Row 7.6 (179 exercise→muscle links) is the same shape at scale.

**Proposed edit — extend the "Defaults, not runtime edits" paragraph:**

> Where a constant has a **DB shadow** — a table whose rows override it — the
> grounding block lands on the constant *and* the change re-seeds the shadow, or
> the app keeps showing the ungrounded value. Say in the brief which copy the app
> reads. Where seeded rows are indistinguishable from edited ones, treat the
> whole table as seeded and ground it.

### 13.4 The trigger is numeric; some claims carry no digit

Three rows assert physiology with no number in them. `ADAPTATION_PRINCIPLE`
(3.10) tells the user never to train Skill/Speed/Power/Strength to fatigue.
`KEYWORD_ADAPTATION` (2.6) rules that a kettlebell swing is power and not
strength. The endurance cue (3.9) claims Zone 2 "builds mitochondria & fat
oxidation". Step 0 fires on *"a weight, threshold, target, window, or
coefficient"* — none of these is one, and all three are exactly the kind of
confident, unsourced claim the gate exists to catch. `rx.cue` was already gated
"because prose states numbers too"; the real reason is broader — prose states
*claims*.

**Proposed edit — Step 0, after the trigger sentence:**

> A claim does not need a digit. Prose that **prescribes or classifies** ("never
> train to fatigue", "builds mitochondria", "a swing is power work") is gated on
> the same terms as a coefficient. Prose that merely **labels** is not:
> `summary: 'Muscle growth'` names the adaptation, it does not assert anything
> about how to train it.

This is the edit I am least sure about, because it widens the gate and *"a gate
that fires on everything is a gate nobody reads"* is the skill's own rule. The
prescribe/classify vs. label split is the narrowing that keeps it honest; if it
does not hold in practice, drop the edit rather than blunt the rule.

### 13.5 Formulas are not on the enumerated list

Rows 8.1–8.4. Epley and Brzycki are published estimators — citable, and squarely
physiological. "Coefficient" arguably reaches them, but nobody reading the list
would think of a formula. Worse, 8.4 blends the two by unweighted mean, which is
**Tekiō's own invention**; none of the three exemptions covers it, and it is the
one number in §8 that actually needs a run.

**Proposed edit** — add *formula or estimator* to Step 0's enumeration, and add a
fourth entry to the exemptions section, as a stated non-exemption:

> **Not an exemption: combining estimators.** Averaging, blending or
> interpolating between two published formulas produces a third that nobody
> published. That is a new claim, not a shape change.

### 13.6 A location-shaped hole in "Not gated"

The Not-gated list ends with *"anything in `src/components/ui/`"* — a blanket
exemption by directory, in a list whose other entries are all by kind. Rows 4.11
and 4.12 (the Garmin-score model switch; the 80/50 readiness bands that answer
the purpose sentence's "can I push today?") live one directory over in
`components/tabs/home/`, and nothing but that accident keeps them gated.

**Proposed edit:** change the entry to *"presentational primitives in
`src/components/ui/` that state no number"* — which is what was meant.

### 13.7 Exemption 1 will be misapplied within the week

The Habits reweight (rows 4.5–4.10) is Step 0's named example of exemption 1:
renormalisation preserves every relative claim. That is true, and this is not an
argument against the exemption. But the ratios being preserved are `unknown` —
0.45 : 0.15 : 0.15 : 0.15 has never been checked. Preserving an unchecked ratio
yields an unchecked ratio, so those rows stay `unknown` after the reweight ships
and must not be ticked off as handled.

**Proposed edit — exemption 1, one added sentence:**

> Renormalisation preserves relative claims; it does not create them. If the
> weights were `unknown` before, they are `unknown` after, and the inventory row
> does not clear.

**And it is worse than that — #7(b)'s strategy depends on the opposite** (raised
2026-08-26). The roadmap says `RECOVERY_WEIGHTS` "is already due for rewrite by
the Habits reweight… so both trip the #5 trigger naturally." That is true of the
targets, whose values genuinely change under the fused Home read. It is **false
of the weights**: the Habits reweight is exemption 1 by construction, so it does
not fire. `RECOVERY_WEIGHTS` can be edited indefinitely and never trip the gate,
which is pushback #7's original *"the gate is forward-only"* complaint
reappearing inside an exemption.

So the opportunistic half of #7(b) covers one of its two named cases. Two ways
out, and they are not equivalent:

| Option | Effect |
|---|---|
| **(a) Exemption 1 applies only to a `grounded` / `convention` base.** Renormalising from `unknown` is not exempt — the run happens now. | Fires once, on the Habits reweight, on the number #6 used as its own worked example. Self-limiting: after the run the base is labelled and the exemption applies forever after. |
| **(b) Leave the exemption; ground `RECOVERY_WEIGHTS` on the 6-week clock instead.** | Honest, but concedes that "opportunistic" does not reach it, and R2's clock becomes the only mechanism — which is what #7(b) said it wanted to avoid relying on. |

I lean **(a)**: it is one extra scout run, on the number the whole grounding
brief was written around, and it closes the hole rather than routing around it.
Recorded here rather than acted on — it is a change to the spec, not to the app.

### 13.8 Ambiguous, left ambiguous

Two cases with no proposed edit, because the resolution would cost more spec than
the numbers are worth:

- **Sentinel zeros** (1.10). `weeklyMuscleTarget: 0` sits in a gated field and
  asserts nothing — a `null` substitute read as a flag. Step 0 fires; a reader
  shrugs and moves on. Harmless, and the real fix (a proper `null`) is a code
  change, not a spec change.
- **Form placeholders** (4.14). The 80 °C / 10 °C hints are stored and never
  scored. "Copy that states no number" does not cover copy that states a number
  nothing reads. Not gated is the sensible call; writing the rule that says so
  costs more than it saves.
