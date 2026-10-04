do $$
declare
  rec record;
  dup_id uuid;
  canon_id uuid;
begin
  for rec in
    select * from (values
      ('Push ups','Push-ups'),
      ('Pull-Up','Pull-ups'),
      ('Pogo Hop','Pogo Hops')
    ) as t(dup, canon)
  loop
    select id into dup_id   from exercises where name = rec.dup;
    select id into canon_id from exercises where name = rec.canon;
    if dup_id is null or canon_id is null then
      continue;
    end if;

    -- repoint all references from the duplicate to the canonical exercise
    update session_exercises       set exercise_id = canon_id where exercise_id = dup_id;
    update program_day_exercises   set exercise_id = canon_id where exercise_id = dup_id;
    update mobility_exercises       set exercise_id = canon_id where exercise_id = dup_id;
    update goals                    set exercise_id = canon_id where exercise_id = dup_id;
    update habits                   set exercise_id = canon_id where exercise_id = dup_id;
    update progression_adjustments  set exercise_id = canon_id where exercise_id = dup_id;

    -- canonical already carries equivalent muscle links → drop the duplicate's (PK would collide)
    delete from exercise_muscle_groups where exercise_id = dup_id;

    delete from exercises where id = dup_id;
  end loop;
end $$;;
