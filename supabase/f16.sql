-- F16: a new solo game replaces abandoned solo rooms; no gems or rank are awarded.
-- Run after f15. Online matches are not cancelled.
begin;
create or replace function public.sec_create(actor uuid,room_code text,game_mode text,game_spec jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$ declare g sec_games; begin
 if is_banned(actor) or not exists(select 1 from profiles where id=actor)then raise exception 'not allowed' using errcode='42501';end if;
 if game_spec->>'stage' is not null and (game_spec->>'stage')::int > coalesce((select adv from wallets where user_id=actor),0)then raise exception 'stage locked';end if;
 if game_mode not in('bot','casual') or room_code !~ '^[A-Z2-9]{8}$' or not sec_deck_ok(game_spec->'host'->'list')or not rank_deck_ok(actor,game_spec->'host'->'list')then raise exception 'bad game';end if;
 -- Starting another solo game replaces the previous solo run, without awarding a result.
 -- Serialize starts for this player so concurrent taps cannot leave multiple active bot games.
 perform 1 from profiles where id=actor for update;
 if game_mode='bot'then
  update sec_games set status='finished',reason='cancelled',winner=1,deadline=null,
   engine=case when engine is null then null else jsonb_set(engine,'{checkpoint,state,over}','{"winner":1,"reason":"cancelled"}'::jsonb)end,
   progressed=true,rewarded=true,reward='{}'::jsonb,updated_at=now()
  where host=actor and mode='bot'and status<>'finished';
 end if;
 update sec_games set status='finished',reason='cancelled'where host=actor and status='waiting'and engine is null;
 if(select count(*)from sec_games where host=actor and status<>'finished' and expires_at>now())>=3 then raise exception 'too many games';end if;
 insert into sec_games(code,host,mode,spec)values(room_code,actor,game_mode,game_spec)returning * into g;return to_jsonb(g);
end $$;
revoke execute on function public.sec_create(uuid,text,text,jsonb)from public,anon,authenticated;
grant execute on function public.sec_create(uuid,text,text,jsonb)to service_role;
commit;
