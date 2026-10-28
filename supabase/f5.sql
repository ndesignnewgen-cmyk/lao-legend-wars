-- Lao Legend Wars · phase F5: ranked play (ໂໝດແຣງ).
-- Paste into Supabase > SQL Editor > New query, then Run. Safe to run again. Needs f1, f2 and f4 first.
-- Tiers 0–6 (ຊາວນາ, ນັກຮົບ, ຂຸນ, ພະຍາ, ພະຍານາກ, ເທວະດາ, ຕຳນານ), 3 stars each; a win is +1 star, a loss −1 star,
-- and a tier once reached is never lost during a season. A hidden MMR (Elo) pairs players of similar strength.
-- Seasons are two calendar months, named after the Lao festival in them. Ranked decks may only use owned cards.
-- A ranked result counts only when both screens report the same winner (and, for a normal finish, the same final
-- state); a player who never reports within 2 minutes is taken to have left.

create table if not exists public.ranks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  season text not null,
  tier int not null default 0, stars int not null default 0,
  best int not null default 0,          -- best tier this season (for the season reward)
  mmr int not null default 1000,
  wins int not null default 0, losses int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.ranks enable row level security;
drop policy if exists "ranks are public" on public.ranks;
create policy "ranks are public" on public.ranks for select to authenticated using (true);
revoke all on public.ranks from anon, authenticated;
grant select (user_id, season, tier, stars, best, wins, losses) on public.ranks to authenticated;   -- the MMR stays hidden

create table if not exists public.matches (
  room text primary key,
  season text not null,
  host uuid not null references auth.users(id) on delete cascade,
  guest uuid not null references auth.users(id) on delete cascade,
  host_deck jsonb, guest_deck jsonb,
  host_report jsonb, guest_report jsonb,
  result text,                          -- 'host' | 'guest' | 'void'
  first_report_at timestamptz,
  created_at timestamptz not null default now(), decided_at timestamptz
);
alter table public.matches add column if not exists first_report_at timestamptz;
alter table public.matches enable row level security;
revoke all on public.matches from anon, authenticated;

alter table public.mm_queue add column if not exists mode text not null default 'casual';
alter table public.mm_queue add column if not exists mmr int not null default 1000;
alter table public.mm_queue add column if not exists deck jsonb;

create or replace function public.rank_season(t timestamptz default now()) returns text
language sql stable as $$ select to_char(t, 'YYYY') || '-' || ceil(extract(month from t) / 2)::int $$;

-- the caller's rank, rolled into the current season when needed (one tier down, plus gems for last season's best)
create or replace function public.rank_state() returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); r ranks; cur text := rank_season(); reward int := 0; old_best int;
begin
  if u is null then raise exception 'not signed in'; end if;
  select * into r from ranks where user_id = u for update;
  if not found then
    insert into ranks (user_id, season) values (u, cur) returning * into r;
  elsif r.season <> cur then
    old_best := r.best; reward := 50 + 50 * old_best;
    update ranks set season = cur, tier = greatest(0, tier - 1), stars = 0, best = greatest(0, tier - 1), updated_at = now()
      where user_id = u returning * into r;
    update wallets set gems = gems + reward where user_id = u;
  end if;
  return json_build_object('season', r.season, 'tier', r.tier, 'stars', r.stars, 'best', r.best, 'wins', r.wins, 'losses', r.losses,
    'reward', reward, 'oldBest', old_best);
end $$;

-- may this deck be used in ranked: 30–40 cards, at most 3 of a card (legends 1), and only cards the player owns
create or replace function public.rank_deck_ok(u uuid, deck jsonb) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare total int; bad int;
begin
  if deck is null or jsonb_typeof(deck) <> 'object' then return false; end if;
  select coalesce(sum(e.value::int), 0) into total from jsonb_each_text(deck) e where e.value ~ '^\d+$';
  if total < 30 or total > 40 then return false; end if;
  select count(*) into bad from jsonb_each_text(deck) e
    left join cards_catalog c on c.id = e.key
    left join owned_cards o on o.user_id = u and o.card_id = e.key
    where e.value !~ '^\d+$' or c.id is null or e.value::int > coalesce(o.n, 0)
       or e.value::int > case when c.rarity = 'legend' then 1 else 3 end;
  return bad = 0;
