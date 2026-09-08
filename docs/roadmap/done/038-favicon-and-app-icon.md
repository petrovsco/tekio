# Roadmap: Favicon and app icon

**Label:** infra
**Status:** done — the live mark is 7e's **G4** turned to half past one (v2.0.54): the octopus arm written as the Ō, with the brushed macron. Closed 2026-09-08 on Peter's call — the mark is showing on staging, which is the build he uses daily; production carries the same two files and is opened by step 5 of the release ritual at 2.1.0, so nothing is left here to do.
**Release:** 2.1.0

## Progress log

- **2026-09-07 (v2.0.46)** — rounds 1–6. The tipped-vessel mark shipped, the
  `/favicon.ico` 404 is gone, verified on the production build: zero console
  errors, zero responses ≥ 400. Everything under *What shipped* describes this,
  and it is what is live right now.
- **2026-09-07, same evening** — rounds 7a–7c, a new concept: **an octopus
  forming the Ō** of Tekiō. Nothing shipped; the vessel is still the live icon.
  Findings under *Round 7*. The drawing tooling moved into `scripts/mark/` so
  it survives the session — **temporarily**; see *The bench is scaffolding*.
- **2026-09-07, later** — round 7d drawn: ten concepts plus an aperture sweep
  and a dash sweep. Findings under *What the sheet showed*. Nothing shipped;
  the vessel is still the live icon.
- **2026-09-07, later still** — round 7e: Peter asked for E9 smoothed, with the
  app's accent tried on it. Fifteen concepts. It resolves the trade 7d called
  unescapable — see *Round 7e*. Nothing shipped; the vessel is still the live
  icon.
- **2026-09-08** — round 7f. Peter kept two rows off 7e — G2 and G4, the same
  ring with the brushed macron — and asked for the *circle* to be written with
  the same brush as the dash. Five proposals, deliberately not a library.
  Findings under *Round 7f*. Nothing shipped; the vessel is still the live icon.
- **2026-09-08 (v2.0.52)** — Peter picked **G4** off the 7e sheet rather than
  any 7f row. The octopus-Ō is now the live mark, both files are replaced, and
  `scripts/mark/` is deleted. See *The pick*.
- **2026-09-08 (v2.0.53)** — the wrong G4 shipped: his row is built on the
  *wrapped arm*, and a band was substituted for it. Round 7g restores the arm
  and applies his second call — the ring turned to one o'clock, the way G3 is.
  See *The pick* and *The tilt*.
- **2026-09-08 (v2.0.54)** — Peter took the turn one hour further: round 7g's
  **T4**, the root at half past one. No new round; the row was already drawn and
  is in the commit history at `475207b`. Re-emitted at −45° and re-measured.
- **2026-09-08, closed** — Peter called the brief finished. The last box was his to
  tick and he ticked it; see *Acceptance*.

[index.html](../../../index.html) declares no icon and there is no `public/`
directory, so every page load ends with the browser's automatic request for
`/favicon.ico` returning 404. It is the only console error the app produces.

Two consequences, one cosmetic and one practical:

- The browser tab shows a blank page glyph rather than anything of ours, on
  both `tekio.shamatoff.com` and `stg-tekio.shamatoff.com`.
- A permanent 404 in the console is noise that hides real errors. Every
  browser-verification pass from here has to say "clean apart from the
  favicon", which is exactly how a real error gets waved through.

## Scope

Ship an icon that matches the SIGNAL language
([design-system.md](../../design-system.md) §7 — stroke SVG on a 24 viewBox, no
emoji), reference it from `index.html`, and confirm the 404 is gone in both
environments. An SVG favicon plus an `apple-touch-icon` PNG covers the phone,
which is where the app is actually used.

Worth deciding while doing it: whether staging gets a visibly different icon,
since both environments are open in tabs side by side and they currently look
identical. `VITE_ENV` is already set on Vercel Preview (roadmap 037), so the
build can tell which it is.

## What shipped

**One icon for every environment.** Peter's call, 2026-09-07: staging already
announces itself with the black banner across the top of the screen, so a
second signal in the tab would be duplicate work for no extra information. No
build-time branching; `VITE_ENV` stays unused by the icon.

**The mark: an octopus arm written as the Ō of Tekiō.** One stroke wrapped into
a ring — thick where it starts at half past one, thinning as it travels all the
way round — with eight suckers punched through it and a macron drawn above with
the same brush. It is the letter and the creature at the same time, which is the
thing seven rounds were trying to get.

