# Roadmap: Mark the inventory rows that no research could ever settle

**Label:** infra
**Status:** planned — the state that makes this possible landed with [015](done/015-ground-trigger-spec-fixes.md) on 2026-09-08. Small, and it needs one judgement per row rather than a find-and-replace. Untagged for release; schedule it wherever it fits.

## Why this exists

The grounding inventory tracks 81 numbers and records, for each, whether anyone
has checked it. Before any check has run, every row reads **`unknown`** — so the
column says nothing, and the 6-week rule in `/ground` Mode B (*"anything still
`unknown` after one cycle earns a deliberate run"*) points a research run at
things no research could ever settle. Two real examples sitting in the queue
today: rounding a weight to the nearest 0.5 kg (`r05`), and the divide-by-zero
guard in the Brzycki 1RM formula at 37 reps.

Neither is a claim about the body. There is no proposition to test, so a search
could not come back "supported" even in principle. They are **definitional** —
they fix a unit or protect a formula.

[015](done/015-ground-trigger-spec-fixes.md) §13.2 added the state that says so.
`/ground` Step 3's vocabulary table now carries **`n/a — definitional`**,
explicitly marked as an *inventory* state and not a fifth verdict the research
agent can return. This brief is the pass that applies it.

## Scope

[docs/grounding-inventory.md](../grounding-inventory.md) only — the `Verdict`
cell of the rows currently reading `unknown †`, plus the footnote at the top of
the file that explains what `†` means. No skill file, no app code, no research
runs.

## The rows, and why this is not mechanical

Nine rows read `unknown †` today (the brief that produced this said eleven; the
count drifted through the 036 and 039 sweeps). **They do not all qualify**, and
§13.2's own rule is *"keep it small: if a row is arguable, it is `unknown`"*:

| Row | Reads | First look |
|---|---|---|
| 8.3 | Brzycki's `reps >= 37 → 0` guard | Definitional — a pole in the maths, not a claim |
| 9.4 | `r05` — round to 0.5 kg | Definitional — plates come in 2.5 kg pairs |
| 9.3 | the `0 / +2.5 / +5 kg` load-jump options offered | Probably definitional — plate granularity again, offered as an affordance |
| 10.5 | `[100, 250, 500]` quick-add water increments | Probably definitional — a UI affordance, asserts nothing |
| 1.10 | the sentinel `0` meaning "this axis does not apply" | §13.8 called this **ambiguous and left it so** — a `null` substitute read as a flag. Decide or leave |
| 4.14 | the 80 °C / 10 °C sauna and cold-plunge form hints | §13.8 also left this ambiguous — stored, never scored. Decide or leave |
| 7.2 | `level === 1 → primary` on write | A **classification**, and §13.4 has since gated those. Probably stays `unknown` |
| 5.7 | `cycle_length_weeks: CYCLE` | **Stays `unknown`.** §13.2 names this exact boundary: *"a block is 6 weeks with a deload at week 6"* is a dose claim about deload frequency |
| 5.8 | `deload_week: DELOAD_WEEK` | **Stays `unknown`**, same reason — it waits on [013](013-cycle-deload-grounding.md) |

So at least two of the nine must keep their current state, and three more are
genuine calls. That is why this is a pass and not a substitution.

## Which read does this sharpen?

None — it is the gate's bookkeeping, same as its parent. Doctrine §4.5 does not
apply: no number claiming physiological meaning is written or changed. Every
value in the app stays exactly as it is; only the label on the row moves.

## Out of scope

- Changing any value, or running the science scout on anything.
- The `†` marker itself. Once a row carries a real state the marker is
  redundant, but removing it would rewrite rows this brief decides to leave
  alone. Retire it only if every dagger row resolves.

## Acceptance

- [ ] Every row currently reading `unknown †` has been judged: either
  `n/a — definitional` with a one-line reason, or left `unknown` with the reason
  it is arguable.
- [ ] 5.7 and 5.8 still read `unknown` — the deload dose is a claim, and
  [013](013-cycle-deload-grounding.md) still owns it.
- [ ] The footnote explaining `†` matches what the rows now say.
- [ ] No verdict outside the four the scout returns plus this one inventory
  state has been invented.
