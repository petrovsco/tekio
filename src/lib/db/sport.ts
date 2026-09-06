import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { SportEntry, SportTypeInfo, NewSportFlags, QualityRating, MatchResult } from '../../types'
import { withOrigin } from '../env'

async function getOrCreateSportType(name: string, newSportFlags?: NewSportFlags): Promise<string> {
  const { data: existing, error: selectError } = await supabase
    .from('sport_types')
    .select('id')
    .eq('user_id', USER_ID)
    .eq('name', name)
    .maybeSingle()
  if (selectError) throw selectError
  if (existing) return existing.id

  const { data, error } = await supabase
    .from('sport_types')
    .insert(withOrigin({
      user_id: USER_ID,
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
  const { data, error } = await supabase
    .from('sport_types')
    .select('name, has_competitor, has_teammate')
    .eq('user_id', USER_ID)
  if (error) throw error
  return (data ?? []).map(r => ({ name: r.name, hasCompetitor: r.has_competitor, hasTeammate: r.has_teammate }))
}

export async function loadSports(): Promise<SportEntry[]> {
  const { data, error } = await supabase
    .from('sport_sessions')
    .select('id, session_date, with_trainer, quality, duration_minutes, avg_heart_rate, notes, competitor_names, result, teammate_names, source, garmin_activity_id, sport_types(name)')
    .eq('user_id', USER_ID)
    .order('session_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id,
    date: r.session_date,
    sport: ((r.sport_types as unknown as { name: string } | null)?.name ?? '') as SportEntry['sport'],
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
  }))
}

export async function saveSportEntry(
  entry: Omit<SportEntry, 'id'>,
  newSportFlags?: NewSportFlags
): Promise<SportEntry> {
  const sportTypeId = await getOrCreateSportType(entry.sport, newSportFlags)
  const { data, error } = await supabase
    .from('sport_sessions')
    .insert(withOrigin({
      user_id: USER_ID,
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
    }))
    .select('id, session_date, with_trainer, quality, duration_minutes, avg_heart_rate, notes, competitor_names, result, teammate_names')
    .single()
  if (error) throw error
  return {
    id: data.id,
    date: data.session_date,
    sport: entry.sport,
    withTrainer: data.with_trainer,
    quality: (data.quality ?? 0) as QualityRating,
    duration: data.duration_minutes != null ? Number(data.duration_minutes) : undefined,
    avgHr: data.avg_heart_rate != null ? Number(data.avg_heart_rate) : undefined,
    notes: data.notes ?? '',
    competitorNames: data.competitor_names ?? undefined,
    result: (data.result ?? undefined) as MatchResult | undefined,
    teammateNames: data.teammate_names ?? undefined,
  }
}

export async function deleteSportEntry(id: string): Promise<void> {
  const { error } = await supabase.from('sport_sessions').delete().eq('id', id)
  if (error) throw error
}

export async function updateSportEntry(
  id: string,
  patch: Omit<SportEntry, 'id'>,
  newSportFlags?: NewSportFlags
): Promise<void> {
  const sportTypeId = await getOrCreateSportType(patch.sport, newSportFlags)
  const { error } = await supabase
    .from('sport_sessions')
    .update({
      sport_type_id: sportTypeId,
      session_date: patch.date,
      with_trainer: patch.withTrainer,
      quality: patch.quality || null,
      duration_minutes: patch.duration ?? null,
      avg_heart_rate: patch.avgHr ?? null,
      notes: patch.notes || null,
      competitor_names: patch.competitorNames?.length ? patch.competitorNames : null,
      result: patch.result || null,
      teammate_names: patch.teammateNames?.length ? patch.teammateNames : null,
    })
    .eq('id', id)
  if (error) throw error
}
