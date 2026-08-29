# Roadmap conventions

One file per item: `NNN-<slug>.md`, starting `# Roadmap: <title>`, then a
`**Label:**` line and a `**Status:**` line. The number is the permanent task
ID (next = highest across this directory **and** `done/`, plus one — never
reused, never renumbered). Finished or abandoned briefs move to `done/`,
keeping their number.

This file has no number, so it is furniture, not a task — `/roadmap` ignores
it.

## Labels

Every active brief carries exactly one:

- **bug** — something already shipped behaves wrongly; the brief restores
  intended behavior.
- **infra** — structure, tooling, process, or platform work (auth, migrations,
  schema baselines, the grounding process itself). Not itself a user-visible
  read.
- **feature** — committed product work: a new or sharpened read, capture, or
  number the app will ship. Grounding briefs that validate shipped numbers
  count as feature — they change what the product claims.
- **backlog** — a feature idea we are **not** committed to yet. Parked: it
  needs more context or a product decision before it can be kickoff-ready.

A backlog brief that gets its decision is relabeled (usually to feature) in
place; the label describes the work, the `**Status:**` line tracks where it
stands.
