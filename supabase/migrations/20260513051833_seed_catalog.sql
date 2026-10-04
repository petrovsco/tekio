
insert into movement_patterns (name, description) values
  ('Horizontal Push',   'Pressing away from the torso horizontally (bench press, push-up)'),
  ('Horizontal Pull',   'Pulling toward the torso horizontally (row variations)'),
  ('Vertical Push',     'Pressing overhead (OHP, handstand push-up)'),
  ('Vertical Pull',     'Pulling downward or body upward (pull-up, lat pulldown)'),
  ('Hip Hinge',         'Hip-dominant extension (deadlift, RDL, good morning)'),
  ('Squat',             'Knee-dominant extension (back squat, front squat, leg press)'),
  ('Lunge',             'Single-leg stance patterns (walking lunge, split squat)'),
  ('Carry',             'Loaded locomotion (farmer walk, suitcase carry)'),
  ('Rotation',          'Torso rotation patterns (cable woodchop, Pallof press)'),
  ('Isolation — Upper', 'Single-joint upper body (curls, extensions, raises)'),
  ('Isolation — Lower', 'Single-joint lower body (calf raise, leg curl, leg extension)')
on conflict (name) do nothing;

insert into muscle_groups (name, body_region) values
  ('Quadriceps',        'lower'),
  ('Hamstrings',        'lower'),
  ('Glutes',            'lower'),
  ('Calves',            'lower'),
  ('Adductors',         'lower'),
  ('Chest',             'upper'),
  ('Anterior Deltoid',  'upper'),
  ('Lateral Deltoid',   'upper'),
  ('Posterior Deltoid', 'upper'),
  ('Lats',              'upper'),
  ('Upper Back / Traps','upper'),
  ('Rhomboids',         'upper'),
  ('Biceps',            'upper'),
  ('Triceps',           'upper'),
  ('Forearms',          'upper'),
  ('Rectus Abdominis',  'core'),
  ('Obliques',          'core'),
  ('Erectors',          'core'),
  ('Hip Flexors',       'lower'),
  ('Rotator Cuff',      'upper')
on conflict (name) do nothing;
;
