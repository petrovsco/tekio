// Executes confirmed tool calls against the app. Nothing here runs until the
// user confirms a proposal. Every write reuses the app's existing store/db
// actions, so the assistant stays consistent with manual edits. The model works
// in names; this layer resolves names -> ids (case-insensitive) and reports a
// clear error back when something can't be found.
import { useAppStore } from '../../store/app'
import { createExercise, createMuscleGroup, upsertExerciseMuscle, deleteExerciseMuscle } from '../db/muscles'
import type {
  BodyRegion, Habit, HabitCadence, HabitAutoSource, MuscleContribution,
  ActiveProgram, ProgramDay, TrainingTag,
} from '../../types'
import type { ToolCall, ToolResult } from './types'

// ── arg readers ──────────────────────────────────────────────────────────────
type Args = Record<string, unknown>
const str = (a: Args, k: string): string | undefined =>
  typeof a[k] === 'string' && (a[k] as string).trim() !== '' ? (a[k] as string).trim() : undefined
const num = (a: Args, k: string): number | undefined => {
  if (typeof a[k] === 'number') return a[k] as number
  if (typeof a[k] === 'string' && a[k] !== '' && !isNaN(Number(a[k]))) return Number(a[k])
  return undefined
}
const bool = (a: Args, k: string): boolean | undefined =>
  typeof a[k] === 'boolean' ? (a[k] as boolean) : undefined
const clampLevel = (n: number | undefined, dflt: 1 | 2 | 3): 1 | 2 | 3 =>
  (n === 1 || n === 2 || n === 3 ? n : dflt)

// The DB has CHECK constraints on these; the model can emit anything, so
// whitelist to a valid value (falling back to `dflt`) before writing.
const CADENCES = ['daily', 'weekly', 'monthly'] as const
const AUTO_SOURCES = ['none', 'weight_sets', 'mobility_minutes', 'water', 'cardio_sessions'] as const
const CONTRIBUTIONS = ['stimulus', 'recovery'] as const
const REGIONS = ['upper', 'lower', 'core', 'full_body'] as const
const oneOf = <T extends string>(v: string | undefined, allowed: readonly T[], dflt: T): T =>
  (v !== undefined && (allowed as readonly string[]).includes(v) ? (v as T) : dflt)

const ok = (name: string, summary: string): ToolResult => ({ name, ok: true, summary })
const fail = (name: string, summary: string): ToolResult => ({ name, ok: false, summary })

// ── resolvers (read live store state each call) ──────────────────────────────
function muscleIdByName(name: string): string | undefined {
  return useAppStore.getState().muscleGroups.find(g => g.name.toLowerCase() === name.toLowerCase())?.id
}
function exerciseIdByName(name: string): string | undefined {
  const names = useAppStore.getState().exerciseNames
  return Object.entries(names).find(([, n]) => n.toLowerCase() === name.toLowerCase())?.[0]
}
function exerciseExists(name: string): boolean {
  return Object.values(useAppStore.getState().exerciseNames).some(n => n.toLowerCase() === name.toLowerCase())
}
function findProgram(a: Args): { program?: ActiveProgram; error?: string } {
  const progs = useAppStore.getState().programs
  if (progs.length === 0) return { error: 'There is no active program.' }
  const pname = str(a, 'program')
  if (pname) {
    const p = progs.find(p => p.name.toLowerCase() === pname.toLowerCase())
    return p ? { program: p } : { error: `Program "${pname}" not found.` }
  }
  if (progs.length === 1) return { program: progs[0] }
  return { error: 'Multiple active programs — specify which one.' }
}
const dayByName = (p: ActiveProgram, name: string): ProgramDay | undefined =>
  p.days.find(d => d.name.toLowerCase() === name.toLowerCase())

// ── program day mutation (operates on a structuredClone; day objects are shared
//    between program.days and program.phases[].days, and clone preserves that) ──
function addExerciseToDay(
  day: ProgramDay,
  name: string,
  position: number | undefined,
  presc: { setsText?: string; repsText?: string; weightText?: string; notes?: string },
): void {
  if (day.blocks && day.blocks.length) {
    const block = day.blocks.find(b => b.blockType === 'weight') ?? day.blocks[0]
    const at = position != null && position >= 0 && position <= block.exercises.length ? position : block.exercises.length
    block.exercises.splice(at, 0, {
      exercise: name, trainingTag: 'STRENGTH' as TrainingTag, sortOrder: 0,
      setsText: presc.setsText, repsText: presc.repsText, weightText: presc.weightText, notes: presc.notes,
    })
    block.exercises.forEach((e, i) => (e.sortOrder = i))
  } else {
    const at = position != null && position >= 0 && position <= day.exercises.length ? position : day.exercises.length
    day.exercises.splice(at, 0, name)
  }
}

