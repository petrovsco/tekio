# Roadmap: The exit-condition walk — is the core perfected?

**Label:** feature
**Status:** planned — kickoff-ready, committed to 2.1.0 by Peter on 2026-09-05, and it runs first: its verdict decides whether 2.1.0 may add anything at all.
**Release:** 2.1.0
**Origin:** [doctrine.md](../doctrine.md) §6: *"The core is perfected when: I
open Home and, without tapping anything, know within five seconds which
muscles are under-stimulated this cycle, which adaptations are untouched, and
whether I'm recovered enough to push today. Until then, new sections don't get
built and the shelf doesn't unshelve."* Home shipped
([018](done/018-home-design-canvas.md)), every surface is SIGNAL
([033](done/033-retire-old-design-language.md)), 2.0.0 is on production — and
nobody has formally asked the question since it was written.

## The plain summary

A timed walk through Home with Peter, on a normal training day, answering the
three questions from the screen alone. Three yeses end the austerity; any no
becomes a brief ahead of everything else in 2.1.0.

## What the session does

Interactive, in the "Peter ticks" format (batches of 3–4 questions, the
recommended answer first), against the live app — staging or production,
whichever has today's data.

1. Open Home. Start a timer. Answer, without tapping or scrolling:
   - Which muscles are under-stimulated this cycle?
   - Which adaptations are untouched?
   - Am I recovered enough to push today?
2. For each answer: was it there in ≤ 5 s? Is it correct (check against
   Weights, Adaptations and the Recovery card)? Could Peter act on it?
3. Write down everything that needed a tap, a scroll, or a guess.

## The verdict

- **Three yeses:** doctrine §6 gets one line — *"Met on <date>."* The
  austerity ends: the shelf may unshelve and new sections may be argued for
  (R1's cap still applies).
- **Any no:** each miss becomes a brief, or an edit to an existing one, tagged
  2.1.0 and placed ahead of everything but the database chores. §6 stays as
  it is.

Either way the doctrine records the verdict (a decision stays where it was
made) and the work goes to the roadmap (the pending-work rule).

## Doctrine §4

1. **Which read?** Home. 2. **Stop doing:** deferring §6. 3. **Input or
destination?** Neither — a test of the existing read. 4. **Shape:** none, no
data is written. 5. **Physiological number?** No.

## Acceptance

- [ ] The walk ran with Peter on a real day, timed; the three answers and
      their times are written into this brief.
- [ ] Doctrine §6 carries the verdict line — met, or not yet and why.
- [ ] Every miss has a brief tagged 2.1.0.