end $$;

-- pairing: casual by level as before; ranked by MMR (±100, ±250 after 15 s, ±600 after 40 s, anyone after 60 s)
create or replace function public.mm_try(u uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me mm_queue; other mm_queue; waited numeric; span int; code text := 'M'; abc constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; i int;
begin
  perform pg_advisory_xact_lock(424242);
  select * into me from mm_queue where user_id = u;
  if not found then return json_build_object('gone', true); end if;
  if me.room is not null then return json_build_object('room', me.room, 'role', me.role, 'mode', me.mode); end if;
  waited := extract(epoch from now() - me.created_at);
  if me.mode = 'ranked' then
    span := case when waited < 15 then 100 when waited < 40 then 250 when waited < 60 then 600 else 100000 end;
    select * into other from mm_queue
      where user_id <> u and room is null and mode = 'ranked' and seen_at > now() - interval '12 seconds' and abs(mmr - me.mmr) <= span
      order by created_at limit 1;
  else
    span := case when waited < 10 then 3 when waited < 30 then 8 else 99 end;
    select * into other from mm_queue
      where user_id <> u and room is null and mode = 'casual' and seen_at > now() - interval '12 seconds' and abs(level - me.level) <= span
      order by created_at limit 1;
  end if;
  if found then
    for i in 1 .. 5 loop code := code || substr(abc, 1 + floor(random() * 31)::int, 1); end loop;
    update mm_queue set room = code, role = 'host' where user_id = other.user_id;
    update mm_queue set room = code, role = 'guest' where user_id = u;
    if me.mode = 'ranked' then
      insert into matches (room, season, host, guest, host_deck, guest_deck) values (code, rank_season(), other.user_id, u, other.deck, me.deck);
    end if;
    return json_build_object('room', code, 'role', 'guest', 'mode', me.mode);
  end if;
  return json_build_object('waiting', (select count(*) from mm_queue where room is null and mode = me.mode and seen_at > now() - interval '12 seconds'));
end $$;

drop function if exists public.mm_join(int);
create or replace function public.mm_join(lvl int, mode text default 'casual', deck jsonb default null) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); m int := 1000;
begin
  if u is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from profiles where id = u) then raise exception 'no profile' using errcode = 'P0006'; end if;
  if mode not in ('casual', 'ranked') then raise exception 'bad mode'; end if;
  if mode = 'ranked' then
    if not rank_deck_ok(u, deck) then raise exception 'deck not allowed' using errcode = 'P0007'; end if;
    perform rank_state();
    select mmr into m from ranks where user_id = u;
  end if;
  delete from mm_queue where seen_at < now() - interval '2 minutes';
  insert into mm_queue (user_id, level, mode, mmr, deck) values (u, least(greatest(coalesce(lvl, 1), 1), 30), mode, m, case when mode = 'ranked' then deck end)
    on conflict (user_id) do update set level = excluded.level, mode = excluded.mode, mmr = excluded.mmr, deck = excluded.deck,
      room = null, role = null, created_at = now(), seen_at = now();
  return mm_try(u);
end $$;

-- apply a decided result: stars (a tier once reached is kept), Elo MMR, wins and losses
create or replace function public.rank_apply(mt matches) returns void
language plpgsql security definer set search_path = public as $$
declare w uuid; l uuid; rw ranks; rl ranks; e numeric;
begin
  if mt.result not in ('host', 'guest') then return; end if;
  w := case when mt.result = 'host' then mt.host else mt.guest end;
  l := case when mt.result = 'host' then mt.guest else mt.host end;
  perform 1 from ranks where user_id in (w, l) for update;
  select * into rw from ranks where user_id = w; select * into rl from ranks where user_id = l;
  e := 1 / (1 + power(10, (rl.mmr - rw.mmr) / 400.0));
  update ranks set wins = wins + 1, mmr = mmr + round(32 * (1 - e)),
    tier = case when tier < 6 and stars + 1 >= 3 then tier + 1 else tier end,
    stars = case when tier < 6 and stars + 1 >= 3 then 0 else stars + 1 end,
    best = greatest(best, case when tier < 6 and stars + 1 >= 3 then tier + 1 else tier end), updated_at = now()
    where user_id = w;
  update ranks set losses = losses + 1, mmr = greatest(100, mmr - round(32 * (1 - e))), stars = greatest(0, stars - 1), updated_at = now()
    where user_id = l;
