-- Disposable DB only, after f1–f15. Fixtures roll back.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id)values('00000000-0000-0000-0000-000000000101'),('00000000-0000-0000-0000-000000000102'),('00000000-0000-0000-0000-000000000103');
insert into profiles(id,name)values('00000000-0000-0000-0000-000000000101','SecureHost'),('00000000-0000-0000-0000-000000000102','SecureGuest'),('00000000-0000-0000-0000-000000000103','SecureOutside');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000101',true);
select eco_import('{}');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000102',true);
select eco_import('{}');
-- The test deck exactly matches the server starter, with 30 legal cards.
create temporary table test_deck as select jsonb_object_agg(card_id,n)as d from(select card_id,n,sum(n)over(order by card_id)as running from owned_cards where user_id='00000000-0000-0000-0000-000000000101')a where running<=30;
-- Build a legal 30-card list, trimming the last entry as needed.
update test_deck set d=(select jsonb_object_agg(card_id,least(n,30-prior))from(select card_id,n,coalesce(sum(n)over(order by card_id rows between unbounded preceding and 1 preceding),0)::int prior from owned_cards where user_id='00000000-0000-0000-0000-000000000101')x where prior<30);
select sec_create('00000000-0000-0000-0000-000000000101','ABCDEFGH','casual',jsonb_build_object('host',jsonb_build_object('list',d),'guest',null,'level',1))from test_deck;
select sec_join('00000000-0000-0000-0000-000000000102','ABCDEFGH',jsonb_build_object('list',d))from test_deck;
do $$begin
 if has_function_privilege('authenticated','sec_commit(uuid,text,integer,uuid,jsonb,jsonb)','execute')then raise exception 'client can commit state';end if;
 if has_function_privilege('authenticated','sec_read(uuid,text)','execute')then raise exception 'client can impersonate read';end if;
 if has_function_privilege('authenticated','sec_legacy_eco_game(boolean,integer,integer,integer)','execute')then raise exception 'legacy reward exposed';end if;
 if has_function_privilege('authenticated','rank_report(text,jsonb)','execute')then raise exception 'untrusted ranked report exposed';end if;
 if has_table_privilege('authenticated','sec_games','select')then raise exception 'client can read private games';end if;
 begin perform sec_read('00000000-0000-0000-0000-000000000103','ABCDEFGH');raise exception 'outsider read';exception when insufficient_privilege then null;end;
 begin perform sec_join('00000000-0000-0000-0000-000000000103','ABCDEFGH','{}');raise exception 'third member admitted';exception when insufficient_privilege then null;end;
end$$;
-- Commit one terminal result twice with the same retry key: counters must only increase once.
select sec_commit('00000000-0000-0000-0000-000000000101','ABCDEFGH',0,'00000000-0000-4000-8000-000000000001','{"checkpoint":{"state":{"over":{"winner":0,"reason":"life"},"secureCounts":[{"play":15},{}]}}}','{"op":"move"}');
select sec_commit('00000000-0000-0000-0000-000000000101','ABCDEFGH',0,'00000000-0000-4000-8000-000000000001','{"checkpoint":{"state":{"over":{"winner":0,"reason":"life"},"secureCounts":[{"play":15},{}]}}}','{"op":"move"}');
do $$begin
 if(select(counts->>'game')::int from sec_progress where user_id='00000000-0000-0000-0000-000000000101'and day=current_date)<>1 then raise exception 'duplicate reward progress';end if;
 begin perform sec_commit('00000000-0000-0000-0000-000000000101','ABCDEFGH',0,'00000000-0000-4000-8000-000000000002','{}','{}');raise exception 'stale write accepted';exception when serialization_failure then null;end;
end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000101',true);
do $$declare i int;r text;begin
 begin perform eco_game(true,2,0,null);raise exception 'fake win accepted';exception when insufficient_privilege then null;end;
 begin perform eco_claim('quest','win');raise exception 'unearned quest accepted';exception when sqlstate 'P0005'then null;end;
 perform eco_claim('quest','play');
 begin perform eco_claim('quest','play');raise exception 'quest paid twice';exception when sqlstate 'P0005'then null;end;
 for i in 1..5 loop r:=claim_recovery_code('WRONG');if r<>'bad_code'then raise exception 'wrong-code result';end if;end loop;
 if claim_recovery_code('WRONG')<>'rate_limited'then raise exception 'failed recovery attempts did not count';end if;
end$$;
reset role;
rollback;
\echo 'PASS: room membership, table/RPC isolation, fake wins, duplicate commits/claims, stale revisions and recovery rate limits'
