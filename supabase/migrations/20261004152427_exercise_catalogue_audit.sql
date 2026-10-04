-- tekio.rfcs/rfcs/0074-exercise-catalogue-grounded-links.md §4: the audit,
-- applied on the owner's word (2026-10-04). Every lift's links now match its
-- catalogue entry; the diff and the reason for each line are in
-- tekio.rfcs/rfcs/0074/audit.md, the grounding in
-- tekio.rfcs/grounding/0074-exercise-catalogue.md. Links this touches are marked
-- source = 'catalogue'; the rest keep 'migration'.

-- ── Levels that change (24) ──
update public.exercise_muscle_groups l
set level = v.level,
    role = case when v.level = 1 then 'primary' else 'secondary' end,
    source = 'catalogue'
from (values
  ('Back Squat', 'Hamstrings', 3),
  ('Backward Dumbbell Lunge', 'Hamstrings', 3),
  ('Bench Dip', 'Chest', 3),
  ('Bulgarian Split Squat', 'Hamstrings', 3),
  ('Cable Woodchop', 'Rectus Abdominis', 3),
  ('Crossbody Pronated Curl', 'Forearms', 2),
  ('Deadlift', 'Erectors', 2),
  ('Decline Sit Ups', 'Hip Flexors', 1),
  ('Dips', 'Triceps', 2),
  ('Face Pulls', 'Posterior Deltoid', 1),
  ('Face Pulls', 'Rotator Cuff', 2),
  ('Forward Dumbbell Lunge', 'Hamstrings', 3),
  ('Glute Bridge', 'Hamstrings', 3),
  ('Hip Thrust', 'Hamstrings', 3),
  ('Leg Curl', 'Calves', 3),
  ('Leg Press', 'Glutes', 1),
  ('Low Row', 'Rhomboids', 1),
  ('Low Row', 'Upper Back / Traps', 1),
  ('Pallof Press', 'Rectus Abdominis', 3),
  ('Rows', 'Rhomboids', 1),
  ('Rows', 'Upper Back / Traps', 1),
  ('Single-Arm DB Row', 'Rhomboids', 1),
  ('Single-Arm DB Row', 'Upper Back / Traps', 1),
  ('Snatch', 'Anterior Deltoid', 3)
) as v(exercise, muscle, level)
join public.exercises e on e.name = v.exercise
join public.muscle_groups m on m.name = v.muscle
where l.exercise_id = e.id and l.muscle_group_id = m.id and l.contribution = 'stimulus';

-- ── Links added (30; those at level 3 move no number) ──
insert into public.exercise_muscle_groups (exercise_id, muscle_group_id, level, role, contribution, source, created_at)
select e.id, m.id, v.level, case when v.level = 1 then 'primary' else 'secondary' end, 'stimulus', 'catalogue', now()
from (values
  ('Band Pull-Apart', 'Rotator Cuff', 3),
  ('Bench Press', 'Lateral Deltoid', 3),
  ('Cable Shrugs (4 Positions)', 'Forearms', 3),
  ('Chest Press', 'Lateral Deltoid', 3),
  ('Chin-up', 'Posterior Deltoid', 3),
  ('Chin-up', 'Forearms', 3),
  ('Clapping Push-up', 'Lateral Deltoid', 3),
  ('Crossbody Pronated Curl', 'Biceps', 1),
  ('Dips', 'Lateral Deltoid', 3),
  ('Dumbbell Shoulder Press', 'Upper Back / Traps', 2),
  ('Goblet Squat', 'Hamstrings', 3),
  ('Goblet Squat', 'Erectors', 3),
  ('Hanging Leg Raises', 'Obliques', 2),
  ('Incline/Seated/Drag Curl', 'Forearms', 3),
  ('Lat Pulldown', 'Posterior Deltoid', 3),
  ('Lat Pulldown', 'Forearms', 3),
  ('Leg Press', 'Hamstrings', 3),
  ('Leg Press', 'Erectors', 3),
  ('Low Row', 'Posterior Deltoid', 2),
  ('Low Row', 'Forearms', 3),
  ('Machine Curl', 'Forearms', 3),
  ('Nordic Hamstring Curl', 'Calves', 3),
  ('Pull-ups', 'Posterior Deltoid', 3),
  ('Push-ups', 'Lateral Deltoid', 3),
  ('Reverse Fly', 'Rotator Cuff', 3),
  ('Rows', 'Posterior Deltoid', 2),
  ('Rows', 'Forearms', 3),
  ('Single-Arm DB Row', 'Posterior Deltoid', 2),
  ('Single-Arm DB Row', 'Forearms', 3),
  ('Standing Dumbbell Curl', 'Forearms', 3)
) as v(exercise, muscle, level)
join public.exercises e on e.name = v.exercise
join public.muscle_groups m on m.name = v.muscle
on conflict (exercise_id, muscle_group_id) do nothing;

-- ── PJR Pullover / Cable Extension: one name for two lifts ──
-- Its one session's load fits the PJR pullover, a lying elbow extension, so the
-- row becomes that lift and keeps its session; the Lats link goes with the
-- straight-arm reading it no longer has.
update public.exercises set name = 'PJR Pullover' where name = 'PJR Pullover / Cable Extension';
delete from public.exercise_muscle_groups l
using public.exercises e, public.muscle_groups m
where l.exercise_id = e.id and l.muscle_group_id = m.id
  and e.name = 'PJR Pullover' and m.name = 'Lats';
update public.exercise_muscle_groups l set source = 'catalogue'
from public.exercises e where l.exercise_id = e.id and e.name = 'PJR Pullover';

-- ── Lat Raises: lat pulldowns filed under a lateral-raise name ──
-- Its sessions carry loads only a pulldown takes, so they move to Lat Pulldown
-- (which has none of its own), the two system aliases that meant a lateral raise
-- point at the lateral raise, and the emptied row goes. "Lat Raises" gets no
-- alias: the name reads two ways, so a new log of it asks its movement.
update public.session_exercises se
set exercise_id = (select id from public.exercises where name = 'Lat Pulldown')
where se.exercise_id = (select id from public.exercises where name = 'Lat Raises');
update public.exercise_aliases set canonical_name = 'Dumbbell Lateral Raise'
where user_id is null and canonical_name = 'Lat Raises';
delete from public.exercises e
where e.name = 'Lat Raises'
  and not exists (select 1 from public.session_exercises se where se.exercise_id = e.id);
