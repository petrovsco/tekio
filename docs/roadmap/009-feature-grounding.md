# Roadmap: Feature grounding — doctrine, science-scout, and review lenses

**Label:** infra
**Status:** in progress — deliverables 1-3 shipped (doctrine, science-scout, `/ground`, the 75-number inventory). The lint/dead-code/perf half moved out to 023; what is left here is the back-fill running order.
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
| 5 | Maintainability | existing `/simplify` + `/code-review`, plus **add ESLint + knip** and a tekio conventions file | **moved out to [023](023-mechanical-code-quality-tooling.md)** | tooling only |
| 6 | Performance | `npm run perf` budget script; an agent interprets the numbers | **moved out to [023](023-mechanical-code-quality-tooling.md)** | script, not agent |

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
| 3 | **A performance *reviewer* that reads code is the weakest link.** An LLM guessing at render cost yields plausible noise. Tekio's real risks are measurable: `bootstrap()` loading every domain at startup, one Zustand store holding all data, Recharts bundle weight. Build `scripts/perf-budget.mjs` (fails on bundle-size delta) + a Playwright startup/interaction timing run (Playwright MCP already wired); the agent interprets numbers, it does not guess. | **moved out 2026-08-30 to [023-mechanical-code-quality-tooling.md](023-mechanical-code-quality-tooling.md)**, which carries the argument in full. Its **argument** is also encoded in `/ground`'s scope table: the gate explicitly does not guess at render cost, and says why. |
| 4 | **Most of the maintainability reviewer already exists** (`/simplify`, `/code-review`); a third overlapping agent yields three inconsistent opinions. The genuine gap is mechanical: **no ESLint, no dead-code detection**, and files like `src/components/ui/EditModal.tsx` (862 lines) and `src/components/tabs/ProgramTab.tsx` (840 lines). Mechanize first, judge second; give `/code-review` a short tekio conventions file so its judgment is project-specific. | **moved out 2026-08-30 to [023-mechanical-code-quality-tooling.md](023-mechanical-code-quality-tooling.md)**, which carries the argument in full. Its **argument** is also encoded in `/ground`'s scope table: the gate does not judge code, so it can't become the third inconsistent opinion. |
| 5 | **"Nothing proceeds until all three grounds report" is unenforceable** and wrong at small sizes -- hard gates get bypassed exactly when moving fast. Replace with a crisp trigger: **the gate fires when a change writes a number into the app that claims physiological meaning** (weight, threshold, target, scoring coefficient). Gated: `RECOVERY_WEIGHTS`, `adaptation_targets`, FRS coefficients, rep-range boundaries. Not gated: chart colors, layout fixes, export fields. | **DONE (2026-08-26)** — shipped as `/ground` Step 0, the canonical trigger spec ([SKILL.md](../../.claude/skills/ground/SKILL.md)). Extended in two places while writing it: (a) **three exemptions** — renormalisation, unit/shape change, and rounding inside an already-grounded range — so the gate doesn't fire on numbers that move without making a new claim; (b) **the gate never blocks shipping, only shipping unlabelled** — `convention only` is a legitimate verdict that unblocks immediately, which is what keeps it from being bypassed under speed. |
| 6 | **Grounding output must land in the repo, not just in a session.** In six months nobody knows why sleep weight is 0.45. Findings write to a `## Grounding` section in the roadmap brief *and* leave a source comment on the constant itself. Durable life-knowledge still flows to the user's own knowledge base for `/ingest` -> `wiki/health/`; the *why* behind a number stays next to the number. | **DONE (2026-08-26)** — shipped as `/ground` Step 3. Adds a **verdict vocabulary** mapping the scout's four verdicts onto #7's inventory states (grounded / convention / unknown), so the inventory can be read off the briefs, and a **maintenance rule**: moving a brief to `done/` requires `grep -rn "<brief>" src/` and repointing its source comments. |
| 7 | **The gate is forward-only, so every number already in the app stays ungrounded forever.** Pushback #6's own example — `RECOVERY_WEIGHTS.sleep = 0.45` — ships today with a comment saying what it does and nothing about why. #5 lists it as "gated," but nothing fires unless someone changes it. **Sequencing:** #5 and #6 are not buildable items — they are the trigger spec and the output spec, and they ship *as* the `/ground` skill (deliverable 3); #3 and #4 are a separate post-build tooling track. So back-fill goes **after `/ground`** (which defines the output shape, so hand-rolling blocks first means writing them twice) and does **not** queue behind perf/lint. **Split in two:** (a) **an inventory** — ~30 min, no research, one table of every number claiming physiological meaning with value, claim, and grounded / convention / unknown; it doubles as the first real test of #5's trigger logic, against ~50 actual numbers instead of four examples. (b) **scout runs, opportunistic — not a sprint**: `RECOVERY_WEIGHTS` is already due for rewrite by the Habits reweight and the `adaptations.ts` weekly targets by the fused Home read, so both trip the #5 trigger naturally. Anything still `unknown` after one cycle (6 weeks) earns a deliberate run — reuse R2's expiry clock rather than building new machinery (R3). **Priority correction:** the 0.45 is memorable but low-stakes. `adaptations.ts` `weeklyMuscleTarget` / `weeklySessionTarget` (9×) decide what Home calls "missing," so the purpose sentence rests on them: a wrong weight tints a card, a wrong target makes the app confidently name the wrong gap. Ground the targets first. **Live case already in the code:** `src/constants/adaptations.ts:127` ships "Galpin's 3–5 rule" as a cue — a named `[single-practitioner position]` presented as settled, with no provenance. | **(a) DONE (2026-08-26)** — [docs/grounding-inventory.md](../grounding-inventory.md): 75 numbers across 10 domains, every one `unknown` (no `## Grounding` block exists anywhere in the repo yet). It sits outside `roadmap/` because it is an index and briefs move to `done/`. **(b) run 1 of 4 DONE (2026-08-26)** — the **adaptation targets** (inventory §1), landed in [011-adaptation-weekly-targets.md](done/011-adaptation-weekly-targets.md). Two scout runs, one decision each: five resistance per-muscle set targets, three cardio session targets. Row 1.6 (skill) deferred — blocked on a product decision, not on evidence. **Values moved:** speed 3→6, power 4→6 (nothing supports them differing), strength 8→6; hypertrophy 10, muscular endurance 6 and all three cardio targets unchanged. The `adaptation_targets` DB shadow was re-seeded in the same commit and verified by query, so the app shows the grounded numbers rather than the constants being shadowed. Row 3.5 resolved: the hypertrophy target is the floor of its own `rx` range, not a contradiction, and the two are now locked. **The check earned its keep — every `[literature]` citation was verified against NCBI eutils before pasting, and three defects were caught and sent back:** a PMID that resolved to an unrelated heart-failure paper, an author/year attribution that named someone not on the paper, and an *exploratory* study described as randomised whose stated result was reported backwards. **That third one reversed a recommendation:** run 2 opened by proposing VO₂max 1→2 and, on re-examination, withdrew it — the study reports significant improvement at *every* frequency including 1/wk with CIs crossing zero, and the shipped `1` is right as an adequacy floor. A gate that only ever confirms is not a gate. **Two findings are shape problems, not value problems, and are deferred as follow-ups in the brief:** speed/power are quality-driven qualities measured with a fatigue-shaped metric (they want session targets, which `volume[a]`'s per-set counting cannot express today), and Zone-2 endurance is dosed in weekly minutes everywhere it is published — `2` sessions at a ≥25-min threshold certifies ~50 min/wk against WHO's 150. The integer was deliberately **not** raised: 3 would buy plausibility without truth. **Remaining:** §4 recovery weights, §5 cycle/deload, and the 3.4/3.8 protocol cues — the **Back-fill running order** section below keeps the order. **The inventory doubled as #5's first real test and found seven Step 0 gaps** — moved 2026-08-26 into [015-ground-trigger-spec-fixes.md](015-ground-trigger-spec-fixes.md), each with a proposed SKILL.md edit and none applied: the gated table reads as a location list and misses 31 of 64 firing rows; `convention` is unreachable pre-scout so the state column collapses; the `adaptation_targets` DB shadow makes "defaults, not runtime edits" undecidable; the trigger is numeric but three claims carry no digit; formulas are not on the enumerated list; `src/components/ui/` is a location-shaped hole in *Not gated*; and exemption 1 preserves ungrounded ratios without clearing them. Judgement calls needed on 8 of 75 rows (11%) — inside the bar #5 set, and the misses cluster on one edit. **Three bugs found without any research, all fixed 2026-08-26:** `repRange` was gated and dead while the live boundaries were ungated (`classifyWeightSet` now derives from it); *three* deload implementations of which one disagreed (`VolumeRow` previewed a deload scaling weight *and* reps that the app could never apply — now one `deloadSets` helper behind `DELOAD_REP_FACTOR`); four copies of the cycle length saying `6, 6, 6, 4` (now one `CYCLE` + `DELOAD_WEEK`; the stray `4` was `program_phases.duration_weeks`'s column default, dropped in migration `20260826144439`). Fixes de-duplicate — they do not ground: every surviving row is still `unknown`. **An eighth Step 0 finding came out of reviewing this row** ([015-ground-trigger-spec-fixes.md](015-ground-trigger-spec-fixes.md) §13.7): #7(b) claims the Habits reweight makes `RECOVERY_WEIGHTS` "trip the #5 trigger naturally", but that reweight is exemption 1 (renormalisation) by construction, so it **does not fire**. True for the targets, false for the weights — so `RECOVERY_WEIGHTS` can be edited indefinitely without ever tripping the gate, which is #7's own "forward-only" complaint reappearing inside an exemption. Proposed fix: exemption 1 applies only when the base is already `grounded`/`convention`. Not yet applied. |

