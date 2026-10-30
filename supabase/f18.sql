-- Lao Legend Wars · deck 25 ໝໍຜີ ອາຈານແດງ (2026-10-31): the server's card list learns the new deck (DECKS index 24),
-- and beating the hard bot with it can drop its legend ອາຈານແດງ. Run after f1–f17. Safe to run again.
-- Tokens (ຜີນ້ອຍໂຄມໄຟ, ຕົ້ນກ້ວຍເງິນ) and ນາງຕານີ's changed form are made in play and are not in the catalog.
begin;

insert into public.cards_catalog (id, rarity, packable, neutral, has_alt, decks) values
  ('luksitmophi', 'common', true, false, false, '{24}'),
  ('motian', 'common', true, false, false, '{24}'),
  ('nongtani', 'common', true, false, true, '{24}'),
  ('phitahaek', 'common', true, false, false, '{24}'),
  ('kumanthong', 'common', true, false, false, '{24}'),
  ('mophivaendam', 'common', true, false, false, '{24}'),
  ('momonnammon', 'common', true, false, false, '{24}'),
  ('phipajaidi', 'common', true, false, false, '{24}'),
  ('nangtiam', 'common', true, false, false, '{24}'),
  ('nangtani', 'rare', true, false, true, '{24}'),
  ('mosakyan', 'rare', true, false, false, '{24}'),
  ('phichaothi', 'rare', true, false, false, '{24}'),
  ('ajandaeng', 'legend', true, false, true, '{24}'),
  ('paokhatha', 'common', true, false, false, '{24}'),
  ('nammonsaksit', 'common', true, false, false, '{24}'),
  ('khaplaiphihai', 'common', true, false, false, '{24}'),
  ('takut', 'common', true, false, false, '{24}'),
  ('phayan', 'common', true, false, false, '{24}'),
  ('hochaoban', 'common', true, false, false, '{24}')
on conflict (id) do update set rarity = excluded.rarity, packable = excluded.packable, neutral = excluded.neutral, has_alt = excluded.has_alt, decks = excluded.decks;

-- the reward function the secure game calls (renamed by f15): same as f11, with deck 25 and its legend added
create or replace function public.sec_legacy_eco_game(won boolean, lvl int, opp int, stage int default null) returns json
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
  if won and opp between 0 and 24 then
    if lvl = 2 and not (opp = any(w.hard_beat)) then
      w.hard_beat := w.hard_beat || opp;
      drop_id := (array['phayanak','hapkhanasouane','phralam','phayathaen','thaohung','phutthasen','kalaket','punyeu','kamkadam','suttharo','nagax','kratai','nangkaew','nangchampa','rueaxuangkham','maekhuakham','bangfaidao','khunjueang','pulangseung','hydronak','chaothamkonglor','nairoymuay','panyakham','maekaidao','ajandaeng'])[opp + 1];
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

commit;
