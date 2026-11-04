-- Throwaway PostgreSQL only. Never run this fixture in Supabase.
-- psql -v ON_ERROR_STOP=1 -f tools/deck-27-sql-test.sql
create schema auth;
create function auth.uid() returns uuid language sql as $$ select '00000000-0000-0000-0000-000000000027'::uuid $$;
do $$ begin if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if; end $$;
create table public.wallets(user_id uuid primary key,last_game timestamptz,day date,day_gems int default 0,day_xp int default 0,first_win_day date,gems int default 0,hard_beat int[] default '{}',adv int default 0,free_packs int default 0);
create table public.config(key text,value text);
create table public.cards_catalog(id text primary key,rarity text,packable boolean,neutral boolean,has_alt boolean,decks int[]);
create function public.eco_xp(uuid,int) returns int[] language sql as $$ select array[1,1] $$;
create function public.eco_give(uuid,text) returns text language sql as $$ select 'new'::text $$;
create function public.eco_json(uuid) returns json language sql as $$ select '{}'::json $$;
create function public.sec_legacy_eco_game(boolean,int,int,int default null) returns json language sql as $$ select '{}'::json $$;
grant execute on function public.sec_legacy_eco_game(boolean,int,int,int) to authenticated;
\ir ../supabase/f24.sql
\ir ../supabase/f24.sql
insert into public.wallets(user_id) values(auth.uid());
do $$
declare r json;
begin
 if (select count(*) from cards_catalog) <> 15 then raise exception 'Expected 15 packable designs';end if;
 if exists(select 1 from cards_catalog where not packable or decks <> '{26}'::int[]) then raise exception 'Wrong pack membership';end if;
 if exists(select 1 from cards_catalog where id in ('dinobabyrex','dinometarex','dinometatrike','dinometaraptor','dinoevoemperor','dinoevobastion','dinoevoblader')) then raise exception 'Generated form in catalog';end if;
 if not has_function_privilege('authenticated','public.sec_legacy_eco_game(boolean,int,int,int)','execute') then raise exception 'Existing grants lost';end if;
 r:=sec_legacy_eco_game(true,2,26);
 if r->>'drop' <> 'dinoking' or r->>'base' <> '35' or r->>'first' <> '50' then raise exception 'New legend or reward changed: %',r;end if;
 if not exists(select 1 from wallets where user_id=auth.uid() and 26=any(hard_beat)) then raise exception 'Hard victory not recorded';end if;
 update wallets set last_game=now()-interval '1 minute';
 r:=sec_legacy_eco_game(false,1,26);
 if r->>'base' <> '5' or r->>'first' <> '0' then raise exception 'Loss reward changed';end if;
 update wallets set last_game=now()-interval '1 minute';
 r:=sec_legacy_eco_game(true,2,25);
 if r->>'drop' <> 'lanxangmk0' then raise exception 'Old deck legend changed';end if;
 raise notice 'PASS: repeatable F24, 15 packable cards, 7 excluded forms, grants, deck27/26 rewards and loss payout';
end $$;
