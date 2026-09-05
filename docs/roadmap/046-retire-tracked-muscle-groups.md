# Roadmap: Retire the tracked-muscle-groups setting

**Label:** feature
**Status:** planned — 2.0.0 shipped 2026-09-05 and Peter committed the deletion to 2.1.0 the same day ("we can retire it for now"). The *need* behind it is expected back in [040](040-adaptation-goals.md): focus belongs at the adaptation level, and Home and Adaptations must not punish a chosen focus — that is 040's job, not this setting's.
**Release:** 2.1.0

## The problem, in plain words

Profile has a card called "Adaptation tracking". It lets me pick which
top-level muscle groups must reach their target before a lifting quality
counts as "on target" on the Adaptations page. Pick none and every group
counts. The choice is stored per user (`tracked_muscle_group_ids` in
[src/lib/db/user.ts](../../src/lib/db/user.ts#L37)), held in the prefs store
as `trackedMuscleGroupIds`, and read by `adaptationCoverage` through its
`trackedMuscleIds` argument.

Three things are wrong with it.

1. **It is a configuration standing in for a decision (P4).** With one user,
   "you can untrack a group" is not a reason for the setting to exist. Either a
   muscle group belongs in the read or it does not.
2. **The map ignores it.** The gap map and its callouts draw every leaf muscle;
   only the counter honours the tracked subset. Since 045 the counter and the
   callouts read one threshold over the same leaves — this setting is the one
   remaining way to make them disagree again (untrack Legs, and CALVES can be
   the top callout under "4 of 7 on target").
3. **Its copy claims more than it does.** The Profile card says a tracked
   group "must hit its weekly target"; since 045 the bar is 0.70 of the
   14-day target, judged per leaf. Nobody is going to keep that sentence true.

## What to do

Delete it. The honest read is "every muscle the map draws".

- Remove the "Adaptation tracking" card from `ProfileTab.tsx`.
- Drop `trackedMuscleGroupIds` and `setTrackedMuscleGroupIds` from
  `src/store/prefs.ts` and the two DB helpers in `src/lib/db/user.ts`.
- Drop the `trackedMuscleIds` argument from `adaptationCoverage`; the judged
  set becomes every leaf. Update the 045 test that passes `['shoulders']`.
- The `tracked_muscle_group_ids` column stays until the release cleanup —
  a column drop is release-blocked because staging and production share the
  database. [025](done/025-release-blocked-schema-drops.md) closed with the
  2.0.0 drops, so when this brief is picked up, queue the column in a new
  brief that follows 025's pattern (or reopen the queue in 024).

## Doctrine check (§4)

1. **Read sharpened:** Adaptations — the counter and the map can no longer be
   made to disagree.
2. **Stops:** a Profile card, a prefs field, two DB helpers, one argument.
3. **Input, not destination.** It removes a knob; nothing new is shown.
4. **Shape:** unchanged — per-leaf fill fraction, read once.
5. **Number claiming physiological meaning?** No.

## Acceptance

- [ ] No "Adaptation tracking" card on Profile; no `tracked` reference in
      `src/` outside the migration history.
- [ ] `adaptationCoverage` judges every leaf; the 045 tests still pass.
- [ ] The column drop is listed in 025.
