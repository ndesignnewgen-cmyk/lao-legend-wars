-- Lao Legend Wars · phase F7: safety (block, report, account delete) and the owner's admin tools.
-- Paste into Supabase > SQL Editor > New query, then Run. Safe to run again. Needs f1–f6 first.
-- Admins: the account named 'Nou' (change the name in the insert below to add someone else).
-- Banned players cannot search, challenge or add friends. Blocked players are never paired with you and cannot
-- send you friend requests or challenges. Reports use fixed reasons only (no free text from children).

create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;
insert into public.admins (user_id) select id from public.profiles where lower(name) = 'nou' on conflict do nothing;

alter table public.profiles add column if not exists banned boolean not null default false;

create table if not exists public.blocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  blocked uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked)
);
alter table public.blocks enable row level security;
revoke all on public.blocks from anon, authenticated;

create table if not exists public.reports (
  id bigserial primary key,
  reporter uuid not null references auth.users(id) on delete cascade,
  target uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('name', 'cheat', 'quit', 'mean', 'other')),
  room text,
  open boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;

-- game-wide settings the admin can change (gem_mult: 1 normal, 2 double gems event)
create table if not exists public.config (key text primary key, value text not null);
insert into public.config (key, value) values ('gem_mult', '1') on conflict do nothing;
alter table public.config enable row level security;
revoke all on public.config from anon, authenticated;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$ select exists (select 1 from admins where user_id = auth.uid()) $$;
create or replace function public.blocked_either(x uuid, y uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks where (user_id = x and blocked = y) or (user_id = y and blocked = x))
$$;
create or replace function public.is_banned(x uuid) returns boolean
language sql stable security definer set search_path = public as $$ select coalesce((select banned from profiles where id = x), false) $$;

-- ---------- players ----------
create or replace function public.block_set(other uuid, yes boolean) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null or other = u then return; end if;
  if yes then
    insert into blocks (user_id, blocked) values (u, other) on conflict do nothing;
    delete from friends where (a = u and b = other) or (a = other and b = u);
    delete from invites where (src = other and dst = u) or (src = u and dst = other);
  else delete from blocks where user_id = u and blocked = other; end if;
end $$;

create or replace function public.block_list() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', p.id, 'name', p.name, 'avatar', p.avatar) order by p.name), '[]'::json)
  from blocks b join profiles p on p.id = b.blocked where b.user_id = auth.uid()
$$;

create or replace function public.report_add(target uuid, reason text, rm text default null) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null or target = u then return; end if;
  if (select count(*) from reports where reporter = u and created_at > now() - interval '1 day') >= 10 then raise exception 'too many reports' using errcode = 'P0012'; end if;
  insert into reports (reporter, target, reason, room) values (u, target, reason, left(rm, 12));
end $$;

-- the game reads these once at start (double gems events)
create or replace function public.config_get() returns json
language sql stable security definer set search_path = public as $$ select coalesce(json_object_agg(key, value), '{}'::json) from config $$;

-- delete my account: profile, wallet, cards, ranks, friends, history, saves (and the sign-in itself when allowed)
create or replace function public.account_delete() returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then return; end if;
  delete from mm_queue where user_id = u; delete from invites where src = u or dst = u; delete from friends where a = u or b = u;
  delete from blocks where user_id = u or blocked = u; delete from reports where reporter = u;
  delete from game_log where user_id = u; delete from ranks where user_id = u; delete from owned_cards where user_id = u;
  delete from wallets where user_id = u; delete from recovery where user_id = u; delete from saves where user_id = u;
  delete from profiles where id = u;
  begin delete from auth.users where id = u; exception when others then null; end;
end $$;

-- ---------- the rules from earlier phases, now aware of bans, blocks and the gem event ----------
create or replace function public.mm_join(lvl int, mode text default 'casual', deck jsonb default null) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); m int := 1000;
begin
  if u is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from profiles where id = u) then raise exception 'no profile' using errcode = 'P0006'; end if;
  if is_banned(u) then raise exception 'banned' using errcode = 'P0011'; end if;
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
    select * into other from mm_queue q
      where q.user_id <> u and q.room is null and q.mode = 'ranked' and q.seen_at > now() - interval '12 seconds' and abs(q.mmr - me.mmr) <= span
        and not blocked_either(u, q.user_id)
      order by q.created_at limit 1;
  else
    span := case when waited < 10 then 3 when waited < 30 then 8 else 99 end;
    select * into other from mm_queue q
      where q.user_id <> u and q.room is null and q.mode = 'casual' and q.seen_at > now() - interval '12 seconds' and abs(q.level - me.level) <= span
        and not blocked_either(u, q.user_id)
      order by q.created_at limit 1;
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

