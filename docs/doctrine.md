# Tekiō doctrine

The rules this app is built by. Short on purpose — it is meant to be re-read
every time a feature is proposed, and it is only useful if it can say **no** to
something I want.

Established 2026-08-26. Amend it deliberately; don't drift past it.

---

## 1. Purpose

> **Tekiō tells me what's missing.**

Whether my training is balanced across the nine adaptations and the muscles that
serve them, and whether I'm recovered enough to close the gap today.

Everything else is judged against that sentence. Two consequences follow
immediately, and they do most of the work:

- **The read is the product. Capture is overhead.** A logging screen is a cost I
  pay to get an honest answer. Time spent making capture prettier is worth less
  than time spent making the answer clearer or faster to reach.
- **A number I can't act on doesn't get shown.** If seeing it changes nothing
  about what I train or how I recover, it's decoration.

## 2. Principles

**P1 — Just in time, both faces.** The control appears where and when it's
needed (inline on the surface that raised the question), and what isn't needed
now isn't loaded now. The UX face and the performance face are the same rule.

**P2 — Honest reads beat pretty ones.** A visualization must fit the shape of
its data. Muscles are spatial; a body map is honest for them. Speed, power,
VO₂max, anaerobic, cardio-endurance and skill are whole-body qualities — putting
them on a silhouette would be a beautiful lie. When one picture can't answer two
questions, use two reads.

**P3 — Fold before you add.** A new signal is usually an *input to an existing
read*, not a new destination. Blood donation isn't a section; it's a readiness
input. Water isn't a section; it's hydration. Ask "which existing read does this
sharpen?" before "where does this live?"

**P4 — Configurability is not a decision.** With one user, "you can hide it" is
not a justification for building something. A feature earns its default-on place
or it doesn't ship.

**P5 — Stimulus and recovery are two dimensions of one read, not two places in
the app.** Sustainable progress needs both sides: stimulus alone injures, recovery
alone adapts nothing. But they are not opposite ends of one axis — more rest is not
less training. Every target has a *state* on two axes. Recovery is therefore never a
destination; it is the second dimension of the muscle and adaptation reads, at two
levels:

- **Systemic** (sleep, sauna, cold, hydration, HRV / Garmin readiness, blood
  donation) — one global number. Answers *can I push at all today?*
- **Local** (hours since that muscle was last stimulated, recent volume load) —
  per muscle, computed from logged sets. Answers *what can I train today?*

Never split a systemic number N ways and present it as N per-adaptation facts;
that is one fact wearing a costume (P2). Skill is exempt from *local muscular*
recovery only — motor consolidation is sleep-dependent, so it leans hardest on the
systemic side. Any number encoding that needs §4 grounding first.

## 3. Rules with teeth

**R1 — Cap: at most 4 menu sections.**
Currently 3 (Weights, Cardio, Mobility) plus Recovery as a Home-only card. One
slot of headroom. The fifth section does not get added — something trades out
first. The cap is the argument, so individual features don't each get to win
their own.

**R2 — The shelf has an expiry: one cycle (6 weeks), then the code is deleted.**
Shelving = default-off (`show_in_menu` / `show_in_home` false, or dropped from
`DEFAULTS` in `src/lib/db/sectionConfig.ts`). A shelved section carries a
delete-by date in the ledger below. When that date passes and it hasn't been
missed, the component, its tests, and its unused tables go. Git remembers it.
Hidden code still costs bundle weight, test runtime, migrations and reading
load — a shelf without an expiry is just a slower way of keeping everything.

**R3 — Shelving and folding are decisions, not features.** They are executed by
editing this ledger and flipping existing config. Building new machinery to
*manage* the feature set (tier fields, admin panels for section categories) is
forbidden — that is solving feature bloat by adding features.

**R4 — Every roadmap brief answers the checklist in §4** before it becomes code.

## 4. Brief checklist

A roadmap brief in `docs/roadmap/` is not ready until it answers all five:

1. **Which read does this sharpen?** Name the existing surface. If the answer is
   "a new one," justify against R1.
