# Roadmap: Should Home and Adaptations be one screen?

**Label:** feature
**Status:** planned — kickoff-ready, runs next session. Raised by Peter during the exit-condition walk on 2026-09-07 ([051](done/051-exit-condition-walk.md)). Absorbed [061](done/061-home-names-missing-muscle-quality.md) on 2026-09-07 (Peter's call): the quality Home cannot name is now a requirement of whatever shape this brief lands on, not a separate patch in front of it.
**Release:** 2.1.0

## Why — the observation this starts from

Reading the two screens side by side during the walk, Peter said:

> *"Maybe we should test the hypothesis of combining home and adaptations
> screens as they are pretty similar."*

They are more than similar — they share machinery. Both render the same
`GapMap` component over the same anatomical figure. Both use the same 14-day
window (`MUSCLE_WINDOW_DAYS`). Both rank gaps with `rankMuscleGaps` and cut at
the same `GAP_CUTOFF`. A user landing on Adaptations from Home sees the same
body, the same four numbered callouts, in the same order.

What actually differs is smaller than it looks:

| | Home | Adaptations |
|---|---|---|
| Body map | quality-agnostic (`muscleStates` — every set counts) | filtered by the selected quality (`muscleQualityStates`, hypertrophy by default) |
| Muscle-linked qualities | a hardcoded power line | four toggles over one map |
| Whole-body qualities | three chips, days-ago | the effort spectrum, sessions against target |
| Readiness | the systemic card and the verdict sentence | absent |
| Counts | absent | "0 of 7 on target", sets and sessions in the window |
| Drill-in | muscle sheet | muscle sheet, "how to train it", all-muscles list |

So the honest summary is: **Adaptations is Home's map with a quality filter on
it, plus the counts Home leaves out.** That is a real duplication, and it costs
twice — a second screen to keep truthful, and a daily read split across two
destinations when doctrine §6 promises one.

**The case against merging.** Three arguments, and they are not weak:

1. **P1 — just in time.** The quality toggle, the effort spectrum and the
   "how to train it" sheet are drill-down: needed when you are deciding what to
   do about a gap, not when you are answering "what's missing". Merging risks
   putting the whole drill-down on the screen that is supposed to answer in
   five seconds.
2. **P2 — two questions, two pictures.** "Which muscles are behind?" and
   "which quality is behind?" are genuinely different questions over the same
   silhouette. One map with a toggle answers them by making the user change
   the map; one screen with both would need two maps.
3. **§6 is a timing claim.** Home currently fits one 900 px screen with nothing
   below the fold — measured during the walk. Anything merged in has to hold
   that, or the five-second read gets worse in exchange for tidiness.

None of these settle it. That is why this brief decides before it builds.

## The bug this brief now also carries (absorbed from 061)

061 was opened by the same walk as this brief and shipped nothing before it was
discarded into here on 2026-09-07. Its argument is reproduced in full, because
it is a requirement on this brief's outcome and the reader should never need
the retired file.

### The failure it prevents

On 2026-09-07 the exit-condition walk asked Home *"which adaptations are
untouched?"* and Home answered correctly: power, anaerobic, VO₂max. It answered
correctly **by luck**.

Home can structurally name only four of the seven adaptations. The three
whole-body ones have their own strip. The fourth is power, printed by a
hardcoded line in `HomeTab`:

```
POWER — {powerSets} sets, any muscle · muscle-linked, reads per muscle
```

Strength, hypertrophy and muscular endurance have no line, no chip and no
colour anywhere on Home. The body map above that line does not help: `HomeTab`
passes `muscleStates` from `fusedRead.ts`, which counts **every** set whatever
its rep band. That is the right shape for "which muscles are under-stimulated"
— it is why the muscle question passes — but it carries no per-quality signal
at all.

The evidence that this is luck and not design: on the same morning the
Adaptations tab said

> *Untouched: power, anaerobic, VO₂max. Short: strength, hypertrophy,
> muscular endurance, endurance.*

and Home said none of it. Power happened to be the one muscle-linked quality at
zero, so the one hardcoded line happened to be the right line. Swap the data —
strength drops to zero while hypertrophy carries the volume, which is exactly
what a few weeks of 10–12-rep work produces — and Home shows a well-filled body
map, a cheerful verdict sentence, and total silence about the missing quality.
The user is told nothing is wrong when something is.

**The case against.** Home is deliberately not the Adaptations tab; P1 says
what isn't needed now isn't shown now, and four quality maps on Home would be
the drill-down leaking upward. That argument holds against *showing the four
reads*. It does not hold against *naming a quality that is at zero* — an
untouched adaptation is precisely the thing §6 promises Home will tell you
without a tap. The existing power line already concedes the principle; it is
just hardcoded to one of the four.

### The shape it proposed

Replace the hardcoded power line with the same sentence the Adaptations tab
already builds. `AdaptationsTab` computes `untouched` and `short` from
`adaptationCoverage` — the qualities with zero volume and the qualities with
volume but under target — and joins them into one line of prose. Lift that into
a shared helper and print it on Home, where the power line sits now.

Note that Home does **not** currently call `adaptationCoverage` at all — it
computes `powerSetCount` and nothing else. So this is not a labelling change:
it wires the seven-quality coverage read into Home for the first time. That
wiring is needed under every outcome below, which is why folding it into this
brief costs nothing — a merged screen needs it more, not less.

Consequences worth stating up front:

- **No new number.** `adaptationCoverage`, `ADAPTATION_MAP`'s
  `weeklyMuscleTarget` and the met/short split are all already computed and
  already shown on Adaptations. This surfaces an existing value on a second
  screen — it makes no new physiological claim, so no `## Grounding` section
  is required (doctrine §4 q5). Confirm against `/ground` Step 0 at kickoff
  rather than assuming it.
- **Power stops being special.** After this, power is one name in a list
  instead of its own hardcoded line — which is what it always was
  conceptually, since the 2026-08-29 amendment made power muscle-linked.
- **Whole-body qualities.** Decide whether Home's line covers all seven (and
  the cardio strip below it becomes the detail) or only the muscle-linked four
  (leaving the strip to speak for the other three). 061 recommended the second
  as the smaller change. **That recommendation is now downstream of the verdict
  below** — if the two screens merge, "all seven" is likely right and the strip
  changes shape with it. Do not settle this before the outcome is chosen.
