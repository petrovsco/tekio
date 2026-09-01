# Roadmap: Profile & Admin — SIGNAL restyle

**Label:** feature
**Status:** planned — kickoff-ready now 026 has landed. Last of the page sweeps; confirmed in 2.0.0 on 2026-09-01.
**Depends:** 026
**Release:** 2.0.0

The ledger exempts Profile and Admin from R1 (infrastructure, not sections),
but "one visual language everywhere" includes them — they are the only
surfaces left after 027–031.

"Everywhere" is the objective, so these two ship with the rest: 2.0.0 is not
done while a settings screen still wears the old language, and
[033](033-retire-old-design-language.md) cannot delete the old tokens until
they do.

## What is old (2026-09-01 survey)

- **Profile** — Monday/Sunday indigo toggle, adaptation-tracking chips,
  Assistant card (provider select, key management, red "Remove"), Sections
  drag-list with emoji and indigo ON/OFF pills, Export/Import rows with 📤 📥
  emoji. The sheets those rows open —
  [ExportPane.tsx](../../src/components/layout/ExportPane.tsx) and
  [ImportPane.tsx](../../src/components/layout/ImportPane.tsx) — sit in
  `layout/` but are Profile surfaces, so [026](done/026-signal-chrome-and-primitives.md)
  deliberately left them here rather than treating them as shell chrome.
- **Admin** — amber notice banner, WEEKLY TARGETS editor (emoji + a
  coloured input per adaptation — also follows 019's row changes), MUSCLE
  GROUPS nested editor (indigo "Add", red deletes throughout), EXERCISE →
  MUSCLE MAPPING editor.

## Scope

Re-skin both tabs per the design system: SIGNAL tokens and type, §8
controls, stroke icons, no emoji in chrome, colour only where it means
something (§1 — red-everywhere delete buttons become ink with a confirm).
Forms keep their exact behaviour; these are maintenance surfaces and the
re-skin must not make them slower to use.

## Out of scope

- Any settings behaviour change; the drag-reorder logic; the assistant's
  functionality (its product question is parked in
  [034](034-v2-1-candidates-tbc.md)).
- `ExerciseMuscleEditor`'s move from Habits into Admin — that belongs to the
  Habits expiry work ([035](035-habits-expiry-deletion.md)), not the restyle. If it has
  already moved by kickoff, restyle it here like everything else.

## Doctrine check (§4)

Exempt infrastructure surfaces; presentation only; no new number, no
grounding, R1 untouched.

## Acceptance

- [ ] No old-token classes or emoji remain in `ProfileTab`, `AdminTab` and
      their children.
- [ ] Section reorder, a target edit, and a muscle-group edit
      browser-verified; console clean.
- [ ] Export/Import still round-trips.
