# Roadmap: Simplification candidates — a ranked list for `/simplify`

**Label:** infra
**Status:** in progress — eight landed: **A8** (v2.0.58), **A1** (v2.0.63, which
took `knip` to zero), **S1** in two parts (v2.0.65 store + tabs, v2.0.66
EditModal, after which the repo sits at 023's accepted floor of 6 lint
warnings), **A4 + A5** together (v2.0.68, the whole `lib/db` layer) and
**B2 + B3** together (v2.0.69, the weights plan).
**The small `lib` dedupes A2 + A3 + A10 + A11 are next.**
Each remaining candidate is one atomic unit a later session lands with
`/simplify`; tick its box in Acceptance when it ships.
Committed to 2.1.0 by Peter on 2026-09-05 as spare-time units.
**Release:** 2.1.0

## What this is

A code review with one question: where is the code more than it needs to be?
Two read-through passes covered all of `src/` (13.8k lines), the Garmin sync
scripts and the two edge functions. Every claim was made by reading the file;
every "used once" or "written N times" was confirmed by grep. Line numbers are
as of commit 00b90b7 and drift as candidates land, so search for the name rather
than trusting the number.

The four lenses are the ones `/simplify` uses:

- **Reuse** — the same logic written in two or more places.
- **Simplification** — dead code, unreachable branches, state that could be
  derived instead of stored.
- **Efficiency** — repeated work that a map or a `useMemo` removes.
- **Altitude** — code at the wrong level: a helper used once, a component doing
  data-layer work.

Not in scope: bugs (those go to `/code-review`; the ones found on the way are
listed at the end), style, renaming for taste.

## How to land a candidate

1. Pick one. Candidates are independent unless the entry says otherwise.
2. Run `/simplify` with the files as its argument and name the candidate, e.g.
   `/simplify src/lib/db/weights.ts src/lib/db/program.ts — candidate A2 of
   roadmap 048`. The skill reviews changed code by default; if it reports no
   diff, tell it to treat the listed files as the scope.
3. `npm run build`, `npm run test`, and for anything marked **visual** open the
   app and look (house rule `verify-in-browser`).
4. Tick the box below, patch-bump, commit, push. One candidate per commit.

**Start here**, in this order: S1, A1, A4 + A5, B2 + B3, then the small `lib`
dedupes A2 + A3 + A10 + A11. That set is about −430 lines at low risk.

## Doctrine checklist

1. **Which read does this sharpen?** None directly. It makes the code cheaper to
   read and change — the performance face of P1, and the session context budget.
2. **What does it let me stop doing?** Keeping copies in step: one date helper
   in four places, one save-and-toast block in about 37 places, one Supabase
   load shape in eight files.
3. **Input or destination?** Neither. Code only.
4. **Honest shape of the data?** Not applicable.
5. **Physiological number?** No new claim. B3 replaces a literal `0.7` with the
   existing grounded `DELOAD_REP_FACTOR`; a number moves, nothing new is claimed
   (the `/ground` exemption).

## Tier 1 — small, low risk, clear win

### A1. Dead exports and duplicated constants (−70 lines)

- **Where:** `src/lib/utils.ts:191-203` `currentStreak`, `:265-267` `WEEKDAYS`
  (duplicates `DAYS_OF_WEEK` in `src/constants/program.ts:34-36`);
  `src/lib/adaptations.ts:108-111` `classifyCardio` (only a test calls it),
  `:405-409` `totalAdaptationVolume`, `:411` re-export of `ADAPTATIONS`;
  `src/lib/db/program.ts:192-237` `loadPausedPrograms` and the `status` param of
  `loadProgramRows`; `src/constants/app.ts:21,37,56` `CardioDisplayType`,
  `DonationDisplayType`, `SPORT_TYPES_DEFAULT`; `src/store/app.ts:69,211`
  `setSportTypes`; `src/components/ui/Button.tsx:17` variant `ss` (identical to
  `primary`); `src/store/assistant.ts:10` second `uid`;
  `src/lib/db/sectionConfig.ts:64` + `src/store/prefs.ts:15` the `sortOrder`
  branch of `updateSectionField` (sole caller passes `showInMenu`);
  `src/App.tsx:24-25` `DRAWER_TABS` (exists only to derive a type).
- **Change:** delete; inline `loadProgramRows` into `loadActivePrograms`;
  `weekdayOf` reads `DAYS_OF_WEEK`; rewrite the `classifyCardio` test as
  `classifyCardioAdaptations(c)[0]` or drop it.
- **Risk:** low. Overlaps [023](done/023-mechanical-code-quality-tooling.md), whose `knip`
  run would find the same exports; doing it by hand now costs little and 023
  then confirms zero.

**Knip ran 2026-09-08 (023 item 2) and confirmed the prediction** — it found the
hand-read list above, and eleven more this entry did not have. Add these when A1
is landed; `npm run knip` is the check that A1 is finished:

- **A whole orphaned file:** `src/hooks/useCountUp.ts`. Added 2026-06-19 for
  Home's count-up animations (`6c6ea41`); the SIGNAL restyle removed its last
  caller and nothing has imported it since.
- **Three re-exports that only forward:** `TodaysPlan.tsx:292`
  `export { deloadSets }` — its comment says "so WeightsTab can use it" and
  WeightsTab imports it from `lib/utils` directly, so the comment is false as
  well as the export; `adaptations.ts:497` also re-exports `ADAPTATION_MAP`
  beside the `ADAPTATIONS` already listed; `program.ts:14`
  `export { getOrCreateExercise }`, which belongs with A2.
- **Two exports whose keyword is dead but whose value is not:** `QUALITY_PROSE`
  (`adaptations/labels.ts:21`) and `MUSCLE_SHORT` (`home/GapMap.tsx:29`) are
  both used further down their own file. Drop the `export`, keep the constant.
- **Two more dead functions:** `epley1RM` and `brzycki1RM` (`utils.ts:151,156`).
  Note for whoever deletes them: they are 1RM estimators, so if they are ever
  revived instead they are formulas and `/ground` applies. Nothing in
  [grounding-inventory.md](../grounding-inventory.md) cites them today, because
  the app does not use them.
- **`classifyGarminIntensity`** (`adaptations.ts:82`) — this entry says
  `classifyCardio`, which no longer exists under that name.
- **Seven unused exported types** beyond the two listed: `AdaptationModality`,
  `MuscleStatus`, `ProposalStatus`, `Proposal`, `MetricSeries`, `SportType`,
  `DonationType`.