/** Rename or remove an exercise across a day's blocks (or flat list) + supersets. */
function editExerciseInDay(day: ProgramDay, oldName: string, newName: string | null): boolean {
  const lc = oldName.toLowerCase()
  let hit = false
  const fixPairs = (pairs: [string, string][]): [string, string][] => {
    if (newName === null) return pairs.filter(([a, b]) => a.toLowerCase() !== lc && b.toLowerCase() !== lc)
    return pairs.map(([a, b]) => [a.toLowerCase() === lc ? newName : a, b.toLowerCase() === lc ? newName : b] as [string, string])
  }
  if (day.blocks && day.blocks.length) {
    for (const block of day.blocks) {
      const before = block.exercises.length
      if (newName === null) {
        block.exercises = block.exercises.filter(e => e.exercise.toLowerCase() !== lc)
        if (block.exercises.length !== before) hit = true
      } else {
        block.exercises.forEach(e => { if (e.exercise.toLowerCase() === lc) { e.exercise = newName; hit = true } })
      }
      block.exercises.forEach((e, i) => (e.sortOrder = i))
      block.supersets = fixPairs(block.supersets)
    }
  } else {
    const before = day.exercises.length
    if (newName === null) day.exercises = day.exercises.filter(e => e.toLowerCase() !== lc)
    else day.exercises = day.exercises.map(e => (e.toLowerCase() === lc ? newName : e))
    if (newName === null ? day.exercises.length !== before : day.exercises.some(e => e === newName)) hit = true
  }
  day.supersets = fixPairs(day.supersets)
  return hit
}

// ── describe (for the confirmation card; uses args only, no writes) ──────────
export function describeToolCall(call: ToolCall): string {
  const a = call.args
  const q = (k: string) => str(a, k) ?? '?'
  switch (call.name) {
    case 'create_habit': {
      const bits = [str(a, 'cadence') ?? 'daily', `target ${num(a, 'targetCount') ?? 1}${str(a, 'unit') ? ' ' + str(a, 'unit') : ''}`]
      const link = str(a, 'muscleGroup') ? ` → ${str(a, 'muscleGroup')}` : str(a, 'exercise') ? ` → ${str(a, 'exercise')}` : ''
      return `Add habit "${q('name')}" ${str(a, 'icon') ?? ''} (${bits.join(', ')})${link}`.replace(/\s+/g, ' ').trim()
    }
    case 'update_habit': return `Update habit "${q('habit')}"`
    case 'delete_habit': return `Delete habit "${q('habit')}"`
    case 'create_exercise': return `Add exercise "${q('name')}"`
    case 'map_exercise_to_muscle':
      return `Map ${q('exercise')} → ${q('muscleGroup')} (L${num(a, 'level') ?? 1}, ${str(a, 'contribution') ?? 'stimulus'})`
    case 'unmap_exercise_from_muscle': return `Unmap ${q('exercise')} from ${q('muscleGroup')}`
    case 'create_muscle_group': return `Add muscle group "${q('name')}" (${q('bodyRegion')}${str(a, 'parent') ? `, under ${str(a, 'parent')}` : ''})`
    case 'add_program_exercise': return `${str(a, 'program') ? str(a, 'program') + ' / ' : ''}${q('day')}: add ${q('exercise')}`
    case 'replace_program_exercise': return `${str(a, 'program') ? str(a, 'program') + ' / ' : ''}${q('day')}: replace ${q('oldExercise')} with ${q('newExercise')}`
    case 'remove_program_exercise': return `${str(a, 'program') ? str(a, 'program') + ' / ' : ''}${q('day')}: remove ${q('exercise')}`
    default: return `${call.name}`
  }
}

