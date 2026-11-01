-- Lao Legend Wars · F20: five new paid arenas (01/11/2026). Run after f17.sql (any time after it). Safe to run again.
-- Each arena 800 special gems; the set of 5 costs 3000 (the price drops by what a player already owns).
begin;
insert into public.premium_products(id,kind,price,contents) values
 ('arena-naga','arena',800,'{arena-naga}'),
 ('arena-bangfai','arena',800,'{arena-bangfai}'),
 ('arena-heuafai','arena',800,'{arena-heuafai}'),
 ('arena-himmasky','arena',800,'{arena-himmasky}'),
 ('arena-neon','arena',800,'{arena-neon}'),
 ('arena-set5','bundle',3000,'{arena-naga,arena-bangfai,arena-heuafai,arena-himmasky,arena-neon}')
on conflict (id) do update set kind=excluded.kind, price=excluded.price, contents=excluded.contents;
commit;
