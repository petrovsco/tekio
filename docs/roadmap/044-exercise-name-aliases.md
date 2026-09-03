# Roadmap: Exercise name aliases — one movement, many spellings, one search

**Label:** backlog
**Status:** backlog — marked 2026-09-03 by Peter as post-2.0.0 work. Parked
until the app is being readied for other people; for one user the catalogue
([done/043](done/043-scout-named-exercises-catalogue.md)) plus canonical names
is enough.

---

## The plain summary

The same movement gets logged under different names — *Air Bike* and *Assault
Bike*, *Push-ups* and *Press-ups*, *KB Swing* and *Kettlebell Swing*. Today a
search for one spelling does not find the other, so the picker offers to create
a duplicate, and the muscle read then splits one exercise's sets across two
names with two sets of muscle links (or one set and none).

**Goal:** searching for any known spelling finds the one exercise it means, and
every logged set lands on that one exercise. A user who types *air bike* sees
*Assault Bike* (with its links) and never creates a twin.

Peter, 2026-09-03: *one objective is to put the application to general use once
it will be of people's help. We should make the search of exercises easier —
we often have the same exercise named a bit differently. We should have a way
to map those, so if a user searches for one but we named it with the other, it
still shows. Post-v2 — just marking it now.*

## Why it is parked

With one user, the fix is discipline: canonical names in the catalogue and the
picker reading it (043). Aliases earn their place when *other people* type
names the catalogue did not anticipate — which is exactly the general-use
objective, and that objective is post-2.0.0. Building it earlier is P4:
configurability standing in for a decision.

## Doctrine §4 checklist

1. **Which read does this sharpen?** The muscle read on Home. A duplicate
   exercise with no links is a silent hole in the map; an alias closes it at
   capture time.
2. **What does it let me stop doing?** Manual clean-up of twins in the
   `exercises` table (the *Hanging Leg Raises:* row deleted 2026-09-03 is the
   pattern: a session deleted by hand leaves the name behind — deleting a
   session never deletes an exercise, by design).
3. **Input or destination?** Input — it lives inside the existing picker and
   search. No new surface.
4. **Honest shape of the data?** A many-to-one table: `exercise_aliases
   (alias text, exercise_id uuid)`, unique on the lowercased alias. Not a
   free-text fuzzy match — a fuzzy match would guess, and a wrong guess puts
   sets on the wrong muscles.
5. **Does it write a number claiming physiological meaning?** No. Names only;
   no `## Grounding` needed.

## Scope, when it is picked up

- `exercise_aliases` table (alias, exercise_id, origin), unique on
  `lower(alias)`; an alias may not equal an existing exercise name.
- The picker and `SmartInput` search match aliases as well as names, and show
  the canonical name with the alias in smaller text ("Assault Bike · matched
  *air bike*").
- `getOrCreateExercise` resolves an alias to its exercise before it upserts,
  so no path creates a twin from a known alias.
- Seed list from the catalogue: the obvious pairs (Air/Assault Bike,
  Push-ups/Press-ups, KB/Kettlebell Swing, Chin-ups/Chinups, Hanging Leg
  Raise/Raises) — a one-off migration, not an admin panel (R3).
- A merge tool for existing twins is **out of scope** here; if two exercises
  already carry logged sets, merging them re-points `session_exercises` and is
  its own decision per pair.

## Explicitly not

- No fuzzy or phonetic matching, no "did you mean" from string distance.
- No alias management UI beyond what Admin's exercise editor already shows.
- No change to how names are trimmed or normalised on write (a separate,
  smaller fix if the trailing-punctuation twin recurs).

## Acceptance

- [ ] Searching any seeded alias in the Weights picker and the Home muscle
      sheet returns the canonical exercise, not "create new".
- [ ] Logging through an alias writes `session_exercises` against the
      canonical exercise id.
- [ ] The seed migration is in `supabase/migrations/` and the table is
      origin-tagged ([done/037](done/037-row-origin-tagging.md)).
- [ ] No existing exercise is renamed and no logged set moves.
