# Releases

The release registry. This file is furniture — no `NNN-` prefix, so `/roadmap`
never treats it as a task. One `##` section per release; **the heading text is
the release name**, spelled exactly as briefs reference it in their
`**Release:**` header line. `**Target:**` is a free-form date; `**Status:**`
is `planned` (default) or `released <date>`. File order is display order on
the board.

## 2.1.0

**Target:** TBC
**Status:** planned

The first release after 2.0.0. Scope is being planned (kicked off 2026-09-05,
the day 2.0.0 shipped). Two briefs carried over from 2.0.0 because they had no
code when it went out: [012](012-adaptation-target-shapes.md) (target shapes)
and [024](024-staging-shared-database-safety.md) (the migration policy and the
cleanup ritual). Since 2.0.0 the minor digit is Peter's call: everything lands
on `develop` as patches, and 2.1.0 is named when he releases it.

## 2.0.0

**Target:** TBC
**Status:** released 2026-09-05

Released 2026-09-05: `develop` fast-forwarded onto `master`, tag `v2.0.0`.
Its objective was **one app, one language**: the unified SIGNAL feel
everywhere (defined 2026-09-01). Two halves:

- **The model** — the simplified seven-adaptation model (019), its follow-on
  target shapes (012), and the doctrine-ledger close-out (014).
- **The restyle** — Home already wears the SIGNAL language (018); every other
  surface still wears the v1 slate/indigo look. The restyle train is 037
  (row origin tagging, so restyle testing writes identifiable rows) → 026
  (chrome + shared primitives) → 027–032 (one sweep per page) → 033 (delete
  the old language and prove the walk). 024 carries the rest of the shared-
  database guardrails and rides the same release. **Amended 2026-09-02:** 031
  is no longer a sweep — the Adaptations tab is a read whose composition, not
  its paint, is the problem, so it became a rebuild gated on 039 (grounding
  the numbers that read shows). The tail of the train is now 039 → 031 → 033.

**At release:** the model half and the restyle train shipped in full (014,
019, 026–033, 037, 039, 042, 043). 012 and 024 did not and moved to 2.1.0.

Releasing it unblocked the schema drops queued in
[025-release-blocked-schema-drops.md](025-release-blocked-schema-drops.md) —
that brief runs *after* this shipped, so it was deliberately not tagged 2.0.0.
