# Roadmap: Feature grounding — doctrine, science-scout, and review lenses

**Status:** in progress (2026-08-26) — design agreed; pushbacks 1–2 and 5–6 resolved
(doctrine, science-scout and `/ground` shipped); 3–4 (post-build tooling) and 7
(back-fill) queued.
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
| 3 | `/ground` skill | pre-build gate: trigger check -> doctrine check -> science-scout -> writes `## Grounding` into the brief | tekio `.claude/skills/ground/` | **DONE (2026-08-26)** |
| 4 | UX craft | existing `frontend-design` plugin | unchanged | no |
| 5 | Maintainability | existing `/simplify` + `/code-review`, plus **add ESLint + knip** and a tekio conventions file | tekio tooling | tooling only |
| 6 | Performance | `npm run perf` budget script; an agent interprets the numbers | tekio `scripts/` | script, not agent |

Placement rule: doctrine and `science-scout` are tekio-specific and live in the
repo. ESLint config and the perf-budget script are reusable -- promote to the
modus catalog only after they prove out here.

## The pushbacks (work through in order)

Ordered by importance, which is not always execution order — see each status
cell. **This is the working queue** -- keep the status column
current as each is resolved.

| # | Pushback | Status |
|---|---|---|
| 1 | **The stated problem is scope creep, but the proposal was a quality apparatus.** No reviewer fixes scope; reviewers judge how well an already-decided feature was built. The lever is one step earlier: a written product doctrine with real constraints, applied when the roadmap brief is written (e.g. a new Home card must absorb or replace one; a new tab requires retiring one; a number the user can't act on doesn't get shown). A document plus a checklist item, not an agent. | **DONE (2026-08-26)** — [docs/doctrine.md](../doctrine.md), imported from workspace `CLAUDE.md`. The "checklist item" half is `/ground` Step 1, which runs §4.1–4.4 plus the four doctrine rules that kill *numbers* specifically (act-on-it, P4, P5, R1/R3) and a §5 ledger check. |
| 2 | **The six-scientist roster contradicts the evidence hierarchy in this very brief** (meta-analyses > RCTs > ... > expert opinion). Use them as a *practitioner layer*, never an evidence tier: (a) **disagreement surfacing** -- Attia vs Galpin on zone-2 volume, Israetel on volume landmarks / junk volume, Huberman's framing landing more confident than the papers; where they split is where a real design decision exists; (b) **provenance tags** on every claim: `[literature]` / `[practitioner consensus]` / `[single-practitioner position]`. Roster is not flat: Cavaliere and Harris are coaches (cueing, movement quality, biomechanics), not researchers -- weight per domain. Roster: Huberman, Galpin, Attia, Israetel, Cavaliere, Harris. | **DONE (2026-08-26)** — [.claude/agents/science-scout.md](../../.claude/agents/science-scout.md), enforced on receipt by `/ground` Step 2's block check. The scout's rules are only as good as the caller's willingness to send a block back, so the coach-only rule is wired to the verdict: coach-only support **is** `convention only`, which is what the source comment then has to say. |
| 3 | **A performance *reviewer* that reads code is the weakest link.** An LLM guessing at render cost yields plausible noise. Tekio's real risks are measurable: `bootstrap()` loading every domain at startup, one Zustand store holding all data, Recharts bundle weight. Build `scripts/perf-budget.mjs` (fails on bundle-size delta) + a Playwright startup/interaction timing run (Playwright MCP already wired); the agent interprets numbers, it does not guess. | agreed, not started — buildable half queued. Its **argument** is now encoded in `/ground`'s scope table: the gate explicitly does not guess at render cost, and says why. |
| 4 | **Most of the maintainability reviewer already exists** (`/simplify`, `/code-review`); a third overlapping agent yields three inconsistent opinions. The genuine gap is mechanical: **no ESLint, no dead-code detection**, and files like `src/components/ui/EditModal.tsx` (862 lines) and `src/components/tabs/ProgramTab.tsx` (840 lines). Mechanize first, judge second; give `/code-review` a short tekio conventions file so its judgment is project-specific. | agreed, not started — buildable half (ESLint, knip, conventions file) queued. Its **argument** is now encoded in `/ground`'s scope table: the gate does not judge code, so it can't become the third inconsistent opinion. |
| 5 | **"Nothing proceeds until all three grounds report" is unenforceable** and wrong at small sizes -- hard gates get bypassed exactly when moving fast. Replace with a crisp trigger: **the gate fires when a change writes a number into the app that claims physiological meaning** (weight, threshold, target, scoring coefficient). Gated: `RECOVERY_WEIGHTS`, `adaptation_targets`, FRS coefficients, rep-range boundaries. Not gated: chart colors, layout fixes, export fields. | **DONE (2026-08-26)** — shipped as `/ground` Step 0, the canonical trigger spec ([SKILL.md](../../.claude/skills/ground/SKILL.md)). Extended in two places while writing it: (a) **three exemptions** — renormalisation, unit/shape change, and rounding inside an already-grounded range — so the gate doesn't fire on numbers that move without making a new claim; (b) **the gate never blocks shipping, only shipping unlabelled** — `convention only` is a legitimate verdict that unblocks immediately, which is what keeps it from being bypassed under speed. |
| 6 | **Grounding output must land in the repo, not just in a session.** In six months nobody knows why sleep weight is 0.45. Findings write to a `## Grounding` section in the roadmap brief *and* leave a source comment on the constant itself. Durable life-knowledge still flows to the user's own knowledge base for `/ingest` -> `wiki/health/`; the *why* behind a number stays next to the number. | **DONE (2026-08-26)** — shipped as `/ground` Step 3. Adds a **verdict vocabulary** mapping the scout's four verdicts onto #7's inventory states (grounded / convention / unknown), so the inventory can be read off the briefs, and a **maintenance rule**: moving a brief to `done/` requires `grep -rn "<brief>" src/` and repointing its source comments. |
| 7 | **The gate is forward-only, so every number already in the app stays ungrounded forever.** Pushback #6's own example — `RECOVERY_WEIGHTS.sleep = 0.45` — ships today with a comment saying what it does and nothing about why. #5 lists it as "gated," but nothing fires unless someone changes it. **Sequencing:** #5 and #6 are not buildable items — they are the trigger spec and the output spec, and they ship *as* the `/ground` skill (deliverable 3); #3 and #4 are a separate post-build tooling track. So back-fill goes **after `/ground`** (which defines the output shape, so hand-rolling blocks first means writing them twice) and does **not** queue behind perf/lint. **Split in two:** (a) **an inventory** — ~30 min, no research, one table of every number claiming physiological meaning with value, claim, and grounded / convention / unknown; it doubles as the first real test of #5's trigger logic, against ~50 actual numbers instead of four examples. (b) **scout runs, opportunistic — not a sprint**: `RECOVERY_WEIGHTS` is already due for rewrite by the Habits reweight and the `adaptations.ts` weekly targets by the fused Home read, so both trip the #5 trigger naturally. Anything still `unknown` after one cycle (6 weeks) earns a deliberate run — reuse R2's expiry clock rather than building new machinery (R3). **Priority correction:** the 0.45 is memorable but low-stakes. `adaptations.ts` `weeklyMuscleTarget` / `weeklySessionTarget` (9×) decide what Home calls "missing," so the purpose sentence rests on them: a wrong weight tints a card, a wrong target makes the app confidently name the wrong gap. Ground the targets first. **Live case already in the code:** `src/constants/adaptations.ts:127` ships "Galpin's 3–5 rule" as a cue — a named `[single-practitioner position]` presented as settled, with no provenance. | agreed 2026-08-26, **unblocked 2026-08-26** — `/ground` has shipped, so (a) the inventory is the next action. Mode B of the skill covers the deliberate runs. |

