# Roadmap: Feature grounding — doctrine, science-scout, and review lenses

**Status:** in progress (2026-08-26) — design agreed; pushback 1 resolved (doctrine shipped), 2–6 queued.
**Kickoff:** this file is the brief. It carries the full decision log so a fresh
session can resume without the original conversation.
**Origin:** 2026-08-25 architecture session; redesigned 2026-08-26 after review.

## Why

Tekio features encode physiological claims (recovery scoring, deload logic,
adaptation targets), and the feature surface keeps growing (9 adaptations,
14 tabs, recovery axis, Garmin sync, nutrition sub-project, in-app assistant).
Two different risks: claims that aren't true, and an app that stops being
simple. They need different instruments.

## The design (agreed 2026-08-26)

Four concerns, two moments. Conflating them into one "panel" is itself a
responsibility mix.

| Concern | Real question | When it can still change the outcome |
|---|---|---|
| Science | Is this claim true? | Before the brief is written |
| Simplicity / JIT UX | Should this exist at all, and where? | Before the brief is written |
| Maintainability | Is this code readable and extendable? | After the diff exists |
| Performance | Did smoothness degrade? | After the diff exists, **measured** |

So: a **pre-build gate that produces a grounded brief**, and **post-build
review that mostly already exists**.

### Deliverables

| # | Piece | Mechanism | Where | New? |
|---|---|---|---|---|
| 1 | Product doctrine | plain markdown, referenced from CLAUDE.md | tekio `docs/doctrine.md` | **new** |
| 2 | `science-scout` | subagent (`WebSearch`, `WebFetch`, `Read`) | tekio `.claude/agents/` | **new** |
| 3 | `/ground` skill | pre-build gate: trigger check -> doctrine check -> science-scout -> writes `## Grounding` into the brief | tekio `.claude/skills/` | **new** |
| 4 | UX craft | existing `frontend-design` plugin | unchanged | no |
| 5 | Maintainability | existing `/simplify` + `/code-review`, plus **add ESLint + knip** and a tekio conventions file | tekio tooling | tooling only |
| 6 | Performance | `npm run perf` budget script; an agent interprets the numbers | tekio `scripts/` | script, not agent |

Placement rule: doctrine and `science-scout` are tekio-specific and live in the
repo. ESLint config and the perf-budget script are reusable -- promote to the
modus catalog only after they prove out here.

## The six pushbacks (work through in order)

Ordered by importance. **This is the working queue** -- keep the status column
current as each is resolved.

| # | Pushback | Status |
|---|---|---|
| 1 | **The stated problem is scope creep, but the proposal was a quality apparatus.** No reviewer fixes scope; reviewers judge how well an already-decided feature was built. The lever is one step earlier: a written product doctrine with real constraints, applied when the roadmap brief is written (e.g. a new Home card must absorb or replace one; a new tab requires retiring one; a number the user can't act on doesn't get shown). A document plus a checklist item, not an agent. | **DONE (2026-08-26)** — [docs/doctrine.md](../doctrine.md), imported from workspace `CLAUDE.md` |
| 2 | **The six-scientist roster contradicts the evidence hierarchy in this very brief** (meta-analyses > RCTs > ... > expert opinion). Use them as a *practitioner layer*, never an evidence tier: (a) **disagreement surfacing** -- Attia vs Galpin on zone-2 volume, Israetel on volume landmarks / junk volume, Huberman's framing landing more confident than the papers; where they split is where a real design decision exists; (b) **provenance tags** on every claim: `[literature]` / `[practitioner consensus]` / `[single-practitioner position]`. Roster is not flat: Cavaliere and Harris are coaches (cueing, movement quality, biomechanics), not researchers -- weight per domain. Roster: Huberman, Galpin, Attia, Israetel, Cavaliere, Harris. | agreed, not started |
| 3 | **A performance *reviewer* that reads code is the weakest link.** An LLM guessing at render cost yields plausible noise. Tekio's real risks are measurable: `bootstrap()` loading every domain at startup, one Zustand store holding all data, Recharts bundle weight. Build `scripts/perf-budget.mjs` (fails on bundle-size delta) + a Playwright startup/interaction timing run (Playwright MCP already wired); the agent interprets numbers, it does not guess. | agreed, not started |
| 4 | **Most of the maintainability reviewer already exists** (`/simplify`, `/code-review`); a third overlapping agent yields three inconsistent opinions. The genuine gap is mechanical: **no ESLint, no dead-code detection**, and files like `src/components/ui/EditModal.tsx` (862 lines) and `src/components/tabs/ProgramTab.tsx` (840 lines). Mechanize first, judge second; give `/code-review` a short tekio conventions file so its judgment is project-specific. | agreed, not started |
| 5 | **"Nothing proceeds until all three grounds report" is unenforceable** and wrong at small sizes -- hard gates get bypassed exactly when moving fast. Replace with a crisp trigger: **the gate fires when a change writes a number into the app that claims physiological meaning** (weight, threshold, target, scoring coefficient). Gated: `RECOVERY_WEIGHTS`, `adaptation_targets`, FRS coefficients, rep-range boundaries. Not gated: chart colors, layout fixes, export fields. | agreed, not started |
| 6 | **Grounding output must land in the repo, not just in a session.** In six months nobody knows why sleep weight is 0.45. Findings write to a `## Grounding` section in the roadmap brief *and* leave a source comment on the constant itself. Durable life-knowledge still flows to the user's own knowledge base for `/ingest` -> `wiki/health/`; the *why* behind a number stays next to the number. | agreed, not started |

## Consequences of the doctrine (not part of this brief)

Decided 2026-08-26 while writing `docs/doctrine.md`; each needs its own brief.

- **Home redesign** — purpose "tell me what's missing" implies Home *is* the
  answer surface. Likely two honest reads: a body map for spatial muscle gaps
  plus a non-spatial read for whole-body qualities + readiness, with tap-to-drill
  detail (the JIT layer). Deliberately deferred so the doctrine session stayed a
  doctrine session.
- **Four folds** — Sports → Cardio, Water → Recovery, Donations → Recovery,
  Body Weight → Home stat, Habits → Admin (definitions) + Home (completion).
  UI folds are cheap; the Sports/Cardio DB merge is not, and is its own item.
- **Skill adaptation (roadmap task 8)** is forced by the Home redesign: a surface
  built to show gaps makes a permanently-zero adaptation impossible to ignore.
- **Open question** — whether habit-derived *muscle* contributions should count
  as stimulus at all, or whether inferred sets make the read less honest.

## Acceptance

- A feature like "adaptive deload frequency" trips the numeric trigger, `/ground`
  runs, the scout returns a sourced and provenance-tagged summary in isolated
  context, and the brief gains a `## Grounding` section.
- The scout never edits files.
- The doctrine is short enough to be read every time and specific enough to say
  no to something real.

## Notes

- Standing working agreement (2026-08-26): mutual pushback is expected in both
  directions -- see the `feedback_mutual_pushback_rule` memory.
