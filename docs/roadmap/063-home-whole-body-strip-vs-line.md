# Roadmap: Home's whole-body strip and its qualities line read one question two ways

**Label:** backlog
**Status:** backlog — needs Peter's decision on which of the three shapes below Home keeps. Left behind by [062](done/062-home-adaptations-one-screen.md) on 2026-09-07; nothing is broken today, so it waits.

## Why — the failure this prevents, and the evidence

Since 062, Home says which of the seven qualities are untouched or short in
one sentence under the body map (`coverageLine`). One card below it, the
whole-body strip says the same three qualities again, as chips: VO₂MAX,
ANAEROBIC, ENDURANCE, each with *N d ago* and a filled or accent-edged square.

On 2026-09-07 the two agreed — the line said *Untouched: … anaerobic, VO₂max*
and the chips read *354 d ago* and *221 d ago* with the untouched edge. That
is the same fact printed twice, 30 px apart, which is the duplication 062
existed to remove. On other days they disagree, because they use two
thresholds for one word:

- The **chips** read recency: a quality is stale when its last crediting
  session is older than `QUALITY_STALENESS_DAYS` — 14 days for VO₂max and
  endurance, **28 for anaerobic** (`src/constants/app.ts`).
- The **line** reads coverage: untouched at zero sessions inside the 14-day
  `MUSCLE_WINDOW_DAYS` window, short below the window's session target.

So an anaerobic session 20 days ago gives a **filled** ANAEROBIC chip reading
*20 d ago* (not stale) directly beneath *Untouched: anaerobic* (zero sessions
in 14 days). Both statements are true and the screen contradicts itself. The
same gap opens for VO₂max and endurance between one session in the window
(line: *short*) and a chip that is filled because the session was 10 days
ago. A Home that says two things about one quality fails P2 in the other
direction: not one fact in a costume, but two facts wearing one name.

**The case against touching it.** Recency and coverage are genuinely two
facts: *3 d ago* is something the line cannot say, and it is the whole-body
analogue of the map's *0 sets / 53 d* callouts. The 28-day anaerobic window
is a grounded number (039 §6.6) and the 14-day window is another; aligning
them is a physiological claim, not a display tidy-up. And Home fits today —
77 px of headroom under the last card — so nothing forces the question.

## Three shapes

1. **Chips read coverage, keep recency as text (recommended).** The square's
   fill becomes sessions ÷ the window's target — the same number the line and
   the Adaptations spectrum use — and *N d ago* stays as the note. One
   threshold on Home; the strip becomes the line's whole-body half, drawn.
   Smallest change; no number moves.
2. **Drop the strip.** The line names the whole-body three; the Adaptations
   spectrum carries their detail, one tap away (P1). Saves ~60 px on Home and
   loses *N d ago* from the five-second read.
3. **Keep both, align the windows.** Set anaerobic's staleness to the coverage
   window so the two reads agree by construction. This moves a grounded
   number, so it runs `/ground` first (§4 q5) — the most expensive of the
   three and the only one that touches a claim.

## Doctrine §4

1. **Which read?** Home — the §6 read itself. 2. **Stop doing:** printing one
quality's state twice with two thresholds. 3. **Input or destination?**
Neither — a shape decision inside an existing read. 4. **Shape:** whole-body
qualities are not spatial (P2); a chip per quality or one line of prose are
both honest, two of them at once is not. 5. **Physiological number?** Shapes 1
and 2 move none. Shape 3 moves `QUALITY_STALENESS_DAYS.anaerobic_capacity` and
needs a `## Grounding` section before it is built.

## Acceptance

- [ ] One of the three shapes is chosen and written here with the reason.
- [ ] Home states each whole-body quality's state once, or two reads that
      cannot disagree.
- [ ] Home still fits one 900 px screen with nothing below the fold.
- [ ] If shape 3: a `## Grounding` section lands before the number moves.
