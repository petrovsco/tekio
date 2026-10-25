-- Every row the app opens with, in one call (RFC 0094, after step 4).
--
-- GET /api/start read some twenty tables at once, each as its own PostgREST
-- request. After a few idle minutes each of them paid the database's cold cost
-- on its own: 400-550 ms apiece on a first opening, against 20-100 ms warm.
-- One function pays it once. Each key holds the rows exactly as the PostgREST
-- select in packages/db/src that it replaces returns them, embedded rows and
-- order included, so the same mappers read either.
--
-- security invoker: it reads as the caller, so the table policies decide, as
-- they do for the selects it replaces. It only adds a function.

create or replace function public.start_rows()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (select app.current_user_id() as id)
  select jsonb_build_object(
    'training_sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'session_date', ts.session_date,
        'session_exercises', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', se.id,
            'sort_order', se.sort_order,
            'superset_group_id', se.superset_group_id,
            'exercises', (select jsonb_build_object('name', e.name) from public.exercises e where e.id = se.exercise_id),
            'session_sets', coalesce((
              select jsonb_agg(jsonb_build_object(
                'set_number', ss.set_number, 'weight', ss.weight, 'reps', ss.reps, 'duration_s', ss.duration_s))
              from public.session_sets ss where ss.session_exercise_id = se.id
            ), '[]'::jsonb)))
          from public.session_exercises se where se.session_id = ts.id
        ), '[]'::jsonb)) order by ts.session_date desc)
      from public.training_sessions ts, me where ts.user_id = me.id
    ), '[]'::jsonb),

    'bodyweight_logs', coalesce((
      select jsonb_agg(jsonb_build_object('id', b.id, 'log_date', b.log_date, 'weight', b.weight, 'notes', b.notes)
        order by b.log_date desc)
      from public.bodyweight_logs b, me where b.user_id = me.id
    ), '[]'::jsonb),

    'cardio_sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'session_date', c.session_date, 'activity_type', c.activity_type,
        'duration_minutes', c.duration_minutes, 'distance_km', c.distance_km,
        'avg_heart_rate', c.avg_heart_rate, 'max_heart_rate', c.max_heart_rate,
        'elevation_gain_m', c.elevation_gain_m, 'zone_distribution', c.zone_distribution,
        'aerobic_te', c.aerobic_te, 'anaerobic_te', c.anaerobic_te,
        'training_effect_label', c.training_effect_label, 'training_load', c.training_load,
        'source', c.source, 'garmin_activity_id', c.garmin_activity_id, 'notes', c.notes,
        'format', c.format, 'bout_seconds', c.bout_seconds) order by c.session_date desc)
      from public.cardio_sessions c, me where c.user_id = me.id
    ), '[]'::jsonb),

    'mobility_sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'session_date', m.session_date, 'total_duration', m.total_duration, 'notes', m.notes,
        'mobility_exercises', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', x.id, 'exercise_name', x.exercise_name, 'duration_minutes', x.duration_minutes,
            'notes', x.notes, 'exercise_id', x.exercise_id))
          from public.mobility_exercises x where x.session_id = m.id
        ), '[]'::jsonb)) order by m.session_date desc)
      from public.mobility_sessions m, me where m.user_id = me.id
    ), '[]'::jsonb),

    'muscle_groups', coalesce((
      select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'body_region', g.body_region, 'parent_id', g.parent_id)
        order by g.name)
      from public.muscle_groups g
    ), '[]'::jsonb),

    'exercises', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'name', e.name, 'default_adaptation', e.default_adaptation)
        order by e.name)
      from public.exercises e
    ), '[]'::jsonb),

    -- One read serves both shapes the separate selects asked for: the links
    -- (level, contribution, exercise and muscle names) and mobility's map from
    -- exercise_id to muscle names.
    'exercise_muscle_groups', coalesce((
      select jsonb_agg(jsonb_build_object(
        'exercise_id', l.exercise_id, 'level', l.level, 'contribution', l.contribution,
        'exercises', (select jsonb_build_object('name', e.name) from public.exercises e where e.id = l.exercise_id),
        'muscle_groups', (select jsonb_build_object('name', g.name, 'body_region', g.body_region)
                          from public.muscle_groups g where g.id = l.muscle_group_id)))
      from public.exercise_muscle_groups l
    ), '[]'::jsonb),

    'sport_sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'session_date', s.session_date, 'with_trainer', s.with_trainer, 'quality', s.quality,
        'duration_minutes', s.duration_minutes, 'avg_heart_rate', s.avg_heart_rate, 'notes', s.notes,
        'competitor_names', s.competitor_names, 'result', s.result, 'teammate_names', s.teammate_names,
        'source', s.source, 'garmin_activity_id', s.garmin_activity_id, 'max_heart_rate', s.max_heart_rate,
        'aerobic_te', s.aerobic_te, 'anaerobic_te', s.anaerobic_te,
        'training_effect_label', s.training_effect_label, 'training_load', s.training_load,
        'zone_distribution', s.zone_distribution,
        'sport_types', (select jsonb_build_object('name', t.name) from public.sport_types t where t.id = s.sport_type_id))
        order by s.session_date desc)
      from public.sport_sessions s, me where s.user_id = me.id
    ), '[]'::jsonb),

    'sport_types', coalesce((
      select jsonb_agg(jsonb_build_object('name', t.name, 'has_competitor', t.has_competitor, 'has_teammate', t.has_teammate))
      from public.sport_types t, me where t.user_id = me.id
    ), '[]'::jsonb),

    'blood_donations', coalesce((
      select jsonb_agg(jsonb_build_object('id', d.id, 'donation_date', d.donation_date, 'donation_type', d.donation_type, 'notes', d.notes)
        order by d.donation_date desc)
      from public.blood_donations d, me where d.user_id = me.id
    ), '[]'::jsonb),

    'sleep_logs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id, 'log_date', l.log_date, 'duration_hours', l.duration_hours, 'quality', l.quality,
        'sleep_score', l.sleep_score, 'sleep_score_qualifier', l.sleep_score_qualifier, 'hrv', l.hrv,
        'resting_hr', l.resting_hr, 'source', l.source, 'notes', l.notes) order by l.log_date desc)
      from public.sleep_logs l, me where l.user_id = me.id
    ), '[]'::jsonb),

    'sauna_sessions', coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'session_date', x.session_date, 'duration_minutes', x.duration_minutes,
        'temperature_c', x.temperature_c, 'notes', x.notes) order by x.session_date desc)
      from public.sauna_sessions x, me where x.user_id = me.id
    ), '[]'::jsonb),

    'cold_sessions', coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'session_date', x.session_date, 'duration_minutes', x.duration_minutes,
        'temperature_c', x.temperature_c, 'notes', x.notes) order by x.session_date desc)
      from public.cold_sessions x, me where x.user_id = me.id
    ), '[]'::jsonb),

    'adaptation_targets', coalesce((
      select jsonb_agg(jsonb_build_object('adaptation', a.adaptation, 'weekly_muscle_target', a.weekly_muscle_target,
        'weekly_session_target', a.weekly_session_target, 'weekly_minutes_target', a.weekly_minutes_target))
      from public.adaptation_targets a
    ), '[]'::jsonb),

    'exercise_aliases', coalesce((
      select jsonb_agg(jsonb_build_object('alias', x.alias, 'canonical_name', x.canonical_name, 'user_id', x.user_id))
      from public.exercise_aliases x, me where x.user_id = me.id or x.user_id is null
    ), '[]'::jsonb),

    'readiness_inputs', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'log_date', r.log_date, 'morning_hrv', r.morning_hrv,
        'energy', r.energy, 'soreness', r.soreness, 'sleep_quality', r.sleep_quality, 'stress', r.stress, 'mood', r.mood)
        order by r.log_date desc)
      from public.readiness_inputs r, me where r.user_id = me.id
    ), '[]'::jsonb),

    'planned_exercises', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'plan_date', p.plan_date, 'exercise', p.exercise,
        'target_sets', p.target_sets, 'sort_order', p.sort_order, 'planned_by', p.planned_by,
        'session_exercise_id', p.session_exercise_id, 'superset_group_id', p.superset_group_id)
        order by p.plan_date desc)
      from public.planned_exercises p, me where p.user_id = me.id
    ), '[]'::jsonb),

    'planned_sessions', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'plan_date', p.plan_date, 'kind', p.kind, 'name', p.name,
        'target', p.target, 'notes', p.notes, 'sort_order', p.sort_order, 'planned_by', p.planned_by,
        'cardio_session_id', p.cardio_session_id, 'sport_session_id', p.sport_session_id,
        'mobility_session_id', p.mobility_session_id) order by p.plan_date desc)
      from public.planned_sessions p, me where p.user_id = me.id
    ), '[]'::jsonb)
  )
$$;

revoke all on function public.start_rows() from public;
grant execute on function public.start_rows() to authenticated;
