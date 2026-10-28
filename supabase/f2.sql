-- Lao Legend Wars · phase F2: gems, cards, XP and levels kept by the server, so they cannot be edited in the browser.
-- Paste into Supabase > SQL Editor > New query, then Run. Safe to run again (the card list is refreshed each time).
-- Players change their wallet only through the eco_* functions below; the rules mirror the game's (index.html).

-- every collectible card: rarity, whether packs can give it, neutral, has a special art, and the decks (DECKS index) it belongs to
create table if not exists public.cards_catalog (
  id text primary key, rarity text not null, packable boolean not null, neutral boolean not null, has_alt boolean not null, decks int[] not null
);
insert into public.cards_catalog (id, rarity, packable, neutral, has_alt, decks) values
  ('babynaga','common',true,false,false,'{0}'), ('sangthong','common',true,false,false,'{0}'), ('nagaprincess','common',true,false,false,'{0}'), ('siho','common',true,false,false,'{0}'),
  ('khankhaak','common',true,false,false,'{0}'), ('sinxay','rare',true,false,true,'{0}'), ('khunborom','rare',true,false,false,'{0}'), ('phayanak','legend',true,false,true,'{0}'),
  ('bangfai','common',true,false,false,'{0}'), ('sonsin','common',true,false,false,'{0}'), ('namthuam','common',true,false,false,'{0}'), ('maenamkhong','common',true,false,false,'{0}'),
  ('phihuean','common',true,false,false,'{1}'), ('phikongkoy','common',true,false,false,'{1}'), ('yaknoy','common',true,false,false,'{1}'), ('phikrasue','common',true,false,false,'{1}'),
  ('yakfaopatu','common',true,false,false,'{1}'), ('phikrahang','common',true,false,false,'{1}'), ('kumphan','rare',true,false,false,'{1}'), ('hapkhanasouane','legend',true,false,true,'{1}'),
  ('khamsap','common',true,false,false,'{1}'), ('kabongyak','common',true,false,false,'{1}'), ('khuenduenmuet','common',true,false,false,'{1}'), ('pasatyak','common',true,false,false,'{1}'),
  ('hongthong','common',true,false,false,'{2}'), ('xiengmieng','common',true,false,false,'{2}'), ('kinnari','common',true,false,false,'{2}'), ('phralak','common',true,false,false,'{2}'),
  ('singhimma','rare',true,false,false,'{2}'), ('hanuman','rare',true,false,false,'{2}'), ('khrut','rare',true,false,false,'{2}'), ('phralam','legend',true,false,true,'{2}'),
  ('sonphralam','common',true,false,false,'{2}'), ('lomphayu','common',true,false,false,'{2}'), ('konxiengmieng','common',true,false,false,'{2}'), ('pahimmaphan','common',true,false,false,'{2}'),
  ('baci','common',true,true,false,'{0,3,4,6,7,8,9,10,11,12}'), ('khaoniao','common',true,true,false,'{2,3,5,6,7,8,9,11,12}'), ('phukkhaen','common',true,true,false,'{2,4,6,8,11}'), ('tikong','common',true,true,false,'{1,10,11,12}'),
  ('faphaa','common',true,true,false,'{3,8,10}'), ('satnam','common',true,true,false,'{2,5,7,9,12}'), ('haingeun','common',true,true,false,'{}'), ('lowai','common',true,true,false,'{4,6,7}'),
  ('wao','common',true,true,false,'{2,3,6,9}'), ('katip','common',true,true,false,'{5,6}'), ('thonghai','common',true,true,false,'{}'), ('talatsao','common',true,true,false,'{10}'),
  ('khonephapheng','common',true,true,false,'{}'), ('molam','common',true,true,false,'{2,4,5,7,8,9,10,11,12}'), ('naiphan','common',true,true,false,'{1,5,11}'), ('khwai','common',true,true,false,'{0,1,4}'),
  ('sangpheuak','rare',true,true,false,'{0}'), ('thewadanoi','common',true,false,false,'{3}'), ('thahanthaen','common',true,false,false,'{3}'), ('thaenfahong','common',true,false,false,'{3}'),
  ('thaenfon','common',true,false,false,'{3}'), ('nanghung','common',true,false,false,'{3}'), ('thaenlom','rare',true,false,false,'{3}'), ('phayathaen','legend',true,false,true,'{3}'),
  ('phayufa','common',true,false,false,'{3}'), ('mokseo','common',true,false,false,'{3}'), ('lodufon','common',true,false,false,'{3}'), ('loduhnao','common',true,false,false,'{3}'),
  ('loduhon','common',true,false,false,'{3}'), ('phonthahan','common',true,false,false,'{4}'), ('naktanu','common',true,false,false,'{4}'), ('masuek','common',true,false,false,'{4}'),
  ('nakrobto','common',true,false,false,'{4}'), ('maethap','rare',true,false,true,'{4}'), ('xangsuek','rare',true,false,true,'{4}'), ('thaohung','legend',true,false,true,'{4}'),
  ('pasumthap','common',true,false,false,'{4}'), ('khongsuek','common',true,false,false,'{4}'), ('hokwiset','common',true,false,false,'{4}'), ('muangphuan','common',true,false,false,'{4}'),
  ('khaithahan','common',true,false,false,'{4}'), ('nangnoy','common',true,false,false,'{5}'), ('phinong','common',true,false,false,'{5}'), ('lukyak','common',true,false,false,'{5}'),
  ('moya','common',true,false,false,'{5}'), ('maneekap','common',true,false,false,'{5}'), ('kangli','common',true,false,true,'{5}'), ('santhaman','common',true,false,true,'{5}'),
  ('phutthasen','legend',true,false,true,'{5}'), ('namtamae','common',true,false,false,'{5}'), ('dokbuathip','common',true,false,false,'{5}'), ('thammuet','common',true,false,false,'{5}'),
  ('suanmuang','common',true,false,false,'{5}'), ('khonsai','common',true,false,false,'{6}'), ('phokha','common',true,false,false,'{6}'), ('nakdap','common',true,false,false,'{6}'),
  ('makaew','common',true,false,true,'{6}'), ('chaoying','common',true,false,false,'{6}'), ('yaksombat','rare',true,false,false,'{6}'), ('kalaket','legend',true,false,true,'{6}'),
  ('dapkaew','common',true,false,false,'{6}'), ('kepbin','common',true,false,false,'{6}'), ('waenwiset','common',true,false,false,'{6}'), ('hipsombat','common',true,false,false,'{6}'),
  ('wangthong','common',true,false,false,'{6}'), ('thewadahuean','common',true,false,false,'{7}'), ('deknoydokmai','common',true,false,false,'{7}'), ('phuthao','common',true,false,false,'{7}'),
  ('singkaew','common',true,false,true,'{7}'), ('singkham','common',true,false,false,'{7}'), ('xangphueak','common',true,false,false,'{7}'), ('nangsangkhan','common',true,false,false,'{7}'),
  ('punyeu','legend',true,false,true,'{7}'), ('hotnampon','common',true,false,false,'{7}'), ('dokchampa','common',true,false,false,'{7}'), ('khanmakbeng','common',true,false,false,'{7}'),
  ('luangprabang','common',true,false,false,'{7}'), ('kanoy','common',true,false,false,'{8}'), ('maejaidi','common',true,false,false,'{8}'), ('xaobanhua','common',true,false,false,'{8}'),
  ('ueaysong','common',true,false,false,'{8}'), ('luksaolao','common',true,false,true,'{8}'), ('setthi','common',true,false,false,'{8}'), ('thewadapon','rare',true,false,false,'{8}'),
  ('kamkadam','legend',true,false,true,'{8}'), ('thotkhap','common',true,false,false,'{8}'), ('khapka','common',true,false,false,'{8}'), ('banna','common',true,false,false,'{8}'),
  ('krarokdon','common',true,false,false,'{9}'), ('thahannak','common',true,false,false,'{9}'), ('nangai','common',true,false,false,'{9}'), ('mabaksam','common',true,false,false,'{9}'),
  ('phadaeng','common',true,false,true,'{9}'), ('phayakhom','rare',true,false,false,'{9}'), ('phangkhi','rare',true,false,false,'{9}'), ('suttharo','legend',true,false,true,'{9}'),
  ('bangfaikaeng','common',true,false,false,'{9}'), ('khuenyai','common',true,false,false,'{9}'), ('khaimuknak','common',true,false,false,'{9}'), ('nonghan','common',true,false,false,'{9}'),
  ('drone','common',true,false,false,'{10}'), ('hackxm','common',true,false,true,'{10}'), ('repairbot','common',true,false,false,'{10}'), ('cyberpolice','common',true,false,false,'{10}'),
  ('neonninja','common',true,false,false,'{10}'), ('holokinnari','common',true,false,false,'{10}'), ('mechyak','rare',true,false,true,'{10}'), ('nagax','legend',true,false,true,'{10}'),
  ('chippower','common',true,false,false,'{10}'), ('chipfly','common',true,false,false,'{10}'), ('virus','common',true,false,false,'{10}'), ('neoncity','common',true,false,false,'{10}'),
  ('nokkaew','common',true,false,false,'{11}'), ('nokhuk','common',true,false,false,'{11}'), ('tao','common',true,false,false,'{11}'), ('lingkhidue','common',true,false,false,'{11}'),
  ('kwangwai','common',true,false,false,'{11}'), ('mupa','common',true,false,false,'{11}'), ('xangjaidi','rare',true,false,false,'{11}'), ('kratai','legend',true,false,true,'{11}'),
  ('khumphang','common',true,false,false,'{11}'), ('tanang','common',true,false,false,'{11}'), ('ngaonam','common',true,false,true,'{11}'), ('papai','common',true,false,false,'{11}'),
  ('fannoy','common',true,false,false,'{12}'), ('kinnaridance','common',true,false,false,'{12}'), ('rappers','common',true,false,false,'{12}'), ('khaendj','common',true,false,true,'{12}'),
  ('nakhong','common',true,false,false,'{12}'), ('manager','common',true,false,false,'{12}'), ('leader','rare',true,false,false,'{12}'), ('nangkaew','legend',true,false,true,'{12}'),
  ('concert','common',true,false,false,'{12}'), ('livestream','common',true,false,false,'{12}'), ('micthong','common',true,false,false,'{12}'), ('stage','common',true,false,false,'{12}'),
  ('singkhu','rare',false,false,false,'{}'), ('sinxaysam','rare',false,false,false,'{}'), ('songphi','rare',false,false,false,'{}'), ('hungxang','rare',false,false,false,'{}'),
  ('khurak','rare',false,false,false,'{}'), ('yaknak','rare',false,false,false,'{}'), ('yungnoy','common',true,true,false,'{1}'), ('tontan','common',true,true,false,'{8}'),
  ('nguhao','common',true,true,false,'{3}'), ('nokinsee','common',true,true,false,'{4}'), ('kwangthong','common',true,true,false,'{2}'), ('romban','common',true,true,false,'{9}'),
  ('konglai','common',true,true,false,'{12}'), ('phitibangfai','common',true,true,false,'{0,3}'), ('phitisukhuan','common',true,true,false,'{1,7}'), ('nakjet','rare',false,false,false,'{}'),
  ('thaentong','rare',false,false,false,'{}'), ('sangkhanthewi','rare',false,false,false,'{}'), ('yaksip','rare',false,false,false,'{}')