- **One duplicate export:** `DELOAD_WEEK = CYCLE` in `constants/app.ts` — one
  value under two names, which is the "duplicated constants" in this entry's
  own title.

**Landed 2026-09-08 (v2.0.63).** `npm run knip` reports zero and `npm run lint`
dropped from 18 warnings to 16. 108 lines deleted across 16 files, plus one
whole file. Four of the claims above were wrong when read against the code, and
the corrections are the useful part of this record:

- **"Dead" was often only the `export` keyword.** `classifyGarminIntensity`,
  `epley1RM`, `brzycki1RM`, `MetricSeries`, `MuscleStatus`, `AdaptationModality`,
  `ProposalStatus`, `Proposal`, `SportType` and `DonationType` are all live
  inside their own file — knip's "unused export" means nothing *else* imports
  them, not that nothing calls them. They lost the keyword and kept the code.
  Only seven things were genuinely dead and deleted outright: `useCountUp.ts`,
  `currentStreak`, `totalAdaptationVolume`, `loadPausedPrograms`,
  `SPORT_TYPES_DEFAULT`, `CardioDisplayType` / `DonationDisplayType`,
  `setSportTypes`, the `ss` button variant and three forwarding re-exports.
- **`epley1RM` and `brzycki1RM` are not revivable formulas — they ship.**
  `estimate1RM` averages them and WeightsTab prints the result as "≈NNkg 1RM".
  The note above says `/ground` would apply "if they are ever revived"; the
  tense is wrong, a 1RM estimate is on screen today. The inventory already knows
  — §8 rows 8.1, 8.2 and 8.4 are all `unknown`, and 8.4 flags the averaging step
  as "Tekiō's own estimator", not a published formula — so what is missing is a
  brief, not a discovery. Recorded under *Found on the way*.
- **`DELOAD_WEEK` was kept.** It is grounding-inventory row 5.3 — "week 6 is the
  deload week", a deload-placement claim still marked `unknown`, and row 5.8
  writes it to `programs.deload_week`. It shares a *value* with `CYCLE` but not a
  *meaning*, and deriving it is what keeps the deload on the last week if the
  cycle length ever moves. Knip's per-export `@knipignore` tag does not reach the
  `duplicates` issue type (it reports "unused tag"), so `knip.jsonc` excludes
  that check instead, with the reasoning in the file. Every other knip issue type
  stays on.
- **`DRAWER_TABS` was already gone** from `App.tsx` — nothing to delete.

### A2. `weights.ts` copies `program.ts` and itself (−22)

- **Where:** ~~`src/lib/db/weights.ts:6-18` is `getOrCreateExercise` verbatim
  from `src/lib/db/program.ts:10-22`~~ — **the copy is already gone** (checked
  2026-09-08 while landing A1). Roadmap 044 moved the resolver to
  `src/lib/db/exercises.ts`, which every write path now imports; `weights.ts`
  carries a comment saying why a second copy must not come back. What is left of
  this entry is the second half: `weights.ts` still counts remaining
  `session_exercises` and deletes the session at zero in **two** places (search
  for the `session_exercises` count, near `deleteWeightEntry`).
- **Change:** extract `deleteSessionIfEmpty(sessionId)`. A1 also deleted
  `program.ts`'s dead `export { getOrCreateExercise }` forwarder, so nothing
  reaches the resolver through `program.ts` any more.
- **Risk:** low; no tests on the DB layer.

### A3. `daysBetween` written four times (−8)

- **Where:** `src/lib/fusedRead.ts:29-34` (exported), `src/lib/utils.ts:42-45`
  and `:55-58`, `src/lib/db/program.ts:536-539`.
- **Change:** move `daysBetween` and `DAY_MS` to `utils.ts`, re-export from
  `fusedRead.ts` for its 9 importers, `Math.max(0, daysBetween(...))` at the
  three inline sites. Floor vs round is the same for `YYYY-MM-DD` inputs.
- **Risk:** low; `utils.test.ts` and `fusedRead.test.ts` cover it.

### A10. `groupBy` written eight times (−25)

- **Where:** `src/lib/db/program.ts:60-64, 72-77, 84-88, 97-101, 104-108`;
  `src/lib/db/mobility.ts:14-20`; `src/lib/adaptations.ts:157-164`;
  `src/lib/fusedRead.ts:132-137`; `src/components/layout/ImportPane.tsx:91-96`.
- **Change:** `groupBy<T>(rows, key: (r) => string): Map<string, T[]>` in
  `utils.ts`.
- **Risk:** low; two of the sites are under test.

### A11. `deriveFlat` exists three times (−12)

- **Where:** `src/lib/programImport.ts:28-34`, `src/lib/db/program.ts:154-158`,
  `src/components/tabs/ProgramTab.tsx:58-65` (`recomputeFlat`).
- **Change:** export `deriveFlat` from `programImport.ts`; use it in the other two.
- **Risk:** low; `programImport.test.ts` covers the source copy.

### A12. `executor.ts` program cases share a prelude (−18)

- **Where:** `src/lib/assistant/executor.ts:190-229` (three cases repeat
  `findProgram → structuredClone → dayByName → fail`), `:123-125` (the
  `program / ` prefix expression three times in `describeToolCall`).
- **Change:** `withProgramDay(a, callName, (clone, day) => …)`; one `prefix` const.
- **Risk:** low.

### A13. `user.ts` selects the profile row twice (−12, one round-trip)

- **Where:** `src/lib/db/user.ts:15-23` and `:34-43`; `src/store/prefs.ts:27-29`.
- **Change:** one `loadProfile()` returning `weekStartDay` and the tracked ids.
- **Risk:** low.

### A14. Type names that say the same thing (−20, three casts)

- **Where:** `SportType` in `src/types/index.ts` is a closed union
  (`'Tennis' | 'Swimming' | 'Volleyball'`) while sports are dynamic
  (`sport_types` table, free-text input). **The cast list is stale** (re-grepped
  2026-09-08): of the five sites this entry named, only one survives —
  `SportLogForm.tsx:61` `sport: sport.trim() as any`. The finding itself stands,
  and that one `as any` is the whole evidence for it. `CardioType` /
  `DonationType` restate the const arrays in `constants/app.ts`; `QualityRating`
  = `SleepQuality`; `SaunaEntry` = `ColdEntry`; `NewSportFlags` =
  `Omit<SportTypeInfo,'name'>`.
- **Change:** `sport: string`; `CardioType = typeof CARDIO_TYPES[number]`
  (constants/app has no type import, so no cycle); aliases for the rest. A1
  already dropped the `export` keyword from `SportType` and `DonationType`
  (nothing outside `types/index.ts` imports them), so this entry now edits one
  file.