- **Zero-data day.** The line must degrade the way the power line does today
  (`POWER — no data yet`), not print "Untouched: all seven."

## What this brief actually does

1. **Decide the question, on paper first**: does anything on Adaptations answer
   "what's missing" (→ belongs on Home), or does it answer "what do I do about
   it" (→ belongs in the drill-down)? Sort every element in the table above
   into one of those two buckets. The untouched/short sentence is the clearest
   test case — it is an Adaptations element that plainly answers "what's
   missing", which is why the bug above exists at all.
2. **Choose one of three outcomes**, and write which, and why, into this brief:
   - **Merge** — Adaptations' "what's missing" half moves onto Home, its
     "what to do" half becomes drill-down, and the Adaptations destination
     goes. The doctrine ledger gets the verdict (a decision stays where it was
     made) and the removal becomes its own brief.
   - **Keep both, sharpen the split** — Home answers, Adaptations explains;
     move anything on the wrong side across.
   - **Keep as is** — with the reason written down, so the question is not
     re-opened every time someone notices the two body maps.
3. **Then build the missing-quality read into whichever shape won.** This is
   the part inherited from 061, and it ships in this brief rather than behind
   it. Under *merge* it is part of the merged screen; under *sharpen* or
   *keep as is* it is the shared helper plus a line on Home. It does not get
   deferred again: Home lying by omission is a live bug, and the outcome only
   changes where the sentence lives, never whether it is owed.

**Out of scope:** the wider consequences of a merge — deleting the Adaptations
destination, moving its drill-down sheets, re-pointing the menu — which become
their own brief once the verdict is written. Doctrine R1's cap is not the
argument here: Weights, Cardio and Mobility are the three menu sections; Home
and Adaptations are navigation, so merging them frees no slot and creates no
pressure. This is about the read, not the count.

## Doctrine §4

1. **Which read?** Home and Adaptations — the question is whether they are one
read wearing two coats, and Home is the §6 read itself. 2. **Stop doing:**
maintaining two screens that share a map, a window and a ranking; and opening
the Adaptations tab to find out whether a lifting quality has gone missing.
3. **Input or destination?** A destination question, and possibly one
destination fewer. 4. **Shape:** no new visualization — this decides where
existing ones live. The missing-quality read is prose, not a map: a quality at
zero is one fact, and one fact does not get a silhouette (P2).
5. **Physiological number?** No new one. Nothing is computed differently and
nothing moves that would change a value; the untouched/short split is already
computed and already shown on Adaptations. Confirm against `/ground` Step 0 at
kickoff.

## Acceptance

- [ ] Every element of the Adaptations tab is sorted into "answers what's
      missing" or "answers what to do about it".
- [ ] One of the three outcomes is chosen and written into this brief with its
      reasoning.
- [ ] Home names every muscle-linked quality that is untouched (zero volume in
      the window), by name, without a tap or a scroll.
- [ ] Home distinguishes untouched from short, or states plainly why it does
      not.
- [ ] The hardcoded power line is gone; power reads through the same path as
      the other three.
- [ ] With a zero-data database Home degrades gracefully — no "everything is
      missing" sentence.
- [ ] Home still fits one 900 px screen with nothing below the fold, as
      measured during the walk — the five-second read is a timing claim and
      this brief must not spend it.
- [ ] The walk in [051](done/051-exit-condition-walk.md) is re-run on Home's
      question 2 and passes; doctrine §6's verdict line is updated with the
      result.
- [ ] If the outcome is merge or sharpen, the leftover structural work
      (removing or re-scoping the Adaptations destination) carries into a
      follow-up brief and this one closes.