on conflict (id) do update set rarity = excluded.rarity, packable = excluded.packable, neutral = excluded.neutral, has_alt = excluded.has_alt, decks = excluded.decks;
alter table public.cards_catalog enable row level security;
drop policy if exists "catalog is public" on public.cards_catalog;
create policy "catalog is public" on public.cards_catalog for select to authenticated using (true);
grant select on public.cards_catalog to authenticated;

-- one wallet per account
create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gems int not null default 300 check (gems >= 0),
  dust int not null default 0 check (dust >= 0),
  xp int not null default 0,
  free_packs int not null default 0,
  pity int not null default 0,
  packs int not null default 0,
  day date, day_gems int not null default 0, day_xp int not null default 0, first_win_day date,
  last_game timestamptz,
  tut boolean not null default false,
  adv int not null default 0,
  hard_beat int[] not null default '{}',
  ach text[] not null default '{}',
  quest_day date, quest_claims int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.owned_cards (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null references public.cards_catalog(id),
  n int not null default 0 check (n between 0 and 3),
  alt boolean not null default false,
  primary key (user_id, card_id)
);
alter table public.wallets enable row level security;
alter table public.owned_cards enable row level security;
drop policy if exists "own wallet" on public.wallets;
create policy "own wallet" on public.wallets for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own cards" on public.owned_cards;
create policy "own cards" on public.owned_cards for select to authenticated using (auth.uid() = user_id);
revoke all on public.wallets, public.owned_cards from anon, authenticated;
grant select on public.wallets, public.owned_cards to authenticated;

