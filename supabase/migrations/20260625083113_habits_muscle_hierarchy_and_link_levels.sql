-- 1a. Muscle hierarchy: self-referencing parent
alter table muscle_groups add column if not exists parent_id uuid references muscle_groups(id);

-- Seed 6 parent groups (idempotent on name)
insert into muscle_groups (name, body_region) values
  ('Shoulders','upper'),
  ('Back','upper'),
  ('Arms','upper'),
  ('Core','core'),
  ('Legs','lower')
on conflict (name) do nothing;
-- Chest already exists as a leaf; it stays top-level (parent_id null).

-- Re-parent existing leaves
update muscle_groups c set parent_id = p.id
from muscle_groups p
where p.name = 'Shoulders'
  and c.name in ('Anterior Deltoid','Lateral Deltoid','Posterior Deltoid','Rotator Cuff');

update muscle_groups c set parent_id = p.id
from muscle_groups p
where p.name = 'Back'
  and c.name in ('Lats','Rhomboids','Upper Back / Traps');

update muscle_groups c set parent_id = p.id
from muscle_groups p
where p.name = 'Arms'
  and c.name in ('Biceps','Triceps','Forearms');

update muscle_groups c set parent_id = p.id
from muscle_groups p
where p.name = 'Core'
  and c.name in ('Rectus Abdominis','Obliques','Erectors');

update muscle_groups c set parent_id = p.id
from muscle_groups p
where p.name = 'Legs'
  and c.name in ('Quadriceps','Hamstrings','Glutes','Calves','Adductors','Hip Flexors');

-- 1b. Exercise->muscle impact level + stimulus/recovery contribution
alter table exercise_muscle_groups add column if not exists level smallint not null default 1 check (level between 1 and 3);
alter table exercise_muscle_groups add column if not exists contribution text not null default 'stimulus' check (contribution in ('stimulus','recovery'));;