**The numbers, so it can be redrawn without the bench.** On a 0–100 grid: one
wrapped arm about (50, 56) whose centreline rides outward by exactly half the
width it sheds, `r = 39 − w/2`, so the outer edge is a true circle of radius 39
and the whole taper is spent on the *inside*. Width runs `w(t) = 5.2 + 9.8·(1−t)^0.85`
— 15 units at the root, 5.2 at the tip — over a sweep of 366°, six degrees more
than a full turn, so the thin tip lies inside the root's own ink and needs no
cap. The root does, and gets a true semicircle, which is why the counter ends in
a bulb rather than a chisel. The root sits at **−45°, half past one** (see *The
tilt*). Eight suckers at half the local width, spaced `(i + 0.6)/(n + 0.8)`
along the sweep so they clear both ends. The macron is a bowed stroke from x 29
to 71 at `y = 8.5 − 0.9·sin πt`, 4.2 units thick at the left and 2.4 at the
right. Every number is also commented in the file.

**Three construction decisions that are easy to get wrong.**

- **The ring is a wrapped arm, not a band.** A band — a true outer circle plus a
  closed inner contour with a periodic width law — is the cleaner object, and
  v2.0.52 shipped one. It is a different drawing: its weight is thick on one
  side and thin on the opposite side, where the arm's falls continuously from
  root to tip and its suckers grade with it. Peter picked the arm; the band was
  substituted for it without being asked for, and that is the mistake round 7g
  reverses.
- **The suckers are holes, not paper-coloured discs.** On a contact sheet a
  sucker is a disc filled with the page colour. A shipped icon sits on a tab bar
  of unknown colour, so each sucker is instead a subpath of the ring — a real
  hole, correct on any ground. The rule has to be the default **nonzero**, and
  each hole is a 20-gon wound against the arm. Not `evenodd`: the arm laps its
  own root by 6°, and evenodd reads that doubly-covered wedge as a hole, which
  gashes the ring white at the root. This was seen, not reasoned about.
- **The arm is one closed outline, not a ribbon plus two cap discs.** The bench
  rounds an arm's ends by dropping a disc on each, which is fine when everything
  is ink; under a fill rule those discs punch half-moons. So the shipped outline
  runs up the left edge, across the buried tip, back down the right edge and
  round a semicircle at the root — one loop, drawn at 220 samples, the same
  sampling the sheet used. It also removes the cusp the sheet version shows at
  the lap, because both edges of the lap sit on the same circle.

**Measured before shipping, not eyeballed:** ink bounds on the 100 grid are
left 10.83, top 5.83, right 89.17, bottom 95 — clear of all four edges, centred
in x, sitting 0.41 low in y. Unchanged by the turn: the outer edge is a circle,
so rotating it moves nothing.

**Files:** [public/favicon.svg](../../../public/favicon.svg) (inverts to white on
a dark tab bar via `prefers-color-scheme`, so it never vanishes into chrome)
and `public/apple-touch-icon.png` (180×180, paper ground, ink mark, artwork
inset to 140 of 180 so the iOS squircle mask cannot clip it).

### The vessel, which was the mark for one day

A tipped vessel with the water still sitting level: the container leans 21°,
the water surface stays horizontal. The container changes, the reference does
not — the app's own sentence, drawn. It shipped 2026-09-07 (v2.0.46) and was
replaced by the octopus the next day. Its rounds are still worth keeping,
because the reasons it beat 40-odd alternatives apply to any small mark.

It was chosen over those alternatives across four rounds, and the discards are
worth recording because they are all the same failure: **a small mark inherits
whatever icon the viewer already knows.** A folded corner is a file icon. A
ring is Oura. Concentric circles are a bullseye, not tree rings. A drop with
arcs under it is a wifi symbol. A headless human torso is a t-shirt. A
top-down lizard is a running man — twice, including after its legs were
re-bent specifically to stop that. The winner had to survive that test as well
as 16px.

A second rule fell out of the same sheets: **anything whose meaning lives in a
pale element loses its meaning at 16px.** Four early concepts encoded "what is
missing" as a light-grey element, and every one of them read as if nothing were
missing once shrunk. The mark had to carry its idea in solid shape.

Both Japanese options were drawn and both failed the same way: 適 and a
gecko-shaped 応 are handsome at 64px and unreadable mush at 16. Worth knowing,
since the name invites the idea.

