# Roadmap: Home design canvas — a JIT design system for the fused read

**Label:** feature
**Status:** in progress — rounds 1–3 are done, the look is picked (SIGNAL) and both
five-second tests passed. Step 8 is underway: unit 1 (constants + fused-read
library) shipped in v1.1.6; units 2–6 remain.
**Canvas URL:** https://claude.ai/code/artifact/a1534123-0c92-49dc-8fa1-3879279d16ee
Rounds 2
and 3 **update that same canvas** — they never invoke `/design` for a fresh one,
or the user's own edits in the editor are lost.
**Working files:** `design/home-canvas/` — committed to the repo, not the
scratchpad. The canvas is re-seeded from these files on every change, so they
have to outlive the session that made them. They sit outside `src/`, so they add
nothing to the bundle.
**Origin:** [010-home-fused-reads.md](010-home-fused-reads.md) §6 says its two open
questions are "easier to answer with the fused state concrete than in the
abstract." That is a request for a mockup. This brief is that mockup, plus the
design system it needs.
**Blocks:** the three remaining folds in
[014-doctrine-ledger-execution.md](014-doctrine-ledger-execution.md) and, through them,
R1's cap of four menu sections.

---

## Progress log

The decision record, newest last. Read the `**Status:**` line for where it
stands; read this for how it got there.

- **2026-08-29 — structure settled (round 1).** The pick: A's gated verdict
  header + readiness card, the body map with ranked callouts (What-is-missing
  dissolved into the map; polarity flipped — ink = trained, light = the gap),
  B's one-state-each whole-body strip and the T2 fold stats. Fused boards
  `Home` / `HomeHeld` sit at the top of the canvas.
- **2026-08-29 — five-second test #1 passed**, performed by Peter on the fused
  boards ("five-second test is ok"). Both §6 answers are recorded in
  [010-home-fused-reads.md](010-home-fused-reads.md) §6 — the gate changes the
  instruction only and is advisory, capture never locks; one state each, with
  per-quality staleness windows as science-gated placeholders — and 010 is agreed.
