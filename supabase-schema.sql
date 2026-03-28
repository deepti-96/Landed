create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  profile jsonb not null default '{}'::jsonb,
  plan jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "Users can view their own roadmap"
on public.user_profiles
for select
using (auth.uid() = user_id);

create policy "Users can insert their own roadmap"
on public.user_profiles
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own roadmap"
on public.user_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
