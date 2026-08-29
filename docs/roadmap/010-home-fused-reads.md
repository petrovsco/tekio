# Roadmap: Home as fused stimulus × recovery reads

**Label:** feature
**Status:** agreed 2026-08-29 — the two-level model was confirmed by picking
it on the 018 canvas (fused boards `Home` / `HomeHeld`), and both §6 design
questions are answered there. Implementation stays gated on §4 grounding.
**Origin:** fell out of writing [../doctrine.md](../doctrine.md); the user's point
that recovery and stimulus must both be present for sustainable progress forced
a rethink of how recovery is represented.

## 1. The problem with the current representation

Recovery today is a **parallel axis** — a weekly readiness % on its own Home card
(`RecoveryCard`), sitting beside the nine adaptations. Two things are wrong with
that once you take the stimulus/recovery relationship seriously:

- **It reads as a separate concern**, when in fact no adaptation progresses
  sustainably without both sides. Stimulus alone injures; recovery alone adapts
  nothing.
- **It cannot be split per adaptation.** Sleep, sauna, cold, hydration, HRV and
  blood-donation status are *systemic*. Dividing one global number nine ways and
  presenting it as nine per-adaptation facts is one fact wearing a costume.

Equally, the natural fix — "make recovery the opposite end of the adaptation
axis" — encodes a falsehood: more rest is not less training. They are two
dimensions, not two poles.

## 2. The model (confirmed 2026-08-29 via the 018 canvas)

Two levels, each honest about its own scope:

| Level | Inputs | Question | Shape |
|---|---|---|---|
| **Systemic** | sleep, sauna, cold, hydration, HRV / Garmin readiness, donation status | *Can I push at all today?* | one global number |
| **Local** | hours since that muscle was last stimulated + recent volume load | *What can I train today?* | per muscle, from logged sets |

Local recovery needs **no new capture** — it is computable from
`session_sets` history today.

**Consequence for the reads:** a muscle stops being "covered" or "missing" and
gains a *state*: fresh & under-stimulated (train it), recently hit & recovering
(leave it), recovered & due (train it), chronically hammered (back off). That is
the two-sided sustainability requirement expressed as one read instead of two
competing ones — and it costs zero new sections.

**Skill** is exempt from *local muscular* recovery only. Motor consolidation is
sleep-dependent, so skill leans hardest on the systemic side. *(Obsolete
2026-08-29: the skill adaptation was dropped — roadmap 019.)*

## 3. What Home becomes

Per the doctrine's purpose ("tell me what's missing") and P2 (honest reads):

- **A body map** — spatial, coloured by the fused *state* above, not by set count.
- **A non-spatial read** for the whole-body qualities (VO₂max, anaerobic
  capacity, cardio-endurance — all cardio since the seven-model simplification,
  roadmap 019; power reads per muscle) that a silhouette cannot honestly carry.
- **One systemic readiness element** — small, global, gating both.
- **Tap to drill** — detail and capture appear at the point of need (P1). This is
  the just-in-time layer; nothing else is loaded until asked for.

Existing parts to reuse: `BodyMap.tsx`, `MuscleCoverageCard.tsx`,
`MuscleStatusList.tsx`, `AdaptationCard.tsx`, `RecoveryCard.tsx`.

## 4. Grounding required (tooling now exists)

The local level needs recovery-window numbers (how long until a muscle is
"recovered" — commonly cited as 48–72 h, varying by muscle size, training age and
session volume). That is exactly a §4.5 number claiming physiological meaning, so
it **requires `## Grounding` before implementation**.

The `science-scout` subagent that produces that block now exists
([.claude/agents/science-scout.md](../../.claude/agents/science-scout.md), shipped
2026-08-26), so this brief is **no longer blocked on tooling** — it waits only on an
actual scout run for the per-muscle recovery window. `/ground` (deliverable 3 in
[009-feature-grounding.md](009-feature-grounding.md)) is not built yet; until it is, invoke
the scout directly and paste its block in below.

Good sign, not a problem: the gate caught its first real case unprompted.

## 5. Sequencing note (read before shelving Habits)

Shelving Habits requires dropping `RECOVERY_WEIGHTS.habits` and reweighting the
remaining four. **Do not do that surgery before this model is decided** — if the
recovery read is about to be rebuilt as systemic-plus-local, a rebalance of the
current weekly-rollup weights is work that gets thrown away. Order:

1. Shelf the Habits *tab* (config-level, reversible, no numbers touched).
2. Decide this model.
3. Do the weight surgery once, in whatever shape survives.

## 6. Open questions (owners)

**Both design questions below are now scheduled to be answered by a canvas, not
by argument** — see [018-home-design-canvas.md](018-home-design-canvas.md), which turns
each into a side-by-side variant. That brief also carries the JIT design-system
requirement and the order in which `/ground` runs.


These are **this brief's** kickoff questions, not blockers on the `science-scout`
work — that is tooling, and this brief is a consumer of it.

- **Resolved 2026-08-29 (018 canvas, fused boards `Home` / `HomeHeld`): the
  systemic number GATES the instruction — and only the instruction.** One
  verdict, never two signals the reader must combine: on a bad day the headline
  flips to "Hold", the readiness card takes the emphasis, and a banner names
  the cause. Three limits define the gate:
  1. **It never touches the facts.** The map, the ranked callouts and every
     number render identically on a Hold day. (The "grey everything out"
     phrasing in the old question died in review — it read as broken, not as
     not-recovered.)
  2. **It is advisory, not enforcing.** Capture is never blocked or hidden;
     training and logging on a Hold day work exactly as on a Push day. Peter,
     2026-08-29: it shows a recommendation, but the user decides how they
     actually feel.
  3. Its push threshold is a PLACEHOLDER until `/ground` runs (018 step 7).
- **Resolved 2026-08-29 (same pick): whole-body qualities get ONE STATE EACH**
  (VO₂max, anaerobic capacity, cardio-endurance — the strip on the fused
  board), not one combined score. The open remainder *inside* this decision:
  **when does a state flip** from fed to missing? Each quality gets its own
  staleness window (days since last effective stimulus — the honest cadence
  differs per quality; for some it may be roughly weekly), and those windows
  are physiological numbers: PLACEHOLDER until the same `/ground` run. Today
  the canvas shows raw facts ("never", "53 d ago") and claims no flip logic.
- **Resolved 2026-08-26 by P5:** systemic chronic load is Garmin's acute load —
  consume `daily_metrics.acute_load` from
  [008-garmin-recovery-load-axis.md](008-garmin-recovery-load-axis.md), do not recompute it
  (that brief also rules it informational context, not a recovery-% input).
  Per-muscle chronic load is a *different scope*, computed from logged sets, and
  stays here. Whether it needs a rolling window at all — and what window — is the
  only science-gated remainder.
