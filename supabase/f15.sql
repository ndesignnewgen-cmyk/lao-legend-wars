-- Lao Legend Wars F15: authenticated rooms, authoritative games and verified rewards.
-- Run AFTER deploying secure-game and AFTER f1–f14. Existing inventories remain unchanged.
-- Old clients fail closed for online play and game rewards after this migration.
begin;
create table if not exists public.sec_limits(
 user_id uuid not null references auth.users(id) on delete cascade, kind text not null,
 started timestamptz not null default now(), n int not null default 0, primary key(user_id,kind));
create table if not exists public.sec_games(
 id uuid primary key default gen_random_uuid(), code text not null unique,
 host uuid not null references auth.users(id) on delete cascade,
 guest uuid references auth.users(id) on delete cascade,
 mode text not null check(mode in ('bot','casual','ranked')), spec jsonb not null,
 engine jsonb, rev int not null default 0, status text not null default 'waiting' check(status in ('waiting','active','finished')),
 winner int check(winner in(0,1)), reason text, progressed boolean not null default false, rewarded boolean not null default false,
 reward jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deadline timestamptz,
 expires_at timestamptz not null default now()+interval '2 hours', check(guest is null or guest<>host));
create index if not exists sec_games_players on public.sec_games(host,guest,status);
create table if not exists public.sec_events(
 game_id uuid not null references public.sec_games(id) on delete cascade, revision int not null,
 actor uuid not null, request_id uuid not null, action jsonb not null, at timestamptz not null default now(),
 primary key(game_id,revision), unique(game_id,actor,request_id));
create table if not exists public.sec_progress(
 user_id uuid not null references auth.users(id) on delete cascade, day date not null,
 counts jsonb not null default '{}', primary key(user_id,day));
create table if not exists public.sec_claims(
 user_id uuid not null references auth.users(id) on delete cascade, day date not null, key text not null,
 primary key(user_id,day,key));
create table if not exists public.sec_audit(
 id bigint generated always as identity primary key, actor uuid references auth.users(id) on delete cascade,
 kind text not null check(length(kind)<=64), at timestamptz not null default now());