- **2026-08-29 — round 2 published.** Page-2 "Look" carried four visual
  directions on the fused board: SIGNAL (monochrome + one action accent), HEAT
  (a sequential teal ramp carries the state), NIGHT (dark ground, work glows),
  WASHI (Peter's palette: rice paper, sumi-ink ramp, vermillion seal).
- **2026-08-30 — Peter picked SIGNAL.**
- **2026-08-30 — round 3 published.** Page-3 "Refined" holds the build-spec
  boards (`Refined` / `RefinedHeld`, the latter derived via `make-derived.sh`) —
  SIGNAL language on the fused structure, plus working inline capture on the
  fold stats (fork 2 answered as revealed-on-intent, implied by the pick — open
  to veto), a `post-donation` scenario, and a tier label on every component.
- **2026-08-30 — five-second test #2 passed**, performed by Peter on the Refined
  boards ("The 5 second test pases"). Both required test runs are now on record.
  Taps live behind the artboard's Play button; canvas clicks select for editing.
- **2026-08-30 — phase confirmed by Peter** ("I think we're ok with that phase"):
  the Play round and the revealed-on-intent capture (fork 2) both stand.
- **2026-08-30 — Play fixes**, after Peter's first Play run. Reveals open
  **centred**: the viewer's floating toolbar covers the bottom of the frame,
  which hid the bottom-anchored sheets (on the device they would anchor to the
  bottom edge). And WEIGHT logs through a **stepper prefilled from yesterday**
  (− 1 / − 0.1 / + 0.1 / + 1, then log) instead of a preset chip — body weight
  moves daily, a preset can't capture it.
- **2026-08-30 — step 6 done:** both fixes carried into
  [docs/design-system.md](../design-system.md) (reference-only).
- **2026-08-30 — step 7 done:** `/ground` ran; five scout blocks landed in
  [010 §Grounding](010-home-fused-reads.md#grounding), verdicts recorded in the
  grounding inventory.
- **2026-08-30 — step 8 build plan written.** A full code survey was done and
  banked as [§Step 8 — build plan](#step-8--build-plan-code-survey-2026-08-30)
  below, so the building session starts from the plan, not from re-reading the
  codebase.

- **2026-08-30 — step 8 unit 1 shipped** (v1.1.6, commit `8704742`): the five
  grounded constants landed in `src/constants/app.ts` with their source
  comments, and `src/lib/fusedRead.ts` carries the pure fused-read layer
  (per-muscle state + gap ranking, quality staleness, systemic readiness,
  donation/water status, Push/Hold verdict) with 27 tests. The HRV question
  is resolved: `sleep_logs` has live `hrv`/`resting_hr` columns, so
  `SleepEntry`/`SLEEP_COLS` now select them. Readiness = last night's sleep
  score blended 50/50 with a baseline-relative HRV sub-score (7-day rolling
  vs 60-day baseline in SD units, SD floored at 5% — the grounded
  Vesterinen/Buchheit shape; the blend itself is convention, commented as
  such). Degrades to sleep-only without a baseline, null without a fresh
  night — a missing readiness never gates.

**Next: step 8, unit 2 — SIGNAL tokens + the T1 surface. Remember the open
call on the bottom nav: ask Peter before wiring it.**

## Step 8 — build plan (code survey 2026-08-30)

The spec triangle: `design/home-canvas/Refined.dc.html` (+ `RefinedHeld`) is
the picture, [docs/design-system.md](../design-system.md) is the rulebook, and
[010 §Grounding](010-home-fused-reads.md#grounding) holds the numbers. Build in
these units; each one passes `npm run build`, is committed and pushed before
the next starts (session wrap-up rule).

### Unit 1 — grounded constants + the fused-read library (no UI)

- Add to `src/constants/app.ts`, each with its source comment from 010
  §Grounding: `RECOVER_DAYS = 2` (48 h floor), `PUSH_THRESHOLD = 33`
  (convention), staleness windows `{ vo2max: 14, endurance: 14,
  anaerobic_capacity: 28 }`, `CYCLE_SET_TARGET = 60` (10 fractional
  sets/muscle/week × 6 — the grounding's deload caveat says the honest band is
  50–60), donation suppression `{ acuteHours: 48, aerobicTailDays: 21 }`
  (whole blood only, aerobic-only; plasma 0 — never a global hold).
- New `src/lib/fusedRead.ts` — pure functions, unit-tested like `utils.ts`:
  - **Per-muscle state** over the 42-day window: fractional sets (reuse the
    `LEVEL_WEIGHT` logic of `muscleCoverage()` in `src/lib/utils.ts`, windowed
    42 d instead of weekly), days since last stimulus, `recovering`
    (< `RECOVER_DAYS`), and a callout rank (never-trained first, then fewest
    sets).
  - **Whole-body quality states** from `classifyCardioAdaptations()`
    (`src/lib/adaptations.ts`) plus sport sessions: days since the last
    qualifying session per quality, against its staleness window.
  - **Systemic readiness + verdict**: readiness is the sleep+HRV roll-up per
    the 010 grounding; the verdict is push/hold with the top gap as its
    reason; hold below `PUSH_THRESHOLD`, advisory only — capture never locks.
    Donation: < 48 h → hold flag; ≤ 21 d → aerobic-scoped note only.
- **Resolve first — HRV.** The gate card shows SLEEP and HRV, but `SLEEP_COLS`
  in `src/lib/db/recovery.ts` does not select an HRV column. The 2026-08-27
  pull ([DATA.md](../../design/home-canvas/DATA.md)) lists per-night HRV and
  resting HR, so the Garmin sync likely writes columns the app never reads.
  Check the live `sleep_logs` schema; if present, extend `SleepEntry` and the
  mapper. If absent, readiness degrades to the sleep score alone and the HRV
  bar shows "—".

### Unit 2 — SIGNAL tokens + the T1 surface

- New tokens per design-system §§1–7 (paper `#faf9f7`, the four-ink text set,
  accent `#c2410c`, serif for the verdict only) into `src/index.css` `@theme`.
  The old slate/indigo tokens stay until the old tabs are restyled or retired.
- New Home surface (under `src/components/tabs/home/`) replacing `OverviewTab`
  as the Home tab: header (TEKIŌ + cycle label), verdict block, systemic gate
  card (inverts to ink when gated; banner on hold days), body map with the
  stimulus ramp + white 45° recovery hatch + ranked callouts, whole-body strip
  (three squares). **Reuse the anatomical SVG in
  `src/components/tabs/home/BodyMap.tsx`** — its zones are keyed by DB muscle
  names and are better drawings than the canvas GEO rectangles; recolour by
  the ramp in design-system §4.
- No charts, no Recharts, no `useCountUp` in T1. The five-second answer only.
- Callout *ranking* is mechanical (unit 1); the label text is editorial per
  the board ("1 · CORE — never trained").

### Unit 3 — T2 reveals (lazy)

- Fold-stat row (WATER / WEIGHT / BLOOD) + bottom-sheet capture per
  design-system §8: water outline chips (+100/+250/+500), weight stepper
  prefilled from the last entry (−1 / −0.1 / +0.1 / +1; the solid confirm
  shows the exact value it logs), blood full-donation confirm. The store
  actions already exist (`addWaterEntry`, `addBodyweightEntry`,
  `addDonationEntry`).
- Muscle drill-in sheet on map tap: state line, sets/cycle, last stimulus,
  target, then the ranked exercise list + prefilled sets grid per
  `LogSets.dc.html` (exercise-first — sets classify by rep range).
- All T2 behind `React.lazy`; prefetch on first pointer-down on the surface.

### Unit 4 — the three folds + DEFAULTS to four (014's remainder)

- Remove Water / Donations / Body Weight from `DRAWER_TABS`
  (`src/App.tsx:19`) and from `DEFAULTS` (`src/lib/db/sectionConfig.ts`).
  Mind the trap noted there: the *old* OverviewTab renders a **missing** row
  as visible — the new Home doesn't use `homeOn()`, so the trap dies with it.
  Flip the live `user_section_config` rows to match.
- `RECOVERY_WEIGHTS` surgery: the weekly-rollup readiness (`RecoveryCard`) is
  replaced by the sleep+HRV gate, so the five weights and `RECOVERY_TARGETS`
  likely go entirely rather than being reweighted — but 014's acceptance
  requires the before/after readiness comparison on real data either way.
  Sauna / cold / sleep capture (quick-adds now on RecoveryCard) must survive
  somewhere reachable; mobility has its own tab.
- End state: `DEFAULTS` seeds Weights, Cardio, Mobility (+ the shelved Habits
  row); R1 satisfied with one slot free.

### Unit 5 — T3 code splitting

- `React.lazy` every tab component in `App.tsx` — behind nav/drawer is T3 by
  definition. Suspense fallback: the `HomeSkeleton` pattern.
- Measure before/after with `npm run build` (baseline 2026-08-27: one chunk,
  1,142 kB / 322 kB gzip). The T1 chunk must exclude Recharts, dnd-kit and
  the tabs. Record the numbers here.

### Unit 6 — verify + close

- Browser regression pass per the house rule (system-wide change): Home in
  both gate states, drill-in, the three captures, Weights / Cardio / Mobility
  tabs, Profile section toggles.
- Write the readiness before/after comparison into 014.
- Tick acceptance across 018 / 010 / 014; move finished briefs to `done/`.

### Open calls for the building session

- **Bottom nav.** The board shows HOME / WEIGHTS / CARDIO / PROGRAM; today's
  nav is Home / Adapt / Program / More. Where Adaptations, Mobility and the
  drawer land is a build-time decision — ask Peter before wiring it.
- **019 is planned, not shipped.** Home must not wait for it: the strip and
  the power line don't depend on the Adaptations tab still enumerating nine.

## The plain summary

Tekiō has a doctrine, a purpose sentence and an exit condition. It does not have
a design system. Today's look is whatever Tailwind's defaults plus emoji
produced, and the app has never been designed *against* the doctrine — only
built against it.

Two things make this the right moment:

1. **The exit condition is visual and timed.** "I open Home and, without tapping
   anything, know within five seconds…" cannot be judged from prose. It has to be
   looked at.
2. **Three folds are waiting on the same surface.** Water, Donations and Body
   Weight all fold onto Home/Recovery. Designing them together gives one coherent
   surface instead of three patches.

## The §4 checklist (doctrine R4)

1. **Which read does this sharpen?** Home — the product. No new surface, so R1 is
   not engaged; in fact this is what *unblocks* R1 being satisfied.
2. **What does it let me stop doing?** It lets the three blocked folds proceed,
   which removes three menu destinations. It also replaces ad-hoc per-card
   styling decisions with one system.
3. **Input or destination?** Neither — it is a *decision instrument*. It produces
   a picked design and two answered questions, not a shipped surface.
4. **What's the honest shape of the data?** The whole point. P2 says muscles are
   spatial and whole-body qualities are not; the canvas has to show both honestly
   in one screen without one lying about the other.
5. **Does it write a number claiming physiological meaning?** **Not yet, and it
   must not.** The local recovery windows are ungrounded. Every threshold on the
   canvas is a labelled placeholder. `/ground` runs before any of it becomes code
   — see step 7.

## Decisions taken 2026-08-27

| Question | Decision |
|---|---|
| Scope | **Home + the three fold destinations.** Six artboards. Not the capture screens — doctrine §1 says capture is overhead. |
| Purpose | **Variants first, then refine.** Round 1 puts the §6 forks side by side and the user picks; later rounds refine the winner into a build spec. |
| Visual language | **Free.** Explicitly *not* constrained to today's cards / indigo / emoji. The user's words: "I don't want to stick to existing concepts just because we want to spare some work." |
| Grounding order | **Design first, ground after.** Labelled placeholder thresholds on the canvas; `/ground` before code. No scout run is dispatched by this brief. |
| Interaction | **Clickable prototype**, not static mockups. A tap on a muscle really opens the drill-in; the quick-add reveal really reveals. **The five-second test is run on first paint, before anything is tapped** — that is how the two rules stay compatible. |
| Rounds | **Three, and each is cheap.** Structure → look → refine. Never settle structure and visual language in the same pick: "I like B's layout but A's colours" is not an answer. |
| Icons | **Inline SVG, no emoji.** Icons have to recolour with muscle and readiness state, which emoji cannot do. This **supersedes** the standing "give Home cards an emoji icon" preference, for this surface. |

## The new constraint: the design system must encode P1

This is the part that makes it a *system* rather than a mockup. The user's
requirement:

> The design system should take into account our goal of JIT component delivery.

P1 has two faces and they are the same rule:

- **UX face** — the control appears where and when it is needed, inline on the
  surface that raised the question.
- **Performance face** — what isn't needed now isn't loaded now.

**Today the performance face is at zero.** Measured 2026-08-27, re-verified
2026-08-27:

- No `React.lazy`, no `Suspense`, no dynamic `import()` anywhere in `src/`. (The
  single grep hit, `src/constants/program.ts:31`, is a type-only `import('../types')`.)
- One chunk: **1,142 kB / 322 kB gzip**. Vite's own 500 kB warning fires on every
  build and has simply been lived with.
- `bootstrap()` loads every domain in parallel at startup, whether or not the
  first screen needs it.

So the design system cannot be a colour palette and a type scale. It has to
define **when each component exists**, in three tiers, and those tiers must be
the same list for the designer and for the bundler:

| Tier | Rule | Loads |
|---|---|---|
| **T1 — At rest** | On screen the moment Home paints. This is the entire five-second answer and nothing else. | In the initial chunk |
| **T2 — On intent** | Appears when the read raises a question: a drill-in, a detail panel, an inline capture control. | Lazy chunk, prefetched on hover/focus |
| **T3 — On demand** | Everything reached by an explicit destination change. | Lazy chunk, no prefetch |

A component's tier is a design decision *and* a code-splitting boundary. If the
canvas puts something in T1 that costs 300 kB, the design is wrong — not the
build. That is the honest reading of "both faces are the same rule."

**The tension to resolve, not dodge:** the exit condition says *without tapping
anything*, while P1 says *what isn't needed now isn't loaded now*. These only
look opposed. The resolution the canvas must express: **the answer is always
visible (T1); the detail and the capture are just in time (T2).** A design that
hides the answer behind a tap fails §6. A design that puts every chart in T1
fails P1.

Because the canvas is a working prototype, this is also *testable* on it: the
five-second test is the T1 test. If the glance needs a tap, T1 is wrong.

## How the canvas is put together

`/design` carries its own mechanics — the seeding helper, the publish rules, the
`.dc.html` format. **Do not restate them here; they will rot.** What belongs in
this brief is the design-level shape the executing session has to know before it
starts:

**Artboards.** Nine files in `design/home-canvas/`, phone-first at **390 × 844**
(the app has a bottom nav and safe-area insets, so phone is the honest target).
Three are derived — regenerated by `make-derived.sh`, never edited by hand; they
differ from their source only in a `data-props` default, so the five-second test
needs no switch-flipping:

| File | Artboard | What it must show |
|---|---|---|
| `Main.dc.html` | **A — good day** | Systemic readiness **gates the instruction**: the screen fuses both signals into one verdict |
| `Alongside.dc.html` | **B — good day** | Systemic readiness sits **alongside** the local read as a separate signal; the reader combines |
| `MainHeld.dc.html` | **A — bad day (held)** | Derived from `Main`. The gate fires: verdict says Hold, the readiness card inverts (cause takes the emphasis), gap chips flip solid→hollow with a HELD tag. **Nothing dims and nothing is struck through** — recovery gates the action, never the fact (an earlier draft dimmed the read to 34% and crossed out the chips; that read as "broken", and it died in review) |
| `AlongsideBad.dc.html` | **B — bad day** | Derived from `Alongside`. Changes nothing but the numbers — that stillness *is* B's argument |
| `MuscleDrillIn.dc.html` | **Muscle drill-in (T2)** | What a tap on one muscle reveals: its state, days since stimulus, recent volume, and inline capture |
| `LogSets.dc.html` | **Log sets — what opens** | Derived from `MuscleDrillIn`. The log flow already open: ranked list of the exercises that feed the muscle (repeat-last-scheme first), then a prefilled sets grid. Exercise-first because sets classify into adaptations **by rep range** — a bare "+3 sets" count would write data no read can use |
| `Water.dc.html` | **Water inline** | Hydration as an FRS input on the fused read — not a card, not a destination |
| `Donations.dc.html` | **Donations inline** | Eligibility window as a readiness input |
| `BodyWeight.dc.html` | **Body Weight inline** | Trend + inline logging as a Home stat |

Variant A is the file called `Main` only because the format requires an entry
file. **That is a naming convention, not a preference** — give both variants an
honest case and its main tradeoff, and set neutral display names in
`canvas.json` so the artboard headers don't put a thumb on the scale.

Artboards 4–6 each carry the same secondary fork, shown rather than asked:
**always-visible quick-add vs. revealed-on-intent.** That is the JIT question in
its most concrete form, and it decides three folds at once. It is an interaction
question, so on these three the reveal has to actually work.

**Two variants of the whole-body read** (VO₂max, anaerobic, cardio-endurance —
all cardio since the 2026-08-29 model simplification, roadmap 019; power reads
per muscle in the drill-in) must appear across variants A and B, since §6's second
question is whether they get one combined read or one state each. P2 forbids
putting them on the silhouette.

**Pages.** One page per round, so nothing is renumbered or overwritten between
rounds and the earlier thinking stays visible:

```
page-1  "Structure"   round 1 — grey wireframes, the §6 fork
page-2  "Look"        round 2 — visual directions on the winner
page-3  "Refined"     round 3 — the build spec
```

Set the launch view to the page of the round in progress, so opening the link
lands on the current work rather than on last week's.

**Scenario switches.** The edge cases (a zero-data day, a deload week,
donation-ineligible) belong on the artboard as a small switch above it, not as
six more artboards. Keep them few and behavioural — one `scenario` enum and one
`deload` toggle is the right budget. Everything else stays literal text on the
artboard so it can be retyped in place. **One exception, decided 2026-08-29:**
any state the five-second test itself must judge (the bad-recovery day) gets a
derived artboard with that state as its default — the test runs on first paint,
so it can never sit behind a switch.

**Icons** are drawn inline SVG on one grid, one stroke style, recolouring with
state. No emoji anywhere on the canvas.

## Exact steps

### Step 0 — pull the real data (do not skip)

With placeholder data the five-second test proves nothing; fake numbers are
always legible. Query the live DB and paste the results into the design prompt:

```sql
-- muscle coverage this cycle
select mg.name, count(ss.id) as sets
from session_sets ss
join session_exercises se on se.id = ss.session_exercise_id
join exercise_muscle_groups emg on emg.exercise_id = se.exercise_id
join muscle_groups mg on mg.id = emg.muscle_group_id
join training_sessions ts on ts.id = se.session_id
where ts.date >= current_date - 42
group by mg.name order by sets;

-- hours since each muscle was last stimulated
-- (same joins, max(ts.date) per muscle group)

-- recovery inputs, last 7 days
select date, sleep_score, sleep_hours from sleep_logs
where date >= current_date - 7 order by date;

-- adaptation state: cardio + sport sessions this cycle
select date, type, duration, avg_hr from cardio_sessions
where date >= current_date - 42 order by date;
```

Also carry over what is already on screen: readiness **36%**, body weight
**77.4 kg**, Garmin sleep score **80**, and the real sport names (Tennis, Beach
Volleyball).

### Step 1 — round 1: settle the structure

Invoke `/design` with the round-1 prompt below. Do **not** hand it the doctrine
and hope; the prompt already carries the parts that constrain design, because a
canvas prompt that says "read the doctrine" produces a canvas that ignores it.

Round 1 is **low-fi on purpose**: grey boxes, real numbers, one weight of type,
no colour decisions. Structure only. Working controls only where the fork *is* an
interaction — the muscle tap on artboards 1–2, the quick-add reveal on 4–6.
Everything else can be inert this round.

**Override the skill's default.** `/design` will otherwise try to match the
existing app pixel-perfectly without being asked, and here that is exactly wrong:
there is no design system to match. `src/constants/colors.ts` is a flat token bag
(slate + `#6366f1` indigo), `src/index.css` is Tailwind v4 plus four keyframes,
and there is no `tailwind.config.*` at all. Read the code for **structure, the
seven adaptations, the muscle list and the real numbers**; inherit **none of the
look**.

If saving turns out not to be enabled for this account, the canvas is still
viewable and exportable — but edits made in the editor will not stick, so
rounds 2 and 3 come back through this brief instead of being done by hand.

### Step 2 — the timed test, and the checks I can actually run

These are split by who can honestly do them. Both halves are pass/fail.

**Yours, on first paint, before tapping anything:** open artboards A and B for
five seconds each. Can you name the under-stimulated muscles, the untouched
adaptations, and whether to push? Write the answer down — the acceptance
criterion is that the test was *performed*, not reasoned about. Only then start
tapping.

**Mine, on the working files, after handing the canvas over** (the design skill's
own rule is to show it first and check it after, not to make you wait):

- **P2.** Is anything whole-body drawn on the silhouette? Is anything spatial
  drawn as a bar? Either is a fail.
- **T1 budget.** List every component in T1 and estimate its weight. Recharts
  alone is a large dependency — if a chart is in T1, justify it or move it.
- **Placeholders.** Every recovery threshold is labelled `PLACEHOLDER`.

### Step 3 — decide §6 with the canvas in hand

Answer the two open questions in [010-home-fused-reads.md](010-home-fused-reads.md) §6
by picking, then **record the decision and the reason in that brief** and flip
its status from `proposed` to `agreed`. The canvas is the evidence; the brief
stays the record.

### Step 4 — round 2: settle the look

Update the same canvas — new page, not a new canvas. If the canvas was edited in
the editor, read it back into the working files first, or those edits are
discarded.

Put **2–3 genuinely different visual directions** on the winning structure, each
exploring an axis that can be named out loud, each with an honest motivation and
its main tradeoff. Three shades of one aesthetic is not a choice. Then pick one.

### Step 5 — round 3: refine into a build spec

The picked structure in the picked language, built into `Main.dc.html`: real
states, real edge cases via the scenario switches (a muscle never trained, a
zero-data day, a deload week, donation-ineligible), full working controls, and
the T1/T2/T3 tier of every component written on the artboard itself. Move the
unchosen sketches to their own page rather than deleting them — they are the
record of why.

Run the five-second test again here, on the refined design. Round 1 proved the
structure carries the answer; this proves the finished look still does.

### Step 6 — write the design system down

One short doc, `docs/design-system.md`, reference-only per the house rule: type
scale, colour and state semantics, spacing, the icon rules, the component tier
table, and the rule for deciding a new component's tier. It records what *is*;
anything pending comes back here. Cite the canvas URL as the visual source.

### Step 7 — `/ground` the recovery windows

Only now. The gate needs: how long until a muscle is "recovered", whether it
varies by muscle size, and whether local recovery needs a rolling window at all.
The `## Grounding` block lands in `010-home-fused-reads.md`, and the constants get
source comments. **No placeholder threshold may become code before this.**

### Step 8 — build, and unblock R1

Implement the refined design, then the three folds land on the surface that was
designed for them, and `DEFAULTS` finally seeds four menu sections.

## The round-1 prompt

Rounds 2 and 3 do not re-paste this; they carry only what changed.

> Design the Home screen for Tekiō, a single-user training app. Phone-first,
> 390 × 844. This round is **low-fi**: grey boxes, real numbers, structure only —
> no colour or type decisions yet, those are round 2.
>
> **The one sentence the app exists for:** *Tekiō tells me what's missing.*
> Whether my training is balanced across seven adaptations and the muscles that
> serve them, and whether I'm recovered enough to close the gap today.
>
> **The screen succeeds only if:** I open it and, without tapping anything, know
> within five seconds which muscles are under-stimulated this cycle, which
> adaptations are untouched, and whether I'm recovered enough to push today.
> Everything on the screen is judged against that, and a number I cannot act on
> does not get shown.
>
> **The data has two shapes and one picture cannot carry both honestly.**
> Muscles are spatial — a body map is honest for them, and the four muscle-linked
> qualities (strength, hypertrophy, muscular endurance, power) read per muscle.
> VO₂max, anaerobic capacity and cardio-endurance are whole-body qualities;
> putting them on a silhouette would be a beautiful lie. Use two reads.
>
> **Stimulus and recovery are two dimensions of one read, not two places.** More
> rest is not less training, so they are not two ends of one axis. Every muscle
> has a *state* on both: fresh & under-stimulated (train it), recently hit &
> recovering (leave it), recovered & due (train it), chronically hammered (back
> off). Recovery also has a systemic level — sleep, sauna, cold, hydration, HRV,
> blood-donation status — which is one global number answering "can I push at
> all today?"
>
> **Just-in-time is a design rule, not just a build rule.** Sort every component
> into three tiers and label it on the artboard: T1 appears the moment the screen
> paints and carries the entire five-second answer; T2 appears when the read
> raises a question (drill-in, detail, inline capture); T3 needs an explicit
> destination change. T1 must stay small — it is also the initial JS chunk. The
> answer is always visible; the detail and the capture are just in time.
>
> **Working controls, but the glance comes first.** This is a clickable
> prototype: tapping a muscle opens its drill-in, and the quick-add reveal really
> reveals. The screen still has to be readable in five seconds *before* anything
> is tapped — that is the point of the tier labels.
>
> **Do not match the existing app, and say so back to me.** There is no design
> system to lift: no `tailwind.config.*`, `src/constants/colors.ts` is a flat
> slate-plus-indigo token bag, and the current look is Tailwind defaults plus
> emoji that was never designed. Read the code for structure, the seven
> adaptations, the muscle list and the real numbers. Inherit none of the styling.
> Build a visual language that serves a five-second glanceable read.
>
> **Icons are inline SVG on one grid, one stroke style, recolouring with state.**
> No emoji anywhere.
>
> **Artboards:** [the six from the table above, pasted in full, with their file
> names and the neutral display names]
>
> **Use this real data, not placeholders:** [paste step 0 output]
>
> **Label every recovery threshold as PLACEHOLDER.** The physiological numbers
> are not yet grounded and must not look decided.

## Out of scope

- **The capture screens.** Weights, Cardio, Mobility, Program. Doctrine §1: the
  read is the product, capture is overhead.
- **Any new section.** R1 is the argument; this brief exists to make the cap
  reachable, not to spend its headroom.
- **Machinery for managing sections.** R3 forbids it.
- **Writing any physiological number.** Step 7 is the gate.
- **The Sports → Cardio DB merge.** Still its own brief.
- **Restating how `/design` works.** The skill carries its own mechanics; this
  brief carries only the decisions the skill will ask for.

## Acceptance

- [x] Six artboards exist on one published canvas, using real data, and its URL is
  recorded at the top of this file.
- [x] `design/home-canvas/` is committed and re-seeds the canvas.
- [x] The five-second test has actually been performed **twice** — round 1 and round
  3 — and both results are written down, not reasoned about.
- [x] Both §6 questions are answered in `010-home-fused-reads.md` with the canvas cited.
- [x] Every component on the refined artboard carries a T1/T2/T3 label, and the T1
  set is small enough to defend as an initial chunk.
- [x] `docs/design-system.md` exists and is reference-only.
- [ ] **Step 8 — built.** The refined design is implemented on Home. This is
      the one criterion still open, and it is shared with
      [010-home-fused-reads.md](010-home-fused-reads.md) (the fused read) and
      [014-doctrine-ledger-execution.md](014-doctrine-ledger-execution.md) (the
      three folds that land on it).
