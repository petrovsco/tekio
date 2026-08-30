# Roadmap: Companion service — live session sync/notifications

**Label:** backlog
**Status:** backlog — raised 2026-08-30 elsewhere. Parked until it is scoped against doctrine section 4 — the product has not committed to it yet.

## The idea

A standalone **companion service in Node/TypeScript on AWS**: live
training-session sync and notifications — WebSocket push of session updates, a
DynamoDB store, Cognito/OIDC auth.

## Why it exists (be honest about the driver)

**Part of the driver is the maintainer's, not the product's.** It would
be one real project that
exercises cloud + NoSQL + WebSocket + OIDC at once — a deliberate skills gap
being closed. That reason is legitimate, but the *product* case must
still stand on its own:

- The doctrine §4 checklist runs at kickoff. If live sync/notifications don't
  serve "Tekiō tells me what's missing", the service gets a different shape —
  the skills exercise needs *a* real service, not this one specifically.
- Not a new menu section, not a new read (R1/R3 apply as usual).

## Waiting on

A tekio session to scope it: what the service actually pushes, to whom, and
whether the product wants it — or whether the exercise re-shapes around something the
product does want.
