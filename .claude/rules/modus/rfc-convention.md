<!-- managed by modus — edit the rule in the modus repo, not here -->

## Specifications live in the project's RFC repository

Every project that plans its work keeps that planning in a **separate git
repository named `<project>.rfcs`** — `tekio.rfcs`, `lumi.rfcs`, `yami.rfcs`,
`modus.rfcs`. The code repository holds code. Nothing about *what we intend to
build* is committed next to it.

```
<project>.rfcs/
├── README.md               ← what this repo is, and which code repo it plans
├── CLAUDE.md               ← points at the rules folder
├── .claude/rules/modus/    ← this rule, committed so it travels with the repo
├── rfcs/
│   ├── 0000-template.md    ← copy this to start an RFC
│   ├── 0071-<slug>.md      ← one RFC per unit of work; the number is its ID
│   ├── 0071/               ← optional: diagrams and sidecar files for RFC 71
│   ├── done/               ← retired RFCs, keeping their numbers
│   └── releases.md         ← the release registry (furniture, never an RFC)
└── doctrine.md, design-system.md, …   ← standing reference, at the root
```

**`rfcs/` is for change; the root is for what stands.** A numbered RFC proposes
something that is not true yet. A doctrine, a design system, a schema, a
product description states what *is* — those live at the repository root (or in
folders under it) and carry no future work. The moment a reference document
grows a "follow-up", "next step", "TODO" or "proposed edit", that item has
escaped tracking: move it into an RFC, leave a one-line pointer where it was,
and repoint anything that referenced the old location.

**Two repositories, two commits.** Work that changes both the plan and the code
is committed in both, in the same session, neither one left dirty. Never mirror
an RFC into the code repo "for convenience" — a copied spec is a spec that will
disagree with itself within a week.

## The RFC file

Named `NNNN-<slug>.md` — four digits, a hyphen, a slug. It opens with YAML
frontmatter, then a `# RFC NNNN: <title>` heading, then the sections below.

```markdown
---
title: Retire the flat exercises fallback
authors: [Peter Petrov]
created: 2026-08-14
last_updated: 2026-09-10
status: planned
status_note: committed for 2.1.0; nothing blocks it
label: infra
depends: [46]
release: 2.1.0
---

# RFC 0071: Retire the flat exercises fallback
```

| Field | |
|---|---|
| `title` | the same words as the `# RFC NNNN:` heading |
| `authors` | a list, even with one name |
| `created` | `YYYY-MM-DD`, set once and never touched again |
| `last_updated` | `YYYY-MM-DD`, bumped in the *same edit* as any change to the file |
| `status` | one of six keywords, below |
| `status_note` | one or two sentences on where it actually stands, for a person |
| `label` | `bug` · `infra` · `feature` · `backlog` — exactly one |
| `depends` | RFC numbers that must land first; omit the field when nothing blocks it |
| `release` | one release name, spelled as `releases.md` spells it; omit when unscheduled |

Deliberately absent: OpenClaw's `issue` and `rfc_pr`. There is no PR ceremony
here — work is pushed straight to the main branch — so a field pointing at a
review that never happens is noise.

**The number in the filename is the ID, and it never changes.** Not when the
title is rewritten, not when the slug is renamed, not when the file moves into
`done/`. Allocate one by taking the highest number across `rfcs/` **and**
`rfcs/done/`, adding one, and padding to four digits. Never reuse a number,
never renumber to close a gap — gaps are the record of retired work. `0000` is
the template and is never an RFC.

**A `.md` file without a `NNNN-` prefix is not an RFC.** `README.md`,
`releases.md`, and any shared-context file the RFCs tell you to read first are
furniture: never listed as work, never given an ID.

## Sections

Seven from the OpenClaw template, plus one of ours:

| Section | |
|---|---|
| `## Summary` | one paragraph: what this changes |
| `## Motivation` | why it is worth doing, and what went wrong without it |
| `## Goals` | what success looks like |
| `## Non-Goals` | what this deliberately does not touch — the fence around the work |
| `## Proposal` | what is actually changing, concretely enough to start from |
| `## Rationale` | the alternatives considered and why this one won |
| `## Acceptance` | `- [ ]` checkboxes, each one testable |
| `## Unresolved questions` | what is still open — an RFC with entries here is not kickoff-ready |

