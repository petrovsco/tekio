# Roadmap: Adaptations "on target" — one threshold, shared with the map

**Label:** bug
**Status:** backlog — needs Peter's call: keep the 100 % all-muscles bar, or move the counter onto the 0.70 gap cutoff the map already uses. Recommendation below is the cutoff. Surfaced as a next step when 031 closed (2026-09-04) and recorded here so it is not lost.

## The problem, in plain words

The Adaptations page has two different ideas of "good enough" for a muscle,
and on the same day they can contradict each other.

1. **The all-muscles bar.** The header line "N of 7 on target" and the
   "Short: …" sub-line come from `met` in
   [src/lib/adaptations.ts](../../src/lib/adaptations.ts#L330). For a lifting
   quality (strength, hypertrophy, muscular endurance, power) it is true only
   when **every** tracked top-level muscle group has reached **100 %** of its
   14-day target (`statusFor`: `aggSets >= target`). One muscle at 95 % makes
   the whole quality "short".
2. **The 0.70 gap cutoff.** `GAP_CUTOFF` in
   [src/components/tabs/home/GapMap.tsx](../../src/components/tabs/home/GapMap.tsx#L22)
   decides what the map calls a gap: a muscle below **70 %** of its target is
   drawn as a callout and listed in the ranked gaps; at 70 % or above it sits
   in the ramp's darkest band and disappears from the list. Home's map, the
   muscle sheet and the drill-down's per-quality map all use it.

So the page can say "Short: hypertrophy" in the header while the hypertrophy
map below it shows no callouts at all, because every muscle is somewhere
between 70 % and 100 %. Two thresholds for one question is the thing P2
(honest reads) forbids: the reader cannot tell which one to believe.

## Options

- **Move the counter onto the cutoff (recommended).** `met` for a lifting
  quality becomes "no tracked muscle has `fillFraction < GAP_CUTOFF`". The
  header, the "Short:" list and the map's callouts then agree by
  construction. Cost: "on target" softens from 100 % of the grounded floor to
  70 % of it — but the map already makes that call, so this only stops the
  page arguing with itself.
- **Keep the bar, make the map match.** Set the callout threshold to 1.0 so
  every muscle under 100 % is a gap. Honest, but on most days it turns the
  map into a wall of callouts and buries the real gaps — the ranking exists
  because the worst-first list is the product.
- **Keep both, name the difference.** Leave the counter strict and add a
  sub-line such as "3 muscles between 70 % and target". Two numbers to read
  where one would do; only worth it if Peter wants the strict floor visible.

## Doctrine check (§4)

1. **Read sharpened:** Adaptations (the drill-down header vs its map).
2. **Stops:** two definitions of "on target" living in two files.
3. **Input, not destination.**
4. **Shape:** unchanged — the same per-muscle fill fraction, read once.
5. **Number claiming physiological meaning?** No new number. `GAP_CUTOFF`
   is already recorded as a *display convention* in
   [docs/grounding/039-adaptations-read.md](../grounding/039-adaptations-read.md);
   the recommended option gives it a second consumer. The 100 % bar is an
   unnamed convention of the same kind (compare inventory row 4.13 for the
   recovery modalities). Update the grounding-inventory row for the counter
   in the same commit.

## Acceptance

- [ ] Decision recorded in this brief (which option, and why).
- [ ] The header count, the "Short:" sub-line and the map callouts agree on
      the same day's data — a unit test in `adaptations.test.ts` fixes one
      muscle at 0.85 of target and asserts the three read the same.
- [ ] Grounding inventory row for the counter updated to match.
