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

## The header

Every brief opens with the same three lines, in this order, directly under the
`# Roadmap: <title>` heading. Anything else — kickoff notes, origin, links — comes
after them.

```markdown
# Roadmap: <title>

**Label:** feature
**Status:** planned — one sentence on where it actually stands
**Depends:** 018, 019
```

- **`**Label:**`** — one of the four above. What kind of work it is.
- **`**Status:**`** — **the first word is one of five**, then an em dash and a
  short human sentence:

  | Keyword | Means |
  |---|---|
  | `backlog` | not committed to yet; it needs a decision or more context |
  | `planned` | committed and kickoff-ready; nobody is working on it |
  | `in progress` | someone is working on it now |
  | `blocked` | committed, but something outside the brief must happen first |
  | `done` | finished — the file lives in `done/` |

  The keyword is what tooling reads; the sentence is what a person reads. Keep
  the sentence to a line or two and keep it current.
- **`**Depends:**`** — optional, and only for **hard** blockers: task IDs that
  must land before this one can start. Omit the line when there are none. A soft
  overlap ("check this doesn't fork the same model") is prose, not a dependency —
  a dependency here parks the brief behind another one, so only list what really
  parks it.

### Where the history goes

The `**Status:**` line says where a brief stands **now**. It is not a log. When a
long brief accumulates decisions worth keeping — rounds, picks, dated
confirmations — they go in a `## Progress log` section of dated bullets right
after the header (see [018](018-home-design-canvas.md)), not in the status line.
A status line that has grown into three paragraphs is unreadable to both people
and tools.

### Acceptance criteria are checkboxes

Close a brief on evidence, not on feeling. Where a brief has an `## Acceptance`
section, write each item as `- [ ]` and tick it when it is true. A brief whose
boxes are all ticked is `done` and moves to `done/`; one with open boxes is not
done however long ago it started.

### Retiring a brief

Moving a file into `done/` changes its depth, so:

1. Fix the relative links **inside** it (`../` becomes `../../`, a sibling
   `NNN-x.md` becomes `../NNN-x.md`).
2. Repoint everything that linked **to** it — including source comments:
   `grep -rn "<brief-filename>" docs src .claude`.
