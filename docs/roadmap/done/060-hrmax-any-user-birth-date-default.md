# Roadmap: HRmax for any user — a birth-date default, a tracker peak on acceptance

**Label:** feature
**Status:** done — shipped 2026-09-07 (v2.0.35), the evening [059](059-profile-hrmax-typed-hr-path.md) shipped and Peter said "this is built only for me". He picked the forks (A: Profile plus a hint on the cardio form; B: one number plus a source; C: propose again every time); the Tanaka estimate is the default from a birth date, the tracker's 196 is offered on his Profile and nothing is stored until he accepts or types.
**Release:** 2.1.0

## Why

059 shipped an HRmax the app derives from the user's own synced rows: the
highest session peak that a second session comes within 3 bpm of, over 24
months. For Peter that is 196 bpm, set by 220 Garmin rows. For anyone else it
is nothing.

The failure is exact. The typed-HR path (059 shape 3) exists for one person:
someone who hand-logs a cardio row and types the average heart rate. That
person has no tracker — with one, the row would arrive synced with Training
Effect and zones, and the classifier would never look at the typed HR. So the
only user the path serves is the one user who can never have the number it
reads against. It fires on zero rows today, and under 059's rules a new user's
path fires on zero rows until two near-maximal sessions have synced.

059's decision 2 ("no formula fallback, no birth year") said: a new user types
an override or waits for the sync. Peter's answer, 2026-09-07: "I feel this is
built only for me. Doesn't make sense. Although the grounding is not so good,
it makes sense for a default value." The general-use objective (2026-09-03) is
the frame: single-user shortcuts expire, and a default that only the user's data
can produce is one.

## The case against

- **A formula denominator is ±9–11 bpm off for an individual** — Kasiak 2023
  (RMSE 9.1–10.5 bpm, n = 5,311 athletes) and Martin 2025 (RMSE 9.2–10.9 bpm,
  n = 230 adults), both in 059 §Grounding. The two cuts the typed HR is read
  against sit 6 % apart, about 12 bpm at 196. A 35-year-old's Tanaka estimate
  is 184; a typed 165 bpm reads 90 % → VO₂max against it and 84 % → endurance
  against 196. Rows near a cut can land in the wrong bucket. Peter has heard
  this and overruled it: a fuzzy default beats no default, the tracker peak
  corrects it, and the Profile says "estimate". Recorded so it is not
  re-argued.
- **Birth date is capture** — one more field, the kind the doctrine calls
  overhead. It is one date, typed once, and the only route to a number for a
  user with no device. Accepted.
- **Silent replacement goes.** 059 let a synced peak overwrite a typed override
  when it exceeded it by more than 3 bpm. Peter: "once we have a tracker record
  we can ask the user if he/she accepts it." The app proposes, the user
  decides; nothing the user set is overwritten by a sync. More honest, and it
  costs one button.

## Shape

1. **Birth date.** `user_profiles.birth_date date` (nullable); a date picker
   on the Profile tab. Age is computed at read time, never stored.
2. **Formula default.** Tanaka `208 − 0.7 × age`, rounded, used only when the
   user has set no number. The scout already named it (059 §Grounding: lowest
   RMSE of the age formulas in both athlete validations; never 220 − age).
   Never stored: with no birth date and no user-set number, HRmax is null and
   the typed-HR path stays off, as today.
3. **Tracker peak on acceptance.** `observedHrMax` (059) keeps deriving the
   replicated peak from synced rows, but it no longer feeds the read directly.
   When it exists and the user has no stored number — or it is more than
   `HR_MAX_REPLICATION_BPM` (3) above the stored one — the Profile card
   proposes it: "Your tracker recorded 196 bpm twice in the last 24 months
   (Indoor Rowing, 2024-10-25)." → **Use 196**. Accepting stores it. A lower
   peak is never proposed.
4. **The typed field stays**, for a number from another device or a test — the
   field 059 added, relabelled "From another device or a test (bpm)".
5. **One stored number, last write wins** (recommended — fork B). Keep
   `hr_max_override` as the stored number; add
   `hr_max_source text check (hr_max_source in ('typed', 'tracker'))`.
   Accepting writes (196, `tracker`); typing writes (200, `typed`); clearing
   nulls both. `resolveHrMax` reads stored ?? formula(birth_date) ?? null.