end $$;

-- a screen reports how a ranked game ended: {winner:'host'|'guest', reason, sig, decks:{host, guest}}
-- both reports agree -> applied; they disagree (or the decks are not the ones queued) -> void; only one -> wait,
-- and after 2 minutes the lone report stands (the other screen left)
create or replace function public.rank_report(rm text, rep jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); mt matches; side text; a jsonb; b jsonb; normal boolean; ok boolean;
begin
  select * into mt from matches where room = rm for update;
  if not found then raise exception 'no match'; end if;
  side := case when u = mt.host then 'host' when u = mt.guest then 'guest' end;
  if side is null then raise exception 'not your match'; end if;
  if mt.result is null and rep is not null then
    if side = 'host' and mt.host_report is null then update matches set host_report = rep, first_report_at = coalesce(first_report_at, now()) where room = rm returning * into mt; end if;
    if side = 'guest' and mt.guest_report is null then update matches set guest_report = rep, first_report_at = coalesce(first_report_at, now()) where room = rm returning * into mt; end if;
  end if;
  if mt.result is null then
    a := mt.host_report; b := mt.guest_report;
    if a is not null and b is not null then
      normal := (a->>'reason') in ('life', 'deck') and (b->>'reason') in ('life', 'deck');
      ok := a->>'winner' = b->>'winner' and (a->>'winner') in ('host', 'guest') and (not normal or a->>'sig' = b->>'sig')
            and a->'decks'->'host' = mt.host_deck and a->'decks'->'guest' = mt.guest_deck
            and b->'decks'->'host' = mt.host_deck and b->'decks'->'guest' = mt.guest_deck;
      update matches set result = case when ok then a->>'winner' else 'void' end, decided_at = now() where room = rm returning * into mt;
      perform rank_apply(mt);
    end if;
  end if;
  return json_build_object('result', mt.result, 'side', side, 'rank', (select json_build_object('tier', tier, 'stars', stars, 'wins', wins, 'losses', losses) from ranks where user_id = u));
end $$;

-- called again by a screen still waiting: a lone report stands once the other screen has been silent for 2 minutes after it
create or replace function public.rank_settle(rm text) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); mt matches; lone jsonb; ok boolean;
begin
  select * into mt from matches where room = rm for update;
  if not found then raise exception 'no match'; end if;
  if u not in (mt.host, mt.guest) then raise exception 'not your match'; end if;
  if mt.result is null and (mt.host_report is null) <> (mt.guest_report is null) and now() - mt.first_report_at > interval '2 minutes' then
    lone := coalesce(mt.host_report, mt.guest_report);
    ok := (lone->>'winner') in ('host', 'guest') and lone->'decks'->'host' = mt.host_deck and lone->'decks'->'guest' = mt.guest_deck;
    update matches set result = case when ok then lone->>'winner' else 'void' end, decided_at = now() where room = rm returning * into mt;
    perform rank_apply(mt);
  end if;
  return rank_report(rm, null);
end $$;

revoke execute on function public.rank_deck_ok(uuid, jsonb), public.rank_apply(matches), public.mm_try(uuid) from public, anon, authenticated;
revoke execute on function public.rank_state(), public.mm_join(int, text, jsonb), public.rank_report(text, jsonb), public.rank_settle(text) from public, anon;
grant execute on function public.rank_state(), public.mm_join(int, text, jsonb), public.rank_report(text, jsonb), public.rank_settle(text) to authenticated;