**One trap its geometry hid, and the rule that came out of it.** A square
rotated inside the viewBox does not fit at its own width. A side-`s` square with
corner radius `r` and stroke `sw`, rotated 21°, reaches
`sqrt(2)·(s/2 − r) + r + sw/2` from the centre along its corner diagonal, and
the vertical component of that has to stay under 12. At s = 18.2 two corners
were sliced flat; at 17.4 the ink measured as touching all four edges; it
shipped at 16.4. **Measure where the ink actually reaches before shipping any
mark, rather than eyeballing it** — the clipping is invisible at 16px and
obvious at 180px. That is why the octopus above carries a measurement too.

## Round 7 — an octopus forming the Ō

Peter, 2026-09-07: *"I want to experiment with a different concept, but for that
I will need higher quality design. Octopus making an Ō, either with head or with
tentacles."* The Ō is the capital O with the bar over it, from the name Tekiō.

**The quality fix came first.** The earlier rounds drew tentacles by guessing
bezier control points, which is why a hand-drawn chameleon collapsed into a
blob. Arms are now generated: sample a centreline, push it out sideways by a
width that shrinks along the length, and run a smooth closed spline round the
resulting outline. That library is `scripts/mark/`.

### The bench is scaffolding, and it is deleted at the end

Peter, 2026-09-07: *"I don't want to have it durable, no benefit of having that
in the repo. Make sure we clean that up when we have the final variant."*

`scripts/mark/` is in the repo for one reason only — a drawing round is cheap
only if the library survives the session that ran the previous one, and a
session scratchpad does not. It is not app code: nothing in `src/` imports it,
nothing ships in the bundle, `tsc` does not see it, and it is deliberately kept
out of `check:docs` so that removing it later breaks nothing.

The moment a mark is chosen and shipped, the whole folder goes — that is the
acceptance box below, so it happens rather than being remembered. Git keeps it
if a later round ever wants it back. Nothing of lasting value is only in there:
the findings are in this brief, which is what survives.

**Deleted 2026-09-08**, in the commit that shipped the mark. The
`scripts/mark/…` paths named below record where each round was drawn; they are
not files you will find in the tree.

Three rounds, about 34 concepts, and one structural finding per round.

**7a — where the letter lives.** Twelve concepts across four families. The
letter only survives when the mark is built as **bar, gap, O, arms**, in that
order down the square. Every concept that made the octopus's head *be* the
macron failed: the head is a solid mass 18 units tall, so it reads as a bear or
an owl face, not as a bar over a letter. The refined best shot at that idea was
carried into 7b as a control and reads as a padlock. The ensō and the
single-continuous-tentacle versions both read as the numeral 3.

**7b — the head family.** Eleven concepts with a real head. Two findings.
Putting eyes on a horizontal bar turns the bar into a face and kills the letter,
so where the bar is the macron it stays empty. And the punched hole through the
head is what stops the whole family reading as a **spider** — whatever wins,
it needs a visible counter. The family reads as a jellyfish about as readily as
an octopus, which is a cheap collision because nobody owns that silhouette.
Best of the round was a solid head with eyes and a punched O.

**7c — the O as the gap the arms leave.** Eleven concepts, no head at all, and
a thinner dash (5 units, down from 7). This is the family Peter took forward.

- An **evenly spaced fan of arcs is unwinnable**: at five arms it is a camera
  aperture, at seven the recycling arrows, at eight a loading spinner. Those
  three icons are drawn exactly that way.
- The strongest concept was **one tentacle wrapped into a full circle** —
  thick where it starts, tapering all the way round, suckers punched along it.
  It is the only one that is a real Ō at 16px *and* a real tentacle at 128px,
  because the taper stops the ring being a machine-drawn circle.
- Runner-up: six arms with suckers rimming the counter. Cleanest letter, and
  weakest octopus: two arms sweeping down from the dash, which reads as a peach.
- Also killed: outward-flicking tips (a gear or a flower), undulating arms (a
  flower, and the O is gone by 32px), a spiral (an ammonite, and the **@** sign
  at small sizes), and a head bump on the ring (head-and-shoulders, or a
  keyhole).

**The thinner dash costs less than expected.** At 5 units the bar is 0.8 device
pixels at 16px, so the browser paints it grey rather than black — it goes quiet,
it does not vanish. Even 4 holds. It is affordable because the ring below
carries the weight; with a lighter ring it would have to go back to 6.

## Round 7d — eight suckers forming the O

Peter's direction, 2026-09-07: **eight octopus suckers arranged into the O, a
really thin dash above, and the sucker must be recognisable as a sucker.**

A sucker seen face-on is a rim with the aperture punched out of it, the opening
roughly half the outer diameter — that ratio is what makes it a sucker rather
than a dot or a washer. `sucker()` in the library draws it, and takes a squash
and an angle so a ring of them can lean into its own curve.

