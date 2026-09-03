# Roadmap: Adaptations tab — the drill-down read

**Label:** feature
**Status:** planned — unit 1 (the window argument) landed 2026-09-03 as
v1.16.10; the page rebuild itself is not started. §7 is the kickoff.
**Depends:** 019, 026, 039
**Release:** 2.0.0

## Progress log

- **2026-09-01** — written as "Adaptations tab — SIGNAL restyle", deliberately
  sequenced after [019](done/019-adaptation-model-simplification.md) so nine rows
  would not be restyled and then two deleted.
- **2026-09-01** — unblocked: 019 and [026](done/026-signal-chrome-and-primitives.md)
  both landed.
- **2026-09-02** — rescoped. Restyling the current composition would have
  preserved the thing that makes the page confusing. Grounding split out into
  [039](done/039-adaptations-read-grounding.md), which now gates this brief. The
  restyle is still in here — a rebuilt page is written in the SIGNAL language by
  construction, so [033](033-retire-old-design-language.md)'s dependency is
  satisfied either way.
- **2026-09-03** — picked up; the session hit its context limit after unit 1.
  `adaptationCoverage` now takes `from` + `windowDays` and scales the weekly
  targets to the window (v1.16.10, no visible change). The build decisions
  and the remaining units are in §7.

---

## 1. What this page is

**A second Home.** Not a logging screen — a *drill-down* on the read Home
already carries. Home answers "what is missing" in five seconds without a tap;
this page is where that answer gets interrogated, one adaptation at a time.

Everything below follows from that sentence. Anything on the page that does not
help interrogate an adaptation is not part of the read.

## 2. What is wrong today

**The survey (2026-09-01) — the old paint:**

- **Hero card** — dark navy block, `/7` counter, lifting-set and cardio-session
  tallies.
- **Adaptation rows** — a different hue per adaptation on the left edge, emoji
  icons, coloured info buttons.
- **MUSCLE COVERAGE card** — bars in old tokens, ⚠ emoji for missing groups.
- **HOW TO TRAIN EACH ADAPTATION** — 📖 emoji heading, old disclosure.

**The diagnosis (2026-09-02) — the composition:**

1. **Seven stacked cards is a list, not a read.** Each card hides its body map
   behind a disclosure, so comparing two adaptations means opening one, closing
   it, opening another. The spatial thing is buried inside the non-spatial thing.
2. **MUSCLE COVERAGE · THIS WEEK earns nothing.** It restates Home's map in a
   third dialect (see [039 §1](done/039-adaptations-read-grounding.md)) with no
   target behind its bars, and it is the *only* consumer of
   `MuscleCoverageCard.tsx` — so cutting it from the page deletes the component.
3. **Per-adaptation rainbow hues** break design-system §1 (colour carries one
   meaning). Seven hues claim seven meanings.
4. **The whole-body three sit in the same card shape as the muscle-linked four**,
   which quietly says they are the same kind of thing. They are not (P2): four
   read per muscle, three read per session.

## 3. The shape it should take

### 3a. One body map, four toggles

The map is the page, not a detail inside a card. One anatomical figure with a
segmented control over it — **power · strength · hypertrophy · muscular
endurance** — and the stimulus ramp recolours in place as you switch. Comparing
two adaptations becomes one tap, which is the whole point of a drill-down.

Reuses the existing `GapMap` / `BodyMap` geometry and the SIGNAL ink ramp, so
the picture rhymes with Home instead of arguing with it. **What the ramp is
denominated in is [039](done/039-adaptations-read-grounding.md)'s decision** — that is
why this brief waits.

Two affordances live on the selected adaptation, not on seven separate cards:

- **How to train it** — the `rx` block (load / reps / sets / rest / effort /
  cue), behind an icon. Same content as today's guide, summoned where the
  question is raised (P1) instead of parked in a collapsed card at the bottom.
  Its numbers are grounded by 039 before this ships. The power sheet carries
  one extra line from 039 S4 (inventory D17): heavy strength sets also build
  power in the not-yet-strong (Cormie 2010), so an empty power fill is a
  smaller gap than it looks for someone who squats heavy — the map itself
  never credits a strength set to power.
- **The muscle detail** — the per-muscle numbers *for the selected adaptation*:
  which groups are on track, which are short, by how much. This is what
  MUSCLE COVERAGE was reaching for and got wrong by not being per-adaptation.
  Shape it as a ranked list, not a bar chart against an arbitrary maximum.

### 3b. The whole-body three — a decision for kickoff

VO₂max, anaerobic capacity and endurance cannot go on a silhouette (P2 says so
explicitly). They need their own read.

**Recommendation: the effort spectrum — one axis, three bands.**

