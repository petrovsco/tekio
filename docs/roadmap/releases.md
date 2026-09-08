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

The first release after 2.0.0, scoped by Peter on 2026-09-05, the day 2.0.0
shipped. Theme: **finish the model, clean the house.** Doctrine §6 says no
new sections until the five-second Home read is proven, so this release
closes what 2.0.0 opened rather than adding surface.

**Nothing goes before it any more.**
[053](done/053-recover-swept-staging-rows.md) — recovering the rows the
withdrawn release sweep deleted on 2026-09-05 — was **discarded** on
2026-09-07: Peter does not remember the sessions, so nothing honest can be
re-entered, and the prevention half had already shipped. It was never a 2.1.0
item.

In running order:

1. [051](done/051-exit-condition-walk.md) — the exit-condition walk. Walked
   2026-09-07: the muscle read and the push-or-rest call passed, the
   adaptation read did not, so doctrine §6 is **not met** and the austerity
   holds — 2.1.0 adds no sections. Its child runs next:
   [062](done/062-home-adaptations-one-screen.md) — whether Home and Adaptations
   should be one screen, now carrying the miss itself (Home names the missing
   muscle-linked quality). That miss was [061](done/061-home-names-missing-muscle-quality.md),
   discarded into 062 on 2026-09-07 (Peter's call) so the read ships as part
   of the redesigned shape rather than as a patch in front of it.
2. [024](024-staging-shared-database-safety.md) — the migration policy
   (Part 2). [025](done/025-release-blocked-schema-drops.md) closed on
   2026-09-05; the release sweep 024 once carried is withdrawn, because
   its one run deleted real data (053).
3. [012](012-adaptation-target-shapes.md) — target shapes, carried over
   from 2.0.0 (no code when it shipped).
4. [046](046-retire-tracked-muscle-groups.md) — retire the tracked-groups
   setting.
5. [041](done/041-garmin-sport-activity-sync.md) — Garmin sync for sport
   activities.
6. [005](done/005-hr-zone-intensity-classification.md) — HR-based intensity
   classification, a grounding candidate (inventory rows 6.1–6.5); after 041
   because the sport sync widens the HR supply it needs. Closed 2026-09-07
   (the classifier and the bout length shipped as patches); its two open
   items are [058](done/058-garmin-data-on-sport-rows.md) — Garmin data on
   sport rows, done 2026-09-07 — and [059](done/059-profile-hrmax-typed-hr-path.md)
   — profile HRmax and the typed-HR path.
7. [044](done/044-exercise-name-aliases.md) — exercise aliases, the first step
   toward other users.
8. [049](049-app-version-display.md), [050](050-release-procedure.md),
   [038](done/038-favicon-and-app-icon.md) — the version on screen, the written
   release ritual, the icon.
9. [023](done/023-mechanical-code-quality-tooling.md) — code quality tooling.
   **Done 2026-09-08** (v2.0.58–v2.0.62): ESLint, knip, a conventions file for
   `/code-review`, and a perf budget with its first committed numbers. Its
   chart-bundle item turned out to be already shipped, so it hunted the real
   first-paint weight instead — 552 kB → 324 kB.
10. [048](048-simplification-candidates.md) and
    [015](done/015-ground-trigger-spec-fixes.md) — spare-time units. 015 closed
    2026-09-08: the eight holes in the grounding gate are shut, except the one
    that cannot be judged without a set of weights to judge it against — that
    became [065](065-rescale-exemption-unchecked-base.md) in 3.0.0.

Left out on purpose: 003, 020 and 022 (stay in backlog — Peter, 2026-09-05),
013 (cycle grounding — a program property, grounded only if it ships as the
default program), 021 (waits on Peter's inputs, no release), 034 (→ 2.2.0),
040 (→ 3.0.0), 052 (shipped as a patch on 2026-09-05: line anchors are
forbidden in briefs).
Since 2.0.0 the minor digit is
Peter's call: everything lands on `develop` as patches, and 2.1.0 is named
when he releases it.

## 2.2.0

**Target:** TBC
**Status:** planned

The product review Peter deferred out of 2.1.0 on 2026-09-05:
[034](034-v2-1-candidates-tbc.md)'s five cut candidates (the in-app
assistant, cardio's secondary reads, the Weights chip cloud, the program
template picker, brief 003's name) need a deeper look before anything is
cut. Keepers become briefs; cuts execute from 034.

## 3.0.0

**Target:** TBC
**Status:** planned

Named by Peter on 2026-09-05 as the home of adaptation goals
([040](040-adaptation-goals.md)). A major bump is his concept-validation
call.

Also tagged: [065](065-rescale-exemption-unchecked-base.md) — whether the
grounding gate should fire when never-checked weights are rescaled. Split out of
[015](done/015-ground-trigger-spec-fixes.md) on 2026-09-08 and postponed here by
Peter, because no set of weights with that shape survives in the app: it belongs
with however recovery gets measured next, which is when a real case returns to
decide it against.

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
[025-release-blocked-schema-drops.md](done/025-release-blocked-schema-drops.md) —
that brief ran *after* this shipped (the same evening), so it was deliberately
not tagged 2.0.0.
