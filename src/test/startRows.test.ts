import { describe, it, expect } from 'vitest'
import type { PostgrestClient } from '@supabase/postgrest-js'
import {
  loadStartRows, loadWeights, loadBodyweight, loadCardio, loadMobility, loadMuscleGroups, loadExerciseMuscleLinks,
  loadExercises, exerciseAdaptationMap, loadSports, loadSportTypes, loadDonations, loadSleep, loadExposure,
  loadAdaptationTargets, loadExerciseAliases, loadReadinessInputs, loadPlans, loadSessionPlans, type Db,
} from '@tekio/db'

// The start-up rows come from one database function, start_rows, which hands
// back each table's rows as the loaders' own selects do. Fed the same rows,
// the one call and the separate loaders must agree, field for field. Every row
// is invented.

const ROWS: Record<string, unknown[]> = {
  training_sessions: [{
    session_date: '2026-10-20',
    session_exercises: [
      { id: 'se2', sort_order: 1, superset_group_id: 'g1', exercises: { name: 'Row' },
        session_sets: [{ set_number: 2, weight: 40, reps: 8, duration_s: null }, { set_number: 1, weight: 40, reps: 10, duration_s: null }] },
      { id: 'se1', sort_order: 0, superset_group_id: null, exercises: { name: 'Plank' },
        session_sets: [{ set_number: 1, weight: 0, reps: 1, duration_s: 45 }] },
    ],
  }],
  bodyweight_logs: [{ id: 'b1', log_date: '2026-10-20', weight: '75.5', notes: null }],
  cardio_sessions: [{ id: 'c1', session_date: '2026-10-19', activity_type: 'rowing', duration_minutes: 30, distance_km: '6.2',
    avg_heart_rate: 150, zone_distribution: [60, 120], source: null, format: 'intervals', bout_seconds: 60 }],
  mobility_sessions: [{ id: 'm1', session_date: '2026-10-18', total_duration: null, notes: null,
    mobility_exercises: [{ id: 'x1', exercise_name: 'Pigeon', duration_minutes: 5, notes: null, exercise_id: 'e1' }] }],
  muscle_groups: [{ id: 'g-glutes', name: 'Glutes', body_region: 'lower', parent_id: null }],
  exercises: [{ id: 'e1', name: 'Pigeon', default_adaptation: null }, { id: 'e2', name: 'Box jump', default_adaptation: 'power' }],
  exercise_muscle_groups: [{ exercise_id: 'e1', level: 1, contribution: 'recovery',
    exercises: { name: 'Pigeon' }, muscle_groups: { name: 'Glutes', body_region: 'lower' } }],
  sport_sessions: [{ id: 's1', session_date: '2026-10-17', with_trainer: false, quality: 4, duration_minutes: 90, notes: null,
    competitor_names: ['A'], result: 'win', teammate_names: null, source: null, sport_types: { name: 'Tennis' } }],
  sport_types: [{ name: 'Tennis', has_competitor: true, has_teammate: false }],
  blood_donations: [{ id: 'd1', donation_date: '2026-09-01', donation_type: 'full_blood', notes: null }],
  sleep_logs: [{ id: 'n1', log_date: '2026-10-20', duration_hours: '7.5', quality: null, sleep_score: 80,
    sleep_score_qualifier: 'GOOD', hrv: 50, resting_hr: 52, source: 'garmin', notes: null }],
  sauna_sessions: [{ id: 'sa1', session_date: '2026-10-16', duration_minutes: 15, temperature_c: '85', notes: null }],
  cold_sessions: [],
  adaptation_targets: [{ adaptation: 'strength', weekly_muscle_target: 10, weekly_session_target: 2, weekly_minutes_target: null }],
  exercise_aliases: [{ alias: 'bench', canonical_name: 'Bench press', user_id: null }, { alias: 'bp', canonical_name: 'Bench press', user_id: 'u1' }],
  readiness_inputs: [{ id: 'r1', log_date: '2026-10-20', morning_hrv: 55, energy: 4, soreness: 2, sleep_quality: 3, stress: 2, mood: 4 }],
  planned_exercises: [
    { id: 'p2', plan_date: '2026-10-21', exercise: 'Row', target_sets: [{ weight: 40, reps: 8 }], sort_order: 1, planned_by: 'agent', session_exercise_id: null, superset_group_id: null },
    { id: 'p1', plan_date: '2026-10-21', exercise: 'Plank', target_sets: [{ weight: 0, seconds: 45 }], sort_order: 0, planned_by: 'user', session_exercise_id: 'se1', superset_group_id: null },
  ],
  planned_sessions: [{ id: 'ps1', plan_date: '2026-10-21', kind: 'cardio', name: 'Indoor Rowing', target: { duration: 30, format: 'steady' },
    notes: null, sort_order: 0, planned_by: 'agent', cardio_session_id: null, sport_session_id: null, mobility_session_id: null }],
}

/** A client whose every table answers with its rows above, and whose
 *  start_rows answers with all of them at once. */
function fakeDb(): { db: Db; rpc: { name: string; get: boolean }[] } {
  const rpc: { name: string; get: boolean }[] = []
  const query = (rows: unknown[]) => {
    const q = {
      select: () => q, eq: () => q, order: () => q, or: () => q,
      then: (ok: (r: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(ok),
    }
    return q
  }
  const client = {
    from: (t: string) => query(ROWS[t] ?? []),
    rpc: (name: string, _args: unknown, opts?: { get?: boolean }) => {
      rpc.push({ name, get: !!opts?.get })
      return Promise.resolve({ data: ROWS, error: null })
    },
  } as unknown as PostgrestClient
  return { db: { client, userId: 'u1' }, rpc }
}

describe('the start-up rows in one database call', () => {
  it('reads start_rows once, as a GET', async () => {
    const { db, rpc } = fakeDb()
    await loadStartRows(db)
    expect(rpc).toEqual([{ name: 'start_rows', get: true }])
  })

  it('maps every table as its own loader does', async () => {
    const { db } = fakeDb()
    const start = await loadStartRows(db)
    expect(start).toEqual({
      weights: await loadWeights(db),
      bodyweight: await loadBodyweight(db),
      cardio: await loadCardio(db),
      mobility: await loadMobility(db),
      muscleGroups: await loadMuscleGroups(db),
      exerciseMuscles: await loadExerciseMuscleLinks(db),
      exerciseAdaptations: exerciseAdaptationMap(await loadExercises(db)),
      sports: await loadSports(db),
      sportTypes: await loadSportTypes(db),
      donations: await loadDonations(db),
      sleep: await loadSleep(db),
      sauna: await loadExposure(db, 'sauna_sessions'),
      cold: await loadExposure(db, 'cold_sessions'),
      adaptationTargets: await loadAdaptationTargets(db),
      exerciseAliases: await loadExerciseAliases(db),
      readinessInputs: await loadReadinessInputs(db),
      plans: await loadPlans(db),
      sessionPlans: await loadSessionPlans(db),
    })
    // Not empty on either side: the comparison above compared something.
    expect(start.weights.map(w => w.exercise)).toEqual(['Plank', 'Row'])
    expect(start.mobility[0].exercises[0].muscleGroups).toEqual(['Glutes'])
    expect(start.exerciseAdaptations).toEqual({ 'box jump': 'power' })
  })
})
