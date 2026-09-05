# Roadmap: Show the app version in the app

**Label:** feature
**Status:** planned — kickoff-ready, committed to 2.1.0 by Peter on 2026-09-05. Small: one build-time constant and one line of UI.
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

- [ ] The version from `package.json` renders on Profile with no network call.
- [ ] After the next release, production at tekio.shamatoff.com shows the
      released version.
- [ ] The release procedure ([050](050-release-procedure.md)) names it as the
      verification step.