6. **Profile card** names which number is in use: "Using 196 bpm from your
   tracker." / "Using 200 bpm you typed." / "Estimated 184 bpm from your age
   (208 − 0.7 × age, about ±10 bpm for one person) — a tracker peak or a typed
   number replaces it." / "No number yet — add your birth date, or type a max
   heart rate." The footer stays: "Reading typed heart rates against N bpm."
7. **Classifier unchanged.** `typedHrBand`, `classifyTypedHr` and the two cuts
   stay; only the denominator's resolution changes.
8. **Bookkeeping.** Inventory row for the Tanaka coefficients pointing at 059
   §Grounding; ledger D39 recording the reversal of D37's "no formula, no birth
   year" and why; 059's decisions carry a one-line pointer here; memory.
   `npm run check:docs`.

### Forks for Peter

Picked by Peter on 2026-09-07, before the code:

- **A — where the proposal lives.** ~~Profile card only~~ / **Profile plus a
  one-line hint on the cardio form** when a typed HR has no denominator
  ("Not read yet — add your birth date in Profile to read it against your max
  heart rate"), never on an intervals row. Peter took the wider shape over the
  recommendation: the form is where the question is raised (P1).
- **B — storage.** **One number plus a source column, last write wins** /
  ~~two columns, typed winning~~ — the second fails when an old typed 185
  outranks a freshly accepted 196.
- **C — re-proposing.** **Propose again whenever a new replicated peak
  exceeds the stored number by more than 3 bpm** — the proposal lives only on
  the Profile card, so it never nags a read / ~~propose once and remember a
  dismissal~~.

## Doctrine checklist

1. **Which read does this sharpen?** The cardio-adaptation bands on Home and
   Adaptations through the typed-HR path, and the Profile card.
2. **What does it let me stop doing?** Deriving a number only the user's data can
   produce; overwriting a user's number silently.
3. **Input or destination?** Input — a birth date and an accept button feed an
   existing read.
4. **Honest shape of the data?** One number per user with its source; a
   formula estimate labelled as one, with its band; the tracker peak with the
   session and date that set it.
5. **Does it write a number claiming physiological meaning?** Yes —
   `208 − 0.7 × age`. Already grounded in 059 §Grounding (Tanaka 2001; Kasiak
   2023; Martin 2025) as the scout's own recommended fallback, so no new run;
   its verdict stays *partially supported* and the ±10 bpm band is written on
   the card.

## Out of scope

- A stale flag when no session in the window comes within 5 % of the number —
  059 decision 5 stands.
- Per-modality HRmax; syncing the watch's own setting (the user types 196 into
  the Garmin by hand).
- Reading a typed HR on `intervals` rows; Garmin zones — 059's out-of-scope
  stands.
- The threshold label — [057](057-threshold-sessions-labelled.md).

## Acceptance

- [x] Migration applied and mirrored under `supabase/migrations/`: `birth_date`, and the storage shape fork B picks — `20260907180000_user_profiles_birth_date_hr_max_source.sql`, applied 2026-09-07: `birth_date date`, `hr_max_source text`, and a check that the source is set exactly when the number is.
- [x] Profile: a birth date picker; the card shows the estimate / tracker / typed state; the tracker proposal with a **Use N** button; the typed field relabelled — "Another device or a test (bpm)".
- [x] `resolveHrMax` reads stored ?? formula ?? null; a sync never overwrites a stored number; tests for the formula (age 35 → 184), the proposal rule (no stored number / more than 3 bpm above / lower never), and last write wins — `formulaHrMax`, `ageAt`, `hrMaxProposal` in `src/lib/hrMax.ts`; 12 tests in `hrMax.test.ts` (184 / 180 / 194 by age, the day before a birthday, 192 → offered and 193 → not); the 43 classifier tests unchanged.
- [x] Inventory row for the formula; ledger D39; the pointer in 059's decisions; `npm run check:docs` passes — rows 6.13–6.14, D37 amended, D39 added; 81 anchors, 76 passed, 0 failed.
- [x] Browser-checked: the user's card proposes 196; accepting stores it with source `tracker`; with the stored number cleared and a birth date set, the card shows the estimate — headless Chromium 2026-09-07: "No number yet" + the 196 proposal → **Use 196** → "Using 196 bpm from your tracker (Indoor Rowing, 2024-10-25)", no proposal → typed 200 → "Using 200 bpm you typed" → cleared → proposal back → birth date → "Estimated 184 bpm from your age"; the cardio form's hint shows with a typed 150 and no number, and not with the estimate or on an intervals row. The only console error is the known favicon 404. Everything reset to NULL afterwards — the accept is Peter's to click.
