-- ============================================================
-- VV Pernis – Goal van de Maand
-- Plak dit hele bestand in Supabase: SQL Editor -> New query -> Run
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Admins ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ---------- Stemrondes ----------
create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  title text not null,                       -- bv. "Oktober 2026"
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  published boolean not null default false,  -- zichtbaar voor supporters
  winner_goal_id uuid,
  created_at timestamptz not null default now(),
  constraint rounds_dates check (ends_at > starts_at)
);
alter table public.rounds enable row level security;

-- ---------- Goals ----------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds on delete cascade,
  player_name text not null,
  team text,                 -- bv. "Zaterdag 1"
  opponent text,             -- bv. "SC Feyenoord"
  match_date date,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists goals_round_idx on public.goals (round_id);
alter table public.goals enable row level security;

do $$ begin
  alter table public.rounds
    add constraint rounds_winner_fk foreign key (winner_goal_id)
    references public.goals (id) on delete set null;
exception when duplicate_object then null; end $$;

-- ---------- Video's per goal (meerdere camerahoeken) ----------
create table if not exists public.goal_videos (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals on delete cascade,
  label text not null default 'Veo',  -- bv. "Veo", "Camera", "Achter de goal"
  video_path text not null,           -- pad in storage bucket 'goal-videos'
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists goal_videos_goal_idx on public.goal_videos (goal_id);
alter table public.goal_videos enable row level security;

-- Migratie voor wie de eerste versie van dit schema al had gedraaid:
-- bestaande goals.video_path verhuizen naar goal_videos.
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'goals' and column_name = 'video_path') then
    insert into public.goal_videos (goal_id, label, video_path)
    select id, 'Veo', video_path from public.goals where video_path is not null;
    alter table public.goals drop column video_path;
  end if;
end $$;

-- ---------- Stemmen ----------
-- Eén rij per e-mailadres per ronde. Een stem telt pas als confirmed_at gevuld is.
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds on delete cascade,
  goal_id uuid not null references public.goals on delete cascade,
  email text not null,
  token_hash text not null unique,
  ip_hash text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint votes_one_per_email unique (round_id, email)
);
create index if not exists votes_goal_idx on public.votes (goal_id);
create index if not exists votes_ip_idx on public.votes (ip_hash, created_at);
alter table public.votes enable row level security;
-- Geen publieke policies: stemmen worden alleen server-side (service role) geschreven.

-- ---------- Policies ----------
drop policy if exists "public read published rounds" on public.rounds;
create policy "public read published rounds" on public.rounds
  for select using (published or public.is_admin());

drop policy if exists "admins manage rounds" on public.rounds;
create policy "admins manage rounds" on public.rounds
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read goals" on public.goals;
create policy "public read goals" on public.goals
  for select using (
    public.is_admin()
    or exists (select 1 from public.rounds r where r.id = round_id and r.published)
  );

drop policy if exists "admins manage goals" on public.goals;
create policy "admins manage goals" on public.goals
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read goal videos" on public.goal_videos;
create policy "public read goal videos" on public.goal_videos
  for select using (
    public.is_admin()
    or exists (select 1 from public.goals g join public.rounds r on r.id = g.round_id
               where g.id = goal_id and r.published)
  );

drop policy if exists "admins manage goal videos" on public.goal_videos;
create policy "admins manage goal videos" on public.goal_videos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Uitslag ----------
-- Supporters zien de aantallen pas als er een winnaar is aangewezen; admins altijd.
create or replace function public.round_results(p_round uuid)
returns table (goal_id uuid, confirmed bigint, pending bigint)
language sql stable security definer set search_path = public
as $$
  select g.id,
         count(v.id) filter (where v.confirmed_at is not null),
         count(v.id) filter (where v.confirmed_at is null)
  from public.goals g
  left join public.votes v on v.goal_id = g.id
  where g.round_id = p_round
    and (
      public.is_admin()
      or exists (select 1 from public.rounds r
                 where r.id = p_round and r.published and r.winner_goal_id is not null)
    )
  group by g.id;
$$;

-- ---------- Video-opslag ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('goal-videos', 'goal-videos', true, 52428800,  -- 50 MB per bestand (max op gratis plan)
        array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;

drop policy if exists "admins upload videos" on storage.objects;
create policy "admins upload videos" on storage.objects
  for insert to authenticated with check (bucket_id = 'goal-videos' and public.is_admin());

drop policy if exists "admins update videos" on storage.objects;
create policy "admins update videos" on storage.objects
  for update to authenticated using (bucket_id = 'goal-videos' and public.is_admin());

drop policy if exists "admins delete videos" on storage.objects;
create policy "admins delete videos" on storage.objects
  for delete to authenticated using (bucket_id = 'goal-videos' and public.is_admin());

-- ============================================================
-- Jezelf admin maken (eenmalig, na het aanmaken van je gebruiker
-- in Authentication -> Users -> Add user):
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'jouw@email.nl';
-- ============================================================
