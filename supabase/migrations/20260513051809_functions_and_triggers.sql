
-- Compute cycle week for a given program enrollment and date
create or replace function cycle_week(
  p_start_date date,
  p_cycle_length int,
  p_check_date date default current_date
) returns int as $$
  select ((floor((p_check_date - p_start_date)::int / 7)::int) % (p_cycle_length + 1)) + 1;
$$ language sql immutable;
comment on function cycle_week is 'Returns 1-based week number within the training cycle. Week = cycle_length is deload.';

-- Check if a date falls in a deload week
create or replace function is_deload_date(
  p_start_date date,
  p_cycle_length int,
  p_deload_week int,
  p_check_date date default current_date
) returns boolean as $$
  select cycle_week(p_start_date, p_cycle_length, p_check_date) = p_deload_week;
$$ language sql immutable;

-- Total volume for a session exercise (excludes warmup sets)
create or replace function session_exercise_volume(p_session_exercise_id uuid)
returns decimal as $$
  select coalesce(sum(weight * reps), 0)
  from session_sets
  where session_exercise_id = p_session_exercise_id
    and is_warmup = false;
$$ language sql stable;

-- updated_at auto-maintenance
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to every table that has an updated_at column
do $$
declare
  t text;
begin
  for t in
    select table_name from information_schema.columns
    where column_name = 'updated_at'
      and table_schema = 'public'
  loop
    execute format(
      'create trigger trg_%s_updated_at before update on %I
       for each row execute function update_updated_at()',
      t, t
    );
  end loop;
end;
$$ language plpgsql;
;
