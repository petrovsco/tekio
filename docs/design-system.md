# Tekiō design system

The visual language of the app. Reference-only: this doc states what *is*;
changes to it go through a roadmap brief, never through edits with "proposed"
in them.

Distilled 2026-08-30 from the picked build-spec boards (page-3 "Refined",
language **SIGNAL**, picked 2026-08-30) on the Tekio Home design canvas —
[roadmap 018](roadmap/018-home-design-canvas.md), canvas:
<https://claude.ai/code/artifact/a1534123-0c92-49dc-8fa1-3879279d16ee>.
The boards are the picture; this doc is the rulebook. When they disagree,
fix one of them deliberately.

## 1. What colour means

The app is monochrome paper with **one accent**. Colour is a channel, and
every channel carries exactly one meaning:

- **Accent `#c2410c`** = *action lives here / urgency*. It appears on: the
  verdict, the callout markers and major callout labels on the body map,
  the edge of an untouched whole-body quality, and a stale-capture note.
  On a Hold day the verdict keeps the accent — it signals urgency, not
  mood. That is deliberate.
- **Ink on the body map** = *stimulus, and nothing else*. A four-step grey
  ramp fills the muscles; ink accumulates like work. Dark = trained,
  pale = the gap.
- **The hatch** = *recovery*. A white 45° line pattern (4×4 tile, 1.6px
  line) overlays a muscle that is still recovering. Recovery never
  borrows the fill channel.
- **Systemic readiness never colours the map** (doctrine P5). It lives in
  its own card; on a held day that whole card inverts to ink (§2).

Nothing else may carry colour. A new meaning does not get a new colour —
it takes one away from something first.

## 2. Ground and surfaces

| Token | Value |
|---|---|
| Page background | `#faf9f7` |
| Card | `#ffffff`, 1px `#e2e2e0` border, 3px radius |
| Hairline inside a card | `#eeeeec` |
| Chrome hairline (nav border) | `#d6d6d4` |
| Sheet / modal | `#ffffff`, 2px `#1a1a1a` border, 6px radius |
| Scrim under a sheet | `rgba(26,26,26,0.34)` |
| Page gutter | 16px; card padding 7–10px |

**Inversion (gated state).** When readiness gates the day, the systemic
card flips: background `#1a1a1a`, text `#ffffff`, dividers and bar tracks
`#4a4a4a`, muted text `#a8a8a8`. The gate changes the instruction, never
the facts — everything else on screen keeps its normal state.

## 3. Ink (text colours)

Primary `#1a1a1a` · secondary `#6b6b6b` · labels `#8a8a8a` ·
asides/disabled `#a8a8a8`. That is the whole set.

## 4. The stimulus ramp

Muscle fill by share of the cycle target:
`#ececea` (under 10%) → `#c9c9c7` (10–35%) → `#8f8f8f` (35–70%) →
`#1f1f1f` (70% and up). With no data at all, everything sits at `#eeeeec`.

Body outline `#c9c9c7` at 1px; muscle shapes separate with a 0.7px white
stroke. A whole-body quality is one square: untouched = white fill with an
accent edge; no data = white fill with a `#e2e2e0` edge; trained = ink,
same polarity as the map.

## 5. Type

Two faces:

- **Sans** — `ui-sans-serif, system-ui, -apple-system, "Segoe UI",
  sans-serif` — everything.
- **Serif** — `ui-serif, Georgia, 'Times New Roman', serif` — the verdict
  **only**: 28px / 1.12 / 700 / −0.01em, in the accent. The serif is the
  voice of the answer; it appears nowhere else.

Scale (px):

| Size | Use |
|---|---|
| 28 | the verdict (serif) |
| 17–19 | big numerals, sheet titles — 700, tight (−0.01 to −0.02em) |
| 15 | the TEKIŌ wordmark — 700, 0.14em |
| 13 | fold-stat values — 700 |
| 12 | body and sub text — 1.4 line-height |
| 11 | chips (600), inline meta |
| 9–10 | section labels — 700, UPPERCASE, 0.10–0.16em, `#8a8a8a`; notes — regular |
| 7–8 | tier chips, micro labels — 0.06–0.08em |

Uppercase labels are always tracked (≥0.05em). Negative tracking only on
numerals and titles of 15px and up.

## 6. Spacing, radii, borders

16px page gutter · 8–12px between cards · 6px between chips and tiles ·
radius 3px for cards and chips, 2px for micro elements, 6px for sheets ·
borders 1px, with 2px reserved for the sheet and true emphasis.

## 7. Icons

Stroke SVGs on a 24 viewBox: stroke-width 1.8, round caps and joins, no
fills. 18px in the nav, 13px inline. No icon font, no emoji in app chrome.

## 8. Controls

- **Chips**: 11px / 600, 3px radius, 5px×10px padding, 1px `#1a1a1a`
  border. Two tones with distinct meanings: **outline** (white) = an
  immediate increment that logs on tap (water +250 ml); **solid ink**
  (`#1a1a1a` on white text) = the confirm that commits an entry (log
  weight, record a donation).
- **The stepper**: capture of a continuous daily number (body weight)
  prefills the last logged value and steps by −1 / −0.1 / +0.1 / +1; the
  solid confirm chip shows the exact value it will log. Presets are not
  used for numbers that move daily.
- **Reveals**: capture panels and the muscle drill-in open over a scrim as
  bottom sheets on the device. Capture is *revealed on intent* — the
  control appears when the stat that raised the question is tapped, and
  the T1 read never reflows (P1). (On the design canvas the reveals
  render centred instead, because the viewer's Play toolbar covers the
  bottom of the frame — a canvas workaround, not the spec.)
- Close targets are padded well beyond the glyph.

## 9. Tiers

Every component carries a tier, and the tier decides both faces of P1 —
what is shown now and what is loaded now:

- **T1** — header, verdict, systemic readiness gate, body map with ranked
  callouts, whole-body strip. The whole five-second answer. Renders in
  the initial chunk; no charts live here.
- **T2** — fold stats with inline capture, the muscle drill-in. One tap
  away; loaded on intent.
- **T3** — everything behind the nav.

The rule: if the five-second answer needs it, it is T1. If it answers a
question a tap just asked, it is T2. Everything else is T3.

## 10. Placeholder numbers

Every number that claims physiological meaning and has not passed
`/ground` is marked PLACEHOLDER on the boards and in code comments —
currently the cycle target (60 sets), the recovery window (2 days), the
push threshold, the per-quality staleness windows, and the blood-donation
windows. The rule is: the mark stays visible until the number is
grounded. The grounding work itself is tracked in the roadmap (018), not
here.
