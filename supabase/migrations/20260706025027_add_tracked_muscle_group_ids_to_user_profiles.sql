alter table user_profiles
  add column if not exists tracked_muscle_group_ids jsonb not null default '[]'::jsonb;;
