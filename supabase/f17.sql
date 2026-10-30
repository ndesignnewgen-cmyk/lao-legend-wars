-- F17 · owner-approved BCEL top-ups, special gems, one-way 1:5 exchange and cosmetic shop.
-- Run after F1–F16. Re-runnable. Payments start CLOSED until an admin supplies a merchant QR.
begin;
create table if not exists public.premium_wallets (
 user_id uuid primary key references auth.users(id) on delete cascade,
 balance int not null default 0 check(balance between 0 and 100000000),
 card_back text not null default '', arena text not null default ''
);
create table if not exists public.premium_packs (
 id text primary key, amount_lak int not null check(amount_lak>0), gems int not null check(gems>0), active boolean not null default true
);
insert into public.premium_packs(id,amount_lak,gems) values
 ('small',10000,100),('medium',30000,330),('large',50000,575),('chest',100000,1200) on conflict do nothing;
create table if not exists public.premium_products (
 id text primary key, kind text not null check(kind in('back','arena','bundle')), price int not null check(price>0),
 contents text[] not null, active boolean not null default true
);
insert into public.premium_products(id,kind,price,contents) values
 ('back-naga','back',100,'{back-naga}'),('back-sinh','back',150,'{back-sinh}'),('back-stars','back',200,'{back-stars}'),
 ('arena-meteor','arena',800,'{arena-meteor}'),('legend-set','bundle',1000,'{back-naga,back-sinh,back-stars,arena-meteor}') on conflict do nothing;
create table if not exists public.premium_owned (
 user_id uuid not null references auth.users(id) on delete cascade,
 product_id text not null references public.premium_products(id), acquired_at timestamptz not null default now(), primary key(user_id,product_id)
);
create table if not exists public.premium_payment_config (
 id boolean primary key default true check(id), enabled boolean not null default false,
 receiver text not null default '', qr_path text not null default '', updated_at timestamptz not null default now()
);
insert into public.premium_payment_config(id) values(true) on conflict do nothing;
alter table public.premium_payment_config add column if not exists amount_qrs jsonb not null default '{}'::jsonb check(jsonb_typeof(amount_qrs)='object');
create table if not exists public.premium_orders (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null,
 request_key uuid not null, pack_id text not null references public.premium_packs(id), amount_lak int not null check(amount_lak>0),
 gems int not null check(gems>0), status text not null default 'pending' check(status in('pending','submitted','approved','rejected','cancelled')),
 receiver text not null, qr_path text not null, customer_reference text, bank_reference text,
 reason text, created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '24 hours',
 submitted_at timestamptz, reviewed_at timestamptz, reviewed_by uuid references auth.users(id) on delete set null,
 unique(user_id,request_key)
);
alter table public.premium_orders add column if not exists qr_amount_lak int check(qr_amount_lak is null or qr_amount_lak=amount_lak);
-- Only a bank reference independently verified by the admin reserves a bank transaction.
create unique index if not exists premium_bank_reference_unique on public.premium_orders(bank_reference) where bank_reference is not null;
create index if not exists premium_orders_owner on public.premium_orders(user_id,created_at desc);
create table if not exists public.premium_ledger (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null,
 kind text not null check(kind in('topup','exchange','purchase')), special_delta int not null, gem_delta int not null default 0,
 request_key uuid not null, order_id uuid references public.premium_orders(id), product_id text,
 created_at timestamptz not null default now(), unique(user_id,request_key), unique(order_id)
);
create index if not exists premium_ledger_owner on public.premium_ledger(user_id,created_at desc);
alter table public.premium_wallets enable row level security;
alter table public.premium_packs enable row level security;
alter table public.premium_products enable row level security;
alter table public.premium_owned enable row level security;
alter table public.premium_payment_config enable row level security;
alter table public.premium_orders enable row level security;
alter table public.premium_ledger enable row level security;
revoke all on public.premium_wallets,public.premium_packs,public.premium_products,public.premium_owned,
 public.premium_payment_config,public.premium_orders,public.premium_ledger from anon,authenticated;
grant select on public.premium_wallets,public.premium_owned,public.premium_orders,public.premium_ledger to authenticated;
drop policy if exists premium_wallet_read on public.premium_wallets;
create policy premium_wallet_read on public.premium_wallets for select to authenticated using(user_id=auth.uid());
drop policy if exists premium_owned_read on public.premium_owned;
create policy premium_owned_read on public.premium_owned for select to authenticated using(user_id=auth.uid());
drop policy if exists premium_order_read on public.premium_orders;
create policy premium_order_read on public.premium_orders for select to authenticated using(user_id=auth.uid());
drop policy if exists premium_ledger_read on public.premium_ledger;
create policy premium_ledger_read on public.premium_ledger for select to authenticated using(user_id=auth.uid());

