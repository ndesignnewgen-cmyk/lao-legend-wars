-- Lao Legend Wars · phase F6: friends, challenges, game history and leaderboards.
-- Paste into Supabase > SQL Editor > New query, then Run. Safe to run again. Needs f1–f5 first.
-- Friend codes look like NAGA-4821. Adding a code sends a request; the other player accepts it (or adds yours back).
-- A challenge is a room code sent to an accepted friend. Online games are kept as a short history per player.

-- friend code and last time the game was open (for the green "online" dot)
alter table public.profiles add column if not exists fcode text;
alter table public.profiles add column if not exists last_seen timestamptz;
create unique index if not exists profiles_fcode_key on public.profiles (fcode);

create or replace function public.fcode_new() returns text
language plpgsql volatile set search_path = public as $$
declare w constant text[] := array['NAGA','XANG','SING','HONG','KHRUT','THAEN','KINNARI','HANUMAN','SINXAY','PHAYA','KHUN','PHADAENG'];
  c text;
begin
  loop
    c := w[1 + floor(random() * array_length(w, 1))::int] || '-' || lpad(floor(random() * 10000)::int::text, 4, '0');
    exit when not exists (select 1 from profiles where fcode = c);
  end loop;
  return c;
end $$;
update public.profiles set fcode = public.fcode_new() where fcode is null;

create or replace function public.profile_fcode() returns trigger language plpgsql security definer set search_path = public as $$
begin if new.fcode is null then new.fcode := fcode_new(); end if; return new; end $$;
drop trigger if exists profiles_fcode on public.profiles;
create trigger profiles_fcode before insert on public.profiles for each row execute function public.profile_fcode();

-- a = who asked, b = who was asked; status 'pending' until b accepts
create table if not exists public.friends (
  a uuid not null references auth.users(id) on delete cascade,
  b uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'ok')),
  created_at timestamptz not null default now(),
  primary key (a, b)
);
alter table public.friends enable row level security;
revoke all on public.friends from anon, authenticated;

create table if not exists public.invites (
  id bigserial primary key,
  src uuid not null references auth.users(id) on delete cascade,
  dst uuid not null references auth.users(id) on delete cascade,
  room text not null,
  created_at timestamptz not null default now()
);
alter table public.invites enable row level security;
revoke all on public.invites from anon, authenticated;

create table if not exists public.game_log (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  opp_name text, opp_id uuid,
  won boolean not null, mode text not null, reason text, turns int, deck int,
  at timestamptz not null default now()
);
create index if not exists game_log_user on public.game_log (user_id, at desc);
alter table public.game_log enable row level security;
revoke all on public.game_log from anon, authenticated;

create or replace function public.are_friends(x uuid, y uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from friends where status = 'ok' and ((a = x and b = y) or (a = y and b = x)))
$$;

-- add a friend by code: a request, or the other half of a request they already sent you
create or replace function public.friend_add(code text) returns text
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); t uuid;
begin
  if u is null then raise exception 'not signed in'; end if;
  select id into t from profiles where fcode = upper(btrim(code));
  if t is null then raise exception 'no such code' using errcode = 'P0008'; end if;
  if t = u then raise exception 'that is you' using errcode = 'P0009'; end if;
  if are_friends(u, t) then return 'already'; end if;
  if exists (select 1 from friends where a = t and b = u) then update friends set status = 'ok' where a = t and b = u; return 'ok'; end if;
  if (select count(*) from friends where a = u or b = u) >= 100 then raise exception 'too many friends' using errcode = 'P0010'; end if;
  insert into friends (a, b) values (u, t) on conflict do nothing;
  return 'sent';
end $$;

create or replace function public.friend_answer(other uuid, yes boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if yes then update friends set status = 'ok' where a = other and b = auth.uid() and status = 'pending';
  else delete from friends where a = other and b = auth.uid() and status = 'pending'; end if;
end $$;

create or replace function public.friend_remove(other uuid) returns void
language sql security definer set search_path = public as $$
  delete from friends where (a = auth.uid() and b = other) or (a = other and b = auth.uid())
$$;

-- my friends and requests, with the online dot and ranked tier
create or replace function public.friend_list() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(x order by x.online desc, x.name), '[]'::json) from (
    select p.id, p.name, p.avatar,
      case when f.status = 'ok' then 'ok' when f.a = auth.uid() then 'out' else 'in' end as status,
      coalesce(p.last_seen > now() - interval '2 minutes', false) as online,
      r.tier, r.stars
    from friends f
    join profiles p on p.id = case when f.a = auth.uid() then f.b else f.a end
    left join ranks r on r.user_id = p.id and r.season = rank_season()
    where f.a = auth.uid() or f.b = auth.uid()
  ) x