-- the wallet as the game reads it
create or replace function public.eco_json(u uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'gems', w.gems, 'dust', w.dust, 'xp', w.xp, 'freePacks', w.free_packs, 'pity', w.pity, 'packs', w.packs,
    'tutGems', w.tut, 'adv', w.adv, 'hardBeat', w.hard_beat, 'ach', w.ach,
    'cards', coalesce((select json_object_agg(card_id, n) from owned_cards where user_id = u and n > 0), '{}'::json),
    'alts', coalesce((select json_agg(card_id) from owned_cards where user_id = u and alt), '[]'::json))
  from wallets w where w.user_id = u
$$;

create or replace function public.eco_state() returns json
language sql stable security definer set search_path = public as $$ select public.eco_json(auth.uid()) $$;

-- the first time an account uses F2: bring in what the game already had (within sane limits)
create or replace function public.eco_import(snap jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'not signed in'; end if;
  if exists (select 1 from wallets where user_id = u) then return eco_json(u); end if;
  insert into wallets (user_id, gems, dust, xp, free_packs, pity, packs, tut, adv, hard_beat, ach)
  values (u,
    least(greatest(coalesce((snap->>'gems')::int, 300), 0), 5000),
    least(greatest(coalesce((snap->>'dust')::int, 0), 0), 5000),
    least(greatest(coalesce((snap->>'xp')::int, 0), 0), 3000),
    least(greatest(coalesce((snap->>'freePacks')::int, 0), 0), 10),
    least(greatest(coalesce((snap->>'pity')::int, 0), 0), 9),
    least(greatest(coalesce((snap->>'packs')::int, 0), 0), 1000),
    coalesce((snap->>'tutGems')::boolean, false),
    least(greatest(coalesce((snap->>'adv')::int, 0), 0), 10),
    coalesce((select array_agg(k::int) from jsonb_object_keys(coalesce(snap->'hardBeat', '{}')) k where k ~ '^\d+$' and k::int between 0 and 12), '{}'),
    coalesce((select array_agg(k) from jsonb_object_keys(coalesce(snap->'ach', '{}')) k), '{}'));
  insert into owned_cards (user_id, card_id, n)
    select u, c.id, least(greatest(e.value::int, 0), 3)
    from jsonb_each_text(coalesce(snap->'cards', '{}')) e join cards_catalog c on c.id = e.key
    where e.value ~ '^\d+$' and e.value::int > 0;
  insert into owned_cards (user_id, card_id, n, alt)
    select u, c.id, 0, true from jsonb_each_text(coalesce(snap->'alts', '{}')) e join cards_catalog c on c.id = e.key where e.value = 'true'
    on conflict (user_id, card_id) do update set alt = true;
  return eco_json(u);
end $$;

-- XP with its level rewards (100 gems a level, every 5th level 100 more and a free pack); returns {from, to}
create or replace function public.eco_xp(u uuid, n int) returns int[]
language plpgsql security definer set search_path = public as $$
declare a int; b int; l int;
begin
  select least(30, xp / 100 + 1) into a from wallets where user_id = u;
  update wallets set xp = xp + n where user_id = u;
  select least(30, xp / 100 + 1) into b from wallets where user_id = u;
  for l in a + 1 .. b loop
    update wallets set gems = gems + 100 + case when l % 5 = 0 then 100 else 0 end,
                       free_packs = free_packs + case when l % 5 = 0 then 1 else 0 end where user_id = u;
  end loop;
  return array[a, b];
end $$;

-- one card into the collection: a 4th copy turns into dust instead
create or replace function public.eco_give(u uuid, card text) returns text
language plpgsql security definer set search_path = public as $$
declare have int; r text;
begin
  select rarity into r from cards_catalog where id = card;
  select n into have from owned_cards where user_id = u and card_id = card;
  if coalesce(have, 0) < 3 then
    insert into owned_cards (user_id, card_id, n) values (u, card, 1) on conflict (user_id, card_id) do update set n = owned_cards.n + 1;
    return 'new';
  end if;
  update wallets set dust = dust + case r when 'legend' then 100 when 'rare' then 20 else 5 end where user_id = u;
  return 'dust';
end $$;

-- the end of a game against the bot: gems (daily cap 300, first win of the day +50), XP, a card drop, an adventure stage
create or replace function public.eco_game(won boolean, lvl int, opp int, stage int default null) returns json
language plpgsql security definer set search_path = public as $$
declare
  u uuid := auth.uid(); w wallets; top int; base int; bonus int := 0; xg int; lv int[];
  drop_id text; drop_res text; adv_gems int := 0; boss boolean;
begin
  select * into w from wallets where user_id = u for update;
  if not found then raise exception 'no wallet'; end if;
  if w.last_game is not null and now() - w.last_game < interval '25 seconds' then raise exception 'too fast' using errcode = 'P0003'; end if;
  lvl := least(greatest(coalesce(lvl, 1), 0), 2);
  if w.day is distinct from current_date then w.day := current_date; w.day_gems := 0; w.day_xp := 0; end if;
  top := case when won then (array[10, 20, 35])[lvl + 1] else 5 end;
  base := least(top, greatest(0, 300 - w.day_gems));
  if won and w.first_win_day is distinct from current_date then bonus := 50; w.first_win_day := current_date; end if;
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

-- open a pack (gems or a free pack); same odds and rules as the shop shows
create or replace function public.eco_pack(kind text, di int default 0, free boolean default false) returns json
language plpgsql security definer set search_path = public as $$
declare
  u uuid := auth.uid(); w wallets; cost int; leg numeric; altp numeric;
  slot int; r text; pid text; got_legend boolean := false; picks text[] := '{}'; rars text[] := '{}'; alts boolean[] := '{}';
  res json[] := '{}'; have int; is_new boolean; d int; i int; has_alt_card boolean; alt_owned boolean;
begin
  select * into w from wallets where user_id = u for update;
  if not found then raise exception 'no wallet'; end if;
  if kind not in ('basic', 'deck', 'gold') then raise exception 'bad pack'; end if;
  cost := case kind when 'basic' then 100 when 'deck' then 150 else 200 end;
  leg := case kind when 'gold' then 0.15 else 0.08 end;
  altp := case kind when 'gold' then 0.05 else 0.01 end;
  if free then
    if w.free_packs < 1 then raise exception 'no free pack' using errcode = 'P0004'; end if;
    update wallets set free_packs = free_packs - 1 where user_id = u;
  else
    if w.gems < cost then raise exception 'not enough gems' using errcode = 'P0004'; end if;
    update wallets set gems = gems - cost where user_id = u;
  end if;
  for slot in 0 .. 4 loop
    if slot = 3 or (kind = 'gold' and slot = 4) then r := case when random() < leg then 'legend' else 'rare' end;
    elsif slot = 4 then r := case when random() < leg then 'legend' when random() < 0.35 then 'rare' else 'common' end;
    else r := case when random() < 0.15 then 'rare' else 'common' end;
    end if;
    if slot = 3 and not got_legend and w.pity >= 9 then r := 'legend'; end if;
    -- cards you lack come up more often (weights 3 / 2 / 1); no repeat legend until you have them all
    with pool as (
      select c.id, c.rarity, coalesce(o.n, 0) as n from cards_catalog c
      left join owned_cards o on o.user_id = u and o.card_id = c.id
      where c.packable and (kind <> 'deck' or di = any(c.decks) or c.neutral)
    ), want as (
      select * from pool where rarity = r and (r <> 'legend' or n = 0 or not exists (select 1 from pool where rarity = 'legend' and n = 0))
    ), pick_from as (
      select * from want union all select * from pool where not exists (select 1 from want) and rarity = 'rare'
      union all select * from pool where not exists (select 1 from want) and not exists (select 1 from pool where rarity = 'rare')
    )
    select p.id into pid from pick_from p order by -ln(1 - random()) / (case when p.n >= 3 then 1 when p.n > 0 then 2 else 3 end) limit 1;
    select c.rarity, c.has_alt into r, has_alt_card from cards_catalog c where c.id = pid;
    if r = 'legend' then got_legend := true; end if;
    picks := picks || pid; rars := rars || r; alts := alts || (has_alt_card and random() < altp);
  end loop;
  update wallets set pity = case when got_legend then 0 else pity + 1 end, packs = packs + 1 where user_id = u;
  for i in 1 .. 5 loop
    select n, alt into have, alt_owned from owned_cards where user_id = u and card_id = picks[i];
    is_new := coalesce(have, 0) = 0; d := 0;
    if eco_give(u, picks[i]) = 'dust' then d := case rars[i] when 'legend' then 100 when 'rare' then 20 else 5 end; end if;
    if alts[i] then
      if coalesce(alt_owned, false) then update wallets set dust = dust + 200 where user_id = u; d := d + 200;
      else update owned_cards set alt = true where user_id = u and card_id = picks[i]; is_new := true; end if;
    end if;
    res := res || json_build_object('id', picks[i], 'r', rars[i], 'alt', alts[i], 'isNew', is_new, 'dust', nullif(d, 0));
  end loop;
  return json_build_object('cards', array_to_json(res), 'state', eco_json(u));
end $$;

-- make a card with dust
create or replace function public.eco_craft(card text) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); r text; cost int; have int; w wallets;
begin
  select * into w from wallets where user_id = u for update;
  if not found then raise exception 'no wallet'; end if;
  select rarity into r from cards_catalog where id = card and packable;
  if r is null then raise exception 'bad card'; end if;
  cost := case r when 'legend' then 400 when 'rare' then 100 else 40 end;
  select n into have from owned_cards where user_id = u and card_id = card;
  if coalesce(have, 0) >= 3 or w.dust < cost then raise exception 'not enough dust' using errcode = 'P0004'; end if;
  update wallets set dust = dust - cost where user_id = u;
  perform eco_give(u, card);
  return eco_json(u);
