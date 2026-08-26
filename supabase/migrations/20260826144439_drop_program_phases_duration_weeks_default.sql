-- `program_phases.duration_weeks` defaulted to 4, contradicting CYCLE = 6 in
-- src/constants/app.ts. Nothing reads the column for logic and the app always
-- supplies it explicitly, so an insert that omits it was silently asserting a
-- 4-week phase. Drop the default: a missing value is now NULL, which the
-- `ProgramPhase.durationWeeks: number | null` type already allows.
-- See docs/grounding-inventory.md §5 (row 5.10).
ALTER TABLE program_phases ALTER COLUMN duration_weeks DROP DEFAULT;
