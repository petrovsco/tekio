# Roadmap: Favicon and app icon

**Label:** infra
**Status:** planned — found during [027](done/027-weights-tab-signal-restyle.md); small, self-contained, no dependencies.

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

## Doctrine check (§4)

1. **Which read does this sharpen?** None directly — it is chrome, and R1 does
   not count it (the ledger's Exempt row).
2. **Stop doing:** apologising for one console error in every verification pass.
3. **Input or destination?** Neither — presentation.
4. **Honest shape:** n/a.
5. **Physiological number?** No. No `## Grounding` needed.

## Acceptance

- [ ] `index.html` declares an icon and an `apple-touch-icon`.
- [ ] No `/favicon.ico` 404 in the console on a fresh load.
- [ ] The tab icon is visible on production and staging, and the staging/production
      question above is answered either way.
