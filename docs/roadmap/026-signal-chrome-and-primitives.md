# Roadmap: SIGNAL chrome — tokens, shell, and shared primitives

**Label:** feature
**Status:** planned — kickoff-ready. The foundation of the 2.0.0 restyle: every per-page brief (027–032) builds on this one.
**Release:** 2.0.0
**Origin:** 2026-09-01 screen survey. Home wears the SIGNAL language
([design-system.md](../design-system.md), from roadmap
[018](done/018-home-design-canvas.md)); every other surface — and the chrome
*around* Home — still wears the v1 slate/indigo language.

## The gap

The two languages already coexist in
[src/index.css](../../src/index.css): the SIGNAL tokens (`paper`, `ink`,
`signal`, `line`, `hairline`, `chrome`) sit next to the old set (`bg`,
`surface`, `primary`, `accent` #6366f1, `muted`, `success/warning/danger`,
`ss`, `dl-*`) with a comment saying the old ones stay "until the old tabs are
restyled or retired". This brief restyles everything **shared**; the pages
follow in 027–032; the old tokens die in 033.

What is old today, even on Home:

- **BottomNav** — emoji icons (🏠 🏋️ ❤️ 📋 ☰), indigo active state. Visible on
  every screen including Home.
- **AssistantFab** — purple circle with a 🤖 emoji, floating over content on
  every tab.
- **AppShell header** (non-Home tabs) — old surface/border tokens, emoji-style
  profile glyph, and an amber deload state (`dl-*`) with no SIGNAL equivalent.
- **Drawer** — 💪 logo tile, "Fitness Tracker" tagline, emoji nav icons,
  indigo active row, rounded-xl geometry.
- **Toast**, **HomeSkeleton** (slate shimmer), **Modal**.
- **Shared primitives** ([src/components/ui/](../../src/components/ui/)):
  `Card`, `Button` (`Btn`/`DelBtn`/`EditBtn`), `Input`/`Inp`, `Chip`,
  `SmartInput`, `HistoryList`, `SetsGrid`, `MiniChart` — all on old tokens,
  rounded-lg/xl radii, indigo solids.
- **EditModal** (862 lines, every entry type's edit form) — old inputs and
  buttons throughout.
- **Charts** — Recharts defaults: indigo lines, dashed grids, indigo bars.
  The design system has no chart section yet, so there is nothing to conform
  to; that spec gets written here.

## Scope

1. **Icon set.** Stroke SVGs on a 24 viewBox, 1.8 stroke, round caps
   (design-system §7). Replace every emoji in chrome: bottom nav, drawer,
   header, FAB. Emoji inside *data* (exercise names, notes) are content, not
   chrome — untouched.
2. **Shell chrome.** BottomNav, Drawer, AppShell header, AssistantFab, Toast,
   HomeSkeleton restyled to SIGNAL (§§1–8): paper ground, ink text scale,
   3px radii, 1px `line` borders, uppercase tracked labels, `signal` as the
   only accent. Decide the deload header treatment (the amber `dl-*` state
   needs a SIGNAL expression — likely ink + an uppercase label, since colour
   carries meaning and amber has none in §1).
3. **Shared primitives.** The `src/components/ui/` set restyled so a page
   built only from primitives is already SIGNAL. Chips follow §8 (outline =
   immediate action, solid ink = commit).
4. **EditModal.** Sheet geometry per §2 (2px ink border, 6px radius, scrim),
   inputs and confirm controls per §8, for every entry type in the
   `EditModalTarget` union.
5. **Chart treatment, written down.** One spec: ink line on hairline grid,
   `signal` reserved for the emphasised thing (e.g. deload dots), monochrome
   bars, 11–12px axis type. Lands as a new §Charts in
   [design-system.md](../design-system.md) — the doc change rides this brief,
   which is the sanctioned way a reference doc changes. `MiniChart` is the
   first conformer; the page briefs apply it to the Recharts surfaces.

## Out of scope

- Page-level sweeps — one brief per page, 027–032.
- Deleting the old tokens — [033](033-retire-old-design-language.md), once
  nothing consumes them.
- Any IA change: no tab moves, no read changes, no capture-flow redesigns.
  This is a re-skin. (Product questions found during the survey are parked in
  [034](034-v2-1-candidates-tbc.md).)

## Doctrine check (§4)

1. **Which read does this sharpen?** All existing ones — one visual language
   means the SIGNAL conventions (colour = meaning, §1) hold everywhere, so
   what was learned on Home transfers. No new surface; R1 untouched.
2. **Stop doing:** maintaining two design languages and two icon systems.
3. **Input or destination?** Neither — presentation only.
4. **Honest shape:** unchanged; nothing about the data moves.
5. **Physiological number?** No. No `## Grounding` needed.

## Acceptance

- [ ] Bottom nav, drawer, header, FAB, toast and skeleton are SIGNAL; no emoji
      remains in chrome anywhere in the app.
- [ ] Home renders with **zero** old-language pixels (nav + FAB were the last
      two).
- [ ] Every `src/components/ui/` primitive uses only SIGNAL tokens — no
      `accent`/`primary`/`muted`/`bg`/`surface` classes left in them.
- [ ] EditModal verified in the browser for at least one entry of each type.
- [ ] design-system.md has a §Charts section and MiniChart follows it.
- [ ] The deload header state has a deliberate SIGNAL treatment, recorded in
      design-system.md.