The three qualities are not unrelated tiles; they are **three regions of one
continuum**, ordered by how long the effort lasts. Anaerobic capacity is
seconds, VO₂max is minutes, endurance is hours — and `ADAPTATIONS` is already
ordered along exactly that continuum in the constants. So draw the continuum:
one horizontal axis, three labelled bands, each filled by volume against its
target and carrying its recency. A gap is a visibly empty stretch of the axis,
and the picture explains *why* the qualities differ instead of asserting it.

It is one-dimensional, which matches the data honestly: outside Garmin sessions
the app has duration and little else.

**Rejected: a heart, or any organ diagram.** It reads well and it is a lie of
exactly the kind P2 forbids for the body map. Endurance is largely peripheral —
mitochondrial density, capillarity, fat oxidation — and anaerobic capacity is
glycolytic and muscular. Drawing all three inside a heart asserts a location
none of them has. If the silhouette is dishonest for whole-body qualities, a
heart is dishonest for the same reason and looks more authoritative while doing
it.

**Deferred, not rejected: the effort plane** (duration × intensity, one dot per
session, the three qualities as regions). It is the better picture and it needs
an intensity per session that the app mostly does not have — of 3 logged cardio
sessions, 1 carries Training Effect and HR zones. Revisit after
[005](005-hr-zone-intensity-classification.md); do not build it on a duration
proxy dressed as intensity.

### 3c. What leaves the page

- **MUSCLE COVERAGE · THIS WEEK** — cut; `MuscleCoverageCard.tsx` deleted with
  it (this page is its only consumer).
- **The seven-card stack** — replaced by the map plus the spectrum.
- **The collapsed guide at the bottom** — folded into the per-adaptation icon.
- **The rainbow hues and the emoji** — per 026 and design-system §1.

The hero keeps a role: it is the only place the *whole* week gets one line.
Whether it survives as a hero or shrinks to a header line is a build decision.

## 4. Out of scope

- **The numbers' meaning** — [039](done/039-adaptations-read-grounding.md). This brief
  draws what that one decides.
- **Target values and shapes** — [012](012-adaptation-target-shapes.md). If 012
  lands first the units shown here follow it; neither blocks the other's kickoff.
- **User-set adaptation goals** — [040](040-adaptation-goals.md), backlog.
- **Classifier changes** — [001](done/001-cross-adaptation-rep-ranges.md)
  (retired — decided inside 039), [005](005-hr-zone-intensity-classification.md).

## 5. Doctrine check (§4)

1. **Which read?** Adaptations — an existing Core read. No new section, R1
   untouched.
2. **What does it let me stop doing?** Stop opening and closing seven cards to
   compare two adaptations; stop maintaining a third muscle dialect; stop
   carrying `MuscleCoverageCard`.
3. **Input or destination?** Neither — it is a *rearrangement* of an existing
   destination. Nothing new is stored.
4. **Honest shape?** The centre of the brief: muscles are spatial and get the
   map; the whole-body three are a continuum and get an axis; neither borrows
   the other's picture (P2).
5. **Does it write a number claiming physiological meaning?** No new number —
   but it makes ungrounded ones *more* prominent, which is why 039 gates it.

## 6. Acceptance

- [x] 039 is in `done/` before implementation starts.
- [ ] One body map with a four-way adaptation toggle; switching does not reflow
      the page.
- [ ] The selected adaptation's `rx` and its per-muscle detail are each one tap
      away, on the map, not in a stack of cards.
- [ ] The whole-body three have their own read, and the shape chosen is recorded
      in §3b with its reason.
- [x] `MuscleCoverageCard.tsx` is deleted and nothing imports it (already gone
      when 031 was picked up — 039 §6.1 took it).
- [ ] No old-token classes, per-adaptation hues, or emoji remain in
      `AdaptationsTab` and its children.
- [ ] Browser-verified with a screenshot next to Home for comparison; console
      clean.

## 7. Where it left off — 2026-09-03

**The page today** (the §2 survey is partly stale): hero card, seven
`AdaptationCard`s (each with an `InfoTip`, a collapsed `rx` table and an old
three-colour `BodyMap` / `MuscleStatusList` toggle), an emoji legend, and the
collapsed `AdaptationGuide`. MUSCLE COVERAGE and `MuscleCoverageCard.tsx` are
already gone. Every colour on the page is an old token or a per-adaptation hue.

### Decisions made, so the next session does not re-derive them

1. **Window: Home's rolling 14 days, not the calendar week.** 039 §6.1 left the
   window to the caller; §6.6 called week-to-date "the wrong what's-missing
   read" for Home, and the same objection holds for a drill-down — on Monday
   morning every muscle would be a gap. Each quality's target is its weekly
   rate × 14 / 7 (strength 12, hypertrophy 20, muscular endurance 12, power 12;
   cardio 2 / 2 / 4 sessions). `/ground` Step 0 **exemption 2** (shape change,
   no new claim) — the same construction as `MUSCLE_SET_TARGET`. Named on
   screen as Home does: "6/wk · 14-day window". Unit 1 made
   `adaptationCoverage` able to do this (`from`, `windowDays`); the tab still
   passes a calendar week until the rebuild lands.
