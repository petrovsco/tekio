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
   `## Grounding` section before implementation — see
   [roadmap/feature-grounding.md](roadmap/feature-grounding.md).

## 5. Ledger

Status of every surface as of 2026-08-26. This table is the shelf; keep it current.

| Surface | Verdict | Note |
|---|---|---|
| Home (Overview) | **Core — read** | The product. Answers "what's missing" without tapping. |
| Adaptations | **Core — read** | The nine qualities. |
| Weights | **Core — capture** | Primary stimulus source. |
| Cardio | **Core — capture** | Endurance / VO₂max / anaerobic stimulus. |
| Mobility | **Core — capture** | Recovery-axis input with its own volume model. |
| Program | **Core — plan** | Cycle + today's plan; the thing that closes gaps. |
| Recovery | **Core — read, Home-only** | Already has no tab. The precedent the folds follow. |
| Sports | **Fold → Cardio** | Already classifies into cardio adaptations; a sport session is a cardio session with a name and a quality rating. UI folds first; the DB merge is its own brief. |
| Water | **Fold → Recovery** | Hydration is an FRS sub-score, not a destination. |
| Donations | **Fold → Recovery** | Not training, but real: full-blood donation suppresses endurance performance for weeks, and eligibility windows are already tracked. A readiness input. |
| Body Weight | **Fold → Home stat** | A trend, not a stimulus or readiness signal. Inline logging on Home; FRS needs the number anyway. |
| Habits | **Fold → Admin (definitions) + Home (completion)** | `recoveryHabitSets()` genuinely feeds the Recovery read, so the machinery stays. The tab does not. |
| Profile / Admin / Assistant settings | **Exempt** | Infrastructure, not sections. Not counted against R1. |

**Open question (not decided):** habit-derived *muscle* contributions
(`habitMuscleContributions()`). Inferred stimulus may make the "what's missing"
answer less honest than counting only logged sets. Recovery bouts are a
different case and stay. Decide before the Home redesign.

## 6. Exit condition

The core is **perfected** when:

> I open Home and, without tapping anything, know within five seconds which
> muscles are under-stimulated this cycle, which adaptations are untouched, and
> whether I'm recovered enough to push today.

Until then, new sections don't get built and the shelf doesn't unshelve.
This is the sentence that ends the austerity — replace it if it's wrong, but
don't leave it blank.

## 7. What this doctrine does not cover

- **Is the claim true?** → `/ground` + the `science-scout` subagent.
- **Is the code clean?** → `/simplify`, `/code-review`.
- **Did smoothness degrade?** → the measured perf budget.

See [roadmap/feature-grounding.md](roadmap/feature-grounding.md) for all three.
