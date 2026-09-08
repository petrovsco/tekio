# Roadmap: The first-paint baseline is 3 kB stale

**Label:** infra
**Status:** planned — the committed baseline has been beaten and never updated;
the fix is one `npm run perf:update` folded into the next commit that actually
moves the number, not a commit of its own.

## Goal

`scripts/perf-baseline.json` records **352.47 kB first paint (2026-09-08)**.
The build has measured **349.20–349.32 kB** since v2.0.78, so the record is
about 3.2 kB heavier than reality and `npm run perf` prints *"Under baseline.
Consider re-baselining to lock the win in"* on every run.

That is a small number but a real cost: the budget is baseline + 5 %, so a
stale-high baseline quietly buys 3 kB of headroom nobody voted for, and a
standing "consider re-baselining" line trains the reader to skip the perf
output — which is the one check that catches a
cleanup that quietly grows the bundle — see
[048 A1](048-simplification-candidates.md), where sharing a constant across two
modules cost +0.38 kB and only `npm run perf` said so.

## Why there is no commit to attach it to

CLAUDE.md is deliberate about this: *"re-baseline with `npm run perf:update` in
the same commit as the change that moved the number, and say why."* The commit
that moved this number was **v2.0.78** (048 B7 + B8), which did not re-baseline.
Everything since has been first-paint neutral and measured as such:

- **v2.0.79** (048 B9) — 349.20 kB with the change and without it, measured by
  stashing it. Neutral.
- **v2.0.80** (048 B14) — 349.32 kB. +0.12 kB, noise.

So no later commit owns the drop, and re-baselining in a commit that did not
cause it would put a false attribution in the record.

## Which read does this sharpen?

None — it is the measuring stick, not a read. Doctrine P1's performance face:
the budget only works if the number it compares against is true.

## Change

Fold `npm run perf:update` into the **next commit that genuinely moves first
paint**, and say in that commit's message that the baseline had already drifted
3.2 kB low before the change, naming v2.0.78 as where the drop came from. Do
not spend a commit on the re-baseline alone.

If nothing moves it within the 2.1.0 cycle, re-baseline as part of the release
pre-flight (CLAUDE.md step 1, where `npm run build` runs anyway) and say the
same thing there.

## Out of scope

- Chasing further first-paint reductions. This brief only makes the record
  match what is already being measured.
- Touching `perf:startup`'s 1490 ms Home-read figure, which is wall-clock
  against the live database and is read as a trend, not a digit.

## Acceptance

- [ ] `scripts/perf-baseline.json` matches a measured build, re-baselined in a
      commit that also changed the number (or in the 2.1.0 pre-flight)
- [ ] That commit's message says the baseline had drifted and where the drop
      came from
- [ ] `npm run perf` no longer prints "Under baseline. Consider re-baselining"