- **Risk:** low.

### A8. React Router carries zero routes (−8, −1 dependency)

- **Where:** `src/App.tsx:2,57-63`, `src/main.tsx:3,9-11`, `package.json:23`.
  The only usage is `<BrowserRouter>` around `<Route path="*">`; navigation is
  `useState`.
- **Change:** drop the wrapper and the package; render `<Suspense>` directly.
  Update the "Routing and navigation" paragraph in `CLAUDE.md`.
- **Risk:** low. Bundle shrinks.
- **Landed 2026-09-08 (v2.0.58)** as part of roadmap 023 item 0, which was
  hunting first-paint weight and found this from the other end. Both files, the
  package and both `CLAUDE.md` paragraphs are done; the bundle shrank 37 kB.

### B2. `lastPerf` written three times, then re-filtered a fourth (−25)

- **Where:** `src/components/tabs/weights/WeightsTab.tsx:52-60`,
  `weights/TodaysPlan.tsx:73-76`, `weights/SupersetLogger.tsx:29-32` (filter by
  lower-cased name and non-deload date, copy-sort all of `weights`, take `[0]`);
  `weights/ExPlan.tsx:30-31` re-runs `isDeloadDate` on a value TodaysPlan already
  filtered, the only reason `programStartDate` is threaded to it.
  `LiftSet[] → SetStr[]` is hand-written at `WeightsTab.tsx:82,89` and
  `SupersetLogger.tsx:37` while `ui/EditModal.tsx:36-38` has `toSetStr`.
- **Change:** `lastPerformance(weights, name, startDate?)` in `lib/utils.ts`
  next to `isDeloadDate`; drop ExPlan's prop; export `toSetStr` from
  `ui/SetsGrid.tsx` (where `SetStr` lives).
- **Risk:** low; the util is coverable in `utils.test.ts`.

**Landed 2026-09-08 (v2.0.69), together with B3** — one commit, because both
edit the same five weights files. `lastPerformance` is in `lib/utils.ts` with
five tests in `utils.test.ts`; the three hand-written copies are gone and so is
ExPlan's re-filter. Three departures from what this entry proposed:

- **The third argument is a *list* of start dates, not one.** WeightsTab has
  several active programs in scope and excluded a session that was deload in
  **any** of them; the two plan components knew one program each. A list serves
  both, and it removed an inconsistency the singular signature would have kept:
  the superset "Deload" button used one program's rule while the "Last (…)" line
  printed beside it used all of them.
- **`onPickSupersetDeload` lost its second argument.** It took a
  `(n: string) => WeightEntry | undefined` closure that existed only because
  TodaysPlan had built one and WeightsTab had not. With the helper in `lib/utils`
  the parent computes it itself, so `PickHandlers` is one parameter shorter and
  nothing threads a lookup function down two levels.
- **The converters went to a new `src/lib/sets.ts`, not to `ui/SetsGrid.tsx`.**
  Exporting a plain function beside a component is two
  `react-refresh/only-export-components` warnings, which took `npm run lint`
  from 6 to 8 — above 023's accepted floor. `lib/sets.ts` holds `SetStr`,
  `toSetStr` and its inverse `parseSets`, keeps the floor at 6, and stays out of
  `lib/utils.ts`, which is loaded eagerly: only EditModal and the weights tab
  import it, so it builds as its own 1.49 kB lazy chunk. `parseSets` was not in
  this entry and is the same finding — the exact inverse of `toSetStr`, written
  inline four more times (WeightsTab's live 1RM and its save, SupersetLogger's
  two columns) beside the named copy in EditModal. SupersetLogger's own
  `interface SetStr` — a fourth declaration of the type — went with it.

First paint 349.99 kB: `lastPerformance` costs 0.20 kB because `lib/utils.ts` is
in the entry chunk, and the file is still 2.48 kB under the committed baseline.
The plan also stopped copy-sorting: each exercise used to sort all 212 weight
entries to read `[0]`, and the helper is one O(n) scan.

### B3. Dead deload branch and a `0.7` literal (−30)

- **Where:** `weights/VolumeRow.tsx:28-44` never runs: its only caller
  (`ExPlan.tsx:88`) passes `isDeload={false}`. `TodaysPlan.tsx:291-292`
  re-exports `deloadSets` "so WeightsTab can use it" but nothing imports it;
  `WeightsTab.tsx:176-177` hand-rolls `Math.round(s.reps * 0.7)` instead, a
  second copy of the grounded `DELOAD_REP_FACTOR`. `VolumeRow.tsx:46-52` vs
  `:64-70` computes each tier's sets twice.
- **Change:** delete the branch, prop and re-export; WeightsTab calls
  `deloadSets(...)` (it also rounds the weight to 0.5; logged weights already
  are, so no visible change expected); VolumeRow computes once per tier.
- **Risk:** low. **Visual:** check today's plan on a deload week.

**Landed 2026-09-08 (v2.0.69) with B2.** The dead branch checked out — the only
caller passed `isDeload={false}` — so `VolumeRow` lost 20 lines, its prop and
three imports. The `deloadSets` re-export this entry names was **already gone**:
A1 deleted it as one of three forwarding re-exports, and the comment claiming
"so WeightsTab can use it" went with it. Two notes:

- **The tiers are computed once and read twice.** The table and the "Use" button
  under it each used to run the same `weight → min reps` arithmetic. `reps` stays
  `number | '–'` in the shared value rather than becoming 0 — the dash is what
  the table prints for a set logged at 0 kg, and only the button coerces it —
  so the display is unchanged for that case too.
- **Nothing on screen moved, which is the expected result.** `DELOAD_REP_FACTOR`
  *is* 0.7, and `r05` is a no-op on weights that are already half-kilos, so the
  literal and the helper agree digit for digit. The win is that there is one
  deload model instead of two, and it is the one carrying the grounding comment.

