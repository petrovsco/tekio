# Roadmap: The door from Home to Adaptations, and the four bars where they belong

**Label:** feature
**Status:** done — shipped 2026-09-07 (v2.0.42). Home's map card links to Adaptations, the muscle sheet carries its muscle across, and the four qualities read against their own window target through one resolver and one scaler.
**Release:** 2.1.0
**Depends:** 062

## The failure this prevents

[062](062-home-adaptations-one-screen.md) ruled that Home and Adaptations
both stay, with a sharpened split: **Home answers what is missing, Adaptations
explains what to do about it.** That verdict only works if a person standing on
the answer can reach the explanation. Today they cannot.

Measured in the code on 2026-09-07:

- `Adaptations` appears in exactly one place — `Drawer.tsx`, the hamburger
  menu. It is not in `BottomNav`, and nothing on Home links to it.
- Home's `setTab` is called exactly once, and it goes to `Weights`.

So the read that names the gap and the read that explains the gap are joined by
a menu the user has to already know about. Peter walked into this from the
other side: he asked for muscle-loading bars on Home *or* a connection to
Adaptations, not knowing the bars already exist twice.

**They do exist.** `MuscleSheet` (tap a muscle on Home's map) already prints the
four muscle-linked qualities for that muscle, and the whole Adaptations tab is
one body map with a four-way toggle over the same four, each read against a
weekly per-muscle target. Nothing needs building there. What is missing is the
path to them, plus one honest upgrade to how the sheet prints its four numbers.

## The case against

**Why not put the four bars on Home itself, as first asked.** Four qualities ×
twelve muscles is forty-eight values on one silhouette. Doctrine P2 says a
visualization must fit the shape of its data; forty-eight numbers fit no
five-second read, and the exit condition in §6 is a five-second read. Home
already carries the whole-body three as tiles and names all seven in one
sentence (062). Adding a per-muscle × per-quality grid on top would trade the
answer for a data dump — and it would duplicate the Adaptations map exactly.

**Why the bars still earn their place in the sheet.** `MuscleSheet` currently
prints the four as bare counts — `4.0 · 2.0 · 0 · 0`. A bare count is a number
you cannot act on (doctrine §1): it does not say whether 4.0 is plenty or half
of what the quality asks for. The target already exists and the Adaptations map
already draws every muscle against it. Printing the same count against the same
target turns four facts into four judgements, on the muscle the user asked
about, which is exactly where P2 puts the muscle-linked four.

## The five questions

1. **Which read does this sharpen?** Home's "what is missing" card and its
   muscle sheet. No new surface; the R1 count is unchanged at 3 + Recovery.
2. **What does it let me stop doing?** Opening the hamburger and guessing which
   entry explains the gap you are looking at. And reading a bare set count and
   doing the "is that enough?" arithmetic in your head.
3. **Is this an input or a destination?** Neither — it is a *link* between two
   destinations that already exist, plus a re-presentation of numbers already
   computed.
4. **What is the honest shape of the data?** The muscle-linked four read per
   muscle (P2), so they are drawn inside the one-muscle sheet, never smeared
   over the silhouette. The bar is a share of the window target, the same
   fraction and the same ramp the Adaptations map already uses.
5. **Does it write a number claiming physiological meaning?** No new number.
   The weekly per-muscle target and its scaling to the 14-day window are both
   already shipped and grounded ([039](039-adaptations-read-grounding.md)
   §6.6). This brief makes both of them come from *one* function instead of
   three copies — `/ground` exemption 2, a shape change with no new claim.

## The shape

**One resolver, one scaler.** [063](063-home-whole-body-strip-vs-line.md)
set the rule that two reads of the same judgement must call the same predicate.
The weekly target was resolved inline in two places and scaled to the window in
a third. Both move into named exports and every caller uses them:

- `weeklyMuscleTarget(quality, targets)` in `src/lib/adaptations.ts` — the
  user's override if there is one, else the model default.
- `windowMuscleTarget(weeklyRate)` in `src/lib/fusedRead.ts` — that rate scaled
  to `MUSCLE_WINDOW_DAYS`, the scaling `muscleQualityStates` already did inline.

**The door.** The "what is missing" card gets one link to Adaptations. The
muscle sheet gets one that carries its muscle across, so Adaptations opens on
that muscle rather than on its default. The muscle travels as one piece of app
state; `AdaptationsTab` already renders `MuscleSheet` for `{ muscle }`, so the
only new thing is the initial value.

**The bars.** `MuscleSheet`'s quality mix keeps its four counts and gains a bar
under each, filled to `sets ÷ windowMuscleTarget(weeklyMuscleTarget(q))` and
coloured by `rampStep` — the same four-band ramp as the body map, because these
are muscle numbers and the ramp is a muscle rule (063). The target is printed
next to the count so the bar is legible without the ramp.

## Acceptance

- [x] `weeklyMuscleTarget` and `windowMuscleTarget` are the only places the
      target is resolved and scaled; `adaptationCoverage`, `muscleQualityStates`
      and `AdaptationsTab` all call them.
- [x] Home's "what is missing" card links to Adaptations — a footer row reading
      *What to do about it → ADAPTATIONS*.
- [x] The muscle sheet links to Adaptations and carries its muscle, and
      Adaptations opens with that muscle's sheet already open. Walked in a
      browser: tapping Upper Back / Traps on Home, then *Why this gap*, landed
      on Adaptations with that muscle's sheet up.
- [x] That link does not appear when the sheet is opened *from* Adaptations —
      counted 0 occurrences after the walk.
- [x] The muscle sheet's four qualities each show a bar against the window
      target, using `rampStep`. Chest read `1/12 · 11/20 · 4/12 · 0/12` with
      the ramp bands matching (0.08 → lightest, 0.55 → mid, 0.33 → light).
- [x] `npm run build` passes, 197 tests pass, and the walk is verified in a
      browser with 0 console errors.

## What it measured

Home still fits one 900 px screen with nothing to scroll — `scrollHeight` 900,
`innerHeight` 900, bottom nav at 849 — so the door was added without spending
the §6 five-second read. The window targets it prints come out as expected from
the weekly rates: strength 6 → 12, hypertrophy 10 → 20, muscular endurance
6 → 12, power 6 → 12 over the 14-day window.
