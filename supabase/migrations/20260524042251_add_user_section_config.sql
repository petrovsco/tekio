
create table user_section_config (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references user_profiles(id) on delete cascade,
  section_key  text not null,
  show_in_menu boolean not null default true,
  show_in_home boolean not null default true,
  sort_order   int     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (user_id, section_key)
);

create index idx_section_config_user on user_section_config(user_id);

alter table user_section_config enable row level security;

create policy "Users see own section config" on user_section_config
  for select using (user_id = auth.uid());

create policy "Users modify own section config" on user_section_config
  for all using (user_id = auth.uid());

create trigger trg_user_section_config_updated_at
  before update on user_section_config
  for each row execute function update_updated_at();
;
