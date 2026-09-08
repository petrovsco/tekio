# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product doctrine

**Tekiō tells me what's missing.** Before proposing, designing, or building
any feature, apply [docs/doctrine.md](docs/doctrine.md) — it carries
the purpose statement, the principles, the hard caps (max 4 menu sections; the
6-week shelf expiry), the five-question brief checklist, and the Core/Fold/Shelf
ledger for every surface. It is imported below so it is always in context.

@docs/doctrine.md

## Reviewing code

**Before `/code-review` or `/simplify` on this repo, read
[docs/code-review.md](docs/code-review.md).** It is the list of things a good
generic React reviewer gets wrong here — the deliberate decisions that look like
defects (one hardcoded user, wide-open RLS, no router, `any` at the database
edge), where the real risk is (any number claiming physiological meaning is
grounded and needs `/ground`, not an opinion), and what `npm run lint` and
`npm run knip` already cover so a review need not. It is a link rather than an
import on purpose: a reviewer opens it, every other session does not pay for it.

## Branching and versioning

**Push to `develop`.** `master` holds the last released state and is not pushed
to directly any more. Everything — code, docs, roadmap briefs — lands on
`develop`, which is where the next release is assembled. `master` moves again
only when a version is released onto it (2.0.0 went out on 2026-09-05).

**Every push bumps `version` in `package.json`**, in the same commit as the
change it ships. If it is worth pushing, it is worth a version.

| Bump | For |
|---|---|
| **patch** (2.0.0 → 2.0.1) | the automatic bump — every push, whatever it carries: fixes, features, redesigns, roadmap and other documentation edits |
| **minor** (2.0.1 → 2.1.0) | only when Peter names the release in a message; until then its features ride in as patches |
| **major** (2.x.y → 3.0.0) | only when Peter says in a message that a whole concept is validated |

The minor and major digits are his call, never a judgement call made here — a
big-feeling change is still a patch bump until he names the release. (Until
2.0.0 shipped, features bumped the minor digit automatically; since 2026-09-05
only the patch digit moves on its own.)

**Tags:** minor and major bumps get an annotated tag (`v2.1.0`, `v2.0.0`) pushed
with the commit. Patch bumps are not tagged.

**Where each branch deploys** (one Vercel project, `bubolazi-projects/tekio`):

| Branch | URL | Vercel target |
|---|---|---|
| `master` | https://tekio.shamatoff.com | production |
| `develop` | https://stg-tekio.shamatoff.com | preview |

Both sit behind the same cookie gate in [middleware.ts](middleware.ts) —
`BASIC_AUTH_ENABLED` is one environment variable covering Preview *and*
Production, so a change to it changes both. Vercel Authentication is off; that
gate is the only door. Staging talks to the **same Supabase project as
production**, on purpose: the user runs the staging build daily, so a
row tagged `origin = 'staging'` is real training data, not a test row, and is
never deleted by its tag. The risks the shared database creates, and the work
that pays them, are
[roadmap/037-row-origin-tagging.md](docs/roadmap/done/037-row-origin-tagging.md)
(marking which build wrote a row) and
[roadmap/024-staging-shared-database-safety.md](docs/roadmap/024-staging-shared-database-safety.md)
(the migration policy).

**Releasing a version.** Seven steps, in this order — 2.0.0 went out this way on
2026-09-05, and the reasoning behind each one is
[roadmap/050-release-procedure.md](docs/roadmap/050-release-procedure.md):

