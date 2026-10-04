-- Guarded 2026-10-04 (RFC 0016): skips on a database without the owner's
-- profile, so the history replays from empty. Live behaviour is unchanged.
do $$
declare
  v_user uuid := 'a0000000-0000-0000-0000-000000000001';
  v_program uuid; v_phase uuid; v_userprog uuid; v_day uuid;
  v_b1 uuid; v_b2 uuid; v_b3 uuid; v_b4 uuid; v_b5 uuid;
  v_a uuid; v_bb uuid;
begin
  if not exists (select 1 from public.user_profiles where id = v_user) then
    return;
  end if;
  insert into exercises(user_id, name, is_system)
  select v_user, x, false from unnest(array[
    'Shoulder CARs','Hip CARs','Band Dislocate','Leg Swings','Goblet Squat','Pogo Hop',
    'Hip Airplane','Glute Bridge','Band Pull-Apart','Scap Push-Up','Med Ball Chest Pass',
    'Lateral Lunge','Ankle Bounce','Skater Hop','Tennis Warm-Up Swings','Dynamic Warm-Up',
    'Lateral Shuffle','Ankle Prep','Box Jump','Med Ball Overhead Throw','Med Ball Throw',
    'Lateral Bound','Back Squat','Deadlift','Single-Leg RDL','Bench Press','Pull-Up',
    'Overhead Press','Bulgarian Split Squat','Single-Arm DB Row','Face Pull','Copenhagen Plank',
    'Standing Calf Raise','Nordic Hamstring Curl','Single-Leg Calf Raise','Pallof Press',
    'Cable Woodchop','Dead Bug','Assault Bike Intervals','Couch Stretch','Adductor Pancake',
    'Hamstring PAILs','Thoracic Extension','Standing Calf Stretch','Pec Stretch','Lat Stretch',
    'Thoracic Rotation','Foam Roll Quads','Legs-Up-Wall','Box Breathing','Foam Roll Hamstrings',
    'Foam Roll Glutes','Sauna','Nutrition Window','Freestyle Swim','Volleyball Play',
    'Tennis Play','Beach Volleyball Play'
  ]) x
  on conflict (user_id, name) do nothing;

  insert into programs(user_id, name, description, cycle_length_weeks, deload_week, deload_strategy, cycle_unit, weekly_principles)
  values(v_user, 'Volleyball Performance & Healthspan',
    'Sports-physician 7-day integrated plan: volleyball performance + healthspan (strength, power, mobility, sport, conditioning).',
    6, 6, '{"type":"reps","factor":0.7}'::jsonb, 'weeks',
    '{"protein":"1.6-2.0 g/kg/day","sleep":"8+ h/night","intensity_rule":"80% moderate / 20% high (Wed VO2 + Sun volleyball)","weekly_flexibility":"5 min static stretch per muscle group / week","cold_exposure":"optional, post-strength"}'::jsonb)
  returning id into v_program;

  insert into program_phases(program_id, name, sort_order, duration_weeks, goal)
  values(v_program, 'Main', 0, 6, 'general') returning id into v_phase;

  insert into user_programs(user_id, program_id, start_date, current_day_index, last_advanced_date, current_phase_id, status)
  values(v_user, v_program, '2026-06-22', 0, '2026-06-22', v_phase, 'active') returning id into v_userprog;

  insert into program_cycles(user_program_id, cycle_number, start_date, status)
  values(v_userprog, 1, '2026-06-22', 'active');

  -- MONDAY
  insert into program_days(program_id, phase_id, name, sort_order, day_of_week, focus)
  values(v_program, v_phase, 'Recovery & Deep Flexibility', 0, 'Monday', 'Active recovery + deep flexibility') returning id into v_day;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Joint Prep','warmup','07:00',10,0) returning id into v_b1;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Swim','sport','07:15',45,1) returning id into v_b2;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Deep Flexibility','mobility','20:00',25,2) returning id into v_b3;
  insert into program_day_exercises(program_day_id,block_id,exercise_id,sort_order,training_tag,sets_text,reps_text,weight_text,duration_text,tempo,notes)
  select v_day, r.blk, e.id, r.so, r.tag, r.sets, r.reps, r.wt, r.dur, r.tempo, r.notes
  from (values
    (v_b1,0,'Shoulder CARs','WARMUP',null,null,null,'2 min',null,'Slow controlled rotations'),
    (v_b1,1,'Hip CARs','WARMUP',null,null,null,'2 min',null,null),
    (v_b2,2,'Freestyle Swim','SKILL',null,null,null,'45 min',null,'Zone 2 aerobic, easy'),
    (v_b3,3,'Couch Stretch','MOBILITY','2',null,null,'2 min/side',null,'Hip flexors'),
    (v_b3,4,'Adductor Pancake','MOBILITY','2',null,null,'2 min',null,'Adductors'),
    (v_b3,5,'Hamstring PAILs','MOBILITY','2',null,null,'2 min/side',null,'Hamstrings'),
    (v_b3,6,'Thoracic Extension','MOBILITY','2',null,null,'90 s',null,'Thoracic spine'),
    (v_b3,7,'Pec Stretch','MOBILITY','2',null,null,'60 s/side',null,'Chest/shoulders'),
    (v_b3,8,'Standing Calf Stretch','MOBILITY','2',null,null,'60 s/side',null,'Calves')
  ) as r(blk,so,name,tag,sets,reps,wt,dur,tempo,notes)
  join exercises e on e.user_id=v_user and e.name=r.name;

  -- TUESDAY
  insert into program_days(program_id, phase_id, name, sort_order, day_of_week, focus)
  values(v_program, v_phase, 'Lower Strength (Squat) + Power', 1, 'Tuesday', 'Primary lower-body strength') returning id into v_day;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Lift Prep','warmup','18:00',10,0) returning id into v_b1;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Squat + Power + Prehab','weight','18:10',60,1) returning id into v_b2;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Cooldown','recovery','19:15',10,2) returning id into v_b3;
  insert into program_day_exercises(program_day_id,block_id,exercise_id,sort_order,training_tag,sets_text,reps_text,weight_text,duration_text,tempo,notes)
  select v_day, r.blk, e.id, r.so, r.tag, r.sets, r.reps, r.wt, r.dur, r.tempo, r.notes
  from (values
    (v_b1,0,'Leg Swings','WARMUP','2','10/side',null,null,null,null),
    (v_b1,1,'Goblet Squat','WARMUP','2','8',null,null,null,'Light, groove pattern'),
    (v_b2,2,'Box Jump','POWER','5','3',null,null,null,'CNS priming, full recovery'),
    (v_b2,3,'Back Squat','STRENGTH','4','5','~100 kg / RPE 8',null,'3-0-1','Primary lift'),
    (v_b2,4,'Face Pull','PREHAB','4','12',null,null,null,'Superset w/ Back Squat'),
    (v_b2,5,'Copenhagen Plank','PREHAB','3','20 s/side',null,null,null,'Adductor/groin resilience'),
    (v_b2,6,'Standing Calf Raise','PREHAB','4','12',null,null,null,null),
    (v_b3,7,'Foam Roll Quads','RECOVERY',null,null,null,'5 min',null,null),
    (v_b3,8,'Legs-Up-Wall','RECOVERY',null,null,null,'5 min',null,'Parasympathetic downshift')
  ) as r(blk,so,name,tag,sets,reps,wt,dur,tempo,notes)
  join exercises e on e.user_id=v_user and e.name=r.name;
  select p.id into v_a from program_day_exercises p join exercises e on e.id=p.exercise_id where p.program_day_id=v_day and e.name='Back Squat';
  select p.id into v_bb from program_day_exercises p join exercises e on e.id=p.exercise_id where p.program_day_id=v_day and e.name='Face Pull';
  insert into program_supersets(program_day_id, exercise_a_id, exercise_b_id) values(v_day, v_a, v_bb);

  -- WEDNESDAY
  insert into program_days(program_id, phase_id, name, sort_order, day_of_week, focus)
  values(v_program, v_phase, 'Hip Hinge + Posterior + VO2 Max', 2, 'Wednesday', 'Deadlift + VO2 max conditioning') returning id into v_day;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Hinge Prep','warmup','18:00',10,0) returning id into v_b1;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Deadlift + Posterior Chain','weight','18:10',45,1) returning id into v_b2;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'VO2 Max Intervals','conditioning','19:00',20,2) returning id into v_b3;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Cooldown','recovery','19:25',8,3) returning id into v_b4;
  insert into program_day_exercises(program_day_id,block_id,exercise_id,sort_order,training_tag,sets_text,reps_text,weight_text,duration_text,tempo,notes)
  select v_day, r.blk, e.id, r.so, r.tag, r.sets, r.reps, r.wt, r.dur, r.tempo, r.notes
  from (values
    (v_b1,0,'Hip Airplane','WARMUP','2','5/side',null,null,null,null),
    (v_b1,1,'Glute Bridge','WARMUP','2','12',null,null,null,null),
    (v_b1,2,'Band Pull-Apart','WARMUP','2','15',null,null,null,null),
    (v_b2,3,'Deadlift','STRENGTH','4','4','~100 kg / RPE 8',null,'1-1-1','Primary hinge'),
    (v_b2,4,'Nordic Hamstring Curl','PREHAB','3','6',null,null,'slow eccentric','Hamstring resilience'),
    (v_b2,5,'Single-Leg RDL','STRENGTH','3','8/side',null,null,null,null),
    (v_b2,6,'Pallof Press','CORE','3','10/side',null,null,null,'Anti-rotation'),
    (v_b3,7,'Assault Bike Intervals','CONDITIONING','5','2 min on / 2 min off',null,'20 min',null,'Zone 5 — the high-intensity 20%'),
    (v_b4,8,'Foam Roll Hamstrings','RECOVERY',null,null,null,'4 min',null,null),
    (v_b4,9,'Box Breathing','RECOVERY',null,null,null,'3 min',null,'4-4-4-4 downshift')
  ) as r(blk,so,name,tag,sets,reps,wt,dur,tempo,notes)
  join exercises e on e.user_id=v_user and e.name=r.name;

  -- THURSDAY (base)
  insert into program_days(program_id, phase_id, name, sort_order, day_of_week, focus)
  values(v_program, v_phase, 'Upper Power + Rotational Core', 3, 'Thursday', 'Spike power') returning id into v_day;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Upper Prep','warmup','18:00',10,0) returning id into v_b1;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Upper Power + Core','weight','18:10',55,1) returning id into v_b2;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Post-Lift Flexibility','mobility','19:10',15,2) returning id into v_b3;
  insert into program_day_exercises(program_day_id,block_id,exercise_id,sort_order,training_tag,sets_text,reps_text,weight_text,duration_text,tempo,notes)
  select v_day, r.blk, e.id, r.so, r.tag, r.sets, r.reps, r.wt, r.dur, r.tempo, r.notes
  from (values
    (v_b1,0,'Scap Push-Up','WARMUP','2','10',null,null,null,null),
    (v_b1,1,'Med Ball Chest Pass','WARMUP','2','6',null,null,null,'Light, primer'),
    (v_b2,2,'Med Ball Overhead Throw','POWER','5','3',null,null,null,'Explosive intent'),
    (v_b2,3,'Bench Press','STRENGTH','4','5','~80 kg / RPE 8',null,'2-0-1','Superset w/ Pull-Up'),
    (v_b2,4,'Pull-Up','STRENGTH','4','6','bodyweight',null,null,'Superset w/ Bench'),
    (v_b2,5,'Overhead Press','STRENGTH','3','6','~35 kg',null,null,null),
    (v_b2,6,'Cable Woodchop','CORE','3','10/side',null,null,null,'Rotational power'),
    (v_b2,7,'Dead Bug','CORE','3','8/side',null,null,null,'Anti-extension'),
    (v_b3,8,'Pec Stretch','MOBILITY','2',null,null,'60 s/side',null,null),
    (v_b3,9,'Lat Stretch','MOBILITY','2',null,null,'60 s/side',null,null),
    (v_b3,10,'Thoracic Rotation','MOBILITY','2',null,null,'45 s/side',null,null)
  ) as r(blk,so,name,tag,sets,reps,wt,dur,tempo,notes)
  join exercises e on e.user_id=v_user and e.name=r.name;
  select p.id into v_a from program_day_exercises p join exercises e on e.id=p.exercise_id where p.program_day_id=v_day and e.name='Bench Press';
  select p.id into v_bb from program_day_exercises p join exercises e on e.id=p.exercise_id where p.program_day_id=v_day and e.name='Pull-Up';
  insert into program_supersets(program_day_id, exercise_a_id, exercise_b_id) values(v_day, v_a, v_bb);

  -- THURSDAY (volleyball variant)
  insert into program_days(program_id, phase_id, name, sort_order, day_of_week, focus, is_variant, variant_group_key)
  values(v_program, v_phase, 'Volleyball (spike power)', 4, 'Thursday', 'Explosive primer + volleyball', true, 'Thursday') returning id into v_day;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Explosive Primer','warmup','18:00',15,0) returning id into v_b1;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Volleyball','sport','18:20',90,1) returning id into v_b2;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Post-Training Flexibility','mobility','20:00',15,2) returning id into v_b3;
  insert into program_day_exercises(program_day_id,block_id,exercise_id,sort_order,training_tag,sets_text,reps_text,weight_text,duration_text,tempo,notes)
  select v_day, r.blk, e.id, r.so, r.tag, r.sets, r.reps, r.wt, r.dur, r.tempo, r.notes
  from (values
    (v_b1,0,'Med Ball Throw','POWER','4','3',null,null,null,null),
    (v_b1,1,'Lateral Bound','POWER','4','4/side',null,null,null,null),
    (v_b1,2,'Pogo Hop','POWER','3','15',null,null,null,'Stiff ankles, fast contacts'),
    (v_b2,3,'Volleyball Play','SKILL',null,null,null,'90 min',null,'High intensity'),
    (v_b3,4,'Couch Stretch','MOBILITY','2',null,null,'2 min/side',null,'Hip flexors'),
    (v_b3,5,'Pec Stretch','MOBILITY','2',null,null,'60 s/side',null,null),
    (v_b3,6,'Lat Stretch','MOBILITY','2',null,null,'60 s/side',null,null)
  ) as r(blk,so,name,tag,sets,reps,wt,dur,tempo,notes)
  join exercises e on e.user_id=v_user and e.name=r.name;

  -- FRIDAY
  insert into program_days(program_id, phase_id, name, sort_order, day_of_week, focus)
  values(v_program, v_phase, 'Single-Leg + Pull + Lateral', 5, 'Friday', 'Most volleyball-specific lift') returning id into v_day;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Lateral Prep','warmup','18:00',10,0) returning id into v_b1;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Single-Leg + Pull + Lateral','weight','18:10',55,1) returning id into v_b2;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Cooldown','recovery','19:10',8,2) returning id into v_b3;
  insert into program_day_exercises(program_day_id,block_id,exercise_id,sort_order,training_tag,sets_text,reps_text,weight_text,duration_text,tempo,notes)
  select v_day, r.blk, e.id, r.so, r.tag, r.sets, r.reps, r.wt, r.dur, r.tempo, r.notes
  from (values
    (v_b1,0,'Lateral Lunge','WARMUP','2','8/side',null,null,null,null),
    (v_b1,1,'Skater Hop','WARMUP','2','6/side',null,null,null,'Landing control'),
    (v_b2,2,'Lateral Bound','POWER','5','4/side',null,null,null,'Volleyball-specific'),
    (v_b2,3,'Bulgarian Split Squat','STRENGTH','4','8/side',null,null,null,null),
    (v_b2,4,'Single-Arm DB Row','STRENGTH','3','10/side',null,null,null,null),
    (v_b2,5,'Copenhagen Plank','PREHAB','3','20 s/side',null,null,null,null),
    (v_b2,6,'Single-Leg Calf Raise','PREHAB','4','12/side',null,null,null,'Ankle resilience'),
    (v_b2,7,'Pallof Press','CORE','3','10/side',null,null,null,null),
    (v_b3,8,'Foam Roll Glutes','RECOVERY',null,null,null,'5 min',null,null)
  ) as r(blk,so,name,tag,sets,reps,wt,dur,tempo,notes)
  join exercises e on e.user_id=v_user and e.name=r.name;

  -- SATURDAY (base)
  insert into program_days(program_id, phase_id, name, sort_order, day_of_week, focus)
  values(v_program, v_phase, 'Tennis + Deep Flexibility', 6, 'Saturday', 'Deep flexibility/recovery') returning id into v_day;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Tennis Warm-up','warmup','09:00',10,0) returning id into v_b1;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Tennis','sport','09:10',60,1) returning id into v_b2;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Deep Flexibility','mobility','18:00',25,2) returning id into v_b3;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Sauna','recovery','19:00',20,3) returning id into v_b4;
  insert into program_day_exercises(program_day_id,block_id,exercise_id,sort_order,training_tag,sets_text,reps_text,weight_text,duration_text,tempo,notes)
  select v_day, r.blk, e.id, r.so, r.tag, r.sets, r.reps, r.wt, r.dur, r.tempo, r.notes
  from (values
    (v_b1,0,'Tennis Warm-Up Swings','WARMUP',null,null,null,'10 min',null,'Dynamic + shadow swings'),
    (v_b2,1,'Tennis Play','SKILL',null,null,null,'60 min',null,'Moderate intensity'),
    (v_b3,2,'Couch Stretch','MOBILITY','2',null,null,'2 min/side',null,'Hip flexors'),
    (v_b3,3,'Adductor Pancake','MOBILITY','2',null,null,'2 min',null,'Adductors'),
    (v_b3,4,'Hamstring PAILs','MOBILITY','2',null,null,'2 min/side',null,'Hamstrings'),
    (v_b3,5,'Standing Calf Stretch','MOBILITY','2',null,null,'60 s/side',null,'Calves'),
    (v_b3,6,'Pec Stretch','MOBILITY','2',null,null,'60 s/side',null,'Chest/shoulders'),
    (v_b3,7,'Thoracic Extension','MOBILITY','2',null,null,'90 s',null,'Thoracic spine'),
    (v_b4,8,'Sauna','RECOVERY',null,null,null,'20 min',null,'Skip on beach-VB weeks')
  ) as r(blk,so,name,tag,sets,reps,wt,dur,tempo,notes)
  join exercises e on e.user_id=v_user and e.name=r.name;

  -- SATURDAY (beach volleyball variant)
  insert into program_days(program_id, phase_id, name, sort_order, day_of_week, focus, is_variant, variant_group_key)
  values(v_program, v_phase, 'Tennis + Beach Volleyball', 7, 'Saturday', 'Tennis then beach VB (sauna skipped)', true, 'Saturday') returning id into v_day;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Tennis Warm-up','warmup','09:00',10,0) returning id into v_b1;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Tennis','sport','09:10',60,1) returning id into v_b2;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Beach VB Warm-up','warmup','11:00',10,2) returning id into v_b3;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Beach Volleyball','sport','11:10',90,3) returning id into v_b4;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Deep Flexibility','mobility','18:00',25,4) returning id into v_b5;
  insert into program_day_exercises(program_day_id,block_id,exercise_id,sort_order,training_tag,sets_text,reps_text,weight_text,duration_text,tempo,notes)
  select v_day, r.blk, e.id, r.so, r.tag, r.sets, r.reps, r.wt, r.dur, r.tempo, r.notes
  from (values
    (v_b1,0,'Tennis Warm-Up Swings','WARMUP',null,null,null,'10 min',null,null),
    (v_b2,1,'Tennis Play','SKILL',null,null,null,'60 min',null,null),
    (v_b3,2,'Lateral Shuffle','WARMUP','2','20 m',null,null,null,'Sand prep'),
    (v_b3,3,'Ankle Prep','WARMUP','2','10/side',null,null,null,null),
    (v_b4,4,'Beach Volleyball Play','SKILL',null,null,null,'90 min',null,'Sand — high ankle/calf demand'),
    (v_b5,5,'Couch Stretch','MOBILITY','2',null,null,'2 min/side',null,'Hip flexors'),
    (v_b5,6,'Adductor Pancake','MOBILITY','2',null,null,'2 min',null,'Adductors'),
    (v_b5,7,'Standing Calf Stretch','MOBILITY','2',null,null,'60 s/side',null,'Calves'),
    (v_b5,8,'Pec Stretch','MOBILITY','2',null,null,'60 s/side',null,null)
  ) as r(blk,so,name,tag,sets,reps,wt,dur,tempo,notes)
  join exercises e on e.user_id=v_user and e.name=r.name;

  -- SUNDAY
  insert into program_days(program_id, phase_id, name, sort_order, day_of_week, focus)
  values(v_program, v_phase, 'Tennis + Volleyball (peak)', 8, 'Sunday', 'Highest-load day') returning id into v_day;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Warm-up','warmup','09:00',10,0) returning id into v_b1;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Tennis','sport','09:10',60,1) returning id into v_b2;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Volleyball','sport','11:00',90,2) returning id into v_b3;
  insert into program_day_blocks(program_day_id,name,block_type,scheduled_time,duration_minutes,sort_order) values(v_day,'Recovery','recovery','20:00',15,3) returning id into v_b4;
  insert into program_day_exercises(program_day_id,block_id,exercise_id,sort_order,training_tag,sets_text,reps_text,weight_text,duration_text,tempo,notes)
  select v_day, r.blk, e.id, r.so, r.tag, r.sets, r.reps, r.wt, r.dur, r.tempo, r.notes
  from (values
    (v_b1,0,'Dynamic Warm-Up','WARMUP',null,null,null,'10 min',null,'Full-body prep'),
    (v_b2,1,'Tennis Play','SKILL',null,null,null,'60 min',null,null),
    (v_b3,2,'Volleyball Play','SKILL',null,null,null,'90 min',null,'High intensity — the 20%'),
    (v_b4,3,'Legs-Up-Wall','RECOVERY',null,null,null,'10 min',null,null),
    (v_b4,4,'Nutrition Window','RECOVERY',null,null,null,null,null,'Protein + carbs post-session; early sleep')
  ) as r(blk,so,name,tag,sets,reps,wt,dur,tempo,notes)
  join exercises e on e.user_id=v_user and e.name=r.name;
end $$;;