**Browser-checked on live data** (house rule `verify-in-browser`). There is no
active program today, so the plan surface is unreachable from real rows: a
`defaultProgram()` was put into the store with `useAppStore.setState` — memory
only, no write — first at week 1 and then with its start date shifted 35 days
back to reach week 6. Normal week: the plan printed the right last session for
all three exercises (Back Squat 2026-07-28, Bench Press 2026-09-01, Bicep Curls
2026-05-18), the targets table read `100×7 / 102.5×7 / 105×7`, `90×9 / 92.5×9 /
95×9`, `80×11 / 82.5×11 / 85×11` at +7.5 %, and the middle "Use" button filled
the log form with exactly `102.5×7 · 92.5×9 · 82.5×11` — the table and the button
agree, which is what computing once has to guarantee. Deload week: the badge and
four "Deload" buttons appeared, the single-exercise one prefilled Bicep Curls
`7.5×14 · 10×11 · 12.5×10 · 15×8` from a logged `7.5×20 · 10×16 · 12.5×14 ·
15×12`, and the superset one opened the logger with Bench Press `40×21, 60×11,
70×3, 50×11` beside those same curls — every rep `round(reps × 0.7)`, every
weight untouched. The Weights edit modal still filled its sets grid from a real
row (`40kg×30 · 60kg×16 · 70kg×4 · 50kg×16`), which is the check that moving
`toSetStr` did not break the other file that uses it. Zero console errors, and
nothing was saved.

### B4. `fmtSets` ×4, `fmtAgo` ×5, `QUALITY_LABELS` ⊂ `QUALITY_SHORT` (−15)

- **Where:** originals in `tabs/adaptations/labels.ts:37-40` and `:9-17`; copies
  at `home/HomeTab.tsx:25`, `home/MuscleSheet.tsx:17`, `home/GapMap.tsx:91-93`;
  inline `today / d ago` ternaries at `HomeTab.tsx:58,88,183,218` and
  `MuscleSheet.tsx:89`; `MuscleSheet.tsx:34-39`.
- **Change:** move `fmtSets`/`fmtAgo` to `lib/utils.ts` (home importing from
  adaptations would invert the existing GapMap → adaptations direction);
  MuscleSheet uses `QUALITY_SHORT`.
- **Risk:** low.

### B10. Tone constants duplicated instead of exported once (−10)

- **Where:** `MICRO` at `ProgramTab.tsx:21` = `weights/TodaysPlan.tsx:40`;
  `ACT_CHIP` at `TodaysPlan.tsx:42-43` = `weights/ExPlan.tsx:12-13` = the "Use"
  button class at `VolumeRow.tsx:82`; the `FIELD_LABEL` string re-typed at
  `TodaysPlan.tsx:157`, `ExPlan.tsx:77`, `admin/ExerciseMuscleEditor.tsx:219`,
  `AdminTab.tsx:17`, `layout/Drawer.tsx:23`, `assistant/AssistantPanel.tsx:69`;
  the 0.10em micro-label literal at `WeightsTab.tsx:324`, `TodaysPlan.tsx:87,249`,
  `MobilityTab.tsx:111`, `cardio/SportProgress.tsx:30`.
- **Change:** export `MICRO` and `ACT_CHIP` from `ui/Badges.tsx` / `ui/Fields.tsx`;
  replace the literals with `FIELD_LABEL` / `FieldLabel`.
- **Risk:** low.

### B11. Inline SVGs for glyphs `ui/Icon` already has (−15)

- **Where:** `home/MuscleSheet.tsx:243-245, 338-340` (plus), `:258-260` (close),
  `home/BottomSheet.tsx:52-54` (close). Not yet in the set: search
  (`MuscleSheet.tsx:295-297`), heart (`HomeTab.tsx:252-254`), pause
  (`HomeTab.tsx:286-288`). The verdict path at `MuscleSheet.tsx:139-141` stays.
- **Change:** `<Icon name="plus" size={16} />` at the four sites (stroke width
  1.8 vs 2 is the only difference); add `search`/`pause`/`heart` paths if
  `Icon.tsx` is to remain "the whole set" as its header says.
- **Risk:** low. **Visual**, tiny.

### B12. `RowActions` exists but two lists hand-write it (−8)

- **Where:** `cardio/SessionList.tsx:41-49` (the component); `WeightsTab.tsx:362-366`,
  `MobilityTab.tsx:260-264`.
- **Change:** move to `ui/` next to `EditBtn`/`DelBtn`; MobilityTab keeps its
  "min total" span as a leading child.
- **Risk:** low.

### B13. ProgramTab small dead and doubled bits (−20)

- **Where:** `ProgramTab.tsx:80` a `useState` that is never set (read
  `draft.weeklyPrinciples`); `:885` and `:888` the same filter twice; `:407-408`
  `supersets.some` twice per tile; `:845-866` two template buttons with
  identical JSX.
- **Change:** inline, compute `pastCycles` once, hoist `inSS`, map the two
  buttons the way `ProfileTab.tsx:203-215` does.
- **Risk:** low.

### B15. `[...new Set(xs)].sort()` nine times (−8)

- **Where:** `WeightsTab.tsx:47`, `cardio/SportLogForm.tsx:38-40`,
  `cardio/SessionList.tsx:134`, `cardio/SportProgress.tsx:47,62`,
  `MobilityTab.tsx:33,92`, four in `ui/EditModal.tsx`. `allSports` alone is
  derived in four components.
- **Change:** `uniqSorted(xs)` in `lib/utils.ts`; optionally a memoised
  `sportNames` selector in the store.
- **Risk:** low.

### C1. The two Garmin scripts share two helpers by copy (−20)

- **Where:** `scripts/garmin-sync/sync_activities.py:52-53,107-123` and
  `sync_sleep.py:39-41,71-87`: `_as_int` and the Supabase REST `upsert` are
  identical except for table name and conflict key.
- **Change:** `supabase_upsert(table, on_conflict, rows)` and `as_int` in
  `garmin_auth.py` (which already exports `env`), imported by both.
- **Risk:** low. No tests; the next scheduled run is the check
  (`scripts/garmin-sync/README.md`).

## Tier 2 — medium, or needs a browser check

### S1. One save-and-toast helper (−120) — the biggest single win

- **Where:** every handler is `try { await storeAction(); setToast(ok) } catch {
  setToast('Failed…') }`: `ProgramTab.tsx:749-815` (seven wrappers, then
  threaded into `ProgramCard`/`ProgramHistoryCard` as `onAdvance/onRestart/
  onPause/onDelete/onResume`, none of which touches ProgramTab state);
  `ui/EditModal.tsx:88-98, 121-134, 167-177, 213-230, 303-318, 394-418, 523-532,
  563-573, 617-627, 677-687` (save) and `:629-637, 689-697` (delete), each form
  also re-declaring `{ record, onClose, saveRef }` and `saveRef.current = save`,
  dispatched by an 11-branch `&&` chain at `:767-799`; `CardioLogForm.tsx:24-35`,
  `SportLogForm.tsx:58-79`, `MobilityTab.tsx:67-75`, `WeightsTab.tsx:112-128`.
  The store itself has no error handling (one `try`, at `store/app.ts:225`, for
  bootstrap), so the shape is re-typed about 37 times.
