# Roadmap: Mobility tab — SIGNAL restyle

**Label:** feature
**Status:** planned — kickoff-ready now 026 has landed; the smallest page sweep, follows 027's pattern.
**Depends:** 026
**Release:** 2.0.0

## What is old (2026-09-01 survey)

- **LOG SESSION card** — old inputs, indigo "Log Session" solid, outline
  "+ Add Exercise", indigo "Muscles ▾" tag toggle with 🏷 emoji.
- **PROGRESS card** — exercise dropdown, indigo Recharts line on dashed grid.
- **HISTORY list** — old list rows, edit/delete icon buttons.

## Scope

Re-skin per the design system and 026's §Charts spec: SIGNAL tokens and
type, §8 chip/button tones, stroke icons, uppercase tracked labels. The
multi-exercise capture flow (add rows, per-exercise muscles) stays exactly
as it is.

## Doctrine check (§4)

Existing Core capture surface (recovery-axis input); presentation only; no
new number, no grounding, R1 untouched.

## Acceptance

- [ ] No old-token classes remain in `MobilityTab`.
- [ ] Log → history → edit path browser-verified with a screenshot; console
      clean.
- [ ] Chart follows the §Charts spec; no emoji in chrome on this page.
