-- tekio.rfcs/rfcs/0074-exercise-catalogue-grounded-links.md §2: the 31 grounded
-- movement patterns (src/constants/movementPatterns.ts), keyed as the code keys
-- them, and every lift in the database tagged with its pattern.
alter table public.movement_patterns add column if not exists key text;
create unique index if not exists movement_patterns_key on public.movement_patterns (key);

-- Eight of the eleven original rows share a name with a grounded pattern and
-- are kept, gaining its key; the rest are new.
insert into public.movement_patterns (key, name) values
  ('squat', 'Squat'),
  ('lunge', 'Lunge'),
  ('hingeStraightKnee', 'Hip Hinge — Straight Knee'),
  ('hingeKneeBent', 'Hip Hinge — Deadlift'),
  ('hipExtensionBentKnee', 'Hip Extension — Bent Knee'),
  ('kneeFlexion', 'Knee Flexion'),
  ('kneeExtension', 'Knee Extension'),
  ('hipAbduction', 'Hip Abduction'),
  ('hipAdduction', 'Hip Adduction'),
  ('plantarFlexion', 'Plantar Flexion'),
  ('horizontalPush', 'Horizontal Push'),
  ('verticalPush', 'Vertical Push'),
  ('elbowExtension', 'Elbow Extension'),
  ('shoulderAbduction', 'Shoulder Abduction'),
  ('uprightRow', 'Upright Row'),
  ('horizontalAdduction', 'Horizontal Adduction'),
  ('shoulderFlexion', 'Shoulder Flexion'),
  ('scapularElevation', 'Scapular Elevation'),
  ('verticalPull', 'Vertical Pull'),
  ('horizontalPull', 'Horizontal Pull'),
  ('elbowFlexion', 'Elbow Flexion'),
  ('horizontalAbduction', 'Shoulder Horizontal Abduction'),
  ('straightArmExtension', 'Shoulder Extension — Straight Arm'),
  ('wristAndGrip', 'Wrist and Grip'),
  ('spinalFlexion', 'Spinal Flexion'),
  ('hipFlexionTrunk', 'Hip Flexion — Trunk'),
  ('antiExtension', 'Anti-Extension'),
  ('rotation', 'Rotation'),
  ('lateralFlexion', 'Lateral Flexion'),
  ('carry', 'Carry'),
  ('olympic', 'Olympic Lift')
on conflict (name) do update set key = excluded.key;

-- The three original rows no pattern replaces by name (Hip Hinge and the two
-- Isolation buckets) were split by joint action. No exercise points at them
-- and no build reads the table.
delete from public.movement_patterns
where key is null
  and not exists (select 1 from public.exercises e where e.movement_pattern_id = movement_patterns.id);

-- Mobility drills, sport sessions and power drills stay null: they are out of
-- the catalogue's scope (rfcs/0074/audit.md). Lat Raises is left for the audit
-- migration, which removes it.
update public.exercises e
set movement_pattern_id = mp.id
from (values
  ('Back Extension (flat-back)', 'hingeStraightKnee'),
  ('Back Extension (round-back)', 'hingeStraightKnee'),
  ('Back Squat', 'squat'),
  ('Backward Dumbbell Lunge', 'lunge'),
  ('Band Pull-Apart', 'horizontalAbduction'),
  ('Barbell Ring Outs', 'wristAndGrip'),
  ('Bench Dip', 'elbowExtension'),
  ('Bench Press', 'horizontalPush'),
  ('Bicep Curls', 'elbowFlexion'),
  ('Bulgarian Split Squat', 'lunge'),
  ('Cable Shrugs (4 Positions)', 'scapularElevation'),
  ('Cable Woodchop', 'rotation'),
  ('Calf Raises', 'plantarFlexion'),
  ('Chest Press', 'horizontalPush'),
  ('Chin-up', 'verticalPull'),
  ('Clapping Push-up', 'horizontalPush'),
  ('Clean and Jerk', 'olympic'),
  ('Copenhagen Plank', 'lateralFlexion'),
  ('Crossbody Pronated Curl', 'elbowFlexion'),
  ('Dead Bug', 'antiExtension'),
  ('Deadlift', 'hingeKneeBent'),
  ('Decline Sit Ups', 'hipFlexionTrunk'),
  ('Dips', 'horizontalPush'),
  ('Dumbbell Lateral Raise', 'shoulderAbduction'),
  ('Dumbbell Shoulder Press', 'verticalPush'),
  ('Face Pulls', 'horizontalAbduction'),
  ('Forward Dumbbell Lunge', 'lunge'),
  ('Glute Bridge', 'hipExtensionBentKnee'),
  ('Goblet Squat', 'squat'),
  ('Hang Power Clean', 'olympic'),
  ('Hanging Leg Raises', 'hipFlexionTrunk'),
  ('Hip Thrust', 'hipExtensionBentKnee'),
  ('Incline Dumbbell Tricep Extension', 'elbowExtension'),
  ('Incline/Seated/Drag Curl', 'elbowFlexion'),
  ('Kettlebell Swing', 'hingeStraightKnee'),
  ('Lat Pulldown', 'verticalPull'),
  ('Lateral Lunge', 'lunge'),
  ('Leg Curl', 'kneeFlexion'),
  ('Leg Extension', 'kneeExtension'),
  ('Leg Press', 'squat'),
  ('Low Row', 'horizontalPull'),
  ('Machine Arm Extension', 'elbowExtension'),
  ('Machine Curl', 'elbowFlexion'),
  ('Nordic Hamstring Curl', 'kneeFlexion'),
  ('Overhead Press', 'verticalPush'),
  ('Pallof Press', 'rotation'),
  ('Power Clean', 'olympic'),
  ('Pull-ups', 'verticalPull'),
  ('Push-ups', 'horizontalPush'),
  ('Reverse Fly', 'horizontalAbduction'),
  ('Rows', 'horizontalPull'),
  ('Single-Arm DB Row', 'horizontalPull'),
  ('Single-Leg Calf Raise', 'plantarFlexion'),
  ('Single-Leg RDL', 'hingeStraightKnee'),
  ('Skull Crusher', 'elbowExtension'),
  ('Snatch', 'olympic'),
  ('Standing Calf Raise', 'plantarFlexion'),
  ('Standing Dumbbell Curl', 'elbowFlexion'),
  ('Tricep Extensions', 'elbowExtension'),
  ('Tricep Push Out (Cable Pushdown)', 'elbowExtension'),
  ('PJR Pullover / Cable Extension', 'elbowExtension')
) as v(name, key)
join public.movement_patterns mp on mp.key = v.key
where e.name = v.name;
