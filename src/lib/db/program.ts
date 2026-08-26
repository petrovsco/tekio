import { supabase } from '../supabase'
import { USER_ID, CYCLE, DELOAD_WEEK, DELOAD_REP_FACTOR } from '../../constants/app'
import { startOfWeek, today } from '../utils'
import type {
  Program, ProgramDay, ProgramPhase, ProgramDayBlock, ProgramDayExercisePrescription,
  ActiveProgram, ProgramCycle, ProgramWeekOverride, DayOfWeek, TrainingTag,
} from '../../types'

export async function getOrCreateExercise(name: string): Promise<string> {
  await supabase
    .from('exercises')
    .upsert({ user_id: USER_ID, name, is_system: false }, { onConflict: 'user_id,name' })
  const { data, error } = await supabase
    .from('exercises')
    .select('id')
    .eq('user_id', USER_ID)
    .eq('name', name)
    .single()
  if (error) throw error
  return data.id
}

interface ProgramShape {
  phases: ProgramPhase[]
  days: ProgramDay[]
}

async function loadPhasesForPrograms(programIds: string[]): Promise<Map<string, ProgramShape>> {
  const result = new Map<string, ProgramShape>()
  if (programIds.length === 0) return result

  const { data: phaseRows, error: phaseErr } = await supabase
    .from('program_phases')
    .select('id, program_id, name, sort_order, duration_weeks, goal')
    .in('program_id', programIds)
    .order('sort_order')
  if (phaseErr) throw phaseErr

  const { data: dayRows, error: dayErr } = await supabase
    .from('program_days')
    .select('id, program_id, phase_id, name, sort_order, day_of_week, queue_order, is_variant, variant_group_key')
    .in('program_id', programIds)
    .order('sort_order')
  if (dayErr) throw dayErr

  const dayIds = (dayRows ?? []).map(d => d.id)

  const blockRowsByDay = new Map<string, { id: string; name: string; block_type: string; scheduled_time: string | null; duration_minutes: number | null; notes: string | null; sort_order: number }[]>()
  const exRowsByDay = new Map<string, { id: string; block_id: string | null; sort_order: number; notes: string | null; training_tag: string | null; duration_text: string | null; tempo: string | null; sets_text: string | null; reps_text: string | null; weight_text: string | null; name: string }[]>()
  const ssRowsByDay = new Map<string, { exercise_a_id: string; exercise_b_id: string }[]>()

  if (dayIds.length > 0) {
    const { data: blocks, error: blockErr } = await supabase
      .from('program_day_blocks')
      .select('id, program_day_id, name, block_type, scheduled_time, duration_minutes, notes, sort_order')
      .in('program_day_id', dayIds)
      .order('sort_order')
    if (blockErr) throw blockErr
    for (const b of blocks ?? []) {
      const arr = blockRowsByDay.get(b.program_day_id) ?? []
      arr.push(b)
      blockRowsByDay.set(b.program_day_id, arr)
    }

    const { data: exercises, error: exErr } = await supabase
      .from('program_day_exercises')
      .select('id, program_day_id, block_id, sort_order, notes, training_tag, duration_text, tempo, sets_text, reps_text, weight_text, exercises(name)')
      .in('program_day_id', dayIds)
      .order('sort_order')
    if (exErr) throw exErr
    for (const e of exercises ?? []) {
      const name = (e.exercises as unknown as { name: string } | null)?.name ?? ''
      const arr = exRowsByDay.get(e.program_day_id) ?? []
      arr.push({ ...e, name })
      exRowsByDay.set(e.program_day_id, arr)
    }

    const { data: supersets, error: ssErr } = await supabase
      .from('program_supersets')
      .select('program_day_id, exercise_a_id, exercise_b_id')
      .in('program_day_id', dayIds)
    if (ssErr) throw ssErr
    for (const ss of supersets ?? []) {
      const arr = ssRowsByDay.get(ss.program_day_id) ?? []
      arr.push(ss)
      ssRowsByDay.set(ss.program_day_id, arr)
    }
  }

  const namePairsForDay = (dayId: string, exIds: Set<string>, exById: Map<string, string>): [string, string][] =>
    (ssRowsByDay.get(dayId) ?? [])
      .filter(ss => exIds.has(ss.exercise_a_id) && exIds.has(ss.exercise_b_id))
      .map(ss => [exById.get(ss.exercise_a_id) ?? '', exById.get(ss.exercise_b_id) ?? ''] as [string, string])

  const daysByProgram = new Map<string, typeof dayRows>()
  for (const d of dayRows ?? []) {
    const arr = daysByProgram.get(d.program_id) ?? []
    arr.push(d)
    daysByProgram.set(d.program_id, arr)
  }

  const phasesByProgram = new Map<string, typeof phaseRows>()
  for (const p of phaseRows ?? []) {
    const arr = phasesByProgram.get(p.program_id) ?? []
    arr.push(p)
    phasesByProgram.set(p.program_id, arr)
  }

  for (const programId of programIds) {
    const days = (daysByProgram.get(programId) ?? []) as NonNullable<typeof dayRows>
    const phases = (phasesByProgram.get(programId) ?? []) as NonNullable<typeof phaseRows>

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

      const legacyExRows = exRows.filter(e => e.block_id === null)
      let flatExercises: string[]
      let flatSupersets: [string, string][]
      if (legacyExRows.length > 0) {
        flatExercises = legacyExRows.map(e => e.name)
        flatSupersets = namePairsForDay(d.id, new Set(legacyExRows.map(e => e.id)), exById)
      } else {
        const weightBlocks = blocks.filter(b => b.blockType === 'weight')
        flatExercises = weightBlocks.flatMap(b => b.exercises.map(e => e.exercise))
        flatSupersets = weightBlocks.flatMap(b => b.supersets)
      }

      builtDays.set(d.id, {
        id: d.id,
        name: d.name,
        exercises: flatExercises,
        supersets: flatSupersets,
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

async function loadProgramRows(status: 'active' | 'paused'): Promise<ActiveProgram[]> {
  const { data: ups, error: upErr } = await supabase
    .from('user_programs')
    .select('id, start_date, current_day_index, last_advanced_date, program_id, current_phase_id, deload_committed_date')
    .eq('user_id', USER_ID)
    .eq('status', status)
  if (upErr) throw upErr
  if (!ups || ups.length === 0) return []

  const programIds = ups.map(u => u.program_id)

  const { data: progs, error: progErr } = await supabase
    .from('programs')
    .select('id, name, weekly_principles')
    .in('id', programIds)
  if (progErr) throw progErr

  const shapeByProgram = await loadPhasesForPrograms(programIds)
  const progMap = new Map((progs ?? []).map(p => [p.id, p]))

  return ups.map(up => {
    const prog = progMap.get(up.program_id)!
    const shape = shapeByProgram.get(up.program_id) ?? { phases: [], days: [] }
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
}

export async function loadActivePrograms(): Promise<ActiveProgram[]> {
  return loadProgramRows('active')
}

export async function loadPausedPrograms(): Promise<ActiveProgram[]> {
  return loadProgramRows('paused')
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
      .insert({
        user_id: USER_ID,
        name: program.name,
        cycle_length_weeks: CYCLE,
        deload_week: DELOAD_WEEK,
        deload_strategy: { type: 'reps', factor: DELOAD_REP_FACTOR },
        weekly_principles: program.weeklyPrinciples ?? null,
      })
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
      .insert({
        user_id: USER_ID,
        program_id: programId,
        start_date: program.startDate,
        current_day_index: program.currentDayIndex ?? 0,
        last_advanced_date: program.lastAdvancedDate ?? program.startDate,
        current_phase_id: firstPhaseId,
        status: 'active',
      })
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

/** Loads variant toggles for the given week (defaults to the current week). */
export async function loadWeekOverrides(
  weekStartDate: string = startOfWeek(today()),
): Promise<ProgramWeekOverride[]> {
  const { data: ups, error: upErr } = await supabase
    .from('user_programs')
    .select('id')
    .eq('user_id', USER_ID)
  if (upErr) throw upErr
  if (!ups || ups.length === 0) return []

  const { data, error } = await supabase
    .from('program_week_overrides')
    .select('user_program_id, week_start_date, day_of_week, variant_active')
    .in('user_program_id', ups.map(u => u.id))
    .eq('week_start_date', weekStartDate)
  if (error) throw error

  return (data ?? []).map(o => ({
    userProgramId: o.user_program_id,
    weekStartDate: o.week_start_date,
    dayOfWeek: o.day_of_week as DayOfWeek,
    variantActive: o.variant_active,
  }))
}

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
    const elapsedDays = Math.max(
      0,
      Math.floor((new Date(startDate).getTime() - new Date(openCycle.startDate).getTime()) / 86400000)
    )
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

export async function loadProgramCycles(): Promise<ProgramCycle[]> {
  const { data: ups, error: upErr } = await supabase
    .from('user_programs')
    .select('id, program_id')
    .eq('user_id', USER_ID)
  if (upErr) throw upErr
  if (!ups || ups.length === 0) return []

  const userProgramIds = ups.map(u => u.id)
  const programIds = [...new Set(ups.map(u => u.program_id))]

  const { data: cycles, error: cycErr } = await supabase
    .from('program_cycles')
    .select('id, user_program_id, cycle_number, start_date, end_date, status')
    .in('user_program_id', userProgramIds)
    .order('cycle_number', { ascending: false })
  if (cycErr) throw cycErr
  if (!cycles || cycles.length === 0) return []

  const { data: progs, error: progErr } = await supabase
    .from('programs')
    .select('id, name')
    .in('id', programIds)
  if (progErr) throw progErr

  const shapeByProgram = await loadPhasesForPrograms(programIds)
  const progMap = new Map((progs ?? []).map(p => [p.id, p]))
  const upToProgram = new Map(ups.map(u => [u.id, u.program_id]))

  return cycles
    .map(c => {
      const programId = upToProgram.get(c.user_program_id)!
      const prog = progMap.get(programId)!
      return {
        id: c.id,
        userProgramId: c.user_program_id,
        programId,
        programName: prog.name,
        cycleNumber: c.cycle_number,
        startDate: c.start_date,
        endDate: c.end_date,
        status: c.status as ProgramCycle['status'],
        days: shapeByProgram.get(programId)?.days ?? [],
      }
    })
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
}