**The tension to design against, stated up front.** The aperture closes up below
about 3 units on the 100 grid, so at 16px eight suckers are eight dots and the
"recognisable sucker" only exists from roughly 48px up. That is not a reason to
refuse the idea — the app icon on a phone home screen is large, and that is
where the app is actually used. It does mean the round has to answer two
questions separately: *does it read as suckers when large*, and *does the ring
of dots still read as an O at 16px*. Concepts that close the ring at small sizes
(suckers touching, or a faint arm bridging them) are the hedge, and should be in
the set.

Worth drawing, roughly ten:

1. Eight equal suckers, evenly spaced, aperture at half the radius — the plain
   statement of the idea.
2. Suckers graded in size, largest at the bottom shrinking towards the top, the
   way suckers shrink along a real arm. This alone breaks the dial reading.
3. Suckers just touching, so they merge into a continuous ring at 16px.
4. Suckers overlapping in a chain, each partly over the last.
5. Two staggered rows — *Octopus vulgaris* really has two rows of suckers, so
   this is authentic rather than decorative.
6. Suckers sitting on a faint arm that shows only where it bridges them.
7. Foreshortened suckers, squashed and rotated to lean into the curve, so the
   ring reads as seen at an angle.
8. An aperture sweep: 0.35 / 0.5 / 0.62 of the radius, to find where "sucker"
   stops and "washer" starts.
9. A dash sweep at 4 / 3 / 2.5 units, since "really thin" is thinner than 7c's 5.
10. One arm's worth of suckers curving into the O, tapering — the bridge back to
    7c's winner.

**Collisions to check the sheet against:** a combination-lock dial, a dotted
loading spinner, a bicycle sprocket, a flower, and Braille. Grading the sizes
and breaking the symmetry is the defence against the first three.

The family question is settled — do not reopen it. What is open is which
sucker treatment wins inside it.

### What the sheet showed

Ten concepts E1–E10 (`scripts/mark/rounds/r7d.mjs`), plus the two sweeps. All
ten sit on one geometry so only the sucker treatment varies: the ink reaches 39
units from a centre at (50, 56), and the dash is 42 × 3 at y 8.5.

**The one finding that decides the round: the two questions have different
winners, and no concept wins both.** The concepts that read best as an octopus
at 128px are the ones whose ring is open, and an open ring is not a letter at
16px. The concepts that hold the O at 16px do it by closing the ring, and a
closed ring of eight equal rims is a machine part. Whatever ships is a position
on that trade, not an escape from it.

| | Reads as | Reads at 16px | Collides with |
|---|---|---|---|
| **E1** equal, evenly spaced | washers on a dial | dust; the O is gone | the three 7c ruled unwinnable — dotted spinner, lock dial, and Braille once the dots are equal |
| **E2** graded by height | an arm, clearly | bottom solid, top gone | grapes; and the small top suckers vanish under the thin dash |
| **E3** just touching | eight suckers sharing a rim | strong closed O | a roller chain, and a flower from the scalloped outer edge |
| **E4** overlapping chain | a chain with direction | strongest closed O of the open family | a bicycle chain, hard — that is literally the shape |
| **E5** two staggered rows | a scatter; you cannot see it is two rows | dust | a clock face, Braille, a constellation |
| **E6** on a bridging arm | one continuous arm carrying suckers | clean closed O | a bead bracelet, a bicycle chain |
| **E7** foreshortened, leaning | the most creature-like of the equal family; biggest counter | open, but the fat counter helps | coffee beans; the ellipses can read as eyes |
| **E8** graded and touching | an arm, dense at the root | a horseshoe — closed at the bottom, open at the top | a horseshoe or a U, not an O |
| **E9** one tapering arm | best octopus on the sheet | a C or an @ — the seam is visible | a loading spinner caught mid-spin |
| **E10** dented into a solid ring | a machined part | unbreakable O, best of all ten | a rotary phone dial, a ball bearing, a bolted flange |

**Three concepts survive, one per position on the trade.** E6 is the balance:
the arm reads as an arm, the suckers stay separate at 128px, and the O never
breaks because the band under them closes it. E4 is the strongest small read
that is still made of suckers. E9 is the strongest octopus and the weakest
letter. E10 is the honest far end — it wins 16px outright and is not an octopus.

**Two-row anatomy does not survive the size (E5).** *Octopus vulgaris* really
has two rows, but at eight suckers the two radii read as one untidy scatter
rather than as two rows, and the O is gone by 32px. Authenticity that cannot be
seen is not a design argument.

