import { supabase } from '../supabase'
import { userId } from '../session'
import type { SportEntry, SportTypeInfo, NewSportFlags } from '../../types'
import { withOrigin } from '../env'
import { appDb, userRows, deleteRow } from './_rows'
import { SPORT_COLS as COLS, toSportEntry as toEntry, loadSports as dbLoadSports } from '@tekio/db'

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

async function getOrCreateSportType(name: string, newSportFlags?: NewSportFlags): Promise<string> {
  const { data: existing, error: selectError } = await supabase
    .from('sport_types')
    .select('id')
    .eq('user_id', userId())
    .eq('name', name)
    .maybeSingle()
  if (selectError) throw selectError
  if (existing) return existing.id

  const { data, error } = await supabase
    .from('sport_types')
    .insert(withOrigin({
      user_id: userId(),
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

export async function loadSportTypes(): Promise<SportTypeInfo[]> {
  const rows = await userRows('sport_types', 'name, has_competitor, has_teammate')
  return rows.map(r => ({ name: r.name, hasCompetitor: r.has_competitor, hasTeammate: r.has_teammate }))
}

export const loadSports = (): Promise<SportEntry[]> => dbLoadSports(appDb())

export async function saveSportEntry(
  entry: Omit<SportEntry, 'id'>,
  newSportFlags?: NewSportFlags
): Promise<SportEntry> {
  const sportTypeId = await getOrCreateSportType(entry.sport, newSportFlags)
  const { data, error } = await supabase
    .from('sport_sessions')
    .insert(withOrigin({ user_id: userId(), ...toRow(entry, sportTypeId) }))
    .select(COLS)
    .single()
  if (error) throw error
  return toEntry(data)
}

export const deleteSportEntry = (id: string): Promise<void> => deleteRow('sport_sessions', id)

export async function updateSportEntry(
  id: string,
  patch: Omit<SportEntry, 'id'>,
  newSportFlags?: NewSportFlags
): Promise<void> {
  const sportTypeId = await getOrCreateSportType(patch.sport, newSportFlags)
  const { error } = await supabase
    .from('sport_sessions')
    .update(toRow(patch, sportTypeId))
    .eq('id', id)
  if (error) throw error
}
