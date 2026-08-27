# Roadmap: v1.1 — Real RLS + Auth

**Status:** planned — not started
**Kickoff:** start a fresh session with this file as the brief.
**Origin:** 2026-07-08 Supabase security alert (`rls_disabled_in_public`). The
critical error was cleared (RLS enabled on `adaptation_targets`), but the
underlying open-access posture below remains and is the real work.

## Problem

The database is effectively public. The anon key ships in the client bundle
(`VITE_SUPABASE_ANON_KEY`), and ~41 tables carry a policy literally named
`MVP open — tighten in v1.1` that is `USING (true) WITH CHECK (true)` for `ALL`
roles. RLS is "enabled" but unlatched — anyone with the project URL + anon key
can read/edit/delete every row. Supabase flags these as `rls_policy_always_true`
(the WARN pile in `get_advisors(security)`).

This is acceptable **only** because the app is single-user with no auth and a
hardcoded `USER_ID`. It is not acceptable once the app is shared or holds data
worth protecting.

## Goal

Replace the open policies with `auth.uid()`-scoped policies backed by a real
Supabase Auth session, so each row is bound to its owner and the anon key alone
grants nothing.

## Workstream (order matters)

1. **Auth flow** — introduce Supabase Auth (email magic-link or OAuth). Replace
   the hardcoded `USER_ID` in `src/constants/app.ts` with the session user.
   This is the largest app-side change: every file in `src/lib/db/` assumes the
   constant.
2. **Ownership columns** — audit which tables have a `user_id`/owner FK vs. rely
   on the singleton assumption. Backfill `user_id` where missing (one existing
   user → trivial backfill, but must land before tightening policies).
3. **Policy migration** — per table, drop `"MVP open — tighten in v1.1"` and add
   scoped policies (`select/insert/update/delete` with `user_id = auth.uid()`).
   Reference/lookup tables (`muscle_groups`, `movement_patterns`, `skill_types`,
   `adaptation_targets`, etc.) likely become **read-all, write-restricted**
   rather than user-scoped.
4. **Edge functions** — the 2 live functions + `assistant_settings` currently run
   with `verify_jwt` off. Flip `verify_jwt = true` once sessions exist. Note
   `assistant_settings` already has RLS-on/no-policy (deny-all) by design.
5. **Verification** — re-run `get_advisors(security)`; target zero
   `rls_policy_always_true` warnings. Add a smoke test proving the anon key can
   no longer read another user's rows.

## Sequencing

1 → 2 → 3 must land **together per table** — tightening a policy before auth +
backfill locks the app out. Validate on a Supabase branch DB before prod
(the live project holds real single-user data; confirm any DDL first).
Estimate: ~2–3 focused sessions; the auth wiring dominates.

## Already done (2026-07-08)

- `adaptation_targets`: RLS enabled + matching MVP-open policy (cleared the
  critical `rls_disabled_in_public` ERROR).
- `cycle_week`, `is_deload_date`, `session_exercise_volume`, `update_updated_at`:
  `search_path` pinned to `public` (cleared `function_search_path_mutable` WARNs).

## Related code

- `src/constants/app.ts` — `USER_ID` (the thing auth replaces)
- `src/lib/db/*` — every query filters by `USER_ID`
- `src/lib/supabase.ts` — client init; add session handling here
- `src/store/app.ts` — `bootstrap()`; gate on an authenticated session
