-- Disposable database only. Apply F17 first; runs in a transaction and rolls back.
\set ON_ERROR_STOP on
begin;
create function pg_temp.ok(yes boolean,label text) returns void language plpgsql as $$begin if yes is distinct from true then raise exception 'FAIL: %',label;end if;raise notice 'PASS: %',label;end$$;
create function pg_temp.denied(statement text,want text,label text) returns void language plpgsql as $$begin
 begin execute statement;exception when sqlstate 'P0004' or others then if SQLSTATE=want then raise notice 'PASS: %',label;return;else raise exception 'FAIL: % expected %, got % (%)',label,want,SQLSTATE,SQLERRM;end if;end;
 raise exception 'FAIL: % unexpectedly succeeded',label;end$$;
insert into auth.users(id) values('17000000-0000-4000-8000-000000000001'),('17000000-0000-4000-8000-000000000002'),('17000000-0000-4000-8000-000000000003');
insert into profiles(id,name,fcode) values('17000000-0000-4000-8000-000000000001','Premium Test A','PMTESTA'),('17000000-0000-4000-8000-000000000002','Premium Test B','PMTESTB'),('17000000-0000-4000-8000-000000000003','Premium Admin','PMADMIN');
insert into wallets(user_id) select id from auth.users where id::text like '17000000%';
insert into admins(user_id) values('17000000-0000-4000-8000-000000000003');
set local role authenticated;
select pg_temp.denied('select premium_state()','42501','unauthenticated request blocked');
set local request.jwt.claim.sub='17000000-0000-4000-8000-000000000001';
select pg_temp.ok((premium_state()->>'balance')::int=0,'new paid wallet starts at zero');
select pg_temp.denied('update premium_wallets set balance=999999','42501','direct paid balance forgery blocked');
select pg_temp.denied('select premium_json(''17000000-0000-4000-8000-000000000002'')','42501','private helper cannot reveal other wallets');
select pg_temp.denied('select premium_admin()','42501','buyer cannot review orders');
select pg_temp.denied('select premium_settings(''Fake'','''',true)','42501','buyer cannot change merchant');
select pg_temp.denied('select premium_order(''small'',gen_random_uuid())','P0020','payments closed before real QR configured');
select pg_temp.denied('select premium_exchange(100,gen_random_uuid())','P0004','insufficient special gems refused');
select pg_temp.denied('select premium_exchange(-100,gen_random_uuid())','P0018','negative exchange refused');
select pg_temp.denied('select premium_exchange(101,gen_random_uuid())','P0018','invalid exchange multiple refused');
select pg_temp.denied('select premium_equip(''back-naga'',''back'')','42501','unowned cosmetic cannot be equipped');
reset role;
update premium_wallets set balance=3000 where user_id='17000000-0000-4000-8000-000000000001';
set local role authenticated;
select (premium_exchange(100,'17100000-0000-4000-8000-000000000001')->'premium'->>'balance')::int=2900 as exchange_result \gset
select pg_temp.ok(:'exchange_result'::boolean,'exchange debits special gems');
select pg_temp.ok((premium_exchange(100,'17100000-0000-4000-8000-000000000001')->'state'->>'gems')::int=800,'exchange reply includes fresh regular gems');
select premium_exchange(100,'17100000-0000-4000-8000-000000000001') is not null as retry_ok \gset
select pg_temp.ok((premium_state()->>'balance')::int=2900,'exchange retry does not double debit');
select pg_temp.denied('select premium_exchange(200,''17100000-0000-4000-8000-000000000001'')','P0019','retry key amount mismatch blocked');
select premium_buy('back-naga','17100000-0000-4000-8000-000000000002') is not null as buy_ok \gset
select premium_buy('back-naga','17100000-0000-4000-8000-000000000002') is not null as buy_retry_ok \gset
select premium_buy('back-naga',gen_random_uuid()) is not null as owned_retry_ok \gset
select pg_temp.ok((premium_state()->>'balance')::int=2800,'buy/retry/already-owned charge once');
select pg_temp.ok((premium_equip('back-naga','back')->'premium'->'equipped'->>'back')='back-naga','owned cosmetic can be equipped');
select pg_temp.denied('select premium_equip(''back-naga'',''arena'')','42501','wrong cosmetic slot refused');
select premium_buy('legend-set','17100000-0000-4000-8000-000000000003') is not null as bundle_ok \gset
select pg_temp.ok((premium_state()->>'balance')::int=1880,'bundle charges prorated missing items only (920)');
select pg_temp.ok(jsonb_array_length(premium_state()->'owned')=4,'bundle grants exactly four cosmetics');
select pg_temp.denied('select premium_buy(''back-stars'',''17100000-0000-4000-8000-000000000003'')','P0019','purchase retry product mismatch blocked');
select pg_temp.denied('insert into storage.objects(bucket_id,name) values(''merchant-qr'',''qr/17000000-0000-4000-8000-000000000001.png'')','42501','buyer cannot upload merchant QR');
set local request.jwt.claim.sub='17000000-0000-4000-8000-000000000003';
select pg_temp.denied('select premium_settings(''Merchant'','''',true)','P0018','admin cannot enable payments without QR');
insert into storage.objects(bucket_id,name) values('merchant-qr','qr/17000000-0000-4000-8000-000000000003.png');
select pg_temp.denied('select premium_settings(''Merchant'',''qr/17000000-0000-4000-8000-999999999999.png'',true)','P0018','merchant QR must exist in storage');
select pg_temp.denied('select premium_settings(''Merchant'',''qr/17000000-0000-4000-8000-000000000003.png'',true)','P0023','cannot enable without all amount QRs');
insert into storage.objects(bucket_id,name) values('merchant-qr','qr/17000000-0000-4000-8000-000000010000.png'),('merchant-qr','qr/17000000-0000-4000-8000-000000030000.png'),('merchant-qr','qr/17000000-0000-4000-8000-000000050000.png'),('merchant-qr','qr/17000000-0000-4000-8000-000000100000.png');
select premium_settings('Merchant','qr/17000000-0000-4000-8000-000000000003.png',true,'{"10000":"qr/17000000-0000-4000-8000-000000010000.png","30000":"qr/17000000-0000-4000-8000-000000030000.png","50000":"qr/17000000-0000-4000-8000-000000050000.png","100000":"qr/17000000-0000-4000-8000-000000100000.png"}'::jsonb) is not null as config_ok \gset
set local request.jwt.claim.sub='17000000-0000-4000-8000-000000000001';
select premium_order('small','17200000-0000-4000-8000-000000000001')->>'order' as first_order \gset
select pg_temp.ok(premium_order('small','17200000-0000-4000-8000-000000000001')->>'order'=:'first_order','order retry returns same order');
select pg_temp.denied('select premium_order(''large'',''17200000-0000-4000-8000-000000000001'')','P0019','order retry pack mismatch blocked');
select pg_temp.ok((select amount_lak=10000 and gems=100 from premium_orders where id=:'first_order'),'order contains canonical price and amount');
select pg_temp.ok((select qr_path='qr/17000000-0000-4000-8000-000000010000.png' and qr_amount_lak=amount_lak from premium_orders where id=:'first_order'),'order selects canonical amount QR');
reset role;
update premium_packs set amount_lak=10001 where id='small';
set local role authenticated;
select pg_temp.denied('select premium_order(''small'',gen_random_uuid())','P0023','changed pack price cannot use a stale amount QR');
select pg_temp.ok(not (premium_state()->'payment'->>'enabled')::boolean,'missing amount QR closes payments');
select pg_temp.ok((select amount_lak=10000 and qr_amount_lak=10000 and qr_path='qr/17000000-0000-4000-8000-000000010000.png' from premium_orders where id=:'first_order'),'existing bill keeps original QR and amount');
reset role;
update premium_packs set amount_lak=10000 where id='small';
set local role authenticated;
select premium_order('medium',gen_random_uuid())->>'order' as second_order \gset
select pg_temp.ok((select qr_path='qr/17000000-0000-4000-8000-000000030000.png' and qr_amount_lak=30000 from premium_orders where id=:'second_order'),'medium pack uses 30000 QR');
select premium_order('large',gen_random_uuid())->>'order' as third_order \gset
select pg_temp.ok((select qr_path='qr/17000000-0000-4000-8000-000000050000.png' and qr_amount_lak=50000 from premium_orders where id=:'third_order'),'large pack uses 50000 QR');
select pg_temp.denied('select premium_order(''chest'',gen_random_uuid())','P0021','open order limit enforced');
select premium_cancel(:'third_order') is not null as cancel_ok \gset
select premium_order('chest',gen_random_uuid())->>'order' as chest_order \gset
select pg_temp.ok((select qr_path='qr/17000000-0000-4000-8000-000000100000.png' and qr_amount_lak=100000 from premium_orders where id=:'chest_order'),'chest uses 100000 QR');
select premium_cancel(:'chest_order') is not null as chest_cancel \gset
select premium_order('small','17200000-0000-4000-8000-000000000004')->>'order' as expired_order \gset
reset role;
update premium_orders set expires_at=now()-interval '1 hour' where id=:'expired_order';
set local role authenticated;
select pg_temp.ok((select o->>'status'='expired' from jsonb_array_elements(premium_state()->'orders')o where o->>'id'=:'expired_order'),'expired bill is labelled expired');
select premium_submit(:'expired_order','LATE-PAID-REFERENCE') is not null as late_submit \gset
select pg_temp.ok((select status='submitted' from premium_orders where id=:'expired_order'),'already-paid expired bill can be manually reviewed');
select premium_cancel(:'expired_order') is not null as no_cancel \gset
select pg_temp.ok((select status='submitted' from premium_orders where id=:'expired_order'),'submitted bill cannot be cancelled');
select premium_submit(:'first_order','CLIENT-REFERENCE-1') is not null as submit_ok \gset
select premium_submit(:'first_order','CLIENT-REFERENCE-1') is not null as submit_retry_ok \gset
select pg_temp.ok((premium_state()->>'balance')::int=1880,'customer reference never credits gems');
select premium_submit(:'second_order','CLIENT-REFERENCE-1') is not null as duplicate_customer_ref_ok \gset
select pg_temp.ok((select count(*)=3 from premium_orders where status='submitted'),'customer ref does not reserve verified bank reference');
set local request.jwt.claim.sub='17000000-0000-4000-8000-000000000002';
select pg_temp.ok((premium_state()->>'balance')::int=0,'other buyer starts at zero');
select pg_temp.ok((select count(*)=0 from premium_orders),'RLS hides other buyer orders');
select pg_temp.ok((select count(*)=1 from premium_wallets),'RLS shows only own paid wallet');
select pg_temp.denied(format('select premium_submit(%L,''STEAL'')',:'first_order'),'42501','cross-user order mutation blocked');
set local request.jwt.claim.sub='17000000-0000-4000-8000-000000000003';
select pg_temp.denied(format('select premium_review(%L,''approve'',''BANK-000'')',:'third_order'),'P0022','cancelled order cannot be approved');
select premium_review(:'first_order','approve','BANK-001') is not null as approve_ok \gset
select premium_review(:'first_order','approve','bank-001') is not null as approval_retry_ok \gset
select pg_temp.denied(format('select premium_review(%L,''approve'',''BANK-001'')',:'second_order'),'23505','same verified bank transaction cannot fund second order');
set local request.jwt.claim.sub='17000000-0000-4000-8000-000000000001';
select pg_temp.ok((premium_state()->>'balance')::int=1980,'approval credits once and duplicate bank transaction rolls back');
select pg_temp.ok((select count(*)=1 from premium_ledger where kind='topup'),'one ledger credit for approved order');
select pg_temp.ok((select status='submitted' from premium_orders where id=:'second_order'),'failed duplicate approval leaves order submitted');
reset role;
select pg_temp.ok((select gems=800 from wallets where user_id='17000000-0000-4000-8000-000000000001'),'regular gems credited once at exactly 1:5');
update profiles set banned=true where id='17000000-0000-4000-8000-000000000001';
set local role authenticated;
select pg_temp.denied('select premium_state()','42501','banned buyer cannot use paid wallet');
reset role;
rollback;