create or replace function public.friend_add(code text) returns text
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); t uuid;
begin
  if u is null then raise exception 'not signed in'; end if;
  if is_banned(u) then raise exception 'banned' using errcode = 'P0011'; end if;
  select id into t from profiles where fcode = upper(btrim(code));
  if t is null or blocked_either(u, t) then raise exception 'no such code' using errcode = 'P0008'; end if;
  if t = u then raise exception 'that is you' using errcode = 'P0009'; end if;
  if are_friends(u, t) then return 'already'; end if;
  if exists (select 1 from friends where a = t and b = u) then update friends set status = 'ok' where a = t and b = u; return 'ok'; end if;
  if (select count(*) from friends where a = u or b = u) >= 100 then raise exception 'too many friends' using errcode = 'P0010'; end if;
  insert into friends (a, b) values (u, t) on conflict do nothing;
  return 'sent';
end $$;

create or replace function public.invite_send(friend uuid, rm text) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if is_banned(u) then raise exception 'banned' using errcode = 'P0011'; end if;
  if not are_friends(u, friend) or blocked_either(u, friend) then raise exception 'not friends'; end if;
  delete from invites where src = u or created_at < now() - interval '10 minutes';
  insert into invites (src, dst, room) values (u, friend, upper(rm));
end $$;

-- game-end gems, now multiplied during a gem event (the daily cap grows with it)
create or replace function public.eco_game(won boolean, lvl int, opp int, stage int default null) returns json
language plpgsql security definer set search_path = public as $$
declare
  u uuid := auth.uid(); w wallets; top int; base int; bonus int := 0; xg int; lv int[];
  drop_id text; drop_res text; adv_gems int := 0; boss boolean;
  mult int := coalesce((select value::int from config where key = 'gem_mult'), 1);   -- 2 or 3 during a gem event
begin
  select * into w from wallets where user_id = u for update;
  if not found then raise exception 'no wallet'; end if;
  if w.last_game is not null and now() - w.last_game < interval '25 seconds' then raise exception 'too fast' using errcode = 'P0003'; end if;
  lvl := least(greatest(coalesce(lvl, 1), 0), 2);
  if w.day is distinct from current_date then w.day := current_date; w.day_gems := 0; w.day_xp := 0; end if;
  top := mult * case when won then (array[10, 20, 35])[lvl + 1] else 5 end;
  base := least(top, greatest(0, 300 * mult - w.day_gems));
  if won and w.first_win_day is distinct from current_date then bonus := 50 * mult; w.first_win_day := current_date; end if;
  xg := least(case when won then 40 else 20 end, greatest(0, 1500 - w.day_xp));
  if won and opp between 0 and 12 then
    if lvl = 2 and not (opp = any(w.hard_beat)) then
      w.hard_beat := w.hard_beat || opp;
      drop_id := (array['phayanak','hapkhanasouane','phralam','phayathaen','thaohung','phutthasen','kalaket','punyeu','kamkadam','suttharo','nagax','kratai','nangkaew'])[opp + 1];
    elsif random() < 0.3 then
      select id into drop_id from cards_catalog where opp = any(decks) and rarity <> 'legend' order by random() limit 1;
    end if;
  end if;
  if won and stage is not null and stage = w.adv and stage between 0 and 9 then
    boss := stage in (4, 9); adv_gems := case when boss then 100 else 40 end;
    w.adv := stage + 1; if boss then w.free_packs := w.free_packs + 1; end if;
  end if;
  update wallets set day = w.day, day_gems = w.day_gems + base, day_xp = w.day_xp + xg, first_win_day = w.first_win_day,
    gems = gems + base + bonus + adv_gems, hard_beat = w.hard_beat, adv = w.adv, free_packs = w.free_packs, last_game = now()
    where user_id = u;
  lv := eco_xp(u, xg);
  if drop_id is not null then drop_res := eco_give(u, drop_id); end if;
  return json_build_object('base', base, 'first', bonus, 'capped', base < top, 'xp', xg, 'lvFrom', lv[1], 'lvTo', lv[2],
    'drop', drop_id, 'dropRes', drop_res, 'advGems', adv_gems, 'state', eco_json(u));
end $$;

-- the history now carries the other player's id, so they can be blocked or reported from it
create or replace function public.history_list() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('opp', opp_name, 'oppId', opp_id, 'won', won, 'mode', mode, 'reason', reason, 'turns', turns, 'deck', deck, 'at', at) order by at desc), '[]'::json)
  from (select * from game_log where user_id = auth.uid() order by at desc limit 20) g
