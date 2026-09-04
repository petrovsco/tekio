# Roadmap: Retire the v1 design language

**Label:** infra
**Status:** in progress — unit 1 landed 2026-09-04 (v1.17.2): the token block, its palette mirror (`constants/colors.ts`), the chrome emoji and two dead animations are gone; bundle 551 kB against the 554 kB baseline. Left: the conformance walk (scope 3) with screenshots, then close.
**Depends:** 027, 028, 029, 030, 031, 032
**Release:** 2.0.0

[026](done/026-signal-chrome-and-primitives.md) promised the old tokens die when
their last consumer goes. This brief is that death, plus the proof that the
release actually achieved "one visual language everywhere" — without it the
old language lingers as dead weight and every future component has two
palettes to accidentally pick from.

## Scope

1. **Delete the old tokens** from [src/index.css](../../src/index.css):
   `bg`, `surface`, `primary`, `accent`, `accent-l`, `muted`, `border`,
   `success`, `warning`, `danger`, `ss`, `ss-l`, `ss-b`, and the `dl-*`
   trio (superseded by 026's deload treatment). The build breaking on a
   missed consumer is the point — fix the consumer, not the token.
2. **Emoji audit.** `grep` the `src/` tree for emoji; anything in chrome is
   a miss from 026–032. Emoji inside user data or seed content stays.
3. **Conformance walk.** Every screen and sheet against
   [design-system.md](../design-system.md), on the device viewport, with
   screenshots — the same survey that opened the restyle
   (2026-09-01) re-run to show it closed.
4. **Bundle check.** T1 was 554 kB after 018 unit 5. The restyle train must
   not have regressed it; record the number.
5. Prune now-unused animation/utility CSS and any orphaned old-language
   assets the sweep exposes.

## Doctrine check (§4)

Tooling/cleanup; no surface, no number, no grounding.

## Findings — 2026-09-04, unit 1

- The build is not the guard. Tailwind v4 generates nothing for an unknown
  utility and does not fail, so a missed `bg-bg` would have shipped as an
  unstyled element. The grep is the real check; it found 25 consumers
  (23 in `HabitsTab`, one each in `HabitForm` and `EditModal`), all
  remapped, and now returns nothing including the tests.
- Two orphans the sweep exposed and removed: `src/constants/colors.ts`
  (a JS mirror of the old palette, no importer) and `DONATION_ICONS`
  (two emoji, no consumer). `fade-in-up` and `pop` were unused too.
- Emoji audit: the assistant's action labels (`executor.ts`) were the only
  chrome emoji outside Habits; they read as plain verbs now. The one hit
  left under `src/` is the placeholder of the Habits icon field — user
  data, stays. Habits itself is on the R2 shelf and goes with 035.
- Bundle: index chunk **551.22 kB** (gzip 161.06 kB) vs the 018 unit-5
  baseline of 554 kB.

## Acceptance

- [x] The old token block is gone from `index.css` and the build passes.
- [x] `grep -rn` for the old token class names across `src/` returns nothing.
- [ ] No emoji in chrome anywhere; the walk's screenshots are taken and the
      verdict recorded here.
- [x] T1 bundle size recorded and not worse than the 018 unit-5 baseline.
