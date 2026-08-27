# Roadmap: Home design canvas — a JIT design system for the fused read

**Status:** ready — decisions taken 2026-08-27, canvas not yet made. This file is
the kickoff brief and it contains the prompt to run.
**Origin:** [home-fused-reads.md](home-fused-reads.md) §6 says its two open
questions are "easier to answer with the fused state concrete than in the
abstract." That is a request for a mockup. This brief is that mockup, plus the
design system it needs.
**Blocks:** the three remaining folds in
[doctrine-ledger-execution.md](doctrine-ledger-execution.md) and, through them,
R1's cap of four menu sections.

---

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
| Purpose | **Variants first, then refine.** Round 1 puts the §6 forks side by side and the user picks; round 2 refines the winner into a build spec. |
| Visual language | **Free.** Explicitly *not* constrained to today's cards / indigo / emoji. The user's words: "I don't want to stick to existing concepts just because we want to spare some work." |
| Grounding order | **Design first, ground after.** Labelled placeholder thresholds on the canvas; `/ground` before code. No scout run is dispatched by this brief. |

## The new constraint: the design system must encode P1

This is the part that makes it a *system* rather than a mockup. The user's
requirement:

> The design system should take into account our goal of JIT component delivery.

P1 has two faces and they are the same rule:

- **UX face** — the control appears where and when it is needed, inline on the
  surface that raised the question.
- **Performance face** — what isn't needed now isn't loaded now.

**Today the performance face is at zero.** Measured 2026-08-27:

- No `React.lazy`, no `Suspense`, no dynamic `import()` anywhere in `src/`.
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

## The canvas — six artboards

Round 1. Phone-first (390 × 844); the app has a bottom nav and safe-area insets,
so phone is the honest target.

| # | Artboard | What it must show |
|---|---|---|
| 1 | **Home — variant A** | Systemic readiness **gates** the local read (a bad recovery day visibly greys/dampens what you'd otherwise be told to train) |
| 2 | **Home — variant B** | Systemic readiness sits **alongside** the local read as a separate signal |
| 3 | **Muscle drill-in (T2)** | What a tap on one muscle reveals: its state, hours since stimulus, recent volume, and inline capture |
| 4 | **Water inline** | Hydration as an FRS input on the fused read — not a card, not a destination |
| 5 | **Donations inline** | Eligibility window as a readiness input |
| 6 | **Body Weight inline** | Trend + inline logging as a Home stat |

Artboards 4–6 each carry the same secondary fork, shown rather than asked:
**always-visible quick-add vs. revealed-on-intent.** That is the JIT question in
its most concrete form, and it decides three folds at once.

**Two variants of the whole-body read** (speed, power, VO₂max, anaerobic,
cardio-endurance, skill) must appear across artboards 1–2, since §6's second
question is whether they get one combined read or one state each. P2 forbids
putting them on the silhouette.

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

### Step 1 — run the canvas

Invoke `/design` with the prompt in the next section. Do **not** hand it the
doctrine and hope; the prompt below already carries the parts that constrain
design, because a canvas prompt that says "read the doctrine" produces a canvas
that ignores it.

### Step 2 — review the canvas against the doctrine, before showing it

Three checks, and they are pass/fail:

- **§6, timed.** Look at artboards 1 and 2 for five seconds each. Can you name
  the under-stimulated muscles, the untouched adaptations, and whether to push?
  If not, the design fails regardless of how it looks.
- **P2.** Is anything whole-body drawn on the silhouette? Is anything spatial
  drawn as a bar? Either is a fail.
- **T1 budget.** List every component in T1 and estimate its weight. Recharts
  alone is a large dependency — if a chart is in T1, justify it or move it.

### Step 3 — decide §6 with the canvas in hand

Answer the two open questions in [home-fused-reads.md](home-fused-reads.md) §6
by picking, then **record the decision and the reason in that brief** and flip
its status from `proposed` to `agreed`. The canvas is the evidence; the brief
stays the record.

### Step 4 — refine round

Second canvas pass on the winner only: real states, real edge cases (a muscle
never trained, a zero-data day, a deload week, donation-ineligible), and the T1/
T2/T3 tier of every component written on the artboard itself.

### Step 5 — write the design system down

One short doc, `docs/design-system.md`, reference-only per the house rule: type
scale, colour and state semantics, spacing, the component tier table, and the
rule for deciding a new component's tier. It records what *is*; anything pending
comes back here.

### Step 6 — `/ground` the recovery windows

Only now. The gate needs: how long until a muscle is "recovered", whether it
varies by muscle size, and whether local recovery needs a rolling window at all.
The `## Grounding` block lands in `home-fused-reads.md`, and the constants get
source comments. **No placeholder threshold may become code before this.**

### Step 7 — build, and unblock R1

Implement the refined design, then the three folds land on the surface that was
designed for them, and `DEFAULTS` finally seeds four menu sections.

## The prompt to use in step 1

> Design the Home screen for Tekiō, a single-user training app. Phone-first,
> 390 × 844.
>
> **The one sentence the app exists for:** *Tekiō tells me what's missing.*
> Whether my training is balanced across nine adaptations and the muscles that
> serve them, and whether I'm recovered enough to close the gap today.
>
> **The screen succeeds only if:** I open it and, without tapping anything, know
> within five seconds which muscles are under-stimulated this cycle, which
> adaptations are untouched, and whether I'm recovered enough to push today.
> Everything on the screen is judged against that, and a number I cannot act on
> does not get shown.
>
> **The data has two shapes and one picture cannot carry both honestly.**
> Muscles are spatial — a body map is honest for them. Speed, power, VO₂max,
> anaerobic capacity, cardio-endurance and skill are whole-body qualities;
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
> **Do not reuse the app's current look.** It is Tailwind defaults plus emoji and
> was never designed. Build a visual language that serves a five-second
> glanceable read.
>
> **Artboards:** [the six from the table above, pasted in full]
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
- **Writing any physiological number.** Step 6 is the gate.
- **The Sports → Cardio DB merge.** Still its own brief.

## Acceptance

- Six artboards exist, published, using real data.
- The five-second test has actually been performed and its result written down —
  not reasoned about.
- Both §6 questions are answered in `home-fused-reads.md` with the canvas cited.
- Every component on the refined artboard carries a T1/T2/T3 label, and the T1
  set is small enough to defend as an initial chunk.
- `docs/design-system.md` exists and is reference-only.