2. **The map is `GapMap`, unchanged**, fed per quality. It already takes
   `MuscleState[]` + ranked `gaps` + `onPick`; the callouts are the ranked
   list, worst first, and a tap opens Home's `MuscleSheet` (lazy, as Home does)
   — that *is* the per-muscle detail, one tap away on the map. The hatch
   (recovering) stays muscle-level: a muscle recovers from any hard set, not
   from a quality.
3. **Default toggle: hypertrophy** — the quality Home's floor is grounded on
   (010 D10), so the first picture is the one closest to Home's. Order on the
   control is the continuum: POWER · STRENGTH · HYPERTROPHY · MUSC. END.
4. **Whole-body three: the effort spectrum from §3b**, as one SVG. Three bands
   left→right by effort duration (anaerobic · VO₂max · endurance), each filled
   by the ramp step of sessions ÷ window target, edge in the accent when
   `qualityStates` says stale (Home's polarity, design-system §4), recency
   under each band, axis labels SECONDS · MINUTES · HOURS. Tap a band → the
   rx sheet.
5. **Both affordances are sheets** (P1, T2): an rx sheet (`BottomSheet` with
   `AdaptationRxTable`, the power extra line from 039 S4, then
   `ADAPTATION_PRINCIPLE` and the Galpin taxonomy credit from
   `AdaptationGuide` as a footer) and a ranked-list sheet for all leaf muscles
   of the selected quality. Two ghost buttons under the map open them.
6. **Header line replaces the hero**: `LAST 14 DAYS` label + "N lifting sets ·
   K cardio sessions" right; "3 of 7 on target" at 17–19px; a 12px sub naming
   the untouched and the short ones. Sans only — the serif is Home's verdict.
   Count cardio sessions as entries in the window (cardio + sports), not as a
   sum of per-quality volumes, which double-counts a Garmin ride.

### Remaining units, in order

- **Unit 2 — `muscleQualityStates` in `src/lib/fusedRead.ts`** (beside
  `muscleStates`, which already imports `muscleStimulus`):
  `(weights, exerciseMuscles, muscleGroups, quality, weeklyTarget, overrides?, date?)
  → MuscleState[]`. `sets` = `byQuality[quality]` over `muscleWindow(date)`;
  `fillFraction` = sets ÷ (weeklyTarget × MUSCLE_WINDOW_DAYS / 7);
  `daysSince` = last date a set *classified into that quality* fed the muscle
  (all history, zero-weight links excluded); `recovering` from the any-set
  recency, as `muscleStates`. Extract the last-date loop in `muscleStates` into
  a helper taking an optional per-set filter so both share it. Export
  `muscleWindow`. Tests in `fusedRead.test.ts`: a 10-rep set lands on the
  hypertrophy map not the strength map; per-quality `daysSince` differs from
  the any-set recency; a power set counts on the power map only.
- **Unit 3 — the page.** New `src/components/tabs/adaptations/` with
  `EffortSpectrum.tsx` and `RxSheet.tsx`; rebuild `AdaptationsTab.tsx` on
  `Card`/tokens from `src/index.css` (`text-ink*`, `border-line`,
  `text-signal`). Restyle `home/AdaptationRx.tsx` to the tokens (its two
  consumers die in unit 4). Add an `info` and a `list` glyph to
  `ui/Icon.tsx` for the two ghost buttons. Segmented control: one
  `border-ink` row, selected segment `bg-ink text-white`, 10px tracked
  uppercase. Empty state: `GapMap` handles `zeroData`; the header sub carries
  "Log a session →" to Weights.
- **Unit 4 — deletions.** `home/AdaptationCard.tsx`, `home/AdaptationGuide.tsx`,
  `home/MuscleStatusList.tsx`, `ui/InfoTip.tsx` (its only consumer is the
  card). Strip `home/BodyMap.tsx` to the geometry exports `GapMap` imports
  (`HALF`, `MIRROR`, `ABS_LINES`, `FRONT_ZONES`, `BACK_ZONES`, `Zone`) —
  drop the `BodyMap` component, `zoneResolver`, `SILHOUETTE`, `UNTOUCHED`.
  Drop `icon` and `color` from `AdaptationMeta` and the seven entries in
  `src/constants/adaptations.ts` — nothing else reads them (checked
  2026-09-03; the `meta.icon` in ProfileTab is section meta). `usePrefs`'s
  `weekStartDay` leaves the tab.
- **Unit 5 — verify and close.** Browser-verify against Home (headless
  chromium recipe in memory), screenshot, console clean; minor bump and tag;
  tick §6; move to `done/`; then take [033](033-retire-old-design-language.md)
  off `blocked` if it lists 031.
