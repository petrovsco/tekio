# Roadmap: Home as fused stimulus × recovery reads

**Status:** proposed (2026-08-26) — model sketched in conversation, **not yet
agreed**. Do not build from this until the two-level model in §2 is confirmed.
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

## 2. Proposed model (needs confirmation)

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
sleep-dependent, so skill leans hardest on the systemic side.

## 3. What Home becomes

Per the doctrine's purpose ("tell me what's missing") and P2 (honest reads):

- **A body map** — spatial, coloured by the fused *state* above, not by set count.
- **A non-spatial read** for whole-body qualities (speed, power, VO₂max,
  anaerobic, cardio-endurance, skill) that a silhouette cannot honestly carry.
- **One systemic readiness element** — small, global, gating both.
- **Tap to drill** — detail and capture appear at the point of need (P1). This is
  the just-in-time layer; nothing else is loaded until asked for.

Existing parts to reuse: `BodyMap.tsx`, `MuscleCoverageCard.tsx`,
`MuscleStatusList.tsx`, `AdaptationCard.tsx`, `RecoveryCard.tsx`.

## 4. Blocked on grounding

The local level needs recovery-window numbers (how long until a muscle is
"recovered" — commonly cited as 48–72 h, varying by muscle size, training age and
session volume). That is exactly a §4.5 number claiming physiological meaning, so
it **requires `## Grounding` before implementation** — which means this brief is
blocked on pushback #2 in
[feature-grounding.md](feature-grounding.md) (the `science-scout` subagent).

Good sign, not a problem: the gate caught its first real case unprompted.

## 5. Sequencing note (read before shelving Habits)

Shelving Habits requires dropping `RECOVERY_WEIGHTS.habits` and reweighting the
remaining four. **Do not do that surgery before this model is decided** — if the
recovery read is about to be rebuilt as systemic-plus-local, a rebalance of the
current weekly-rollup weights is work that gets thrown away. Order:

1. Shelf the Habits *tab* (config-level, reversible, no numbers touched).
2. Decide this model.
3. Do the weight surgery once, in whatever shape survives.

## 6. Open questions

- Does the systemic number gate the local read (grey out everything on a bad
  recovery day), or sit alongside it as a separate signal?
- Whole-body qualities: one combined read, or does each get its own state?
- Does "chronically hammered" need a rolling window (ACWR-style), and if so does
  that overlap with the Garmin acute-load work in
  [garmin-recovery-load-axis.md](garmin-recovery-load-axis.md)?
