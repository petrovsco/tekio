# Roadmap: Home's whole-body strip and its qualities line read one question two ways

**Label:** feature
**Status:** done — shape 1 shipped 2026-09-07 (v2.0.40): one `coverageState` call spells both the chip and the line, so the two cannot disagree; `N d ago` stays as the note.

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

## Decision — shape 1, chosen 2026-09-07

**The chips read coverage; `N d ago` stays as their note.** The square's fill
comes from the same `adaptationCoverage` call the missing line already makes —
sessions inside the 14-day window ÷ that quality's scaled session target — run
through the map's own `rampStep` / `RAMP` (`GapMap.tsx`), so a chip, a muscle
and an Adaptations effort band are all read on one scale. `qualityStates` still
supplies `daysSince` for the note, but its `stale` flag no longer colours
anything on Home.

Why this one over the other two: it is the only shape that keeps both facts
and makes them unable to disagree. Dropping the strip (shape 2) would lose
*N d ago* from the five-second read for the sake of 60 px Home does not need,
and aligning the windows (shape 3) would move a grounded number to fix a
display contradiction — paying a physiological price for a layout problem.
`QUALITY_STALENESS_DAYS` is untouched and still drives the Adaptations tab.

### What building it turned up: the ramp's cutoff is not the line's cutoff

The first attempt read the ramp directly (`RAMP[rampStep(volume ÷ target)]`)
and reintroduced the same bug in a new place. The map's top band starts at
`GAP_CUTOFF` (0.70), which is where a *muscle* is on target — but a cardio
quality is `met` only at its whole session target. On 2026-09-07 endurance sat
at three sessions of a four-session window target: 0.75, so the square inked
solid directly under *Short: … endurance*. Two thresholds again, one of them
new.

The fix is the reason there is now a `coverageState` helper in
`src/lib/adaptations.ts` rather than a second expression inside `HomeTab`.
`splitCoverage` calls it, the chip calls it, and the ink band is spelled
`state === 'on_target'` — so the sentence and the square are the same
judgement rendered twice, not two judgements that happen to match. The graded
ramp survives underneath: a quality that is short still darkens as its
sessions accumulate, capped one band below ink. `src/test/adaptations.test.ts`
pins the invariant, including the 0.75 case that caught it.

The strip's subtitle changed with it — *one state each* → *fill = 14 d
coverage* — because the fill now names its own window.

## Doctrine §4

1. **Which read?** Home — the §6 read itself. 2. **Stop doing:** printing one
quality's state twice with two thresholds. 3. **Input or destination?**
Neither — a shape decision inside an existing read. 4. **Shape:** whole-body
qualities are not spatial (P2); a chip per quality or one line of prose are
both honest, two of them at once is not. 5. **Physiological number?** Shapes 1
and 2 move none. Shape 3 moves `QUALITY_STALENESS_DAYS.anaerobic_capacity` and
needs a `## Grounding` section before it is built.

## Acceptance

- [x] One of the three shapes is chosen and written here with the reason —
      shape 1, Peter, 2026-09-07; the reasoning is in the Decision section.
- [x] Home states each whole-body quality's state once, or two reads that
      cannot disagree — one `coverageState` call feeds both, and a test walks
      every quality asserting the chip's word is the line's word.
- [x] Home still fits one 900 px screen with nothing below the fold —
      measured at 390×900: last card ends at **771 px**, bottom nav at 849,
      `scrollHeight` 900 = `innerHeight` 900. Identical to 062's figure, so
      the change costs no pixels.
- [x] If shape 3: a `## Grounding` section lands before the number moves —
      not applicable, shape 1 moves no number. `QUALITY_STALENESS_DAYS` is
      unchanged and still drives the Adaptations tab.

## Verified in the browser

2026-09-07, dev build at 390×900, console clean (0 errors). Before the fix the
strip read a solid ink ENDURANCE square under *Short: … endurance*; after it,
the three squares read:

| Quality | Square | Note | The line says |
|---|---|---|---|
| VO₂MAX | white, accent edge | 221 d ago | untouched |
| ANAEROBIC | white, accent edge | 354 d ago | untouched |
| ENDURANCE | `#8f8f8f`, `#c9c9c7` edge | 3 d ago | short |

The anaerobic row is the case the brief was written for: 354 days is stale on
either threshold today, but the chip no longer *could* fill while the line
calls it untouched.
