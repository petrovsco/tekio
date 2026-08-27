# Roadmap: Give the "Skill" adaptation a real data source (or retire it)

**Status:** TBC — needs a product decision before building

## Goal

Decide what feeds the `skill` adaptation (one of the nine on the Adaptations
dashboard) now that sport sessions have been rerouted to **cardio** adaptations.

## Context

As of the July 2026 Skills→Sports work, a logged sport session (Tennis, Swimming,
Volleyball…) is classified into a **cardio** adaptation (Endurance / VO₂max /
Anaerobic) by its duration — see `classifyCardioByDuration` in
[src/lib/adaptations.ts](../../src/lib/adaptations.ts). Sport sessions used to be
the **only** thing incrementing `volume.skill`, so the `skill` adaptation now has
no data source and always renders `0` / untouched on the dashboard.

The empty, unused DB subsystem `sport_areas` / `sport_drills` /
`sport_progressions` / `sport_session_drills` (0 rows, renamed from `skill_*` in
the same migration) looks like scaffolding for a per-sport skill-development
feature (drills within a sport, progression milestones, per-session drill logging).

## Options to decide between

1. **Build a skill-development feature** on the empty `sport_*` subsystem —
   per-sport skill areas, drills, and progression milestones; logging a drill
   feeds the `skill` adaptation. Biggest scope; makes the empty tables real.
2. **Feed `skill` from a technique/quality signal** — e.g. count each sport
   session logged with a high quality rating (★4–5) or "with trainer" as a skill
   bout, so skilled practice still shows up. Small, pragmatic.
3. **Retire `skill`** from the nine adaptations — drop it from `ADAPTATIONS`,
   `Adaptation`, the dashboard hero (`/9 → /8`), and the reference card. Simplest.

## Out of scope

- Do NOT re-add sport sessions to the `skill` adaptation — the cardio routing was
  the deliberate choice. See [[project_tekio_sport_rename]] and
  [[project_tekio_adaptations]].

## First step

Pick option 1/2/3. If 2 or 3, it's a small, self-contained change to
`src/lib/adaptations.ts` (+ constants + the `/9` counter in `AdaptationsTab`).
If 1, scope a separate design brief for the drills/progressions UI.
