-- Lao Legend Wars · balance cards (2026-10-29): the card list on the server learns the four new cards,
-- and every player who already has a wallet gets one copy of each new neutral card (the game gives them too).
-- Paste into Supabase > SQL Editor > New query, then Run. Safe to run again.

insert into public.cards_catalog (id, rarity, packable, neutral, has_alt, decks) values
  ('huaphai', 'common', true, true, false, '{9}'),      -- ຮົ້ວໄມ້ໄຜ່: neutral taunt (also in deck 10)
  ('buangdak', 'common', true, true, false, '{11}'),    -- ບ້ວງດັກ: neutral trap (also in deck 11)
  ('saisin', 'common', true, true, false, '{}'),        -- ສາຍສິນ: neutral trap
  ('bodyguard', 'common', true, false, false, '{12}')   -- ບໍດີ້ການ໌ດ: deck 12 taunt
on conflict (id) do update set rarity = excluded.rarity, packable = excluded.packable, neutral = excluded.neutral, has_alt = excluded.has_alt, decks = excluded.decks;

insert into public.owned_cards (user_id, card_id, n)
  select w.user_id, c.id, 1 from public.wallets w cross join (values ('huaphai'), ('buangdak'), ('saisin')) as c(id)
  on conflict (user_id, card_id) do nothing;