do $$ declare t text; begin foreach t in array array['sec_limits','sec_games','sec_events','sec_progress','sec_claims','sec_audit'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
end loop; end $$;
-- No direct client table access, including through Realtime. Only trusted server functions can read game truth.
create or replace function public.sec_bump(u uuid,k text,cap int) returns boolean
language plpgsql security definer set search_path=public as $$ declare hits int; begin
 insert into sec_limits(user_id,kind) values(u,k) on conflict do nothing;
 update sec_limits set n=case when started<now()-interval '1 minute' then 1 else n+1 end,
 started=case when started<now()-interval '1 minute' then now() else started end
 where user_id=u and sec_limits.kind=k and (started<now()-interval '1 minute' or n<cap) returning n into hits;
 return found;
end $$;
create or replace function public.sec_gate(kind text) returns boolean
language plpgsql security definer set search_path=public as $$ declare u uuid:=auth.uid(); cap int; begin
 if u is null or is_banned(u) then raise exception 'not allowed' using errcode='42501';end if;
 cap:=case kind when 'poll' then 90 when 'move' then 120 when 'create' then 6 when 'join' then 12 when 'match' then 12 else 0 end;
 if cap=0 then raise exception 'bad request';end if;
 return sec_bump(u,kind,cap);
end $$;
create or replace function public.sec_count(u uuid,k text,n int) returns void
language plpgsql security definer set search_path=public as $$ begin
 if n<=0 or n>10000 or length(k)>40 then return;end if;
 insert into sec_progress(user_id,day,counts) values(u,current_date,jsonb_build_object(k,n))
 on conflict(user_id,day) do update set counts=jsonb_set(sec_progress.counts,array[k],to_jsonb(coalesce((sec_progress.counts->>k)::int,0)+n));
end $$;
create or replace function public.sec_deck_ok(d jsonb) returns boolean
language plpgsql stable security definer set search_path=public as $$ declare e record; total int:=0; c cards_catalog; begin
 if d is null or jsonb_typeof(d)<>'object' or pg_column_size(d)>4096 then return false;end if;
 for e in select * from jsonb_each_text(d) loop
  if e.value !~ '^[1-3]$' then return false;end if;
  select * into c from cards_catalog where id=e.key and packable;
  if not found or(c.rarity='legend' and e.value<>'1')then return false;end if;total:=total+e.value::int;
 end loop;return total between 30 and 40;
end $$;
create or replace function public.sec_create(actor uuid,room_code text,game_mode text,game_spec jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$ declare g sec_games; begin
 if is_banned(actor) or not exists(select 1 from profiles where id=actor)then raise exception 'not allowed' using errcode='42501';end if;
 if game_spec->>'stage' is not null and (game_spec->>'stage')::int > coalesce((select adv from wallets where user_id=actor),0)then raise exception 'stage locked';end if;
 if game_mode not in('bot','casual') or room_code !~ '^[A-Z2-9]{8}$' or not sec_deck_ok(game_spec->'host'->'list')or not rank_deck_ok(actor,game_spec->'host'->'list')then raise exception 'bad game';end if;
 update sec_games set status='finished',reason='cancelled'where host=actor and status='waiting'and engine is null;
 if(select count(*)from sec_games where host=actor and status<>'finished' and expires_at>now())>=3 then raise exception 'too many games';end if;
 insert into sec_games(code,host,mode,spec)values(room_code,actor,game_mode,game_spec)returning * into g;return to_jsonb(g);
end $$;
create or replace function public.sec_join(actor uuid,room_code text,guest_spec jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$ declare g sec_games; begin
 select * into g from sec_games where code=room_code for update;
 if not found or g.expires_at<now()then raise exception 'no game';end if;
 if actor=g.host or actor=g.guest then return to_jsonb(g);end if;
 if is_banned(actor) or blocked_either(actor,g.host) or g.mode<>'casual' or g.guest is not null or not sec_deck_ok(guest_spec->'list')or not rank_deck_ok(actor,guest_spec->'list')then raise exception 'not allowed' using errcode='42501';end if;
 update sec_games set guest=actor,spec=jsonb_set(spec,'{guest}',guest_spec),updated_at=now()where id=g.id returning * into g;
 return to_jsonb(g);
end $$;
create or replace function public.sec_read(actor uuid,room_code text) returns jsonb
language plpgsql security definer set search_path=public as $$ declare g sec_games;begin
 select * into g from sec_games where code=room_code;
 if not found or is_banned(actor)or(actor<>g.host and actor is distinct from g.guest)then raise exception 'not your game'using errcode='42501';end if;
 if g.expires_at<now()and g.status<>'finished'then raise exception 'expired';end if;return to_jsonb(g);
end $$;
-- Keep old reward implementations internal; browser RPC calls cannot mint game rewards anymore.
do $$ begin
 if to_regprocedure('public.sec_legacy_eco_game(boolean,integer,integer,integer)')is null then alter function public.eco_game(boolean,int,int,int)rename to sec_legacy_eco_game;end if;
 if to_regprocedure('public.sec_legacy_eco_claim(text,text)')is null then alter function public.eco_claim(text,text)rename to sec_legacy_eco_claim;end if;
 if to_regprocedure('public.sec_legacy_eco_pack(text,integer,boolean)')is null then alter function public.eco_pack(text,int,boolean)rename to sec_legacy_eco_pack;end if;
 if to_regprocedure('public.sec_legacy_mm_poll()')is null then alter function public.mm_poll()rename to sec_legacy_mm_poll;end if;
 if to_regprocedure('public.sec_legacy_recovery(text)')is null then alter function public.claim_recovery_code(text)rename to sec_legacy_recovery;end if;
end $$;
create or replace function public.eco_game(won boolean,lvl int,opp int,stage int default null)returns json
language plpgsql security definer set search_path=public as $$begin raise exception 'verified game required'using errcode='42501';end$$;
create or replace function public.eco_claim(kind text,key text default null)returns json
language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); n int; need int; cnt jsonb; r json;begin
 if u is null or is_banned(u)then raise exception 'not allowed'using errcode='42501';end if;
 if not sec_bump(u,'claim',12)then raise exception 'rate limited'using errcode='P0015';end if;
 -- Lock the wallet before checking evidence and claiming so simultaneous claims cannot both pass.
 perform 1 from wallets where user_id=u for update;
 if kind='quest'then
  need:=case key when 'win'then 2 when 'game'then 3 when 'kill'then 8 when 'spell'then 5 when 'play'then 15 when 'pack'then 1 when 'winhard'then 1 when 'legend'then 1 when 'face'then 15 when 'tribe:naga'then 6 when 'tribe:hero'then 6 when 'tribe:himma'then 5 when 'tribe:warrior'then 6 when 'tribe:giant'then 4 when 'tribe:ghost'then 4 when 'tribe:thewada'then 5 end;
  select coalesce((counts->>key)::int,0)into n from sec_progress where user_id=u and day=current_date;
  if need is null or coalesce(n,0)<need then raise exception 'not yet'using errcode='P0005';end if;
  insert into sec_claims values(u,current_date,key)on conflict do nothing;
  if not found then raise exception 'already'using errcode='P0005';end if;
 elsif kind='ach'then
  if key not in('cards','adv5','adv10','hard')then
   select coalesce(sum(coalesce((counts->>case key when 'win1'then 'win'when 'win10'then 'win'when 'win50'then 'win'when 'combo'then 'combo4'else key end)::int,0)),0)into n from sec_progress where user_id=u;
   need:=case key when 'win1'then 1 when 'win10'then 10 when 'win50'then 50 when 'tale'then 1 when 'fuse'then 1 when 'rite'then 1 when 'trib'then 1 when 'combo'then 1 when 'legend'then 1 else null end;
   if need is null or n<need then raise exception 'not yet'using errcode='P0005';end if;
  end if;
 elsif kind='tut'then
  -- A one-time starter gift, not a claim that a competitive game was won.
  null;
 else raise exception 'bad claim';end if;
 r:=sec_legacy_eco_claim(kind,key);return r;
end$$;
create or replace function public.eco_pack(kind text,di int default 0,free boolean default false)returns json
language plpgsql security definer set search_path=public as $$declare u uuid:=auth.uid();r json;begin
 if u is null or is_banned(u)then raise exception 'not allowed'using errcode='42501';end if;
 if not sec_bump(u,'pack',20)then raise exception 'rate limited'using errcode='P0015';end if;
 r:=sec_legacy_eco_pack(kind,di,free);perform sec_count(u,'pack',1);return r;
end$$;
create or replace function public.mm_poll()returns json
language plpgsql security definer set search_path=public as $$declare u uuid:=auth.uid();begin
 if u is null or is_banned(u)then raise exception 'not allowed'using errcode='42501';end if;
 if not sec_bump(u,'match_poll',60)then return json_build_object('waiting',1);end if;
 return sec_legacy_mm_poll();
end$$;
create or replace function public.claim_recovery_code(code text)returns text
language plpgsql security definer set search_path=public as $$declare u uuid:=auth.uid();r text;begin
 if u is null or is_banned(u)then raise exception 'not allowed'using errcode='42501';end if;
 if not sec_bump(u,'recovery',5)then return 'rate_limited';end if;
 -- Catch inside this transaction: a wrong code must still consume the rate-limit bucket.
 begin r:=sec_legacy_recovery(code);exception when sqlstate 'P0002'then return 'bad_code';end;return r;
end$$;
create or replace function public.sec_award(gid uuid)returns jsonb
language plpgsql security definer set search_path=public as $$
declare g sec_games;r json;k record;c jsonb;u uuid;mt matches;i int;begin
 select * into g from sec_games where id=gid for update;
 if g.status<>'finished'then return null;end if;
 if not g.progressed then
  for i in 0..1 loop
   u:=case when i=0 then g.host else g.guest end;if u is null then continue;end if;
   perform sec_count(u,'game',1);if g.winner=i then perform sec_count(u,'win',1);end if;
   if g.mode='bot'and i=0 and g.winner=0 and(g.spec->>'level')::int=2 then perform sec_count(u,'winhard',1);end if;
   c:=g.engine->'checkpoint'->'state'->'secureCounts'->i;
   for k in select * from jsonb_each_text(coalesce(c,'{}'))loop perform sec_count(u,k.key,least(10000,greatest(0,k.value::int)));end loop;
  end loop;
  update sec_games set progressed=true where id=gid;
 end if;
 if g.rewarded then return g.reward;end if;
 if g.mode='bot'then
  perform set_config('request.jwt.claim.sub',g.host::text,true);
  begin r:=sec_legacy_eco_game(g.winner=0,coalesce((g.spec->>'level')::int,1),(g.spec->'guest'->>'di')::int,(g.spec->>'stage')::int);
  exception when sqlstate 'P0003'then return null;end;
 elsif g.mode='ranked'then
  select * into mt from matches where room=g.code for update;
  if mt.result is null then update matches set result=case when g.winner=0 then 'host'else 'guest'end,decided_at=now()where room=g.code returning * into mt;perform rank_apply(mt);end if;
 end if;
 update sec_games set rewarded=true,reward=coalesce(r::jsonb,'{}')where id=gid;return coalesce(r::jsonb,'{}');
end$$;
create or replace function public.sec_commit(actor uuid,room_code text,expected int,rid uuid,next_engine jsonb,game_action jsonb)returns jsonb
language plpgsql security definer set search_path=public as $$
declare g sec_games;w int;why text;begin
 select * into g from sec_games where code=room_code for update;
 if not found or(actor<>g.host and actor is distinct from g.guest)or is_banned(actor)then raise exception 'not your game'using errcode='42501';end if;
 if exists(select 1 from sec_events where game_id=g.id and sec_events.actor=sec_commit.actor and request_id=rid)then perform sec_award(g.id);return sec_read(actor,room_code);end if;
 if g.rev<>expected or g.status='finished'then raise exception 'stale revision'using errcode='40001';end if;
 if pg_column_size(next_engine)>200000 or pg_column_size(game_action)>8192 then raise exception 'too large';end if;
 w:=(next_engine->'checkpoint'->'state'->'over'->>'winner')::int;why:=next_engine->'checkpoint'->'state'->'over'->>'reason';
 update sec_games set engine=next_engine,rev=rev+1,status=case when w is null then 'active'else 'finished'end,winner=w,reason=left(why,24),updated_at=now(),deadline=now()+case when next_engine->'prompt' is not null and next_engine->'prompt'<>'null'::jsonb then interval '30 seconds'else interval '60 seconds'end where id=g.id;
 insert into sec_events(game_id,revision,actor,request_id,action)values(g.id,g.rev+1,actor,rid,game_action);
 perform sec_award(g.id);return sec_read(actor,room_code);
end$$;

create or replace function public.sec_seen(actor uuid,room_code text,rid uuid)returns boolean
language plpgsql security definer set search_path=public as $$declare g sec_games;begin
 select * into g from sec_games where code=room_code;
 if not found or(actor<>g.host and actor is distinct from g.guest)then raise exception 'not your game'using errcode='42501';end if;
 return exists(select 1 from sec_events where game_id=g.id and sec_events.actor=sec_seen.actor and request_id=rid);
end$$;
create or replace function public.sec_reward(actor uuid,room_code text)returns jsonb
language plpgsql security definer set search_path=public as $$declare g sec_games;begin
 select * into g from sec_games where code=room_code;
 if not found or(actor<>g.host and actor is distinct from g.guest)then raise exception 'not your game'using errcode='42501';end if;
 return sec_award(g.id);
end$$;
create or replace function public.mm_join(lvl int, mode text default 'casual', deck jsonb default null) returns json
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); m int := 1000;
begin
  if u is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from profiles where id = u) then raise exception 'no profile' using errcode = 'P0006'; end if;
  if not sec_bump(u,'match',12)then raise exception 'rate limited'using errcode='P0015';end if;
  if not sec_deck_ok(deck)or not rank_deck_ok(u,deck)then raise exception 'bad deck';end if;
  if is_banned(u) then raise exception 'banned' using errcode = 'P0011'; end if;
  if mode not in ('casual', 'ranked') then raise exception 'bad mode'; end if;
  if mode = 'ranked' then
    if not rank_deck_ok(u, deck) then raise exception 'deck not allowed' using errcode = 'P0007'; end if;
    perform rank_state();
    select mmr into m from ranks where user_id = u;
  end if;
  delete from mm_queue where seen_at < now() - interval '2 minutes';
  insert into mm_queue (user_id, level, mode, mmr, deck) values (u, least(greatest(coalesce(lvl, 1), 1), 30), mode, m, deck)
    on conflict (user_id) do update set level = excluded.level, mode = excluded.mode, mmr = excluded.mmr, deck = excluded.deck,
      room = null, role = null, created_at = now(), seen_at = now();
  return mm_try(u);
