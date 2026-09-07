# Roadmap: Profile HRmax and the typed-HR path

**Label:** feature
**Status:** done — shipped 2026-09-07 (v2.0.33), the same day it was split out of [005](005-hr-zone-intensity-classification.md). The scout picked an observed peak over a formula (196 bpm for Peter, replicated within 3 bpm over 24 months) with a typed override; the typed-HR path reads steady manual rows against it, and a hand-logged match never promotes. Nothing fires on a synced row.
**Release:** 2.1.0

## Why

005's grounding (run B) settled how a hand-logged steady session with a typed
average HR should be read: as a share of HRmax — ≤ ~83 % endurance, 84–88 %
endurance flagged threshold, ≥ ~89–90 % VO₂max — before duration is consulted
at all. The rule is grounded and unbuilt for one reason: **the app holds no
HRmax.** `user_profiles` carries a display name, units, a progression model,
a timezone, the week start and the tracked muscle groups, and nothing about
the heart. Without the denominator a typed 150 bpm means nothing, so such a
row falls straight to the 25-min floor (row 6.1) and its HR is ignored.

The honest count, 2026-09-07: **the path serves no row yet.** All 220
`cardio_sessions` rows are Garmin-sourced with Training Effect, and no
`sport_sessions` row carries a typed HR without a Garmin id — since the
history backfill ([054](054-garmin-history-backfill-cardio-hiit.md)) and
the same-date claim, every session the user logs is the watch's. The path matters
for the day the watch is not worn, and for what the HRmax unlocks elsewhere:

- [057](../057-threshold-sessions-labelled.md) shape B — the threshold label on a
  hand-logged row needs the 84–88 % band, so it needs this number.
- The Zone-2 gate 005's grounding called "the sturdier gate when HRmax is
  known" for rides and walks sitting on the aerobic TE 2.0 line (cycling's
  median TE is exactly 2.0) — a synced-row use, so the denominator is not only
  a manual-row concern.
- Every % figure in the grounding's translation of the synced matches ("72–85 %
  of the match's own peak") stays provisional until the app knows the HRmax
  the watch uses.

## The case against

- **Capture.** One number, typed once on the Profile tab — the cheapest
  capture the app has, but capture all the same. A birth year plus a formula
  would be cheaper still and less honest; the scout decides which the app
  stores.
- **It is a number with physiological meaning.** 220 − age (Peter set the
  watch to 185 = 220 − 35 on 2026-09-07) is the formula the literature has
  spent two decades replacing (Tanaka 2001 and its successors are the scout's
  first stop), and a running spike of 214 had earlier set the watch too high,
  which is why no session in the history reached 8 min in Z5. So `/ground`
  first: which HRmax does the app hold — a formula, the watch's own
  auto-detected value, or the observed peak over a window — and how often is
  it refreshed?
- **Consistency with the watch.** Garmin's zones (row 6.4's Z5 dose) are
  computed from the watch's HRmax. If the app holds a different number, a
  synced row's Z5 minutes and a typed row's % HRmax sit on two scales. The
  simplest honest answer may be to sync the watch's value.
- **Zero rows today.** See above. If 2.1.0 gets crowded this is the brief to
  move to backlog; what revives it is a manual row with a typed HR, or 057
  picking shape B.

## Shape

1. **`/ground`** — one science-scout run: the HRmax the app should hold
   (formula vs device auto-detect vs observed peak), its error band, and the
   refresh rule. Lands as a `## Grounding` block here and a source comment on
   the constant or column.
2. **Profile** — `user_profiles.hr_max` (or what the scout picked), a field on
   the Profile tab, the store carrying it to the classifier.
3. **Classifier** — on a steady or unstated row with no Training Effect and a
   typed `avgHr`, the % HRmax bands decide before the duration floor (run B's
   order: `format` → typed HR → duration). Two new inventory rows (the 83 %
   and the 89–90 % cuts) with a ledger entry; the 84–88 % band is a label, not
   a bucket, and belongs to 057 B.
4. **Sport rows** — the same rule on a hand-logged match with a typed HR,
   remembering the grounding's caveat that HR over-reads tennis by about a
   zone (Ferrauti 2001); the scout says whether the bands shift for sport.
