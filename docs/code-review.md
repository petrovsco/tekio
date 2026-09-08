# Reviewing Tekiō code

What a reviewer needs that is **not** already written down. Read this before
`/code-review` or `/simplify` on this repo.

Everything else lives elsewhere and is not repeated here: what the app is for and
what may be built is [doctrine.md](doctrine.md); how the repo is laid out and how
it ships is [CLAUDE.md](../CLAUDE.md); how work is tracked is the house rules.
This file is only the list of things a good generic React reviewer gets wrong
here.

Reference-only, like the docs beside it: it states what *is*. A follow-up it
suggests goes to `docs/roadmap/`, never into this file.

## 1. Deliberate, so not findings

These look like defects on every first read and are all decisions:

- **One hardcoded user.** `USER_ID` in `src/constants/app.ts`; every query
  filters by it; there is no sign-in. Multi-user is [roadmap
  003](roadmap/003-rls-auth-v1.1.md), and opening the app to other people is the
  standing goal — so *new* code should not add fresh single-user shortcuts, but
  the existing ones are not bugs.
- **RLS is wide open on purpose** — `USING (true)` while there is no auth. A
  `rls_policy_always_true` advisory is expected; only Supabase *errors* matter.
- **No router.** Navigation is `tab` state in `App.tsx`. Do not propose React
  Router; it was removed in 2.0.58 for carrying zero routes.
- **The database client is a `PostgrestClient`**, not `supabase-js`. Only
  `.from()` and `.rpc()` exist — `supabase.auth`, `.storage`, `.channel()` and
  `.functions` do not. Edge functions go through `fetch` in
  `src/lib/assistant/client.ts`.
- **`any` at the database edge.** Supabase rows arrive untyped and are narrowed
  at the boundary. ESLint warns rather than errors on purpose.
- **Staging writes to the production database.** A row tagged
  `origin = 'staging'` is a real training session, not a test fixture. Never
  propose deleting rows by that tag.
- **`EditModal.tsx` and `ProgramTab.tsx` are long** (800+ lines) and known.
  Splitting them is scheduled in
  [roadmap 048](roadmap/048-simplification-candidates.md), so "this file is too
  big" is not a new finding.

## 2. Where the real risk is

- **A number claiming physiological meaning.** Rep ranges, HR-zone edges,
  recovery windows, weekly targets, deload placement, 1RM formulas — and prose
  that prescribes ("stop short of failure") or classifies ("a swing is power
  work"). These are **grounded**: each is indexed in
  [grounding-inventory.md](grounding-inventory.md) with its sources. Changing
  one is a doctrine matter, not a refactor, and needs `/ground` first. A
  reviewer who "corrects" a rep range from memory has broken the product's one
  promise. Tidying the code *around* such a constant is fine; moving the value
  is not.
- **Reads must not run on the program cycle.** Home and Adaptations answer
  "what is missing" over their own grounded 14-day window. `CYCLE` is a property
  of the user's *program*, not of the read. Unifying the two looks like a
  simplification and is a correctness bug.
- **Doctrine caps bind proposals.** At most 4 menu sections (3 used, 1 spare);
  a new signal is an input to an existing read before it is a destination; and
  "the user can turn it off" is never a justification. A review that suggests a
  new screen or a settings toggle should check `doctrine.md` §2–§3 first.
- **Every user-visible change needs a browser check**, not only a passing build.
  A finding that a screen is broken must come from having opened it.

## 3. Already mechanised — don't spend a review on it

Unused variables, `prefer-const`, hooks rules, unused files, dead exports and
unused dependencies are covered by `npm run lint` and `npm run knip`. Report
what a tool cannot: wrong behaviour, a misread of the data, a claim the code
does not support. Bundle weight has its own measured budget — reason about
first-paint cost from the numbers, never by eye.

## 4. Small house habits

- Roadmap briefs name a **symbol**, never a line number; `#L<n>` anchors drift
  and `npm run check:docs` catches them.
- The repo has mixed line endings and no `.gitattributes`. Check a file before
  rewriting it whole, or a one-line edit becomes a whole-file diff.
- Colour carries meaning in the SIGNAL language: deload, destructive actions and
  ratings deliberately take none. Adding a red "danger" tint is a regression,
  not a polish.
