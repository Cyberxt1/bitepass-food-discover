-- Keep only these restaurants:
-- - JFC KITCHEN
-- - Onion Sauce
-- - Chill on Grills
-- - Chicken Republic
--
-- Run this once in Supabase SQL Editor after checking the preview SELECT.

begin;

create temporary table keep_restaurants as
select id, "ownerId", name
from public.restaurants
where lower(trim(name)) in (
  'jfc kitchen',
  'onion sauce',
  'chill on grills',
  'chicken republic',
  'chicken repubilc'
);

-- Preview what will remain. Run this SELECT alone first if you want to double-check.
select * from keep_restaurants order by name;

delete from public.reviews
where "restaurantId" is not null
  and "restaurantId" not in (select id from keep_restaurants);

delete from public.reviews
where "mealId" in (
  select id
  from public.meals
  where "restaurantId" not in (select id from keep_restaurants)
);

delete from public.discounts
where "restaurantId" not in (select id from keep_restaurants);

delete from public.orders
where "restaurantId" not in (select id from keep_restaurants);

delete from public.meals
where "restaurantId" not in (select id from keep_restaurants);

delete from public.restaurants
where id not in (select id from keep_restaurants);

delete from public.users
where role = 'restaurant'
  and id not in (select "ownerId" from keep_restaurants);

commit;
