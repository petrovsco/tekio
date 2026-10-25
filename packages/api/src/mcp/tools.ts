// The assistant's tools (RFC 0099). Each one is a route of this API: its input
// is generated from the route's own OpenAPI description, and a call goes
// through the route itself, with the assistant's token, so a tool answers and
// refuses exactly as the app's own calls do. What is written here is only what
// the description cannot say: the tool's name, what it is for in an
// assistant's words, and which body fields an assistant never sends.
//
// The in-app agent, when it is built, calls this same list.
import type { AgentEntryKind } from '@tekio/db'
import type { HomeRead } from '@tekio/core'

export interface RouteTool {
  name: string
  method: 'get' | 'post'
  /** The route's path, as the OpenAPI description spells it. */
  path: string
  description: string
  /** A write: what kind of entry its answer's `id` is, for the undo record. */
  writes?: AgentEntryKind
  /** Several entries in one call, recorded as one change: the input is
   *  `{ [many]: [body, …] }`. */
  many?: string
  /** Body fields an assistant never sends: the API decides them. */
  omit?: string[]
  /** What of the answer goes back to the assistant, when not all of it. */
  answer?: (body: never) => unknown
}

const DATE_NOTE = 'Every date is the person\'s own calendar day, YYYY-MM-DD: ask, or use today\'s date where they are.'

/** Home without the per-muscle trees the app draws its map from: the words,
 *  the verdict, the gaps and each quality's totals answer the question. */
const homeAnswer = (h: HomeRead) => ({
  date: h.date,
  words: h.words,
  verdict: h.verdict,
  readiness: { band: h.readiness.band, method: h.readiness.method, awaitingInput: h.readiness.awaitingInput },
  donation: h.donation,
  gaps: h.gaps.map(m => ({ name: m.name, sets: m.sets, daysSince: m.daysSince, recovering: m.recovering })),
  recovering: h.muscles.filter(m => m.leaf && m.recovering).map(m => m.name),
  qualities: h.qualities,
  coverage: Object.fromEntries(Object.entries(h.coverage).map(([k, a]) => [k, {
    volume: a.volume, unit: a.unit, target: a.target, onTrack: a.onTrack, worked: a.worked, totalMuscles: a.totalMuscles,
  }])),
})

export const ROUTE_TOOLS: RouteTool[] = [
  {
    name: 'get_whats_missing',
    method: 'get', path: '/api/read/home',
    description: 'Tekiō\'s answer for a day, as its Home screen gives it: which muscles are under-stimulated over the '
      + 'last 14 days, which of the seven adaptations are untouched or short, and whether today can push, should stay '
      + 'steady, or should hold. `words` are the sentences the app prints: repeat them rather than rewording the '
      + `numbers, and do not add physiological claims of your own. Start here. ${DATE_NOTE}`,
    answer: homeAnswer as (body: never) => unknown,
  },
  {
    name: 'get_readiness',
    method: 'get', path: '/api/read/readiness',
    description: `Today's systemic readiness and the days behind it: the band, the method it reads from, and its inputs. ${DATE_NOTE}`,
  },
  {
    name: 'get_adaptation',
    method: 'get', path: '/api/read/adaptations',
    description: 'One muscle-linked quality (power, strength, hypertrophy or muscular endurance) explained per muscle: '
      + `which muscles are on track for it, which need work, and the target in use. ${DATE_NOTE}`,
  },
  {
    name: 'get_recent_training',
    method: 'get', path: '/api/history',
    description: 'What was logged and planned between two days, both included: lifts with their sets, cardio, sport, '
      + `mobility, and the plans of both kinds. Read the last two weeks before planning. ${DATE_NOTE}`,
  },
  {
    name: 'plan_lifts',
    method: 'post', path: '/api/plans/lifts', writes: 'planned_lift', many: 'lifts', omit: ['plannedBy'],
    description: 'Plan lifts for a day: each one an exercise and the sets to aim at. A plan is a target, not work: it '
      + 'shows as planned on the Weights screen, marked as an agent\'s, and counts for nothing until the person logs '
      + 'it. Lifts sharing one `supersetId` (a UUID you make up) are a superset. Undo with undo_last_agent_change. '
      + DATE_NOTE,
  },
  {
    name: 'plan_session',
    method: 'post', path: '/api/plans/sessions', writes: 'planned_session', omit: ['plannedBy'],
    description: 'Plan a cardio, sport or mobility session for a day. Like a planned lift it is a target, shown as '
      + `planned, and counts for nothing until logged. Undo with undo_last_agent_change. ${DATE_NOTE}`,
  },
  {
    name: 'log_lift',
    method: 'post', path: '/api/weights', writes: 'lift',
    description: 'Log a lift the person did: one exercise and the sets they did, on a day. Log only what the person '
      + `says they did. Undo with undo_last_agent_change. ${DATE_NOTE}`,
  },
  {
    name: 'log_cardio',
    method: 'post', path: '/api/cardio', writes: 'cardio',
    description: `Log a cardio session the person did. Undo with undo_last_agent_change. ${DATE_NOTE}`,
  },
  {
    name: 'log_sport',
    method: 'post', path: '/api/sport', writes: 'sport',
    description: `Log a sport session the person played. Undo with undo_last_agent_change. ${DATE_NOTE}`,
  },
  {
    name: 'log_mobility',
    method: 'post', path: '/api/mobility', writes: 'mobility',
    description: `Log a mobility session: the stretches and minutes each. Undo with undo_last_agent_change. ${DATE_NOTE}`,
  },
]

/** The delete route that takes each kind of entry back out. */
export const UNDO_PATH: Record<AgentEntryKind, string> = {
  lift: '/api/weights',
  cardio: '/api/cardio',
  sport: '/api/sport',
  mobility: '/api/mobility',
  planned_lift: '/api/plans/lifts',
  planned_session: '/api/plans/sessions',
}

export const UNDO_DESCRIPTION = 'Undo the last change an assistant made for this person: everything one plan_* or '
  + 'log_* call wrote is taken back out. Call it again to undo the change before that. It only ever removes what an '
  + 'assistant wrote; the person\'s own entries are never touched.'

export const INSTRUCTIONS = 'Tekiō tells the person what is missing in their training: which muscles are '
  + 'under-stimulated, which of seven adaptations are untouched, and whether they are recovered enough to push today. '
  + 'Call get_whats_missing first and give its answer in its own words. Before planning, read get_recent_training for '
  + 'the last two weeks. Plans are targets that count for nothing until logged; everything you write is marked as an '
  + 'assistant\'s and can be undone with undo_last_agent_change. The numbers are the app\'s; any advice beyond them '
  + 'is yours, so say so.'