**The seam is the cost of the single-arm idea (E9).** Two things were tried and
both failed: easing the radius inward so the tip tucks under the base turns the
mark into a spiral, which 7c already killed as an ammonite and an @; and moving
the seam from the top to the bottom just puts the blunt base where the eye lands
first. 7c's own geometry — constant radius, seam at the top, taper all the way
round — is still the best of the three, and it still shows a break at 16px.

**Sweep 1 — the sucker window is 0.45–0.55 of the rim.** At 0.30 and 0.40 it is
a dot with a speck in it. At 0.50 it is a sucker. At 0.62 the rim is thin enough
to read as a washer, and at 0.72 the rim is a wire: it goes pale at 16px and
disappears, which is the pale-element rule from the vessel rounds arriving in a
new costume. So 0.5 is not a rough guess, it is near the middle of a narrow
window.

**Sweep 2 — "really thin" is affordable down to 2.5 units.** 3 units holds at
16px as a quiet grey line, 2.5 still reads, and 2 is a smudge that survives at
24px and above but not below. The sheet uses 3. This is more headroom than 7c
had, because eight suckers carry far more weight than six arms did.

## Round 7e — E9 smoothed, and the accent

Peter's direction, 2026-09-07: **make E9 more stylish, with less sharp edges,
and keep the app's red accent in mind.**

Fifteen concepts in `scripts/mark/rounds/r7e.mjs`, all on 7d's geometry (ink
reaching 39 units from a centre at 50, 56; a 42 × 3 dash at y 8.5) so only the
treatment varies. Row 0 is E9 unchanged, so the sheet argues against the thing
it is improving rather than against a memory of it.

**Five hard edges were attacked, cheapest first.** Naming them separately
matters, because four are cheap and the fifth is the one that was actually
holding the mark back:

1. **The flat chop at the base.** `ribbon()` closes its outline with a straight
   chord, and on E9 that chord lands at the top, where the eye arrives first. A
   disc of the same fill at each end of the centreline swallows it — one line
   of code, and the single biggest improvement per character changed (F1).
2. **The needle at the tip.** A taper exponent of 1.15 sheds width fast. 0.85
   with a fatter tip keeps the arm an arm all the way round (F2).
3. **The scalloped counter.** E9's suckers ride *proud* of the inner edge, so
   the counter is lumpy and the lumps turn to noise below 32px. Putting the
   suckers *inside* the band instead — as punched apertures, with the arm
   itself as their rim — leaves both edges as unbroken curves (F3).
4. **The seam.** Sweeping past a full turn buries the thin tip under the thick
   root, so the ring closes (F5, F7). This is a smoothness fix *and* the
   small-size fix, which is why 7d's trade was worth attacking here.
5. **The step in the silhouette.** This is the one that mattered. The arm is 15
   units wide at the root and about 5 at the tip, so the *outer* edge drops 5
   units on the way round — the ring is not a circle, and that reads as
   unfinished at every size.

**The fix for 5 is to stop letting the taper touch the outer edge.** Pin the
centreline so it rides outward exactly as fast as the arm thins, and the whole
taper is spent on the inside: a true circle outside, a crescent counter
inside. That is how a calligraphic O is drawn, and it is what a ring of
generated arms had been fighting since 7a. Note the direction — this eases the
radius *outward* towards the tip. 7d killed easing *inward*, which curls the
tip into the centre and reads as an ammonite; the opposite motion makes a
circle, not a spiral.

**But a wrapped ribbon can never close cleanly, and that is a fact about the
tool, not about this drawing.** `ribbonAt()` walks an *open* centreline and
caps both ends, so wrapping one into a ring always leaves a cusp where the
outline meets itself. Two attempts failed before the cause was clear: tucking
the tip inward under the root bulges the silhouette, because offsetting a
steep radial dive throws the outer edge past the circle; letting the arm swell
back to full width at the seam removes the *seam* but not the *cusp*. Both look
clean on a contact sheet and both show a nick at 330px — which is the size of
an app icon on a phone. The record is G2 and G6.

**So the last family stops wrapping an arm and draws what it was trying to
become.** `band()` in the library emits a true outer circle plus a closed inner
contour whose distance from it varies: the silhouette is exact by construction
and there is no join anywhere in the shape. The width law is two harmonics of
the angle — periodic, so it cannot disagree with itself — where `cos φ` does
the thick-to-thin and `sin 2φ` skews it, so the swell is asymmetric and reads
as an arm rather than as a calligraphic O.

