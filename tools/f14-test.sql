-- Run only against a disposable database after migrations f1–f14.
-- Uses fake account IDs and rolls all fixtures back.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000014'), ('00000000-0000-0000-0000-000000000015');
insert into public.profiles(id,name) values ('00000000-0000-0000-0000-000000000014','AuditStarter'), ('00000000-0000-0000-0000-000000000015','AuditBanned');
update public.profiles set banned=true where id='00000000-0000-0000-0000-000000000015';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000014',true);
do $$
declare r json; again json;
begin
  r := public.eco_import('{"gems":999999,"xp":999999,"freePacks":99,"cards":{"hydronak":3},"alts":{"hydronak":true},"adv":10}'::jsonb);
  if (r->>'gems')::int <> 300 or (r->>'xp')::int <> 0 or (r->>'freePacks')::int <> 0 or (r->>'adv')::int <> 0 then raise exception 'untrusted currency/progress imported'; end if;
  if (r->'cards')::jsonb ? 'hydronak' then raise exception 'untrusted card imported'; end if;
  if json_array_length(r->'alts') <> 0 then raise exception 'untrusted alternate art imported'; end if;
  if (r->'cards'->>'phayanak')::int <> 1 or (r->'cards'->>'thaohung')::int <> 1 or (r->'cards'->>'phralam')::int <> 1 then raise exception 'starter legends missing'; end if;
  if (select count(*) from json_object_keys(r->'cards')) <> 57 then raise exception 'starter count mismatch'; end if;
  again := public.eco_import(null);
  if again::jsonb <> r::jsonb then raise exception 'repeated import changed wallet'; end if;
  if has_function_privilege('anon','public.eco_import(jsonb)','EXECUTE') then raise exception 'anonymous role can import'; end if;
end $$;
reset role;
update public.wallets set gems=777,xp=123 where user_id='00000000-0000-0000-0000-000000000014';
set local role authenticated;
do $$
declare r json;
begin
  r := public.eco_import('{}');
  if (r->>'gems')::int <> 777 or (r->>'xp')::int <> 123 then raise exception 'existing wallet overwritten'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000015',true);
do $$
begin
  begin
    perform public.eco_import('{}');
    raise exception 'banned account was admitted';
  exception when sqlstate 'P0011' then null;
  end;
end $$;
select set_config('request.jwt.claim.sub','',true);
do $$
begin
  begin
    perform public.eco_import('{}');
    raise exception 'missing identity was admitted';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;
\echo 'PASS: fixed starter, malicious input, repeat calls, existing balance, permissions and bans'