2. **What does it let me stop doing?** Folds, cuts, or replacements it enables.
3. **Is this an input or a destination?** (P3 — default is input.)
4. **What's the honest shape of the data?** (P2 — spatial vs. not, per-session
   vs. rolled-up.)
5. **Does it write a number claiming physiological meaning?** If yes, it needs a
   `## Grounding` section before implementation. Run `/ground`; its Step 0 is
   the canonical trigger spec (including the three exemptions where a number
   moves but no new claim is made) —
   [.claude/skills/ground/SKILL.md](../.claude/skills/ground/SKILL.md).

## 5. Ledger

Status of every surface as of 2026-08-26. This table is the shelf; keep it current.

**This ledger records verdicts, not steps.** Five surfaces below are ruled out
of the menu and all five still ship — the work that closes the gap is
[roadmap/014-doctrine-ledger-execution.md](roadmap/014-doctrine-ledger-execution.md).
Pending work lives in `docs/roadmap/`, never in this file (house rule
`pending-work-in-roadmap`).

| Surface | Verdict | Note |
|---|---|---|
| Home (Overview) | **Core — read** | The product. Answers "what's missing" without tapping. |
| Adaptations | **Core — read** | The nine qualities. |
| Weights | **Core — capture** | Primary stimulus source. |
| Cardio | **Core — capture** | Endurance / VO₂max / anaerobic stimulus. |
| Mobility | **Core — capture** | Recovery-axis input with its own volume model. |
| Program | **Core — plan** | Cycle + today's plan; the thing that closes gaps. |
| Recovery | **Core — read, Home-only** | Systemic readiness only (P5). Local recovery fuses into the muscle read rather than living here. Already has no tab — the precedent the folds follow. |
| Sports | **Fold → Cardio** | Already classifies into cardio adaptations; a sport session is a cardio session with a name and a quality rating. UI folds first; the DB merge is its own brief. |
| Water | **Fold → Recovery** | Hydration is an FRS sub-score, not a destination. |
| Donations | **Fold → Recovery** | Not training, but real: full-blood donation suppresses endurance performance for weeks, and eligibility windows are already tracked. A readiness input. |
| Body Weight | **Fold → Home stat** | A trend, not a stimulus or readiness signal. Inline logging on Home; FRS needs the number anyway. |
| Habits | **Shelf — delete by 2026-10-07** | Decided 2026-08-26. A checklist is an adherence tool; the app tells me what's missing, it does not make me do it. Sauna/cold/mobility/sleep are captured directly, so habits was a duplicate capture path. |
| Profile / Admin / Assistant settings | **Exempt** | Infrastructure, not sections. Not counted against R1. |

**Two conditions attach to the Habits shelf**, and they are conditions on the
decision, not optional cleanup: `ExerciseMuscleEditor.tsx` moves to Admin rather
than being deleted with the section, and `RECOVERY_WEIGHTS.habits` (0.10) is
renormalised rather than dropped. Both are carried in full, with their sequencing
and their grounding trap, by
[roadmap/014-doctrine-ledger-execution.md](roadmap/014-doctrine-ledger-execution.md).

Resolved by the same decision: habit-derived *muscle* contributions go too. The
muscle read counts logged sets only, which is the more honest answer anyway.

## 6. Exit condition

The core is **perfected** when:

> I open Home and, without tapping anything, know within five seconds which
> muscles are under-stimulated this cycle, which adaptations are untouched, and
> whether I'm recovered enough to push today.

Until then, new sections don't get built and the shelf doesn't unshelve.
This is the sentence that ends the austerity — replace it if it's wrong, but
don't leave it blank.

## 7. What this doctrine does not cover

- **Is the claim true?** → [`/ground`](../.claude/skills/ground/SKILL.md) + the
  [`science-scout`](../.claude/agents/science-scout.md) subagent.
- **Is the code clean?** → `/simplify`, `/code-review`.
- **Did smoothness degrade?** → the measured perf budget.

See [roadmap/009-feature-grounding.md](roadmap/009-feature-grounding.md) for how the
three fit together.
