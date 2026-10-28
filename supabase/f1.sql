-- Lao Legend Wars · phase F1: player accounts and cloud save.
-- Paste into Supabase > SQL Editor > New query, then Run. Safe to run again.

-- words a player name may not contain; add more rows any time (Table Editor > banned_words)
create table if not exists public.banned_words (word text primary key);
alter table public.banned_words enable row level security;

-- one public profile per account (guest or linked)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 16),
  avatar text not null default 'phayanak',
  frame text not null default '',
  pet text,
  level int not null default 1,   -- set by the server only (phase F2)
  xp int not null default 0,      -- set by the server only (phase F2)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_name_key on public.profiles (lower(name));
alter table public.profiles enable row level security;

drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles for select to authenticated using (true);
drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- players may only write their name and looks; level and xp stay with the server
revoke insert, update on public.profiles from authenticated, anon;
grant insert (id, name, avatar, frame, pet) on public.profiles to authenticated;
grant update (name, avatar, frame, pet) on public.profiles to authenticated;

-- each account's saved game (collection, decks, gems, quests, pet, stats), kept small
create table if not exists public.saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 300000),
  updated_at timestamptz not null default now()
);
alter table public.saves enable row level security;
drop policy if exists "own save" on public.saves;
create policy "own save" on public.saves for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- keep updated_at fresh, and refuse names with a banned word
create or replace function public.touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.check_name() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.name = btrim(new.name);
  if exists (select 1 from public.banned_words b where position(lower(b.word) in lower(new.name)) > 0) then
    raise exception 'name not allowed' using errcode = '22023';
  end if;
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch();
drop trigger if exists profiles_name on public.profiles;
create trigger profiles_name before insert or update of name on public.profiles for each row execute function public.check_name();
drop trigger if exists saves_touch on public.saves;
create trigger saves_touch before update on public.saves for each row execute function public.touch();
