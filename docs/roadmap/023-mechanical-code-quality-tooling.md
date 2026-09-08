# Roadmap: Mechanical code quality — ESLint, dead-code detection, perf budget

**Label:** infra
**Status:** in progress — items 0 and 1 landed 2026-09-08: first paint 552 kB →
324 kB with the 500 kB warning gone (v2.0.58), and `npm run lint` green on a
clean tree (v2.0.59). Items 2–4 (knip, the conventions file, the perf budget)
remain. Spun out of
[009-feature-grounding.md](done/009-feature-grounding.md) on 2026-08-30 so that brief
holds only the grounding back-fill it still tracks. Committed to 2.1.0 by Peter
on 2026-09-05.
**Release:** 2.1.0
**Origin:** pushbacks #3 and #4 and deliverables 5 and 6 of
[009-feature-grounding.md](done/009-feature-grounding.md), agreed 2026-08-26 and never
started. The arguments below are carried in full — this brief is kickoff-ready on
its own and you do not need to read 009 first.

## Why this is its own brief

009 mixed two tracks. One is a **pre-build gate about truth** — is this number
real? — and it shipped: the doctrine, the `science-scout` subagent, the `/ground`
skill and the 75-number inventory are all live. The other is a **post-build track
about code**, which is not about truth at all, needs none of that machinery, and
has sat untouched for weeks inside a brief whose title says "grounding".

Keeping them together made 009 permanently unfinishable and made this work
invisible. Split, each one can close.

## Which read does this sharpen?

None — this is tooling, not a surface. Doctrine §4.5 does not apply: no number
claiming physiological meaning is written, so no `## Grounding` block is required.

## The two arguments, restated

**Judging code with an agent is the weakest link; measuring it is not.** An LLM
asked "is this slow?" produces plausible noise. Tekiō's real performance risks are
specific and measurable: `bootstrap()` loads every domain at startup, one Zustand
store holds all data, and Recharts is heavy. The instrument is a number, not an
opinion — an agent may *interpret* the number, it must not guess it.

**Most of the maintainability reviewer already exists.** `/simplify` and
`/code-review` are live; a third overlapping agent would just yield three
inconsistent opinions. The genuine gap is mechanical, and mechanical gaps want
mechanical tools: there is **no ESLint** and **no dead-code detection** in this
repo, while [src/components/ui/EditModal.tsx](../../src/components/ui/EditModal.tsx)
and [src/components/tabs/ProgramTab.tsx](../../src/components/tabs/ProgramTab.tsx)
are both over 800 lines. Mechanize first, judge second.

## Scope

