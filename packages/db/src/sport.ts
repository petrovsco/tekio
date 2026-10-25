import type { SportEntry, QualityRating, MatchResult } from '@tekio/core'
import { userRows, withOrigin, deleteRow, type Db, type WriteDb } from './db'

// One literal on purpose: PostgREST parses the select string at the type level,
// and a concatenation is just `string`, which costs the returned rows their
// column names.
const SPORT_COLS = 'id, session_date, with_trainer, quality, duration_minutes, avg_heart_rate, notes, competitor_names, result, teammate_names, source, garmin_activity_id, max_heart_rate, aerobic_te, anaerobic_te, training_effect_label, training_load, zone_distribution, sport_types(name)'

/* eslint-disable @typescript-eslint/no-explicit-any */
function toSportEntry(r: any): SportEntry {
  return {
    id: r.id,
    date: r.session_date,
    sport: ((r.sport_types as { name: string } | null)?.name ?? '') as SportEntry['sport'],
    withTrainer: r.with_trainer,
    quality: (r.quality ?? 0) as QualityRating,
    duration: r.duration_minutes != null ? Number(r.duration_minutes) : undefined,
    avgHr: r.avg_heart_rate != null ? Number(r.avg_heart_rate) : undefined,
    notes: r.notes ?? '',
    competitorNames: r.competitor_names ?? undefined,
    result: (r.result ?? undefined) as MatchResult | undefined,
    teammateNames: r.teammate_names ?? undefined,
    source: (r.source ?? 'manual') as SportEntry['source'],
    garminActivityId: r.garmin_activity_id ?? undefined,
    // The Garmin intensity columns (roadmap 058) — written by the sync only, never typed.
    maxHr: r.max_heart_rate != null ? Number(r.max_heart_rate) : undefined,
    aerobicTe: r.aerobic_te != null ? Number(r.aerobic_te) : undefined,
    anaerobicTe: r.anaerobic_te != null ? Number(r.anaerobic_te) : undefined,
    trainingEffectLabel: r.training_effect_label ?? undefined,
    trainingLoad: r.training_load != null ? Number(r.training_load) : undefined,
    zoneDistribution: Array.isArray(r.zone_distribution) ? r.zone_distribution.map(Number) : undefined,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function loadSports(db: Db): Promise<SportEntry[]> {
  return sportsFromRows(await userRows(db, 'sport_sessions', SPORT_COLS, 'session_date'))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sportsFromRows = (rows: any[]): SportEntry[] => rows.map(toSportEntry)

/** A sport session as a client sends it. */
export type SportEntryInput = Omit<SportEntry, 'id'>

/** What a sport typed for the first time needs beyond its name. */
export interface NewSportFlags {
  hasCompetitor: boolean
  hasTeammate: boolean
}

/** The columns a save and an update both write. The sport itself travels as a
 *  foreign key, so the caller resolves it first. */
const toRow = (entry: Omit<SportEntry, 'id'>, sportTypeId: string) => ({
  sport_type_id: sportTypeId,
  session_date: entry.date,
  with_trainer: entry.withTrainer,
  quality: entry.quality || null,
  duration_minutes: entry.duration ?? null,
  avg_heart_rate: entry.avgHr ?? null,
  notes: entry.notes || null,
  competitor_names: entry.competitorNames?.length ? entry.competitorNames : null,
  result: entry.result || null,
  teammate_names: entry.teammateNames?.length ? entry.teammateNames : null,
})

/** The id of this user's sport by that name, created on first use: sports are
 *  added by typing a new one. */
async function getOrCreateSportType(db: WriteDb, name: string, newSportFlags?: NewSportFlags): Promise<string> {
  const { data: existing, error: selectError } = await db.client
    .from('sport_types')
    .select('id')
    .eq('user_id', db.userId)
    .eq('name', name)
    .maybeSingle()
  if (selectError) throw selectError
  if (existing) return existing.id

  const { data, error } = await db.client
    .from('sport_types')
    .insert(withOrigin(db, {
      user_id: db.userId,
      name,
      is_system: false,
      has_competitor: newSportFlags?.hasCompetitor ?? false,
      has_teammate: newSportFlags?.hasTeammate ?? false,
    }))
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function loadSportTypes(db: Db): Promise<Array<NewSportFlags & { name: string }>> {
  return sportTypesFromRows(await userRows(db, 'sport_types', 'name, has_competitor, has_teammate'))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sportTypesFromRows = (rows: any[]): Array<NewSportFlags & { name: string }> =>
  rows.map(r => ({ name: r.name, hasCompetitor: r.has_competitor, hasTeammate: r.has_teammate }))

export async function saveSportEntry(
  db: WriteDb,
  entry: Omit<SportEntry, 'id'>,
  newSportFlags?: NewSportFlags
): Promise<SportEntry> {
  const sportTypeId = await getOrCreateSportType(db, entry.sport, newSportFlags)
  const { data, error } = await db.client
    .from('sport_sessions')
    .insert(withOrigin(db, { user_id: db.userId, ...toRow(entry, sportTypeId) }))
    .select(SPORT_COLS)
    .single()
  if (error) throw error
  return toSportEntry(data)
}

export async function updateSportEntry(
  db: WriteDb,
  id: string,
  patch: Omit<SportEntry, 'id'>,
  newSportFlags?: NewSportFlags
): Promise<void> {
  const sportTypeId = await getOrCreateSportType(db, patch.sport, newSportFlags)
  const { error } = await db.client
    .from('sport_sessions')
    .update(toRow(patch, sportTypeId))
    .eq('id', id)
  if (error) throw error
}

export const deleteSportEntry = (db: Db, id: string): Promise<void> => deleteRow(db, 'sport_sessions', id)
