# Roadmap: Mobility tab — SIGNAL restyle

**Label:** feature
**Status:** done — form, stretch-volume card, chart and history are SIGNAL; landed 2026-09-01 in v1.8.0.
**Depends:** 026
**Release:** 2.0.0

## What is old (2026-09-01 survey)

- **LOG SESSION card** — old inputs, indigo "Log Session" solid, outline
  "+ Add Exercise", indigo "Muscles ▾" tag toggle with 🏷 emoji.
- **PROGRESS card** — exercise dropdown, indigo Recharts line on dashed grid.
- **HISTORY list** — old list rows, edit/delete icon buttons.
- **THIS WEEK'S STRETCH VOLUME card** — the survey missed it: ✅ prefixes,
  green `success` text and a green-or-indigo progress bar per muscle group.

## Scope

Re-skin per the design system and 026's §Charts spec: SIGNAL tokens and
type, §8 chip/button tones, stroke icons, uppercase tracked labels. The
multi-exercise capture flow (add rows, per-exercise muscles) stays exactly
as it is.

## Doctrine check (§4)

Existing Core capture surface (recovery-axis input); presentation only; no
new number, no grounding, R1 untouched.

## Acceptance

- [x] No old-token classes remain in `MobilityTab`.
- [x] Log → history → edit path browser-verified with a screenshot; console
      clean apart from the browser's automatic `/favicon.ico` 404, which
      predates this work ([038](../038-favicon-and-app-icon.md)). The test
      session was logged against an existing exercise name with no muscle
      tags — so no `exercises` row and no canonical muscle link was written —
      then deleted. Nothing was left in the shared database.
- [x] Chart follows the §Charts spec; no emoji in chrome on this page.

## What this decided

- **A met target is a check, not a colour.** The stretch-volume rows ranked
  themselves in green (`success`) against indigo, a second palette §1 does not
  allow. The bar is the stimulus ramp instead (§4): the ramp's mid step while
  there is still a gap, ink once the target is met — dark = trained, which is
  the polarity the body map already uses. The ✅ became the stroke `check`
  icon and the minutes stay one ink weight, because the row's own numbers
  already say how far off it is.
- **The muscle-tag toggle is a reveal, not an action.** Opening the panel
  writes nothing, so it takes the quiet ghost tone rather than the accent it
  used to spend, and the 🏷 emoji became the chevron every other reveal on
  the page uses (§7).
- **The repeating exercise rows got one header, not one label each.** §8 wants
  a 9px tracked label above every field, but this form repeats up to eight
  times — so it borrows `SetsGrid`'s shape: `EXERCISE · MIN · NOTES` once,
  above the rows.
- **The page gutter stayed at 16px.** §6 says 8–12px between cards, and all
  three swept pages use 16px. Tightening only Mobility would make it the odd
  page out; the gap is a cross-page decision, not this brief's.