end $$;

-- one-off and daily rewards: 'tut' (end of the tutorial), 'ach' (an achievement, once each), 'quest' (3 a day, +30 XP each)
create or replace function public.eco_claim(kind text, key text default null) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); w wallets; g int := 0; lv int[]; owned_n int;
begin
  select * into w from wallets where user_id = u for update;
  if not found then raise exception 'no wallet'; end if;
  if kind = 'tut' then
    if w.tut then raise exception 'already' using errcode = 'P0005'; end if;
    update wallets set tut = true, gems = gems + 300, free_packs = free_packs + 3 where user_id = u; g := 300;
  elsif kind = 'ach' then
    if key = any(w.ach) then raise exception 'already' using errcode = 'P0005'; end if;
    g := case key when 'win1' then 30 when 'win10' then 60 when 'win50' then 150 when 'hard' then 60 when 'tale' then 50
      when 'fuse' then 40 when 'rite' then 40 when 'trib' then 30 when 'combo' then 40 when 'legend' then 50
      when 'cards' then 100 when 'adv5' then 60 when 'adv10' then 200 when 'pet' then 80 end;
    if g is null then raise exception 'bad achievement'; end if;
    select count(*) into owned_n from owned_cards where user_id = u and n > 0;
    if (key = 'cards' and owned_n < 100) or (key = 'adv5' and w.adv < 5) or (key = 'adv10' and w.adv < 10)
       or (key = 'hard' and cardinality(w.hard_beat) < 1) then raise exception 'not yet' using errcode = 'P0005'; end if;
    update wallets set ach = ach || key, gems = gems + g where user_id = u;
  elsif kind = 'quest' then
    if w.quest_day is distinct from current_date then w.quest_day := current_date; w.quest_claims := 0; end if;
    if w.quest_claims >= 3 then raise exception 'done for today' using errcode = 'P0005'; end if;
    g := case when key = 'winhard' then 60 when key in ('win', 'face') or key like 'tribe:%' then 50
              when key in ('game', 'pack') then 30 else 40 end;
    update wallets set quest_day = w.quest_day, quest_claims = w.quest_claims + 1, gems = gems + g where user_id = u;
    lv := eco_xp(u, 30);
  else raise exception 'bad claim';
  end if;
  return json_build_object('gems', g, 'lvFrom', lv[1], 'lvTo', lv[2], 'state', eco_json(u));
