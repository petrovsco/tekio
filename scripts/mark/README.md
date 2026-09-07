# Drawing the brand mark

Tooling for designing Tekiō's favicon and app icon. It is a design bench, not
app code: nothing here is imported by `src/`, nothing ships in the bundle, and
the build does not type-check it.

It exists because the mark has now been through seven rounds, and each round is
cheap only if the drawing library survives the last one. What lives here is the
part that took the longest to get right — how to draw a tapering, curling
tentacle that still looks like one at 16 pixels.

The decision record for the mark itself is
[docs/roadmap/038-favicon-and-app-icon.md](../../docs/roadmap/038-favicon-and-app-icon.md).

## Running a round

```bash
node scripts/mark/rounds/r7c.mjs /tmp/r7c.html /tmp/r7c-dash.html
node scripts/mark/shoot.mjs /tmp/r7c.html /tmp/top.png --rows 0,5
node scripts/mark/shoot.mjs /tmp/r7c.html /tmp/bot.png --rows 6,10
node scripts/mark/bbox.mjs public/favicon.svg
```

A round is one `.mjs` file that builds an array of `{ id, name, note, body }`
and hands it to `sheet()`. `body` is a string of SVG elements on a 0–100 grid.
Copy `rounds/r7c.mjs` and edit it.

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
sucker as a rim with the aperture punched out.

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
- **Sub-pixel strokes go grey, they do not vanish.** A 5-unit bar is 0.8 device
  pixels at 16px: still legible, just quiet. It is affordable when something
  heavier carries the mark, and not when it has to compete.
- **Measure the ink bounds before shipping.** `bbox.mjs`. A shape rotated
  inside its viewBox does not fit at its own width, and the clipping is
  invisible at 16px and obvious at 180px.