// ── execute ──────────────────────────────────────────────────────────────────
export async function executeToolCall(call: ToolCall): Promise<ToolResult> {
  const a = call.args
  const store = useAppStore.getState()
  try {
    switch (call.name) {
      case 'create_habit': {
        const name = str(a, 'name')
        if (!name) return fail(call.name, 'Habit name is required.')
        let muscleGroupId: string | null = null
        const mg = str(a, 'muscleGroup')
        if (mg) {
          const id = muscleIdByName(mg)
          if (!id) return fail(call.name, `Muscle group "${mg}" not found.`)
          muscleGroupId = id
        }
        let exerciseId: string | null = null
        const ex = str(a, 'exercise')
        if (ex) {
          const id = exerciseIdByName(ex)
          if (!id) return fail(call.name, `Exercise "${ex}" not found.`)
          exerciseId = id
        }
        const maxSort = store.habits.reduce((m, h) => Math.max(m, h.sortOrder), 0)
        const habit: Omit<Habit, 'id'> = {
          name,
          icon: str(a, 'icon') ?? null,
          cadence: oneOf<HabitCadence>(str(a, 'cadence'), CADENCES, 'daily'),
          targetCount: num(a, 'targetCount') ?? 1,
          unit: str(a, 'unit') ?? null,
          muscleGroupId,
          exerciseId,
          autoSource: oneOf<HabitAutoSource>(str(a, 'autoSource'), AUTO_SOURCES, 'none'),
          countLevel: clampLevel(num(a, 'countLevel'), 1),
          contribution: oneOf<MuscleContribution>(str(a, 'contribution'), CONTRIBUTIONS, 'stimulus'),
          singleTick: bool(a, 'singleTick') ?? true,
          active: true,
          sortOrder: maxSort + 1,
          notes: str(a, 'notes') ?? null,
        }
        await store.addHabit(habit)
        return ok(call.name, `Added habit "${name}".`)
      }

      case 'update_habit': {
        const hName = str(a, 'habit')
        if (!hName) return fail(call.name, 'Which habit? (name required)')
        const habit = store.habits.find(h => h.name.toLowerCase() === hName.toLowerCase())
        if (!habit) return fail(call.name, `Habit "${hName}" not found.`)
        const { id, ...rest } = habit
        const patch: Omit<Habit, 'id'> = { ...rest }
        if (str(a, 'name')) patch.name = str(a, 'name')!
        if (str(a, 'icon')) patch.icon = str(a, 'icon')!
        if (str(a, 'cadence')) patch.cadence = oneOf<HabitCadence>(str(a, 'cadence'), CADENCES, habit.cadence)
        if (num(a, 'targetCount') != null) patch.targetCount = num(a, 'targetCount')!
        if (str(a, 'unit')) patch.unit = str(a, 'unit')!
        if (str(a, 'autoSource')) patch.autoSource = oneOf<HabitAutoSource>(str(a, 'autoSource'), AUTO_SOURCES, habit.autoSource)
        if (num(a, 'countLevel') != null) patch.countLevel = clampLevel(num(a, 'countLevel'), habit.countLevel)
        if (str(a, 'contribution')) patch.contribution = oneOf<MuscleContribution>(str(a, 'contribution'), CONTRIBUTIONS, habit.contribution)
        if (bool(a, 'singleTick') != null) patch.singleTick = bool(a, 'singleTick')!
        if (str(a, 'notes')) patch.notes = str(a, 'notes')!
        if (bool(a, 'active') != null) patch.active = bool(a, 'active')!
        const mg = str(a, 'muscleGroup')
        if (mg) {
          const gid = muscleIdByName(mg)
          if (!gid) return fail(call.name, `Muscle group "${mg}" not found.`)
          patch.muscleGroupId = gid
          patch.exerciseId = null
        }
        const ex = str(a, 'exercise')
        if (ex) {
          const eid = exerciseIdByName(ex)
          if (!eid) return fail(call.name, `Exercise "${ex}" not found.`)
          patch.exerciseId = eid
          patch.muscleGroupId = null
        }
        await store.editHabit(id, patch)
        return ok(call.name, `Updated habit "${patch.name}".`)
      }

      case 'delete_habit': {
        const hName = str(a, 'habit')
        if (!hName) return fail(call.name, 'Which habit? (name required)')
        const habit = store.habits.find(h => h.name.toLowerCase() === hName.toLowerCase())
        if (!habit) return fail(call.name, `Habit "${hName}" not found.`)
        await store.removeHabit(habit.id)
        return ok(call.name, `Deleted habit "${habit.name}".`)
      }

      case 'create_exercise': {
        const name = str(a, 'name')
        if (!name) return fail(call.name, 'Exercise name is required.')
        if (exerciseExists(name)) return ok(call.name, `Exercise "${name}" already exists.`)
        await createExercise(name)
        await store.reloadMuscleData()
        return ok(call.name, `Created exercise "${name}".`)
      }

      case 'map_exercise_to_muscle': {
        const ex = str(a, 'exercise'); const mg = str(a, 'muscleGroup')
        if (!ex || !mg) return fail(call.name, 'exercise and muscleGroup are required.')
        const exerciseId = exerciseIdByName(ex)
        if (!exerciseId) return fail(call.name, `Exercise "${ex}" not found (create it first).`)
        const muscleGroupId = muscleIdByName(mg)
        if (!muscleGroupId) return fail(call.name, `Muscle group "${mg}" not found.`)
        await upsertExerciseMuscle({
          exerciseId, muscleGroupId,
          level: clampLevel(num(a, 'level'), 1),
          contribution: oneOf<MuscleContribution>(str(a, 'contribution'), CONTRIBUTIONS, 'stimulus'),
        })
        await store.reloadMuscleData()
        return ok(call.name, `Mapped ${ex} → ${mg}.`)
      }

      case 'unmap_exercise_from_muscle': {
        const ex = str(a, 'exercise'); const mg = str(a, 'muscleGroup')
        if (!ex || !mg) return fail(call.name, 'exercise and muscleGroup are required.')
        const exerciseId = exerciseIdByName(ex)
        const muscleGroupId = mg ? muscleIdByName(mg) : undefined
        if (!exerciseId || !muscleGroupId) return fail(call.name, 'Exercise or muscle group not found.')
        await deleteExerciseMuscle(exerciseId, muscleGroupId)
        await store.reloadMuscleData()
        return ok(call.name, `Unmapped ${ex} from ${mg}.`)
      }

      case 'create_muscle_group': {
        const name = str(a, 'name'); const region = str(a, 'bodyRegion')
        if (!name || !region) return fail(call.name, 'name and bodyRegion are required.')
        if (!(REGIONS as readonly string[]).includes(region))
          return fail(call.name, `bodyRegion must be one of ${REGIONS.join(', ')}.`)
        if (muscleIdByName(name)) return ok(call.name, `Muscle group "${name}" already exists.`)
        let parentId: string | null = null
        const parent = str(a, 'parent')
        if (parent) {
          const pid = muscleIdByName(parent)
          if (!pid) return fail(call.name, `Parent muscle group "${parent}" not found.`)
          parentId = pid
        }
        await createMuscleGroup(name, region as BodyRegion, parentId)
        await store.reloadMuscleData()
        return ok(call.name, `Created muscle group "${name}".`)
      }

      case 'add_program_exercise': {
        const { program, error } = findProgram(a)
        if (error || !program) return fail(call.name, error!)
        const dayName = str(a, 'day'); const exName = str(a, 'exercise')
        if (!dayName || !exName) return fail(call.name, 'day and exercise are required.')
        const clone = structuredClone(program)
        const day = dayByName(clone, dayName)
        if (!day) return fail(call.name, `Day "${dayName}" not found in ${program.name}.`)
        addExerciseToDay(day, exName, num(a, 'position'), {
          setsText: str(a, 'setsText'), repsText: str(a, 'repsText'), weightText: str(a, 'weightText'), notes: str(a, 'notes'),
        })
        await store.saveActiveProgram(clone, clone.programId, clone.userProgramId)
        return ok(call.name, `Added ${exName} to ${day.name}.`)
      }

      case 'replace_program_exercise': {
        const { program, error } = findProgram(a)
        if (error || !program) return fail(call.name, error!)
        const dayName = str(a, 'day'); const oldEx = str(a, 'oldExercise'); const newEx = str(a, 'newExercise')
        if (!dayName || !oldEx || !newEx) return fail(call.name, 'day, oldExercise and newExercise are required.')
        const clone = structuredClone(program)
        const day = dayByName(clone, dayName)
        if (!day) return fail(call.name, `Day "${dayName}" not found in ${program.name}.`)
        if (!editExerciseInDay(day, oldEx, newEx)) return fail(call.name, `"${oldEx}" not found in ${day.name}.`)
        await store.saveActiveProgram(clone, clone.programId, clone.userProgramId)
        return ok(call.name, `Replaced ${oldEx} with ${newEx} in ${day.name}.`)
      }

      case 'remove_program_exercise': {
        const { program, error } = findProgram(a)
        if (error || !program) return fail(call.name, error!)
        const dayName = str(a, 'day'); const exName = str(a, 'exercise')
        if (!dayName || !exName) return fail(call.name, 'day and exercise are required.')
        const clone = structuredClone(program)
        const day = dayByName(clone, dayName)
        if (!day) return fail(call.name, `Day "${dayName}" not found in ${program.name}.`)
        if (!editExerciseInDay(day, exName, null)) return fail(call.name, `"${exName}" not found in ${day.name}.`)
        await store.saveActiveProgram(clone, clone.programId, clone.userProgramId)
        return ok(call.name, `Removed ${exName} from ${day.name}.`)
      }

      default:
        return fail(call.name, `Unknown action "${call.name}".`)
    }
  } catch (e) {
    return fail(call.name, e instanceof Error ? e.message : String(e))
  }
}
