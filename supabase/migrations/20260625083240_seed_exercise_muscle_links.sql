with links(ex_name, mg_name, lvl, contribution) as (values
  -- Lower body strength
  ('Back Squat','Quadriceps',1,'stimulus'),('Back Squat','Glutes',1,'stimulus'),('Back Squat','Hamstrings',2,'stimulus'),('Back Squat','Erectors',3,'stimulus'),('Back Squat','Adductors',3,'stimulus'),
  ('Goblet Squat','Quadriceps',1,'stimulus'),('Goblet Squat','Glutes',1,'stimulus'),('Goblet Squat','Adductors',3,'stimulus'),
  ('Bulgarian Split Squat','Quadriceps',1,'stimulus'),('Bulgarian Split Squat','Glutes',1,'stimulus'),('Bulgarian Split Squat','Hamstrings',2,'stimulus'),('Bulgarian Split Squat','Adductors',3,'stimulus'),
  ('Deadlift','Hamstrings',1,'stimulus'),('Deadlift','Glutes',1,'stimulus'),('Deadlift','Erectors',1,'stimulus'),('Deadlift','Quadriceps',2,'stimulus'),('Deadlift','Lats',3,'stimulus'),('Deadlift','Upper Back / Traps',3,'stimulus'),
  ('Single-Leg RDL','Hamstrings',1,'stimulus'),('Single-Leg RDL','Glutes',1,'stimulus'),('Single-Leg RDL','Erectors',3,'stimulus'),
  ('Nordic Hamstring Curl','Hamstrings',1,'stimulus'),('Nordic Hamstring Curl','Glutes',3,'stimulus'),
  ('Glute Bridge','Glutes',1,'stimulus'),('Glute Bridge','Hamstrings',2,'stimulus'),
  ('Lateral Lunge','Adductors',1,'stimulus'),('Lateral Lunge','Quadriceps',2,'stimulus'),('Lateral Lunge','Glutes',2,'stimulus'),
  ('Calf Raises','Calves',1,'stimulus'),('Standing Calf Raise','Calves',1,'stimulus'),('Single-Leg Calf Raise','Calves',1,'stimulus'),
  ('Hip Airplane','Glutes',2,'stimulus'),('Hip Airplane','Adductors',3,'stimulus'),
  -- Plyometric / power
  ('Box Jump','Quadriceps',1,'stimulus'),('Box Jump','Glutes',1,'stimulus'),('Box Jump','Calves',2,'stimulus'),
  ('Ankle Bounce','Calves',1,'stimulus'),('Pogo Hop','Calves',1,'stimulus'),('Pogo Hops','Calves',1,'stimulus'),
  ('Lateral Bound','Glutes',1,'stimulus'),('Lateral Bound','Quadriceps',2,'stimulus'),('Lateral Bound','Adductors',2,'stimulus'),
  ('Skater Hop','Glutes',1,'stimulus'),('Skater Hop','Quadriceps',2,'stimulus'),('Skater Hop','Adductors',2,'stimulus'),
  ('Lateral Shuffle','Glutes',2,'stimulus'),('Lateral Shuffle','Quadriceps',2,'stimulus'),('Lateral Shuffle','Adductors',2,'stimulus'),
  -- Push
  ('Bench Press','Chest',1,'stimulus'),('Bench Press','Triceps',2,'stimulus'),('Bench Press','Anterior Deltoid',2,'stimulus'),
  ('Push ups','Chest',1,'stimulus'),('Push ups','Triceps',2,'stimulus'),('Push ups','Anterior Deltoid',2,'stimulus'),
  ('Push-ups','Chest',1,'stimulus'),('Push-ups','Triceps',2,'stimulus'),('Push-ups','Anterior Deltoid',2,'stimulus'),
  ('Overhead Press','Anterior Deltoid',1,'stimulus'),('Overhead Press','Lateral Deltoid',2,'stimulus'),('Overhead Press','Triceps',2,'stimulus'),('Overhead Press','Upper Back / Traps',3,'stimulus'),
  ('Dumbbell Shoulder Press','Anterior Deltoid',1,'stimulus'),('Dumbbell Shoulder Press','Lateral Deltoid',2,'stimulus'),('Dumbbell Shoulder Press','Triceps',2,'stimulus'),
  ('Lat Raises','Lateral Deltoid',1,'stimulus'),('Lat Raises','Anterior Deltoid',3,'stimulus'),
  ('Tricep Extensions','Triceps',1,'stimulus'),
  ('Med Ball Chest Pass','Chest',1,'stimulus'),('Med Ball Chest Pass','Triceps',2,'stimulus'),('Med Ball Chest Pass','Anterior Deltoid',2,'stimulus'),
  ('Med Ball Overhead Throw','Lats',2,'stimulus'),('Med Ball Overhead Throw','Rectus Abdominis',2,'stimulus'),('Med Ball Overhead Throw','Anterior Deltoid',2,'stimulus'),
  ('Med Ball Throw','Chest',2,'stimulus'),('Med Ball Throw','Obliques',2,'stimulus'),('Med Ball Throw','Rectus Abdominis',2,'stimulus'),
  -- Pull
  ('Pull-Up','Lats',1,'stimulus'),('Pull-Up','Biceps',2,'stimulus'),('Pull-Up','Rhomboids',2,'stimulus'),('Pull-Up','Upper Back / Traps',3,'stimulus'),('Pull-Up','Forearms',3,'stimulus'),
  ('Pull-ups','Lats',1,'stimulus'),('Pull-ups','Biceps',2,'stimulus'),('Pull-ups','Rhomboids',2,'stimulus'),('Pull-ups','Upper Back / Traps',3,'stimulus'),('Pull-ups','Forearms',3,'stimulus'),
  ('Rows','Lats',1,'stimulus'),('Rows','Rhomboids',2,'stimulus'),('Rows','Biceps',2,'stimulus'),('Rows','Upper Back / Traps',3,'stimulus'),
  ('Low Row','Lats',1,'stimulus'),('Low Row','Rhomboids',2,'stimulus'),('Low Row','Biceps',2,'stimulus'),('Low Row','Upper Back / Traps',3,'stimulus'),
  ('Single-Arm DB Row','Lats',1,'stimulus'),('Single-Arm DB Row','Rhomboids',2,'stimulus'),('Single-Arm DB Row','Biceps',2,'stimulus'),('Single-Arm DB Row','Upper Back / Traps',3,'stimulus'),
  ('Bicep Curls','Biceps',1,'stimulus'),('Bicep Curls','Forearms',3,'stimulus'),
  ('Face Pull','Posterior Deltoid',1,'stimulus'),('Face Pull','Rotator Cuff',2,'stimulus'),('Face Pull','Rhomboids',2,'stimulus'),('Face Pull','Upper Back / Traps',3,'stimulus'),
  ('Reverse Fly','Posterior Deltoid',1,'stimulus'),('Reverse Fly','Rhomboids',2,'stimulus'),('Reverse Fly','Upper Back / Traps',3,'stimulus'),
  ('Band Pull-Apart','Posterior Deltoid',1,'stimulus'),('Band Pull-Apart','Rhomboids',2,'stimulus'),('Band Pull-Apart','Upper Back / Traps',3,'stimulus'),
  ('Scap Push-Up','Rhomboids',1,'stimulus'),('Scap Push-Up','Rotator Cuff',3,'stimulus'),
  ('Freestyle Swim','Lats',2,'stimulus'),('Freestyle Swim','Posterior Deltoid',3,'stimulus'),
  -- Core
  ('Cable Woodchop','Obliques',1,'stimulus'),('Cable Woodchop','Rectus Abdominis',2,'stimulus'),
  ('Pallof Press','Obliques',1,'stimulus'),('Pallof Press','Rectus Abdominis',2,'stimulus'),
  ('Dead Bug','Rectus Abdominis',1,'stimulus'),('Dead Bug','Obliques',2,'stimulus'),
  ('Copenhagen Plank','Adductors',1,'stimulus'),('Copenhagen Plank','Obliques',2,'stimulus'),
  -- Conditioning
  ('Assault Bike Intervals','Quadriceps',2,'stimulus'),('Assault Bike Intervals','Glutes',3,'stimulus'),
  -- Recovery / mobility (contribution = recovery)
  ('Adductor Pancake','Adductors',1,'recovery'),
  ('Ankle Prep','Calves',1,'recovery'),
  ('Band Dislocate','Rotator Cuff',1,'recovery'),('Band Dislocate','Posterior Deltoid',2,'recovery'),
  ('Couch Stretch','Hip Flexors',1,'recovery'),('Couch Stretch','Quadriceps',2,'recovery'),
  ('Foam Roll Glutes','Glutes',1,'recovery'),
  ('Foam Roll Hamstrings','Hamstrings',1,'recovery'),
  ('Foam Roll Quads','Quadriceps',1,'recovery'),
  ('Hamstring PAILs','Hamstrings',1,'recovery'),
  ('Hip CARs','Hip Flexors',1,'recovery'),('Hip CARs','Glutes',2,'recovery'),
  ('Lat Stretch','Lats',1,'recovery'),
  ('Leg Swings','Hip Flexors',1,'recovery'),('Leg Swings','Hamstrings',2,'recovery'),
  ('Pec Stretch','Chest',1,'recovery'),
  ('Shoulder CARs','Rotator Cuff',1,'recovery'),('Shoulder CARs','Anterior Deltoid',2,'recovery'),
  ('Standing Calf Stretch','Calves',1,'recovery'),
  ('Thoracic Extension','Upper Back / Traps',1,'recovery'),('Thoracic Extension','Erectors',2,'recovery'),
  ('Thoracic Rotation','Obliques',1,'recovery'),('Thoracic Rotation','Upper Back / Traps',2,'recovery')
)
insert into exercise_muscle_groups (exercise_id, muscle_group_id, role, level, contribution)
select e.id, m.id,
       case when l.lvl = 1 then 'primary' else 'secondary' end,
       l.lvl, l.contribution
from links l
join exercises e on e.name = l.ex_name and e.user_id = 'a0000000-0000-0000-0000-000000000001'
join muscle_groups m on m.name = l.mg_name
on conflict (exercise_id, muscle_group_id) do nothing;;
