# Roadmap: Adaptation target shapes — one gap, not three follow-ups

**Status:** proposed — kickoff-ready. No code yet.
**Origin:** follow-ups #1, #2 and #3 of
[011-adaptation-weekly-targets.md](011-adaptation-weekly-targets.md), promoted out of
that brief's table so they do not get lost.
**Covers inventory rows:** 1.1, 1.2, 1.7, 1.9 in
[grounding-inventory.md](../grounding-inventory.md) — the *shape* of those four
numbers, not their values.

---

## The plain summary

Three follow-ups were written down as three separate jobs. **They are one job.**

Tekiō can only say two kinds of thing about a weekly target:

1. **"N sets of this muscle group per week"** — used by the five lifting
   adaptations.
2. **"N sessions per week"** — used by the cardio adaptations and by skill.

There is no third option. In particular there is **no "N minutes per week"**
anywhere in the model. And option 2 does not really work for lifting, because
behind it the app is still counting *sets*, not sessions.

That single gap is why four separate questions all stopped in the same place:
speed, power, Zone-2 endurance, and whether anaerobic capacity should have a
weekly target at all. None of them is a question about *which number*. All of
them are questions about *what the number counts*. Fix the shape once and all
four become answerable.

**This brief does not pick the numbers.** They are already decided and sourced in
[011-adaptation-weekly-targets.md](011-adaptation-weekly-targets.md). This brief is about
the container they go in — with one exception, flagged in §6, where a real new
decision hides.

---

## 1. What the model can and cannot express today

Two fields on every adaptation
([src/constants/adaptations.ts](../../src/constants/adaptations.ts)):

| Field | Means | Used by |
|---|---|---|
| `weeklyMuscleTarget` | sets per muscle group per week | speed, power, strength, hypertrophy, muscular endurance |
| `weeklySessionTarget` | sessions per week | anaerobic capacity, VO₂max, endurance, skill |

The trap is in how they are counted and labelled
([src/lib/adaptations.ts](../../src/lib/adaptations.ts)):