| | Reads as | Reads at 16px |
|---|---|---|
| **E9** the reference | best octopus of 7d | a C or an @ — the seam shows |
| **F1** rounded caps | the same, no cut edge | unchanged; the gap still breaks it |
| **F2** softer taper | an arm with body to the end | unchanged |
| **F3** suckers inside | clean edges, holes not lumps | quieter, still open |
| **F5** tip meets root | closed, rims still proud | strong closed O, lumpy |
| **F7** closed + inside | clean and closed | strong O; the outline still steps |
| **G2** outer circle locked | a true circle, one notch at 12 o'clock | strong |
| **G6** swelled into its root | no seam by design | strong — but nicks at 330px |
| **G8** band, suckers one way | **the answer** | solid closed Ō |
| **G9** deeper swell | more drama, same read | solid |
| **G10** six larger holes | calmer | best of all at 16px |
| **G11** brushed macron | softer, slightly less crisp | fine |

**G8 is the recommendation, and it wins both of 7d's questions.** 7d concluded
that no concept could be both an octopus at 128px and a letter at 16px, because
reading as an octopus needed an open ring and a closed ring read as a machine
part. That conclusion was true of every shape *built by wrapping an arm*. It is
not true of a band: the outer circle holds the letter absolutely, and the
octopus is carried by the varying width and by the suckers, neither of which
has to break the silhouette to be seen. The trade was an artefact of the
construction.

**Three findings worth keeping past this round:**

- **A run of suckers must have a direction.** Spread symmetrically either side
  of the root they read as a crown, which is 7d's dial in a new costume. Running
  them one way from the root — and packing them *towards the tip*, which is
  what a real arm does — is what makes the ring move.
- **Crowd the small end, never the big one.** The first version bunched the
  suckers at the root, where the holes are widest; they merged into a wavy slot.
- **The aperture floor is a floor on the band, not on the hole.** At 0.5 of the
  band width, an aperture needs roughly 6 units of band to clear 3 units on this
  grid. The waist is thinner than that, so the sucker run has to stop before it
  — which is also what an arm does.

### The accent

Design-system §1 says the app is monochrome paper with **one** accent,
`#c2410c`, and that it means *action lives here*. A brand mark is chrome, not a
read, so it is not spending that channel — but the moment the icon sits beside
the app, the accent stops being unambiguous. That objection is recorded here
once; the rows were drawn as asked, on G8 so only the colour varies.

- **H1 — the macron in the accent.** The safest, and it works: the macron is a
  separate element, so colouring it reads as deliberate rather than as part of
  the letter going pale. Survives to 16px on both grounds.
- **H2 — the apertures in the accent.** Drawn and refuted. The holes stop being
  holes and become dots; by 32px the sucker read is gone and one side of the
  ring is a smudge.
- **H3 — a stretch of the band in the accent.** The most striking at 128px and
  the best case for an app icon. At 16px on a light ground the accent half is
  visibly lighter than the ink half, so the ring goes lopsided — the pale-element
  rule from the vessel rounds arriving again.

**On a dark ground the accent has to be lifted.** `#c2410c` on `#1f1f1f` is a
dark orange on near-black. The sheet shows the accent rows at `#e2703f` on
dark, which the shipped SVG can switch to under `prefers-color-scheme` exactly
as the current favicon already switches its ink.

## Round 7f — the circle written with the same brush as the dash

`scripts/mark/rounds/r7f.mjs`, five concepts. Peter's direction, 2026-09-08: of
7e's sheet he kept **G2** (the locked outer circle with punched suckers) and
**G4** (the same ring with the brushed macron), and asked for the part that
makes G4 different to spread — if the *dash* is written with a brush, the
*circle* should be written with the same tool. Five proposals only, on purpose:
the size ladder gets drawn once a direction is picked.

The macron is frozen at G4's exact dash on every row, so the only variable on
the sheet is what the circle is drawn with.

### The finding the round is built on

The obvious move is to give the ring a brush **rhythm** — land loaded, open and
thin, drive through the bottom, release — because that changing rate is what
separates a written stroke from a generated one. It was drawn first, and it
fails, for a reason that is worth more than the rows it cost:

> With the outer edge locked to a circle, every change of pressure lands in the
> **counter**. The counter is the bowl of the letter, so the eye reads it as the
> shape itself, not as evidence of a hand. A rhythm there is not handwriting, it
> is a lumpy hole — the two rows read as a potato and as a leaf.