create or replace function public.premium_user() returns uuid language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid();begin
 if u is null or is_banned(u) then raise insufficient_privilege using message='Sign in required';end if;
 if not exists(select 1 from wallets where user_id=u) then raise exception using errcode='P0017',message='Wallet not ready';end if;
 insert into premium_wallets(user_id) values(u) on conflict do nothing;return u;
end $$;
create or replace function public.premium_price(u uuid, product_key text) returns int language sql stable security definer set search_path=public as $$
 select coalesce(ceil(p.price::numeric * sum(case when o.product_id is null then child.price else 0 end)/nullif(sum(child.price),0)),0)::int
 from premium_products p cross join unnest(p.contents) as c(id) join premium_products child on child.id=c.id
 left join premium_owned o on o.user_id=u and o.product_id=c.id where p.id=product_key group by p.price
$$;
create or replace function public.premium_json(u uuid) returns jsonb language sql volatile security definer set search_path=public as $$
 select jsonb_build_object('balance',w.balance,'owned',coalesce((select jsonb_agg(product_id order by product_id) from premium_owned where user_id=u),'[]'::jsonb),
 'equipped',jsonb_build_object('back',w.card_back,'arena',w.arena),
 'packs',coalesce((select jsonb_agg(to_jsonb(p) order by amount_lak) from premium_packs p where active),'[]'::jsonb),
 'products',coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('payPrice',premium_price(u,p.id)) order by price) from premium_products p where active),'[]'::jsonb),
 'payment',(select jsonb_build_object('bank','BCEL One / OnePay','enabled',enabled and receiver<>'' and qr_path<>'' and not exists(select 1 from premium_packs p where p.active and not(amount_qrs ? p.amount_lak::text)),'receiver',receiver,'qrPath',qr_path) from premium_payment_config where id),
 'orders',coalesce((select jsonb_agg(x order by x.created_at desc) from (select id,pack_id,amount_lak,gems,
 case when status='pending' and expires_at<now() then 'expired' else status end status,receiver,qr_path,qr_amount_lak,customer_reference,reason,created_at,expires_at from premium_orders where user_id=u order by created_at desc limit 50)x),'[]'::jsonb),
 'ledger',coalesce((select jsonb_agg(x order by x.created_at desc) from(select id,kind,special_delta,gem_delta,product_id,order_id,created_at from premium_ledger where user_id=u order by created_at desc limit 100)x),'[]'::jsonb))
 from premium_wallets w where user_id=u
$$;
create or replace function public.premium_state() returns jsonb language plpgsql security definer set search_path=public as $$
begin return premium_json(premium_user());end $$;

