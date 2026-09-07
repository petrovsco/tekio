# Roadmap: Exercise name aliases — one movement, many spellings, one search

**Label:** feature
**Status:** done — shipped 2026-09-07 (v2.0.44). 69 system aliases seeded, punctuation-insensitive matching, one resolver on every write path; verified in the browser and against the live database.
**Release:** 2.1.0

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

## Why it was parked

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

   *Corrected on pickup (2026-09-07).* An alias points at a canonical **name**,
   not at an `exercise_id`. Keyed by id, the table only ever holds rows for
   exercises somebody already created, so a new user's alias table is empty and
   none of this works for them — which is the case this brief exists to serve.
   The rest of the answer stands: still an exact match, never a guess.
5. **Does it write a number claiming physiological meaning?** No. Names only;
   no `## Grounding` needed.

## What shipped

Three decisions were Peter's on pickup, and each one changed the plan above.

**1. The alias list is a table, and it is keyed by name.** `exercise_aliases
(user_id, alias, canonical_name, origin)`, in
`supabase/migrations/20260907200000_exercise_aliases.sql`. A null `user_id`
marks a **system alias**: shipped with the app, in force for everybody, so it
works from zero rows. A non-null `user_id` is that user's own and wins over the
system row when both spell the same thing. The table is read-only to the
browser (a select-only policy), because nothing writes aliases today and an
alias-management UI is forbidden by R3 — the list is enhanced by SQL, which is
why it is a table rather than a constant in the source.

**2. Matching strips punctuation and spacing.** "pushups", "push ups" and
"Push-Ups" are one name, so one alias entry covers a family of spellings
instead of one entry per spelling. This also closes the twin punctuation alone
created — the *Hanging Leg Raises:* row deleted by hand on 2026-09-03 can no
longer be created. It is still an exact match, so the "no fuzzy matching" rule
below is untouched: the rule exists because a wrong guess books sets onto the
wrong muscles, and normalising guesses nothing.

The match key lives in two places that must agree: `normaliseExerciseName` in
[`src/lib/exerciseName.ts`](../../../src/lib/exerciseName.ts) and the SQL function
`public.normalise_exercise_name(text)`, which the table's unique indexes are
built over. Both files say so.

**3. Air Bike / Assault Bike was dropped from the seed.** The catalogue has no
*Assault Bike* movement — only *Assault Bike Intervals*, which names a format
rather than a movement. Air-bike work belongs to cardio.

Two things the brief did not anticipate, found while building:

- **The seed pairs in the brief were guesses and most were wrong.** The real
  catalogue has *Chin-up* (singular), *Lat Raises* (not "Lateral Raises"), and
  no *Assault Bike*. The 69 seeded pairs are built from the 110 names actually
  on file, and each was checked to be the *same* movement: split squat is not
  Bulgarian split squat, a cossack squat is not a lateral lunge, a Romanian
  deadlift is not a single-leg RDL, and "Shoulder Press" sits between two rows
  that both exist rather than clearly meaning one. Those were all left out.
- **Two write paths, one resolver.** `getOrCreateExercise` existed twice, in
  `weights.ts` and `program.ts` — which is how a fix lands on one logging path
  and leaves the other making twins. Both now call one
  [`src/lib/db/exercises.ts`](../../../src/lib/db/exercises.ts). It returns the
  *row*, not just the id, because both callers display the name back: weights
  seeded the in-memory log with the typed alias, so a set logged as "kb swing"
  stayed invisible to the muscle read until the next reload, and mobility wrote
  the typed spelling into `mobility_exercises.exercise_name` beside a correctly
  resolved id — the same split, one table lower.

Resolution order is load-bearing and lives in TypeScript, not in the database:
a real exercise name always beats an alias. No cross-table constraint can
enforce that, so a bad alias row spelling an existing exercise can never
hijack its sets.

Out of scope and still is: a merge tool for existing twins. There are none on
file today (checked — no two exercise names normalise to the same key), so
nothing needs merging.

## Explicitly not

- No fuzzy or phonetic matching, no "did you mean" from string distance.
- No alias management UI beyond what Admin's exercise editor already shows.
- ~~No change to how names are normalised on write~~ — superseded by decision 2
  above: normalising on write is what closes the trailing-punctuation twin, and
  it was cheaper to do here than to leave for a later fix.

## Acceptance

- [x] Searching any seeded alias in the Weights picker returns the canonical
      exercise, not "create new". Verified in the browser: "kb swing" →
      *Kettlebell Swing · matched KB Swing*, "pressups" → *Push-ups · matched
      Press-ups*, "ohp" → *Overhead Press · matched OHP*. The Home muscle sheet
      has no search box of its own — its "search the exercise list" button
      hands off to the Weights tab, which is the picker above.
- [x] Logging through an alias writes `session_exercises` against the
      canonical exercise id. Verified end to end against the live database: a
      set typed as "kb swing" and saved without touching the dropdown landed on
      *Kettlebell Swing*, the exercise count stayed at 110, and no row
      normalising to "kbswing" was created. The test row was deleted through
      the app's own delete button afterwards.
- [x] The seed migration is in `supabase/migrations/` and the table is
      origin-tagged ([037](037-row-origin-tagging.md)), write-once
      through the same `preserve_origin` trigger.
- [x] No existing exercise is renamed and no logged set moves. Counts before
      and after are identical: 110 exercises, 212 session_exercises, 821
      session_sets.