So over a locked circle the width law has to be as smooth as the bowl needs to
be: one slow swell, one slow thinning, no second thought. What makes it
*calligraphic* is then not the rate of change but **where the weight sits** and
**how the two edges relate** — which is exactly what separates a pen from a
brush, and gives the sheet its two families.

### The five

| | Reads as | Reads at 16px |
|---|---|---|
| **L1** broad nib, diagonal stress | a written O — weight at 2 and 8 o'clock, hairline at 11 and 5 | clean Ō, dot texture on one side |
| **L2** uneven nib — the pen in a hand | **the recommendation**: L1 with the 8 o'clock lobe loaded heavier, so the letter has a near side and the suckers have a root | clean Ō, the arm still shows |
| **L3** brush, loaded under the writing hand | one heavy zone at 8 o'clock releasing to 1 — an ensō | cleanest ring of the five |
| **L4** brush, off-round outer edge | L3 with the silhouette wandering 1.5%, the way a drawn one does | holds, marginally softer |
| **L5** the same letter, leaning | L2 sheared 6°, dash and all — an O written at speed | holds as an oval |

**L2 is the recommendation.** It is the only row that is calligraphic and a
creature at the same time. The two hairlines are what makes a circle read as
*written* rather than as *tapered* — G2 already tapered, and nobody reads a
taper as handwriting — and making the two lobes unequal is what a hand does and
a machine does not, which gives the sucker run the root and the direction 7e
established it needs. L3 is the safest and the most serene; pick it if the
octopus matters less than the ring.

Two mechanical notes: the thin floor is **5.4 units, not a dry hairline**,
because a 5-unit stroke is 0.8 device pixels at 16px — grey but still a stroke,
and under that the ring breaks, which 7d proved stops it being a letter. And
`offBand()` (L4) is new: a closed band whose outer edge is not a circle, so a
drawn silhouette keeps the no-caps, no-seam, no-cusp property that a wrapped
ribbon can never have.

### Three shapes this round drew, looked at, and cut

Each one costs a full round to rediscover, so they are recorded here rather than
only in the bench:

- **A chisel head becomes an arrowhead.** The flat cut a real brush leaves when
  it lands turns into the browser **reload icon** the moment it sits on a ring —
  at every size, in two separate rows. A brush head on a circle has to be round,
  however untrue that is to the reference.
- **A short lap reads as a bite, not as an overlap.** Ink cannot show one stroke
  crossing another — they merge — so all that survives of a dry tail crossing
  its own loaded head is the *step*, and a step in the counter is a defect. The
  tail has to swell back into its own head over a long arc (~46°) instead.
- **The open ensō confirms 7d at 16px.** The gap stops being a gap and becomes a
  gauge with a needle. It is the honest reference and it is not a letter.

## The pick

Peter, 2026-09-08, marking the 7e sheet again: **G4** — the ring with the
brushed macron. It is the row he had already kept, and he chose it over the
five calligraphic circles 7f drew from it, so the answer to "should the circle
be written with the same brush as the dash?" is **no**: a ring whose weight
comes from the arm tapering is enough, and adding a nib or a brush law on top
of it buys nothing the mark needed. L1–L5 are not shipped, and the reasons they
were drawn are kept above so the question does not get asked a third time.

**v2.0.52 shipped the wrong drawing, and this is how.** The sheet Peter marked
was a draft of 7e that was reorganised before it was committed, so its row ids
do not survive in the repo: his G2 is titled *Outer circle locked, apertures*
and his G4 is *"G2 with the dash drawn by the same brush as the arm"*. That
base is 7e's **G2** — the wrapped arm pinned to a circle. The session read the
mismatch, decided a band was the better object at app-icon size, and shipped
7e's G11 instead, writing the substitution into this brief as though it were a
detail. It is not a detail: the two rings distribute their weight differently,
their counters are different shapes, and their suckers grade differently. Peter
saw it immediately — *"It is a different G4."* The rule it broke is the simple
one: **he picks a drawing, not a construction**, and an objection to the drawing
is his to overrule, not mine to route around.

## The tilt — round 7g

Peter, 2026-09-08, after the correction: *"I would choose the same G4, but
tilted the way G3 is."* G3's note on his sheet reads *"six larger apertures and
the root at 1 o'clock, so the weight is not stacked."* The tilt is the second
half of that: the **ring turns**, and the macron does not turn at all, because a
tilted macron stops being a macron. G3's other change — six bigger holes instead
of eight — was not asked for and is not taken; the round drew it as **T3** so
the choice was on the screen rather than in an argument.

