# Roadmap: Nutrition → Food Recovery Score (recovery-axis sub-project)

**Status:** planned — model validated, app integration not started
**Kickoff:** start a fresh session with this file as the brief.
**Origin:** 2026-07-14, spun out of the recovery-axis food/nutrition follow-up
([002-recovery-axis.md](002-recovery-axis.md)) once the user specified a full scoring
model. This is the "its own sub-project" the recovery axis deferred.

## Phase 1 — DONE (2026-07-14)

An interactive **Food Recovery Score (FRS) bench** was built and published as an
Artifact so the weightings/formulas can be tuned against sample days before they
harden into schema + code:

- Artifact: https://claude.ai/code/artifact/c2eb42af-8a67-483c-a880-105e44cb47f8
- Source lives in the session scratchpad (`frs-calculator.html`) — NOT in the
  repo. If you need it, re-fetch the artifact URL with WebFetch, or rebuild from
  the spec below (the spec IS the source of truth).

The bench validates: six sub-scores, adjustable weights (auto-normalised),
refinement toggles, cross-component interactions, 3-day smoothing, and four
sample-day presets (balanced / rest / big night out / under-fuelled cut).

## The model (source of truth — copy the math from here)

`FRS = 0.25·P + 0.20·E + 0.15·M + 0.15·H + 0.15·Q + 0.10·T`, each sub-score 0–100.

- **P — Protein adequacy (25%)**: `target_g = bodyweight_kg × g/kg` (g/kg
  1.6–2.2; 1.6 general, 2.0+ heavy training). `P = min(100, protein_g/target_g ×
  100)`. If distribution is uneven (a meal >60g while others near zero), ×0.9.
- **E — Energy balance (20%)**: `rel = (kcal − TDEE)/TDEE`; `E = clamp(100 − k·|rel|·100, 0, 100)`.
  Asymmetric penalty: `k = 2.5` for a deficit (`rel<0`), `1.5` for a surplus
  (symmetric `2.0` if the refinement is off). Under-fuelling hurts recovery most.
- **M — Micronutrient density (15%)**: proxy = `min(plant,5)/5×70 + min(fishPerWk,2)/2×30`.
  Swap for real RDA coverage (Mg, Zn, vit D, vit C, omega-3, iron, K) later.
- **H — Hydration (15%)**: `need = 33·kg` (+ sweat: `train_h·650 + sauna_min/60·650`
  when the refinement is on). `H = min(100, intake_ml/need × 100)`. Should read
  the existing **water** domain + **sauna**/training logs, not re-ask for intake.
- **Q — Food quality (15%)**: start 100; `−10·UPF_servings`, `−15·alcohol_drinks`;
  if added-sugar kcal >10% of total, `−2 pts per % over`; `+3 per polyphenol
  serving` capped +10. Clamp 0–100.
- **T — Nutrient timing (10%)**: mean of applicable booleans ×100 — protein+carbs
  within 2h post-training (training days only), no heavy meal within 2–3h of bed,
  carbs scaled to load.

**Cross-component interactions** (reach beyond nutrition — phase carefully):
- Alcohol >2 drinks → **sleep** sub-score ×0.85 (touches the RecoveryCard sleep
  sub-score, not FRS itself).
- Sweat (training + sauna) raises the hydration target (already in H).
- Post-workout timing only applies on training days (already in T).

**3-day smoothing**: nutrition affects recovery over days — blend
`0.5·today + 0.3·yesterday + 0.2·dayBefore` rather than a single-day snapshot.

## App integration workstream (Phase 2 — the actual build)

**BLOCKER:** the Supabase MCP was Unauthorized at kickoff (static-PAT issue — see
[[reference_supabase_mcp_reconnect]]). Reconnect it before the DB work:
regenerate PAT → update workspace-root `.mcp.json` → `/mcp reconnect`. Don't push
column-selecting frontend before the migration is live.

1. **Schema** — `nutrition_logs` exists server-side with 0 rows; its current
   columns are unknown (couldn't inspect). One row per day. Since it's empty,
   a clean `DROP … CREATE` migration defining exactly the inputs above is fine
   (mirror the MVP-open RLS policy the other recovery tables use — see
   `20260710130000_recovery_axis_sauna_cold_open_sleep.sql`). Store raw inputs
   (bodyweight optional — bodyweight domain already exists; protein_g, kcal,
   plant/fish servings, fluid handled via water, UPF/alcohol/sugar/poly,
   timing booleans, training flag) and compute FRS in the app, OR store a
   computed daily FRS + the inputs. Decide: compute-on-read vs. store-score.
2. **Types** — `NutritionEntry` in `src/types/index.ts`; add to `AppState`
   (`nutrition: NutritionEntry[]`) and the `EditModalTarget` union.
3. **DB layer** — `src/lib/db/recovery.ts` (or a new `nutrition.ts`):
   load/save/update/delete, upsert on `(user_id, log_date)` like sleep.
4. **Store** — `src/store/app.ts`: state + setter, add/remove/edit actions,
   bootstrap parallel-load (mirror the sleep/sauna/cold wiring added 2026-07-10).
5. **Scoring** — put the FRS math in `src/lib/utils.ts` (e.g. `foodRecoveryScore()`)
   with unit tests, mirroring `recoveryHabitSets()`/`muscleCoverage()` placement.
6. **Card** — add a **Nutrition** sub-score row to `RecoveryCard` and fold it into
   the readiness roll-up: extend `RECOVERY_ICONS/TARGETS/WEIGHTS` in
   `src/constants/app.ts` and **rebalance the weights** (currently sleep .45 /
   mobility .15 / sauna .15 / cold .15 / habits .10). New-Home-card icon
   convention applies (see [[feedback_tekio_home_card_icons]]).
7. **EditModal** — a `NutritionForm` (the card already follows the
   quick-add + tap-to-edit-chips → EditModal pattern).
8. **Export/Import** — add `nutrition` to `ExportPane`/`ImportPane` (sleep/sauna/
   cold were added 2026-07-14, commit 9f3ac0c; follow that exact pattern).

## Phasing / out of scope

- The bench models a lot at once. For the first app cut, consider shipping P/E/Q/T
  (pure nutrition inputs) + reusing water/sauna for H, and deferring the M real-
  RDA tracking and the alcohol→sleep cross-effect to a follow-up.
- Full macro/meal-level logging (per-meal breakdown, barcode, a food database) is
  explicitly **not** in scope — this is a daily-rollup recovery signal.

## Related code

- `src/components/tabs/home/RecoveryCard.tsx` — the readiness roll-up + sub-rows
- `src/constants/app.ts` — `RECOVERY_ICONS/TARGETS/WEIGHTS`
- `src/lib/db/recovery.ts` — sleep/sauna/cold DB pattern to mirror
- `src/lib/utils.ts` — `recoveryHabitSets()` (nearest analogue for the scorer)
- `src/components/layout/{ExportPane,ImportPane}.tsx` — data portability
