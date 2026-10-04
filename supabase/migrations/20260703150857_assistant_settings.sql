create table public.assistant_settings (
  user_id    uuid primary key references public.user_profiles(id) on delete cascade,
  provider   text not null default 'gemini',
  api_key    text,
  model      text not null default 'gemini-2.5-flash',
  updated_at timestamptz not null default now()
);
alter table public.assistant_settings enable row level security;
comment on table public.assistant_settings is 'Per-user LLM assistant config (API key + provider + model). RLS enabled with no policies so only the service_role (edge functions) can read/write; the browser anon key can never see the api_key.';;