5. Tests at each band edge. `analyze_dump.py` needs nothing — no synced row
   takes this path.

## Doctrine checklist

1. **Which read does this sharpen?** The cardio-adaptation bands on Home and
   Adaptations, for the rows the watch did not record.
2. **What does it let me stop doing?** Ignoring a typed HR; the duration floor
   stops being the only rule for a manual row.
3. **Input or destination?** Input — one profile number and one rule.
4. **Honest shape of the data?** One number per user, refreshed rarely; per
   session, a share of it.
5. **Does it write a number claiming physiological meaning?** Yes, twice — the
   HRmax and the % cuts. `/ground` before any code: the cuts are grounded in
   005 run B, the HRmax is not.

## Out of scope

- Reading the typed HR on `intervals` rows — the average is meaningless there
  (a 4×4 averages ~140 bpm); `format` wins.
- Changing Garmin's zones or re-deriving Z5 minutes from the app's HRmax.

## Grounding

**Claim:** One maximal heart rate (HRmax, bpm) per user, the denominator of the typed-HR path: a hand-logged steady cardio/sport row with a typed average HR is credited endurance at ≤ ~83 % HRmax, endurance-flagged-threshold at 84–88 %, VO₂max at ≥ ~89–90 %. Three parts: (a) which HRmax the app holds (formula / watch / observed peak; one number or per modality), (b) its error band in bpm and what that does to the cuts, (c) how often it must be refreshed.
**Searched:** 2026-09-07 · **Verdict:** partially supported — *observed peak over a formula* is supported (population validations put every age formula at ±9–11 bpm RMSE for an individual, and field peaks in trained people sit 5–13 bpm above formula and lab values); the *specific statistic and window* (replicated peak, 24 months) are a convention no study tests; the *formula as a default* is not supported for a user whose own data already exceeds it (P4).
**Number to use:** For Peter, 191–196 bpm by window — default **196**, computed as the highest session max HR that a second session comes within 3 bpm of, over a rolling 24-month window, land modalities only (swimming excluded), with a typed override for a chest-strap test; fallback when the window holds no session = **208 − 0.7 × age** (183–184 for age 35), row flagged "denominator estimated". Formulas for age 35 give 183.5–188.6, 7–13 bpm (4–7 % of HRmax) below the rowing peaks that recur six times in his own history, so a formula default would move every cut by roughly one Tønnessen band.

### Evidence

*(a) Formula vs observed — what the formulas can and cannot do*