- **Change:** `withToast(fn, ok, fail)` next to `setToast` in the store. The two
  Program cards read their actions from `useAppStore` and call it; only `onEdit`
  stays a prop. In EditModal: `useSave(saveRef, onClose)` returning the wrapped
  runner, a shared `FormProps<T>`, and a `Record<EditModalTarget['type'],
  Component>` lookup instead of the chain.
- **Size:** medium; land as two commits (store helper + tabs, then EditModal).
- **Risk:** low but wide. **Visual:** one edit form per entry kind, one program
  action.

**Part 1 landed 2026-09-08 (v2.0.65)** — the store helper and the five tab
files. −53 lines across six files; first paint +0.12 kB (the helper itself),
well inside budget. Twelve of the ~37 copies are gone; the other ~25 are
EditModal's, which is part 2.

- **`withToast(fn, ok, fail?)` puts the *whole* success path inside `fn`** — the
  write and the form reset that follows it — rather than only the write. That is
  what keeps a failed save from clearing the form, and it is the one behavioural
  question the refactor had to answer. Verified in the browser by cutting the
  database off mid-save (see below). `fail` defaults to `'Failed to save.'`,
  which is what nine of the twelve call-sites passed by hand. It never throws;
  it returns `true` when `fn` completed, so a caller that owns extra state can
  still branch on the result.
- **The two Program cards now read their own actions.** `ProgramCard` and
  `ProgramHistoryCard` take `advance`/`restart`/`pause`/`remove`/`resume` and
  `withToast` from `useAppStore` with per-action selectors and build their own
  handlers; only `onEdit` stays a prop, because it opens ProgramTab's editor.
  Six of ProgramTab's seven wrappers went with them, and the tab's own
  destructure dropped five store fields. Selectors rather than a bare
  `useAppStore()` on purpose — that is the direction B14 sets, and these are
  stable action references.
- **A small dedupe fell out.** `ProgramCard` computed
  `(currentDayIndex + 1) % days.length` twice — once for the "up next" line and
  once inside the advance handler that moved in. One `nextIndex` now serves both.
- **Note for part 2:** all 16 remaining `npm run lint` warnings are EditModal's
  `saveRef.current = save` during render (`react-hooks/refs`). The `useSave`
  hook this entry proposes is the natural place to fix them, so part 2 should
  take the warning count to zero rather than just shortening the file.

**Part 2 landed 2026-09-08 (v2.0.66)** — EditModal, −81 lines (827 → 746), and
`npm run lint` no longer reports anything in the file. The ~25 remaining copies
of the save-and-toast shape are gone, along with both delete copies. What the
entry proposed above is *not* what shipped, and the two departures are the
useful part of this record:

