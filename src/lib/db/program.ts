import { supabase } from '../supabase'
import { USER_ID, CYCLE, DELOAD_WEEK, DELOAD_REP_FACTOR } from '../../constants/app'
import { startOfWeek, today, groupBy, daysBetween, deriveFlat, uniqSorted } from '../utils'
import { withOrigin } from '../env'
import { userRows } from './_rows'
import type {
  Program, ProgramDay, ProgramPhase, ProgramDayBlock, ProgramDayExercisePrescription,
  ActiveProgram, ProgramCycle, ProgramWeekOverride, DayOfWeek, TrainingTag,
} from '../../types'

// Re-exported rather than re-implemented: mobility imports it from here, and
// two copies of this function is how one write path keeps making twins after
// the other one is fixed (roadmap 044).
import { getOrCreateExercise } from './exercises'

/** The rows of a PostgREST query, or a throw. Every read in this file answered
 *  its error the same way, and the ones that do not depend on each other are
 *  easier to run together as expressions than as statement pairs. */
async function rows<T>(q: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

interface ProgramShape {
  phases: ProgramPhase[]
  days: ProgramDay[]
}

/** The blocks, exercises and superset pairs of a set of program days, each
 *  grouped by day. Extracted so the three row shapes are inferred from their
 *  own selects — declaring the maps up front meant re-typing all three by hand. */
async function fetchDayDetails(dayIds: string[]) {
  const [blocks, exercises, supersets] = await Promise.all([
    rows(supabase
      .from('program_day_blocks')
      .select('id, program_day_id, name, block_type, scheduled_time, duration_minutes, notes, sort_order')
      .in('program_day_id', dayIds)
      .order('sort_order')),
    rows(supabase
      .from('program_day_exercises')
      .select('id, program_day_id, block_id, sort_order, notes, training_tag, duration_text, tempo, sets_text, reps_text, weight_text, exercises(name)')
      .in('program_day_id', dayIds)
      .order('sort_order')),
    rows(supabase
      .from('program_supersets')
      .select('program_day_id, exercise_a_id, exercise_b_id')
      .in('program_day_id', dayIds)),
  ])

  return {
    blockRowsByDay: groupBy(blocks, b => b.program_day_id),
    exRowsByDay: groupBy(
      exercises.map(e => ({ ...e, name: (e.exercises as unknown as { name: string } | null)?.name ?? '' })),
      e => e.program_day_id,
    ),
    ssRowsByDay: groupBy(supersets, ss => ss.program_day_id),
  }
}

/** No days, so nothing to fetch and nothing that will read these. */
const noDayDetails = (): Awaited<ReturnType<typeof fetchDayDetails>> =>
  ({ blockRowsByDay: new Map(), exRowsByDay: new Map(), ssRowsByDay: new Map() })

async function loadPhasesForPrograms(programIds: string[]): Promise<Map<string, ProgramShape>> {
  const result = new Map<string, ProgramShape>()
  if (programIds.length === 0) return result

  const [phaseRows, dayRows] = await Promise.all([
    rows(supabase
      .from('program_phases')
      .select('id, program_id, name, sort_order, duration_weeks, goal')
      .in('program_id', programIds)
      .order('sort_order')),
    rows(supabase
      .from('program_days')
      .select('id, program_id, phase_id, name, sort_order, day_of_week, queue_order, is_variant, variant_group_key')
      .in('program_id', programIds)
      .order('sort_order')),
  ])

  const dayIds = dayRows.map(d => d.id)
  const { blockRowsByDay, exRowsByDay, ssRowsByDay } =
    dayIds.length > 0 ? await fetchDayDetails(dayIds) : noDayDetails()

  const namePairsForDay = (dayId: string, exIds: Set<string>, exById: Map<string, string>): [string, string][] =>
    (ssRowsByDay.get(dayId) ?? [])
      .filter(ss => exIds.has(ss.exercise_a_id) && exIds.has(ss.exercise_b_id))
      .map(ss => [exById.get(ss.exercise_a_id) ?? '', exById.get(ss.exercise_b_id) ?? ''] as [string, string])

  const daysByProgram = groupBy(dayRows, d => d.program_id)
  const phasesByProgram = groupBy(phaseRows, p => p.program_id)

  for (const programId of programIds) {
    const days = daysByProgram.get(programId) ?? []
    const phases = phasesByProgram.get(programId) ?? []

    const builtDays = new Map<string, ProgramDay>()
    for (const d of days) {
      const exRows = exRowsByDay.get(d.id) ?? []
      const blockRows = blockRowsByDay.get(d.id) ?? []
      const exById = new Map(exRows.map(e => [e.id, e.name]))

      const blocks: ProgramDayBlock[] = blockRows.map(b => {
        const blockExRows = exRows.filter(e => e.block_id === b.id)
        const blockExIds = new Set(blockExRows.map(e => e.id))
        const exercises: ProgramDayExercisePrescription[] = blockExRows.map(e => ({
          id: e.id,
          exercise: e.name,
          trainingTag: (e.training_tag ?? 'STRENGTH') as TrainingTag,
          sortOrder: e.sort_order,
          notes: e.notes ?? undefined,
          durationText: e.duration_text ?? undefined,
          tempo: e.tempo ?? undefined,
          setsText: e.sets_text ?? undefined,
          repsText: e.reps_text ?? undefined,
          weightText: e.weight_text ?? undefined,
        }))
        return {
          id: b.id,
          blockType: b.block_type as ProgramDayBlock['blockType'],
          name: b.name,
          scheduledTime: b.scheduled_time ?? undefined,
          durationMinutes: b.duration_minutes ?? undefined,
          notes: b.notes ?? undefined,
          sortOrder: b.sort_order,
          exercises,
          supersets: namePairsForDay(d.id, blockExIds, exById),
        }
      })

      // Days written before blocks existed keep their flat list; every other day
      // derives it from its weight blocks (the same read the editor and the JSON
      // importer use). The legacy branch is live — see roadmap 048.
      const legacyExRows = exRows.filter(e => e.block_id === null)
      const flat = legacyExRows.length > 0
        ? {
            exercises: legacyExRows.map(e => e.name),
            supersets: namePairsForDay(d.id, new Set(legacyExRows.map(e => e.id)), exById),
          }
        : deriveFlat(blocks)

      builtDays.set(d.id, {
        id: d.id,
        name: d.name,
        exercises: flat.exercises,
        supersets: flat.supersets,
        dayOfWeek: (d.day_of_week as DayOfWeek | null) ?? null,
        queueOrder: d.queue_order ?? null,
        isVariant: d.is_variant ?? false,
        variantGroupKey: d.variant_group_key ?? null,
        blocks,
      })
    }

    if (phases.length > 0) {
      const programPhases: ProgramPhase[] = phases.map(p => ({
        id: p.id,
        name: p.name,
        sortOrder: p.sort_order,
        durationWeeks: p.duration_weeks,
        goal: p.goal ?? 'general',
        days: days.filter(d => d.phase_id === p.id).map(d => builtDays.get(d.id)!),
      }))
      const flatDays = programPhases.flatMap(p => p.days)
      result.set(programId, { phases: programPhases, days: flatDays })
    } else {
      result.set(programId, { phases: [], days: days.map(d => builtDays.get(d.id)!) })
    }
  }

  return result
}

export interface ProgramData {
  active: ActiveProgram[]
  cycles: ProgramCycle[]
  overrides: ProgramWeekOverride[]
}

/**
 * Every program read the app makes, in one pass.
 *
 * Three loaders used to do this — the active programs, the cycle history, and
 * this week's variant toggles — and each one began by selecting `user_programs`
 * while two of them ended by rebuilding the same phase → day → block → exercise
 * tree. Bootstrap therefore asked for `user_programs` three times and built that
 * tree twice over overlapping ids. One select and one build now serve all three,
 * and the reads that do not depend on each other run together (roadmap 048
 * candidate A9).
 *
 * The tree is built only for the programs something will read it for: the active
 * ones, plus any paused one that still has a cycle in the history.
 */
export async function loadProgramData(
  weekStartDate: string = startOfWeek(today()),
): Promise<ProgramData> {
  const ups = await userRows(
    'user_programs',
    'id, status, program_id, start_date, current_day_index, last_advanced_date, current_phase_id, deload_committed_date',
  )
  if (ups.length === 0) return { active: [], cycles: [], overrides: [] }

  const upIds = ups.map(u => u.id)
  const [progRows, cycleRows, overrideRows] = await Promise.all([
    rows(supabase
      .from('programs')
      .select('id, name, weekly_principles')
      .in('id', uniqSorted(ups.map(u => u.program_id)))),
    rows(supabase
      .from('program_cycles')
      .select('id, user_program_id, cycle_number, start_date, end_date, status')
      .in('user_program_id', upIds)
      .order('cycle_number', { ascending: false })),
    rows(supabase
      .from('program_week_overrides')
      .select('user_program_id, week_start_date, day_of_week, variant_active')
      .in('user_program_id', upIds)
      .eq('week_start_date', weekStartDate)),
  ])

  const upById = new Map(ups.map(u => [u.id, u]))
  const activeUps = ups.filter(u => u.status === 'active')
  const programOf = (userProgramId: string) => upById.get(userProgramId)!.program_id

  const shapeByProgram = await loadPhasesForPrograms(uniqSorted([
    ...activeUps.map(u => u.program_id),
    ...cycleRows.map(c => programOf(c.user_program_id)),
  ]))
  const progMap = new Map(progRows.map(p => [p.id, p]))
  const shapeOf = (programId: string) => shapeByProgram.get(programId) ?? { phases: [], days: [] }

  const active: ActiveProgram[] = activeUps.map(up => {
    const prog = progMap.get(up.program_id)!
    const shape = shapeOf(up.program_id)
    return {
      programId: prog.id,
      userProgramId: up.id,
      name: prog.name,
      startDate: up.start_date,
      currentDayIndex: up.current_day_index,
      lastAdvancedDate: up.last_advanced_date ?? up.start_date,
      days: shape.days,
      phases: shape.phases,
      weeklyPrinciples: (prog.weekly_principles as Record<string, string | number> | null) ?? undefined,
      currentPhaseId: up.current_phase_id,
      deloadCommittedDate: up.deload_committed_date,
    }
  })

  const cycles: ProgramCycle[] = cycleRows
    .map(c => {
      const programId = programOf(c.user_program_id)
      return {
        id: c.id,
        userProgramId: c.user_program_id,
        programId,
        programName: progMap.get(programId)!.name,
        cycleNumber: c.cycle_number,
        startDate: c.start_date,
        endDate: c.end_date,
        status: c.status as ProgramCycle['status'],
        days: shapeOf(programId).days,
      }
    })
    .sort((a, b) => b.startDate.localeCompare(a.startDate))

  const overrides: ProgramWeekOverride[] = overrideRows.map(o => ({
    userProgramId: o.user_program_id,
    weekStartDate: o.week_start_date,
    dayOfWeek: o.day_of_week as DayOfWeek,
    variantActive: o.variant_active,
  }))

  return { active, cycles, overrides }
}

export async function saveProgram(
  program: Program,
  existingProgramId?: string,
  existingUserProgramId?: string
): Promise<ActiveProgram> {
  let programId = existingProgramId
  let userProgramId = existingUserProgramId

  if (programId) {
    await supabase
      .from('programs')
      .update({ name: program.name, weekly_principles: program.weeklyPrinciples ?? null })
      .eq('id', programId)
    await supabase.from('program_days').delete().eq('program_id', programId)
    await supabase.from('program_phases').delete().eq('program_id', programId)
  } else {
    const { data: prog, error: progErr } = await supabase
      .from('programs')
      .insert(withOrigin({
        user_id: USER_ID,
        name: program.name,
        cycle_length_weeks: CYCLE,
        deload_week: DELOAD_WEEK,
        deload_strategy: { type: 'reps', factor: DELOAD_REP_FACTOR },
        weekly_principles: program.weeklyPrinciples ?? null,
      }))
      .select('id')
      .single()
    if (progErr) throw progErr
    programId = prog.id
  }

  // Normalize to a phases[] structure: faithful when the program carries phases,
  // otherwise wrap the flat day list in a single "Main" phase.
  const phases: ProgramPhase[] = program.phases && program.phases.length > 0
    ? program.phases
    : [{ name: 'Main', sortOrder: 0, durationWeeks: CYCLE, goal: 'general', days: program.days }]

  let firstPhaseId: string | null = null
  for (const phase of [...phases].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const { data: phaseRow, error: phaseErr } = await supabase
      .from('program_phases')
      .insert({
        program_id: programId,
        name: phase.name,
        sort_order: phase.sortOrder,
        duration_weeks: phase.durationWeeks,
        goal: phase.goal ?? 'general',
      })
      .select('id')
      .single()
    if (phaseErr) throw phaseErr
    if (firstPhaseId === null) firstPhaseId = phaseRow.id

    for (let i = 0; i < phase.days.length; i++) {
      const day = phase.days[i]
      const { data: dayRow, error: dayErr } = await supabase
        .from('program_days')
        .insert({
          program_id: programId,
          phase_id: phaseRow.id,
          name: day.name,
          sort_order: i,
          day_of_week: day.dayOfWeek ?? null,
          queue_order: day.queueOrder ?? null,
          is_variant: day.isVariant ?? false,
          variant_group_key: day.variantGroupKey ?? null,
        })
        .select('id')
        .single()
      if (dayErr) throw dayErr

      await saveDayBlocks(dayRow.id, day)
    }
  }

  if (userProgramId) {
    await supabase
      .from('user_programs')
      .update({
        start_date: program.startDate,
        current_day_index: program.currentDayIndex,
        last_advanced_date: program.lastAdvancedDate,
        current_phase_id: firstPhaseId,
        status: 'active',
      })
      .eq('id', userProgramId)
  } else {
    const { data: up, error: upErr } = await supabase
      .from('user_programs')
      .insert(withOrigin({
        user_id: USER_ID,
        program_id: programId,
        start_date: program.startDate,
        current_day_index: program.currentDayIndex ?? 0,
        last_advanced_date: program.lastAdvancedDate ?? program.startDate,
        current_phase_id: firstPhaseId,
        status: 'active',
      }))
      .select('id')
      .single()
    if (upErr) throw upErr
    userProgramId = up.id

    await supabase.from('program_cycles').insert({
      user_program_id: userProgramId,
      cycle_number: 1,
      start_date: program.startDate,
      status: 'active',
    })
  }

  return { ...program, programId: programId!, userProgramId: userProgramId! }
}

/** Persists a day's blocks. Falls back to a single weight block built from the
 *  flat `exercises`/`supersets` for legacy days that carry no `blocks`. */
async function saveDayBlocks(dayId: string, day: ProgramDay): Promise<void> {
  const blocks: ProgramDayBlock[] = day.blocks && day.blocks.length > 0
    ? day.blocks
    : day.exercises.length > 0
      ? [{
          blockType: 'weight',
          name: day.name,
          sortOrder: 0,
          exercises: day.exercises.map((name, j) => ({
            exercise: name,
            trainingTag: 'STRENGTH',
            sortOrder: j,
          })),
          supersets: day.supersets,
        }]
      : []

  // sort_order is UNIQUE per (program_day_id) across all blocks, so it must
  // increase globally within the day rather than restart at 0 per block.
  let exerciseSortOffset = 0
  for (let bi = 0; bi < blocks.length; bi++) {
    exerciseSortOffset = await saveBlock(dayId, blocks[bi], bi, exerciseSortOffset)
  }
}

/** Inserts a block and its exercises/supersets. Returns the next free exercise sort_order. */
async function saveBlock(dayId: string, block: ProgramDayBlock, blockSortOrder: number, sortOffset: number): Promise<number> {
  const { data: blockRow, error: blockErr } = await supabase
    .from('program_day_blocks')
    .insert({
      program_day_id: dayId,
      name: block.name,
      block_type: block.blockType,
      scheduled_time: block.scheduledTime ?? null,
      duration_minutes: block.durationMinutes ?? null,
      notes: block.notes ?? null,
      sort_order: blockSortOrder,
    })
    .select('id')
    .single()
  if (blockErr) throw blockErr
  const blockId = blockRow.id

  if (block.exercises.length === 0) return sortOffset

  const exerciseIds = await Promise.all(block.exercises.map(e => getOrCreateExercise(e.exercise)))

  const { data: dayExRows, error: dexErr } = await supabase
    .from('program_day_exercises')
    .insert(block.exercises.map((e, j) => ({
      program_day_id: dayId,
      block_id: blockId,
      exercise_id: exerciseIds[j],
      sort_order: sortOffset + j,
      training_tag: e.trainingTag,
      notes: e.notes ?? null,
      duration_text: e.durationText ?? null,
      tempo: e.tempo ?? null,
      sets_text: e.setsText ?? null,
      reps_text: e.repsText ?? null,
      weight_text: e.weightText ?? null,
    })))
    .select('id, exercise_id')
  if (dexErr) throw dexErr

  const exIdToDayExId = new Map<string, string>()
  for (const row of dayExRows ?? []) {
    exIdToDayExId.set(row.exercise_id, row.id)
  }

  const ssRows = block.supersets
    .map(([nameA, nameB]) => {
      const idxA = block.exercises.findIndex(e => e.exercise === nameA)
      const idxB = block.exercises.findIndex(e => e.exercise === nameB)
      if (idxA === -1 || idxB === -1) return null
      const dayExIdA = exIdToDayExId.get(exerciseIds[idxA])
      const dayExIdB = exIdToDayExId.get(exerciseIds[idxB])
      if (!dayExIdA || !dayExIdB) return null
      return { program_day_id: dayId, exercise_a_id: dayExIdA, exercise_b_id: dayExIdB }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  if (ssRows.length > 0) {
    await supabase.from('program_supersets').insert(ssRows)
  }

  return sortOffset + block.exercises.length
}

// ── Per-week variant overrides ────────────────────────────────────────────────

/** Upserts a single weekday's variant toggle for a given week. */
export async function setWeekOverride(
  userProgramId: string,
  weekStartDate: string,
  dayOfWeek: DayOfWeek,
  variantActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('program_week_overrides')
    .upsert(
      { user_program_id: userProgramId, week_start_date: weekStartDate, day_of_week: dayOfWeek, variant_active: variantActive },
      { onConflict: 'user_program_id,week_start_date,day_of_week' },
    )
  if (error) throw error
}

export async function advanceProgram(
  userProgramId: string,
  newIndex: number,
  date: string
): Promise<void> {
  const { error } = await supabase
    .from('user_programs')
    .update({ current_day_index: newIndex, last_advanced_date: date })
    .eq('id', userProgramId)
  if (error) throw error
}

async function getOpenCycle(userProgramId: string): Promise<{ id: string; cycleNumber: number; startDate: string } | null> {
  const { data, error } = await supabase
    .from('program_cycles')
    .select('id, cycle_number, start_date')
    .eq('user_program_id', userProgramId)
    .is('end_date', null)
    .order('cycle_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { id: data.id, cycleNumber: data.cycle_number, startDate: data.start_date }
}

export async function pauseProgram(userProgramId: string): Promise<void> {
  const { error } = await supabase
    .from('user_programs')
    .update({ status: 'paused' })
    .eq('id', userProgramId)
  if (error) throw error

  const openCycle = await getOpenCycle(userProgramId)
  if (openCycle) {
    await supabase.from('program_cycles').update({ status: 'paused' }).eq('id', openCycle.id)
  }
}

export async function hardDeleteProgram(programId: string, userProgramId: string): Promise<void> {
  await supabase.from('user_programs').delete().eq('id', userProgramId)
  await supabase.from('programs').delete().eq('id', programId)
}

export async function restartProgram(userProgramId: string, startDate: string): Promise<void> {
  const openCycle = await getOpenCycle(userProgramId)
  if (openCycle) {
    const elapsedDays = Math.max(0, daysBetween(openCycle.startDate, startDate))
    const closingStatus = elapsedDays >= CYCLE * 7 ? 'completed' : 'abandoned'
    await supabase
      .from('program_cycles')
      .update({ end_date: startDate, status: closingStatus })
      .eq('id', openCycle.id)
  }

  await supabase.from('program_cycles').insert({
    user_program_id: userProgramId,
    cycle_number: (openCycle?.cycleNumber ?? 0) + 1,
    start_date: startDate,
    status: 'active',
  })

  const { error } = await supabase
    .from('user_programs')
    .update({
      start_date: startDate,
      current_day_index: 0,
      last_advanced_date: startDate,
      deload_committed_date: null,
      status: 'active',
    })
    .eq('id', userProgramId)
  if (error) throw error
}

export async function resumeProgram(userProgramId: string): Promise<void> {
  const { error } = await supabase
    .from('user_programs')
    .update({ status: 'active' })
    .eq('id', userProgramId)
  if (error) throw error

  const openCycle = await getOpenCycle(userProgramId)
  if (openCycle) {
    await supabase.from('program_cycles').update({ status: 'active' }).eq('id', openCycle.id)
  }
}