- **Lifting work is counted one set at a time.** `volume[a] += 1` runs once per
  logged set ([adaptations.ts:218](../../src/lib/adaptations.ts#L218)).
- **The label is not chosen by the target, it is chosen by the modality.**
  `unit` is `'sets'` whenever `modality === 'resistance'`, and `'sessions'`
  otherwise ([adaptations.ts:288](../../src/lib/adaptations.ts#L288)).

So for a lifting adaptation, `volume` is always a **set count** — whatever
target you compare it against.

### The half-open door, and why walking through it makes things worse

There *is* already a switch that looks like it does the job
([adaptations.ts:274](../../src/lib/adaptations.ts#L274)):

```ts
const isResistance = meta.modality === 'resistance' && muscleTarget > 0
```

Set `weeklyMuscleTarget: 0` on speed and it stops using the per-muscle path and
starts using the session path instead
([adaptations.ts:282-284](../../src/lib/adaptations.ts#L282)):

```ts
const met = isResistance
  ? relevant.length > 0 && onTrack === relevant.length
  : volume[meta.key] >= sessionTarget && sessionTarget > 0
```

But nothing else changes. `volume` is still counting sets, and `unit` still says
`'sets'`. The result is an app that **compares a set count against a session
target and prints the word "sets" next to it** — silently wrong, and worse than
the ungrounded number it replaced. This is exactly why
[011-adaptation-weekly-targets.md](011-adaptation-weekly-targets.md) refused to make the
change as a constant edit. The door is open; there is no floor behind it.

**What a real fix needs:** a way to count *sessions* for lifting adaptations
(group the logged sets by day, or by `training_session`), and a `unit` that is
derived from **which target is in use**, not from the modality. Plus a third
shape entirely for minutes.

### The database has the same two shapes

`adaptation_targets` stores exactly `weekly_muscle_target` and
`weekly_session_target`
([src/lib/db/adaptationTargets.ts](../../src/lib/db/adaptationTargets.ts)), and
those rows **win** over the constants
([adaptations.ts:272-273](../../src/lib/adaptations.ts#L272)). A minutes target
is therefore a migration too, not just a TypeScript change. Whatever shape is
chosen has to land in both places in the same commit — the rule
[011-adaptation-weekly-targets.md](011-adaptation-weekly-targets.md) already set.

---

## 2. Speed and power should be counted in sessions

The app currently asks for 6 weighted sets per muscle group per week for each.

That is the wrong instrument, for a reason the app itself already states: speed
and power both carry **"never train to fatigue"** in their own `rx`. A weekly
set count is a *work-volume* measure — it is built to describe accumulated
fatigue. Using it to measure a quality whose whole rule is *avoid* fatigue is a
category error.

The literature agrees on the unit, and it is not sets per muscle. It doses these
qualities in **contacts or sprints per session, and sessions per week** — jump
contacts per session and total touches across 2–4 sessions/week for plyometrics;
maximal-velocity exposure for sprint work. The evidence and citations are already
in [011-adaptation-weekly-targets.md](011-adaptation-weekly-targets.md) and are not
repeated here.

**Target shape:** `weeklyMuscleTarget: 0` + `weeklySessionTarget: 2`, following
the `skill` precedent, which already uses exactly this shape.

**Why the current `6` is not a mistake to be embarrassed about:** it was chosen
deliberately as a fallback, and recorded for what it is — *an exposure counter,
not a dose*. `6` ≈ 2 sessions × 3 sets, so it enforces a floor of at least two
sessions in the only unit the app could speak at the time. Moving to sessions
says the same thing honestly.

---

## 3. Zone-2 endurance should be counted in minutes

The app asks for 2 endurance sessions per week, and classifies any session of
**≥25 minutes** as endurance
([adaptations.ts:49](../../src/lib/adaptations.ts#L49)).

Put those two together and the app is certifying **about 50 minutes a week** as
enough. Every published position is far above that — WHO says 150–300 minutes of
moderate activity, Galpin 150–200, Attia 180–240. The app is not slightly low; it
is short by a factor of three.

**Raising the session count does not fix it.** `3` sessions still only certifies
~75 minutes. The number is not the broken part. The unit is.

**Target shape:** weekly minutes. The data already exists — `duration` is a
required field on a cardio session and Garmin supplies it, which is why this is
a shape change rather than a data-collection project.

---

## 4. The fork this forces — and this brief does not resolve it

Moving to minutes forces a choice that has been sitting unresolved. **Kickoff
picks a side and records why. Do not let it be decided silently by whoever
writes the migration.**

| | **Attia** | **Galpin** |
|---|---|---|
| Weekly volume | ~180–240 min | 150–200 min |
| Structure | roughly four 45–60 min bouts | accumulated any way, including daily |
| Bout-length floor | **yes** — a session must run ≥45 min (60+ preferred) to trigger the adaptation at all | **none** |
| Basis | San-Millán's mechanism — mitochondrial adaptation, fat use, lactate clearance need continuous exposure | volume is volume |

**What the evidence says about the fork:** Murphy 2019 (PMID 31267483; 19
studies, 1080 participants) found that broken-up activity and continuous activity
produce the same cardiorespiratory fitness at matched total volume. That leans
**toward Galpin** — it is direct evidence against a bout-length floor.
San-Millán's ≥45 min claim rests on a proposed mechanism, not on a trial that
varied bout length, so it stays a single-practitioner position.

Leaning is not the same as settled, and the choice is a product decision as much
as a physiological one:

- **Galpin's side** is simpler to build (sum the minutes, one number), matches the
  data the app already has, and fits the doctrine — Tekiō reports an *adequacy
  floor*, not an optimum.
- **Attia's side** requires the app to enforce a per-bout minimum, which means
  short rides stop counting at all. That is a stronger claim and a more annoying
  app, and it needs the bout-length floor to be true.

**Recommendation, offered not imposed:** Galpin's shape (weekly minutes, no bout
floor, 150 as the adequacy floor). It is the honest fit for the data the app
holds, and it is the side the one piece of direct evidence supports. But see §6 —
choosing Attia's side is the one branch here that trips the grounding gate.

---

## 5. Anaerobic capacity — an open question, deliberately not a decision

The app asks for 1 anaerobic session per week, every week, forever.

There is a real argument that it should ask for **nothing** most of the time, and
train the quality in blocks instead:

- No adequacy-threshold literature exists for anaerobic capacity in a
  non-competitive trained adult. The improvement studies are **block-shaped** —
  sprint-interval trials run 3×/week for 4–7 weeks, then stop.
- Anaerobic capacity is among the **slowest qualities to lose**. A permanent
  weekly `1` makes Tekiō show a gap for something whose absence for a few weeks
  costs nothing measurable — which is the opposite of "tells me what's missing".
- A standing target also pushes the mutually exclusive cardio count to 4
  sessions/week on top of the lifting sessions, and Wilson 2012 (PMID 22002517)
  shows interference with power and explosive strength scales with exactly that
  endurance frequency.

**This is recorded as an open question, not a decision.** "0 standing, 2 inside a
block" is a periodisation feature — it needs somewhere to store what block the
user is in, which is a bigger change than a target shape. It is listed here so it
is not lost, and so that whoever builds the minutes/sessions work knows a third
shape ("no standing target") may be coming.

---

## 6. Doctrine §4.5 — the grounding gate

**Which exemption:** **exemption 2, unit or shape change** — *"same claim,
different representation"*. Almost everything here moves a number from one
container to another without asserting anything new:

| Change | Already grounded where | New claim? |
|---|---|---|
| speed, power → `weeklySessionTarget: 2` | named explicitly in the resistance scout block in [011-adaptation-weekly-targets.md](011-adaptation-weekly-targets.md) as the preferred shape | no |
| endurance → weekly minutes | the cardio scout block gives WHO 150–300, Galpin 150–200, Attia 180–240 | no |
| endurance floor of **150** | inside that grounded range — **exemption 3**, rounding inside an already-grounded range | no |
| anaerobic → no standing target (`0`) | a `0` sentinel asserts nothing; inventory row 1.10 already treats the nine `0`s as ungated | no |

**Do not re-run the scout for any of the above.** Those numbers are grounded, the
citations are verified, and re-running would be exactly the "gate that fires on
everything" the skill warns against.

### The one part that does trip the gate — flagged, not buried

**If kickoff chooses Attia's side, the ≥45 min per-bout floor is a new claim and
needs a scout run before it is implemented.**

It is a genuinely different kind of number from the others. The weekly total is a
sum the app already has the data for. A per-bout minimum is a **threshold that
makes logged work stop counting** — a 30-minute Zone-2 ride would contribute
zero. And its only support in the record is one `[single-practitioner position]`
(San-Millán, relayed by Attia), which the one piece of direct evidence
(Murphy 2019) argues against. Writing a contradicted single-practitioner number
into the app as a hard cutoff is precisely what §4.5 exists to catch.

So: **Galpin's side ships under exemption 2. Attia's side does not — it needs
`/ground` first.** That asymmetry is worth knowing *before* the fork is chosen,
because it is part of the cost of choosing Attia.

### One neighbouring number this brief does not touch

The **≥25 min endurance classification threshold**
([adaptations.ts:49](../../src/lib/adaptations.ts#L49), inventory row 6.1, state
*unknown*) belongs to
[005-hr-zone-intensity-classification.md](005-hr-zone-intensity-classification.md) and is
**out of scope here**. But moving to minutes changes what it does, so it should
not be forgotten: today it decides whether a session counts at all; under a
minutes model it decides which adaptation a session's minutes are credited to. A
20-minute easy ride is currently classified as anaerobic capacity and would
contribute **zero** endurance minutes — which will look wrong the moment the
minutes number is on screen. Name it at kickoff; fix it in its own brief.

---

## 7. The §4 checklist (doctrine R4)

**1. Which read does this sharpen?**
The **Adaptations** read and the **Home** overview — both existing Core surfaces.
No new section, so R1's cap is untouched. Home's "what's missing" verdict for
four of the nine adaptations is currently computed in the wrong unit; this makes
those four say something true.

**2. What does it let me stop doing?**
- Stop reading a set count for speed and power as if it meant anything about
  those qualities.
- Stop treating "2 endurance sessions" as a satisfied target when it represents
  about a third of every published minimum.
- Retires follow-ups #1, #2 and #3 of
  [011-adaptation-weekly-targets.md](011-adaptation-weekly-targets.md) in one change
  instead of three.
- Removes the reason the speed/power reshape was deferred, so those constants
  stop being "an exposure counter, not a dose".

**3. Is this an input or a destination?**
**Input.** It changes how existing reads compute, and adds no surface. This is
P3 working as intended — the answer to "where does this live?" is "nowhere new".

**4. What is the honest shape of the data?**
The whole point of the brief (P2 — honest reads beat pretty ones):
- Speed and power are **quality-driven, per session**. Their honest unit is
  sessions per week. Measuring them by fatigue-shaped volume is a beautiful lie
  of the same family the doctrine already rejects for body maps.
- Zone-2 endurance is **accumulated time**. Its honest unit is minutes per week,
  and the app already stores the minutes.
- VO₂max and anaerobic work are genuinely **session-shaped** — their dose is
  defined by interval structure, and the literature really does report
  sessions/week. Those two keep the session count. *Not every cardio adaptation
  gets the same unit, and that is the correct answer, not an inconsistency.*
- Per-muscle sets stay right for strength, hypertrophy and muscular endurance.

**5. Does it write a number claiming physiological meaning?**
**Mostly no** — see §6. Exemption 2 for the shape changes, exemption 3 for
rounding inside the grounded endurance range. **One exception**, stated plainly
there: Attia's ≥45 min per-bout floor would be a new claim and needs `/ground`
before implementation.

---

## 8. Scope

**In:**
- A third target shape (**minutes per week**) in the constants, the
  `AdaptationSpec` type, the `adaptation_targets` table, and the read path.
- **Real session counting** for lifting adaptations, so `weeklySessionTarget`
  means sessions when a lifting adaptation uses it.
- `unit` derived from **which target is in use**, not from `modality`
  ([adaptations.ts:288](../../src/lib/adaptations.ts#L288)).
- Moving speed and power onto session targets, and endurance onto minutes, in
  both the constants and the DB rows, in one commit.
- Picking a side in the Attia/Galpin fork and writing down why.

**Out:**
- Anaerobic-capacity block periodisation (§5) — recorded as an open question.
- The ≥25 min classification threshold (§6) — belongs to
  [005-hr-zone-intensity-classification.md](005-hr-zone-intensity-classification.md).
- Row 1.6, skill = 3 sessions/week — still blocked on the product decision in
  [006-skill-adaptation-data-source.md](006-skill-adaptation-data-source.md).
- Any change to the strength, hypertrophy or muscular-endurance targets. Their
  shape is already right.

---

## 9. Acceptance

- [ ] The target model can express **minutes per week**, in the constants, the
      type, and the `adaptation_targets` table.
- [ ] A lifting adaptation using `weeklySessionTarget` is compared against a real
      **session** count, not a set count.
- [ ] `unit` reflects the target actually in use — no screen shows "sets" next to
      a session or minutes target.
- [ ] Speed and power read as sessions per week; the Adaptations tab and the body
      map both agree.
- [ ] Endurance reads as minutes per week, sourced from the duration the app
      already stores.
- [ ] The Attia/Galpin fork is **decided and recorded in this brief**, with the
      reason.
- [ ] If Attia's side was chosen, `/ground` has been run for the per-bout
      duration floor **before** it was implemented (§6).
- [ ] Constants and their `adaptation_targets` rows changed in the same commit
      and verified by query — the rule set by
      [011-adaptation-weekly-targets.md](011-adaptation-weekly-targets.md).
- [ ] Inventory rows 1.1, 1.2, 1.7 and 1.9 updated to the new shapes.
- [ ] Follow-ups #1, #2 and #3 in
      [011-adaptation-weekly-targets.md](011-adaptation-weekly-targets.md) closed.

---

## 10. Open questions carried forward

| # | Question | Status |
|---|---|---|
| 1 | Attia vs Galpin — bout-length floor, or minutes accumulated any way? | **Decide at kickoff.** Evidence leans Galpin; choosing Attia additionally requires a `/ground` run. |
| 2 | Should anaerobic capacity have a standing weekly target at all, or move to block periodisation? | **Open question, not a decision** (§5). Needs somewhere to store block state. |
| 3 | Under a minutes model, should the ≥25 min classifier change? | Out of scope; named so it is not a surprise (§6). |
