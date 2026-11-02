-- Lao Legend Wars · slower levels (owner, 2026-11-02): high levels must take much more XP.
-- XP a level: 100 up to level 10, then 25 more for each level after it (level 50 needs 1,125, level 99 needs 2,350;
-- level 100 at 112,275 XP instead of 47,175). The browser (index.html: lvStart, lvNeed, lvCurve2) uses the same numbers.
-- Every player keeps the level they have and how far into it they are; levels already paid stay paid (lv_paid).
-- Run after f1–f22, right after the website update. Safe to run again: each wallet is moved once (lv_curve).
begin;

alter table public.wallets add column if not exists lv_curve int not null default 1;

with o as (
  select w.user_id, w.xp,
    (select coalesce(max(l), 1) from generate_series(1, 100) l
      where (case when l <= 30 then 100 * (l - 1) else 2900 + 100 * (l - 30) + 15 * (l - 30) * (l - 29) / 2 end) <= coalesce(w.xp, 0)) as l
  from public.wallets w where w.lv_curve = 1
), s as (
  select user_id, coalesce(xp, 0) as xp, l,
    case when l <= 30 then 100 * (l - 1) else 2900 + 100 * (l - 30) + 15 * (l - 30) * (l - 29) / 2 end as old_start,
    case when l < 30 then 100 else 100 + 15 * (l - 29) end as old_need,
    case when l <= 10 then 100 * (l - 1) else 900 + 100 * (l - 10) + 25 * (l - 10) * (l - 9) / 2 end as new_start,
    case when l < 10 then 100 else 100 + 25 * (l - 9) end as new_need
  from o
)
update public.wallets w
  set xp = case when s.l >= 100 then s.new_start + (s.xp - s.old_start)
                else s.new_start + ((s.xp - s.old_start)::bigint * s.new_need / s.old_need)::int end,
      lv_curve = 2
  from s where w.user_id = s.user_id;

alter table public.wallets alter column lv_curve set default 2;

create or replace function public.lv_start(l int) returns int
language sql immutable as $$
  select case when l <= 10 then 100 * (l - 1) else 900 + 100 * (l - 10) + 25 * (l - 10) * (l - 9) / 2 end
$$;

commit;
