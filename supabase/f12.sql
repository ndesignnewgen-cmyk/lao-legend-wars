-- Lao Legend Wars · player ID card (2026-10-29): a title, three showcase cards and a small stats summary on the public
-- profile, one function that returns a player's ID card, and player ids on the leaderboards so a row can be opened.
-- Paste into Supabase > SQL Editor > New query, then Run. Safe to run again.
--
-- Also, for email + password sign-in (Authentication > Sign In / Providers > Email):
--   · keep "Enable Email provider" on,
--   · turn "Confirm email" OFF unless custom SMTP is set up (the built-in mailer only sends to the project team),
--   · minimum password length 8 is what the game asks for.

-- what a player shows to others: only short codes and numbers, never free text (the game turns them into words and pictures)
alter table public.profiles add column if not exists title text not null default '';
alter table public.profiles add column if not exists showcase text[] not null default '{}';
alter table public.profiles add column if not exists pstats jsonb not null default '{}'::jsonb;
alter table public.profiles drop constraint if exists profiles_title_ok;
alter table public.profiles add constraint profiles_title_ok check (title ~ '^[a-z0-9]{0,12}$');
alter table public.profiles drop constraint if exists profiles_showcase_ok;
alter table public.profiles add constraint profiles_showcase_ok check (
  coalesce(array_length(showcase, 1), 0) <= 3 and array_to_string(showcase, ',') ~ '^[a-z0-9,-]{0,90}$');
alter table public.profiles drop constraint if exists profiles_pstats_ok;
alter table public.profiles add constraint profiles_pstats_ok check (jsonb_typeof(pstats) = 'object' and pg_column_size(pstats) < 400);
alter table public.profiles drop constraint if exists profiles_frame_ok;
alter table public.profiles add constraint profiles_frame_ok check (frame ~ '^[a-z0-9]{0,12}$');

grant update (name, avatar, frame, pet, title, showcase, pstats) on public.profiles to authenticated;

-- a player's ID card. The friend code only goes to the player and their friends; a player who blocked you (or whom you
-- blocked) shows only a name and a picture.
create or replace function public.profile_card(pid uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare p profiles; me uuid := auth.uid(); friend boolean; blocked boolean; r record; lv int; cards int;
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  select * into p from profiles where id = pid; if not found then return null; end if;
  friend := pid = me or are_friends(me, pid);
  blocked := exists (select 1 from blocks where (user_id = me and blocked = pid) or (user_id = pid and blocked = me));
  if blocked and pid <> me then
    return json_build_object('id', p.id, 'name', p.name, 'avatar', p.avatar, 'blocked', true);
  end if;
  select least(30, floor(coalesce(w.xp, 0) / 100) + 1)::int into lv from wallets w where w.user_id = pid;
  select count(*)::int into cards from owned_cards where user_id = pid and n > 0;
  select tier, stars, wins, losses into r from ranks where user_id = pid and season = rank_season();
  return json_build_object('id', p.id, 'name', p.name, 'avatar', p.avatar, 'frame', p.frame, 'title', p.title,
    'showcase', p.showcase, 'pstats', p.pstats, 'level', coalesce(lv, 1), 'cards', coalesce(cards, 0),
    'tier', r.tier, 'stars', r.stars, 'rwins', r.wins, 'rlosses', r.losses, 'since', p.created_at,
    'friend', friend and pid <> me, 'me', pid = me, 'fcode', case when friend then p.fcode end);
end $$;
revoke execute on function public.profile_card(uuid) from public, anon;
grant execute on function public.profile_card(uuid) to authenticated;

-- the leaderboards again, now with each player's id
create or replace function public.board(kind text) returns json
language plpgsql stable security definer set search_path = public as $$
declare rows json; mine int;
begin
  if kind = 'week' then
    with w as (
      select case when result = 'host' then host else guest end as uid, count(*) as wins
      from matches where result in ('host', 'guest') and decided_at > now() - interval '7 days' group by 1
    ), ranked as (select uid, wins, rank() over (order by wins desc) as pos from w)
    select (select coalesce(json_agg(json_build_object('pos', pos, 'id', p.id, 'name', p.name, 'avatar', p.avatar, 'wins', wins, 'me', uid = auth.uid()) order by pos), '[]'::json)
              from (select * from ranked order by pos limit 50) t join profiles p on p.id = t.uid),
           (select pos from ranked where uid = auth.uid())
      into rows, mine;
  else
    with s as (
      select user_id as uid, tier, stars, wins, rank() over (order by tier desc, stars desc, wins desc) as pos
      from ranks where season = rank_season() and wins + losses > 0
    )
    select (select coalesce(json_agg(json_build_object('pos', pos, 'id', p.id, 'name', p.name, 'avatar', p.avatar, 'tier', tier, 'stars', stars, 'wins', wins, 'me', uid = auth.uid()) order by pos), '[]'::json)
              from (select * from s order by pos limit 50) t join profiles p on p.id = t.uid),
           (select pos from s where uid = auth.uid())
      into rows, mine;
  end if;
  return json_build_object('rows', rows, 'mine', mine);
end $$;
revoke execute on function public.board(text) from public, anon;
grant execute on function public.board(text) to authenticated;