## Back-fill running order (#7(b))

Moved here 2026-08-26 from `docs/grounding-inventory.md` §13.9 under the
`pending-work-in-roadmap` house rule: it sequences 7(b), so it belongs with the
pushback rather than inside an index. Ordered by the priority already agreed
(targets before weights) and by what trips the trigger on its own.

| # | Domain | Where the block lands | Status |
|---|---|---|---|
| 1 | **§1 adaptation targets** (9 numbers + the DB shadow) — the fused Home read rewrites them, and Home's "what's missing" is denominated in them. One scout run: *weekly sets per muscle group for a trained adult*. Row 3.5 resolves in the same run. | [011-adaptation-weekly-targets.md](done/011-adaptation-weekly-targets.md) | **DONE (2026-08-26)** |
| 2 | **§4 recovery weights** (4.6–4.10) — the Habits reweight touches them, though per §13.7 the reweight itself does not ground them. Rows 4.11 and 4.12 belong in the same brief: they decide what the readiness number *means*. | [010-home-fused-reads.md](done/010-home-fused-reads.md) | pending — **but see below** |
| 3 | **§5 cycle & deload** — the disagreements (four cycle-length copies saying `6, 6, 6, 4`; two deload models one screen apart) were bugs findable without research, and were fixed 2026-08-26. The claim itself is still untouched. | [013-cycle-deload-grounding.md](013-cycle-deload-grounding.md) — **created 2026-08-26**, closing the last `(no brief)` domain in the inventory | pending |
| 4 | **3.4 / 3.8 cues** — the known debt, plus its twin. Cheapest possible run: both are named protocols, and the only question is who said it and on what. | [001-cross-adaptation-rep-ranges.md](001-cross-adaptation-rep-ranges.md) (3.4) · [005-hr-zone-intensity-classification.md](005-hr-zone-intensity-classification.md) (3.8) | pending |

