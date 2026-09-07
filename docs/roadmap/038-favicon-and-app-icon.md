# Roadmap: Favicon and app icon

**Label:** infra
**Status:** blocked — the mark shipped on `develop` 2026-09-07 (v2.0.46) and the 404 is gone, verified on the production build. The last box needs Peter's own eyes on the deployed sites, which only he can open: the gate credentials are Vercel Secrets.
**Release:** 2.1.0

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
- [ ] The tab icon is visible on staging and production. **Peter's to tick** —
      both sites sit behind the cookie gate whose credentials are Vercel
      Secrets, so no session here can open them. Staging shows it on the next
      preview deploy; production at the 2.1.0 release, where step 5 of the
      release checklist already opens the site.
