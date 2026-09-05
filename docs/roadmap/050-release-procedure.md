# Roadmap: The release procedure, written down

**Label:** infra
**Status:** planned — kickoff-ready, committed to 2.1.0 by Peter on 2026-09-05. Docs only: the steps below are the ones 2.0.0 was released by; the work is putting them where a session reads them.
**Release:** 2.1.0
**Origin:** 2.0.0 was released by hand on 2026-09-05 from three files
(`CLAUDE.md`, [024](024-staging-shared-database-safety.md),
[025](025-release-blocked-schema-drops.md)) and memory. Every step turned out
right, but nothing said the order, and two of them — the staging sweep and
the queued schema drops — were found only because those briefs happened to
be open.

## The plain summary

One checklist, in one place, that a fresh session can run top to bottom
without rediscovering anything.

## The steps, as run for 2.0.0

1. **Pre-flight on `develop`:** `npm run build`, `npm run test`,
   `npm run check:docs` — all green.
2. **Registry:** in [releases.md](releases.md) set the release's
   `**Status:**` to `released <date>`. Every brief still tagged
   `**Release:** <it>` but not in `done/` is retagged to the next release
   (carry-over) or untagged, and its status line says so.
3. **Version:** bump `package.json` to the release version; commit as
   `release: X.Y.Z — <theme> (vX.Y.Z)`.
4. **Ship:** push `develop`; `git push origin develop:master`
   (fast-forward — `master` has never had a merge commit); annotated tag
   `vX.Y.Z`; push the tag.
5. **Verify production:** `vercel inspect tekio.shamatoff.com` gives the
   deployment id; `vercel api "/v13/deployments/<id>?teamId=<team>"` must
   show `meta.githubCommitSha` equal to `master` and the alias
   `tekio.shamatoff.com`. The gate must answer 401 from that deployment.
   Once [049](049-app-version-display.md) ships: open the site and read the
   version — the only check a person can do without Vercel.
6. **Post-release:** unblock what depended on the release (025's pattern:
   `blocked` → `planned`, first acceptance box ticked); on a **major**, run
   024's sweep of `origin`-tagged log rows (preview counts first); run the
   025 queue as tracked migrations; move finished briefs to `done/` and
   repoint their links.
7. **Open the next release** section in `releases.md`.

## Where it lives

`CLAUDE.md`'s "Branching and versioning" is the file every session reads,
so the short checklist goes there, linking 024 and 025 for the two database
steps. That also ticks 024's third acceptance box ("the versioning rules in
`CLAUDE.md` point at the cleanup as part of a major release"). A separate
`docs/release.md` would be one more reference doc nobody opens.

## Acceptance

- [ ] The checklist is in `CLAUDE.md`, seven steps or fewer, each one line.
- [ ] 024's third acceptance box is ticked by the same edit.
- [ ] 2.1.0 is released from the checklist, and whatever it missed is added
      in that session.
