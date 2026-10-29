-- Lao Legend Wars · home screen (2026-10-30): how many players are online right now, for the "🟢 N online" line on the
-- main menu and the login page. Only a number goes out, so it is open to signed-out visitors too.
-- Paste into Supabase > SQL Editor > New query, then Run. Safe to run again.

create or replace function public.online_count() returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from profiles where last_seen > now() - interval '2 minutes'
$$;
revoke execute on function public.online_count() from public;
grant execute on function public.online_count() to anon, authenticated;
