# Roadmap: Retire the v1 design language

**Label:** infra
**Status:** blocked — waiting on 030, 031, 032; the closing sweep of the 2.0.0 restyle, and the old tokens still have consumers until those pages land.
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

## Acceptance

- [ ] The old token block is gone from `index.css` and the build passes.
- [ ] `grep -rn` for the old token class names across `src/` returns nothing.
- [ ] No emoji in chrome anywhere; the walk's screenshots are taken and the
      verdict recorded here.
- [ ] T1 bundle size recorded and not worse than the 018 unit-5 baseline.