- **The `saveRef` prop is gone entirely, not wrapped in a hook.** This entry
  proposed `useSave(saveRef, onClose)` — keeping the ref and threading it
  through 11 forms. React's own lint rules object twice: assigning
  `saveRef.current` during render is the `react-hooks/refs` warning, and once
  that assignment moves into an effect the rule *still* objects to a ref
  travelling as a prop at all ("passing a ref to a function may read its value
  during render"). What satisfies both is a module-level `saveSlot = { run }`
  that the open form fills in an effect and the footer calls. It is safe here
  for a reason worth stating: EditModal is mounted once in AppShell and the
  store holds one `editModal`, so exactly one form is ever live. Every form's
  props dropped from three to two, and `FormProps<T>` replaced eleven
  hand-written `{ record; onClose; saveRef }` inline types.
- **The `Record<type, Component>` lookup was tried and reverted.** With the save
  wiring out of the props each branch of the dispatch chain is one line, so the
  chain is 11 lines against ~23 for the map — and the map needs a cast, because
  TypeScript cannot follow a discriminant through an index lookup. It also trips
  a third React rule, `react-hooks/static-components`, as an **error**: picking
  a component into a local during render is indistinguishable, to the linter,
  from defining one there. The exhaustiveness the map would buy is bought
  instead by typing `TITLES` as `Record<EditModalTarget['type'], string>` — one
  word — so a new `EditModalTarget` variant is still a compile error.
- **The lint note above was wrong: 10 of the 16 were EditModal's, not all 16.**
  The other six are the ones
  [023](done/023-mechanical-code-quality-tooling.md) triaged and kept on purpose
  — `react-refresh/only-export-components` ×3, `exhaustive-deps` ×2 and
  AssistantSettings' `set-state-in-effect`. `npm run lint` now reports **6
  warnings, 0 errors**, which is 023's accepted floor. Zero was never reachable
  from this entry.
- **`weight-superset` now carries `record`, not `records`.** One field name
  across all 11 union variants is what lets a single `FormProps<T>` serve every
  form; for that one variant the record is a pair. One line in
  `src/types/index.ts` and one call site in `WeightsTab`.
- **The validity guard had to stay outside the toast.** Every form had an early
  `return` above its `try` — an empty required field is a no-op, not a failure,
  and must not print "Failed to update." That is `useSave`'s `ready` argument,
  and it is the reason the hook takes four arguments rather than two.

### A4. The 5-line load and 3-line delete shape in eight db files (−45)

- **Where:** loads at `bodyweight.ts:6-18`, `water.ts:6-18`, `donations.ts:6-19`,
  `cardio.ts:34-42`, `recovery.ts:38-46,98-106`, `sport.ts:31-38,40-46`; deletes
  at `cardio.ts:62-65`, `bodyweight.ts:33-36`, `water.ts:34-37`,
  `donations.ts:41-44`, `mobility.ts:108-111`, `sport.ts:100-103`,
  `recovery.ts:81-84,137-140` (all under `src/lib/db/`). Every load is
  `.from(t).select(cols).eq('user_id', USER_ID).order(dateCol, desc)` + throw;
  every delete is `.from(t).delete().eq('id', id)` + throw.
- **Change:** `userRows(table, cols, dateCol)` and `deleteRow(table, id)` in a
  tiny `src/lib/db/_rows.ts`; each domain keeps its own `map`. Two functions,
  not an ORM — CLAUDE.md's "no repository abstraction" still holds.
- **Risk:** low; pure plumbing, untested layer.

**Landed 2026-09-08 (v2.0.68), together with A5** — one commit, because both
entries edit the same eight files and splitting them would have meant touching
each file twice. −89 lines from the ten files against +32 for `_rows.ts` (22 of
which are comment), so −57 net; first paint fell 2.68 kB to 349.79 kB. Two
departures from what this entry proposed:

- **`cols` had to be generic over its own literal type, not `string`.** PostgREST
  parses the select string at the *type* level — that is where the returned rows
  get their column names — so a parameter typed plain `string` collapses every
  row to `GenericStringError` and every `r.some_column` in the callers stops
  compiling. `sport.ts` already carried a comment saying why its select must be
  one literal; the helper would have broken exactly what that comment protects.
  One type parameter (`userRows<Q extends string>`) passes the literal through
  and keeps the checking the inline queries had. The cost is that a call site
  must still pass a literal, so `cardio.ts`'s concatenated `COLS` became a single
  line — it had silently lost its column checking to that concatenation.
- **`dateCol` is optional**, because `loadSportTypes` reads a lookup table with
  no date to sort by. That is the eighth load this entry lists.

**Ten files, not eight.** `mobility.ts`'s load (it sits inside a `Promise.all`,
which is why the hand-read pass missed it), `weights.ts`'s load and its
`session_exercises` delete, and `muscles.ts`'s delete are the same two shapes;
leaving them would have left two ways of doing one thing, which is the opposite
of the point. Deliberately left alone: the three deletes that **ignore** their
error (`program.ts` ×2 and `weights.ts`'s two `training_sessions` cleanups) —
routing those through `deleteRow` would make them start throwing, which is a
behaviour change, not a simplification; and `program.ts`'s loads, which carry
`.in()` clauses, status filters and their own orders.

### A5. Row ↔ entry mapping duplicated inside four db files (−45)

- **Where:** `sport.ts:47-59` vs `:85-97` (row → entry) and `:70-81` vs
  `:113-124` (entry → row); `donations.ts:13-18` vs `:33-38`, `:26-28` vs
  `:53-55`; `cardio.ts:48-55` vs `:73-80` (has `toEntry` but writes its insert
  payload twice); `recovery.ts:55-60` vs `:72-75`. `constants/app.ts:29-34,43-46`
  `CARDIO_TYPE_REVERSE`/`DONATION_TYPE_REVERSE` are hand-inverted copies, and
  the `?? x.toLowerCase()` fallbacks at `cardio.ts:50,75`, `donations.ts:27,54`
  are unreachable for a closed union.
- **Change:** one `toRow` + one `toEntry` per file used by load/save/update;
  derive the reverse maps with `Object.fromEntries(Object.entries(MAP).map(
  ([k, v]) => [v, k]))`; drop the fallbacks.
- **Risk:** low.

**Landed 2026-09-08 (v2.0.68) with A4.** Every file named now has one `toRow`
and one `toEntry` (`recovery.ts` has two of each — sleep and the sauna/cold
pair). `invert()` in `constants/app.ts` derives both reverse maps. Three things
this entry got half-right, and the corrections are the useful part:

- **Only the *forward* fallbacks were dead. The reverse ones are load-bearing.**
  On the way *in*, `?? entry.type.toLowerCase()` is unreachable because
  `entry.type` is a closed union — and typing the maps
  `Record<typeof CARDIO_TYPES[number], string>` now makes that a compile-time
  fact rather than a hope: adding a sixth cardio type without extending the map
  is an error. On the way *out*, the same-looking `?? r.activity_type` reads the
  **database**, and `cardio_sessions_activity_type_check` permits **ten** values
  against `CARDIO_TYPES`' five — walking, hiking, elliptical, jump_rope, other.
  Nothing writes those today, but the constraint says a row may hold one, and
  without the fallback the history would render `undefined`. Both readers keep
  theirs, with a comment saying which case it is for; that is also why the
  derived reverse maps stay `Record<string, string>`.
- **`sport.ts` lost its second mapper by widening the insert's returning
  clause**, which this entry did not anticipate. The save hand-wrote a 13-line
  row → entry copy only because its `.select(...)` was narrower than the load's
  and had no `sport_types(name)` join, so the sport name had to come from the
  argument instead of the row. Selecting the same `COLS` on the insert returns
  the embed too, and one `toEntry` now serves both. Browser-checked, because an
  embedded select on an insert-returning is the one genuinely new query shape
  here: the created row came back with `sport: "Tennis"` from the join.
- **`saveSleepEntry` still skips `withOrigin`.** The refactor moves that upsert's
  payload into `sleepRow()` and deliberately does not fix the missing origin tag
  — that is a behaviour change listed under *Found on the way*, and it needs a
  decision rather than a silent ride-along in a simplification.

**Browser-checked on live data** (house rule `verify-in-browser`; this is the
whole data layer, so a regression pass, not a spot check). Bootstrap loaded all
eleven store lists through `userRows` — 212 weights, 220 cardio, 53 sports, 5
sport types, 3 mobility, 11 bodyweight, 38 water, 1 donation, 19 sleep, 0 sauna,
0 cold (the two zeroes are real: no rows exist) — and Home drew its body map,
readiness gauge and fold tiles unchanged. Writes were tested without disturbing
the user's data: a cardio row and a sleep row each saved back to their own values
and compared identical field-for-field afterwards (`toRow` / `sleepRow` on the
update path), and one sport row was created, read back and deleted, leaving the
count at 53 with nothing left behind after a full reload (`toEntry` on the new
insert-embed, plus `deleteRow`). Zero console errors.

### B5. `Recent` duplicated; five sheets hand-build the header (−45)

- **Where:** `home/RecoverySheet.tsx:143-164` = `home/FoldSheet.tsx:139-160`;
  headers at `FoldSheet.tsx:27-31`, `RecoverySheet.tsx:32-36`,
  `adaptations/MuscleListSheet.tsx:26-35`, `adaptations/RxSheet.tsx:19-26`,
  `home/MuscleSheet.tsx:130-134`. `BottomSheet` takes `label` for `aria-label`
  only; every caller re-renders the eyebrow, a `grow` spacer and `SheetClose`.
- **Change:** export `Recent` from `BottomSheet.tsx` beside `Chip`/`SheetClose`;
  optional `title`/`sub` props on `BottomSheet` that render the header.
- **Risk:** low. **Visual:** open each sheet.

### B6. Two identical stepper captures (−30)

- **Where:** `home/RecoverySheet.tsx:97-139` (`SleepRow`) and
  `home/FoldSheet.tsx:65-107` (`WeightCapture`): big number + unit, four ± chips,
  one solid "Log" chip, `Recent`, footnote. Only rounding (`roundHalf` vs
  `roundTenth`), steps, unit and `onLog` differ.
- **Change:** `StepperCapture({ value, unit, steps, round, onLog, recent, note })`.
- **Risk:** low–medium. **Visual.** Pairs with B5.

### B7. WeightsTab rebuilds its history on every keystroke (perf, +6)

- **Where:** `weights/WeightsTab.tsx:47-48, 131-159`. Form state and derived
  history share one component, so each keystroke re-sorts `weights`, rebuilds
  `exercises`/`pickerNames`/`chartData` and re-runs `recentGrouped`, whose
  `allWeightsSorted.find` inside the loop (`:151`) is O(n²).
- **Change:** `useMemo` on `[weights]` for the four derived values; pair
  supersets through a `Map<supersetId, WeightEntry[]>`.
- **Risk:** low.

### B8. `weights` and the variant toggle threaded past the store (−20)

- **Where:** `weights/TodaysPlan.tsx:24, 67-70, 142-147, 172-176, 233` (`weights`
  through four levels), `WeightsTab.tsx:28,169`, `ProgramTab.tsx:458-459,651-654`;
  the variant wiring duplicated at `ProgramTab.tsx:875-876` and
  `WeightsTab.tsx:170-171`; the same base/variant `Chip` pair at
  `ProgramTab.tsx:565-570` and `TodaysPlan.tsx:250-255`.
- **Change:** leaves that need `weights` read `useAppStore(s => s.weights)`;
  `activeVariantWeekdays(weekOverrides, id)` behind a store selector. The four
  `PickHandlers` stay: they set WeightsTab's local form state.
- **Risk:** low.

### B9. Three copies of the Recharts line-chart scaffold (−35)

- **Where:** `WeightsTab.tsx:276-305`, `CardioTab.tsx:62-98`,
  `MobilityTab.tsx:229-246`, the bar variant at `cardio/SportProgress.tsx:109-122`;
  the `length > 1 ? … : <EmptyMsg>` guard at all four.
- **Change:** `TrendChart({ data, series, yWidth, formatter, dot? })` beside
  `ui/chart.ts`; Weights and Mobility become ~8 lines each. Leave Cardio's
  dual-axis chart unless `yAxisId` support is cheap.
- **Risk:** medium. **Visual:** Recharts needs a few seconds before a screenshot
  is trustworthy.

### B14. Whole-store subscriptions in 17 components (perf, no line delta)

- **Where:** `useAppStore()` with no selector in ProgramTab, WeightsTab,
  MobilityTab, HomeTab, MuscleSheet, FoldSheet, RecoverySheet, CardioLogForm,
  SportLogForm, SessionList (`:52,87` — every row subscribes), SportProgress,
  AdaptationsTab, the three admin editors, ImportPane, ExportPane. Zustand 5
  re-renders a selector-less subscriber on any store write, including the two
  writes `setToast` makes (`store/app.ts:217-220`).
- **Change:** `useAppStore(s => s.x)` per field, or `useShallow` for a
  destructured set; rows select only their two actions (stable refs).
- **Risk:** low.

## Tier 3 — medium risk, a behaviour change, or a redeploy

### A7. `store/app.ts` CRUD triplets (−80)

- **Where:** `src/store/app.ts:359-378` (bodyweight), `:381-392` (cardio),
  `:438-449` (donations), `:463-470` (water), `:473-524` (sleep/sauna/cold).
  Seven domains carry the same `add = prepend / remove = filter / edit =
  map-merge`; sleep/sauna/cold add a `.sort(date desc)`, cardio/donations/water
  do not, so a back-dated cardio add lands at the top of `HistoryList` (which
  shows the first 3). Weights, mobility (`applyMuscleTags`), sports (type flags)
  and water-add (merge) genuinely differ.
- **Change:** `listActions<T>(key, { save, del, update })` that always sorts by
  date desc, spread into the store for the seven; keep the four special ones.
  Bonus: the 11 setters at `:64-74/206-216` serve one caller
  (`ImportPane.tsx:114-123`) and could be one `replaceLists(partial)`.
- **Risk:** medium: no store tests, and the sort unification is a small
  (benign) behaviour change. **Visual:** add a back-dated cardio session.

### A9. Bootstrap loads the program tree twice (−25, ~7 fewer round-trips)

- **Where:** `src/lib/db/program.ts:192-229` (`loadProgramRows`), `:448-471`
  (`loadWeekOverrides`), `:580-626` (`loadProgramCycles`); called from
  `store/app.ts:229-231` and `:336`. `user_programs` is selected three times and
  `loadPhasesForPrograms` (5 queries) runs twice on overlapping ids;
  `loadProgramCycles` already builds the shapes for every program.
- **Change:** one `loadProgramData()` returning `{ active, cycles, overrides }`
  from a single `user_programs` select and one `loadPhasesForPrograms`;
  `resumeActiveProgram` calls the same.
- **Risk:** medium: bootstrap path, no tests. **Visual:** cold start, Program
  tab, resume a paused program.

### C2. The two edge functions duplicate their scaffolding (−25, redeploy)

- **Where:** `supabase/functions/assistant-chat/index.ts:12-20,184-192` and
  `assistant-settings/index.ts:12-21,42-61`: `USER_ID`, `cors`, `json`, the
  `createClient` call and the `assistant_settings` select. The `'gemini'` and
  `'gemini-2.5-flash'` defaults appear nine times between them; the three
  mutating branches in settings each end with the same `if (error) … return
  json(statusOf(await read()))`.
- **Change:** `supabase/functions/_shared/http.ts` (cors, json) and
  `_shared/settings.ts` (USER_ID, defaults, `readSettings`); a `mutate(fn)`
  helper in settings.
- **Risk:** low code-wise, but both functions must be redeployed and smoke-tested
  from the in-app assistant. Do it only when next touching them.

## Found on the way — not simplifications

Each is a fact, recorded so it is not lost. None is committed work; a brief or a
decision is the next step.

- **`saveSleepEntry` skips the origin tag.** `src/lib/db/recovery.ts:52-61`
  upserts without `withOrigin(...)`, while the insert at `:111` in the same file
  has it. A night that Garmin already created keeps its origin (the trigger is
  write-once), but a night logged first from dev or staging lands untagged, i.e.
  as production — a gap in 037's "every user-write root row" guarantee. One-line
  fix; needs a bug brief or Peter's OK to just do it.
- **`weekStartDay` is ignored** at `store/app.ts:348`, `lib/db/program.ts:449`,
  `ProgramTab.tsx:487`, `TodaysPlan.tsx:177`. A behaviour decision, not a cleanup.
- **The flat-`exercises` fallbacks look dead but are not** (`ProgramTab.tsx:374-392,
  424-438`, `TodaysPlan.tsx:48-50`, `normalizeDays`/`flatToBlock`):
  `lib/db/program.ts:148-153` still builds days from `block_id === null` rows and
  `defaultProgram()` (`lib/utils.ts:114-131`) ships no `blocks`. Removing them
  needs a backfill migration — its own brief, near [025](done/025-release-blocked-schema-drops.md).
- **CLAUDE.md said `CYCLE` was defined twice.** It is not: `utils.ts:5` imports
  it from `constants/app.ts`. Corrected in the commit that filed this brief.
- **The 1RM estimator ships ungrounded and has no brief.** Found while landing
  A1 (2026-09-08). `estimate1RM` averages Epley and Brzycki and WeightsTab
  prints "≈NNkg 1RM" next to a logged entry, so a number claiming physiological
  meaning is on screen. [grounding-inventory §8](../grounding-inventory.md)
  already carries it — 8.1 Epley, 8.2 Brzycki, 8.4 the unweighted mean — all
  `unknown`, all marked **(no brief)**, and 8.4 notes the averaging step is
  Tekiō's own invention rather than a published estimator. The inventory is
  reference, so "(no brief)" was the tracking gap: nothing in `docs/roadmap/`
  listed it, which meant `/roadmap` could not see it. **Now filed as
  [067](067-ground-1rm-estimator.md)** (backlog — it needs Peter's decision
  first: ground the three formulas, or delete a number nothing reads back), and
  the three inventory rows point at it instead of saying "(no brief)".

## Skipped on purpose

- **`USER_ID` plumbing in every query** — expires with the general-use objective
  (auth after 2.0.0); a helper now would be replaced.
- **`getOrCreateUser` and `loadSectionConfig` seed upserts on every bootstrap** —
  deliberate per CLAUDE.md.
- **Two `Chip`s** (`ui/Chip.tsx` vs `home/BottomSheet.tsx:59-77`) — unselected
  tones differ; merging changes what Home sheets look like. A design call.
- **`ui/Modal` vs `BottomSheet`** — `BottomSheet.tsx:4-6` says the split is
  deliberate until the old tabs are restyled.
- **Splitting `ProgramTab.tsx`** — `ProgramEditor` (`:72-356`) would move cleanly
  to `tabs/program/`, but the move alone removes nothing. Do it only while
  landing S1 and B13.
- **Lazy-sheet + prefetch idiom** (`HomeTab.tsx:19-21,117-125`,
  `AdaptationsTab.tsx:25-27,44-52`, `AppShell.tsx:45,75-79`) — a hook saves under
  20 lines for a new file.
- **`ImportPane.applyData` and the three admin editors call `lib/db` directly** —
  altitude on paper, but each is the sole caller, so moving them is a pure move.
- **HomeTab `gateCols` vs `foldTiles`** (`:162-179`, `:191-207`) — WATER/BLOOD
  appear in both with different fields; two reads, not one duplicate.
- **`SessionEditForm` sauna/cold wrappers, `HISTORY_WEEKS`/`TE_STIMULUS_THRESHOLD`
  exported-but-internal** — a few lines each, not worth the churn.
- **Leftover habits tables, `deleteMuscleGroup` comment** — roadmap 025.

## Acceptance

Tier 1:

- [x] A1 dead exports and duplicated constants — 2026-09-08, v2.0.63. `knip` reports zero; `DELOAD_WEEK` kept and the `duplicates` check excluded with its reasoning in `knip.jsonc`
- [ ] A2 `weights.ts` imports `getOrCreateExercise`, one `deleteSessionIfEmpty`
- [ ] A3 one `daysBetween`
- [ ] A10 one `groupBy`
- [ ] A11 one `deriveFlat`
- [ ] A12 executor prelude
- [ ] A13 one profile select
- [ ] A14 type aliases, casts gone
- [x] A8 react-router removed, CLAUDE.md routing paragraph updated — 2026-09-08, v2.0.58 (via roadmap 023 item 0)
- [x] B2 `lastPerformance` + `toSetStr` shared — 2026-09-08, v2.0.69. Browser-checked at week 1 and week 6; the third argument is a list of program start dates, and the converters live in a new `lib/sets.ts` so the lint floor stays at 6
- [x] B3 dead deload branch gone, `DELOAD_REP_FACTOR` used in WeightsTab — 2026-09-08, v2.0.69. Each tier computed once and read by both the table and its Use button; the numbers on screen are unchanged, as predicted
- [ ] B4 `fmtSets`/`fmtAgo` shared, `QUALITY_SHORT` reused
- [ ] B10 tone constants exported once
- [ ] B11 inline SVGs replaced by `Icon`
- [ ] B12 `RowActions` in `ui/`
- [ ] B13 ProgramTab small bits
- [ ] B15 `uniqSorted`
- [ ] C1 Garmin helpers shared

Tier 2:

- [x] S1 save-and-toast helper (store + tabs) — 2026-09-08, v2.0.65. Browser-checked: Resume→Pause round trip on a live program printed both toasts and left the database as it was; a Weights save with the database cut off printed "Failed to save." and left the form filled
- [x] S1 save-and-toast helper (EditModal) — 2026-09-08, v2.0.66. Browser-checked on live data: a sleep entry saved unchanged ("Updated!", modal closed); the same save with the API cut off printed "Failed to update." and left the modal open with every value intact; clearing a required field made Save a no-op with no toast; "Delete entry" with the API cut off printed "Failed to delete."; the superset form, driven through the store because the history holds none, rendered both exercises and kept its eight set rows on a failed save. Zero console errors
- [x] A4 `userRows` / `deleteRow` — 2026-09-08, v2.0.68. Ten files, not eight; `cols` is generic over its literal type so the callers keep their column checking
- [x] A5 `toRow` / `toEntry`, derived reverse maps — 2026-09-08, v2.0.68. The forward fallbacks are gone and the maps are now total by type; the reverse fallbacks stay, because the `activity_type` constraint is wider than `CARDIO_TYPES`
- [ ] B5 sheet header + `Recent` shared
- [ ] B6 `StepperCapture`
- [ ] B7 WeightsTab memoised
- [ ] B8 `weights` read from the store in the leaves
- [ ] B9 `TrendChart`
- [ ] B14 selectors in the 17 components

Tier 3:

- [ ] A7 store `listActions`
- [ ] A9 one `loadProgramData`
- [ ] C2 edge-function `_shared/`, both redeployed

Housekeeping:

- [ ] The four "found on the way" items each have a brief or a recorded decision
- [ ] `npm run check:docs` passes before this brief moves to `done/`