end $$;

create or replace function public.mm_try(u uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me mm_queue; other mm_queue; waited numeric; span int; code text := 'M'; abc constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; i int;
begin
  perform pg_advisory_xact_lock(424242);
  select * into me from mm_queue where user_id = u;
  if not found then return json_build_object('gone', true); end if;
  if me.room is not null then return json_build_object('room', me.room, 'role', me.role, 'mode', me.mode); end if;
  waited := extract(epoch from now() - me.created_at);
  if me.mode = 'ranked' then
    span := case when waited < 15 then 100 when waited < 40 then 250 when waited < 60 then 600 else 100000 end;
    select * into other from mm_queue q
      where q.user_id <> u and q.room is null and q.mode = 'ranked' and q.seen_at > now() - interval '12 seconds' and abs(q.mmr - me.mmr) <= span
        and not blocked_either(u, q.user_id)
      order by q.created_at limit 1;
  else
    span := case when waited < 10 then 3 when waited < 30 then 8 else 99 end;
    select * into other from mm_queue q
      where q.user_id <> u and q.room is null and q.mode = 'casual' and q.seen_at > now() - interval '12 seconds' and abs(q.level - me.level) <= span
        and not blocked_either(u, q.user_id)
      order by q.created_at limit 1;
  end if;
  if found then
    for i in 1 .. 5 loop code := code || substr(abc, 1 + floor(random() * length(abc))::int, 1); end loop;
    update mm_queue set room = code, role = 'host' where user_id = other.user_id;
    update mm_queue set room = code, role = 'guest' where user_id = u;
    if me.mode = 'ranked' then
      insert into matches (room, season, host, guest, host_deck, guest_deck) values (code, rank_season(), other.user_id, u, other.deck, me.deck);
    end if;
    insert into sec_games(code,host,guest,mode,spec)values(code,other.user_id,u,me.mode,
      jsonb_build_object('host',jsonb_build_object('list',other.deck),'guest',jsonb_build_object('list',me.deck),'mode',me.mode,'level',1));
    return json_build_object('room', code, 'role', 'guest', 'mode', me.mode);
  end if;
  return json_build_object('waiting', (select count(*) from mm_queue where room is null and mode = me.mode and seen_at > now() - interval '12 seconds'));
end $$;


-- Old clients must never submit ranked results or settle unilateral reports.
revoke execute on function public.rank_report(text,jsonb),public.rank_settle(text)from public,anon,authenticated;
-- All internal functions are owner/service-only. The public RPC surface is explicitly listed.
do $$declare f record;begin for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'and p.proname like 'sec_%'loop
 execute format('revoke execute on function %s from public,anon,authenticated',f.sig);
 if f.sig::text !~ 'sec_legacy_'then execute format('grant execute on function %s to service_role',f.sig);end if;
end loop;end$$;
revoke execute on function public.mm_poll()from public,anon;
grant execute on function public.sec_gate(text),public.mm_poll()to authenticated;
revoke execute on function public.eco_game(boolean,int,int,int),public.eco_claim(text,text),public.eco_pack(text,int,boolean),public.claim_recovery_code(text)from public,anon;
grant execute on function public.eco_game(boolean,int,int,int),public.eco_claim(text,text),public.eco_pack(text,int,boolean),public.claim_recovery_code(text)to authenticated;
insert into config(key,value)values('secure_games','1')on conflict(key)do update set value=excluded.value;
commit;