What the turn buys, and it is visible at 180px: with the root at twelve the
heavy end of the stroke stacks directly under the macron, so the two heaviest
things in the mark sit on the same vertical axis and the eye reads a lid on a
pot. Turned, the weight comes off that axis, the counter's step reads as the end
of a stroke rather than as a defect, and the thin tail runs under the macron
where it belongs.

Round 7g drew five rows — the base G2, G4 untilted, G4 at one o'clock, G4 at one
o'clock with G3's six holes, and G4 at half past one — at 16 to 128px on light
and dark, plus all five at 180. That last row exists because "the way G3 is" is
a direction and not a number, so the round put both sides of one o'clock on the
screen instead of guessing which one he meant.

**One o'clock shipped as v2.0.53; Peter then took half past one** — *"I choose
the 1:30 version"* — which is row **T4**, and it is what is live. The root moves
from −60° to **−45°**, a further 15°, for a total turn of 50° off the original
−95°. Nothing else about the drawing changes, and nothing else *can*: the outer
edge is a true circle and the root's cap sits exactly on it, so a turn moves
only where the stroke begins and ends. The measured ink bounds are identical
before and after.

**One thing does differ from the sheet, and it is forced.** The bench draws an
arm as a ribbon plus a disc on each end; a shipped icon needs the suckers to be
real holes, which needs one path and a fill rule, which the cap discs break. So
the shipped arm is one closed outline with the root cap built into it. The
side-effect is that the sharp corner where the tip laps the root is smoothed and
the small cusp the sheet version carries on the outer edge is gone. It is a
hairline at 330px, it makes the mark cleaner rather than different, and it is
recorded here rather than left to be discovered.

Verified on the production build (`vite preview`) after each turn, most recently
for T4 on 2026-09-08: `link[rel=icon]` resolves to `/favicon.svg`, that file and
`/apple-touch-icon.png` both return 200, the app loads with zero console
messages of any kind and zero responses ≥ 400, and both files were rendered by
the browser at 16, 24, 32 and 64px on tab-bar grey and on a dark tab bar (where
the `prefers-color-scheme` rule flips the ink to white), plus the touch icon at
90px on its paper ground. The letter still closes at 16px and the suckers are
still holes at 32px.

## Doctrine check (§4)

1. **Which read does this sharpen?** None directly — it is chrome, and R1 does
   not count it (the ledger's Exempt row).
2. **Stop doing:** apologising for one console error in every verification pass.
3. **Input or destination?** Neither — presentation.
4. **Honest shape:** n/a.
5. **Physiological number?** No. No `## Grounding` needed.

## Acceptance

- [x] `index.html` declares an icon and an `apple-touch-icon`.
- [x] No `/favicon.ico` 404 in the console on a fresh load. Checked against the
      production build (`vite preview`), not just the dev server: zero console
      errors and zero responses ≥ 400 on a fresh load. That 404 was the app's
      only console error, so the console is now clean.
- [x] The staging/production question is answered: one icon everywhere.
- [x] Round 7f is drawn and Peter has picked a mark: **G4**, 2026-09-08 — see
      *The pick*.
- [x] The new mark's ink bounds measured before it shipped (left 10.83, top
      5.83, right 89.17, bottom 95 on the 100 grid — clear of all four edges),
      both `public/favicon.svg` and `public/apple-touch-icon.png` replaced, and
      *What shipped* above rewritten to describe the mark that is actually live.
- [x] The drawing shipped is the one Peter picked, not a construction chosen for
      him: 7e's **G2 arm** with the brushed macron, turned to half past one —
      round 7g's T4, v2.0.54. v2.0.52 shipped a band in its place and v2.0.53
      stopped an hour short; see *The pick* and *The tilt*.
- [x] `scripts/mark/` is deleted — the whole folder, in the commit that ships
      the winner. Every finding worth keeping was written into *Round 7* first,
      the geometry into *What shipped*, and nothing else referenced the folder,
      so the deletion was `git rm -r` and nothing more. It came back once, for
      round 7g, and went away again in the same push — which is the whole point
      of scaffolding that costs one command to restore. The last commit that
      carries the whole bench, round 7g included, is `475207b`:
      `git checkout 475207b -- scripts/mark`.
- [x] The tab icon is visible where it can be checked. **Peter's box, ticked by
      him on 2026-09-08.** Both sites sit behind the cookie gate whose
      credentials are Vercel Secrets, so no session here can open them — he
      confirmed it on staging, the build he uses daily. Production serves the
      same two files from the same commit once `develop` fast-forwards onto
      `master`, and step 5 of the release ritual already opens the site at
      2.1.0, so that check belongs to the release rather than to this brief.