$$;

-- ---------- admin ----------
create or replace function public.admin_check() returns boolean language sql stable security definer set search_path = public as $$ select is_admin() $$;

create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  return json_build_object(
    'players', (select count(*) from profiles),
    'today', (select count(*) from profiles where last_seen > now() - interval '1 day'),
    'online', (select count(*) from profiles where last_seen > now() - interval '2 minutes'),
    'games', (select count(*) from game_log where at > now() - interval '1 day'),
    'ranked', (select count(*) from matches where created_at > now() - interval '1 day'),
    'reports', (select count(*) from reports where open),
    'banned', (select count(*) from profiles where banned),
    'gemMult', (select value from config where key = 'gem_mult'));
end $$;

-- find players by name or friend code
create or replace function public.admin_find(q text) returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  return coalesce((select json_agg(x) from (
    select p.id, p.name, p.avatar, p.fcode, p.banned, p.last_seen, w.gems, w.dust, w.xp,
      (select count(*) from owned_cards o where o.user_id = p.id and o.n > 0) as cards, r.tier, r.stars,
      (select count(*) from reports rp where rp.target = p.id and rp.open) as reports
    from profiles p left join wallets w on w.user_id = p.id left join ranks r on r.user_id = p.id
    where p.name ilike '%' || btrim(q) || '%' or p.fcode = upper(btrim(q))
    order by p.last_seen desc nulls last limit 20) x), '[]'::json);
end $$;

create or replace function public.admin_gems(target uuid, n int) returns int
language plpgsql security definer set search_path = public as $$
declare g int;
begin
  if not is_admin() then raise exception 'admins only'; end if;
  update wallets set gems = greatest(0, gems + n) where user_id = target returning gems into g;
  return g;
end $$;

drop function if exists public.admin_card(uuid, text, int);
create or replace function public.admin_card(target uuid, card text, copies int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if not exists (select 1 from cards_catalog where id = card) then raise exception 'no such card'; end if;
  insert into owned_cards (user_id, card_id, n) values (target, card, least(greatest(copies, 0), 3))
    on conflict (user_id, card_id) do update set n = least(greatest(copies, 0), 3);
end $$;

create or replace function public.admin_rename(target uuid, newname text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  update profiles set name = newname where id = target;
end $$;

create or replace function public.admin_ban(target uuid, yes boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  update profiles set banned = yes where id = target;
  if yes then delete from mm_queue where user_id = target; delete from invites where src = target; end if;
end $$;

create or replace function public.admin_reports() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  return coalesce((select json_agg(x order by x.n desc, x.last desc) from (
    select r.target as id, p.name, p.avatar, p.banned, count(*) as n, max(r.created_at) as last,
      json_agg(distinct r.reason) as reasons
    from reports r join profiles p on p.id = r.target where r.open group by r.target, p.name, p.avatar, p.banned) x), '[]'::json);
end $$;

create or replace function public.admin_report_close(target uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  update reports set open = false where reports.target = admin_report_close.target and open;
end $$;

create or replace function public.admin_words() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  return coalesce((select json_agg(word order by word) from banned_words), '[]'::json);
end $$;

create or replace function public.admin_word(w text, yes boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if yes then insert into banned_words (word) values (lower(btrim(w))) on conflict do nothing;
  else delete from banned_words where word = lower(btrim(w)); end if;
end $$;

create or replace function public.admin_config(k text, v text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if k = 'gem_mult' and v not in ('1', '2', '3') then raise exception 'bad value'; end if;
  insert into config (key, value) values (k, v) on conflict (key) do update set value = excluded.value;
end $$;

revoke execute on function public.is_admin(), public.blocked_either(uuid, uuid), public.is_banned(uuid) from public, anon, authenticated;
do $$ declare f text; begin
  foreach f in array array['block_set(uuid, boolean)', 'block_list()', 'report_add(uuid, text, text)', 'config_get()', 'account_delete()',
    'admin_check()', 'admin_stats()', 'admin_find(text)', 'admin_gems(uuid, int)', 'admin_card(uuid, text, int)', 'admin_rename(uuid, text)',
    'admin_ban(uuid, boolean)', 'admin_reports()', 'admin_report_close(uuid)', 'admin_words()', 'admin_word(text, boolean)', 'admin_config(text, text)'] loop
    execute 'revoke execute on function public.' || f || ' from public, anon';
    execute 'grant execute on function public.' || f || ' to authenticated';
  end loop;
end $$;
