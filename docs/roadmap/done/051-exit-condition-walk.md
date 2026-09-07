# Roadmap: The exit-condition walk — is the core perfected?

**Label:** feature
**Status:** done — walked 2026-09-07. Two yeses, one miss: Home cannot name a missing muscle-linked quality, so §6 is **not yet met** and the austerity holds. Both the miss and the merge hypothesis it raised now live in [062](062-home-adaptations-one-screen.md) — [061](061-home-names-missing-muscle-quality.md) was folded into it the same day.
**Release:** 2.1.0
**Origin:** [doctrine.md](../../doctrine.md) §6: *"The core is perfected when: I
open Home and, without tapping anything, know within five seconds which
muscles are under-stimulated this cycle, which adaptations are untouched, and
whether I'm recovered enough to push today. Until then, new sections don't get
built and the shelf doesn't unshelve."* Home shipped
([018](018-home-design-canvas.md)), every surface is SIGNAL
([033](033-retire-old-design-language.md)), 2.0.0 is on production — and
nobody has formally asked the question since it was written.

## The plain summary

A timed walk through Home with Peter, on a normal training day, answering the
three questions from the screen alone. Three yeses end the austerity; any no
becomes a brief ahead of everything else in 2.1.0.

## What the session does

Interactive, in the "Peter ticks" format (batches of 3–4 questions, the
recommended answer first), against the live app — staging or production,
whichever has today's data.

1. Open Home. Start a timer. Answer, without tapping or scrolling:
   - Which muscles are under-stimulated this cycle?
   - Which adaptations are untouched?
   - Am I recovered enough to push today?
2. For each answer: was it there in ≤ 5 s? Is it correct (check against
   Weights, Adaptations and the Recovery card)? Could Peter act on it?
3. Write down everything that needed a tap, a scroll, or a guess.

## The verdict

- **Three yeses:** doctrine §6 gets one line — *"Met on <date>."* The
  austerity ends: the shelf may unshelve and new sections may be argued for
  (R1's cap still applies).
- **Any no:** each miss becomes a brief, or an edit to an existing one, tagged
  2.1.0 and placed ahead of everything but the database chores. §6 stays as
  it is.

Either way the doctrine records the verdict (a decision stays where it was
made) and the work goes to the roadmap (the pending-work rule).

## Doctrine §4

1. **Which read?** Home. 2. **Stop doing:** deferring §6. 3. **Input or
destination?** Neither — a test of the existing read. 4. **Shape:** none, no
data is written. 5. **Physiological number?** No.

## The walk — 2026-09-07

Run against the live database (local dev server, same Supabase as production),
Home at phone width. Home fitted one screen: page height 900 px against a
900 px viewport, so nothing below needed scrolling. What it said that morning:

> **Push. Erectors and hip flex are the gap.** Erectors: 0 sets in 14 days.
> Hip flex: 0 sets in 14 days. Nothing is sore — last stimulus 6 d ago.
> Systemic readiness 57. Ranked on the body: 1 erectors 0/115 d,
> 2 hip flex 0/53 d, 3 obliques 0/53 d, 4 core 0/53 d, forearms 0/40 d.
> POWER — 0 sets, any muscle. VO₂max 221 d ago · anaerobic 354 d ago ·
> endurance 3 d ago.

| Question | Answer in ≤ 5 s? | Correct? |
|---|---|---|
| Which muscles are under-stimulated? | **Yes** | **Yes** — see below |
| Which adaptations are untouched? | **Partly** — whole-body yes, muscle-linked no | Yes today, but by luck |
| Am I recovered enough to push? | **Yes** | Yes |

**Correctness check.** The muscle claims were verified against the database
directly, not against another screen: last non-warm-up set per muscle over
level-1/2 links gave erectors 2026-05-15 (115 d), hip flexors / obliques /
rectus abdominis 2026-07-16 (53 d), forearms 2026-07-29 (40 d), last stimulus
of any kind 2026-09-01 (6 d), 16 sets in the 14-day window. Every number on
Home matched.

**One apparent disagreement, resolved as correct.** Home's fifth, unnumbered
callout read *forearms 40 d*; the Adaptations tab's read *calves 41 d*. Not a
bug: `AdaptationsTab` filters the map by the selected quality (hypertrophy by
default) while `HomeTab` passes the quality-agnostic `muscleStates`, so the two
maps answer different questions and only coincide where a muscle is at zero for
everything. Both are right.

## The miss

Home's body map counts **every set, whatever the rep band**. That is the right
shape for "which muscles are under-stimulated" — and it is why Q1 passes. But
it means Home carries no per-quality signal at all. Of the seven adaptations
Home can name at most four: the three whole-body ones in their own strip, plus
power, whose zero is printed by a **hardcoded** line in `HomeTab`
(`POWER — {n} sets, any muscle`). Strength, hypertrophy and muscular endurance
appear nowhere.

On 2026-09-07 that read correctly, because power genuinely was the only
muscle-linked quality at zero and the hardcoded line happened to be the right
line. The Adaptations tab said the rest — *"Untouched: power, anaerobic,
VO₂max. Short: strength, hypertrophy, muscular endurance, endurance."* — and
Home said none of it. Had strength gone to zero while hypertrophy carried the
volume, Home would have shown a well-filled body and stayed silent. A read that
is right only while the data cooperates is not the five-second read §6 asks
for.

Peter's verdict on the day: not met, and fix it narrowly — Home names any
muscle-linked quality that is at zero or short, in the shape the power line
already uses. That was [061](061-home-names-missing-muscle-quality.md), which
Peter discarded into [062](062-home-adaptations-one-screen.md) later the
same day: Home is being redesigned around the Adaptations screen, so the
missing-quality read ships as a requirement of that shape rather than as a
patch in front of it. The requirement is unchanged; only its container is.

## What the walk also raised

Peter, reading the two screens side by side: *"maybe we should test the
hypothesis of combining home and adaptations screens as they are pretty
similar."* They share the body map component, the 14-day window and the gap
ranking; Adaptations adds the quality toggle, the effort spectrum and the
counts. That is a design question in its own right, not a consequence of the
miss, so it got its own file: [062](062-home-adaptations-one-screen.md).

## Acceptance

- [x] The walk ran with Peter on a real day, timed; the three answers and
      their times are written into this brief.
- [x] Doctrine §6 carries the verdict line — met, or not yet and why.
- [x] Every miss has a brief tagged 2.1.0.
