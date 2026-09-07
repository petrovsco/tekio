# Roadmap: Home names the missing muscle-linked quality

**Label:** bug
**Status:** discarded — folded into [062](062-home-adaptations-one-screen.md) on 2026-09-07 (Peter's call): Home is about to be redesigned around the Adaptations screen, so the missing-quality read ships as a requirement of that shape rather than as a patch in front of it. Nothing here was built.
**Release:** 2.1.0

> **Retired, not dropped.** The requirement below is live — it is an acceptance
> item on [062](062-home-adaptations-one-screen.md), which reproduces this
> argument in full. Read 062; this file is the record of where the argument was
> first written, kept because the ID is never reused.

## Why — the failure this prevents

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

## The shape

Replace the hardcoded power line with the same sentence the Adaptations tab
already builds. `AdaptationsTab` computes `untouched` and `short` from
`adaptationCoverage` — the qualities with zero volume and the qualities with
volume but under target — and joins them into one line of prose. Lift that into
a shared helper and print it on Home under the map, where the power line sits
now.

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
- **Whole-body qualities are already in that sentence.** Decide whether Home's
  line covers all seven (and the cardio strip below it becomes the detail) or
  only the muscle-linked four (leaving the strip to speak for the other three).
  The second is the smaller change and the recommended starting point; the
  first risks saying the same thing twice on one screen, which P2 warns about.
- **Zero-data day.** The line must degrade the way the power line does today
  (`POWER — no data yet`), not print "Untouched: all seven."

## Doctrine §4

1. **Which read?** Home — the §6 read itself. 2. **Stop doing:** opening the
Adaptations tab to find out whether a lifting quality has gone missing.
3. **Input or destination?** Neither new — it moves an existing sentence onto
the screen that promised it. 4. **Shape:** prose, not a map. A quality at zero
is one fact, and one fact does not get a silhouette (P2). 5. **Physiological
number?** No new one — see above.

## Acceptance

- [ ] Home names every muscle-linked quality that is untouched (zero volume in
      the window), by name, without a tap or a scroll.
- [ ] Home distinguishes untouched from short, or states plainly why it does
      not.
- [ ] The hardcoded power line is gone; power reads through the same path as
      the other three.
- [ ] With a zero-data database Home degrades gracefully — no "everything is
      missing" sentence.
- [ ] The walk in [051](051-exit-condition-walk.md) is re-run on Home's
      question 2 and passes; doctrine §6's verdict line is updated with the
      result.