## Consequences of the doctrine (not part of this brief)

Decided 2026-08-26 while writing `docs/doctrine.md`; each needs its own brief.

- **Home redesign + the stimulus/recovery model** — written up as
  [home-fused-reads.md](home-fused-reads.md) (proposed, not agreed). Recovery stops
  being a parallel axis and becomes the second dimension of the muscle and
  adaptation reads: one systemic number (can I push today?) plus per-muscle local
  recovery from logged-set history (what can I train today?). Its recovery-window
  numbers trip the §4.5 grounding trigger; **pushback #2 is now resolved**, so that
  brief is unblocked and waits only on an actual `science-scout` run.
- **Four folds** — Sports → Cardio, Water → Recovery, Donations → Recovery,
  Body Weight → Home stat. (Habits was a fifth candidate; it is now shelved instead.)
  UI folds are cheap; the Sports/Cardio DB merge is not, and is its own item.
- **Skill adaptation (roadmap task 8)** is forced by the Home redesign: a surface
  built to show gaps makes a permanently-zero adaptation impossible to ignore.
- **Habits shelved** (2026-08-26, delete by 2026-10-07), which also resolves the
  habit-derived muscle-contribution question: inferred stimulus goes, the muscle read
  counts logged sets only.

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
- **Local setup (2026-08-26):** Claude Code discovers project subagents by walking
  *up* from the working directory, and sessions run from `tekio-workspace/` while
  the repo is `tekio/`. `tekio-workspace/.claude/agents` is therefore a Windows
  directory junction onto `tekio/.claude/agents`, so the repo stays the single
  source of truth. Recreate with:
  `New-Item -ItemType Junction -Path .claude/agents -Target tekio/.claude/agents`
- **Resolved 2026-08-26:** the roster's "Harris" is pinned in
  `science-scout.md` as Conor Harris (`@conorharris`) — biomechanics and
  movement, PRI-influenced, weighted to the Mobility surface and explicitly a
  coach, so he never grounds a number.
- **Skill discovery (2026-08-26):** same junction trick as the agents dir —
  `tekio-workspace/.claude/skills` is a Windows directory junction onto
  `tekio/.claude/skills`, so the repo stays the single source of truth.
  Recreate with:
  `New-Item -ItemType Junction -Path .claude/skills -Target tekio/.claude/skills`
