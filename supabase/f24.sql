-- Lao Legend Wars · deck 27: Cyber Dinosaurs (DECKS index 26), 2026-11-04.
-- Run after f1–f23. Idempotent. Hatching/cyber/humanoid forms are not packable.
-- Game results and card purchases remain server-authoritative.
begin;
insert into public.cards_catalog (id, rarity, packable, neutral, has_alt, decks) values
  ('dinoking', 'legend', true, false, true, '{26}'),
  ('dinoeggtrex', 'common', true, false, false, '{26}'),
  ('dinoeggtrike', 'common', true, false, false, '{26}'),
  ('dinoeggraptor', 'common', true, false, false, '{26}'),
  ('dinoraptor', 'common', true, false, false, '{26}'),
  ('dinotrike', 'common', true, false, false, '{26}'),
  ('dinoankylo', 'common', true, false, false, '{26}'),
  ('dinolongneck', 'rare', true, false, false, '{26}'),
  ('dinotrex', 'rare', true, false, false, '{26}'),
  ('dinohatch', 'common', true, false, false, '{26}'),
  ('dinoupgrade', 'common', true, false, false, '{26}'),
  ('dinoawaken', 'common', true, false, false, '{26}'),
  ('dinorepair', 'common', true, false, false, '{26}'),
  ('dinocore', 'common', true, false, false, '{26}'),
  ('dinovalley', 'common', true, false, false, '{26}')
on conflict (id) do update set rarity = excluded.rarity, packable = excluded.packable, neutral = excluded.neutral, has_alt = excluded.has_alt, decks = excluded.decks;

-- Existing reward rules, with the appended deck/legend only.
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
  if won and opp between 0 and 26 then
    if lvl = 2 and not (opp = any(w.hard_beat)) then
      w.hard_beat := w.hard_beat || opp;
      drop_id := (array['phayanak','hapkhanasouane','phralam','phayathaen','thaohung','phutthasen','kalaket','punyeu','kamkadam','suttharo','nagax','kratai','nangkaew','nangchampa','rueaxuangkham','maekhuakham','bangfaidao','khunjueang','pulangseung','hydronak','chaothamkonglor','nairoymuay','panyakham','maekaidao','ajandaeng','lanxangmk0','dinoking'])[opp + 1];
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