create or replace function public.premium_exchange(amount int,request_key uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=premium_user();w premium_wallets;l premium_ledger;
begin
 if amount is null or amount<100 or amount>100000 or amount%100<>0 or request_key is null then raise exception using errcode='P0018',message='Exchange in units of 100';end if;
 select * into w from premium_wallets where user_id=u for update;
 select * into l from premium_ledger where user_id=u and premium_ledger.request_key=premium_exchange.request_key;
 if found then
  if l.kind<>'exchange' or l.special_delta<>-amount then raise exception using errcode='P0019',message='Retry key mismatch';end if;
  return jsonb_build_object('premium',premium_json(u),'state',eco_json(u));
 end if;
 if w.balance<amount then raise exception using errcode='P0004',message='Not enough special gems';end if;
 update premium_wallets set balance=balance-amount where user_id=u;
 update wallets set gems=gems+amount*5 where user_id=u;
 insert into premium_ledger(user_id,kind,special_delta,gem_delta,request_key) values(u,'exchange',-amount,amount*5,request_key);
 return jsonb_build_object('premium',premium_json(u),'state',eco_json(u));
end $$;

create or replace function public.premium_buy(product_key text,request_key uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=premium_user();w premium_wallets;p premium_products;l premium_ledger;n int;
begin
 if request_key is null then raise exception using errcode='P0018',message='Missing retry key';end if;
 select * into w from premium_wallets where user_id=u for update;
 select * into l from premium_ledger where user_id=u and premium_ledger.request_key=premium_buy.request_key;
 if found then
  if l.kind<>'purchase' or l.product_id is distinct from product_key then raise exception using errcode='P0019',message='Retry key mismatch';end if;
  return jsonb_build_object('premium',premium_json(u));
 end if;
 select * into p from premium_products where id=product_key and active;if not found then raise exception using errcode='P0018',message='Unknown product';end if;
 n:=premium_price(u,product_key);if n<=0 then return jsonb_build_object('premium',premium_json(u));end if;
 if w.balance<n then raise exception using errcode='P0004',message='Not enough special gems';end if;
 update premium_wallets set balance=balance-n where user_id=u;
 insert into premium_owned(user_id,product_id) select u,unnest(p.contents) on conflict do nothing;
 insert into premium_ledger(user_id,kind,special_delta,request_key,product_id) values(u,'purchase',-n,request_key,product_key);
 return jsonb_build_object('premium',premium_json(u));
end $$;
create or replace function public.premium_equip(product_key text,slot text) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=premium_user();k text;
begin
 if slot is null or slot not in('back','arena') or product_key is null then raise exception using errcode='P0018',message='Unknown slot';end if;
 if product_key<>'' then
  select p.kind into k from premium_products p join premium_owned o on o.product_id=p.id where o.user_id=u and p.id=product_key;
  if k is distinct from slot then raise insufficient_privilege using message='Item not owned';end if;
 end if;
 if slot='back' then update premium_wallets set card_back=product_key where user_id=u;
 else update premium_wallets set arena=product_key where user_id=u;end if;
 return jsonb_build_object('premium',premium_json(u));
end $$;

create or replace function public.premium_order(pack_key text,request_key uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=premium_user();p premium_packs;c premium_payment_config;o premium_orders;selected_qr text;
begin
 if request_key is null then raise exception using errcode='P0018',message='Missing retry key';end if;
 -- Serialize creation/retries and the pending-order limit per buyer.
 perform 1 from premium_wallets where user_id=u for update;
 select * into o from premium_orders where user_id=u and premium_orders.request_key=premium_order.request_key;
 if found then
  if o.pack_id is distinct from pack_key then raise exception using errcode='P0019',message='Retry key mismatch';end if;
  return jsonb_build_object('premium',premium_json(u),'order',o.id);
 end if;
 select * into c from premium_payment_config where id;
 if not c.enabled or c.receiver='' or c.qr_path='' then raise exception using errcode='P0020',message='Top-ups not open';end if;
 select * into p from premium_packs where id=pack_key and active;if not found then raise exception using errcode='P0018',message='Unknown pack';end if;
 selected_qr:=c.amount_qrs->>p.amount_lak::text;
 if selected_qr is null then raise exception using errcode='P0023',message='Amount QR not configured';end if;
 if(select count(*) from premium_orders where user_id=u and(status='submitted' or(status='pending' and expires_at>now())))>=3 then raise exception using errcode='P0021',message='Three orders already open';end if;
 insert into premium_orders(user_id,request_key,pack_id,amount_lak,gems,receiver,qr_path,qr_amount_lak) values(u,request_key,pack_key,p.amount_lak,p.gems,c.receiver,selected_qr,p.amount_lak) returning * into o;
 return jsonb_build_object('premium',premium_json(u),'order',o.id);
end $$;
create or replace function public.premium_submit(order_key uuid,transfer_reference text) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=premium_user();o premium_orders;r text:=btrim(transfer_reference);
begin
 if r is null or length(r)<4 or length(r)>80 then raise exception using errcode='P0018',message='Enter bank transaction reference';end if;
 select * into o from premium_orders where id=order_key and user_id=u for update;if not found then raise insufficient_privilege using message='Order not found';end if;
 if o.status='submitted' and o.customer_reference=r then return jsonb_build_object('premium',premium_json(u));end if;
 -- An already-paid expired bill can still be submitted for manual bank verification.
 if o.status<>'pending' then raise exception using errcode='P0022',message='Order no longer awaiting payment';end if;
 update premium_orders set status='submitted',customer_reference=r,submitted_at=now() where id=order_key;
 return jsonb_build_object('premium',premium_json(u));
end $$;
create or replace function public.premium_cancel(order_key uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=premium_user();begin
 update premium_orders set status='cancelled' where id=order_key and user_id=u and status='pending';
 return jsonb_build_object('premium',premium_json(u));
end $$;

create or replace function public.premium_admin() returns jsonb language plpgsql security definer set search_path=public as $$
begin
 if not is_admin() then raise insufficient_privilege using message='Admins only';end if;
 return jsonb_build_object('config',(select to_jsonb(c) from premium_payment_config c where id),'packs',(select jsonb_agg(to_jsonb(p) order by amount_lak) from premium_packs p where active),
 'orders',coalesce((select jsonb_agg(x order by x.created_at desc) from(select o.*,p.name,p.fcode from premium_orders o left join profiles p on p.id=o.user_id order by(status='submitted')desc,created_at desc limit 100)x),'[]'::jsonb));
end $$;
create or replace function public.premium_review(order_key uuid,decision text,bank_reference text default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare o premium_orders;r text:=upper(btrim(bank_reference));
begin
 if not is_admin() then raise insufficient_privilege using message='Admins only';end if;
 select * into o from premium_orders where id=order_key for update;if not found then raise exception using errcode='P0018',message='Order not found';end if;
 if o.status='approved' and decision='approve' and o.bank_reference=r then return premium_admin();end if;
 if o.status<>'submitted' or o.user_id is null then raise exception using errcode='P0022',message='Order not reviewable';end if;
 if decision='approve' then
  if r is null or length(r)<4 or length(r)>80 then raise exception using errcode='P0018',message='Verified bank reference required';end if;
  insert into premium_wallets(user_id) values(o.user_id) on conflict do nothing;
  perform 1 from premium_wallets where user_id=o.user_id for update;
  update premium_orders set status='approved',bank_reference=r,reviewed_at=now(),reviewed_by=auth.uid() where id=o.id;
  update premium_wallets set balance=balance+o.gems where user_id=o.user_id;
  insert into premium_ledger(user_id,kind,special_delta,request_key,order_id) values(o.user_id,'topup',o.gems,gen_random_uuid(),o.id);
 elsif decision in('not_found','wrong_amount','duplicate') then
  update premium_orders set status='rejected',reason=decision,reviewed_at=now(),reviewed_by=auth.uid() where id=o.id;
 else raise exception using errcode='P0018',message='Unknown review decision';end if;
 return premium_admin();
end $$;

-- Public merchant QR artwork only. No bank/API secrets are stored here.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('merchant-qr','merchant-qr',true,2097152,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
drop policy if exists premium_qr_insert on storage.objects;
create policy premium_qr_insert on storage.objects for insert to authenticated with check(bucket_id='merchant-qr' and(name~'^qr/[0-9a-f-]{36}\.(png|jpg|webp)$')and public.admin_check());
-- Replace the pre-amount-QR signature when updating an earlier F17 installation.
drop function if exists public.premium_settings(text,text,boolean);
create or replace function public.premium_settings(receiver_name text,qr_path text,enabled boolean,amount_qrs jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare pair record;
begin
 if not is_admin() then raise insufficient_privilege using message='Admins only';end if;
 if receiver_name is null or length(btrim(receiver_name))>100 or qr_path is null or amount_qrs is null or jsonb_typeof(amount_qrs)<>'object' then raise exception using errcode='P0018',message='Invalid merchant';end if;
 if qr_path<>'' and(qr_path!~'^qr/[0-9a-f-]{36}\.(png|jpg|webp)$' or not exists(select 1 from storage.objects o where o.bucket_id='merchant-qr' and o.name=qr_path))then raise exception using errcode='P0018',message='Upload merchant QR first';end if;
 for pair in select key,value from jsonb_each_text(amount_qrs) loop
  if pair.value is null or pair.value!~'^qr/[0-9a-f-]{36}\.(png|jpg|webp)$' or not exists(select 1 from premium_packs p where p.amount_lak::text=pair.key) or not exists(select 1 from storage.objects o where o.bucket_id='merchant-qr' and o.name=pair.value) then raise exception using errcode='P0018',message='Invalid amount QR';end if;
 end loop;
 if enabled and(btrim(receiver_name)='' or qr_path='')then raise exception using errcode='P0018',message='Merchant and QR required';end if;
 if enabled and exists(select 1 from premium_packs p where p.active and not(amount_qrs ? p.amount_lak::text))then raise exception using errcode='P0023',message='Prepare QR for every active pack';end if;
 update premium_payment_config set receiver=btrim(receiver_name),qr_path=premium_settings.qr_path,enabled=premium_settings.enabled,amount_qrs=premium_settings.amount_qrs,updated_at=now() where id;
 return premium_admin();
end $$;

revoke execute on function public.premium_user(),public.premium_json(uuid),public.premium_price(uuid,text) from public,anon,authenticated;
do $$declare f text;begin
 foreach f in array array['premium_state()','premium_exchange(integer,uuid)','premium_buy(text,uuid)','premium_equip(text,text)',
 'premium_order(text,uuid)','premium_submit(uuid,text)','premium_cancel(uuid)','premium_admin()','premium_review(uuid,text,text)','premium_settings(text,text,boolean,jsonb)']loop
 execute 'revoke execute on function public.'||f||' from public,anon';
 execute 'grant execute on function public.'||f||' to authenticated';
 end loop;
end $$;
commit;
