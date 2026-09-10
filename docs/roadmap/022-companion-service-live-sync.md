# Roadmap: Companion service — live session sync/notifications

**Label:** backlog
**Status:** backlog — raised 2026-08-30. Parked until it is scoped against doctrine section 4 — the product has not committed to it yet. Left in backlog at the 2.1.0 planning (2026-09-05).

## The idea

A standalone **companion service in Node/TypeScript on AWS**: live
training-session sync and notifications — WebSocket push of session updates, a
DynamoDB store, Cognito/OIDC auth.

## Why it exists (be honest about the driver)

**Part of the driver is the maintainer's, not the product's, and that is worth
saying out loud.** The service would exercise cloud + NoSQL + WebSocket + OIDC in
one place — a deliberate skills gap being closed on purpose. That is a legitimate
reason to choose *when* to build something and a worthless one for choosing
*what*, so the product case has to stand on its own:

- The doctrine §4 checklist runs at kickoff. If live sync/notifications don't
  serve "Tekiō tells me what's missing", the service gets a different shape —
  the skills exercise needs *a* real service, not this one specifically.
- Not a new menu section, not a new read (R1/R3 apply as usual).

## Waiting on

A tekio session to scope it: what the service actually pushes, to whom, and
whether the product wants it — or whether the exercise re-shapes around
something the product does want.
