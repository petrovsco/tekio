# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product doctrine

**Tekiō tells me what's missing.** Before proposing, designing, or building
any feature, apply [docs/doctrine.md](docs/doctrine.md) — it carries
the purpose statement, the principles, the hard caps (max 4 menu sections; the
6-week shelf expiry), the five-question brief checklist, and the Core/Fold/Shelf
ledger for every surface. It is imported below so it is always in context.

@docs/doctrine.md

## Branching and versioning

**Push to `develop`.** `master` holds the last released state and is not pushed
to directly any more. Everything — code, docs, roadmap briefs — lands on
`develop`, which is where 2.0.0 is being assembled. `master` moves again only
when a version is released onto it.

**Every push bumps `version` in `package.json`**, in the same commit as the
change it ships. If it is worth pushing, it is worth a version.

| Bump | For |
|---|---|
| **patch** (1.1.0 → 1.1.1) | bug fixes, small changes, roadmap and other documentation edits |
| **minor** (1.1.1 → 1.2.0) | new features, page redesigns |
| **major** (1.x.y → 2.0.0) | only when Peter says in a message that a whole concept is validated |

The major digit is his call, never a judgement call made here — a big-feeling
change is still a minor bump until he confirms the concept.

**Tags:** minor and major bumps get an annotated tag (`v1.2.0`, `v2.0.0`) pushed
with the commit. Patch bumps are not tagged.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript check + Vite build
npm run typecheck    # Type-check only (no emit)
npm run test         # Run all tests once (Vitest)
npm run test:watch   # Vitest in watch mode
npm run preview      # Preview production build locally
```

To run a single test file: `npx vitest run src/test/utils.test.ts`

## Environment Setup

Copy `.env.example` to `.env` and fill in:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Architecture

**Stack**: React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js`), Zustand 5, Supabase JS v2, React Router DOM 7, Recharts, dnd-kit.

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
- The constant `CYCLE = 6` is defined in both `src/lib/utils.ts` and `src/constants/app.ts` (the one in utils.ts is local and takes precedence there).

When all of today's exercises are logged, `WeightsTab` auto-advances the program to the next day.

### Routing and navigation

React Router is set up but has only a single catch-all route (`path="*"`). Navigation is purely state-based: `tab` state in `App.tsx` determines which tab component renders. The `AppShell` wraps all tabs with a sticky header, a slide-in `Drawer` (hamburger menu), and a `BottomNav`.

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
[docs/grounding-inventory.md](docs/grounding-inventory.md) (an index of the 75
numbers), [docs/design-system.md](docs/design-system.md) (the visual
language), [supabase/README.md](supabase/README.md) and
[scripts/garmin-sync/README.md](scripts/garmin-sync/README.md) (how things work).