- `[literature]` 220 − age was never derived from a study: it "resulted from observation based on data from approximately 11 references", and the formula literature's error is "Sxy = 7–11 b/min"; the authors conclude it "has no scientific merit" for individual use. Narrative/historical review — [Robergs & Landwehr 2002, JEPonline](https://eprints.qut.edu.au/96880/) (not PubMed-indexed; QUT ePrints copy)
- `[literature]` 208 − 0.7 × age; HRmax "independent of gender and habitual physical activity status", age explaining ~80 % of *group-mean* variance. Meta-analysis of 351 studies / 492 groups / 18,712 subjects, cross-validated in a lab cohort of 514 healthy adults — [Tanaka, Monahan & Seals 2001, JACC](https://pubmed.ncbi.nlm.nih.gov/11153730/)
- `[literature]` 211 − 0.64 × age with SEE 10.8 bpm; no interaction with sex, activity, VO₂max or BMI — so no formula gets better by knowing the person is trained. Cross-sectional, n = 3,320 healthy adults — [Nes et al. 2013, Scand J Med Sci Sports](https://pubmed.ncbi.nlm.nih.gov/22376273/)
- `[literature]` 207 − 0.7 × age from repeated tests in the same people — the within-person slope is ~0.7 bpm per year. Longitudinal, n = 132 adults, 908 GXTs over 25 years — [Gellish et al. 2007, MSSE](https://pubmed.ncbi.nlm.nih.gov/17468581/)
- `[literature]` In endurance athletes every one of 13 formulas has RMSE 9.1–10.5 bpm: 220 − age bias −0.18 / RMSE 9.79 (running); Tanaka −1.50 / 9.18; Nes +3.63 / 9.69; Gellish −2.50 / 9.40. Retrospective validation against CPET, n = 5,311 (4,043 runners 33.6 ± 8.1 y, 1,268 cyclists 36.9 ± 9.0 y) — [Kasiak et al. 2023, J Clin Med](https://pubmed.ncbi.nlm.nih.gov/37109218/)
- `[literature]` Same picture outside athletes: RMSE 9.2–10.9 bpm, MAE 7.4–8.6, 95 % limits of agreement about ±18–24 bpm for Fox/Tanaka/Gellish/Arena/Nes; fitness had "only a limited influence" on the error; "all formulas exhibited considerable error margins, limiting their precision for individual-level application". Retrospective GXT analysis, n = 230 adults 18–68 y, Polar H10 criterion — [Martin et al. 2025, PLOS One](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0335842)
- `[literature]` Even a purpose-built multivariate model for active people bottoms out at MAE 7.04 bpm; 220 − age "yields remarkably high mean errors of up to 9 bpm" in some age bands; testing modality is statistically significant but adds 0.002 to R². Cross-sectional, n = 3,374 active adults (VO₂max ~50) — [Lach et al. 2021, Front Physiol](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2021.695950/full)
- `[literature]` Athletes' own field peaks sit above the formulas: mean bias −5.8 bpm (Fox) and −4.8 bpm (Tanaka), Tanaka's limits of agreement −18.5 to +9.1 bpm; age explains only r = −0.60 of HRmax; VO₂max-test HRpeak "underestimates true HRmax by approximately 5–6 bpm in endurance athletes" (Ingjer 1991, as relayed); recommendation: "prioritize individualized field-verified HRmax … over generic equations or single laboratory tests", via "a 10–30-min warm-up followed by 2–3 maximal 3 to 4-min runs". Cross-sectional survey, n = 4,375 endurance athletes (43 ± 11 y, 75 % male; cycling 42 %, running 27 %, rowing 7 %), *self-reported* highest recorded HR, sensor not recorded — [Ausland, Kelemen & Seiler 2026, Front Sports Act Living](https://pubmed.ncbi.nlm.nih.gov/42088591/)
- `[literature]` Lab GXT 194 ± 2 bpm vs training intervals 207 ± 5 vs competition 206 ± 4 in the same runners — field peaks 12–13 bpm above the lab test; the lab ventilatory threshold was 83 % of lab HRmax but only 77 % of field HRmax, i.e. the denominator shifts the % cuts by ~6 points. Observational, n = 20 NCAA D2 distance runners (10 F / 10 M) — [Semin et al. 2008, J Sports Sci Med](https://pubmed.ncbi.nlm.nih.gov/24149950/)
- `[literature]` Even chest-strap peaks need a rule, and the rule the cardiologists used is a *density* estimate, not the single max: individual HRmax taken as "the inflection point of the kernel density of all peak HR values"; readings above it occurred in 1.0 % of sessions and 53 % of athletes; morphology gradual overshoot 49 %, paroxysmal spikes 28 %, erratic noise 16 %, isolated outliers 4 %, saturation 3 %. Observational, 251 endurance athletes, 57,282 chest-strap sessions — [Buyck et al. 2026, Europace (suppl.)](https://pmc.ncbi.nlm.nih.gov/articles/PMC13302236/)

*(a) Sensor — what a session max HR is worth*

- `[literature]` Wrist optical during trail running: Garmin Fenix 5 MAPE 13 %, limits of agreement **−32 to +162 bpm**, rc 0.32 against a Polar H7 strap — single-sample spikes of this size are what a "session max" can be. Observational validation, n = 21 (10 F, 31 y), 3.22 km — [Navalta et al. 2020, PLOS One](https://pubmed.ncbi.nlm.nih.gov/32866216/)
- `[literature]` Chest strap vs ECG rc 0.996; Garmin Forerunner wrist rc 0.81; accuracy best on the treadmill, worst on the elliptical. Observational, n = 50 healthy adults, treadmill/bike/elliptical — [Gillinov et al. 2017, MSSE](https://pubmed.ncbi.nlm.nih.gov/28709155/); in athletes on a treadmill at 4–9 mph: Polar H7 rc 0.98, Garmin Vivosmart HR rc 0.89, n = 50 — [Pasadyn et al. 2019, Cardiovasc Diagn Ther](https://pubmed.ncbi.nlm.nih.gov/31555543/)
- `[literature]` Wrist optical on a rowing ergometer *under*-reads: MAE 19.8 bpm, MAPE 13.4 %, undershooting in 38.7 % of readings, "attributed to repetitive and forceful wrist flexion and gripping motions" (running MAE 12.1, also undershooting). Observational validation, Fitbit Inspire 2 vs Polar H10, n = 20 healthy young + 30 cardiac-rehab patients — [Vermunicht et al. 2025, Eur Heart J Digit Health](https://pmc.ncbi.nlm.nih.gov/articles/PMC12450509/). the user's recurring rowing peaks are therefore more likely floors than spikes.
- `[literature]` A chest strap is the honest instrument: Polar H10 RR-interval signal quality 99.6 % overall and 99.4 % during high-intensity activity, r = 0.997 vs Holter ECG. Observational, n = 10 — [Gilgen-Ammann et al. 2019, Eur J Appl Physiol](https://link.springer.com/article/10.1007/s00421-019-04142-5)

*(a) Modality — one number or several*

- `[literature]` Rowing HRmax 194 ± 9 vs running 198 ± 11 bpm (−4). Crossover, n = 55 healthy men, 21 ± 3 y — [Yoshiga & Higuchi 2002, Eur J Appl Physiol](https://pubmed.ncbi.nlm.nih.gov/12070617/). Running 184.6 vs cycling 182.7 (−2, p = 0.001), n = 5,311 — Kasiak 2023 above. Land-mode differences are inside the formula error band.
- `[literature]` Swimming HRmax 6.7 ± 5.3 bpm below running (193.6 vs 199.9) and 5.7 ± 6.5 below cycling; the authors "recommend to test the maxHR in each individual swimmer for sports regularly used in swim training". Randomised crossover, n = 12 elite swimmers, 18.8 y — [Olstad et al. 2019, Sports (Basel)](https://pubmed.ncbi.nlm.nih.gov/31726693/)

*(c) Drift — age and training status*

- `[literature]` "HRmax can be altered by 3 to 7 % with aerobic training/detraining" (mechanisms: plasma volume, baroreflex, sinoatrial node, β-receptor density); the author recommends monitoring HRmax "at every macrocycle (3 to 6 weeks)". Narrative review — [Zavorsky 2000, Sports Med](https://pubmed.ncbi.nlm.nih.gov/10688280/)
- `[literature]` HRmax fell over 8.5 years in master runners regardless of sex, age group or change in training volume — the age decline is real in trained people and training does not stop it. Longitudinal, n = 86 M (53.9 y) + 49 F (49.1 y) — [Hawkins et al. 2001, MSSE](https://pubmed.ncbi.nlm.nih.gov/11581561/). Cross-sectional slopes 0.64–0.7 bpm/yr (Nes, Tanaka above); within-person 0.7 bpm/yr (Gellish above).

*Vendor behaviour (tier 6, manufacturer documentation)*

- `[literature]` Garmin: "The default maximum heart rate is 220 minus your age" — [Forerunner 45 manual](https://www8.garmin.com/manuals/webhelp/forerunner45/EN-US/GUID-28038039-8D8B-4672-8412-E2E4C5A822E2.html); auto-detection is on by default and "only detects a maximum heart rate when your heart rate is higher than the value set in your user profile" — a one-way ratchet with no published artifact filter — [Forerunner 245 manual](https://www8.garmin.com/manuals/webhelp/forerunner245/EN-US/GUID-F7949BD6-8AC9-4015-8D63-E5F085E55279.html). The same ratchet is described as "one-directional — Garmin raises the value from new peaks but never lowers it automatically" and "an optical artefact spike could otherwise overwrite a known accurate value" — blog explainer, not a study — [the5krunner](https://the5krunner.com/garmin-features/physiology/max-heart-rate/). Peter's 214 is that failure, observed.

*Roster*

- `[practitioner consensus]` Use the person's realized/observed maximum, not a formula: Attia — "You want to know your actual maximum heart rate – zone 2 will be about 70–80 % of the realized maximum heart rate" ([Drive #206 notes](https://podcastnotes.org/the-drive-with-dr-peter-attia/206-exercising-for-longevity-strength-stability-zone-2-zone-5-and-more-the-drive-with-peter-attia/)); Seiler — co-author of Ausland 2026, "field-verified HRmax" over equations. Held by Attia and Seiler; no literature contradicts it.
- `[single-practitioner position]` HRmax is not a fitness marker: "There really is no association between highly fit people and maximum heart rate" — Galpin ([Perform notes](https://podcastnotes.org/perform-with-dr-andy-galpin/how-why-to-strengthen-your-heart-cardiovascular-system-perform-with-dr-andy-galpin/)). Galpin only; he gives no method for finding it. Huberman relays Galpin; Patrick, Israetel, Cavaliere, Harris silent.

### Where they split

1. **Formula vs observed peak.** The validation papers (Kasiak, Martin, Lach) say no formula gets under ±9 bpm RMSE for an individual and none is rescued by knowing training status; the field papers (Ausland/Seiler, Semin) say a trained person's real ceiling sits 5–13 bpm *above* the formula and even above a lab test. Neither side proposes a better formula. Forces: **(a)** store a formula (Tanaka), cheap, ±10 bpm, and already contradicted by six rowing sessions at 191–196 — a default that has to be overridden to be right (P4); or **(b)** derive the number from the user's own session maxima, which is honest only with an artifact rule and only while the window holds a real maximal effort. Recommend **(b)**, with Tanaka as the flagged fallback for an empty window (lowest RMSE of the formulas in both athlete validations; Nes over-predicts athletes by +3.6 to +6.0 bpm; 220 − age has no research origin).
2. **Single highest vs replicated peak vs vendor ratchet.** Ausland uses "the highest HR you have ever recorded in a maximal effort"; Buyck uses the density inflection of all session peaks; Garmin ratchets to any higher reading. the user's data decides it: 214 and 200 are singletons 18 and 4 bpm above anything a second session reaches; 196/195/192/192/191/191 are a cluster. Forces a *convention*: the highest session max that another session comes within 3 bpm of — 3 bpm is a chest strap's precision plus day-to-day noise, not a measured constant. Nothing in the literature tests a percentile or "second-highest" rule; do not dress the convention up as one.
3. **App number vs watch number.** Syncing the watch's HRmax into the app buys one scale for synced Z5 minutes and typed-HR rows, but imports the ratchet that produced 214 and a 220 − age default. The cost of *not* syncing, in bpm: watch at 185 vs app at 196 puts Garmin's Z5 floor at 166.5 bpm, which is 85 % of the app's HRmax — a synced steady row at 85–89 % (threshold) would show Z5 minutes and could be credited VO₂max under row 6.4, while the same effort typed by hand would file as threshold. Forces: the app is the source of truth and the Profile tab shows the derived number next to the watch's (if the sync can read it) with a "set your watch to N" line; re-deriving Z5 from the app's HRmax stays out of scope, as the brief says. The two scales converge the day the user types the app's number into the watch — he already did this once on 2026-09-07.
4. **One number vs per modality.** Olstad says test each sport; the land-mode literature says running, cycling and rowing differ by 2–4 bpm, inside the error band, and the user's per-modality peaks (cycling 182, tennis 173) measure how hard he went, not a different heart. Forces: **one number** from all land modalities, swimming rows excluded from the estimator (6–7 bpm lower ceiling) and their typed HR read against the same number with the swim flagged. Per-modality HRmax would be a second field the data cannot fill honestly (P2).

### Caveats

- Population mismatch: Kasiak's 5,311 and Ausland's 4,375 are endurance athletes near the user's age (33–43 y, ~75–85 % male) — the closest match in the set; Martin and Nes are general adults; Semin is 20 college runners; Olstad 12 elite teenage swimmers; Yoshiga 55 men aged 21; the sensor papers are 10–50 healthy adults on treadmills and ergometers. the user is one trained adult of unstated age wearing a wrist-optical Garmin (chest-strap use unrecorded), rowing hard more often than he runs hard in 2024–2026.
- Error band, translated to the cuts: formula RMSE 9–11 bpm = ±5–6 % of HRmax at one SD, ±10–13 % at the limits of agreement — one SD alone spans the 83 → 89 % gap, so a formula denominator cannot honestly separate endurance from VO₂max on a typed HR. The replicated observed peak's residual is not measured anywhere; the pieces that bound it are the 2–4 bpm land-mode spread, Ingjer's 5–6 bpm lab-vs-field gap and Buyck's 1 % of sessions with spurious peaks even on a strap — of the order of 5 bpm (~2.5 %), inside the ±5 % bands 005 grounded from Jamnick 2020. Both errors have a direction: an under-estimated HRmax (formula, or a window with no all-out effort) inflates every % and pushes steady rows *up* a band; an over-estimated one (a spike that survived) pushes everything down.
- On the user's numbers: at 185 a typed 160 bpm reads 86 % (threshold); at 196 it reads 82 % (endurance). The 83 % cut is 154 / 157 / 163 bpm for 185 / 188.6 / 196; the 89 % cut 165 / 168 / 174. 2026's peaks so far (running 189, rowing 187) are below the 2024–2025 cluster; a 12-month window gives 191, a 24-month window 196 — the read cannot tell fewer all-out efforts from real drift, which is why the window is a convention with a range (12–36 months) and not a measurement.
- Refresh rule: ageing moves HRmax ~0.7 bpm/yr (≤ 1.4 bpm inside a 24-month window — ignore); training status moves it 3–7 % (6–14 bpm on 196), and Zavorsky's re-check "every macrocycle (3–6 weeks)" maps onto Tekiō's 6-week cycle. A derived value refreshes itself on every sync; a typed override should lose to a synced peak that exceeds it by > 3 bpm, and be flagged stale when no session in the window comes within 5 % of it. The formula fallback needs a birth year, which the profile does not hold — the caller's call whether to store it or accept the typed field only.
- Tennis (the bounded secondary question): Ferrauti's +14 bpm at equal V̇O₂ is ~7 % of HRmax, so a typed match average of 163 (83 % of 196) carries the aerobic load of roughly 76 % running; the "correct" racket-sport cuts would sit ~7 points higher, but that rests on one crossover of 12 players aged ~47 and cannot move a grounded cut. Keep the bands and the endurance default from 005 B: on a hand-logged sport row the typed HR may add the threshold *label*, never promote to VO₂max — Baiget's 3 % of match time above VT2 and Z5 = 0 on every synced match are the reason.
- What would move this number: a chest-strap maximal test (Ausland's 2–3 × 3–4 min after a warm-up) typed into the override; a `heart_rate_source` flag on synced rows (strap vs optical) so singleton spikes can be filtered by source rather than by replication; Garmin publishing its auto-detect filter; a study of percentile/replication rules for training-log HRmax, which does not exist today.

### Source comment

`// hr_max — replicated observed peak: highest session max HR that a second session within a rolling 24-month window comes within 3 bpm of (land modalities, swimming excluded), typed override allowed; every age formula misses an individual by ±9–11 bpm RMSE (Kasiak 2023; Martin 2025) and sits ~5 bpm below trained athletes' field peaks (Ausland 2026; Semin 2008), while Garmin's auto-detect is a one-way ratchet that a single optical spike can set (Navalta 2020) — window and 3-bpm tolerance are conventions, see docs/roadmap/059-profile-hrmax-typed-hr-path.md#grounding`

`// 208 − 0.7 × age — fallback denominator only when the window holds no session, row flagged "estimated"; lowest RMSE of the age formulas in athletes (Tanaka 2001; Kasiak 2023), never 220 − age (Robergs & Landwehr 2002), see docs/roadmap/059-profile-hrmax-typed-hr-path.md#grounding`

**Citations checked 2026-09-07:** 13 PMIDs resolve through NCBI eutils to the papers named (11153730 Tanaka; 22376273 Nes; 17468581 Gellish; 37109218 Kasiak; 42088591 Ausland; 24149950 Semin; 12070617 Yoshiga; 31726693 Olstad; 10688280 Zavorsky; 11581561 Hawkins; 32866216 Navalta; 28709155 Gillinov; 31555543 Pasadyn); PMC 13302236 (Buyck) resolves through eutils `db=pmc`, PMC 12450509 (Vermunicht) through the PMC article itself; the three DOIs (Lach 10.3389/fphys.2021.695950; Gilgen-Ammann 10.1007/s00421-019-04142-5; Martin 10.1371/journal.pone.0335842) resolve through Crossref. Not checkable: Robergs & Landwehr 2002 (JEPonline, no PMID or DOI — QUT ePrints copy linked), Ingjer 1991 (cited only as relayed by Ausland 2026), the Garmin manuals and the5krunner (vendor/blog). The 13 PMIDs were re-checked on receipt (one batched eutils call, 2026-09-07): all resolve.

### Decisions taken (2026-09-07, recorded before the constants moved)

1. **Observed peak, not a formula** — the scout's fork 1 side (b). The app derives HRmax from the user's own synced rows: the highest session max HR that a second session comes within 3 bpm of, inside a rolling 24-month window, swimming rows excluded. Both the window and the tolerance are conventions inside the scout's ranges (12–36 months; a strap's precision plus day-to-day noise). A typed override on the Profile tab stands in for a chest-strap test and loses to a synced peak that exceeds it by more than 3 bpm.
2. **No formula fallback, no birth year.** The scout offered Tanaka as a flagged fallback for an empty window. Not built: the profile holds no birth year, and the scout's own caveat says a ±9–11 bpm denominator "cannot honestly separate endurance from VO₂max on a typed HR" — a fallback that decides bands it cannot resolve is the P4 wrong default in a different coat. With no observed peak and no override the typed-HR path does not fire, and the row reads as it does today (the duration floor). A new user types an override or waits for the sync.
3. **The typed HR picks the bucket; the existing floors decide the credit.** ≥ 89 % HRmax is VO₂max on a steady row only when the row is at least `VO2MAX_Z5_MIN` (8) minutes — a steady row's average sits at that level for its whole length, so its minutes at ≥ 90 % are its duration and the same dose rule (D34) applies. Below 89 % the row is endurance at the `ENDURANCE_FLOOR_MIN` floor (D35), unchanged. The 83 % cut is defined and tested here as the edge of the 84–88 % threshold band but changes no bucket — the label is 057 B's. No lower cut: 005 B set none, and a typed 60 % row keeps the endurance credit it has today.
4. **Sport rows never promote** — the scout's sport variant. A hand-logged match with a typed HR stays `SPORT_DEFAULT_ADAPTATION`; the typed HR may carry the threshold label (057 B) and nothing else. Recorded as a test, not a code change.
5. **One number, app-side.** No per-modality HRmax (fork 4) and no sync of the watch's value (fork 3): the Profile shows the derived number with the session that set it, so Peter can type it into the watch. Not built: the scout's "stale when no session in the window comes within 5 %" flag — the observed number refreshes on every sync and the Profile names the peak's date, which says the same thing without a fourth constant.

**Amended the same evening — [060](060-hrmax-any-user-birth-date-default.md).** Decisions 1 and 2 are reversed for general use: a derivation only the user's synced rows can produce serves no other user, so the formula fallback and a birth date come in as the default, and the observed peak becomes a proposal the user accepts instead of a number that overwrites theirs.

## Acceptance

- [x] `/ground` run on the profile HRmax landed here as `## Grounding`; the choice (formula / device / observed) recorded with its band.
- [x] The profile holds the number; the Profile tab captures it — the observed peak is derived from the synced rows (`observedHrMax`, 196 bpm for Peter on 2026-09-07) and the one typed field is the override (`user_profiles.hr_max_override`, migration 20260907130000); browser-checked on the Profile tab, override 200 → back to 196 when cleared.
- [x] The typed-HR bands decide steady manual rows before the duration floor; inventory rows 6.9–6.12 and ledger entries D37–D38; tests at the edges (163/164 and 173/174 bpm against 196; the 8-min and 25-min floors; Garmin data and `intervals` winning).
- [x] Hand-logged sport rows with a typed HR use the scout's sport variant: never promoted, endurance stays; the threshold label is 057 B's.
- [x] `npm run check:docs` passes (74 anchors, 0 failed, 2026-09-07).
