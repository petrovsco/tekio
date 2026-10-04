
-- Public catalog tables: readable by everyone, no user ownership
alter table movement_patterns enable row level security;
create policy "Everyone reads movement_patterns" on movement_patterns for select using (true);

alter table muscle_groups enable row level security;
create policy "Everyone reads muscle_groups" on muscle_groups for select using (true);

-- user_profiles: keyed by id (not user_id)
alter table user_profiles enable row level security;
create policy "Users see own profile"    on user_profiles for select using (id = auth.uid());
create policy "Users modify own profile" on user_profiles for all    using (id = auth.uid());

-- Tables with a direct user_id column: standard owner-only policies.
-- Where is_system also exists, system rows (user_id IS NULL) are publicly readable.
do $$
declare
  t            text;
  has_is_system boolean;
begin
  for t in
    select distinct table_name
    from information_schema.columns
    where column_name = 'user_id'
      and table_schema = 'public'
      and table_name <> 'user_profiles'
    order by table_name
  loop
    execute format('alter table %I enable row level security', t);

    select exists(
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name  = t
        and column_name = 'is_system'
    ) into has_is_system;

    if has_is_system then
      execute format(
        $p$create policy "Users see own data" on %I for select using (
             user_id = auth.uid() or (user_id is null and is_system = true)
           )$p$, t
      );
    else
      execute format(
        $p$create policy "Users see own data" on %I for select using (
             user_id = auth.uid()
           )$p$, t
      );
    end if;

    execute format(
      $p$create policy "Users modify own data" on %I for all using (
           user_id = auth.uid()
         )$p$, t
    );
  end loop;
end;
$$ language plpgsql;

-- Child tables have no direct user_id; they're protected by FK to a parent row.
-- Permissive for MVP (v1 is single-user, no auth). Tighten in v1.1.
do $$
declare
  t text;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'public'
      and tablename not in (
        select distinct table_name
        from information_schema.columns
        where column_name = 'user_id' and table_schema = 'public'
      )
      and tablename not in ('movement_patterns', 'muscle_groups')
    order by tablename
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      $p$create policy "MVP open — tighten in v1.1" on %I for all using (true)$p$, t
    );
  end loop;
end;
$$ language plpgsql;

-- Programs: also allow reading public programs (OR'd with "Users see own data")
create policy "Public programs readable" on programs
  for select using (visibility = 'public' or user_id = auth.uid());
;