0. **Get the 500 kB warning off first paint — done 2026-09-08 (v2.0.58).**
   Written 2026-09-05 as "code-split the chart bundle", on a premise that was
   already stale: the chart chunk had been lazy since 2026-08-31 (018 unit 5,
   commit `4ac665f`), so it did *not* load on first paint and never had to be
   split again. The 500 kB warning came from the **other** chunk. What the
   measurement actually found, and what was done about it, is
   [§ Item 0 — measured](#item-0--measured) below.
1. **ESLint — done 2026-09-08 (v2.0.59).** Flat config in
   [eslint.config.js](../../eslint.config.js), `npm run lint`. **Not** wired
   into `npm run build`: lint is ~32 s against the build's ~13 s and Vercel runs
   the build on every push, which is the "slows the build meaningfully" the
   scope line reserved. What its first run found is
   [§ Item 1 — the first run](#item-1--the-first-run) below.
2. **Dead-code detection.** `knip` (unused files, exports, dependencies). Its
   first run on a repo this age will find real things; triage them, do not
   auto-delete.
3. **A tekiō conventions file** for `/code-review` to read, so its judgement is
   project-specific rather than generic React advice. Short — the house rules and
   the doctrine already carry most of it; this file is only what a reviewer needs
   that is not already written down.
4. **`scripts/perf-budget.mjs`.** Fails on a bundle-size delta against a
   committed baseline. Plus a Playwright startup / interaction timing run — the
   Playwright MCP is already wired for this repo.

## Item 0 — measured

The brief guessed at where the weight was; a sourcemap read said where it
actually was. That read is the method item 4 inherits: **measure the chunk, do
not reason about it.**

The first-paint chunk was 552 kB minified. Its contents:

| What | Size | Called by the app? |
|---|---|---|
| `react-dom` | 177 kB | yes — irreducible |
| `@supabase/auth-js` + `realtime-js` + `phoenix` + `storage-js` | **177 kB** | **no** |
| `react-router` | **37 kB** | **no** |
| app code — Home, stores, the `db/` layer | ~100 kB | yes |
| `react`, `scheduler`, `postgrest-js`, `supabase-js` core | ~35 kB | yes |

So 214 kB of the 552 kB was libraries with no call site anywhere in `src/`.

**React Router did nothing.** One route, `path="*"`, rendering the same thing
for every address; no `useNavigate`, no `<Link>`, no URL parameters. Tabs are
and always were `tab` state in `App.tsx`. Removed. Real web addresses would
bring it back — that is ten lines in `App.tsx`, not a rewrite.

**Four of the five Supabase clients were never reached.** `createClient` builds
auth, realtime, storage, functions and PostgREST, and ships all of them. Tekiō
calls `.from(...)` (30 sites) and one `functions.invoke`. Inside `supabase-js`,
`.from(x)` *is* `this.rest.from(x)` on a `PostgrestClient` — verified in
`node_modules/@supabase/supabase-js/dist/index.mjs` — built at `rest/v1` with
`apikey` and `Authorization: Bearer <anon key>` on every request. So
[src/lib/supabase.ts](../../src/lib/supabase.ts) now constructs that client
directly and all 30 call sites are unchanged; the one edge-function call is a
plain `fetch` in [src/lib/assistant/client.ts](../../src/lib/assistant/client.ts),
which got shorter because it no longer has to unwrap a `FunctionsHttpError` to
reach the body it wanted.

**Result — the perf budget's committed baseline (item 4 measures against this):**

| Chunk | Before (2.0.57) | After (2.0.58) | |
|---|---|---|---|
| first paint, minified | 551.99 kB | **323.88 kB** | −228 kB, −41% |
| first paint, gzipped | 161.70 kB | **100.45 kB** | −61 kB, −38% |
| `chart` (lazy, not on first paint) | 387.16 kB | 387.16 kB | unchanged |
| modules transformed | 798 | 747 | |

The build no longer prints the 500 kB warning.

**Verified in the browser** (dev server, 390×900), not just built: Home,
Adaptations, Weights, Cardio, Mobility, Program and Profile all render real
live data — readiness 71, 16 lifting sets over 14 days, the exercise
autocomplete list, the Hero Pose Recharts chart, the paused Volleyball
program, HRmax 196. **Zero console errors and zero failed requests** across
the whole walk, and Recharts is absent from first paint. Writes were proven
too, with a reversible round trip rather than new live rows: `week_start_day`
monday → sunday survived a full page reload, then went back to monday, and
`user_profiles` was checked in the database afterwards to confirm it is
`monday` with `hr_max_override` and `birth_date` untouched.

**What this re-opens:** [003 — RLS + auth](003-rls-auth-v1.1.md). When sign-in
lands, `@supabase/auth-js` returns; it should return *lazily*, on the sign-in
path, rather than back into the chunk that paints Home.

## Item 1 — the first run

ESLint 10 flat config: `@eslint/js` recommended, `typescript-eslint` recommended
(not the type-checked variant — it needs a full program per run and this is
already the slowest command in the repo), `eslint-plugin-react-hooks` v7 and
`react-refresh`. Ignores `dist`, `node_modules`, `supabase/functions` (Deno) and
`scripts/garmin-sync` (Python).

The first run found **22 problems: 15 errors, 7 warnings**. Triaged:

**Fixed — four real, all trivial, none behavioural:**

- `hrMax.ts` `ageAt` — `let age` never reassigned, now `const`.
- `ProfileTab.tsx` and `admin/ExerciseMuscleEditor.tsx` — `next.has(id) ?
  next.delete(id) : next.add(id)`, a ternary used as a statement in both, now an
  `if`/`else`.
- `App.tsx` — `DRAWER_TABS` was an `as const` array read only by
  `typeof DRAWER_TABS[number]`. Nothing iterated it, so it is now just the union
  type it was standing in for.

**Quarantined per file, not weakened globally — the rule still guards new code:**

- `EditModal.tsx`, 10× `react-hooks/refs`. Ten forms do `saveRef.current = save`
  in the render body so the shared modal footer can call the active form's save.
  Mutating a ref during render is precisely what the rule exists to stop, and it
  is **already tracked**: candidate S1 of
  [048-simplification-candidates.md](048-simplification-candidates.md) replaces
  it with a `useSave(saveRef, onClose)` hook. Acting on it is out of scope here
  by name, so ESLint points at S1 rather than duplicating it into a new brief.
- `AssistantSettings.tsx`, 1× `react-hooks/set-state-in-effect`. Seeds two
  editable fields from async-loaded status — the ordinary way to do that; the
  alternatives (a `key`, or the adjust-during-render dance) are not clearer.

**Left as warnings (18):** `react-refresh/only-export-components` ×5 (files that
deliberately export a component beside its constants) and
`react-hooks/exhaustive-deps` ×2, plus the two quarantined above. Warnings do
not fail the run.

`npm run lint` exits 0 on a clean tree and 1 on a deliberate violation — checked
with a throwaway file carrying an unused binding and a `let` that should be
`const`; both were caught, and the file was deleted.

**A note for item 4:** this was also candidate **A8** of 048 arriving from the
other direction — 048 found react-router by reading the code, item 0 found it by
measuring the bundle, and neither knew about the other until the roadmap was
grepped. A8's box is now ticked.

## Out of scope

- Actually splitting `EditModal.tsx` and `ProgramTab.tsx`. The tools are what
  this brief delivers; acting on their output is separate work, and doing both
  at once means never being able to tell which change caused what.
- A performance *reviewer agent*. See the first argument above — that is the
  thing this brief exists to replace.
- Anything in the grounding track. Those runs stay in
  [009-feature-grounding.md](done/009-feature-grounding.md).

## Acceptance

- [x] The chart chunk no longer loads on first paint; the build's 500 kB
      warning is gone, and the before/after sizes are written into this brief.
      Done 2026-09-08 — 552 kB → 324 kB. See [§ Item 0 — measured](#item-0--measured).
- [x] `npm run lint` exists, passes on a clean tree, and fails on a deliberate
      violation. Done 2026-09-08 — exit 0 clean, exit 1 on a probe file. See
      [§ Item 1 — the first run](#item-1--the-first-run).
- [ ] `npx knip` runs and its findings are triaged in a list — kept, deleted, or
      deliberately ignored with a reason.
- [ ] A conventions file exists and `/code-review` is pointed at it.
- [ ] `npm run perf` reports bundle size against a committed baseline and exits
      non-zero when the budget is exceeded.
- [ ] The startup timing run produces a number, and that number is written down
      somewhere durable so the next run has something to compare against.
