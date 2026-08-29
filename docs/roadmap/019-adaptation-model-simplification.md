# Roadmap: Simplify the adaptation model — nine → seven

**Label:** feature
**Status:** Ready — decision made 2026-08-29; app-side code not started

## The decision (2026-08-29, during the roadmap-018 canvas review)

Peter's call, lightly compressed:

- **Speed — remove.** "We generally don't train for pure speed."
- **Power — keep, but it is not a whole-body quality.** It is the force ×
  velocity a specific muscle group can produce — it can be strong for one
  muscle group and absent for another. It moves to the muscle-linked side and
  is read **per muscle**.
- **Skill — drop for now.** "Very broad… hard to track by an app." The
  per-exercise skill-recommendations idea is parked as
  [020-skill-recommendations-per-exercise.md](020-skill-recommendations-per-exercise.md)
  (backlog).

What remains splits cleanly in two, which is itself the argument for the model:

- **Muscle-linked (4):** strength, hypertrophy, muscular endurance, power —
  classified from logged sets, read per muscle (body map + drill-in).
- **Whole-body (3):** VO₂max, anaerobic capacity, long-duration endurance —
  all cardio, session-based.

Already done the same day (this brief is only the app-side remainder):
doctrine §1 / P2 / §5 amended; the design canvas (roadmap 018) republished on
the seven-model; brief 006 resolved as "retire skill" and moved to `done/`.

## Checklist (doctrine §4)

1. **Which read does it sharpen?** Adaptations tab + the Home whole-body
   strip: three honest qualities instead of six, where three rendered a
   permanent zero (speed and power had no data source in practice, skill lost
   its source when sports were rerouted to cardio in July 2026 — see 006).
2. **What does it let me stop doing?** Retires 006 entirely; deletes the
   speed/skill rows from the dashboard, targets editor, and adaptation guide.
3. **Input or destination?** Neither — a model change to existing reads.
4. **Honest shape?** Power is per-muscle (reads in the muscle drill-in and as
   a gap chip when zero everywhere); the three cardio qualities stay
   whole-body and session-based.
5. **New physiological number?** No new claim — removals only, and power's
   classification already exists. **The grounding trap:** anything that
   counts to nine (`/9` hero counter) or weights across nine must be
   renormalised, not silently shortened — the same pattern as
   `RECOVERY_WEIGHTS.habits` in roadmap 014. Check whether any aggregate
   score divides by the adaptation count before touching it.

## What changes in code

- `src/constants/adaptations.ts` — drop the `speed` and `skill` entries; mark
  `power` muscle-linked (judged by muscle targets like the other resistance
  adaptations, not by a session count). The file's own "nine adaptations"
  comment and `src/constants/app.ts:65` ("Recovery sits parallel to the nine
  adaptations") follow.
- `src/lib/adaptations.ts` — remove skill classification remnants; any
  keyword defaults mapping to speed reroute (likely to power) or go.
- `src/components/tabs/AdaptationsTab.tsx` — hero counter `/9` → `/7`; rows.
- `src/components/tabs/home/AdaptationGuide.tsx` — same list.
- `src/components/tabs/admin/AdaptationTargetsEditor.tsx` — follows the
  constant; verify nothing hardcodes nine.
- `docs/grounding-inventory.md` — reindex in the same change (it is
  reference-only; numbers attached to speed/skill claims come out of the
  count, never left as a TODO there).
- Briefs 011/012 keep their grounded speed/skill target rows as history —
  reference docs don't get retro-edited; this brief records that those rows
  are moot.

## Data

No migration. Speed, skill, and power all have **0 logged sets ever** in prod
(DATA.md pull, 2026-08-27), and sport sessions were already rerouted to cardio
adaptations in July 2026. Nothing to backfill or delete.

## Watch out

- The `sport_*` DB subsystem rename (July 2026) is unrelated to this drop —
  keep the distinction; don't touch those tables here.
- Per-muscle power in the app v1 = the drill-in quality-mix row and a "Power ·
  0 sets" gap chip (as drawn on the 018 canvas). Any power-specific target
  threshold runs `/ground` before it becomes code (015 trigger spec).
