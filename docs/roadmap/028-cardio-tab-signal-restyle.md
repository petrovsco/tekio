# Roadmap: Cardio tab — SIGNAL restyle

**Label:** feature
**Status:** planned — kickoff-ready now 026 has landed; follow the pattern 027 sets on Weights.
**Depends:** 026
**Release:** 2.0.0

Cardio carries the Sports fold (roadmap 014), so this one page holds two
capture modes and three read cards — all in the old language.

## What is old (2026-09-01 survey)

- **LOG SESSION card** — Cardio/Sport switch as indigo pills with ❤️ and ⚽
  emoji, old inputs, indigo "Add Session" solid; the Sport mode's extra
  fields (quality stars, competitor, result).
- **PROGRESS card** — per-type filter chips with emoji (🏃 🚴 🏊 🚣), indigo
  "All" solid, indigo Recharts line on dashed grid.
- **SESSIONS-PER-WEEK card** — sport dropdown + indigo Recharts bars.
- **SESSIONS list** — emoji per type, indigo "Garmin" badge, amber star
  ratings, green "Win" chip, edit/delete icon buttons, "Show N more".

## Scope

Re-skin all of the above per the design system and 026's §Charts spec. The
mode switch and filter chips follow §8; type markers become stroke icons or
plain labels (emoji are chrome here, not data). Star ratings and Win/Loss
need a SIGNAL expression — colour carries meaning (§1), so amber stars and
green chips can't survive as-is; ink-weight or count can carry the same fact.

Whether the per-type Progress filter and the per-sport Sessions-per-week
chart earn their screen at all is a product question — parked in
[034](034-v2-1-candidates-tbc.md). This brief re-skins what is there.

## Out of scope

- The Sports → Cardio **DB merge** (its own future brief, per the ledger).
- Classification changes (HR zones are [005](005-hr-zone-intensity-classification.md)).

## Doctrine check (§4)

Existing Core capture surface; presentation only; no new number, no
grounding, R1 untouched.

## Acceptance

- [ ] No old-token classes remain in the cardio components.
- [ ] Both capture modes (Cardio and Sport, with conditional fields)
      browser-verified with screenshots; console clean.
- [ ] Charts follow the §Charts spec; no emoji in chrome on this page.
- [ ] Ratings/results read correctly without amber/green (colour rule §1).
