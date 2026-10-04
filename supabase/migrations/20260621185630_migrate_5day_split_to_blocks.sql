-- Backfill: wrap each legacy flat day of the "5-Day High Efficiency Split"
-- into a single weight block, tagging its exercises STRENGTH. No phase is
-- added so the program stays sequential (index mode), preserving behavior.
do $$
declare
  d record;
  bid uuid;
begin
  for d in
    select id, name from program_days
    where program_id = 'de96fb1e-a1e2-4e20-8fa0-67728954d19d'
    order by sort_order
  loop
    if not exists (select 1 from program_day_blocks where program_day_id = d.id) then
      insert into program_day_blocks (program_day_id, name, block_type, sort_order)
      values (d.id, d.name, 'weight', 0)
      returning id into bid;

      update program_day_exercises
      set block_id = bid,
          training_tag = coalesce(training_tag, 'STRENGTH')
      where program_day_id = d.id and block_id is null;
    end if;
  end loop;
end $$;;
