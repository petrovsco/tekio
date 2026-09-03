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

Counts: **77 rows** — 57 fire the trigger (36 `named`, 21 `unnamed`), 8 are
ambiguous, 3 do not fire, and 9 are struck through (fixed or retired, with
nothing left to ground). **21 of the 55 firing rows are `unnamed`** — see
[§13.1](roadmap/015-ground-trigger-spec-fixes.md#131-the-gated-table-is-a-location-list).
Recounted 2026-09-01; the previous figures (64 / 8 / 3) predated the 2026-08
de-duplication strikes as well as the 019 retirements.

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
| D17 | **Heavy strength sets never feed the power map** — Galpin's bookkeeping, kept because velocity work is what silently disappears from a lifter's week. Cormie 2010 (squats at 75–90 % grew jump power as much as jump squats in not-yet-strong men) means an empty power fill is a smaller gap than it looks for someone who squats heavy; that one sentence is [031](roadmap/031-adaptations-drill-down-read.md)'s to draw on the power sheet, and no fraction of a strength set is credited to power (2026-09-03) | [Cormie 2010](https://pubmed.ncbi.nlm.nih.gov/20139780/); [Currier 2026 (ACSM)](https://pubmed.ncbi.nlm.nih.gov/41843416/) | [039 §Grounding S4](grounding/039-adaptations-read.md#grounding) · [031 §3a](roadmap/031-adaptations-drill-down-read.md#3a-one-body-map-four-toggles) |
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

## 1. Adaptation targets — what Home calls "missing"

The purpose sentence rests on these. Ground them first (Mode B, "targets before
weights").

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 1.1 | ~~`6`~~ | — | **Retired 2026-09-01.** Speed was dropped from the model (nine → seven, [done/019](roadmap/done/019-adaptation-model-simplification.md)). The constant is deleted, so the claim no longer ships. Its `convention` verdict stands as history in [011 §Grounding](roadmap/done/011-adaptation-weekly-targets.md#grounding); the reasoning behind the value survives inside row 1.2 | — | — | — |
| 1.2 | `6` | [adaptations.ts:76](../src/constants/adaptations.ts#L76) | Power needs 6 sets/muscle/week (was 4; raised to match the now-retired speed entry, which is why it is 6) | named | **convention** | adaptation-weekly-targets · **shape:** [adaptation-target-shapes](roadmap/012-adaptation-target-shapes.md) |
| 1.3 | `6` | [adaptations.ts:107](../src/constants/adaptations.ts#L107) | Strength needs 6 sets/muscle/week (was 8) | named | **grounded** | adaptation-weekly-targets |
| 1.4 | `10` | [adaptations.ts:154](../src/constants/adaptations.ts#L154) | Hypertrophy needs 10 sets/muscle/week | named | **grounded** | adaptation-weekly-targets |
| 1.5 | `6` | [adaptations.ts:180](../src/constants/adaptations.ts#L180) | Muscular endurance needs 6 sets/muscle/week | named | **convention** | adaptation-weekly-targets |
| 1.6 | ~~`3`~~ | — | **Retired 2026-09-01.** Skill was dropped from the model ([done/019](roadmap/done/019-adaptation-model-simplification.md)); its data source had already gone when sports were rerouted to cardio ([done/006](roadmap/done/006-skill-adaptation-data-source.md)). Never grounded, and now never shipped | — | — | — |
| 1.7 | `1` | [adaptations.ts:222](../src/constants/adaptations.ts#L222) | Anaerobic capacity needs 1 session/week | named | **convention** | adaptation-weekly-targets · **shape:** [adaptation-target-shapes](roadmap/012-adaptation-target-shapes.md) §5 (open question: should it have a standing target at all?) |
| 1.8 | `1` | [adaptations.ts:253](../src/constants/adaptations.ts#L253) | VO₂max needs 1 session/week | named | **grounded** | adaptation-weekly-targets |
| 1.9 | `2` | [adaptations.ts:284](../src/constants/adaptations.ts#L284) | Endurance needs 2 sessions/week — **unit known wrong**, should be weekly minutes | named | **convention** | adaptation-weekly-targets · **shape:** [adaptation-target-shapes](roadmap/012-adaptation-target-shapes.md) (carries the Attia/Galpin fork) |
| 1.10 | `0` ×7 | `weeklyMuscleTarget` / `weeklySessionTarget` sentinels throughout [adaptations.ts](../src/constants/adaptations.ts) | *Nothing.* `0` means "this axis does not apply to this adaptation" — a stand-in for `null`, read as a flag at [lib/adaptations.ts:308](../src/lib/adaptations.ts#L308) | ? | unknown † | — |
| 1.11 | all 14, duplicated | `adaptation_targets` (DB), 9 rows — 7 live, plus dead `speed` / `skill` rows nothing reads since 2026-09-01 | Identical values to 1.2–1.5 and 1.7–1.9, and **they win** — [lib/adaptations.ts:306-307](../src/lib/adaptations.ts#L306) prefers the DB row over the constant | named | **grounded** | adaptation-weekly-targets |

> **1.11 matters more than it looks.** Grounding the constants changes nothing
> the user sees. The DB rows shadow every default, are currently byte-identical,
> and carry no marker distinguishing "seeded" from "user-edited". See
> [§13.3](roadmap/015-ground-trigger-spec-fixes.md#133-the-db-shadow-makes-defaults-not-runtime-edits-undecidable).

## 2. Rep-range classification

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 2.1 | `[1, 5]` | [adaptations.ts:114](../src/constants/adaptations.ts#L114) | 1–5 reps trains strength; since 2026-09-03 the bands overlap and a 5-rep set is also a hypertrophy set. Hi edge 5 is a convention inside a 5–8 band (high-load bin ≤ 7–8 RM in every meta-analysis; zone statements end at 5–6) | named | grounded (kept, convention inside a grounded band — D32, 2026-09-03) | [039 S11](grounding/039-adaptations-read.md#grounding) |
| 2.2 | `[5, 30]` | [adaptations.ts:170](../src/constants/adaptations.ts#L170) | 5–30 reps trains hypertrophy — growth per hard set is load-independent from ~30 % 1RM (≈ 30–35 reps) to ≥ 80 %; Galpin's and Israetel's band. Was `[6, 15]`, which paid a fifth of all logged sets (16–20 reps) nothing | named | grounded (partially supported — edges moved, D30, 2026-09-03) | [039 S11](grounding/039-adaptations-read.md#grounding) |
| 2.3 | `[15, 999]` | [adaptations.ts:204](../src/constants/adaptations.ts#L204) | ≥ 15 reps trains local muscular endurance (Hackett 2022 meta-analysis; ACSM 2009 > 15); a 15–30-rep set is also a hypertrophy set. Was `[16, 999]`; 15 is the cut that was tested | named | grounded (partially supported — lo edge moved, D31, 2026-09-03) | [039 S11](grounding/039-adaptations-read.md#grounding) |
| 2.4 | ~~`reps <= 5`~~ | — | **Fixed 2026-08-26.** `classifyWeightSet` now derives its boundaries from `repRange`, so 2.1–2.3 are the live values and there is one copy | — | — | — |
| 2.5 | ~~`reps <= 15`~~ | — | **Fixed 2026-08-26**, same change | — | — | — |
| 2.6 | 21 keyword rules | [adaptations.ts:338-366](../src/constants/adaptations.ts#L338) | "kettlebell swing is power", "pogo is power", etc. — a physiological classification carrying **no digit**. All point at power: the four sprint/reactive rules (`sprint`, `dash`, `agility`, `pogo`) tagged the retired `speed` adaptation until 2026-09-01 and were repointed with it ([done/019](roadmap/done/019-adaptation-model-simplification.md)). Since 2026-09-03 `hop` / `jump` match whole words only (a "Cable Woodchop" set was silently reading as power), `clapping` is on the list and "jump rope" is excluded | named | grounded (17 keywords supported; `sled` partially; `agility` convention; the rule's exclusivity is a decision — D16, 2026-09-03) | [039 S4](grounding/039-adaptations-read.md#grounding) |

> **~~2.1–2.3 are dead code.~~ Fixed 2026-08-26** — `classifyWeightSet` now reads
> `repRange` ([lib/adaptations.ts](../src/lib/adaptations.ts#L23)), so the gated
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
| 3.3 | Power: 30–70% 1RM, 1–5 (lifts) · 3–8 (jumps, throws), 3–5, 2–5 min | [adaptations.ts:92-99](../src/constants/adaptations.ts#L92) | Load band for ballistic work — one pooled band (ACSM 2026) over three exercise-specific optima (jumps/throws ≤30 %, squat/bench 30–70 %, cleans ≥70 % — Soriano 2015/2017), split in words on the card since 2026-09-03; "never to fatigue" ≈ ≤20 % velocity loss | named | grounded (reps, sets, rest, effort supported; load partially — D15, 2026-09-03) | [039 S4](grounding/039-adaptations-read.md#grounding) |
| 3.4 | Strength: 85–100% 1RM, 3–5, 3–5, 2–5 min, 1–2 RIR | [adaptations.ts:123-149](../src/constants/adaptations.ts#L123) | Load, sets, rest and effort each sit inside a position-stand or meta-analysis band (the literature's line is ≥80 % 1RM; 85 is what 3–5 reps at 1–2 RIR implies — D20); reps 3–5 is a practical sub-band of 1–6 RM. **Cue "Galpin's 3–5 rule" kept and attributed** — Huberman Lab guest series pt 2 (2023), ep. 65 (2022); its "×/week" is a whole-body session count (frequency acts through volume) — D18 | named | grounded (supported, 2026-09-03) | [039 S5](grounding/039-adaptations-read.md#grounding) |
| 3.5 | Hypertrophy: 30–80% 1RM, 5–30 (≈8–15), 10–20 sets/muscle/wk, 30 s–2 min, 0–4 RIR | [adaptations.ts:156-163](../src/constants/adaptations.ts#L156) | ~~contradicts row 1.4~~ **Resolved 2026-08-26**: not a contradiction. The target is the minimum-effective floor; the `rx` is the productive range *whose floor is that same number*. Both unchanged, now locked together in the source comment — neither moves without the other | named | **grounded** | adaptation-weekly-targets |
| 3.6 | Musc. endurance: 40–60% 1RM, 15–40+, 2–4, <60 s | [adaptations.ts:196-218](../src/constants/adaptations.ts#L196) | Load band moved `<50%` → `40–60% 1RM` (ACSM 2009) on 2026-09-03 so load, reps and effort describe one set (D19); high reps supported (≥15 beat 7–13 at post-training 1RM), sets and rest **convention** inside the stands' bands, "to/near failure" inherited from the trials' design | named | grounded (partially supported — load moved, D19, 2026-09-03) | [039 S6](grounding/039-adaptations-read.md#grounding) |
| 3.7 | Anaerobic: all-out, 20 s–2 min, 4–8 rounds, 1:1–1:4 rest | [adaptations.ts:247-254](../src/constants/adaptations.ts#L247) | Effort band and "all-out" supported — anaerobic capacity (MAOD) rises after repeated 20–90 s efforts and not after moderate continuous work (Tabata 1996; Hov 2023), with equal anaerobic/aerobic share at ≈75 s (Gastin 2001); rounds and the rest ratio are conventions whose floors moved on 2026-09-03 to what every trial and both Galpin protocols used (D21, D22) | named | grounded (partially supported — floors moved, D21–D22, 2026-09-03) | [039 S7](grounding/039-adaptations-read.md#grounding) |
| 3.8 | VO₂max: ~90–100% HRmax, 3–8 min, 4–6 sets, ≈1:1, even max effort | [adaptations.ts:289-296](../src/constants/adaptations.ts#L289) | Intensity, interval length and ≈1:1 rest each inside a meta-analysis or RCT band (Helgerud 2007; Seiler 2013; Wen 2019; Bacon 2013); sets a convention inside "≥ 16 min of work"; the cue is Helgerud et al. 2007's protocol and since 2026-09-03 says so (D23); "Maximal" reworded to an even pace (D24) | named | grounded (partially supported — strings moved, D23–D24, 2026-09-03) | [039 S8](grounding/039-adaptations-read.md#grounding) |
| 3.9 | Endurance: Zone 2 (conversational), 30 min–hours, 1 continuous, easy | [adaptations.ts:349-356](../src/constants/adaptations.ts#L349) | Zone 2 is the band immediately below LT1/VT1 (Sitko 2025 panel; Jamnick 2020), found by the talk test (Persinger 2004; Foster 2008) — no %HRmax printed on purpose (Meixner 2025: VT1 ≈ 81 %, Fatmax ≈ 72 % HRmax, wide CV); the 30-min floor is ACSM's daily dose used per bout, a convention (Murphy 2019; D29); the cue's nasal-breathing proxy replaced by the talk test (D27) and its mitochondria claim reworded to volume (D28) | named | grounded (partially supported — cue moved, D27–D29, 2026-09-03) | [039 S9](grounding/039-adaptations-read.md#grounding) |
| 3.10 | *(none)* | [adaptations.ts:379-382](../src/constants/adaptations.ts#L379) | `ADAPTATION_PRINCIPLE`, three camps since 2026-09-03: quality (power, strength — fatigue in the set costs power and RFD per % velocity loss, strength gains flat across RIR, rest > 2 min), effort (hypertrophy, muscular endurance, anaerobic — volume is the dose, proximity to failure a load-conditioned slope, anaerobic all-out) and pace (VO₂max even-max, endurance easy ~80 % of the time). The two-camp line overclaimed "never" for strength and put Zone 2 in a "push effort" camp; the framing is Galpin's on Zatsiorsky / NSCA lineage, the seven-quality line is Tekiō's (D25, D26) | named | grounded (partially supported — wording moved, D25–D26, 2026-09-03) | [039 S10](grounding/039-adaptations-read.md#grounding) |

## 4. Recovery / readiness

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 4.1 | `8` | [app.ts:66](../src/constants/app.ts#L66) | Target 8 h sleep/night | named | unknown | home-fused-reads **(due)** |
| 4.2 | `30` | [app.ts:68](../src/constants/app.ts#L68) | Target 30 mobility min/week | named | unknown | home-fused-reads **(due)** |
| 4.3 | `2` | [app.ts:70](../src/constants/app.ts#L70) | Target 2 sauna sessions/week | named | unknown | home-fused-reads **(due)** |
| 4.4 | `2` | [app.ts:72](../src/constants/app.ts#L72) | Target 2 cold sessions/week | named | unknown | home-fused-reads **(due)** |
| 4.5 | `5` | [app.ts:74](../src/constants/app.ts#L74) | Target 5 recovery-habit bouts/week | named | unknown | home-fused-reads **(due — being deleted)** |
| 4.6 | `0.45` | [app.ts:79](../src/constants/app.ts#L79) | Sleep is 45% of systemic readiness | named | unknown | home-fused-reads **(due)** |
| 4.7 | `0.15` | [app.ts:80](../src/constants/app.ts#L80) | Mobility is 15% | named | unknown | home-fused-reads **(due)** |
| 4.8 | `0.15` | [app.ts:81](../src/constants/app.ts#L81) | Sauna is 15% | named | unknown | home-fused-reads **(due)** |
| 4.9 | `0.15` | [app.ts:82](../src/constants/app.ts#L82) | Cold is 15% | named | unknown | home-fused-reads **(due)** |
| 4.10 | `0.10` | [app.ts:83](../src/constants/app.ts#L83) | Habits are 10% — **the input being dropped**; its removal is what renormalises 4.6–4.9 | named | unknown | home-fused-reads **(due)** |
| 4.11 | `score / 100` | [RecoveryCard.tsx:65](../src/components/tabs/home/RecoveryCard.tsx#L65) | Garmin's 0–100 sleep score maps linearly onto the sub-score **and supersedes duration-vs-target when present** — two different sleep models, silently switched per night | unnamed | unknown | home-fused-reads **(due)** |
| 4.12 | `80` / `50` | [RecoveryCard.tsx:20-21](../src/components/tabs/home/RecoveryCard.tsx#L20) | ≥80% readiness is green (push), 50–79 amber, <50 red. **This is the app's answer to "am I recovered enough to push today?"** | unnamed | **convention** | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) — any fixed cutoff on a 0–100 composite is convention; grounded method is baseline-relative HRV |
| 4.13 | `sub >= 1` | [RecoveryCard.tsx:239](../src/components/tabs/home/RecoveryCard.tsx#L239) | A modality is "on target" at exactly 100% of its weekly target — no credit above, no partial band | unnamed | unknown † | home-fused-reads |
| 4.14 | `80` °C / `10` °C | [RecoveryCard.tsx:177](../src/components/tabs/home/RecoveryCard.tsx#L177), [:201](../src/components/tabs/home/RecoveryCard.tsx#L201) | Placeholder temperatures for a sauna / cold session. Stored, never scored | ? | unknown † | — |

## 5. Cycle length & deload

**Three bugs here were fixed 2026-08-26** (struck-through rows). What remains is
the claim itself: a 6-week block, deloading in week 6, at 70% of reps.
**Resolved 2026-08-26** — this was the one domain with nowhere for a block to
land; [roadmap/013-cycle-deload-grounding.md](roadmap/013-cycle-deload-grounding.md) was
created to carry it.

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 5.1 | `CYCLE = 6` | [app.ts:3](../src/constants/app.ts#L3) | A training block is 6 weeks | named | unknown | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.2 | ~~`CYCLE = 6`~~ | — | **Fixed 2026-08-26** — `utils.ts` imports `CYCLE` from `constants/app` | — | — | — |
| 5.3 | `DELOAD_WEEK = CYCLE` | [app.ts:9](../src/constants/app.ts#L9), used at [utils.ts:51](../src/lib/utils.ts#L51), [:61](../src/lib/utils.ts#L61) | **Week 6 is the deload week** — deload placement. Named as of 2026-08-26; still ungrounded | named | unknown | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.4 | `DELOAD_REP_FACTOR = 0.7` | [app.ts:16](../src/constants/app.ts#L16), applied by `deloadSets` at [utils.ts:69](../src/lib/utils.ts#L69) | Deload = 70% of last reps, load unchanged. **Fixed 2026-08-26** — was three implementations, two of which disagreed | named | unknown | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.5 | ~~`× 0.7`~~ ×2 | — | **Fixed 2026-08-26.** `VolumeRow` previewed a deload scaling *weight and reps* that the app could never apply — `ExPlan`'s button, `ExPlan`'s exported helper and `programs.deload_strategy` all say reps-only. The preview was the outlier and now calls `deloadSets` | — | — | — |
| 5.6 | `"⚠️ Deload — 70% reps"` | [VolumeRow.tsx:24](../src/components/tabs/weights/VolumeRow.tsx#L24) | The label the user reads — now derived from 5.4 and says *what* is at 70% | named | unknown | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.7 | `cycle_length_weeks: CYCLE` | [db/program.ts:259](../src/lib/db/program.ts#L259) + `programs` column default `6` | **Fixed 2026-08-26** — was hardcoded `6`; now derives from 5.1. Still write-only | named | unknown † | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.8 | `deload_week: DELOAD_WEEK` | [db/program.ts:260](../src/lib/db/program.ts#L260) | **Fixed 2026-08-26** — was hardcoded `6`; now derives from 5.3. Still write-only | named | unknown † | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.9 | `factor: DELOAD_REP_FACTOR` | [db/program.ts:261](../src/lib/db/program.ts#L261) + `programs.deload_strategy` column default | **Fixed 2026-08-26** — the write now derives from 5.4. The **jsonb column default** still carries a literal `0.7`, and nothing reads either | unnamed | unknown | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.10 | ~~`4`~~ | — | **Fixed 2026-08-26** (migration `20260826144439`). The `program_phases.duration_weeks` default asserted a 4-week phase against `CYCLE = 6`; default dropped, so a missing value is now `NULL` — which the type already allowed. No number replaced it | — | — | — |

## 6. Cardio & sport classification

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 6.1 | `>= 25` min | [lib/adaptations.ts:38](../src/lib/adaptations.ts#L38) | A session ≥25 min is endurance | unnamed | unknown | hr-zone-intensity-classification |
| 6.2 | `>= 8` min | [lib/adaptations.ts:39](../src/lib/adaptations.ts#L39) | 8–24 min is VO₂max; <8 min is anaerobic capacity | unnamed | unknown | hr-zone-intensity-classification |
| 6.3 | `2.0` | [lib/adaptations.ts:44](../src/lib/adaptations.ts#L44) | Garmin Training Effect ≥2.0 is "a real stimulus" for that system | unnamed | unknown | garmin-recovery-load-axis |
| 6.4 | `hard > easy` | [lib/adaptations.ts:52-62](../src/lib/adaptations.ts#L52) | Z4+Z5 time exceeding Z1+Z2 makes aerobic work VO₂max rather than base; unlabelled work defaults to base | unnamed | unknown | hr-zone-intensity-classification |
| 6.5 | default `vo2max` | [lib/adaptations.ts:262](../src/lib/adaptations.ts#L262) | A sport session with no logged duration is VO₂max work ("the typical intermittent-sport stimulus") | unnamed | unknown | hr-zone-intensity-classification |

## 7. Muscle & volume accounting

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 7.1 | `{1: 1, 2: 0.5, 3: 0}` | [utils.ts:503](../src/lib/utils.ts#L503) | A level-2 muscle receives half a set's stimulus; level 3 receives none — after the 042 audit it holds stabilisers and bystanders only. **Every muscle-coverage number and the whole BodyMap is denominated in this** | unnamed | grounded (level 2 supported; level 3 grounded at 0, 2026-09-03) | [039 S1](grounding/039-adaptations-read.md#grounding) + [done/042](roadmap/done/042-level-3-link-audit.md) |
| 7.2 | `level === 1 → primary` | [db/muscles.ts:77](../src/lib/db/muscles.ts#L77) | Level 1 is a primary mover; 2 and 3 are both "secondary" — collapses 7.1's three tiers into two on write | unnamed | unknown † | home-fused-reads |
| 7.3 | `1` per bout | [utils.ts:489-492](../src/lib/utils.ts#L489) | One manual habit completion = one set of stimulus | unnamed | unknown | home-fused-reads **(being deleted)** |
| 7.4 | `5` | [utils.ts:338](../src/lib/utils.ts#L338) | 5 mobility min per muscle group per week is the target | unnamed | unknown | home-fused-reads **(due)** |
| 7.5 | `aggSets >= target` + `GAP_CUTOFF = 0.70` | [lib/adaptations.ts:278](../src/lib/adaptations.ts#L278), [GapMap.tsx:20](../src/components/tabs/home/GapMap.tsx#L20) | "On track" is binary at the target; anything >0 below it is "needs work"; 0 is "untouched" — three labels over a continuous fill (sets ÷ floor): stimulus is graded from the first set, only 0 and the floor carry physiological meaning, and the 0.70 callout line is a display convention sitting just above the maintenance zone | unnamed | grounded (the ramp supported; 0.70 convention — 2026-09-02) | [039 S2](grounding/039-adaptations-read.md#grounding) |
| 7.6 | 179 rows, level 1–3 | `exercise_muscle_groups` (DB) | 179 individual "this exercise hits this muscle at this level" claims, editable in-app | ? | unknown | **(no brief)** |
| 7.7 | `WEEKLY_SET_FLOOR = 10` | [app.ts:94](../src/constants/app.ts#L94) | 10 level-weighted hard sets per muscle per week, **pooled across every rep range** at full value, is the adequacy floor for total stimulus — the hypertrophy floor is the adaptation-agnostic denominator because it is the volume-hungriest of the four; power-tagged sets are not hard sets and count on the power map only | named | grounded (value 010 D10; the pooling 039 S3, 2026-09-03) | [039 S3](grounding/039-adaptations-read.md#grounding) |
| 7.8 | `MUSCLE_WINDOW_DAYS = 14` | [app.ts:104](../src/constants/app.ts#L104) | A muscle's fill is judged over a rolling 14-day window against `MUSCLE_SET_TARGET = WEEKLY_SET_FLOOR × 2 = 20` hard sets; the sum is frequency-blind by design and recency lives in 4.x `RECOVER_DAYS`. Replaced the 42-day `CYCLE_WINDOW_DAYS` / `CYCLE_SET_TARGET = 60` pair, which hung on the program's cycle | named | convention inside a grounded 8–21 d band (2026-09-03) | [039 S12](grounding/039-adaptations-read.md#grounding) |

## 8. Estimated 1RM

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 8.1 | `1 + reps/30` | [utils.ts:123](../src/lib/utils.ts#L123) | Epley: published estimator | ? | unknown | **(no brief)** |
| 8.2 | `36/(37 − reps)` | [utils.ts:128](../src/lib/utils.ts#L128) | Brzycki: published estimator | ? | unknown | **(no brief)** |
| 8.3 | `reps >= 37 → 0` | [utils.ts:129](../src/lib/utils.ts#L129) | Guard at Brzycki's pole — mathematical, not physiological | no | unknown † | — |
| 8.4 | `(e + b) / 2` | [utils.ts:143](../src/lib/utils.ts#L143) | **Tekiō's own estimator**: the unweighted mean of Epley and Brzycki. Not a published formula; the comment says only "they diverge at the extremes" | ? | unknown | **(no brief)** |

## 9. Progression

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 9.1 | `7.5` | [ExPlan.tsx:19](../src/components/tabs/weights/ExPlan.tsx#L19) | Default weekly volume increase is +7.5% | unnamed | unknown | **(no brief)** |
| 9.2 | `min 5 / max 10` | [ExPlan.tsx:76](../src/components/tabs/weights/ExPlan.tsx#L76) | The defensible weekly-progression band is 5–10% | unnamed | unknown | **(no brief)** |
| 9.3 | `0 / +2.5 / +5 kg` | [VolumeRow.tsx:8-10](../src/components/tabs/weights/VolumeRow.tsx#L8) | The three load-jump options offered | unnamed | unknown † | — |
| 9.4 | round to `0.5` | [utils.ts:34](../src/lib/utils.ts#L34) | Plate granularity | no | unknown † | — |

## 10. Hydration & blood donation

Both fold into Recovery per the doctrine ledger, so their grounding follows the
fold.

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 10.1 | `2500` ml | [app.ts:5](../src/constants/app.ts#L5) | Daily hydration target | unnamed | unknown | home-fused-reads **(due — folding)** |
| 10.2 | `56` days | [app.ts:45](../src/constants/app.ts#L45) | Full-blood donation interval | unnamed | **convention** | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) — service rule, not physiology; calendar only |
| 10.3 | `14` days | [app.ts:46](../src/constants/app.ts#L46) | Plasma donation interval | unnamed | **convention** | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) — service rule, not physiology; calendar only |
| 10.4 | `56 * 86400000` | [OverviewTab.tsx:151](../src/components/tabs/OverviewTab.tsx#L151) | Duplicate of 10.2 as a magic literal, bypassing the constant | unnamed | **convention** | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) — service rule, not physiology; calendar only |
| 10.5 | `[100…500]` | [OverviewTab.tsx:59](../src/components/tabs/OverviewTab.tsx#L59) | Quick-add water increments — UI affordance | no | unknown † | — |

## 11. Correctly not gated

Listed so the boundary is visible, not because they need anything.

| Value | Where | Why not |
|---|---|---|
| `PREVIEW = 3`, `FILTER_AT = 30` | [HistoryList.tsx:6-8](../src/components/ui/HistoryList.tsx#L6) | List pagination |
| `revealed < 8` | [SupersetLogger.tsx:121](../src/components/tabs/weights/SupersetLogger.tsx#L121), [MobilityTab.tsx:150](../src/components/tabs/MobilityTab.tsx#L150) | Progressive disclosure |
| quality `1–5` stars | Sleep, sport and mobility forms | A subjective rating scale, not a dose |
| `SYNC_DAYS` 7 / 3 | [sync_activities.py](../scripts/garmin-sync/sync_activities.py), [sync_sleep.py](../scripts/garmin-sync/sync_sleep.py) | Backfill window |
| `/60`, `/1000`, `/3600` | garmin-sync, [utils.ts:154-179](../src/lib/utils.ts#L154) | Unit conversion |
| every hex in [colors.ts](../src/constants/colors.ts), and each adaptation's `color` | | Chart colours |

## 12. Not in the app yet

Gated by Step 0's table, but no code exists. Listed so a reader does not conclude
they were missed.

- **Nutrition FRS** — ~25 coefficients and cut-points (`0.25·P + 0.20·E + …`,
  protein 1.6–2.2 g/kg, hydration 33 ml/kg, deficit penalty k=2.5, 3-day
  smoothing 0.5/0.3/0.2, alcohol ×0.85 …) live only in
  [roadmap/done/007-nutrition-food-recovery-score.md](roadmap/done/007-nutrition-food-recovery-score.md)
  and its bench artifact. State: `unknown`, all of them.
- **Local recovery windows** — **grounded 2026-08-30**: 48–72 h band,
  48 h default, dose-dependent
  ([010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding)).
- **Per-quality staleness windows** — **grounded 2026-08-30**: VO₂max 14 d,
  endurance 14 d, anaerobic 28 d
  ([010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding)).
- **Push threshold (planned constant, 33)** — **convention 2026-08-30**: no
  literature supports an absolute cutoff on a composite score; the grounded
  method is baseline-relative HRV
  ([010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding)).
- **Donation suppression window** — **grounded 2026-08-30**: 48 h acute +
  21 d aerobic-only tail, whole blood only; plasma none
  ([010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding)).

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
