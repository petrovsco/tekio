# Roadmap: Favicon and app icon

**Label:** infra
**Status:** in progress — the vessel mark and the 404 fix shipped 2026-09-07 (v2.0.46) and are live on `develop`; reopened the same evening because Peter wants a different mark. Round 7d is specified below and is the next thing to do.
**Release:** 2.1.0

## Progress log

- **2026-09-07 (v2.0.46)** — rounds 1–6. The tipped-vessel mark shipped, the
  `/favicon.ico` 404 is gone, verified on the production build: zero console
  errors, zero responses ≥ 400. Everything under *What shipped* describes this,
  and it is what is live right now.
- **2026-09-07, same evening** — rounds 7a–7c, a new concept: **an octopus
  forming the Ō** of Tekiō. Nothing shipped; the vessel is still the live icon.
  Findings under *Round 7*. The drawing tooling moved into
  [scripts/mark/](../../scripts/mark/README.md) so it survives the session.
- **Next** — round 7d, specified below: eight suckers forming the O.

[index.html](../../index.html) declares no icon and there is no `public/`
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
([design-system.md](../design-system.md) §7 — stroke SVG on a 24 viewBox, no
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

**The mark: a tipped vessel with the water still level.** The container leans
21°; the water surface stays horizontal. The container changes, the reference
does not — which is the app's own sentence, drawn.

It was chosen over 40-odd alternatives across four rounds, and the discards are
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

**Files:** [public/favicon.svg](../../public/favicon.svg) (inverts to white on
a dark tab bar via `prefers-color-scheme`, so it never vanishes into chrome)
and `public/apple-touch-icon.png` (180×180, paper ground, ink mark).

**One trap the geometry hides.** A square rotated inside the viewBox does not
fit at its own width. A side-`s` square with corner radius `r` and stroke `sw`,
rotated 21°, reaches `sqrt(2)·(s/2 − r) + r + sw/2` from the centre along its
corner diagonal, and the vertical component of that has to stay under 12. At
s = 18.2 two corners were sliced flat; at 17.4 the ink measured as touching all
four edges. It ships at 16.4, which leaves ~0.55 of margin. The measurement is
worth redoing rather than eyeballing — the clipping is invisible at 16px and
obvious at 180px.

## Round 7 — an octopus forming the Ō

Peter, 2026-09-07: *"I want to experiment with a different concept, but for that
I will need higher quality design. Octopus making an Ō, either with head or with
tentacles."* The Ō is the capital O with the bar over it, from the name Tekiō.

**The quality fix came first, and it is the reusable part.** The earlier rounds
drew tentacles by guessing bezier control points, which is why a hand-drawn
chameleon collapsed into a blob. Arms are now generated: sample a centreline,
push it out sideways by a width that shrinks along the length, and run a smooth
closed spline round the resulting outline. That library is
[scripts/mark/](../../scripts/mark/README.md), with the accumulated 16px rules
in its README.

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
- [ ] Round 7d is drawn and Peter has picked a mark, or said the vessel stays.
- [ ] If a new mark wins: its ink bounds measured with
      `node scripts/mark/bbox.mjs public/favicon.svg` before it ships, both
      `public/favicon.svg` and `public/apple-touch-icon.png` replaced, and
      *What shipped* above rewritten to describe the mark that is actually live.
- [ ] The tab icon is visible on staging and production. **Peter's to tick** —
      both sites sit behind the cookie gate whose credentials are Vercel
      Secrets, so no session here can open them. Staging shows it on the next
      preview deploy; production at the 2.1.0 release, where step 5 of the
      release checklist already opens the site.