**Item 2 will not arrive on its own.** The Habits reweight is `/ground` exemption 1
(renormalisation) by construction, so it does not fire the trigger — see
[015-ground-trigger-spec-fixes.md](015-ground-trigger-spec-fixes.md) §13.7. Either apply
that brief's proposed fix (exemption 1 requires a `grounded` / `convention` base)
or accept that R2's 6-week clock is the only thing that will ever pull the
recovery weights in.

## Consequences of the doctrine (not part of this brief)

Decided 2026-08-26 while writing `docs/doctrine.md`; each needs its own brief.

- **Home redesign + the stimulus/recovery model** — written up as
  [010-home-fused-reads.md](done/010-home-fused-reads.md) (proposed, not agreed). Recovery stops
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

- [x] A feature like "adaptive deload frequency" trips the numeric trigger, `/ground`
  runs, the scout returns a sourced and provenance-tagged summary in isolated
  context, and the brief gains a `## Grounding` section.
- [x] The scout never edits files.
- [x] The doctrine is short enough to be read every time and specific enough to say
  no to something real.

## Notes

- Standing working agreement (2026-08-26): mutual pushback is expected in both
  directions -- see the `feedback_mutual_pushback_rule` memory.
- **Local setup (2026-08-26; superseded the same day by the flatten):** Claude
  Code finds project subagents by walking *up* from the working directory, never
  down. While the repo sat inside a `tekio-workspace/` wrapper, the repo's
  `.claude/agents` was one level *below* the working directory and therefore
  invisible, so the wrapper carried a Windows directory junction onto it. The
  wrapper is gone — the repo is now the working directory itself, so
  `.claude/agents` sits at its root and is found directly. No junction, no
  duplication.

  **The durable finding, which cost a wrong diagnosis to learn:** a session's
  list of subagents is built **once, when the session starts**. A junction
  created at 16:03 *during* an already-running session produced *"Agent type
  'science-scout' not found"* — not because the junction was broken, but because
  that session began with no `.claude/agents` directory and so never looked
  there. Any session started afterwards found the agent normally.

  > **The rule: after you create a new `.claude/agents` or `.claude/skills`
  > directory, restart Claude Code.** Editing a file *inside* a directory that
  > already existed at startup is picked up without a restart; creating the
  > directory itself is not.

  Both halves were checked directly on 2026-08-26, in a throwaway folder with no
  other agent files anywhere, rather than guessed from behaviour:

  | Test | Result |
  |---|---|
  | Agent file reached only through a Windows junction | **found** |
  | Agent file in a nested sub-folder (`inner/.claude/agents/`), no junction | **not found** |

  The second row is why the wrapper needed a junction at all, and why deleting
  the wrapper is the better fix: discovery only walks up, so a `.claude/` one
  level *below* the working directory is invisible, while one *at* the working
  directory is found with no trickery.
- **Resolved 2026-08-26:** the roster's "Harris" is pinned in
  `science-scout.md` as Conor Harris (`@conorharris`) — biomechanics and
  movement, PRI-influenced, weighted to the Mobility surface and explicitly a
  coach, so he never grounds a number.
- **Skill discovery (2026-08-26):** skills follow exactly the same rule as
  agents. `/ground` appeared to work while `science-scout` did not, which made
  the two look like they obeyed different rules; they do not. Both are read at
  session start, and the only difference was timing — which session each was
  created in. With the wrapper removed, `.claude/skills` is found directly at the
  repo root, same as `.claude/agents`.
