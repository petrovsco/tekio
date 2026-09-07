# Roadmap: Show the app version in the app

**Label:** feature
**Status:** blocked — the code shipped 2026-09-07 (v2.0.43) and the line is
browser-verified on staging; the remaining box only ticks when 2.1.0 reaches
production and the site prints it.
**Release:** 2.1.0
**Origin:** the 2.0.0 release (2026-09-05). Production could only be verified
through Vercel's deployment metadata — the gate credentials are Vercel
Secrets, so an agent cannot log in, and the running app has no way to say
which version it is.

## The plain summary

Put the `package.json` version on screen once, where it costs nothing: the
foot of the Profile page, as `v2.1.0`. Then anyone can open
tekio.shamatoff.com and know in ten seconds whether a release landed. Every
push already bumps the version, so the string is always right.

## How

- Vite exposes it at build time: `define: { __APP_VERSION__:
  JSON.stringify(pkg.version) }` in `vite.config.ts`, plus a
  `declare const __APP_VERSION__: string` in a `.d.ts`. No network call.
- Render it in the quiet text style of the SIGNAL language
  ([design-system.md](../design-system.md)) — no colour, no icon.
- Profile and Admin are exempt infrastructure in the doctrine ledger, so
  the line adds nothing to any read.

## Doctrine §4

1. **Which read?** None — Profile is exempt (ledger). 2. **Stop doing:**
verifying releases through Vercel metadata. 3. **Input or destination?**
Neither. 4. **Shape:** a string. 5. **Physiological number?** No.

## Acceptance

- [x] The version from `package.json` renders on Profile with no network call.
      Vite `define` in both `vite.config.ts` and `vitest.config.ts`;
      `declare const __APP_VERSION__` in `src/vite-env.d.ts`; the line is the
      last element of `ProfileTab`. Verified in the browser 2026-09-07 — the
      foot of Profile read `v2.0.42`, and the string is in the built bundle.
- [ ] After the next release, production at tekio.shamatoff.com shows the
      released version.
- [x] The release procedure ([050](050-release-procedure.md)) names it as the
      verification step — step 5, "Verify production".
