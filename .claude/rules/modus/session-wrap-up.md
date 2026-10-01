<!-- managed by modus — edit the rule in the modus repo, not here -->

## Session context wrap-up

Sessions should not run the context window far past **~200k tokens** — beyond
that they get slow and expensive. Claude Code compacts the conversation rather
than ending it, but the summary is lossy, so what must survive the boundary
lives on disk, not in the chat: a clean tree, true roadmap statuses, and a brief
for whatever remains. To keep that so, follow this protocol.

**Work in atomic units.** Structure work so that each unit is independently
build-passing and commit-able. Checkpoint after every unit: run the project's
build → commit → push. This is the real safety guarantee — because we checkpoint
continuously, stopping at any point leaves a clean, working tree.

**The wrap-up trigger.** The session-flow context guard watches context-window
occupancy and never interrupts a unit in progress:

- Past the soft threshold (~180k of a 200k window) it warns the *user* in the
  terminal and leaves the model alone until the turn ends.
- When the model is about to stop above that threshold, it asks once for the
  wrap-up below before letting the turn end.
- After an auto-compaction it asks the model to confirm that the tree, the
  statuses and the brief reflect where it is, then re-arms for the next cycle.

The user may also just say "wrap up." When the signal arrives:

1. **Finish only the atomic unit already in progress. Start nothing new.** 200k
   is a *soft* target — if finishing the current unit needs 210k, finish it.
   Never stop mid-feature to hit the number; a broken tree is the thing we are
   avoiding. If the signal finds the unit incomplete, do not force a commit —
   write where it stands into the hand-off brief instead.
2. **Checkpoint it**: run the project's full build (must pass), then commit and
   push per the repo's convention.
3. **Leave the statuses true.** Update the `**Status:**` line of every brief the
   session moved: the one worked on, anything discovered to be blocked (with its
   `**Depends:**` line), anything the session unblocked, and anything finished
   or dropped — which moves to `done/` saying `done` or `discarded`. A blocker
   found this session and named only in the chat is lost the moment it ends.
4. **Hand off the remainder.** Write the remaining scope as a kickoff-ready
   brief in `docs/roadmap/`, one file per item, named `NNN-<slug>.md`. Allocate
   the next free ID: the highest number across `docs/roadmap/` and
   `docs/roadmap/done/`, plus one. Include what's done, where it left off, and
   what's next, so a fresh session resumes cheaply.
5. **Commit the bookkeeping too** — the status edits and the new brief, pushed
   like any other change. A handoff that exists only in the working tree is not
   a handoff.
6. **Report the roadmap item's ID and the context figure** to the user. The ID
   is permanent — it stays with the brief through renames and through the move
   into `done/` — so a fresh session can pick it up with `/roadmap 7`. The
   figure lets the user choose: compact and carry on, continue as is, or start
   that fresh session.

Thresholds are env-overridable: `CTX_GUARD_WINDOW` (default 200000 — set
1000000 for `[1m]` models) and, as absolute token counts, `CTX_GUARD_SOFT` /
`CTX_GUARD_HARD` (default 90% / 97.5% of the window). Review or disable the
guard via `/hooks`.
