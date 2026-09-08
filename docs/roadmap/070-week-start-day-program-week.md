# Roadmap: The program week ignores "Week starts on"

**Label:** backlog
**Status:** backlog — needs Peter's decision between the two shapes below.
Found on the way through [048](048-simplification-candidates.md); filed
2026-09-08 with the stored-key problem that 048 had not spotted.

## The failure

Profile has a control that says **"Week starts on — Sunday / Monday"**. Four
places in the program path ignore it and hard-code Monday:

| Where | What it decides |
|---|---|
| `store/app.ts`, `toggleWeekVariant` | which week a base ⇄ variant choice is *saved* under |
| `lib/db/program.ts`, the `weekStartDate` default parameter | which week's overrides are *loaded* |
| `ProgramTab.tsx`, its `weekStart` | which days show as already done this week |
| `weights/TodaysPlan.tsx`, its `weekStart` | the same, on the Weights tab |

All four call `startOfWeek(today())` and take the helper's `'monday'` default.
Four other screens — Mobility's weekly stretch minutes, the Recovery sheet,
Cardio's roll-up and the sport record — pass the preference through properly.

So for anyone who picks **Sunday**, the app shows two different weeks at the
same time. On a Sunday, Mobility's weekly minutes have reset to zero while the
Weights tab still counts Sunday as the tail of the old week, and the base ⇄
variant choice made that morning is filed under a Monday six days back.

**Today this costs nothing.** The stored preference is `monday`, which is what
Peter wants (Europe, ISO weeks), so every site agrees by accident. It becomes
real the moment the preference is flipped — and it becomes unavoidable under
the [general-use objective](003-rls-auth-v1.1.md), when someone whose
week starts on Sunday opens the app.

## Why "just thread the preference through" is the wrong fix

`week_start_date` is not a display value. It is **half of a stored database
key**: `program_week_overrides` is upserted on
`(user_program_id, week_start_date, day_of_week)`.

Flip the preference from Monday to Sunday on a Wednesday and
`startOfWeek(today())` starts returning a date three days earlier. Every
override row written that week is still keyed on the Monday, so they stop being
found — the week's variant choices silently vanish from the screen and the next
toggle writes a second, parallel row for the same real week. Flip back and the
first set reappears. A preference that rewrites the key of already-written rows
is a data bug wearing a settings control.

Fixing *that* properly means storing the week as something a preference cannot
move — an ISO year-week string, or a program-relative week index — and
migrating the existing rows. That is a real piece of work, and it buys a
configurable program week that nobody has asked for.

## The two shapes

**A — Make the control honest (recommended).** The program week is Monday, by
design, because it is a stored key and because a training week is an ISO week.
Say so: relabel the Profile control so it names what it actually governs
(weekly totals and chart grouping), and leave the four sites alone with a
comment saying the program week is deliberately ISO. Small, no migration, no
data risk.

**B — Make the program week configurable.** Store the week as a
preference-independent key, migrate `program_week_overrides`, thread the
preference through all four sites, and check the change against a real week's
overrides. Bigger, and it needs its own migration under
[024](024-staging-shared-database-safety.md).

A is the recommendation. B is only worth it if a user's week genuinely starting
on Sunday should move their *training* week too — and that is a training
question, not a formatting one: a 6-week cycle counted from a program's own
`startDate` does not care which day a calendar week begins.

## Out of scope

- The 6-week cycle and deload placement. Those count days from the program's
  `startDate` and never touch `startOfWeek`.
- The four screens that already honour the preference. They are correct either
  way.

## Doctrine checklist

1. **Which read does this sharpen?** The Program and Weights reads — whether
   "done this week" and "this week's variant" mean the same week the rest of
   the app means.
2. **What does it let me stop doing?** Under A, wondering what a preference
   applies to. Under B, nothing — it adds a dimension.
3. **Input or destination?** Input.
4. **Honest shape?** The point of the brief: one word, "week", currently names
   two different spans.
5. **Physiological number?** No.

## Acceptance

Decide A or B first; then, under **A**:

- [ ] The Profile control names what it governs, and does not imply it moves
      the program week
- [ ] The four program-path sites carry a one-line comment saying the program
      week is ISO on purpose, pointing here
- [ ] Flipping the preference to Sunday and back leaves this week's variant
      choices exactly as they were

Under **B**, replace those with:

- [ ] `program_week_overrides` is keyed on something a preference cannot
      move, migrated in a tracked migration
- [ ] All four sites read the preference
- [ ] Flipping the preference mid-week keeps the week's overrides visible and
      writes no duplicate row
