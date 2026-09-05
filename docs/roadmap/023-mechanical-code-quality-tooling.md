# Roadmap: Mechanical code quality — ESLint, dead-code detection, perf budget

**Label:** infra
**Status:** planned — kickoff-ready. Nothing built. Spun out of
[009-feature-grounding.md](done/009-feature-grounding.md) on 2026-08-30 so that brief
holds only the grounding back-fill it still tracks. Committed to 2.1.0 by Peter
on 2026-09-05 with the chart-bundle code split (Scope item 0) as its first,
measurable unit.
**Release:** 2.1.0
**Origin:** pushbacks #3 and #4 and deliverables 5 and 6 of
[009-feature-grounding.md](done/009-feature-grounding.md), agreed 2026-08-26 and never
started. The arguments below are carried in full — this brief is kickoff-ready on
its own and you do not need to read 009 first.

## Why this is its own brief

009 mixed two tracks. One is a **pre-build gate about truth** — is this number
real? — and it shipped: the doctrine, the `science-scout` subagent, the `/ground`
skill and the 75-number inventory are all live. The other is a **post-build track
about code**, which is not about truth at all, needs none of that machinery, and
has sat untouched for weeks inside a brief whose title says "grounding".

Keeping them together made 009 permanently unfinishable and made this work
invisible. Split, each one can close.

## Which read does this sharpen?

None — this is tooling, not a surface. Doctrine §4.5 does not apply: no number
claiming physiological meaning is written, so no `## Grounding` block is required.

## The two arguments, restated

**Judging code with an agent is the weakest link; measuring it is not.** An LLM
asked "is this slow?" produces plausible noise. Tekiō's real performance risks are
specific and measurable: `bootstrap()` loads every domain at startup, one Zustand
store holds all data, and Recharts is heavy. The instrument is a number, not an
opinion — an agent may *interpret* the number, it must not guess it.

**Most of the maintainability reviewer already exists.** `/simplify` and
`/code-review` are live; a third overlapping agent would just yield three
inconsistent opinions. The genuine gap is mechanical, and mechanical gaps want
mechanical tools: there is **no ESLint** and **no dead-code detection** in this
repo, while [src/components/ui/EditModal.tsx](../../src/components/ui/EditModal.tsx)
and [src/components/tabs/ProgramTab.tsx](../../src/components/tabs/ProgramTab.tsx)
are both over 800 lines. Mechanize first, judge second.

## Scope

0. **Code-split the chart bundle — the first unit, and the perf budget's first
   number.** Added 2026-09-05: the 2.0.0 build warns on every run — the main
   chunk is 543 kB and the Recharts chunk 387 kB (minified), both loaded on
   first paint whether or not a chart is on screen. Doctrine P1's performance
   face says what isn't needed now isn't loaded now. Lazy-load the
   chart-bearing components (`React.lazy` around the Recharts users, one
   suspense fallback in the SIGNAL skeleton style) so Home and the capture
   tabs open without the chart chunk. Record the before/after sizes here;
   they become the baseline item 4 measures against. Verify in the browser
   that Weights, Cardio and Mobility charts still render after the split.
1. **ESLint.** Flat config, TypeScript + React rules, wired into `npm run lint`
   and into `npm run build` only if it does not slow the build meaningfully.
   Start permissive: the goal is a baseline that passes, not a week of cleanup.
2. **Dead-code detection.** `knip` (unused files, exports, dependencies). Its
   first run on a repo this age will find real things; triage them, do not
   auto-delete.
3. **A tekiō conventions file** for `/code-review` to read, so its judgement is
   project-specific rather than generic React advice. Short — the house rules and
   the doctrine already carry most of it; this file is only what a reviewer needs
   that is not already written down.
4. **`scripts/perf-budget.mjs`.** Fails on a bundle-size delta against a
   committed baseline. Plus a Playwright startup / interaction timing run — the
   Playwright MCP is already wired for this repo.

## Out of scope

- Actually splitting `EditModal.tsx` and `ProgramTab.tsx`. The tools are what
  this brief delivers; acting on their output is separate work, and doing both
  at once means never being able to tell which change caused what.
- A performance *reviewer agent*. See the first argument above — that is the
  thing this brief exists to replace.
- Anything in the grounding track. Those runs stay in
  [009-feature-grounding.md](done/009-feature-grounding.md).

## Acceptance

- [ ] The chart chunk no longer loads on first paint; the build's 500 kB
      warning is gone, and the before/after sizes are written into this brief.
- [ ] `npm run lint` exists, passes on a clean tree, and fails on a deliberate
      violation.
- [ ] `npx knip` runs and its findings are triaged in a list — kept, deleted, or
      deliberately ignored with a reason.
- [ ] A conventions file exists and `/code-review` is pointed at it.
- [ ] `npm run perf` reports bundle size against a committed baseline and exits
      non-zero when the budget is exceeded.
- [ ] The startup timing run produces a number, and that number is written down
      somewhere durable so the next run has something to compare against.
