import type { SportEntry, QualityRating, MatchResult } from '@tekio/core'
import { userRows, type Db } from './db'

// One literal on purpose: PostgREST parses the select string at the type level,
// and a concatenation is just `string`, which costs the returned rows their
// column names.
export const SPORT_COLS = 'id, session_date, with_trainer, quality, duration_minutes, avg_heart_rate, notes, competitor_names, result, teammate_names, source, garmin_activity_id, max_heart_rate, aerobic_te, anaerobic_te, training_effect_label, training_load, zone_distribution, sport_types(name)'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toSportEntry(r: any): SportEntry {
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
  const rows = await userRows(db, 'sport_sessions', SPORT_COLS, 'session_date')
  return rows.map(toSportEntry)
}
