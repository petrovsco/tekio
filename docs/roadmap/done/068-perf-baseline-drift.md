# Roadmap: The first-paint baseline is 3 kB stale

**Label:** infra
**Status:** done — folded into v2.0.82 ([048](048-simplification-candidates.md)
candidate A9), the next commit that moved the number, exactly as this brief
asked, which took the baseline 352.47 kB → 348.69 kB. A7 moved it again the
same day; the committed figure is 346.98 kB (v2.0.83).

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

- [x] `scripts/perf-baseline.json` matches a measured build, re-baselined in a
      commit that also changed the number (or in the 2.1.0 pre-flight) —
      2026-09-08, v2.0.82. 352.47 kB → **348.69 kB**. A9 deleted two loaders and
      their bodies, which took the build from 349.32 kB to 348.69 kB; the other
      3.2 kB is the drift this brief was filed for
- [x] That commit's message says the baseline had drifted and where the drop
      came from — names v2.0.78 (048 B7 + B8)
- [x] `npm run perf` no longer prints "Under baseline. Consider re-baselining" —
      it reads `now 348.69 kB +0.00 kB (+0.0 %) · Within budget`

The `startup` half moved in the same commit and for the same reason: A9 made the
program read twice as fast, so the Home read went **1490 ms → 1039 ms** (median
of three). This brief called that figure out of scope because nothing on the
roadmap was going to move it; A9 did, so the commit that moved it records it,
per CLAUDE.md's rule about re-baselining beside the change.
