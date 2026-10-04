-- 1. Recovery/mobility exercises (6 new + 2 existing habit names), idempotent by name
with new_ex(name) as (values
  ('Standing Hip Openers'),('Elephant Walks'),
  ('Downward Dog Heel Pedal'),('Cobra Stretch'),('Cat & Cow'),
  ('Frogger Stretch'),('90/90 Hip Rotation'),('Full Backside Mechanic Stretch')
)
insert into public.exercises (user_id, name, is_system)
select 'a0000000-0000-0000-0000-000000000001'::uuid, n.name, false
from new_ex n
where not exists (select 1 from public.exercises e where lower(e.name) = lower(n.name));

-- 2. Multi-group muscle mappings (primary L1 + secondary L2/L3), all recovery
with links(exercise, muscle, lvl, contribution) as (values
  ('Standing Hip Openers','Hip Flexors',1,'recovery'),
  ('Standing Hip Openers','Glutes',2,'recovery'),
  ('Standing Hip Openers','Adductors',3,'recovery'),
  ('Elephant Walks','Hamstrings',1,'recovery'),
  ('Elephant Walks','Calves',2,'recovery'),
  ('Elephant Walks','Glutes',3,'recovery'),
  ('Downward Dog Heel Pedal','Calves',1,'recovery'),
  ('Downward Dog Heel Pedal','Hamstrings',2,'recovery'),
  ('Downward Dog Heel Pedal','Lats',3,'recovery'),
  ('Cobra Stretch','Rectus Abdominis',1,'recovery'),
  ('Cobra Stretch','Hip Flexors',2,'recovery'),
  ('Cat & Cow','Erectors',1,'recovery'),
  ('Cat & Cow','Rectus Abdominis',2,'recovery'),
  ('Cat & Cow','Upper Back / Traps',3,'recovery'),
  ('Frogger Stretch','Adductors',1,'recovery'),
  ('Frogger Stretch','Glutes',2,'recovery'),
  ('Frogger Stretch','Hip Flexors',3,'recovery'),
  ('90/90 Hip Rotation','Glutes',1,'recovery'),
  ('90/90 Hip Rotation','Hip Flexors',2,'recovery'),
  ('90/90 Hip Rotation','Adductors',3,'recovery'),
  ('Full Backside Mechanic Stretch','Hamstrings',1,'recovery'),
  ('Full Backside Mechanic Stretch','Calves',2,'recovery'),
  ('Full Backside Mechanic Stretch','Erectors',2,'recovery'),
  ('Full Backside Mechanic Stretch','Glutes',3,'recovery')
)
insert into public.exercise_muscle_groups (exercise_id, muscle_group_id, role, level, contribution)
select e.id, m.id,
       case when l.lvl = 1 then 'primary' else 'secondary' end,
       l.lvl, l.contribution
from links l
join public.exercises e on lower(e.name) = lower(l.exercise)
join public.muscle_groups m on m.name = l.muscle
on conflict (exercise_id, muscle_group_id) do nothing;

-- 3. Six new daily single-tick recovery habits (primary muscle group each)
with base as (
  select coalesce(max(sort_order), -1) as maxo
  from public.habits where user_id = 'a0000000-0000-0000-0000-000000000001'::uuid
),
newh(name, target, unit, muscle, notes, ord) as (values
  ('Downward Dog Heel Pedal', 15, 'reps', 'Calves', null::text, 1),
  ('Cobra Stretch', 30, 'sec', 'Rectus Abdominis', null::text, 2),
  ('Cat & Cow', 10, 'reps', 'Erectors', null::text, 3),
  ('Frogger Stretch', 10, 'reps', 'Adductors', null::text, 4),
  ('90/90 Hip Rotation', 10, 'reps', 'Glutes', null::text, 5),
  ('Full Backside Mechanic Stretch', 30, 'sec', 'Hamstrings', 'Chin against the chest.', 6)
)
insert into public.habits
  (user_id, name, icon, cadence, target_count, unit, muscle_group_id,
   auto_source, count_level, contribution, active, sort_order, single_tick, notes)
select 'a0000000-0000-0000-0000-000000000001'::uuid, h.name, '🧘', 'daily',
       h.target, h.unit, m.id, 'none', 1, 'recovery', true,
       base.maxo + h.ord, true, h.notes
from newh h
cross join base
join public.muscle_groups m on m.name = h.muscle
where not exists (
  select 1 from public.habits x
  where x.user_id = 'a0000000-0000-0000-0000-000000000001'::uuid
    and lower(x.name) = lower(h.name)
);;
