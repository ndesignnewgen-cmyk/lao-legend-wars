-- Lao Legend Wars · phase F1b: recovery codes (ລະຫັດກູ້ບັນຊີ), so a player can open their account on
-- another device without email. Paste into Supabase > SQL Editor > New query, then Run. Safe to run again.
-- A code like K7QM-2XPA-9DRT is shown once to the player; only its hash is stored. Entering it on another
-- device moves the profile and saved game to that device's account (the old device is signed out of it).

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.recovery (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code_hash text not null unique,
  created_at timestamptz not null default now()
);
alter table public.recovery enable row level security;   -- no policies: only the two functions below touch it

-- make (or replace) the caller's code; the old code stops working
create or replace function public.make_recovery_code() returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  abc constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  raw text := ''; b bytea := gen_random_bytes(12); i int;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from profiles where id = auth.uid()) then raise exception 'no profile'; end if;
  for i in 0..11 loop raw := raw || substr(abc, 1 + get_byte(b, i) % 31, 1); end loop;
  insert into recovery (user_id, code_hash) values (auth.uid(), encode(digest(raw, 'sha256'), 'hex'))
    on conflict (user_id) do update set code_hash = excluded.code_hash, created_at = now();
  return substr(raw, 1, 4) || '-' || substr(raw, 5, 4) || '-' || substr(raw, 9, 4);
end $$;

-- move the account that owns this code onto the caller (this device's own guest profile, if any, is replaced)
create or replace function public.claim_recovery_code(code text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  me uuid := auth.uid(); old uuid;
  h text := encode(digest(upper(regexp_replace(coalesce(code, ''), '[^A-Za-z0-9]', '', 'g')), 'sha256'), 'hex');
begin
  if me is null then raise exception 'not signed in'; end if;
  select user_id into old from recovery where code_hash = h;
  if old is null then raise exception 'bad code' using errcode = 'P0002'; end if;
  if old = me then return 'same'; end if;
  delete from saves where user_id = me;
  delete from recovery where user_id = me;
  delete from profiles where id = me;
  update profiles set id = me where id = old;
  update saves set user_id = me where user_id = old;
  update recovery set user_id = me where user_id = old;
  return 'moved';
end $$;

revoke execute on function public.make_recovery_code() from public, anon;
revoke execute on function public.claim_recovery_code(text) from public, anon;
grant execute on function public.make_recovery_code() to authenticated;
grant execute on function public.claim_recovery_code(text) to authenticated;
