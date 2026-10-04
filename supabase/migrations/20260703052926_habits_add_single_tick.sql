alter table public.habits add column if not exists single_tick boolean not null default true;

comment on column public.habits.single_tick is 'Manual (auto_source=none) habits only: true = one-tap check-off, false = +1 counter.';;
