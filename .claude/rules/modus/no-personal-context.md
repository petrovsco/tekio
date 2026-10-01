<!-- managed by modus — edit the rule in the modus repo, not here -->

## No personal context in this repo

This repo holds **project information and project code**. It holds nothing about the
people who work on it. Assume it faces the world — if it is private today, treat that
as a temporary state, not a licence.

### What never goes in

- **People.** Names, ages, birth years, relationships, household composition — the
  author's or anyone else's. Name the *role* instead: "the primary user", "a second
  adult user", "a picky child", "a reviewer".
- **Real body, health, money or employment data.** Bodyweight, calorie and macro
  targets, lab values, sleep records, salary, employer, career plans, client names.
  Where a realistic figure is genuinely needed — a fixture, a design mock, a test —
  **invent one and mark it invented**. Never reach for the real number because it is
  at hand.
- **Contact and location detail.** Addresses, phone numbers, private email addresses,
  personal calendars.

### State the shape, not the instance

The test is whether the sentence would still be true for a different user.

| Information about a person | Project information |
|---|---|
| "160 g protein/day, because he weighs 82 kg" | "Protein target, 1.6–2.2 g/kg, supplied as input" |
| "<child's name> rejects soft, wet textures" | "A user may reject foods by texture rather than by ingredient" |
| "B1 of the <employer> readiness plan" | "Exercises WebSocket + OIDC + a NoSQL store in one service" |
| "the user's quads are the missing volume" | "the body map names the muscle with the largest gap" |

**Including here.** The left column is written with placeholders on purpose: a rule
that teaches by naming a real child and a real employer publishes them every time the
rule is read. If you need a concrete example, invent one.

If the personal version is what makes the requirement understandable, the requirement
is under-specified — fix the requirement, don't paste the person in.

### Never point at a personal knowledge base

A personal knowledge base may exist outside this repo. This repo may **not** name it.
No repo name, no URL, no org, no filesystem path, no page path inside it. If a
document here must acknowledge that findings go somewhere else, it says
**"the personal knowledge base"** and stops there.

Tooling that genuinely needs to reach it resolves the location from machine-local
config, never from a file in this repo:

```
~/.claude/modus/personal-os     # one line: an absolute path. Absent on most machines.
```

**If that file is absent the step is inert — skip it silently and never mention it.**
A user who clones this repo must not learn that such a base exists.

### Why the rule is absolute

A pointer that makes one workflow smoother is still a pointer, and repos leak in one
direction only: a detail added for convenience is public the moment the repo is, and
rewriting history does not reliably take it back. When in doubt, leave the personal
detail out and put a role or a range where it stood.
