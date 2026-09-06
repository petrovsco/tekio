# Grounding inventory

Every number in Tekiō that claims physiological meaning — what it is, where it
lives, what it asserts, and whether anything backs it.

**Built 2026-08-26** as pushback #7(a) of
[roadmap/done/009-feature-grounding.md](roadmap/done/009-feature-grounding.md). This is an *index*,
not a grounding block: findings live in briefs (`/ground` Step 3) and this file
points at them. It sits outside `roadmap/` on purpose — briefs move to `done/`,
an index must not.

**No research was run building this.** #7(b) is opportunistic by design.

---

## How to read it

**State** uses the `/ground` Step 3 verdict vocabulary: `grounded` /
`convention` / `unknown`.

**Updated 2026-08-26 by the first scout runs** (#7(b), run 1): the adaptation
targets in §1 are no longer `unknown` — four are `grounded`, four are
`convention`, and row 1.10 (the `0` sentinel) is deliberately deferred. Every row
outside §1 is still `unknown`. The blocks live in
[roadmap/done/011-adaptation-weekly-targets.md](roadmap/done/011-adaptation-weekly-targets.md).

**Updated 2026-09-01 by the nine → seven simplification**
([done/019](roadmap/done/019-adaptation-model-simplification.md)): speed and skill
left the model, so rows 1.1, 1.6, 3.1 and 3.2 are struck as **retired** — the
constants are deleted, so those claims no longer ship. Nothing was renormalised:
every §1 target is a per-muscle or per-session threshold standing on its own, not
a share of a total, so removing two adaptations changed no surviving value.

**Updated 2026-08-30 by the 010 runs** (018 step 7): rows 10.2–10.4 and
4.12 are now `convention`; the §12 not-yet-in-app numbers (recovery window,
staleness windows, push threshold, donation suppression) are grounded —
blocks in [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding).

**Updated 2026-09-06 by the 005 runs**: §6 is no longer `unknown`. Row 6.2
(the 8-min line) is retired, 6.4's zone share is replaced by a Z5-minutes
dose, 6.5's default moved to endurance, and two rules that never had a row —
Garmin's label regex, split into 6.6 and 6.7 — are indexed; "the dominant
system always counts" is deleted (D33–D36). Blocks in
[grounding/005](grounding/005-hr-zone-intensity-classification.md#grounding).

**Updated 2026-09-03 by the 042 link audit**: row 7.1 is `grounded` — level 2
stays 0.5 (supported, 039 S1), level 3 is 0 after the real synergists were
relabelled; decision D13.

**Updated 2026-09-03 by the 039 S12 unit** (v1.16.0): the per-muscle fill left
the program cycle — new rows 7.7 (`WEEKLY_SET_FLOOR` as the pooled rate, S3)
and 7.8 (`MUSCLE_WINDOW_DAYS`, S12); `CYCLE_SET_TARGET` and the 42-day
window are deleted; decision D14.

**Updated 2026-09-03 by the 039 S2 + S4 units** (v1.16.1): rows 2.6, 3.3 and
7.5 are `grounded` — the power card carries the exercise-specific load split,
the keyword matcher stops catching chops and jumping jacks, and the on-track
cut is labelled a convention over a continuous fill; decisions D15–D17.

**Updated 2026-09-03 by the 039 S5 + S6 units** (v1.16.3): rows 3.4 and 3.6
are `grounded` — the strength card keeps "Galpin's 3–5 rule" with attribution,
and the endurance load band moves to ACSM 2009's 40–60 % so the card's fields
describe one set; decisions D18–D20.

**Updated 2026-09-03 by the 039 S7 + S8 units** (v1.16.4): rows 3.7 and 3.8
are `grounded` — the anaerobic card's floors move to what the trials used
(4 rounds, 1:1 rest) and the VO₂max cue is attributed to Helgerud 2007 with
its effort field reworded to an even pace; decisions D21–D24.

**Updated 2026-09-03 by the 039 S10 unit** (v1.16.6): row 3.10 is `grounded`
— the principle above the cards goes from two camps to three and the reference
card's attribution shrinks to a taxonomy credit; decisions D25–D26. Rows 3.7
and 3.8 corrected in the same pass: their state and link columns had copied
row 3.6's (D19, S6) instead of their own (D21–D22, S7; D23–D24, S8).

**Updated 2026-09-03 by the 039 S9 unit** (v1.16.7): row 3.9 is `grounded` —
the endurance card keeps Zone 2 and the 30-min floor (labelled convention) and
its cue moves from nasal breathing to the talk test, with the mitochondria
claim reworded to volume; decisions D27–D29. The link columns of D25, D26 and
row 3.10 repointed in the same pass (they said `docs/grounding/…`, which from
this file resolves to a path that does not exist).

**Updated 2026-09-03 by the 039 S11 unit** (v1.16.8): rows 2.1–2.3 are
`grounded` — the rep bands now overlap (strength `[1, 5]`, hypertrophy
`[5, 30]`, muscular endurance `[15, 999]`) and a set counts in full toward
every quality whose band covers it; decisions D30–D32. The three `rx` rows
(3.4, 3.6) are untouched — the prescription says what to do, the band says
what counts. Row 3.9's and 3.10's line links shifted with the new comments.

**Updated 2026-09-05 by the 036 sweep** ([done/036](roadmap/done/036-grounding-inventory-stale-refs.md)):
§4 re-indexed against what computes today (`src/lib/fusedRead.ts`) — rows
4.1–4.10 and 4.13 are struck as **retired** (`RECOVERY_TARGETS` and
`RECOVERY_WEIGHTS` were deleted with RecoveryCard on 2026-08-31, 014), 7.3 with
the Habits section (035), and 10.4 is fixed by the same fold; rows 1.12 and
4.15–4.17 index the readiness numbers that had sat in §12 as "not in the app
yet"; every `#L<n>` anchor was re-read against its target line.

Rows marked **†** are ones I would *not* spend a scout run on — see
[§13.2](roadmap/015-ground-trigger-spec-fixes.md#132-a-fourth-inventory-state).

**Step 0** records whether the trigger spec in
[.claude/skills/ground/SKILL.md](../.claude/skills/ground/SKILL.md) catches the
number, and how cleanly:

| Mark | Meaning |
|---|---|
| `named` | Fires, and the gated table names the file/table it lives in |
| `unnamed` | Fires on the claim, but the gated table does not name where this copy lives — you would only find it by already knowing |
| `?` | Genuinely ambiguous; Step 0 does not decide it |
| `no` | Correctly not gated |

**Grounding brief** names which brief would carry the `## Grounding` block.
**(due)** = already scheduled for rewrite, so it trips the trigger on its own —
this is where #7(b) starts. **(no brief)** = nothing in `roadmap/` would carry
it; one has to be created before a scout run has anywhere to land.

Counts: **81 rows** — 50 fire the trigger (32 `named`, 18 `unnamed`), 6 are
ambiguous, 3 do not fire, and 22 are struck through (fixed or retired, with
nothing left to ground). **18 of the 50 firing rows are `unnamed`** — see
[§13.1](roadmap/015-ground-trigger-spec-fixes.md#131-the-gated-table-is-a-location-list).
Recounted 2026-09-05 after the 036 sweep; the 2026-09-01 figures
(77 / 57 / 8 / 3 / 9) predated the readiness retirements and the four rows
moved in from §12.

**Struck-through rows are fixed or retired**, not grounded. 2026-08-26 removed
six duplicate/contradictory copies (§2, §5); every surviving claim is still
`unknown`. De-duplicating a number does not ground it — it just means there is
now one thing to ground. 2026-09-01 struck four more (1.1, 1.6, 3.1, 3.2) for a
different reason: the feature that carried them was deleted, so the claim stopped
shipping. Both kinds keep their row — the number is retired, not forgotten.

---

## Decisions from scout runs

One row per *decision* a scout run produced — the design calls, not the
numbers (states live in the tables below; full evidence lives in the
briefs). `/ground` Step 3 adds a row here whenever a run's block lands.

| # | Decision (date) | Load-bearing sources | Full record |
|---|---|---|---|
| D1 | Speed and power both get `6` = 2 sessions × 3 sets — an **exposure counter, not a dose**; weekly per-muscle sets is a category error for them, and nothing supports the old 3-vs-4 distinction (2026-08-26) | Absence in [ACSM position stands](https://journals.lww.com/acsm-msse/fulltext/2009/03000/progression_models_in_resistance_training_for.26.aspx) and Ralston 2017; Galpin prescribes both identically | [011 §Decisions](roadmap/done/011-adaptation-weekly-targets.md#decisions-taken--recorded-before-the-constants-moved) |
| D2 | Strength 8 → **6** — a *derived* value: per-exercise sources converted via the premise "1 strength exercise per muscle per session", **verified against this user's own logs** (35/35 pairs). Re-run if a second strength exercise per muscle appears (2026-08-26) | ACSM 2026 (2–3 sets/exercise, ≥2 sess/wk); [Ralston 2017](https://pubmed.ncbi.nlm.nih.gov/28755103/); Supabase check 2026-08-26 | [011 §Decisions](roadmap/done/011-adaptation-weekly-targets.md#decisions-taken--recorded-before-the-constants-moved) |
| D3 | Hypertrophy floor `10` and `rx` range `10–20` are **one claim, locked**: if the floor moves to 12, the range moves to 12–20 in the same edit (2026-08-26) | [Schoenfeld 2017](https://pubmed.ncbi.nlm.nih.gov/27433992/); [Baz-Valle 2022](https://pubmed.ncbi.nlm.nih.gov/35291645/) | [011 §Decisions](roadmap/done/011-adaptation-weekly-targets.md#decisions-taken--recorded-before-the-constants-moved) |
| D4 | VO₂max stays **1/wk** — the scout's own raise-to-2 recommendation was withdrawn when the Step 2 check exposed its citations (exploratory design read as randomised; one misattributed paper). "1 maintains, 2 is where gains appear" is app copy, not a target (2026-08-26) | [Lenk 2025](https://pubmed.ncbi.nlm.nih.gov/40976973/) (correctly read); maintenance literature | [011 §cardio decision](roadmap/done/011-adaptation-weekly-targets.md#decision--cardio-weekly-session-targets-rows-1719) |
| D5 | Endurance target **deliberately left at a known-wrong value** (2 sessions ≈ 50 min/wk): the *unit* is wrong, not the integer, and moving the integer would fake plausibility. The fix is the shape change owned by 012; the Attia-vs-Galpin bout fork is decided there (2026-08-26) | [Murphy 2019](https://pubmed.ncbi.nlm.nih.gov/31267483/); WHO 150–300 min/wk | [011 §endurance](roadmap/done/011-adaptation-weekly-targets.md#endurance-the-value-is-fine-the-unit-is-wrong) |
| D6 | Muscle recovery flag = fixed **48 h** for v1 (floor of the 48–72 h band); dose-modulation (volume / proximity to failure) is the named upgrade path, not built. No 60 h midpoint — nobody holds it (2026-08-30) | [Morán-Navarro 2017](https://link.springer.com/article/10.1007/s00421-017-3725-7); [Bartolomei 2017](https://pubmed.ncbi.nlm.nih.gov/28447186/) | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |
| D7 | The Hold verdict means **modify, not rest** — in every trial the winning low-readiness response was "train easy today", never "don't train"; the gate stays advisory (2026-08-30) | [Vesterinen 2016](https://pubmed.ncbi.nlm.nih.gov/26909534/); [Saw 2016](https://pubmed.ncbi.nlm.nih.gov/26423706/) | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |
| D8 | Push threshold ships as **33, convention** (industry red-zone boundary); the *grounded* method is baseline-relative HRV (7-day rolling vs own baseline − 0.5 × SD), which would retire the constant (2026-08-30) | [Whoop recovery zones](https://support.whoop.com/s/article/WHOOP-Recovery?language=en_US) (convention); [Buchheit 2014](https://internal-journal.frontiersin.org/articles/10.3389/fphys.2014.00073/full); Vesterinen 2016 | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |
| D9 | Staleness flags mean "**you are now losing it**" — VO₂max 14 d, endurance 14 d, anaerobic 28 d — not "you missed the ~7-day feeding cadence"; the semantic fork was chosen, not inherited (2026-08-30) | [Coyle 1984](https://journals.physiology.org/doi/abs/10.1152/jappl.1984.57.6.1857); [Houmard 1992](https://pubmed.ncbi.nlm.nih.gov/1487339/); [Simoneau 1987](https://pubmed.ncbi.nlm.nih.gov/3653091/) | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |
| D10 | A full map bar means **adequate, not maximized**: anchor at 10 fractional sets/muscle/week (floor of the 10–20 band); sets are counted fractionally; the honest cycle target is 50–60 because week 6 deloads (2026-08-30) | [Schoenfeld 2017](https://pubmed.ncbi.nlm.nih.gov/27433992/); [Pelland 2026](https://pubmed.ncbi.nlm.nih.gov/41343037/); [Androulakis-Korakakis 2020](https://pubmed.ncbi.nlm.nih.gov/31797219/) | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |
| D11 | Donation suppression is **two-stage and aerobic-only**: 48 h acute (gates a Hold) + 21 d note on VO₂max/endurance only — it never dims strength or anaerobic reads; plasma gets no multi-week note at all (2026-08-30) | [Hill 2013](https://pubmed.ncbi.nlm.nih.gov/23668764/); [Ziegler 2015](https://pubmed.ncbi.nlm.nih.gov/25512178/); [Meurrens 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC5118378/) | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |
| D12 | Eligibility 56/14 is a **calendar chip only, never a readiness input** (P5): a per-service legal rule, not physiology — 21 d of suppression inside a 56 d gap means the countdown is never the binding constraint (2026-08-30) | [21 CFR 630.15](https://www.ecfr.gov/current/title-21/chapter-I/subchapter-F/part-630/subpart-B/section-630.15); [INTERVAL trial](https://pubmed.ncbi.nlm.nih.gov/28941948/) | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |
| D13 | Level 3 = **0**, level 2 stays **0.5** — the quarter-set tier is retired, not averaged away: no trial measures it and the measured minor contributors did not grow. The precondition was met first: 12 real synergists (upper back on every row, face pull, reverse fly, pull-up and overhead press; adductors in three squats; front delt in lateral raises) were relabelled to level 2 by Peter's own tick, so what remains at 3 is stabilisers and bystanders only (2026-09-03) | [Pelland 2026](https://pubmed.ncbi.nlm.nih.gov/41343037/) (fractional counting); Kubo 2019, Plotkin 2023 (hamstrings in squats did not grow); Lanza 2024 (medial deltoid in bench) | [039 §Grounding S1](grounding/039-adaptations-read.md#grounding) · [done/042 §2](roadmap/done/042-level-3-link-audit.md) |
| D14 | The muscle read's window **leaves the program cycle**: `MUSCLE_WINDOW_DAYS = 14`, a convention inside the grounded 8–21 d band, target `20 = WEEKLY_SET_FLOOR × 2`; the 42-day window and `CYCLE_SET_TARGET = 60` are deleted because no muscle evidence speaks for six weeks (supersedes D10's 50–60 cycle clause). Lower edge: volume-equated, 1×/wk per muscle matches 2–5×/wk, so the window must exceed one weekly rhythm; upper edge: earliest measured tissue loss in trained lifters at 14 d, strength holds 3–4 wk. The fill is frequency-blind by design, recency stays in `daysSince` / `RECOVER_DAYS`, and it is a schedule tolerance, not a muscle-protein-synthesis window (2026-09-03) | [Schoenfeld, Grgic & Krieger 2019](https://pubmed.ncbi.nlm.nih.gov/30558493/); [Grgic 2018](https://pubmed.ncbi.nlm.nih.gov/29470825/); [Hortobágyi 1993](https://pubmed.ncbi.nlm.nih.gov/8371654/); [McMaster 2013](https://pubmed.ncbi.nlm.nih.gov/23529287/); [Tang 2008](https://pubmed.ncbi.nlm.nih.gov/18032468/) | [039 §Grounding S12](grounding/039-adaptations-read.md#grounding) · [039 §6.6](roadmap/done/039-adaptations-read-grounding.md#66-amendment-2026-09-03--the-muscle-window-leaves-the-program-cycle) |
| D15 | **One power load band, split in words**: `30–70 % 1RM` is ACSM 2026's pooled range and Galpin's, but the meta-analyses find three exercise-specific optima (jumps/throws ≤30 %, squat/bench 30–70 %, cleans ≥70 %), so the card keeps the headline and names the split instead of picking a side; reps read `1–5 (lifts) · 3–8 (jumps, throws)` and "never to fatigue" gains "stop when the reps slow" (≈ ≤20 % velocity loss) (2026-09-03) | [Soriano 2015](https://pubmed.ncbi.nlm.nih.gov/26063470/); [Soriano 2017](https://pubmed.ncbi.nlm.nih.gov/27699699/); [Currier 2026 (ACSM)](https://pubmed.ncbi.nlm.nih.gov/41843416/); [Cormie 2011](https://pubmed.ncbi.nlm.nih.gov/21244105/); [Pareja-Blanco 2017](https://pubmed.ncbi.nlm.nih.gov/27038416/) | [039 §Grounding S4](grounding/039-adaptations-read.md#grounding) |
| D16 | **The keyword rule stays exclusive** — a keyword set is one power set and nothing else, even a ≥16-rep kettlebell swing that also trains endurance; an RIR or velocity field is the upgrade path, not a fraction nobody holds. `sled` and `agility` stay as labelled conventions; `hop` / `jump` match whole words only after a "Cable Woodchop" set was found reading as power and leaving the hard-set total; `clapping` joins (Galpin's list, 043's exercise); "jump rope" is excluded (2026-09-03) | [Lake & Lauder 2012](https://pubmed.ncbi.nlm.nih.gov/22207261/); [Otto 2012](https://pubmed.ncbi.nlm.nih.gov/22344061/); [Junior 2022](https://pubmed.ncbi.nlm.nih.gov/35518365/); [Alcaraz 2018](https://pubmed.ncbi.nlm.nih.gov/29926369/); [Sheppard & Young 2006](https://pubmed.ncbi.nlm.nih.gov/16882626/) | [039 §Grounding S4](grounding/039-adaptations-read.md#grounding) |
| D17 | **Heavy strength sets never feed the power map** — Galpin's bookkeeping, kept because velocity work is what silently disappears from a lifter's week. Cormie 2010 (squats at 75–90 % grew jump power as much as jump squats in not-yet-strong men) means an empty power fill is a smaller gap than it looks for someone who squats heavy; that one sentence is [031](roadmap/done/031-adaptations-drill-down-read.md)'s to draw on the power sheet, and no fraction of a strength set is credited to power (2026-09-03) | [Cormie 2010](https://pubmed.ncbi.nlm.nih.gov/20139780/); [Currier 2026 (ACSM)](https://pubmed.ncbi.nlm.nih.gov/41843416/) | [039 §Grounding S4](grounding/039-adaptations-read.md#grounding) · [031 §3a](roadmap/done/031-adaptations-drill-down-read.md#3a-one-body-map-four-toggles) |
| D18 | **"Galpin's 3–5 rule" stays on the strength card, attributed** — Huberman Lab guest series pt 2 (2023) and ep. 65 (2022). A practitioner heuristic whose five parts the literature supports piecewise (≥80 % loads, 1–6 RM, 2–3+ sets, >2 min rest); its "~3–5×/week" is a whole-body session count and the one element that is convention, because frequency adds strength only through volume (2026-09-03) | [Currier 2026 (ACSM)](https://pubmed.ncbi.nlm.nih.gov/41843416/); [Currier 2023](https://pubmed.ncbi.nlm.nih.gov/37414459/); [Grgic 2018 (rest)](https://pubmed.ncbi.nlm.nih.gov/28933024/); [Grgic 2018 (frequency)](https://pubmed.ncbi.nlm.nih.gov/29470825/); [Robinson 2024](https://pubmed.ncbi.nlm.nih.gov/38970765/); [guest series pt 2 (notes)](https://podcastnotes.org/huberman-lab/guest-series-dr-andy-galpin-optimal-protocols-to-build-strength-grow-muscles-part-2-huberman-lab/) | [039 §Grounding S5](grounding/039-adaptations-read.md#grounding) |
| D19 | **Endurance load `<50%` → `40–60% 1RM`** — the ACSM 2009 band and the only value under which the card's load, reps (15–40+) and effort (to/near failure) describe the same set (a 15 RM is ≈65 % 1RM). The claim is stated as *specificity* (you get better at repeating the load you practise), not "light loads build a separate quality": at post-training 1RM light loads win, at pre-training 1RM nothing does. Sets 2–4 and rest <60 s stay as labelled conventions (2026-09-03) | [ACSM 2009](https://pubmed.ncbi.nlm.nih.gov/19204579/); [Hackett 2022](https://doi.org/10.1016/j.scispo.2021.11.002); [Campos 2002](https://pubmed.ncbi.nlm.nih.gov/12436270/); [Schoenfeld 2015](https://pubmed.ncbi.nlm.nih.gov/25853914/); [Schoenfeld 2021](https://pubmed.ncbi.nlm.nih.gov/33671664/); [Wang 2023](https://pubmed.ncbi.nlm.nih.gov/36758486/) | [039 §Grounding S6](grounding/039-adaptations-read.md#grounding) |
| D20 | **Strength load stays `85–100%`, not the literature's `≥80%`** — 85 is what the card's own reps (3–5) at 1–2 RIR implies (a 5–7 RM; NSCA >85 % for <6 reps), so "correcting" it to 80 would break the set the fields describe; the ≥80 % line lives in the source comment (2026-09-03) | [Currier 2026 (ACSM)](https://pubmed.ncbi.nlm.nih.gov/41843416/); [Carvalho 2022](https://pubmed.ncbi.nlm.nih.gov/35015560/); [Lopez 2021](https://pubmed.ncbi.nlm.nih.gov/33433148/) | [039 §Grounding S5](grounding/039-adaptations-read.md#grounding) |
| D21 | **Anaerobic rounds `3–8` → `4–8`** — every protocol that raised anaerobic capacity (maximal accumulated O₂ deficit) used four rounds or more (Gibala and Hazell 4–6, Ziemann 6, Tabata 7–8, Hov 8–10), Galpin's minimum is 4, and more sprints per session gave larger anaerobic effects (Hall 2023). Nothing supports three. A floor correction inside the trial spread, not an optimum (2026-09-03) | [Tabata 1996](https://pubmed.ncbi.nlm.nih.gov/8897392/); [Hov 2023](https://pubmed.ncbi.nlm.nih.gov/36314990/); [Hazell 2010](https://pubmed.ncbi.nlm.nih.gov/20424855/); [Hall 2023](https://pubmed.ncbi.nlm.nih.gov/36165995/) | [039 §Grounding S7](grounding/039-adaptations-read.md#grounding) |
| D22 | **Anaerobic rest `1:2–1:4` → `1:1–1:4`** — the ratio that raised anaerobic capacity most reliably is 2:1 (Tabata's 20 s / 10 s; the only sprint arm to raise it in Hov 2023's men), 1:2 raised glycolytic work (Ziemann 2011), and Galpin's two protocols are 1:1 and 1:1.5 — all outside the old floor. Shorter rest builds the deficit (Tabata 1997), longer rest keeps power per rep (Hazell 2010); no trial varied the ratio alone. 2:1 stays a named protocol in the source comment, not a band on the card (2026-09-03) | [Tabata 1997](https://pubmed.ncbi.nlm.nih.gov/9139179/); [Hov 2023](https://pubmed.ncbi.nlm.nih.gov/36314990/); [Ziemann 2011](https://pubmed.ncbi.nlm.nih.gov/20661160/); [NSCA table](https://www.themovementsystem.com/blog/nsca-cscs-work-to-rest-ratios) | [039 §Grounding S7](grounding/039-adaptations-read.md#grounding) |
| D23 | **"Classic 4×4" becomes "Helgerud’s 4×4", attributed** — the cue is Helgerud et al. 2007 (NTNU) to the letter: 4 × 4 min at 90–95 % HRmax, 3 min active at 70 %, VO₂max +7.2 %. Attia prescribes it without a source; Galpin does not prescribe it, so the reference card's Huberman/Galpin line is false for this cue (S10 settles that line). The name travels in the string, as "Galpin's 3–5 rule" does (D18) (2026-09-03) | [Helgerud 2007](https://pubmed.ncbi.nlm.nih.gov/17414804/); [Hov 2023](https://pubmed.ncbi.nlm.nih.gov/36314990/); [Weston, Wisløff & Coombes 2014](https://pubmed.ncbi.nlm.nih.gov/24144531/) | [039 §Grounding S8](grounding/039-adaptations-read.md#grounding) |
| D24 | **VO₂max effort `Maximal` → `Max you can hold evenly across reps`** — every trial prescribes the hardest even pace that survives all repeats (Seiler 2013's effort-matched design landed at 88–94 % HRpeak; Helgerud 90–95 %; Attia "sustainable for at least three minutes"); "maximal" invites a sprint on the first interval. Wording, not a number (2026-09-03) | [Seiler 2013](https://pubmed.ncbi.nlm.nih.gov/21812820/); [Helgerud 2007](https://pubmed.ncbi.nlm.nih.gov/17414804/); [Attia ep. #201](https://peterattiamd.com/high-intensity-training-zone-5-to-increase-vo2-max/) | [039 §Grounding S8](grounding/039-adaptations-read.md#grounding) |
| D25 | **`ADAPTATION_PRINCIPLE` two camps → three** — "never train to fatigue" overclaimed for strength (gains flat across RIR: failure unnecessary, not harmful) and "push effort" contradicted two of the cards beneath it (VO₂max is the hardest *even* pace; Zone 2 is easy on purpose, ~80 % of endurance time); rest stays on the quality camp, where it is required, since > 60–90 s also grows more muscle. The literature is a continuum (per-% velocity loss, per-RIR slopes), so the line is a cue and each card's effort field carries the real position (2026-09-03) | [Jukic 2023](https://pubmed.ncbi.nlm.nih.gov/36178597/); [Robinson 2024](https://pubmed.ncbi.nlm.nih.gov/38970765/); [Grgic 2018](https://pubmed.ncbi.nlm.nih.gov/28933024/); [Singer 2024](https://pubmed.ncbi.nlm.nih.gov/39205815/); [Seiler 2010](https://pubmed.ncbi.nlm.nih.gov/20861519/); [Stöggl & Sperlich 2014](https://pubmed.ncbi.nlm.nih.gov/24550842/) | [039 §Grounding S10](grounding/039-adaptations-read.md#grounding) |
| D26 | **Reference card attribution → a taxonomy credit** — "Based on the Huberman Lab × Dr. Andy Galpin guest series" was true for the seven-quality set, the 3–5 rule (D18) and the strength / hypertrophy half of the principle, and false for the 4×4 (D23) and the power, endurance and anaerobic protocols (S4, S6, S7). The line now credits Galpin for the taxonomy only and says each prescription is sourced separately; named protocols carry their author in the cue string (2026-09-03) | [Galpin, guest series pt 1 (notes)](https://podcastnotes.org/huberman-lab/guest-series-dr-andy-galpin-optimal-protocols-to-build-strength-grow-muscles-part-1-huberman-lab/); [pt 2 (notes)](https://podcastnotes.org/huberman-lab/guest-series-dr-andy-galpin-optimal-protocols-to-build-strength-grow-muscles-part-2-huberman-lab/) | [039 §Grounding S10](grounding/039-adaptations-read.md#grounding) |
| D27 | **Endurance cue claim 1 `Nasal-breathing pace` → `Talk-test pace: full sentences, a little strained`** — nasal-only breathing is a ventilation ceiling, not a metabolic marker: it caps intensity from ~75 % of effort in the unadapted (Mapelli 2025, n = 12) and at VO₂max after six months' practice (Dallam 2018, n = 10), so where it caps depends on training, and no study tests it against LT1/VT1; the talk test's equivocal stage sits at the ventilatory threshold across modes (Persinger 2004) and moves with it (Foster 2008) — the only field proxy on the card with validation. Huberman's proxy, Galpin's "gear 1–2": a single-practitioner position. Wording, not a number (2026-09-03) | [Mapelli 2025](https://pubmed.ncbi.nlm.nih.gov/40668801/); [Dallam 2018](https://doi.org/10.7575/aiac.ijkss.v.6n.2p.22); [Persinger 2004](https://pubmed.ncbi.nlm.nih.gov/15354048/); [Foster 2008](https://pubmed.ncbi.nlm.nih.gov/18277826/) | [039 §Grounding S9](grounding/039-adaptations-read.md#grounding) |
| D28 | **Endurance cue claim 2 `builds mitochondria & fat oxidation` → `Minutes are the dose; hard intervals build mitochondria too`** — true of Zone 2 but not distinctive to it: work-matched HIIT raised citrate synthase and oxidative capacity more than MICT (MacInnis 2017), four weeks of below-threshold continuous work changed no mitochondrial marker (Granata 2016), two weeks of intervals raised whole-body fat oxidation 36 % (Talanian 2007), and HIIT vs MICT on maximal fat oxidation is a null (Yin 2023, 13 RCTs); the 2025 review finds no support for Zone 2 as the optimal intensity for either. Volume drives mitochondrial content (Granata 2018), so the card says volume and bridges to the VO₂max card. Wording, not a number (2026-09-03) | [MacInnis 2017](https://pubmed.ncbi.nlm.nih.gov/27396440/); [Granata 2016](https://pubmed.ncbi.nlm.nih.gov/26572168/); [Talanian 2007](https://pubmed.ncbi.nlm.nih.gov/17170203/); [Yin 2023](https://pubmed.ncbi.nlm.nih.gov/37701124/); [Storoschuk 2025](https://pubmed.ncbi.nlm.nih.gov/40560504/); [Granata 2018](https://pubmed.ncbi.nlm.nih.gov/29934848/) | [039 §Grounding S9](grounding/039-adaptations-read.md#grounding) |
| D29 | **Endurance bout length `30 min–hours` kept, labelled convention** — the 30 is ACSM 2011's daily dose (≥ 30 min·d⁻¹) borrowed as a per-bout floor: no human trial finds a per-bout threshold (Murphy 2019 — bouts vs one continuous session no different at matched volume, 19 studies, n = 1,080; Jakicic 2019), the one dose–duration curve is in rats and lengthens the floor as intensity drops (Dudley 1982), Galpin says 20–30 min and Attia / San-Millán ≥ 45. Not raised to 45: that would print San-Millán's mechanism as a finding; the ≥ 25-min classifier (005) and the weekly-minutes target (012) stay separate questions. Deliberate non-change (2026-09-03) | [Garber 2011](https://pubmed.ncbi.nlm.nih.gov/21694556/); [Murphy 2019](https://pubmed.ncbi.nlm.nih.gov/31267483/); [Jakicic 2019](https://pubmed.ncbi.nlm.nih.gov/31095078/); [Dudley 1982](https://pubmed.ncbi.nlm.nih.gov/6295989/) | [039 §Grounding S9](grounding/039-adaptations-read.md#grounding) |
| D30 | **Hypertrophy `repRange` `[6, 15]` → `[5, 30]`** — growth per hard set is load-independent from ~30 % 1RM (≈ 30–35 reps to failure) up to at least 80 % (Lasevicius 2018, 2022; Schoenfeld 2017; Lopez 2021), and 3–5 RM sets grow muscle when volume suffices (Schoenfeld 2014) though under-delivering per set at 2–4 RM (Schoenfeld 2016); 5–30 is the band Galpin and Israetel both name. Under the old cut a fifth of every set logged (16–20 reps) bought zero hypertrophy credit. Both edges are conventions inside grounded bands (lo 3–6, hi 25–35); the 30 is failure-conditional and the app assumes hard sets (S3) (2026-09-03) | [Lasevicius 2018](https://pubmed.ncbi.nlm.nih.gov/29564973/); [Lasevicius 2022](https://pubmed.ncbi.nlm.nih.gov/31895290/); [Schoenfeld 2017](https://pubmed.ncbi.nlm.nih.gov/28834797/); [Lopez 2021](https://pubmed.ncbi.nlm.nih.gov/33433148/); [Schoenfeld 2014](https://pubmed.ncbi.nlm.nih.gov/24714538/); [Schoenfeld 2016](https://pubmed.ncbi.nlm.nih.gov/27928218/); [Schoenfeld 2021](https://pubmed.ncbi.nlm.nih.gov/33671664/) | [039 §Grounding S11](grounding/039-adaptations-read.md#grounding) |
| D31 | **Muscular-endurance `repRange` `[16, 999]` → `[15, 999]`** — the one meta-analysis on the question cuts at ≥ 15 reps (Hackett 2022: g = 0.97 vs 7–13 reps at post-training 1RM) and ACSM 2009 at > 15; the trained bands that produced the endurance advantage were 20–28 and 25–35 RM (Campos 2002; Schoenfeld 2015), and heavy 6–8 RM work lost relative endurance (Anderson & Kearney 1982). 15 rather than 16 because ≥ 15 is the cut that was tested; not Galpin's test-based 5 (every set would be an endurance set and the map could never show a gap) nor Huberman's 12. Tekiō's muscular endurance is the literature's load-specific quality, not a test score; a convention inside a 12–20 band (2026-09-03) | [Hackett 2022](https://doi.org/10.1016/j.scispo.2021.11.002); [ACSM 2009](https://pubmed.ncbi.nlm.nih.gov/19204579/); [Campos 2002](https://pubmed.ncbi.nlm.nih.gov/12436270/); [Schoenfeld 2015](https://pubmed.ncbi.nlm.nih.gov/25853914/); [Anderson & Kearney 1982](https://pubmed.ncbi.nlm.nih.gov/7079558/) | [039 §Grounding S11](grounding/039-adaptations-read.md#grounding) |
| D32 | **Strength `repRange` `[1, 5]` kept, now overlapping** — 1RM gain rises with load with no step: the meta-analytic high-load bin ends at ≤ 7–8 RM (Carvalho 2022; Lopez 2021; Currier 2023) and every zone statement at 5–6 (ACSM 2009 1–6 RM; Galpin ≤ 5; Israetel 3–6); no trial separates 5 RM from 8 RM. 5 rather than 8 because a 6–8-rep set at 1–2 RIR is ≈ 75–80 % 1RM, under the ≥ 80–85 % line every source draws, and the read exists to show what is missing — those sets keep their hypertrophy credit. A 5-rep set is now one strength set *and* one hypertrophy set (Campos 2002: one 3–5 RM set fed both). Deliberate non-change (2026-09-03) | [Carvalho 2022](https://pubmed.ncbi.nlm.nih.gov/35015560/); [Lopez 2021](https://pubmed.ncbi.nlm.nih.gov/33433148/); [Currier 2023](https://pubmed.ncbi.nlm.nih.gov/37414459/); [ACSM 2009](https://pubmed.ncbi.nlm.nih.gov/19204579/); [Campos 2002](https://pubmed.ncbi.nlm.nih.gov/12436270/) | [039 §Grounding S11](grounding/039-adaptations-read.md#grounding) |
| D33 | **`TE_STIMULUS_THRESHOLD = 2.0` kept, aerobic side only; "the dominant system always counts" deleted; anaerobic TE never awards anaerobic capacity** — 2.0 is Firstbeat's "maintaining" band edge (a vendor line with no independent validation: the EPOC model's r falls to 0.61 at maximal exercise, anaerobic TE has no disclosed statistics), and Firstbeat's "anaerobic" is any work above VO₂max intensity — its own table expects 2.4–3.7 from 4–8-min bouts — while Tekiō's anaerobic capacity is 20 s–2 min all-out. A session credits one adaptation or none (2026-09-06) | [Firstbeat 2017 white paper](https://www.firstbeat.com/wp-content/uploads/2015/10/FFW609US05-171.pdf); [US 11771355 B2](https://patents.google.com/patent/US11771355B2/en); [Gastin 2001](https://pubmed.ncbi.nlm.nih.gov/11547894/) | [005 A](grounding/005-hr-zone-intensity-classification.md#grounding) |
| D34 | **Session-goal order, and the Z5 dose replaces the zone share** — structure first (`format = 'intervals'` is never endurance; bout ≤ 2 min → anaerobic, > 2 min → VO₂max once bout length exists; until then Garmin's anaerobic > aerobic TE is the vendor tie-break), then `VO2MAX_Z5_MIN = 8` minutes at ≥ 90 % HRmax (range 5–10; HR lag inside 4-min bouts), then the label only when zones are absent. "Z4+Z5 > Z1+Z2" had no source and Garmin Z4 straddles the threshold band. **Fork 1 shipped as (a):** TEMPO / LACTATE_THRESHOLD is threshold work and credits nothing, keeping endurance = Zone 2 (039 S9); widening endurance is Peter's call (2026-09-06) | [Seiler & Kjerland 2006](https://pubmed.ncbi.nlm.nih.gov/16430681/); [Sylta 2014](https://pubmed.ncbi.nlm.nih.gov/24408353/); [Buchheit & Laursen 2013](https://pubmed.ncbi.nlm.nih.gov/23539308/); [Seiler 2013](https://pubmed.ncbi.nlm.nih.gov/21812820/); [Seiler & Tønnessen 2009](https://www.sportsci.org/2009/ss.htm) | [005 A](grounding/005-hr-zone-intensity-classification.md#grounding) |
| D35 | **The duration ladder is gone; 25 min stays as an endurance-credit floor** — no source classifies a session by its length (the only duration physiology is per effort, ≈ 75 s equal share); `format` is read first, then duration only credits endurance to a steady/unstated row with no HR data at ≥ `ENDURANCE_FLOOR_MIN = 25` (a convention inside 20–30 min: ACSM's ≥ 20-min vigorous bout, Tekiō's 30-min definition), and never selects VO₂max or anaerobic; below the floor, no credit (2026-09-06) | [Gastin 2001](https://pubmed.ncbi.nlm.nih.gov/11547894/); [Garber 2011](https://pubmed.ncbi.nlm.nih.gov/21694556/); [Seiler 2010](https://pubmed.ncbi.nlm.nih.gov/20861519/); [Jamnick 2020](https://pubmed.ncbi.nlm.nih.gov/32729096/) | [005 B](grounding/005-hr-zone-intensity-classification.md#grounding) |
| D36 | **A sport session is endurance, timed or not** — `SPORT_DEFAULT_ADAPTATION` moved from `vo2max`: match play is ~70–75 % HRmax, ~52 % V̇O₂max, ~77 % of time below VT1 and ~3 % above VT2 with 5–10 s rallies; intermittency alone does not void Zone-2 credit (Sitko 2025 panel). Not "unknown" (would erase 50 of 53 matches from the read), not VO₂max (Z5 = 0 on every synced match); singles and doubles alike until a verified doubles study exists (2026-09-06) | [Baiget 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4476777/); [Ferrauti 2001](https://pubmed.ncbi.nlm.nih.gov/11513317/); [Fernandez 2006](https://pubmed.ncbi.nlm.nih.gov/16632566/); [Sitko 2025](https://pubmed.ncbi.nlm.nih.gov/40010355/) | [005 B](grounding/005-hr-zone-intensity-classification.md#grounding) |

## 1. Adaptation targets — what Home calls "missing"

The purpose sentence rests on these. Ground them first (Mode B, "targets before
weights").

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 1.1 | ~~`6`~~ | — | **Retired 2026-09-01.** Speed was dropped from the model (nine → seven, [done/019](roadmap/done/019-adaptation-model-simplification.md)). The constant is deleted, so the claim no longer ships. Its `convention` verdict stands as history in [011 §Grounding](roadmap/done/011-adaptation-weekly-targets.md#grounding); the reasoning behind the value survives inside row 1.2 | — | — | — |
| 1.2 | `6` | [adaptations.ts:74](../src/constants/adaptations.ts#L74) | Power needs 6 sets/muscle/week (was 4; raised to match the now-retired speed entry, which is why it is 6) | named | **convention** | adaptation-weekly-targets · **shape:** [adaptation-target-shapes](roadmap/012-adaptation-target-shapes.md) |
| 1.3 | `6` | [adaptations.ts:122](../src/constants/adaptations.ts#L122) | Strength needs 6 sets/muscle/week (was 8) | named | **grounded** | adaptation-weekly-targets |
| 1.4 | `10` | [adaptations.ts:173](../src/constants/adaptations.ts#L173) | Hypertrophy needs 10 sets/muscle/week | named | **grounded** | adaptation-weekly-targets |
| 1.5 | `6` | [adaptations.ts:203](../src/constants/adaptations.ts#L203) | Muscular endurance needs 6 sets/muscle/week | named | **convention** | adaptation-weekly-targets |
| 1.6 | ~~`3`~~ | — | **Retired 2026-09-01.** Skill was dropped from the model ([done/019](roadmap/done/019-adaptation-model-simplification.md)); its data source had already gone when sports were rerouted to cardio ([done/006](roadmap/done/006-skill-adaptation-data-source.md)). Never grounded, and now never shipped | — | — | — |
| 1.7 | `1` | [adaptations.ts:243](../src/constants/adaptations.ts#L243) | Anaerobic capacity needs 1 session/week | named | **convention** | adaptation-weekly-targets · **shape:** [adaptation-target-shapes](roadmap/012-adaptation-target-shapes.md) §5 (open question: should it have a standing target at all?) |
| 1.8 | `1` | [adaptations.ts:282](../src/constants/adaptations.ts#L282) | VO₂max needs 1 session/week | named | **grounded** | adaptation-weekly-targets |
| 1.9 | `2` | [adaptations.ts:322](../src/constants/adaptations.ts#L322) | Endurance needs 2 sessions/week — **unit known wrong**, should be weekly minutes | named | **convention** | adaptation-weekly-targets · **shape:** [adaptation-target-shapes](roadmap/012-adaptation-target-shapes.md) (carries the Attia/Galpin fork) |
| 1.10 | `0` ×7 | `weeklyMuscleTarget` / `weeklySessionTarget` sentinels throughout [adaptations.ts](../src/constants/adaptations.ts) | *Nothing.* `0` means "this axis does not apply to this adaptation" — a stand-in for `null`, read as a flag at [lib/adaptations.ts:346](../src/lib/adaptations.ts#L346) | ? | unknown † | — |
| 1.11 | all 14, duplicated | `adaptation_targets` (DB), 9 rows — 7 live, plus dead `speed` / `skill` rows nothing reads since 2026-09-01 | Identical values to 1.2–1.5 and 1.7–1.9, and **they win** — [lib/adaptations.ts:346-347](../src/lib/adaptations.ts#L346) prefers the DB row (`targets?.[meta.key]`) over the constant | named | **grounded** | adaptation-weekly-targets |
| 1.12 | `14` / `14` / `28` d | [app.ts:90-94](../src/constants/app.ts#L90) | `QUALITY_STALENESS_DAYS` — a cardio quality untouched for longer than this is flagged stale: VO₂max 14 d, endurance 14 d, anaerobic 28 d. The flag means "you are now losing it" (detraining onset), not "you missed the weekly cadence" (D9). Sat in §12 as not-yet-built until 2026-09-05; it shipped with the fused Home (018 unit 4) | named | **grounded** | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |

> **1.11 matters more than it looks.** Grounding the constants changes nothing
> the user sees. The DB rows shadow every default, are currently byte-identical,
> and carry no marker distinguishing "seeded" from "user-edited". See
> [§13.3](roadmap/015-ground-trigger-spec-fixes.md#133-the-db-shadow-makes-defaults-not-runtime-edits-undecidable).

## 2. Rep-range classification

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 2.1 | `[1, 5]` | [adaptations.ts:109](../src/constants/adaptations.ts#L109) | 1–5 reps trains strength; since 2026-09-03 the bands overlap and a 5-rep set is also a hypertrophy set. Hi edge 5 is a convention inside a 5–8 band (high-load bin ≤ 7–8 RM in every meta-analysis; zone statements end at 5–6) | named | grounded (kept, convention inside a grounded band — D32, 2026-09-03) | [039 S11](grounding/039-adaptations-read.md#grounding) |
| 2.2 | `[5, 30]` | [adaptations.ts:163](../src/constants/adaptations.ts#L163) | 5–30 reps trains hypertrophy — growth per hard set is load-independent from ~30 % 1RM (≈ 30–35 reps) to ≥ 80 %; Galpin's and Israetel's band. Was `[6, 15]`, which paid a fifth of all logged sets (16–20 reps) nothing | named | grounded (partially supported — edges moved, D30, 2026-09-03) | [039 S11](grounding/039-adaptations-read.md#grounding) |
| 2.3 | `[15, 999]` | [adaptations.ts:195](../src/constants/adaptations.ts#L195) | ≥ 15 reps trains local muscular endurance (Hackett 2022 meta-analysis; ACSM 2009 > 15); a 15–30-rep set is also a hypertrophy set. Was `[16, 999]`; 15 is the cut that was tested | named | grounded (partially supported — lo edge moved, D31, 2026-09-03) | [039 S11](grounding/039-adaptations-read.md#grounding) |
| 2.4 | ~~`reps <= 5`~~ | — | **Fixed 2026-08-26.** `classifyWeightSet` now derives its boundaries from `repRange`, so 2.1–2.3 are the live values and there is one copy | — | — | — |
| 2.5 | ~~`reps <= 15`~~ | — | **Fixed 2026-08-26**, same change | — | — | — |
| 2.6 | 21 keyword rules | [adaptations.ts:387-415](../src/constants/adaptations.ts#L387) | "kettlebell swing is power", "pogo is power", etc. — a physiological classification carrying **no digit**. All point at power: the four sprint/reactive rules (`sprint`, `dash`, `agility`, `pogo`) tagged the retired `speed` adaptation until 2026-09-01 and were repointed with it ([done/019](roadmap/done/019-adaptation-model-simplification.md)). Since 2026-09-03 `hop` / `jump` match whole words only (a "Cable Woodchop" set was silently reading as power), `clapping` is on the list and "jump rope" is excluded | named | grounded (17 keywords supported; `sled` partially; `agility` convention; the rule's exclusivity is a decision — D16, 2026-09-03) | [039 S4](grounding/039-adaptations-read.md#grounding) |

> **~~2.1–2.3 are dead code.~~ Fixed 2026-08-26** — `classifyWeightSet` now reads
> `repRange` ([lib/adaptations.ts:27-39](../src/lib/adaptations.ts#L27)), so the gated
> constant is the live one. Behaviour is unchanged, so no claim moved
> (exemption 2). The rows stay `unknown`: de-duplicating a number does not ground
> it. The finding it produced stands — see
> [§13.1](roadmap/015-ground-trigger-spec-fixes.md#131-the-gated-table-is-a-location-list).

## 3. `rx` prescriptions — 7 blocks, ~35 numbers in prose

One row per adaptation; the gated table covers `load / reps / sets / rest /
effort / cue` for all of them. All named, most still `unknown`, and the cues are
the sharpest debt in the app because they read as settled fact.

| # | Numbers asserted | Where | Notable claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 3.1 | ~~Skill: 3–5 reps~~ | — | **Retired 2026-09-01** with row 1.6 — the whole `skill` entry, `rx` block included, is deleted ([done/019](roadmap/done/019-adaptation-model-simplification.md)) | — | — | — |
| 3.2 | ~~Speed: 0–30% 1RM, 1–5 reps, 3–5 sets, 2–5 min~~ | — | **Retired 2026-09-01** with row 1.1 — the whole `speed` entry, `rx` block included, is deleted. Velocity work now falls under power's band (row 3.3), which is 30–70% 1RM: a *narrower* load claim than the one it replaces, so nothing ungrounded was widened | — | — | — |
| 3.3 | Power: 30–70% 1RM, 1–5 (lifts) · 3–8 (jumps, throws), 3–5, 2–5 min | [adaptations.ts:89-96](../src/constants/adaptations.ts#L89) | Load band for ballistic work — one pooled band (ACSM 2026) over three exercise-specific optima (jumps/throws ≤30 %, squat/bench 30–70 %, cleans ≥70 % — Soriano 2015/2017), split in words on the card since 2026-09-03; "never to fatigue" ≈ ≤20 % velocity loss | named | grounded (reps, sets, rest, effort supported; load partially — D15, 2026-09-03) | [039 S4](grounding/039-adaptations-read.md#grounding) |
| 3.4 | Strength: 85–100% 1RM, 3–5, 3–5, 2–5 min, 1–2 RIR | [adaptations.ts:143-150](../src/constants/adaptations.ts#L143) | Load, sets, rest and effort each sit inside a position-stand or meta-analysis band (the literature's line is ≥80 % 1RM; 85 is what 3–5 reps at 1–2 RIR implies — D20); reps 3–5 is a practical sub-band of 1–6 RM. **Cue "Galpin's 3–5 rule" kept and attributed** — Huberman Lab guest series pt 2 (2023), ep. 65 (2022); its "×/week" is a whole-body session count (frequency acts through volume) — D18 | named | grounded (supported, 2026-09-03) | [039 S5](grounding/039-adaptations-read.md#grounding) |
| 3.5 | Hypertrophy: 30–80% 1RM, 5–30 (≈8–15), 10–20 sets/muscle/wk, 30 s–2 min, 0–4 RIR | [adaptations.ts:175-182](../src/constants/adaptations.ts#L175) | ~~contradicts row 1.4~~ **Resolved 2026-08-26**: not a contradiction. The target is the minimum-effective floor; the `rx` is the productive range *whose floor is that same number*. Both unchanged, now locked together in the source comment — neither moves without the other | named | **grounded** | adaptation-weekly-targets |
| 3.6 | Musc. endurance: 40–60% 1RM, 15–40+, 2–4, <60 s | [adaptations.ts:220-227](../src/constants/adaptations.ts#L220) | Load band moved `<50%` → `40–60% 1RM` (ACSM 2009) on 2026-09-03 so load, reps and effort describe one set (D19); high reps supported (≥15 beat 7–13 at post-training 1RM), sets and rest **convention** inside the stands' bands, "to/near failure" inherited from the trials' design | named | grounded (partially supported — load moved, D19, 2026-09-03) | [039 S6](grounding/039-adaptations-read.md#grounding) |
| 3.7 | Anaerobic: all-out, 20 s–2 min, 4–8 rounds, 1:1–1:4 rest | [adaptations.ts:254-261](../src/constants/adaptations.ts#L254) | Effort band and "all-out" supported — anaerobic capacity (MAOD) rises after repeated 20–90 s efforts and not after moderate continuous work (Tabata 1996; Hov 2023), with equal anaerobic/aerobic share at ≈75 s (Gastin 2001); rounds and the rest ratio are conventions whose floors moved on 2026-09-03 to what every trial and both Galpin protocols used (D21, D22) | named | grounded (partially supported — floors moved, D21–D22, 2026-09-03) | [039 S7](grounding/039-adaptations-read.md#grounding) |
| 3.8 | VO₂max: ~90–100% HRmax, 3–8 min, 4–6 sets, ≈1:1, even max effort | [adaptations.ts:294-301](../src/constants/adaptations.ts#L294) | Intensity, interval length and ≈1:1 rest each inside a meta-analysis or RCT band (Helgerud 2007; Seiler 2013; Wen 2019; Bacon 2013); sets a convention inside "≥ 16 min of work"; the cue is Helgerud et al. 2007's protocol and since 2026-09-03 says so (D23); "Maximal" reworded to an even pace (D24) | named | grounded (partially supported — strings moved, D23–D24, 2026-09-03) | [039 S8](grounding/039-adaptations-read.md#grounding) |
| 3.9 | Endurance: Zone 2 (conversational), 30 min–hours, 1 continuous, easy | [adaptations.ts:334-341](../src/constants/adaptations.ts#L334) | Zone 2 is the band immediately below LT1/VT1 (Sitko 2025 panel; Jamnick 2020), found by the talk test (Persinger 2004; Foster 2008) — no %HRmax printed on purpose (Meixner 2025: VT1 ≈ 81 %, Fatmax ≈ 72 % HRmax, wide CV); the 30-min floor is ACSM's daily dose used per bout, a convention (Murphy 2019; D29); the cue's nasal-breathing proxy replaced by the talk test (D27) and its mitochondria claim reworded to volume (D28) | named | grounded (partially supported — cue moved, D27–D29, 2026-09-03) | [039 S9](grounding/039-adaptations-read.md#grounding) |
| 3.10 | *(none)* | [adaptations.ts:364-367](../src/constants/adaptations.ts#L364) | `ADAPTATION_PRINCIPLE`, three camps since 2026-09-03: quality (power, strength — fatigue in the set costs power and RFD per % velocity loss, strength gains flat across RIR, rest > 2 min), effort (hypertrophy, muscular endurance, anaerobic — volume is the dose, proximity to failure a load-conditioned slope, anaerobic all-out) and pace (VO₂max even-max, endurance easy ~80 % of the time). The two-camp line overclaimed "never" for strength and put Zone 2 in a "push effort" camp; the framing is Galpin's on Zatsiorsky / NSCA lineage, the seven-quality line is Tekiō's (D25, D26) | named | grounded (partially supported — wording moved, D25–D26, 2026-09-03) | [039 S10](grounding/039-adaptations-read.md#grounding) |

## 4. Recovery / readiness

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 4.1 | ~~`8`~~ | — | **Retired 2026-08-31.** `RECOVERY_TARGETS` was deleted with RecoveryCard when the fused Home shipped (018 unit 4). Sleep now enters readiness as Garmin's 0–100 score (row 4.11), never as hours against a target. Never grounded ([014 §readiness comparison](roadmap/done/014-doctrine-ledger-execution.md#the-readiness-comparison-acceptance-item-4)) | — | — | — |
| 4.2 | ~~`30`~~ | — | **Retired 2026-08-31** with 4.1. Mobility carries no weekly-minutes target anywhere now; its per-muscle target is row 7.4 | — | — | — |
| 4.3 | ~~`2`~~ | — | **Retired 2026-08-31** with 4.1. Sauna is logged (RecoverySheet), not scored — it moves no number | — | — | — |
| 4.4 | ~~`2`~~ | — | **Retired 2026-08-31** with 4.1. Cold, same as sauna | — | — | — |
| 4.5 | ~~`5`~~ | — | **Retired 2026-08-31** with 4.1; the section it counted was deleted 2026-09-05 ([done/035](roadmap/done/035-habits-expiry-deletion.md)). Never grounded | — | — | — |
| 4.6 | ~~`0.45`~~ | — | **Retired 2026-08-31.** `RECOVERY_WEIGHTS` was retired, not reweighted: the number it produced scored adherence to a recovery routine, not recovery state, and three of its five inputs had never been logged, so it could not exceed 55 on a flawless night. Never grounded — the row does not clear, it retires ([014 §readiness comparison](roadmap/done/014-doctrine-ledger-execution.md#the-readiness-comparison-acceptance-item-4)) | — | — | — |
| 4.7 | ~~`0.15`~~ | — | **Retired 2026-08-31** with 4.6 | — | — | — |
| 4.8 | ~~`0.15`~~ | — | **Retired 2026-08-31** with 4.6 | — | — | — |
| 4.9 | ~~`0.15`~~ | — | **Retired 2026-08-31** with 4.6 | — | — | — |
| 4.10 | ~~`0.10`~~ | — | **Retired 2026-08-31** with 4.6 — dropped with the whole constant rather than out of it, so nothing was renormalised and the §13.7 trap never fired. The section it weighed was deleted 2026-09-05 ([done/035](roadmap/done/035-habits-expiry-deletion.md)) | — | — | — |
| 4.11 | `(sleep + hrv) / 2` | [fusedRead.ts:439](../src/lib/fusedRead.ts#L439) | Systemic readiness is last night's Garmin sleep score blended 50/50 with the HRV sub-score (row 4.17); it degrades to sleep-only or HRV-only when one side is missing and is `null` when both are — a missing input never scores zero. The 0–100 shape and the 50/50 blend are convention: no manufacturer composite is validated as a training-decision threshold. Replaced the old card's `score / 100` sub-score, which silently switched sleep models per night | unnamed | **convention** | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |
| 4.12 | `PUSH_THRESHOLD = 33` | [app.ts:85](../src/constants/app.ts#L85), applied at [fusedRead.ts:508](../src/lib/fusedRead.ts#L508) | Readiness below 33 flips the verdict to Hold (was the old card's 80 / 50 green–amber–red bands). **This is the app's answer to "am I recovered enough to push today?"** — and Hold means modify, not rest (D7) | named | **convention** | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) — any fixed cutoff on a 0–100 composite is convention; grounded method is baseline-relative HRV (D8) |
| 4.13 | ~~`sub >= 1`~~ | — | **Retired 2026-08-31** with RecoveryCard: no modality is scored against a weekly target any more ([014 §readiness comparison](roadmap/done/014-doctrine-ledger-execution.md#the-readiness-comparison-acceptance-item-4)) | — | — | — |
| 4.14 | `80` °C / `10` °C | [RecoverySheet.tsx:42](../src/components/tabs/home/RecoverySheet.tsx#L42), [:50](../src/components/tabs/home/RecoverySheet.tsx#L50) (quick-log defaults); [EditModal.tsx:726](../src/components/ui/EditModal.tsx#L726), [:737](../src/components/ui/EditModal.tsx#L737) (placeholders) | Default temperatures for a sauna / cold session. Stored, never scored | ? | unknown † | — |
| 4.15 | `RECOVER_DAYS = 2` | [app.ts:79](../src/constants/app.ts#L79) | 48 h since a muscle's last hard set is the local recovery flag — the floor of the 48–72 h band, dose-blind by design; dose modulation is the named upgrade path (D6). Sat in §12 as not-yet-built until 2026-09-05; it shipped with the fused Home (018 unit 4) | named | **grounded** | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |
| 4.16 | `48` h / `21` d | [app.ts:125](../src/constants/app.ts#L125), read at [fusedRead.ts:470-471](../src/lib/fusedRead.ts#L470) | `DONATION_SUPPRESSION`: a full-blood donation gates a Hold for 48 h and dims the two aerobic reads for 21 d; strength and anaerobic never dim; plasma gets nothing (D11). Shipped with the fused Home, indexed here since 2026-09-05 | named | **grounded** | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |
| 4.17 | `7` d rolling / `60` d baseline / `50 + 50 × z` | [fusedRead.ts:380-381](../src/lib/fusedRead.ts#L380), [:428](../src/lib/fusedRead.ts#L428) | The HRV sub-score is baseline-relative: the 7-day rolling mean of overnight HRV placed against a 60-day baseline in SD units — 50 at baseline, 0 one SD below, 100 one SD above. A rolling window against the individual's own baseline is the method every trial used (Vesterinen 2016; Buchheit 2014); the 60-day baseline and the SD-to-0–100 scale are conventions (practitioners say 21–30 d). `MIN_HRV_BASELINE_SAMPLES = 7` and `HRV_SD_FLOOR = 0.05` are guards, not claims | unnamed | method **grounded**, scale **convention** | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |

## 5. Cycle length & deload

**Three bugs here were fixed 2026-08-26** (struck-through rows). What remains is
the claim itself: a 6-week block, deloading in week 6, at 70% of reps.
**Resolved 2026-08-26** — this was the one domain with nowhere for a block to
land; [roadmap/013-cycle-deload-grounding.md](roadmap/013-cycle-deload-grounding.md) was
created to carry it.

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 5.1 | `CYCLE = 6` | [app.ts:5](../src/constants/app.ts#L5) | A training block is 6 weeks | named | unknown | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.2 | ~~`CYCLE = 6`~~ | — | **Fixed 2026-08-26** — `utils.ts` imports `CYCLE` from `constants/app` | — | — | — |
| 5.3 | `DELOAD_WEEK = CYCLE` | [app.ts:11](../src/constants/app.ts#L11), used at [utils.ts:68](../src/lib/utils.ts#L68), [:78](../src/lib/utils.ts#L78) | **Week 6 is the deload week** — deload placement. Named as of 2026-08-26; still ungrounded | named | unknown | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.4 | `DELOAD_REP_FACTOR = 0.7` | [app.ts:18](../src/constants/app.ts#L18), applied by `deloadSets` at [utils.ts:89](../src/lib/utils.ts#L89) | Deload = 70% of last reps, load unchanged. **Fixed 2026-08-26** — was three implementations, two of which disagreed | named | unknown | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.5 | ~~`× 0.7`~~ ×2 | — | **Fixed 2026-08-26.** `VolumeRow` previewed a deload scaling *weight and reps* that the app could never apply — `ExPlan`'s button, `ExPlan`'s exported helper and `programs.deload_strategy` all say reps-only. The preview was the outlier and now calls `deloadSets` | — | — | — |
| 5.6 | `Deload` badge + `70% reps` | [VolumeRow.tsx:32-33](../src/components/tabs/weights/VolumeRow.tsx#L32) | The label the user reads — the percentage is computed from 5.4 (`DELOAD_REP_FACTOR × 100`) and says *what* is at 70%; the ⚠️ went with the chrome emoji (033) | named | unknown | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.7 | `cycle_length_weeks: CYCLE` | [db/program.ts:260](../src/lib/db/program.ts#L260) + `programs` column default `6` | **Fixed 2026-08-26** — was hardcoded `6`; now derives from 5.1. Still write-only | named | unknown † | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.8 | `deload_week: DELOAD_WEEK` | [db/program.ts:261](../src/lib/db/program.ts#L261) | **Fixed 2026-08-26** — was hardcoded `6`; now derives from 5.3. Still write-only | named | unknown † | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.9 | `factor: DELOAD_REP_FACTOR` | [db/program.ts:262](../src/lib/db/program.ts#L262) + `programs.deload_strategy` column default | **Fixed 2026-08-26** — the write now derives from 5.4. The **jsonb column default** still carries a literal `0.7`, and nothing reads either | unnamed | unknown | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.10 | ~~`4`~~ | — | **Fixed 2026-08-26** (migration `20260826144439`). The `program_phases.duration_weeks` default asserted a 4-week phase against `CYCLE = 6`; default dropped, so a missing value is now `NULL` — which the type already allowed. No number replaced it | — | — | — |

## 6. Cardio & sport classification

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 6.1 | `ENDURANCE_FLOOR_MIN = 25` | [lib/adaptations.ts:51](../src/lib/adaptations.ts#L51) | **Re-scoped 2026-09-06** — was "≥ 25 min is endurance" for every row without Garmin data; now an endurance-credit *floor* for a steady/unstated row with no intensity data, inside the honest 20–30 min band (ACSM 2011's ≥ 20-min vigorous bout; Tekiō's own 30-min endurance definition). Duration never selects VO₂max or anaerobic capacity, and `format = 'intervals'` is read before it (D35) | named | convention (not supported as a classifier; kept as a floor — D35) | [005 B](grounding/005-hr-zone-intensity-classification.md#grounding) |
| 6.2 | ~~`>= 8` min~~ | — | **Retired 2026-09-06.** No study, review or roster member classifies a session by its length; the 8–24 min "VO₂max" band credited a 20-min easy jog as interval work and a 10–20 min anaerobic session as VO₂max (D35) | — | — | [005 B](grounding/005-hr-zone-intensity-classification.md#grounding) |
| 6.3 | `TE_STIMULUS_THRESHOLD = 2.0` | [lib/adaptations.ts:54](../src/lib/adaptations.ts#L54) | Aerobic Training Effect ≥ 2.0 — the edge of Firstbeat's "maintaining" band — makes a steady session endurance; below it the session credits nothing (a TE 0.3–1.3 walk is not an endurance session). Since 2026-09-06 the *aerobic* side only: anaerobic TE never awards anaerobic capacity (Firstbeat's "anaerobic" is any work above VO₂max intensity, Tekiō's is 20 s–2 min all-out) and "the dominant system always counts" is gone (D33) | named | convention (a vendor line, no independent validation — D33) | [005 A](grounding/005-hr-zone-intensity-classification.md#grounding) |
| 6.4 | ~~`hard > easy`~~ → `VO2MAX_Z5_MIN = 8` | [lib/adaptations.ts:57](../src/lib/adaptations.ts#L57) | **Replaced 2026-09-06.** "Z4+Z5 > Z1+Z2" had no source; the VO₂max dose is minutes at ≥ 90 % HRmax (Garmin Z5), 5–10 per session — default 8, because HR needs 1–2 min of each 4-min bout to get there. Garmin Z4 (80–90 %) straddles the threshold band and never decides. On an `intervals` row the structure decides first and Z5 is the check (D34) | named | grounded (partially supported — D34) | [005 A](grounding/005-hr-zone-intensity-classification.md#grounding) |
| 6.5 | `SPORT_DEFAULT_ADAPTATION` = `'endurance'` | [lib/adaptations.ts:117](../src/lib/adaptations.ts#L117) | **Moved 2026-09-06** from `vo2max`: a tennis match is ~70–75 % HRmax, ~52 % V̇O₂max, ~77 % of playing time below VT1 and ~3 % above VT2 with 5–10 s rallies — aerobic-base work, timed or not, singles and doubles alike, until sport rows carry Garmin data (D36) | named | convention (VO₂max default not supported — D36) | [005 B](grounding/005-hr-zone-intensity-classification.md#grounding) |
| 6.6 | `THRESHOLD_LABELS` (TEMPO, THRESHOLD) | [lib/adaptations.ts:60](../src/lib/adaptations.ts#L60) | **New row 2026-09-06** for a rule that had none: Garmin's TEMPO / LACTATE_THRESHOLD primary-benefit label marks threshold work (LT1–LT2), which under 039 S8–S9 is neither Zone 2 nor VO₂max and so credits nothing — the polarized reading (fork 1a). Widening endurance to cover it is Peter's call. The old regex sent these 42 runs to VO₂max (D34) | named | grounded (partially supported — D34) | [005 A](grounding/005-hr-zone-intensity-classification.md#grounding) |
| 6.7 | `VO2MAX_LABELS` (VO2, ANAEROBIC, SPRINT, SPEED) | [lib/adaptations.ts:62](../src/lib/adaptations.ts#L62) | **New row 2026-09-06**: Garmin's VO₂max-family label stands in for the Z5 dose only when the row carries no zones — the label is a heuristic over the same TE + time-in-zone inputs (Firstbeat patent US 11771355 B2), not a measurement (D34) | named | convention (vendor heuristic — D34) | [005 A](grounding/005-hr-zone-intensity-classification.md#grounding) |

## 7. Muscle & volume accounting

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 7.1 | `{1: 1, 2: 0.5, 3: 0}` | [utils.ts:415](../src/lib/utils.ts#L415) | A level-2 muscle receives half a set's stimulus; level 3 receives none — after the 042 audit it holds stabilisers and bystanders only. **Every muscle-coverage number and the whole BodyMap is denominated in this** | unnamed | grounded (level 2 supported; level 3 grounded at 0, 2026-09-03) | [039 S1](grounding/039-adaptations-read.md#grounding) + [done/042](roadmap/done/042-level-3-link-audit.md) |
| 7.2 | `level === 1 → primary` | [db/muscles.ts:78](../src/lib/db/muscles.ts#L78) | Level 1 is a primary mover; 2 and 3 are both "secondary" — collapses 7.1's three tiers into two on write | unnamed | unknown † | home-fused-reads |
| 7.3 | ~~`1` per bout~~ | — | **Retired 2026-09-05.** `habitCompletionSets` was deleted with the Habits section ([done/035](roadmap/done/035-habits-expiry-deletion.md)); the muscle read counts logged sets only, which 014 called the more honest answer ([014 §Also resolved](roadmap/done/014-doctrine-ledger-execution.md#also-resolved-by-the-same-decision)). Never grounded | — | — | — |
| 7.4 | `WEEKLY_STRETCH_TARGET_MIN = 5` | [utils.ts:366](../src/lib/utils.ts#L366), read on the Mobility tab at [MobilityTab.tsx:186](../src/components/tabs/MobilityTab.tsx#L186) | 5 mobility min per muscle group per week is the target | unnamed | unknown | home-fused-reads **(due)** |
| 7.5 | `GAP_CUTOFF = 0.70` — `statusFor`'s on-track line, the map's callout line and the "on target" counter | [lib/adaptations.ts:265](../src/lib/adaptations.ts#L265) | One line for one question (045, 2026-09-04): a muscle at ≥ 0.70 of its window target is "on track", draws no callout and counts toward its quality being on target; anything > 0 below it is "needs work"; 0 is "untouched". Three labels over a continuous fill (sets ÷ floor): stimulus is graded from the first set, only 0 and the floor carry physiological meaning. The counter judges the leaves the map draws, inside the tracked groups. The 0.70 line is a display convention sitting just above the maintenance zone; the counter's old 100 %-of-every-muscle bar was an unnamed convention of the same kind and is gone | unnamed | grounded (the ramp supported; 0.70 convention — 2026-09-02; counter moved onto it — 2026-09-04) | [039 S2](grounding/039-adaptations-read.md#grounding), [045](roadmap/done/045-adaptations-on-target-threshold.md) |
| 7.6 | 179 rows, level 1–3 | `exercise_muscle_groups` (DB) | 179 individual "this exercise hits this muscle at this level" claims, editable in-app | ? | unknown | **(no brief)** |
| 7.7 | `WEEKLY_SET_FLOOR = 10` | [app.ts:104](../src/constants/app.ts#L104) | 10 level-weighted hard sets per muscle per week, **pooled across every rep range** at full value, is the adequacy floor for total stimulus — the hypertrophy floor is the adaptation-agnostic denominator because it is the volume-hungriest of the four; power-tagged sets are not hard sets and count on the power map only | named | grounded (value 010 D10; the pooling 039 S3, 2026-09-03) | [039 S3](grounding/039-adaptations-read.md#grounding) |
| 7.8 | `MUSCLE_WINDOW_DAYS = 14` | [app.ts:114](../src/constants/app.ts#L114) | A muscle's fill is judged over a rolling 14-day window against `MUSCLE_SET_TARGET = WEEKLY_SET_FLOOR × 2 = 20` hard sets; the sum is frequency-blind by design and recency lives in 4.x `RECOVER_DAYS`. Replaced the 42-day `CYCLE_WINDOW_DAYS` / `CYCLE_SET_TARGET = 60` pair, which hung on the program's cycle | named | convention inside a grounded 8–21 d band (2026-09-03) | [039 S12](grounding/039-adaptations-read.md#grounding) |

## 8. Estimated 1RM

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 8.1 | `1 + reps/30` | [utils.ts:151](../src/lib/utils.ts#L151) | Epley: published estimator | ? | unknown | **(no brief)** |
| 8.2 | `36/(37 − reps)` | [utils.ts:156](../src/lib/utils.ts#L156) | Brzycki: published estimator | ? | unknown | **(no brief)** |
| 8.3 | `reps >= 37 → 0` | [utils.ts:157](../src/lib/utils.ts#L157) | Guard at Brzycki's pole — mathematical, not physiological | no | unknown † | — |
| 8.4 | `(e + b) / 2` | [utils.ts:171](../src/lib/utils.ts#L171) | **Tekiō's own estimator**: the unweighted mean of Epley and Brzycki. Not a published formula; the comment says only "they diverge at the extremes" | ? | unknown | **(no brief)** |

## 9. Progression

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 9.1 | `7.5` | [ExPlan.tsx:28](../src/components/tabs/weights/ExPlan.tsx#L28) | Default weekly volume increase is +7.5% | unnamed | unknown | **(no brief)** |
| 9.2 | `min 5 / max 10` | [ExPlan.tsx:79](../src/components/tabs/weights/ExPlan.tsx#L79) | The defensible weekly-progression band is 5–10% | unnamed | unknown | **(no brief)** |
| 9.3 | `0 / +2.5 / +5 kg` | [VolumeRow.tsx:14-18](../src/components/tabs/weights/VolumeRow.tsx#L14) | The three load-jump options offered | unnamed | unknown † | — |
| 9.4 | `r05` — round to `0.5` | [utils.ts:50](../src/lib/utils.ts#L50) | Plate granularity | no | unknown † | — |

## 10. Hydration & blood donation

Both fold into Recovery per the doctrine ledger, so their grounding follows the
fold.

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 10.1 | `2500` ml | [app.ts:20](../src/constants/app.ts#L20) | Daily hydration target | unnamed | unknown | home-fused-reads **(due — folding)** |
| 10.2 | `56` days | [app.ts:66](../src/constants/app.ts#L66) | Full-blood donation interval | unnamed | **convention** | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) — service rule, not physiology; calendar only |
| 10.3 | `14` days | [app.ts:67](../src/constants/app.ts#L67) | Plasma donation interval | unnamed | **convention** | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) — service rule, not physiology; calendar only |
| 10.4 | ~~`56 * 86400000`~~ | — | **Fixed 2026-08-31.** The literal went with OverviewTab when the fused Home shipped (018 unit 4); `donationStatus` reads `DONATION_ELIGIBILITY_DAYS` ([fusedRead.ts:464](../src/lib/fusedRead.ts#L464)), so 10.2 is the one copy | — | — | — |
| 10.5 | `[100, 250, 500]` | [FoldSheet.tsx:47](../src/components/tabs/home/FoldSheet.tsx#L47) | Quick-add water increments — UI affordance | no | unknown † | — |

## 11. Correctly not gated

Listed so the boundary is visible, not because they need anything.

| Value | Where | Why not |
|---|---|---|
| `PREVIEW = 3`, `FILTER_AT = 30` | [HistoryList.tsx:7-9](../src/components/ui/HistoryList.tsx#L7) | List pagination |
| `revealed < 8` / `revealedEx < 8` | [SupersetLogger.tsx:124](../src/components/tabs/weights/SupersetLogger.tsx#L124), [MobilityTab.tsx:167](../src/components/tabs/MobilityTab.tsx#L167) | Progressive disclosure |
| quality `1–5` stars | Sleep, sport and mobility forms | A subjective rating scale, not a dose |
| `SYNC_DAYS` 7 / 3 | [sync_activities.py](../scripts/garmin-sync/sync_activities.py), [sync_sleep.py](../scripts/garmin-sync/sync_sleep.py) | Backfill window |
| `/60`, `/1000`, `/3600` | garmin-sync, [utils.ts:182-208](../src/lib/utils.ts#L182) | Unit conversion |
| every hex in [ui/chart.ts](../src/components/ui/chart.ts) and every token in [index.css](../src/index.css) | | Chart and UI colours — `colors.ts` and each adaptation's `color` field were deleted by 033 |

## 12. Not in the app yet

Gated by Step 0's table, but no code exists. Listed so a reader does not conclude
they were missed.

- **Nutrition FRS** — ~25 coefficients and cut-points (`0.25·P + 0.20·E + …`,
  protein 1.6–2.2 g/kg, hydration 33 ml/kg, deficit penalty k=2.5, 3-day
  smoothing 0.5/0.3/0.2, alcohol ×0.85 …) live only in
  [roadmap/done/007-nutrition-food-recovery-score.md](roadmap/done/007-nutrition-food-recovery-score.md)
  and its bench artifact. State: `unknown`, all of them.
- **The four numbers listed here on 2026-08-30** — local recovery window,
  per-quality staleness windows, push threshold, donation suppression — shipped
  with the fused Home (018 unit 4) and are indexed as rows 4.15, 1.12, 4.12 and
  4.16 since 2026-09-05.

---

## 13. What this exercise found about the trigger

The inventory doubled as the first real test of `/ground` Step 0's trigger and
found **eight gaps** — 8 of 75 rows (11%) needed a judgement call Step 0 does not
make. Each carries a proposed `SKILL.md` edit; **none are applied**.

**Moved 2026-08-26 to [roadmap/015-ground-trigger-spec-fixes.md](roadmap/015-ground-trigger-spec-fixes.md)**
under the `pending-work-in-roadmap` house rule: they are pending work, and this
file is an index. The `13.x` numbering is preserved there, so existing references
to §13.1–§13.8 still resolve.

The back-fill running order that was §13.9 now lives in
[roadmap/done/009-feature-grounding.md](roadmap/done/009-feature-grounding.md) beside pushback #7,
whose 7(b) it sequences.