A long-running RFC keeps its history in a `## Progress log` of dated bullets
after the frontmatter — never by growing `status_note` into a changelog.

**Close on evidence.** All boxes ticked means the RFC is `done` and moves to
`done/`. An open box means it is not done, however long ago it started. Work
decided against is `discarded` with the boxes left unticked and the reason in
`status_note` — the number is never reused and the reasoning is the part worth
keeping.

## Status

Six keywords. The keyword is what tooling reads; `status_note` is what a person
reads.

| `status` | Means |
|---|---|
| `backlog` | not committed to yet; needs a decision or more context |
| `planned` | committed and kickoff-ready; nobody is working on it |
| `in progress` | someone is working on it now |
| `blocked` | committed, but something outside the RFC must land first |
| `done` | shipped — the file lives in `done/` |
| `discarded` | dropped without shipping — the file lives in `done/` too |

`done/` holds both endings, so a file in there is only "done" if it says so.
A `discarded` RFC is reported as dropped, never as shipped.

**A status is maintained, not just set.** It is the only written record of where
the work stands, and one that was true last week and untouched since is worse
than none, because it is read as current. Four moments change it, and each edit
belongs in the same commit as the change it describes:

| When | `status` becomes |
|---|---|
| you start on it | `in progress` |
| something outside it must land first | `blocked`, naming what — plus `depends` when that something is another RFC |
| the thing it waited for lands | `planned`, or `in progress` if you carry straight on |
| it ships, or it is dropped | `done` or `discarded`, and the file moves to `done/` |

Every one of those edits bumps `last_updated` too.

**`depends` and `status` are two halves of one statement.** An RFC whose
dependency has not landed reads `blocked`, not `planned`. Writing only one of
the two is what leaves genuinely blocked work sitting in the Planned column.
Dependencies on an RFC already in `done/` are ignored, so `depends` itself
never needs editing when a blocker lands — but the status does, and that is on
whoever lands the blocker.

**Saying it is not recording it.** The moment you tell the user something is
blocked — "we can't do 12 before 9 lands", "this needs the migration first" —
you have discovered a fact about the plan, and the next thing you do is write it
into the RFC. A blocker that exists only in a chat message is gone when the
session ends. This bites hardest in planning, where blockers are found in bulk:
working out the order of five RFCs and reporting it in prose leaves five files
unchanged and the reasoning lost. **The plan is the edits**; the message to the
user is a summary of them.

**Unblocking is the blocker's last step.** Before an RFC moves into `done/`,
take everything that depends on it off `blocked`. Nobody else will.
**Discarding propagates the same way**: whatever depended on a dropped RFC is
now waiting for something that will never land, and gets its decision in the
same edit.

## Labels

Exactly one per RFC. The label says what kind of work it is; the status says
where it stands.

- **bug** — something already shipped behaves wrongly; the RFC restores the
  intended behavior.
- **infra** — structure, tooling, process or platform work, including the
  process documents themselves. Not itself a user-visible change.
- **feature** — committed product work: something the user will see or use.
- **backlog** — an idea not committed to yet. Parked until the decision that
  makes it kickoff-ready arrives; then relabel in place, usually to feature.

## Releases

One optional `release:` field commits an RFC to a release, and it **stays when
the file moves to `done/`** — that is what keeps a shipped release's scope
browsable afterwards. Editing that field *is* the scheduling act; there is no
other bookkeeping.

Releases are declared in `rfcs/releases.md` — furniture, never an RFC. One `##`
section per release, the heading text being the name exactly as RFCs spell it,
with optional `**Target:**` and `**Status:** planned | released <date>` lines.
Work that can only happen *after* a release ships is not part of it — it
depends on it.

## Assets

Anything that would clutter the RFC body — a diagram, a screenshot, an
inventory, a long implementation checklist — goes in a sibling folder named for
the RFC's number and is referenced with a relative path:

```markdown
![](0071/exercise-shapes.png)
[Migration inventory](0071/inventory.md)
```

The folder is optional and shares the RFC's fate: it moves into `done/`
alongside it.
