# Roadmap: Cardio tab — SIGNAL restyle

**Label:** feature
**Status:** done — both capture modes, both charts and the merged session list are SIGNAL; landed 2026-09-01 in v1.7.0.
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

- [x] No old-token classes remain in the cardio components.
- [x] Both capture modes (Cardio and Sport, with conditional fields)
      browser-verified with screenshots; console clean.
- [x] Charts follow the §Charts spec; no emoji in chrome on this page.
- [x] Ratings/results read correctly without amber/green (colour rule §1).

## What this decided

- **A win is a word, not a colour.** The green `Win` / red `Loss` chips and the
  green/red/grey record counts were a second palette, which §1 does not allow.
  Both are monochrome now: the result is an outlined micro label reading the
  outcome, and the record columns are ink numerals under their own labels — the
  same answer 027 gave the three-colour volume tiers. Ink weight was available
  and deliberately not spent: `Badges.tsx` reserves the solid tone for a label
  that changes what you do today, and a past result does not.
- **Stars became the squares 026 specified.** Quality capture reuses the
  `Rating` control, and the history row gets a read-only version of the same
  squares at micro size — filled versus outlined, so the polarity matches the
  whole-body quality tiles (§4).
- **The type emoji became one icon per kind of session, not one per type.**
  `CARDIO_ICONS` (🏃 🚴 🏊 🚣) is deleted: the filter chips carry plain type
  names, and a session row carries the shared `cardio` or `sport` stroke icon.
  That is the distinction the merged list actually needs — which of the two
  capture paths wrote the row — while the type name was already in the row.
- **Pace got its own axis.** Re-skinning the second series to the pale ink (§9)
  exposed a scale problem the old green dash had hidden: minutes and min/km
  were plotted on one axis, so pace sat flat on the floor of the chart. One
  frame drawn on the wrong scale is the pretty lie P2 forbids, so pace now has
  a right-hand axis and the card carries a two-line legend.
- **`GARMIN` and `WITH TRAINER` are outline micro labels.** Provenance and a
  session fact, both quiet, both stated rather than coloured.

## Handed on

- **`src/components/ui/Fields.tsx` is new** — `FieldLabel`, `Toggle`, `Rating`
  and `RatingRead` moved out of EditModal, which was the only holder of them.
  029–032 should import these rather than restyling their own toggles; a
  full-width mode switch is `Toggle` with the label omitted.
- **`MicroLabel` joined `ui/Badges.tsx`** for stated row facts, alongside
  `SSBadge` and `DeloadBadge`.
- **The per-type Progress filter and the per-sport Sessions-per-week card were
  re-skinned, not questioned.** Whether either earns its screen stays parked in
  [034](034-v2-1-candidates-tbc.md).
