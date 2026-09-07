# Roadmap: Should Home and Adaptations be one screen?

**Label:** feature
**Status:** planned — kickoff-ready as an investigation, not as a rebuild. Raised by Peter during the exit-condition walk on 2026-09-07 ([051](done/051-exit-condition-walk.md)). Runs after [061](061-home-names-missing-muscle-quality.md), because 061 changes what Home says and therefore changes how much daylight is left between the two screens.
**Depends:** 061
**Release:** 2.1.0

## Why — the observation this starts from

Reading the two screens side by side during the walk, Peter said:

> *"Maybe we should test the hypothesis of combining home and adaptations
> screens as they are pretty similar."*

They are more than similar — they share machinery. Both render the same
`GapMap` component over the same anatomical figure. Both use the same 14-day
window (`MUSCLE_WINDOW_DAYS`). Both rank gaps with `rankMuscleGaps` and cut at
the same `GAP_CUTOFF`. A user landing on Adaptations from Home sees the same
body, the same four numbered callouts, in the same order.

What actually differs is smaller than it looks:

| | Home | Adaptations |
|---|---|---|
| Body map | quality-agnostic (`muscleStates` — every set counts) | filtered by the selected quality (`muscleQualityStates`, hypertrophy by default) |
| Muscle-linked qualities | a hardcoded power line | four toggles over one map |
| Whole-body qualities | three chips, days-ago | the effort spectrum, sessions against target |
| Readiness | the systemic card and the verdict sentence | absent |
| Counts | absent | "0 of 7 on target", sets and sessions in the window |
| Drill-in | muscle sheet | muscle sheet, "how to train it", all-muscles list |

So the honest summary is: **Adaptations is Home's map with a quality filter on
it, plus the counts Home leaves out.** That is a real duplication, and it costs
twice — a second screen to keep truthful, and a daily read split across two
destinations when doctrine §6 promises one.

**The case against merging.** Three arguments, and they are not weak:

1. **P1 — just in time.** The quality toggle, the effort spectrum and the
   "how to train it" sheet are drill-down: needed when you are deciding what to
   do about a gap, not when you are answering "what's missing". Merging risks
   putting the whole drill-down on the screen that is supposed to answer in
   five seconds.
2. **P2 — two questions, two pictures.** "Which muscles are behind?" and
   "which quality is behind?" are genuinely different questions over the same
   silhouette. One map with a toggle answers them by making the user change
   the map; one screen with both would need two maps.
3. **§6 is a timing claim.** Home currently fits one 900 px screen with nothing
   below the fold — measured during the walk. Anything merged in has to hold
   that, or the five-second read gets worse in exchange for tidiness.

None of these settle it. That is why this is an investigation with a written
verdict, not a rebuild ticket.

## What this brief actually does

1. **Wait for 061.** It puts the missing-quality sentence on Home. Re-measure
   the daylight between the screens afterwards — 061 may close most of it, or
   may make the merge obviously right by proving the quality signal belongs on
   Home.
2. **Decide the question, on paper first**: does anything on Adaptations answer
   "what's missing" (→ belongs on Home), or does it answer "what do I do about
   it" (→ belongs in the drill-down)? Sort every element in the table above
   into one of those two buckets.
3. **Only then** propose one of three outcomes, and write which, and why, into
   this brief:
   - **Merge** — Adaptations' "what's missing" half moves onto Home, its
     "what to do" half becomes drill-down, and the Adaptations destination
     goes. The doctrine ledger gets the verdict (a decision stays where it was
     made) and the removal becomes its own brief.
   - **Keep both, sharpen the split** — Home answers, Adaptations explains;
     move anything on the wrong side across.
   - **Keep as is** — with the reason written down, so the question is not
     re-opened every time someone notices the two body maps.

**Out of scope:** building any of the three. This brief ends at a written
verdict plus, if the verdict is merge or sharpen, a follow-up brief carrying
the work. Doctrine R1's cap is not the argument here — Weights, Cardio and
Mobility are the three menu sections; Home and Adaptations are navigation, so
merging them frees no slot and creates no pressure. This is about the read,
not the count.

## Doctrine §4

1. **Which read?** Home and Adaptations — the question is whether they are one
read wearing two coats. 2. **Stop doing:** maintaining two screens that share a
map, a window and a ranking, and checking both to answer one question.
3. **Input or destination?** A destination question, and possibly one
destination fewer. 4. **Shape:** unchanged — no new visualization is proposed;
this decides where existing ones live. 5. **Physiological number?** No. Nothing
is computed differently; nothing moves that would change a value.

## Acceptance

- [ ] 061 has shipped and Home's read has been re-measured against it.
- [ ] Every element of the Adaptations tab is sorted into "answers what's
      missing" or "answers what to do about it".
- [ ] One of the three outcomes is chosen and written into this brief with its
      reasoning.
- [ ] If the outcome is merge or sharpen, a follow-up brief carries the work
      and this one closes; if it is keep-as-is, the reason is recorded so the
      question stays settled.
