# Roadmap: Skill training recommendations per exercise

**Label:** backlog
**Status:** backlog — idea captured 2026-08-29 when the skill adaptation was retired. Waits on 019 landing before it can be shaped.
**Depends:** 019

## The idea

The nine→seven simplification dropped `skill` as a tracked adaptation: it is
too broad for the app to track honestly, and it lost its data source when
sport sessions were rerouted to cardio in July 2026. But the door stays open —
Peter, 2026-08-29: "We can include some skill training recommendations in
future, or add them to every exercise."

So instead of skill being a logged, counted adaptation, it would be **guidance
attached to exercises**: an exercise (or sport) carries skill-work
recommendations — technique cues, drills, progressions — that surface where
the exercise surfaces. Recommendations, not tracking; nothing writes a number.

## Known constraints (from the 2026-08-29 decision)

- Not a section and not a read — R1/R3: this must not become a new menu
  destination or a tracking surface. The doctrine §4 checklist runs when this
  is picked up.
- The empty `sport_areas` / `sport_drills` / `sport_progressions` /
  `sport_session_drills` tables (renamed from `skill_*` in July 2026) look
  like scaffolding a recommendations feature could reuse — or delete. See
  [done/006-skill-adaptation-data-source.md](done/006-skill-adaptation-data-source.md)
  option 1 for the drills-feature shape that was considered and not chosen.

## Waiting on

More context from Peter: what kind of recommendations, for which exercises,
and where they should appear.
