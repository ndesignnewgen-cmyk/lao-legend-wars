-- Lao Legend Wars · F19: ເສັ້ນທາງຕຳນານ, levels 1-100 with rewards (2026-11-01).
-- Run after f1–f18. Safe to run again. The browser (index.html: lvStart, lvReward) uses the same numbers.
-- XP: 100 a level up to level 30, then 15 more for each level after it (level 100 at 47,175 XP).
-- Every level: 100 gems (31-60: 150, 61-100: 200). Every 5th level: +100 gems, a free pack and dust (50/100/150).
-- Level 10: +1 pack, level 40: +2 packs, level 60: pick a special art, level 90: pick a legend card.
-- Titles, frames and card backs at 10..100 are read from the level by the game; nothing to store for them.
begin;

alter table public.wallets add column if not exists lv_picks text[] not null default '{}';
alter table public.wallets add column if not exists lv_paid int;
-- the levels already paid by the old rules (100 XP a level, at most 30)
update public.wallets set lv_paid = least(30, xp / 100 + 1) where lv_paid is null;
alter table public.wallets alter column lv_paid set default 1;
alter table public.wallets alter column lv_paid set not null;

create or replace function public.lv_start(l int) returns int
language sql immutable as $$
  select case when l <= 30 then 100 * (l - 1) else 2900 + 100 * (l - 30) + 15 * (l - 30) * (l - 29) / 2 end
$$;
create or replace function public.lv_of(x int) returns int
language sql immutable as $$
  select coalesce(max(l), 1) from generate_series(1, 100) l where public.lv_start(l) <= coalesce(x, 0)
$$;

-- what reaching level l pays
create or replace function public.lv_pay(u uuid, l int) returns void
language plpgsql security definer set search_path = public as $$
declare five boolean := l % 5 = 0;
begin
  update wallets set
    gems = gems + case when l <= 30 then 100 when l <= 60 then 150 else 200 end + case when five then 100 else 0 end,
    dust = dust + case when not five then 0 when l <= 30 then 50 when l <= 60 then 100 else 150 end,
    free_packs = free_packs + case when five then 1 else 0 end + case l when 10 then 1 when 40 then 2 else 0 end,
    lv_picks = lv_picks || case l when 60 then array['alt'] when 90 then array['legend'] else '{}'::text[] end
  where user_id = u;
end $$;

-- pay every level reached but not paid yet; returns {paid before, level now}
create or replace function public.lv_catch(u uuid) returns int[]
language plpgsql security definer set search_path = public as $$
declare p int; b int; l int;
begin
  select lv_paid, lv_of(xp) into p, b from wallets where user_id = u for update;
  if not found then return array[1, 1]; end if;
  for l in p + 1 .. b loop perform lv_pay(u, l); end loop;
  if b > p then update wallets set lv_paid = b where user_id = u; end if;
  return array[p, greatest(p, b)];
end $$;

-- XP with its level rewards; returns {from, to} as before
create or replace function public.eco_xp(u uuid, n int) returns int[]
language plpgsql security definer set search_path = public as $$
begin
  update wallets set xp = xp + n where user_id = u;
  return lv_catch(u);
end $$;

-- the game asks after loading, so levels reached by XP from before this file are paid too
create or replace function public.lv_claim() returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); lv int[];
begin
  if u is null then raise exception 'not signed in' using errcode = '42501'; end if;
  lv := lv_catch(u);
  return json_build_object('lvFrom', lv[1], 'lvTo', lv[2], 'state', eco_json(u));
end $$;

-- a level 60 / 90 prize: choose the card. 'alt' = a special art (and the card if not owned yet), 'legend' = one legend card.
create or replace function public.lv_pick(kind text, card text) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); picks text[]; pos int; c cards_catalog; have int; isalt boolean;
begin
  if u is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select lv_picks into picks from wallets where user_id = u for update;
  pos := array_position(picks, kind);
  if pos is null then raise exception 'no pick' using errcode = 'P0031'; end if;
  select * into c from cards_catalog where id = card;
  if not found then raise exception 'bad card' using errcode = 'P0032'; end if;
  select n, alt into have, isalt from owned_cards where user_id = u and card_id = card;
  if kind = 'alt' then
    if not c.has_alt or coalesce(isalt, false) then raise exception 'bad card' using errcode = 'P0032'; end if;
    insert into owned_cards (user_id, card_id, n, alt) values (u, card, 1, true)
      on conflict (user_id, card_id) do update set alt = true, n = greatest(owned_cards.n, 1);
  elsif kind = 'legend' then
    if c.rarity <> 'legend' or not c.packable or coalesce(have, 0) >= 3 then raise exception 'bad card' using errcode = 'P0032'; end if;
    perform eco_give(u, card);
  else
    raise exception 'no pick' using errcode = 'P0031';
  end if;
  update wallets set lv_picks = picks[1:pos - 1] || picks[pos + 1:] where user_id = u;
  return json_build_object('card', card, 'state', eco_json(u));
end $$;

-- the wallet as the game reads it, now with the open level picks
create or replace function public.eco_json(u uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'gems', w.gems, 'dust', w.dust, 'xp', w.xp, 'freePacks', w.free_packs, 'pity', w.pity, 'packs', w.packs,
    'tutGems', w.tut, 'adv', w.adv, 'hardBeat', w.hard_beat, 'ach', w.ach, 'lvPicks', w.lv_picks, 'lvPaid', w.lv_paid,
    'cards', coalesce((select json_object_agg(card_id, n) from owned_cards where user_id = u and n > 0), '{}'::json),
    'alts', coalesce((select json_agg(card_id) from owned_cards where user_id = u and alt), '[]'::json))
  from wallets w where w.user_id = u
$$;

-- the ID card shows the level up to 100
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
  select lv_of(coalesce(w.xp, 0)) into lv from wallets w where w.user_id = pid;
  select count(*)::int into cards from owned_cards where user_id = pid and n > 0;
  select tier, stars, wins, losses into r from ranks where user_id = pid and season = rank_season();
  return json_build_object('id', p.id, 'name', p.name, 'avatar', p.avatar, 'frame', p.frame, 'title', p.title,
    'showcase', p.showcase, 'pstats', p.pstats, 'level', coalesce(lv, 1), 'cards', coalesce(cards, 0),
    'tier', r.tier, 'stars', r.stars, 'rwins', r.wins, 'rlosses', r.losses, 'since', p.created_at,
    'friend', friend and pid <> me, 'me', pid = me, 'fcode', case when friend then p.fcode end);
end $$;

revoke execute on function public.lv_pay(uuid, int), public.lv_catch(uuid), public.eco_xp(uuid, int), public.eco_json(uuid) from public, anon, authenticated;
revoke execute on function public.lv_claim(), public.lv_pick(text, text), public.profile_card(uuid) from public, anon;
grant execute on function public.lv_claim(), public.lv_pick(text, text), public.profile_card(uuid) to authenticated;

commit;