1. **Pre-flight on `develop`** — `npm run build`, `npm run test`, `npm run check:docs`, all green.
2. **Registry** — in [docs/roadmap/releases.md](docs/roadmap/releases.md) set the release to `released <date>`, and retag or untag every brief still marked `**Release:**` for it that is not in `done/`, saying so in its status line.
3. **Version** — bump `package.json` to the release version; commit as `release: X.Y.Z — <theme> (vX.Y.Z)`.
4. **Ship** — push `develop`, then `git push origin develop:master` (fast-forward; `master` has never carried a merge commit), then the annotated tag `vX.Y.Z`.
5. **Verify production** — `vercel inspect tekio.shamatoff.com` gives the deployment id, and `vercel api "/v13/deployments/<id>?teamId=<team>"` must show `meta.githubCommitSha` equal to `master`, the alias `tekio.shamatoff.com`, and a 401 from the gate; the gate credentials are Vercel Secrets, so only Peter can open the site and read the version at the foot of Profile.
6. **Post-release** — take the briefs that waited on the release off `blocked`; run the queued schema drops as tracked migrations ([roadmap/025](docs/roadmap/done/025-release-blocked-schema-drops.md)) under the migration policy in [roadmap/024](docs/roadmap/024-staging-shared-database-safety.md), and never delete rows by their `origin` tag — they are real data; move finished briefs to `done/` and repoint their links.
7. **Open the next release** section in `releases.md`.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript check + Vite build
npm run typecheck    # Type-check only (no emit)
npm run lint         # ESLint (flat config in eslint.config.js)
npm run knip         # Dead files, exports and dependencies (knip.jsonc)
npm run perf         # First-paint bundle size vs the committed baseline (needs a build)
npm run perf:update  # Re-baseline, deliberately
npm run perf:startup # Time the production build in a real browser
npm run test         # Run all tests once (Vitest)
npm run test:watch   # Vitest in watch mode
npm run preview      # Preview production build locally
```

To run a single test file: `npx vitest run src/test/utils.test.ts`

`lint` is **deliberately not part of `build`** — it takes ~32 s against the
build's ~13 s, and Vercel runs the build on every push. Run it before a commit
that changes `src/`. It is mechanical checks only (roadmap 023 item 1);
judgement about whether code is *good* stays with `/simplify` and
`/code-review`.

`knip` reports dead files, exports and dependencies; it never deletes. Its
findings are triaged by hand into candidate A1 of
[roadmap/048](docs/roadmap/048-simplification-candidates.md), which is the brief
that does the deleting — so `knip` reporting zero is what says A1 is finished.

`perf` measures only what `dist/index.html` fetches before it can draw — the
entry chunk plus the stylesheet, not the lazy chunks, because a chart bundle
that loads when you open a chart costs the first paint nothing. It fails at
baseline + 5 %. Run `npm run build` first; re-baseline with `perf:update` in the
same commit as the change that moved the number, and say why.
[scripts/perf-baseline.json](scripts/perf-baseline.json) is the committed
record: **352.66 kB first paint, 1490 ms to the Home read** (2026-09-08). That
second number is the one doctrine §6 cares about — it is measured after
`bootstrap()` has returned, not at DOMContentLoaded — and it is wall-clock
against the live database, so read the trend, not the digit.

## Environment Setup

Copy `.env.example` to `.env` and fill in:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Architecture

**Stack**: React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js`), Zustand 5, `@supabase/postgrest-js`, Recharts, dnd-kit. No router — see *Routing and navigation* below.

### Single-user design

The app is hardcoded to one user: `USER_ID` in [src/constants/app.ts](src/constants/app.ts). All Supabase queries filter by this constant. There is no auth flow.

### State management

Two Zustand stores:

- **`useAppStore`** ([src/store/app.ts](src/store/app.ts)) — holds all domain data (weights, bodyweight, cardio, mobility, skills, donations, programs) plus CRUD actions and `bootstrap()` which loads everything in parallel on startup. Also owns the global `editModal` and `toast` state.
- **`usePrefs`** ([src/store/prefs.ts](src/store/prefs.ts)) — controls which sections appear in the drawer menu / home tab, and their sort order. Loaded as part of `bootstrap()`.

### Data layer (`src/lib/db/`)

One file per domain. Each file talks directly to Supabase — no ORM, no repository abstraction. Key points:

