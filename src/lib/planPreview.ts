import type { PlannedExercise, WeightEntry, ExerciseMuscleLink, ExerciseAlias, MuscleGroup } from '../types'
import { muscleStates, rankMuscleGaps, type MuscleState } from './fusedRead'
import { GAP_CUTOFF } from './adaptations'
import { normaliseExerciseName, resolveExerciseName } from './exerciseName'
import { catalogueEntryFor, linksFor } from '../constants/exerciseCatalogue'
import { today } from './utils'

// RFC 0098's layer: what today's plan would reach, and what would still be
// missing after it. A preview, never the read — Home's map, verdict and
// adaptations line keep reading logged work only. This is the one place a plan
// is turned into a would-be entry, by name, so that conversion stays visible.
// `/ground` Step 0: no constant, no new claim — the existing muscle read over
// rows that have not happened, the links the log would write.

export interface PlanPreview {
  /** Leaf muscles the open plan has a stimulus link to (level 1 or 2). */
  reached: Set<string>
  /** The gaps the read would rank if the plan were done as written. */
  gapsAfter: MuscleState[]
}

/** The links logging `name` would count: its own if it has been logged, else
 *  the ones a first log would write from the catalogue. `fresh` is only the
 *  catalogue's, so a caller can add them without counting a known lift twice. */
function linksForPlan(
  name: string, links: ExerciseMuscleLink[], aliases: ExerciseAlias[], groups: MuscleGroup[],
): { all: ExerciseMuscleLink[]; fresh: ExerciseMuscleLink[] } {
  const known = resolveExerciseName(name, [...new Set(links.map(l => l.exercise))], aliases)
  if (known) {
    return { all: links.filter(l => normaliseExerciseName(l.exercise) === normaliseExerciseName(known)), fresh: [] }
  }
  const fresh = catalogueLinks(name, groups)
  return { all: fresh, fresh }
}

function catalogueLinks(name: string, groups: MuscleGroup[]): ExerciseMuscleLink[] {
  const entry = catalogueEntryFor(name)
  if (!entry) return []
  const region = new Map(groups.map(g => [g.name, g.bodyRegion]))
  return Object.entries(linksFor(entry)).flatMap(([group, level]) => {
    const r = region.get(group)
    return r ? [{ exercise: name, group, region: r, level: level!, contribution: 'stimulus' as const }] : []
  })
}

export function planPreview(args: {
  plans: PlannedExercise[]
  weights: WeightEntry[]
  exerciseMuscles: ExerciseMuscleLink[]
  aliases: ExerciseAlias[]
  muscleGroups: MuscleGroup[]
  date?: string
}): PlanPreview | null {
  const { plans, weights, exerciseMuscles, aliases, muscleGroups, date = today() } = args
  const open = plans.filter(p => p.date === date && !p.loggedAs)
  if (open.length === 0) return null

  const planLinks = open.map(p => linksForPlan(p.exercise, exerciseMuscles, aliases, muscleGroups))
  const reached = new Set(
    planLinks.flatMap(l => l.all).filter(l => l.contribution === 'stimulus' && l.level < 3).map(l => l.group),
  )
  // A plan's targets as if done. A plan with no targets still reaches its
  // muscles above, but adds no sets here: nothing says how many.
  const wouldBe: WeightEntry[] = open.map(p => ({ id: `plan:${p.id}`, date, exercise: p.exercise, sets: p.targets }))
  const links = [...exerciseMuscles, ...planLinks.flatMap(l => l.fresh)]
  const after = muscleStates([...weights, ...wouldBe], links, muscleGroups, date)
  return { reached, gapsAfter: rankMuscleGaps(after).filter(m => m.fillFraction < GAP_CUTOFF) }
}
