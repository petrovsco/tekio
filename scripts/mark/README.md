# Drawing the brand mark

> **This folder is temporary and gets deleted.** It is scaffolding for choosing
> a mark, not something the app needs. It lives in the repo only so a drawing
> round survives the session that ran the previous one — sessions are cheap,
> redrawing this library is not. The moment a mark is chosen and shipped, the
> whole folder goes: that is a tracked acceptance box on
> `docs/roadmap/038-favicon-and-app-icon.md`, not a good intention. Git
> remembers it if a later round ever needs it back.
>
> Nothing worth keeping is only here — the findings below also live in the
> brief, which is what survives.

Tooling for designing Tekiō's favicon and app icon. It is a design bench, not
app code: nothing here is imported by `src/`, nothing ships in the bundle, and
the build does not type-check it.

The decision record for the mark itself is
`docs/roadmap/038-favicon-and-app-icon.md`.

## Running a round

```bash
node scripts/mark/rounds/r7f.mjs /tmp/r7f.html /tmp/r7f-tabs.html /tmp/r7f-big.html
node scripts/mark/shoot.mjs /tmp/r7f.html /tmp/top.png --rows 0,2
node scripts/mark/shoot.mjs /tmp/r7f.html /tmp/bot.png --rows 3,4
node scripts/mark/bbox.mjs public/favicon.svg
```

A round is one `.mjs` file that builds an array of `{ id, name, note, body }`
and hands it to `sheet()`. `body` is a string of SVG elements on a 0–100 grid.
Copy `rounds/r7f.mjs` and edit it.

No web server is needed — `shoot.mjs` reads the file and uses `setContent`.
It drives the Chromium that Playwright downloaded into `~/.cache`; the
Playwright MCP server is not usable here because it wants a branded Chrome
install and root. `browser.mjs` finds both paths, or takes `MARK_PLAYWRIGHT`
and `MARK_CHROME`.

Screenshots over about 1 MB are rejected by the file transport, so crop a long
sheet into halves with `--rows` rather than sending it whole.

## Two colours, both grounds

Everything is filled with `var(--ink)` or `var(--paper)`, never a literal
colour. The sheet defines both, and redefines them on its dark strip, so one
body string renders correctly on a light and a dark tab bar. `PAPER` is also
how a hole is punched: a paper-filled circle over an ink shape is a counter,
and a counter survives shrinking far better than a pale fill does.

## Arms are generated, not drawn

The one idea worth keeping from all seven rounds. `ribbon()` samples a
centreline, offsets it left and right by a half-width that tapers along the
length, and runs a closed Catmull-Rom spline through the outline. Guessing
bezier handles by hand is what made the early rounds collapse into blobs; this
keeps a curl clean at every size from the same numbers, and lets each arm have
its own length and hook — a perfectly symmetric fan reads as a machine, not a
creature.

`arcCurl()` is the arm that wraps a circle and then hooks at the tip;
`wrap()` spirals; `bez()` is for a hand-placed centreline; `sucker()` draws a
sucker as a rim with the aperture punched out, `suckers()` draws a list of them,
and `dent()` presses one into a solid ink field.

`ribbonAt()` is `ribbon()` with an arbitrary width law instead of a single
power curve — needed whenever a section of an arm is redrawn in another colour,
because it has to reuse the parent's widths rather than invent its own.
`armRound()` adds a disc at each end, which swallows the straight chord
`ribbon()` closes its outline with; that chord is the hardest edge any mark
built from arms has, and the disc costs nothing.

## A wrapped ribbon cannot close cleanly — use `band()`

`ribbonAt()` walks an **open** centreline and caps both ends, so wrapping one
into a ring always leaves a cusp where the outline meets itself. It is
invisible on a contact sheet and it is a visible nick at 330px, which is the
size of an app icon on a phone. Hiding it does not work: tucking the tip inward
under the root bulges the silhouette, because offsetting a steep radial dive
throws the outer edge past the circle, and swelling the arm back to full width
at the seam removes the *seam* but not the *cusp*.

`band()` draws a closed ring as what it is — a true outer circle plus a closed
inner contour whose distance from it varies. The silhouette is exact by
construction and there is no join anywhere. Give it a width law that is
periodic (two harmonics of the angle: `cos φ` for thick-to-thin, `sin 2φ` to
skew the swell so it reads as an arm rather than as a calligraphic O) and the
shape has no seam to nick.

