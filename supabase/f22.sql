-- Lao Legend Wars · three bigger special-gem packs (owner, 2026-11-02): 3,000 / 5,000 / 10,000 special gems
-- for 250,000 / 400,000 / 750,000 LAK (+20% / +25% / +33% over 100 LAK a gem). Run after f1–f21. Safe to run again.
-- An active pack needs its own amount QR before payments open, so right after running this the admin page must be
-- saved once: it uploads the prepared QRs art/payments/bcel-onepay-<amount>-v2.png for the new amounts.
begin;

insert into public.premium_packs (id, amount_lak, gems) values
  ('vault', 250000, 3000),
  ('treasury', 400000, 5000),
  ('royal', 750000, 10000)
on conflict (id) do update set amount_lak = excluded.amount_lak, gems = excluded.gems, active = true;

commit;
