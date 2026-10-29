-- Lao Legend Wars · deck 14 second fusion (2026-10-29): «ເທວີດາບຈຳປາທອງ» (ນາງຈຳປາ + ສາວດາບສອງມື).
-- Paste into Supabase > SQL Editor > New query, then Run. Safe to run again.

insert into public.cards_catalog (id, rarity, packable, neutral, has_alt, decks) values
  ('champathong', 'rare', false, false, true, '{}')    -- fusion card: never in packs
on conflict (id) do update set rarity = excluded.rarity, packable = excluded.packable, neutral = excluded.neutral, has_alt = excluded.has_alt, decks = excluded.decks;
