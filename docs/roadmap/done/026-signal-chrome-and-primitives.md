# Roadmap: SIGNAL chrome — tokens, shell, and shared primitives

**Label:** feature
**Status:** done — icon set, shell chrome, every `ui/` primitive, EditModal and the §Charts spec all landed 2026-09-01 in v1.5.0.
**Depends:** 037
**Release:** 2.0.0

Why it waits on 037: the acceptance below logs a test entry of every type
against the shared production database — including from localhost — so
[037](037-row-origin-tagging.md) makes those rows identifiable first. (037 was
024's Part 1 until 2026-09-01; the rest of 024 does not block this brief.)
**Origin:** 2026-09-01 screen survey. Home wears the SIGNAL language
([design-system.md](../../design-system.md), from roadmap
[018](018-home-design-canvas.md)); every other surface — and the chrome
*around* Home — still wears the v1 slate/indigo language.

## The gap

The two languages already coexist in
[src/index.css](../../../src/index.css): the SIGNAL tokens (`paper`, `ink`,
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
- **Shared primitives** ([src/components/ui/](../../../src/components/ui/)):
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
   [design-system.md](../../design-system.md) — the doc change rides this brief,
   which is the sanctioned way a reference doc changes. `MiniChart` is the
   first conformer; the page briefs apply it to the Recharts surfaces.

## Out of scope

- Page-level sweeps — one brief per page, 027–032.
- Deleting the old tokens — [033](../033-retire-old-design-language.md), once
  nothing consumes them.
- Any IA change: no tab moves, no read changes, no capture-flow redesigns.
  This is a re-skin. (Product questions found during the survey are parked in
  [034](../034-v2-1-candidates-tbc.md).)

## Doctrine check (§4)

1. **Which read does this sharpen?** All existing ones — one visual language
   means the SIGNAL conventions (colour = meaning, §1) hold everywhere, so
   what was learned on Home transfers. No new surface; R1 untouched.
2. **Stop doing:** maintaining two design languages and two icon systems.
3. **Input or destination?** Neither — presentation only.
4. **Honest shape:** unchanged; nothing about the data moves.
5. **Physiological number?** No. No `## Grounding` needed.

## Acceptance

- [x] Bottom nav, drawer, header, FAB, toast and skeleton are SIGNAL; no emoji
      remains in chrome anywhere in the app. The 73 toast strings lost their
      leading ✅ / ❌ / 🗑 too — a toast is chrome, and without a colour channel
      (§1) the words have to carry the outcome, which they already did.
- [x] Home renders with **zero** old-language pixels (nav + FAB were the last
      two).
- [x] Every `src/components/ui/` primitive uses only SIGNAL tokens — no
      `accent`/`primary`/`muted`/`bg`/`surface` classes left in them.
- [x] EditModal verified in the browser for all twelve `EditModalTarget`
      variants, not just one each: a throwaway harness mounted the real
      component against a synthetic record per variant, so nothing was written
      to the shared database to see them.
- [x] design-system.md has a §Charts section and MiniChart follows it.
- [x] The deload header state has a deliberate SIGNAL treatment, recorded in
      design-system.md.

## What this decided

Three questions the brief left open, answered in `design-system.md` so the
page sweeps do not each re-answer them:

- **Deload takes no colour.** It is a fact about the cycle, not an urgency, so
  the header stays paper and the state is stated — an outlined `DELOAD · WK 6`
  micro label. The amber `dl-*` tokens now have no consumer.
- **Destructive controls take no colour either.** What makes a delete safe is
  the confirmation step, not a red button, so a destructive commit is an
  outline with a **2px** ink border (§6's emphasis weight) and the Yes/No pair
  uses the chip tones.
- **A 1–5 rating is squares, not stars.** Filled ink versus an outlined tile,
  the same polarity as the whole-body quality tiles (§4) — a star needs a
  colour to read as "filled", and there is none to spend.

## Handed on

- **Page-body emoji** (ProgramTab's `✏️ Edit`, the `🏆 PR` marker, section-card
  icons) stayed put: they are page content, and each page brief 027–032 owns
  its own sweep. Only chrome and shared primitives were in scope here.
- **ExportPane / ImportPane** live in `src/components/layout/` but are Profile
  surfaces, so they went to [032](../032-profile-admin-signal-restyle.md) rather
  than being re-skinned as shell chrome.
- **`src/components/ui/chart.ts`** is the shared palette the page briefs apply
  to their Recharts surfaces — `CHART`, `CHART_LINE`, `CHART_AXIS`,
  `CHART_TOOLTIP`.
