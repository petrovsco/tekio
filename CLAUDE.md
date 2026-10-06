# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product doctrine

**Tekiō tells me what's missing.** Before proposing, designing, or building
any feature, apply `tekio.rfcs/doctrine.md` — it carries
the purpose statement, the principles, the hard caps (max 4 menu sections; the
6-week shelf expiry), the five-question brief checklist, and the Core/Fold/Shelf
ledger for every surface. It is imported below so it is always in context.

@../tekio.rfcs/doctrine.md

## Where the specifications live

**`petrovsco/tekio.rfcs`**, cloned as a sibling at `Projects/tekio.rfcs`. This
repo holds code. The plan — one numbered RFC per unit of work — and the standing
reference that says what the product already claims both live there:
`doctrine.md`, `design-system.md`, `code-review.md`, `grounding-inventory.md`
and `grounding/`.

They were `docs/` here until 2026-09-10 and moved with their history. Numbers
did not change, only their padding: brief 71 is RFC 0071. Source comments that
cite a brief now name the path in the specs repo, so a citation stays greppable
across both checkouts.

**Two repositories, two commits.** Work that changes both the plan and the code
is committed in both, in the same session, neither one left dirty. Never copy an
RFC back into this repo for convenience — a copied spec disagrees with itself
within a week.

## Reviewing code

**Before `/code-review` or `/simplify` on this repo, read
`tekio.rfcs/code-review.md`.** It is the list of things a good
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
| `master` | https://app.tekio.fyi (the old tekio.shamatoff.com redirects here) | production |
| `develop` | https://stg-app.tekio.fyi (the old stg-tekio.shamatoff.com redirects here) | preview |

`tekio.fyi` is the public landing site, served since 2026-10-06 from its own
repository `petrovsco/tekio.site` by the Vercel project `tekio-site`, and
`www.tekio.fyi` redirects to it permanently. DNS lives in the `tekio.fyi`
Cloudflare zone as DNS-only CNAMEs to Vercel.

Both sit behind the same cookie gate in [middleware.ts](middleware.ts) —
`BASIC_AUTH_ENABLED` is one environment variable covering Preview *and*
Production, so a change to it changes both. Vercel Authentication is off; that
gate is the only door. Staging talks to the **same Supabase project as
production**, on purpose: the staging build is somebody's daily app while the
product has one user, so a row tagged `origin = 'staging'` is real training
data, not a test row, and is never deleted by its tag.

