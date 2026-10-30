-- Lao Legend Wars · F14: fixed server-issued starter collection.
-- Run after f1–f13. Safe to run again. Existing wallets and cards are preserved.
-- Keep eco_import(jsonb) for old clients, but never trust their claimed inventory.
-- New accounts receive the same decks 1, 4 and 3, plus gift cards, as the guest game.
begin;
create or replace function public.eco_import(snap jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if is_banned(u) then raise exception 'banned' using errcode = 'P0011'; end if;
  -- The unique wallet row serializes simultaneous first-time requests.
  insert into wallets (user_id) values (u) on conflict (user_id) do nothing;
  if not found then return eco_json(u); end if;
  insert into owned_cards (user_id, card_id, n)
    select u, starter.id, starter.n from (values
      ('babynaga', 2),
      ('baci', 3),
      ('bangfai', 3),
      ('buangdak', 1),
      ('hanuman', 2),
      ('hokwiset', 2),
      ('hongthong', 3),
      ('huaphai', 1),
      ('khaithahan', 1),
      ('khankhaak', 2),
      ('khaoniao', 1),
      ('khongsuek', 2),
      ('khrut', 2),
      ('khunborom', 2),
      ('khwai', 3),
      ('kinnari', 2),
      ('konglai', 1),
      ('konxiengmieng', 3),
      ('kwangthong', 1),
      ('lomphayu', 2),
      ('lowai', 1),
      ('maenamkhong', 2),
      ('maethap', 2),
      ('masuek', 2),
      ('molam', 2),
      ('muangphuan', 1),
      ('nagaprincess', 2),
      ('nakrobto', 3),
      ('naktanu', 3),
      ('namthuam', 1),
      ('nguhao', 1),
      ('nokinsee', 1),
      ('pahimmaphan', 1),
      ('pasumthap', 2),
      ('phayanak', 1),
      ('phitibangfai', 1),
      ('phitisukhuan', 1),
      ('phonthahan', 3),
      ('phralak', 2),
      ('phralam', 1),
      ('phukkhaen', 2),
      ('romban', 1),
      ('saisin', 1),
      ('sangpheuak', 1),
      ('sangthong', 2),
      ('satnam', 1),
      ('siho', 3),
      ('singhimma', 2),
      ('sinxay', 2),
      ('sonphralam', 2),
      ('sonsin', 2),
      ('thaohung', 1),
      ('tontan', 1),
      ('wao', 1),
      ('xangsuek', 2),
      ('xiengmieng', 2),
      ('yungnoy', 1)
    ) as starter(id, n);
  return eco_json(u);
end $$;
revoke execute on function public.eco_import(jsonb) from public, anon;
grant execute on function public.eco_import(jsonb) to authenticated;
commit;
