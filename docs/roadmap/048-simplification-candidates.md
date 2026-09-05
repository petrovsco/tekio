# Roadmap: Simplification candidates — a ranked list for `/simplify`

**Label:** infra
**Status:** planned — the review is done (2026-09-05, v1.18.4, commit 00b90b7)
and no code has changed. Each candidate below is one atomic unit a later session
lands with `/simplify`; tick its box in Acceptance when it ships. Committed to
2.1.0 by Peter on 2026-09-05 as spare-time units.
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
- **Risk:** low. Overlaps [023](023-mechanical-code-quality-tooling.md), whose `knip`
  run would find the same exports; doing it by hand now costs little and 023
  then confirms zero.

### A2. `weights.ts` copies `program.ts` and itself (−22)

- **Where:** `src/lib/db/weights.ts:6-18` is `getOrCreateExercise` verbatim from
  `src/lib/db/program.ts:10-22` (`mobility.ts` already imports program's);
  `weights.ts:136-144` and `:182-190` both count remaining `session_exercises`
  and delete the session at zero.
- **Change:** import from `./program`; extract `deleteSessionIfEmpty(sessionId)`.
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

- **Where:** `src/types/index.ts:102` `SportType` is a closed union while sports
  are dynamic (`sport_types` table, free-text input), so every producer casts
  (`sport.ts:50`, `EditModal.tsx:377,402`, `ImportPane.tsx:71`,
  `SportLogForm.tsx:60-61` `as any`); `:20/186` `CardioType`/`DonationType`
  restate the const arrays in `constants/app.ts:20,36`; `:103/143`
  `QualityRating` = `SleepQuality`; `:167-184` `SaunaEntry` = `ColdEntry`;
  `:122-131` `NewSportFlags` = `Omit<SportTypeInfo,'name'>`.
- **Change:** `sport: string`; `CardioType = typeof CARDIO_TYPES[number]`
  (constants/app has no type import, so no cycle); aliases for the rest.
- **Risk:** low.

### A8. React Router carries zero routes (−8, −1 dependency)

- **Where:** `src/App.tsx:2,57-63`, `src/main.tsx:3,9-11`, `package.json:23`.
  The only usage is `<BrowserRouter>` around `<Route path="*">`; navigation is
  `useState`.
- **Change:** drop the wrapper and the package; render `<Suspense>` directly.
  Update the "Routing and navigation" paragraph in `CLAUDE.md`.
- **Risk:** low. Bundle shrinks.

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
  needs a backfill migration — its own brief, near [025](025-release-blocked-schema-drops.md).
- **CLAUDE.md said `CYCLE` was defined twice.** It is not: `utils.ts:5` imports
  it from `constants/app.ts`. Corrected in the commit that filed this brief.

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

- [ ] A1 dead exports and duplicated constants
- [ ] A2 `weights.ts` imports `getOrCreateExercise`, one `deleteSessionIfEmpty`
- [ ] A3 one `daysBetween`
- [ ] A10 one `groupBy`
- [ ] A11 one `deriveFlat`
- [ ] A12 executor prelude
- [ ] A13 one profile select
- [ ] A14 type aliases, casts gone
- [ ] A8 react-router removed, CLAUDE.md routing paragraph updated
- [ ] B2 `lastPerformance` + `toSetStr` shared
- [ ] B3 dead deload branch gone, `DELOAD_REP_FACTOR` used in WeightsTab
- [ ] B4 `fmtSets`/`fmtAgo` shared, `QUALITY_SHORT` reused
- [ ] B10 tone constants exported once
- [ ] B11 inline SVGs replaced by `Icon`
- [ ] B12 `RowActions` in `ui/`
- [ ] B13 ProgramTab small bits
- [ ] B15 `uniqSorted`
- [ ] C1 Garmin helpers shared

Tier 2:

- [ ] S1 save-and-toast helper (store + tabs)
- [ ] S1 save-and-toast helper (EditModal)
- [ ] A4 `userRows` / `deleteRow`
- [ ] A5 `toRow` / `toEntry`, derived reverse maps
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
