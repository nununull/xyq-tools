create table public.user_tool_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.sect_mission_daily_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null,
  stat_date date not null,
  account_name text not null,
  accumulated_ms bigint not null check (accumulated_ms >= 0),
  high_value_count integer not null check (high_value_count >= 0),
  completed boolean not null,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, account_id, stat_date)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_user_tool_states_updated_at before update on public.user_tool_states
for each row execute function public.set_updated_at();
create trigger set_sect_mission_daily_stats_updated_at before update on public.sect_mission_daily_stats
for each row execute function public.set_updated_at();

alter table public.user_tool_states enable row level security;
alter table public.sect_mission_daily_stats enable row level security;

create policy "用户读取自己的工具状态" on public.user_tool_states for select using ((select auth.uid()) = user_id);
create policy "用户新增自己的工具状态" on public.user_tool_states for insert with check ((select auth.uid()) = user_id);
create policy "用户更新自己的工具状态" on public.user_tool_states for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "用户删除自己的工具状态" on public.user_tool_states for delete using ((select auth.uid()) = user_id);
create policy "用户读取自己的师门统计" on public.sect_mission_daily_stats for select using ((select auth.uid()) = user_id);
create policy "用户新增自己的师门统计" on public.sect_mission_daily_stats for insert with check ((select auth.uid()) = user_id);
create policy "用户更新自己的师门统计" on public.sect_mission_daily_stats for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "用户删除自己的师门统计" on public.sect_mission_daily_stats for delete using ((select auth.uid()) = user_id);
