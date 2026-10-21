import type { PlannedSession, PlannedKind, CardioFormat, PlannedStretch } from '@tekio/core'
import { userRows, withOrigin, deleteRow, type Db, type WriteDb } from './db'

// ── Planned sessions (planned_sessions, RFC 0104) ────────────────────────────
// Cardio, sport and mobility plans: the lifts' planned_exercises (RFC 0098) for
// the other two capture tabs. No read selects from this table, so a plan cannot
// count as done until it is logged through the tab's own form.

type Target = {
  duration?: number
  distance?: number
  format?: CardioFormat
  boutSeconds?: number
  exercises?: PlannedStretch[]
}

type SessionPlanRow = {
  id: string
  plan_date: string
  kind: PlannedKind
  name: string
  target: Target | null
  notes: string | null
  sort_order: number
  planned_by: 'user' | 'agent'
  cardio_session_id: string | null
  sport_session_id: string | null
  mobility_session_id: string | null
}

const COLS = 'id, plan_date, kind, name, target, notes, sort_order, planned_by, cardio_session_id, sport_session_id, mobility_session_id'

/** The link column for each kind's logged row. */
const LINK: Record<PlannedKind, 'cardio_session_id' | 'sport_session_id' | 'mobility_session_id'> = {
  cardio: 'cardio_session_id',
  sport: 'sport_session_id',
  mobility: 'mobility_session_id',
}

/** A number the row carries, or nothing: an agent may write "40" as a string. */
const num = (v: unknown): number | undefined => {
  const n = Number(v)
  return v != null && v !== '' && Number.isFinite(n) && n > 0 ? n : undefined
}

function mapRow(r: SessionPlanRow): PlannedSession {
  const t = r.target ?? {}
  const linked = r[LINK[r.kind]]
  const stretches = (t.exercises ?? [])
    .map(e => ({ name: String(e.name ?? '').trim(), duration: num(e.duration) ?? 0 }))
    .filter(e => e.name)
  return {
    id: r.id,
    date: r.plan_date,
    kind: r.kind,
    name: r.name,
    ...(num(t.duration) ? { duration: num(t.duration) } : {}),
    ...(num(t.distance) ? { distance: num(t.distance) } : {}),
    ...(t.format === 'steady' || t.format === 'intervals' ? { format: t.format } : {}),
    ...(num(t.boutSeconds) ? { boutSeconds: num(t.boutSeconds) } : {}),
    ...(r.kind === 'mobility' ? { stretches } : {}),
    ...(r.notes ? { notes: r.notes } : {}),
    plannedBy: r.planned_by,
    ...(linked ? { loggedAs: linked } : {}),
  }
}

/** What a plan says, as the columns hold it. */
export type SessionPlanPatch = Omit<PlannedSession, 'id' | 'plannedBy' | 'loggedAs'>

function toColumns(p: SessionPlanPatch) {
  const target: Target = p.kind === 'mobility'
    ? { exercises: p.stretches ?? [] }
    : {
        ...(p.duration ? { duration: p.duration } : {}),
        ...(p.distance ? { distance: p.distance } : {}),
        ...(p.format ? { format: p.format } : {}),
        ...(p.boutSeconds ? { boutSeconds: p.boutSeconds } : {}),
      }
  return { plan_date: p.date, kind: p.kind, name: p.name, target, notes: p.notes || null }
}

/** Newest date first; within a day, in the order they were planned. */
export async function loadSessionPlans(db: Db): Promise<PlannedSession[]> {
  const rows = (await userRows(db, 'planned_sessions', COLS, 'plan_date')) as SessionPlanRow[]
  return [...rows]
    .sort((a, b) => b.plan_date.localeCompare(a.plan_date) || a.sort_order - b.sort_order)
    .map(mapRow)
}

export async function saveSessionPlan(
  db: WriteDb,
  plan: SessionPlanPatch,
  plannedBy: PlannedSession['plannedBy'] = 'user',
): Promise<PlannedSession> {
  const { count } = await db.client
    .from('planned_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', db.userId)
    .eq('plan_date', plan.date)
  const { data, error } = await db.client
    .from('planned_sessions')
    .insert(withOrigin(db, { user_id: db.userId, ...toColumns(plan), sort_order: count ?? 0, planned_by: plannedBy }))
    .select(COLS)
    .single()
  if (error) throw error
  return mapRow(data as SessionPlanRow)
}

/** Change what a plan says. Its kind stays: a sheet edits one kind. */
export async function updateSessionPlan(db: Db, id: string, patch: SessionPlanPatch): Promise<void> {
  const { error } = await db.client.from('planned_sessions').update(toColumns(patch)).eq('id', id)
  if (error) throw error
}

/** The plan became logged work: point it at the entry it became. */
export async function markSessionPlanLogged(db: Db, id: string, kind: PlannedKind, entryId: string): Promise<void> {
  const { error } = await db.client.from('planned_sessions').update({ [LINK[kind]]: entryId }).eq('id', id)
  if (error) throw error
}

export const deleteSessionPlan = (db: Db, id: string): Promise<void> => deleteRow(db, 'planned_sessions', id)

/** Deletes the plans dated before `day` that were never logged from the card,
 *  as `pruneMissedPlans` does for lifts. A cardio or sport plan cleared by a
 *  same-day session carries no link and goes too: that work is logged. */
export async function pruneMissedSessionPlans(db: Db, day: string): Promise<void> {
  const { error } = await db.client
    .from('planned_sessions')
    .delete()
    .eq('user_id', db.userId)
    .lt('plan_date', day)
    .is('cardio_session_id', null)
    .is('sport_session_id', null)
    .is('mobility_session_id', null)
  if (error) throw error
}

/** The kind of this user's planned session `id`, or null when it is not theirs. */
export async function ownSessionPlanKind(db: Db, id: string): Promise<PlannedKind | null> {
  const { data, error } = await db.client.from('planned_sessions').select('kind').eq('id', id).eq('user_id', db.userId).maybeSingle()
  if (error) throw error
  return (data?.kind as PlannedKind | undefined) ?? null
}