**Two builds, one schema.** Because both builds share the tables, a migration is
a production change whichever branch asked for it. Expand now (new tables,
nullable or defaulted columns, wider constraints); contract after the release
(drops, renames, narrowing — anything the build on `master` still reads). What
exists only so the two builds can run side by side is queued in the release's
schema-drops brief, and removing it at step 6 below *is* the release sweep: it
removes schema, never rows. The full policy is
[supabase/README.md](supabase/README.md#two-builds-one-schema--the-migration-policy);
the reasoning is `tekio.rfcs/rfcs/done/0024-staging-shared-database-safety.md`,
and marking which build wrote a row is
`tekio.rfcs/rfcs/done/0037-row-origin-tagging.md`.

**Releasing a version.** Seven steps, in this order — 2.0.0 went out this way on
2026-09-05 and 2.1.0 on 2026-09-30, and the reasoning behind each one is
roadmap/050-release-procedure.md (`tekio.rfcs/rfcs/done/0050-release-procedure.md`).
The landing site added two actions on 2026-10-02, the plan's tag in step 2 and
the site's redeploy in step 4; their reasoning is
`tekio.rfcs/rfcs/done/0084-public-landing-site.md` §3:

1. **Pre-flight on `develop`** — `npm run build`, `npm run test`, `npm run check:docs`, and `node scripts/check-links.mjs` in `tekio.rfcs`, all green.
2. **Registry** — in `tekio.rfcs/rfcs/releases.md` set the release to `released <date>`, and retag or untag every brief still marked `**Release:**` for it that is not in `done/`, saying so in its status line. Then tag that commit in `tekio.rfcs` with the annotated tag `vX.Y.Z` and push the tag: the landing site reads this repo and that one at the newest release tag.
3. **Version** — bump `package.json` to the release version; commit as `release: X.Y.Z — <theme> (vX.Y.Z)`.
4. **Ship** — push `develop`, then `git push origin develop:master` (fast-forward; `master` has never carried a merge commit), then the annotated tag `vX.Y.Z`. Then redeploy the landing site's production (Vercel project `tekio-site`, team `bubolazi-projects`) so it rebuilds against the two new tags: the Vercel connector's `create_deployment` with the site's current production deployment as `deploymentId` and `target: production`, or `vercel redeploy` on that deployment. Nothing else redeploys it.
5. **Verify production** — `vercel inspect app.tekio.fyi` gives the deployment id, and `vercel api "/v13/deployments/<id>?teamId=<team>"` (or, with no CLI installed, the Vercel connector's `get_deployment` on `app.tekio.fyi`, team `bubolazi-projects` — one call) must show `meta.githubCommitSha` equal to `master`, the alias `app.tekio.fyi`, and a 401 from the gate; the gate credentials are Vercel Secrets, so opening the site to read the version at the foot of Profile needs whoever holds them.
6. **Post-release** — take the briefs that waited on the release off `blocked`; run the release sweep — the release's schema-drops queue (2.1.0's was `tekio.rfcs/rfcs/done/0080-release-2-1-0-schema-drops.md`) as one tracked migration — applied with `apply_migration`, the file is named after the version Supabase stamps on it (`list_migrations`), not one chosen beforehand — under the policy in [supabase/README.md](supabase/README.md#two-builds-one-schema--the-migration-policy) — and never delete rows by their `origin` tag, they are real data; move finished briefs to `done/` and repoint their links.
7. **Open the next release** section in `releases.md`.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript check + Vite build
npm run typecheck    # Type-check only — `tsc -b`, both project configs, the check build runs
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
roadmap/048 (`tekio.rfcs/rfcs/done/0048-simplification-candidates.md`), which is the brief
that does the deleting — so `knip` reporting zero is what says A1 is finished.

`perf` measures only what `dist/index.html` fetches before it can draw — the
entry chunk plus the stylesheet, not the lazy chunks, because a chart bundle
that loads when you open a chart costs the first paint nothing. It fails at
baseline + 5 %. Run `npm run build` first; re-baseline with `perf:update` in the
same commit as the change that moved the number, and say why.
[scripts/perf-baseline.json](scripts/perf-baseline.json) is the committed
record: **315.66 kB first paint** (2026-10-04, after water, the Weights chips and Admin left) **and 1039 ms to the Home read** (2026-09-08). That
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

- **`useAppStore`** ([src/store/app.ts](src/store/app.ts)) — holds all domain data (weights, bodyweight, cardio, mobility, sports, donations, sleep, sauna, cold) plus CRUD actions and `bootstrap()` which loads everything in parallel on startup. Also owns the global `editModal` and `toast` state.
- **`usePrefs`** ([src/store/prefs.ts](src/store/prefs.ts)) — controls which sections appear in the drawer menu / home tab, and their sort order. Loaded as part of `bootstrap()`.

### Data layer (`src/lib/db/`)

One file per domain. Each file talks directly to Supabase — no ORM, no repository abstraction. Key points:

- **Weights** ([src/lib/db/weights.ts](src/lib/db/weights.ts)): The DB is normalized: `training_sessions` → `session_exercises` → `session_sets`. The in-memory `WeightEntry.id` maps to `session_exercise.id`. Exercises are auto-created via `getOrCreateExerciseRow`. Sessions are auto-created/cleaned up by `getOrCreateSession` / `deleteWeightEntry`.
- **Section config** ([src/lib/db/sectionConfig.ts](src/lib/db/sectionConfig.ts)): `user_section_config` table. On first load, defaults are seeded via upsert with `ignoreDuplicates: true`.

### No programs, no cycle

The Program feature — training plans, the 6-week cycle, the week-6 deload,
Today's Plan on Weights — was removed in 2.1.17 to be rebuilt later
(`tekio.rfcs/rfcs/done/0087-remove-program.md`). Home and Adaptations never read
it: their windows are their own (`MUSCLE_WINDOW_DAYS`). Its tables stay in the
database until the 2.2.0 release sweep, because the build on `master` still
reads them.

### Routing and navigation

There is no router. Navigation is purely state-based: `tab` state in `App.tsx` determines which tab component renders. The `AppShell` wraps all tabs with a sticky header, a slide-in `Drawer` (hamburger menu), and a `BottomNav`. React Router was removed in 2.0.58 (roadmap 023 item 0, candidate A8 of 048) because it carried a single catch-all route and no navigation API was ever called — 37 kB on first paint doing nothing. Real web addresses would bring it back; that is about ten lines in `App.tsx`.

### UI components

Reusable primitives in [src/components/ui/](src/components/ui/): `Card`, `Button` (with `Btn`, `DelBtn`, `EditBtn`), `Input` (`Inp`), `Modal`, `SmartInput` (autocomplete), `HistoryList` (filterable list), `Chip`, `Toast`, `EditModal` (unified edit form for all entry types), `SetsGrid`.

`EditModal` is a single component that handles editing for all entry types using the `EditModalTarget` discriminated union from [src/types/index.ts](src/types/index.ts).

### Deployment

Deployed to Vercel. [middleware.ts](middleware.ts) implements optional staging protection (cookie-based auth gate) activated by setting `BASIC_AUTH_ENABLED=true` in Vercel environment variables. Set `VITE_NOINDEX=true` to inject a `noindex` meta tag at build time.

## House rules (from modus)

The house rules are committed copies in [.claude/rules/modus/](.claude/rules/modus/),
which Claude Code loads from the checkout, so they reach cloud sessions too. The
modus plugin refreshes them at session start; edit a rule in modus, never here.

### No personal context in this repo

Stated in full as well, because this repo is **public** and a reader may never
open `.claude/rules/`. It is the one rule here that cannot afford to be
invisible.

**Tekiō is a product, not somebody's personal app.** It has exactly one user
today because it is still an experiment, and that is a temporary state, not the
design. So this repo holds product information and product code — never
information about the person currently using it:

- **No people.** No names, ages, birth years or relationships as *context*.
  Naming an author, a co-author or who decided something is fine — that is task
  management. Naming whose body, whose data or whose habits a feature is shaped
  around is not.
- **No real body, health or employment data.** Bodyweights, HRmax readings,
  sleep scores, calorie or protein targets, employers, career plans. Where a
  realistic figure is needed for a fixture, a design mock or a test, **invent one
  and mark it invented** — see [design/home-canvas/DATA.md](design/home-canvas/DATA.md).
- **State the shape, not the instance.** The test: would the sentence still be
  true for a different user? "A wrist-optical spike can sit 20 bpm above a real
  peak" is product knowledge. The same sentence with a person's 214 in it is not.
- **Never name a private knowledge base.** No repo name, org, URL or path.
  Tooling that must reach one (`/ground` step 4) reads
  `~/.claude/modus/personal-os` and is **silently inert** when that file is
  absent, which on most machines it is.

Repo specifics for those rules: this repo is the working directory, so all paths
are repo-relative — run `npm run build` here; "main branch" means `develop`
(see Branching and versioning above — every push bumps the version too);
roadmap briefs go to `tekio.rfcs/rfcs/` (the context guard is pointed there via
`CTX_GUARD_ROADMAP_DIR` in `.claude/settings.local.json`). Every brief
carries a `**Label:**` line — bug / infra / feature / backlog — defined in
`tekio.rfcs/rfcs/README.md`.

**Reference-only docs** — these state what *is* and must never grow a follow-up,
a "proposed edit" or a next step; those go to `tekio.rfcs/rfcs/` instead:
`tekio.rfcs/doctrine.md` (decisions),
`tekio.rfcs/code-review.md` (what a reviewer needs),
`tekio.rfcs/grounding-inventory.md` (an index of the 75
numbers), `tekio.rfcs/grounding/` (the verbatim scout blocks a brief
outgrew), `tekio.rfcs/design-system.md` (the visual
language), [supabase/README.md](supabase/README.md) and
[scripts/garmin-sync/README.md](scripts/garmin-sync/README.md) (how things work).