- **Weights** ([src/lib/db/weights.ts](src/lib/db/weights.ts)): The DB is normalized: `training_sessions` → `session_exercises` → `session_sets`. The in-memory `WeightEntry.id` maps to `session_exercise.id`. Exercises are auto-created via `getOrCreateExercise`. Sessions are auto-created/cleaned up by `getOrCreateSession` / `deleteWeightEntry`.
- **Programs** ([src/lib/db/program.ts](src/lib/db/program.ts)): `programs` + `program_days` + `program_day_exercises` + `program_supersets`. User enrollment lives in `user_programs` (status: `'active' | 'paused'`). Only `'active'` programs are loaded into the store on bootstrap.
- **Section config** ([src/lib/db/sectionConfig.ts](src/lib/db/sectionConfig.ts)): `user_section_config` table. On first load, defaults are seeded via upsert with `ignoreDuplicates: true`.

### Cycle / deload logic

Programs run in 6-week cycles. Week 6 is the deload week. All cycle math lives in [src/lib/utils.ts](src/lib/utils.ts):

- `cycleInfo(program)` — returns `{ week, isDeload, isComplete }` based on days elapsed since `startDate`.
- `isDeloadDate(startDate, date)` — checks if a specific date falls in a deload week (used for chart dot styling).
- The constant `CYCLE = 6` lives in `src/constants/app.ts`; `src/lib/utils.ts` imports it from there.

When all of today's exercises are logged, `WeightsTab` auto-advances the program to the next day.

### Routing and navigation

There is no router. Navigation is purely state-based: `tab` state in `App.tsx` determines which tab component renders. The `AppShell` wraps all tabs with a sticky header, a slide-in `Drawer` (hamburger menu), and a `BottomNav`. React Router was removed in 2.0.58 (roadmap 023 item 0, candidate A8 of 048) because it carried a single catch-all route and no navigation API was ever called — 37 kB on first paint doing nothing. Real web addresses would bring it back; that is about ten lines in `App.tsx`.

### UI components

Reusable primitives in [src/components/ui/](src/components/ui/): `Card`, `Button` (with `Btn`, `DelBtn`, `EditBtn`), `Input` (`Inp`), `Modal`, `SmartInput` (autocomplete), `HistoryList` (filterable list), `Chip`, `Toast`, `EditModal` (unified edit form for all entry types), `MiniChart`, `SetsGrid`.

`EditModal` is a single component that handles editing for all entry types using the `EditModalTarget` discriminated union from [src/types/index.ts](src/types/index.ts).

### Deployment

Deployed to Vercel. [middleware.ts](middleware.ts) implements optional staging protection (cookie-based auth gate) activated by setting `BASIC_AUTH_ENABLED=true` in Vercel environment variables. Set `VITE_NOINDEX=true` to inject a `noindex` meta tag at build time.

## House rules (from modus)

@~/.claude/modus/rules/session-wrap-up.md
@~/.claude/modus/rules/build-before-push.md
@~/.claude/modus/rules/direct-push.md
@~/.claude/modus/rules/verify-in-browser.md
@~/.claude/modus/rules/pending-work-in-roadmap.md

Repo specifics for those rules: this repo is the working directory, so all paths
are repo-relative — run `npm run build` here; "main branch" means `develop`
(see Branching and versioning above — every push bumps the version too);
roadmap briefs go to `docs/roadmap/` (the context guard is pointed there via
`CTX_GUARD_ROADMAP_DIR` in `.claude/settings.local.json`). Every brief
carries a `**Label:**` line — bug / infra / feature / backlog — defined in
[docs/roadmap/README.md](docs/roadmap/README.md).

**Reference-only docs** — these state what *is* and must never grow a follow-up,
a "proposed edit" or a next step; those go to `docs/roadmap/` instead:
[docs/doctrine.md](docs/doctrine.md) (decisions),
[docs/code-review.md](docs/code-review.md) (what a reviewer needs),
[docs/grounding-inventory.md](docs/grounding-inventory.md) (an index of the 75
numbers), [docs/grounding/](docs/grounding/) (the verbatim scout blocks a brief
outgrew), [docs/design-system.md](docs/design-system.md) (the visual
language), [supabase/README.md](supabase/README.md) and
[scripts/garmin-sync/README.md](scripts/garmin-sync/README.md) (how things work).