end $$;

-- recovery codes now carry the wallet and cards along with the profile and saved game
create or replace function public.claim_recovery_code(code text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  me uuid := auth.uid(); old uuid;
  h text := encode(digest(upper(regexp_replace(coalesce(code, ''), '[^A-Za-z0-9]', '', 'g')), 'sha256'), 'hex');
begin
  if me is null then raise exception 'not signed in'; end if;
  select user_id into old from recovery where code_hash = h;
  if old is null then raise exception 'bad code' using errcode = 'P0002'; end if;
  if old = me then return 'same'; end if;
  delete from owned_cards where user_id = me;
  delete from wallets where user_id = me;
  delete from saves where user_id = me;
  delete from recovery where user_id = me;
  delete from profiles where id = me;
  update profiles set id = me where id = old;
  update saves set user_id = me where user_id = old;
  update recovery set user_id = me where user_id = old;
  update wallets set user_id = me where user_id = old;
  update owned_cards set user_id = me where user_id = old;
  return 'moved';
end $$;

-- only the player-facing functions can be called from the game
revoke execute on function public.eco_json(uuid), public.eco_xp(uuid, int), public.eco_give(uuid, text) from public, anon, authenticated;
revoke execute on function public.eco_state(), public.eco_import(jsonb), public.eco_game(boolean, int, int, int),
  public.eco_pack(text, int, boolean), public.eco_craft(text), public.eco_claim(text, text) from public, anon;
grant execute on function public.eco_state(), public.eco_import(jsonb), public.eco_game(boolean, int, int, int),
  public.eco_pack(text, int, boolean), public.eco_craft(text), public.eco_claim(text, text) to authenticated;