`suckers()` takes a mode, and the mode is the whole design. `flat` paints every
rim and then every aperture, so touching suckers merge into one silhouette and
no rim fills in its neighbour's hole. `stack` paints each one complete before
the next, so a later sucker crops the one beneath and the ring gains a direction
of travel. The difference is invisible while they are apart and decides the read
once they are not.

## What the sheets have established

These are findings, not opinions — each one killed at least one concept.

- **16px is the only size that decides anything.** The large renders say
  whether an idea is nice. Always look at a mock tab strip (`tabStrip()`)
  before choosing.
- **A small mark inherits whatever icon the viewer already knows.** A folded
  corner is a file icon. A ring is Oura. Concentric circles are a bullseye. A
  drop with arcs under it is wifi. A headless torso is a t-shirt. A top-down
  lizard is a running man. An evenly spaced fan of arcs is a loading spinner, a
  camera aperture, or the recycling arrows — that one is unwinnable.
- **Meaning carried by a pale element does not survive 16px.** Put it in solid
  shape or in a punched hole.
- **Detail has a floor.** A sucker aperture closes up below roughly 3 units on
  the 100 grid; suckers are a large-size reward, and the small-size read has to
  work as whatever the dots add up to.
- **A sucker is only a sucker between 0.45 and 0.55 of its rim.** Under that it
  is a dot with a speck in it; over it the rim is a wire and the thing is a
  washer that goes pale and vanishes at 16px.
- **Openness looked like a trade, and was an artefact of the construction.**
  7d found that a ring of separate suckers reads as an octopus and is not a
  letter at 16px, while a ring that closes holds the letter and reads as a
  machine part. That is true of every shape built by *wrapping an arm*. Drawn as
  a band, the outer circle holds the letter absolutely and the creature is
  carried by the varying width and the suckers, neither of which has to break
  the silhouette. 7e's G8.
- **A run of suckers needs a direction.** Spread symmetrically either side of
  the root they read as a crown, which is the dial again. Run them one way from
  the root, and pack them towards the *tip* — crowding the root, where the holes
  are widest, merges them into a wavy slot.
- **The aperture floor is a floor on the band, not on the hole.** At 0.5 of the
  band width an aperture needs about 6 units of band to clear 3 on this grid, so
  a sucker run has to stop before the waist — which is what an arm does anyway.
- **Sub-pixel strokes go grey, they do not vanish.** A 5-unit bar is 0.8 device
  pixels at 16px: still legible, just quiet. It is affordable when something
  heavier carries the mark, and not when it has to compete.
- **Measure the ink bounds before shipping.** `bbox.mjs`. A shape rotated
  inside its viewBox does not fit at its own width, and the clipping is
  invisible at 16px and obvious at 180px.
- **On a locked circle, pressure lands in the counter.** 7f. The counter is the
  bowl of the letter, so a brush *rhythm* — thin, thicken, release — does not
  read as handwriting there, it reads as a lumpy hole. Over a locked outer edge
  the width law has to be one slow swell and one slow thinning; what makes it
  calligraphic is where the weight sits, not how fast it changes.
- **A chisel head becomes an arrowhead.** 7f. The flat cut a landing brush
  leaves turns into the browser reload icon the moment it sits on a ring, at
  every size. A brush head on a circle has to be round.
- **A lap reads as a bite.** 7f. Ink cannot show one stroke crossing another —
  they merge — so all that survives of a tail lapping its own head is the step,
  and a step in the counter is a defect. Swell the tail back into the head over
  ~46° instead of crossing it over ~5°.
- **Two hairlines are what say "written".** 7f. A taper alone does not: G2
  tapered 15 → 5.2 and still read as generated. A broad-nib law — width
  following the direction of travel, so the stroke thins to a hairline twice
  per turn — is the cheapest thing that reads as calligraphy, and making its two
  lobes unequal is what a hand does and a machine does not.
- **`offBand()` when the silhouette must wander.** A closed band whose outer
  edge is not a circle, so a hand-drawn outline keeps the no-caps, no-seam,
  no-cusp property `band()` has and a wrapped ribbon never can.