$$;

-- invite a friend into a room; the friend's game checks for invites every few seconds
create or replace function public.invite_send(friend uuid, rm text) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if not are_friends(u, friend) then raise exception 'not friends'; end if;
  delete from invites where src = u or created_at < now() - interval '10 minutes';
  insert into invites (src, dst, room) values (u, friend, upper(rm));
end $$;

-- keeps "online" fresh and returns challenges from the last minute
create or replace function public.invite_poll() returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then return '[]'::json; end if;
  update profiles set last_seen = now() where id = u;
  return coalesce((select json_agg(json_build_object('id', i.id, 'room', i.room, 'from', p.name, 'avatar', p.avatar) order by i.created_at desc)
    from invites i join profiles p on p.id = i.src where i.dst = u and i.created_at > now() - interval '60 seconds'), '[]'::json);
end $$;

create or replace function public.invite_answer(inv bigint) returns void
language sql security definer set search_path = public as $$ delete from invites where id = inv and dst = auth.uid() $$;

-- the game history: each screen adds its own line after an online game (the last 50 are kept)
create or replace function public.history_add(opp_name text, opp_id uuid, won boolean, mode text, reason text, turns int, deck int) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then return; end if;
  insert into game_log (user_id, opp_name, opp_id, won, mode, reason, turns, deck)
    values (u, left(opp_name, 16), opp_id, won, case when mode = 'ranked' then 'ranked' else 'casual' end, left(reason, 12), least(greatest(turns, 0), 999), deck);
  delete from game_log where user_id = u and id not in (select id from game_log where user_id = u order by at desc limit 50);
end $$;

create or replace function public.history_list() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('opp', opp_name, 'won', won, 'mode', mode, 'reason', reason, 'turns', turns, 'deck', deck, 'at', at) order by at desc), '[]'::json)
  from (select * from game_log where user_id = auth.uid() order by at desc limit 20) g
$$;

-- leaderboards: this season's ranks, and ranked wins over the last 7 days (top 50, plus where I stand)
create or replace function public.board(kind text) returns json
language plpgsql stable security definer set search_path = public as $$
declare rows json; mine int;
begin
  if kind = 'week' then
    with w as (
      select case when result = 'host' then host else guest end as uid, count(*) as wins
      from matches where result in ('host', 'guest') and decided_at > now() - interval '7 days' group by 1
    ), ranked as (select uid, wins, rank() over (order by wins desc) as pos from w)
    select (select coalesce(json_agg(json_build_object('pos', pos, 'name', p.name, 'avatar', p.avatar, 'wins', wins, 'me', uid = auth.uid()) order by pos), '[]'::json)
              from (select * from ranked order by pos limit 50) t join profiles p on p.id = t.uid),
           (select pos from ranked where uid = auth.uid())
      into rows, mine;
  else
    with s as (
      select user_id as uid, tier, stars, wins, rank() over (order by tier desc, stars desc, wins desc) as pos
      from ranks where season = rank_season() and wins + losses > 0
    )
    select (select coalesce(json_agg(json_build_object('pos', pos, 'name', p.name, 'avatar', p.avatar, 'tier', tier, 'stars', stars, 'wins', wins, 'me', uid = auth.uid()) order by pos), '[]'::json)
              from (select * from s order by pos limit 50) t join profiles p on p.id = t.uid),
           (select pos from s where uid = auth.uid())
      into rows, mine;
  end if;
  return json_build_object('rows', rows, 'mine', mine);
end $$;

revoke execute on function public.fcode_new(), public.are_friends(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.friend_add(text), public.friend_answer(uuid, boolean), public.friend_remove(uuid), public.friend_list(),
  public.invite_send(uuid, text), public.invite_poll(), public.invite_answer(bigint),
  public.history_add(text, uuid, boolean, text, text, int, int), public.history_list(), public.board(text) from public, anon;
grant execute on function public.friend_add(text), public.friend_answer(uuid, boolean), public.friend_remove(uuid), public.friend_list(),
  public.invite_send(uuid, text), public.invite_poll(), public.invite_answer(bigint),
  public.history_add(text, uuid, boolean, text, text, int, int), public.history_list(), public.board(text) to authenticated;
