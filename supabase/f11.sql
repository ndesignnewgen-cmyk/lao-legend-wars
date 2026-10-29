-- Lao Legend Wars · decks 15-24 (2026-10-29): the server's card list learns the 10 new decks (DECKS index 14-23),
-- the hard bot of each new deck gives its legend, and old cards used by a new deck show up in that deck's pack.
-- Paste into Supabase > SQL Editor > New query, then Run. Safe to run again.

insert into public.cards_catalog (id, rarity, packable, neutral, has_alt, decks) values
  ('phiphainoy', 'common', true, false, false, '{14}'),
  ('khontikongruea', 'common', true, false, false, '{14}'),
  ('phiphaihua', 'common', true, false, false, '{14}'),
  ('kongxia', 'common', true, false, false, '{14}'),
  ('naithai', 'common', true, false, false, '{14}'),
  ('rueaxuangban', 'common', true, false, false, '{14}'),
  ('phiphaiyai', 'rare', true, false, true, '{14}'),
  ('rueaxuangkham', 'legend', true, false, true, '{14}'),
  ('siangpuen', 'common', true, false, false, '{14}'),
  ('jaewsud', 'common', true, false, false, '{14}'),
  ('kasaenkhong', 'common', true, false, false, '{14}'),
  ('maiphai', 'common', true, false, false, '{14}'),
  ('tharuea', 'common', true, false, false, '{14}'),
  ('makhungsot', 'common', true, false, false, '{15}'),
  ('padaek', 'common', true, false, false, '{15}'),
  ('makphet', 'common', true, false, false, '{15}'),
  ('phaksot', 'common', true, false, false, '{15}'),
  ('maekhaphak', 'common', true, false, false, '{15}'),
  ('phokhapa', 'common', true, false, false, '{15}'),
  ('tuktuk', 'common', true, false, false, '{15}'),
  ('khontamsomtam', 'common', true, false, true, '{15}'),
  ('naihanfoe', 'common', true, false, false, '{15}'),
  ('cheflap', 'common', true, false, false, '{15}'),
  ('maekhuakham', 'legend', true, false, true, '{15}'),
  ('tammakhung', 'common', true, false, false, '{15}'),
  ('lapyai', 'common', true, false, false, '{15}'),
  ('nakawakatnoy', 'common', true, false, false, '{16}'),
  ('daotoknoy', 'common', true, false, false, '{16}'),
  ('xangbangfai', 'common', true, false, false, '{16}'),
  ('bangfaisaen', 'common', true, false, false, '{16}'),
  ('laosat', 'common', true, false, true, '{16}'),
  ('hunduean', 'common', true, false, false, '{16}'),
  ('naiphon', 'common', true, false, false, '{16}'),
  ('bangfailan', 'common', true, false, false, '{16}'),
  ('bangfaidao', 'legend', true, false, true, '{16}'),
  ('chutfai', 'common', true, false, false, '{16}'),
  ('rabopponkan', 'common', true, false, false, '{16}'),
  ('fondaotok', 'common', true, false, false, '{16}'),
  ('xutawakat', 'common', true, false, false, '{16}'),
  ('sathaniawakat', 'common', true, false, false, '{16}'),
  ('khonpanhai', 'common', true, false, false, '{17}'),
  ('yakfaohai', 'common', true, false, false, '{17}'),
  ('moyaphuan', 'common', true, false, false, '{17}'),
  ('xaophuan', 'common', true, false, false, '{17}'),
  ('yakhinnoy', 'common', true, false, false, '{17}'),
  ('yakbaekhai', 'rare', true, false, false, '{17}'),
  ('yakthonghai', 'rare', true, false, false, '{17}'),
  ('yakfapha', 'rare', true, false, true, '{17}'),
  ('khunjueang', 'legend', true, false, true, '{17}'),
  ('thanuhin', 'common', true, false, false, '{17}'),
  ('phayuhin', 'rare', true, false, false, '{17}'),
  ('haiyak', 'common', true, false, false, '{17}'),
  ('dekliangkhwai', 'common', true, false, false, '{18}'),
  ('xaonahai', 'common', true, false, false, '{18}'),
  ('metnamtao', 'common', true, false, false, '{18}'),
  ('maethaopha', 'common', true, false, false, '{18}'),
  ('huanaban', 'common', true, false, false, '{18}'),
  ('nakrobban', 'common', true, false, false, '{18}'),
  ('khwainamtao', 'common', true, false, false, '{18}'),
  ('pulangseung', 'legend', true, false, true, '{18}'),
  ('lekxi', 'common', true, false, false, '{18}'),
  ('tatkhuea', 'common', true, false, false, '{18}'),
  ('namtaoyak', 'common', true, false, true, '{18}'),
  ('kanghannoy', 'common', true, false, false, '{19}'),
  ('xangfaifa', 'common', true, false, false, '{19}'),
  ('solarwalker', 'common', true, false, false, '{19}'),
  ('hunkepkhia', 'common', true, false, false, '{19}'),
  ('wisawakon', 'common', true, false, false, '{19}'),
  ('dronsongfai', 'common', true, false, false, '{19}'),
  ('hunlo', 'common', true, false, false, '{19}'),
  ('lotfaisayfa', 'common', true, false, true, '{19}'),
  ('yaklekphalangnam', 'rare', true, false, false, '{19}'),
  ('hydronak', 'legend', true, false, true, '{19}'),
  ('faidap', 'common', true, false, false, '{19}'),
  ('faphasaysong', 'common', true, false, false, '{19}'),
  ('battyak', 'common', true, false, false, '{19}'),
  ('khuennamngum', 'common', true, false, false, '{19}'),
  ('khangkhaonoy', 'common', true, false, false, '{20}'),
  ('nokaentham', 'common', true, false, false, '{20}'),
  ('pathamtabot', 'common', true, false, false, '{20}'),
  ('khonphaitham', 'common', true, false, false, '{20}'),
  ('ngutham', 'common', true, false, false, '{20}'),
  ('khangkhaoyak', 'common', true, false, true, '{20}'),
  ('hinngokyak', 'rare', true, false, false, '{20}'),
  ('chaothamkonglor', 'legend', true, false, true, '{20}'),
  ('hinyoytok', 'common', true, false, false, '{20}'),
  ('namvon', 'common', true, false, false, '{20}'),
  ('muetmit', 'common', true, false, false, '{20}'),
  ('saynamtaidin', 'common', true, false, false, '{20}'),
  ('thamkonglor', 'common', true, false, false, '{20}'),
  ('nakmuaydek', 'common', true, false, false, '{21}'),
  ('nakmuaybao', 'common', true, false, false, '{21}'),
  ('khumuay', 'common', true, false, false, '{21}'),
  ('kammakan', 'common', true, false, false, '{21}'),
  ('nakmuaysok', 'common', true, false, false, '{21}'),
  ('nakmuayying', 'common', true, false, true, '{21}'),
  ('nakmuaykhao', 'common', true, false, false, '{21}'),
  ('chaemkham', 'rare', true, false, false, '{21}'),
  ('nairoymuay', 'legend', true, false, true, '{21}'),
  ('namanmuay', 'common', true, false, false, '{21}'),
  ('matsoydao', 'common', true, false, false, '{21}'),
  ('xueakkhatmue', 'common', true, false, false, '{21}'),
  ('wethimuay', 'common', true, false, false, '{21}'),
  ('nakhiannoy', 'common', true, false, false, '{22}'),
  ('dronthaiphap', 'common', true, false, false, '{22}'),
  ('khuai', 'common', true, false, false, '{22}'),
  ('nakwitnoy', 'common', true, false, false, '{22}'),
  ('hunhongsamut', 'common', true, false, false, '{22}'),
  ('achanyai', 'common', true, false, false, '{22}'),
  ('nakpatsayfa', 'rare', true, false, true, '{22}'),
  ('panyakham', 'legend', true, false, true, '{22}'),
  ('somphonfai', 'common', true, false, false, '{22}'),
  ('puemponkan', 'common', true, false, false, '{22}'),
  ('hongthotlong', 'common', true, false, false, '{22}'),
  ('yanglop', 'common', true, false, false, '{22}'),
  ('sopsengyai', 'common', true, false, false, '{22}'),
  ('horsamutloyfa', 'common', true, false, false, '{22}'),
  ('lukkaidao', 'common', true, false, true, '{23}'),
  ('kaikhanhung', 'common', true, false, false, '{23}'),
  ('daoprakai', 'common', true, false, false, '{23}'),
  ('dueanpheng', 'common', true, false, false, '{23}'),
  ('daothai', 'common', true, false, false, '{23}'),
  ('daomaengngot', 'common', true, false, false, '{23}'),
  ('daonuea', 'common', true, false, false, '{23}'),
  ('daohang', 'common', true, false, false, '{23}'),
  ('maekaidao', 'legend', true, false, true, '{23}'),
  ('kumdao', 'common', true, false, false, '{23}'),
  ('saengdao', 'common', true, false, false, '{23}'),
  ('khuenpendao', 'common', true, false, false, '{23}'),
  ('sulinyakhat', 'common', true, false, false, '{23}'),
  ('thangxangphueak', 'common', true, false, false, '{23}')
on conflict (id) do update set rarity = excluded.rarity, packable = excluded.packable, neutral = excluded.neutral, has_alt = excluded.has_alt, decks = excluded.decks;

-- old cards that a new deck also uses
update public.cards_catalog set decks = array(select distinct unnest(decks || '{18}'::int[])) where id = 'khunborom';

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
  if won and opp between 0 and 23 then
    if lvl = 2 and not (opp = any(w.hard_beat)) then
      w.hard_beat := w.hard_beat || opp;
      drop_id := (array['phayanak','hapkhanasouane','phralam','phayathaen','thaohung','phutthasen','kalaket','punyeu','kamkadam','suttharo','nagax','kratai','nangkaew','nangchampa','rueaxuangkham','maekhuakham','bangfaidao','khunjueang','pulangseung','hydronak','chaothamkonglor','nairoymuay','panyakham','maekaidao'])[opp + 1];
    elsif random() < 0.3 then
      select id into drop_id from cards_catalog where opp = any(decks) and rarity <> 'legend' order by random() limit 1;
    end if;
  end if;
  if won and stage is not null and stage = w.adv and stage between 0 and 10 then
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
