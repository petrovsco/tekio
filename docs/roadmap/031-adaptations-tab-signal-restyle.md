# Roadmap: Adaptations tab — SIGNAL restyle

**Label:** feature
**Status:** planned — waits on 019 (the rows it would restyle are about to change) and 026 (tokens, chart spec).
**Depends:** 019, 026
**Release:** 2.0.0

Deliberately sequenced *after* the nine→seven simplification: restyling nine
rows and then deleting two of them is throwaway work. 019 reshapes the model;
this brief reshapes the paint.

## What is old (2026-09-01 survey)

- **Hero card** — dark navy block with the `/9` counter (becomes `/7` in
  019), lifting sets and cardio session tallies.
- **Adaptation rows** — coloured left edges (a different hue per
  adaptation), emoji icons (🎯 ⚡ 💥 🏋️ 💪 🔄 🔥 🫀 🏃), coloured info
  buttons, per-row targets.
- **MUSCLE COVERAGE card** — bars in old tokens, ⚠ emoji for missing groups.
- **HOW TO TRAIN EACH ADAPTATION** — 📖 emoji heading, old disclosure.

## Scope

Re-skin to the design system, and align with Home: this tab is the drill-down
of the read Home already carries, so the muscle-linked four should echo the
body-map conventions (ink ramp = stimulus) and the whole-body three should
echo Home's whole-body strip (§4 — one square per quality, accent edge =
untouched). Per-adaptation rainbow hues violate §1 (colour = one meaning) and
go; emoji icons become stroke icons or plain labels.

## Out of scope

- The model change itself — that is [019](019-adaptation-model-simplification.md),
  which lands first.
- Target values or shapes ([012](012-adaptation-target-shapes.md)); if 012
  lands first, the units shown here follow it, but neither blocks the other's
  kickoff — coordinate at kickoff if both are in flight.

## Doctrine check (§4)

Existing Core read; presentation only. Sharpened: the same visual grammar as
Home means the drill-down confirms the five-second answer instead of
restating it in a second dialect. No new number, no grounding, R1 untouched.

## Acceptance

- [ ] No old-token classes, coloured edges, or emoji remain in
      `AdaptationsTab` / `AdaptationGuide`.
- [ ] Muscle-linked rows and whole-body tiles visibly rhyme with Home's body
      map and strip.
- [ ] Browser-verified with a screenshot next to Home for comparison;
      console clean.
