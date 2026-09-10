# Roadmap: Nutrition targets are an input, not a Tekiō surface

**Label:** feature
**Status:** in progress — grounded 2026-09-08. The product question (does anything
ship inside Tekiō at all?) is still open.

## The ask

Decide what Tekiō does with **energy and body-composition targets** — maintenance
calories, energy balance, protein per kg, and an honest rate of change.

The grounding ran in full on 2026-09-08: seven blocks at the
[039](done/039-adaptations-read-grounding.md) standard, every citation verified one
at a time through NCBI eutils or Crossref. **The workings are not in this repo, and
must not be.** They were one person's height, body-fat estimate, weight series and
personal goal — a dossier, not product knowledge — and a product repo holds fixtures
and findings, never a person (see the house rule in `CLAUDE.md`). What follows is
only what the *product* learned.

## What the grounding settled, for the product

1. **A maintenance calorie figure is a convention resting on a grounded equation.**
   The predictive equation is grounded; the activity-factor ladder that turns it into
   a daily number has **no source at all**. Any surface that shows a TDEE has to say
   which half is which, or it presents a convention as a measurement.
2. **Protein in the 1.6–2.2 g/kg band is supported.** The per-meal protein ceiling
   usually cited against large single servings is **not supported** — the paper most
   often quoted for it argues the other way. Two meals a day can carry a high daily
   target.
3. **The binding constraint on body composition is training volume, not food.** Eight
   weeks at 4.4 g/kg with training unchanged moved nothing (Antonio 2014). This is the
   finding with teeth for Tekiō: the readiness and adaptations reads must never imply
   that eating differently moves body composition on its own. A nutrition surface that
   suggested otherwise would be lying with grounded numbers.
4. **Recomposition is slow and its rate is conditional.** Roughly 0.2–0.4 kg of lean
   mass a month *if* training volume rises; 0–0.15 at a volume that has not changed.
   Any goal projection must carry that condition attached, or it is fiction.

Recurring load-bearing sources across the seven blocks: Frankenfield 2013,
Cunningham 1991, Antonio 2014, Helms 2025, Aragon 2018, Slater 2019, Thom 2020,
Souza 2020, Fitschen 2014.

> **Follow-up worth taking:** the verified citation trail was removed with the
> personal dossier that carried it. If the product wants that evidence back, it needs
> a rebuilt `docs/grounding/021-*.md` holding the blocks with every personal figure
> stripped — the science, none of the subject. Not done here.

## What Tekiō builds

**Nothing, for now.** Tekiō has no nutrition surface: doctrine §5 has no read for one,
and [007](done/007-nutrition-food-recovery-score.md) was discarded on 2026-09-01.
Targets are **an input the app may consume and never derives**:

- Tekiō does not ask for, store or compute a user's calorie or protein target.
- If a future read needs one, it arrives as a value the user supplies, carrying its
  own provenance.
- The downstream consumer today is [yami](https://github.com/shamatoff/yami), whose
  doctrine takes a calorie and a protein target as input. That handoff is data moving
  between two products; it does not require Tekiō to grow a surface.

## Open

1. **Does anything ship inside Tekiō at all?** There is no read for these numbers to
   land on. If the answer is no, this brief retires as a document.
2. If the answer is yes, the numbers get inventory rows and source comments like every
   other number the app claims.

## Acceptance

- [x] Every claim that could become a number has a grounding block at the 039
      standard, each citation verified through eutils or Crossref.
- [x] The recomposition question — realistic, and how fast — is asked and answered,
      with an honest horizon and its condition attached.
- [x] The two-meal constraint is grounded and resolved.
- [x] No personal measurement, target or dossier remains in this repo.
- [ ] A decision is taken on whether anything ships inside Tekiō.
- [ ] *(optional)* The citation trail is rebuilt as a de-personalised grounding file.
