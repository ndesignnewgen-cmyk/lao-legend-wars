-- Lao Legend Wars · phase F4: matchmaking (ຊອກຄູ່ຫຼິ້ນ) for casual online games.
-- Paste into Supabase > SQL Editor > New query, then Run. Safe to run again.
-- A searching player has one row in mm_queue and polls every 2 seconds. Two players whose levels are close are paired
-- (±3 levels at first, ±8 after 10 s, anyone after 30 s): both rows get the same room code, the one who waited longer
-- is the host, and the game then runs over the usual room channel.

create table if not exists public.mm_queue (
  user_id uuid primary key references auth.users(id) on delete cascade,
  level int not null default 1,
  room text,
  role text,
  created_at timestamptz not null default now(),
  seen_at timestamptz not null default now()
);
alter table public.mm_queue enable row level security;   -- no policies: only the functions below touch it
revoke all on public.mm_queue from anon, authenticated;

-- pair the caller if someone fitting is waiting; one pairing at a time, so two players never grab the same partner
create or replace function public.mm_try(u uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me mm_queue; other mm_queue; waited numeric; span int; code text := 'M'; abc constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; i int;
begin
  perform pg_advisory_xact_lock(424242);
  select * into me from mm_queue where user_id = u;
  if not found then return json_build_object('gone', true); end if;
  if me.room is not null then return json_build_object('room', me.room, 'role', me.role); end if;
  waited := extract(epoch from now() - me.created_at);
  span := case when waited < 10 then 3 when waited < 30 then 8 else 99 end;
  select * into other from mm_queue
    where user_id <> u and room is null and seen_at > now() - interval '12 seconds' and abs(level - me.level) <= span
    order by created_at limit 1;
  if found then
    for i in 1 .. 5 loop code := code || substr(abc, 1 + floor(random() * 31)::int, 1); end loop;
    update mm_queue set room = code, role = 'host' where user_id = other.user_id;
    update mm_queue set room = code, role = 'guest' where user_id = u;
    return json_build_object('room', code, 'role', 'guest');
  end if;
  return json_build_object('waiting', (select count(*) from mm_queue where room is null and seen_at > now() - interval '12 seconds'));
end $$;

-- start (or restart) searching
create or replace function public.mm_join(lvl int) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from profiles where id = u) then raise exception 'no profile' using errcode = 'P0006'; end if;
  delete from mm_queue where seen_at < now() - interval '2 minutes';
  insert into mm_queue (user_id, level) values (u, least(greatest(coalesce(lvl, 1), 1), 30))
    on conflict (user_id) do update set level = excluded.level, room = null, role = null, created_at = now(), seen_at = now();
  return mm_try(u);
end $$;

-- still searching: keep the row fresh and check for a partner
create or replace function public.mm_poll() returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'not signed in'; end if;
  update mm_queue set seen_at = now() where user_id = u;
  return mm_try(u);
end $$;

-- stop searching (or the pairing is done)
create or replace function public.mm_leave() returns void
language sql security definer set search_path = public as $$ delete from mm_queue where user_id = auth.uid() $$;

revoke execute on function public.mm_try(uuid) from public, anon, authenticated;
revoke execute on function public.mm_join(int), public.mm_poll(), public.mm_leave() from public, anon;
grant execute on function public.mm_join(int), public.mm_poll(), public.mm_leave() to authenticated;
