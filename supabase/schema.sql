-- BitePass Supabase schema
-- Run this in Supabase SQL Editor before using VITE_DATA_BACKEND=supabase.

create table if not exists public.users (
  id text primary key,
  name text not null default '',
  email text not null default '',
  password text not null default '',
  role text not null default 'customer',
  avatar text not null default '',
  address text,
  lat text,
  lng text,
  status text,
  created_at timestamptz not null default now()
);

create unique index if not exists users_email_unique on public.users (lower(email));

create table if not exists public.restaurants (
  id text primary key,
  "ownerId" text not null default '',
  name text not null default '',
  cuisine text not null default '',
  rating text not null default '0',
  reviews text not null default '0',
  "prepTime" text not null default '0',
  distance text not null default '0',
  image text not null default '',
  tags text not null default '',
  "isOpen" text not null default '1',
  description text not null default '',
  address text not null default '',
  phone text not null default '',
  lat text not null default '',
  lng text not null default '',
  "paystackSubaccount" text,
  "paymentDisplayName" text,
  "paymentSetupStatus" text,
  "verificationStatus" text,
  "moderationStatus" text,
  "suspensionReason" text,
  created_at timestamptz not null default now()
);

create table if not exists public.meals (
  id text primary key,
  "restaurantId" text not null default '',
  name text not null default '',
  description text not null default '',
  price text not null default '0',
  image text not null default '',
  category text not null default '',
  "prepTime" text not null default '0',
  rating text not null default '0',
  "reviewCount" text not null default '0',
  popular text not null default '0',
  available text not null default '1',
  "availableFrom" text not null default '',
  "availableTo" text not null default '',
  "servingUnit" text,
  options text,
  "moderationStatus" text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  "userId" text not null default '',
  "restaurantId" text not null default '',
  items text not null default '',
  total text not null default '0',
  status text not null default 'received',
  "pickupTime" text not null default '',
  notes text not null default '',
  "createdAt" text not null default '',
  "discountCode" text not null default '',
  "paymentStatus" text,
  "paymentReference" text,
  "paymentRecipient" text,
  "placedAt" text,
  "paidAt" text,
  "acceptedAt" text,
  "preparingAt" text,
  "readyAt" text,
  "pickedUpAt" text,
  "completedAt" text,
  "cancelledAt" text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id text primary key,
  "mealId" text not null default '',
  "restaurantId" text,
  "userId" text not null default '',
  "userName" text not null default '',
  rating text not null default '0',
  taste text not null default '',
  portion text not null default '',
  spice text not null default '',
  "waitTime" text not null default '',
  comment text not null default '',
  "createdAt" text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.discounts (
  id text primary key,
  "restaurantId" text not null default '',
  code text not null default '',
  type text not null default 'fixed',
  value text not null default '0',
  active text not null default '1',
  "expiresAt" text not null default '',
  "minOrder" text not null default '0',
  uses text not null default '0',
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id text primary key,
  "userId" text not null default '',
  "userName" text not null default '',
  email text not null default '',
  category text not null default '',
  message text not null default '',
  status text not null default 'open',
  "createdAt" text not null default '',
  priority text,
  "assignedTo" text,
  resolution text,
  "updatedAt" text,
  created_at timestamptz not null default now()
);

create table if not exists public."platformStats" (
  id text primary key,
  foodies text not null default '0',
  kitchens text not null default '0',
  "avgMinutesSaved" text not null default '0',
  "updatedAt" text not null default '',
  created_at timestamptz not null default now()
);

alter table public.users add column if not exists status text;
alter table public.restaurants add column if not exists "paystackSubaccount" text;
alter table public.restaurants add column if not exists "paymentDisplayName" text;
alter table public.restaurants add column if not exists "paymentSetupStatus" text;
alter table public.restaurants add column if not exists "verificationStatus" text;
alter table public.restaurants add column if not exists "moderationStatus" text;
alter table public.restaurants add column if not exists "suspensionReason" text;
alter table public.meals add column if not exists "moderationStatus" text;
alter table public.orders add column if not exists "paymentRecipient" text;
alter table public.orders add column if not exists "placedAt" text;
alter table public.orders add column if not exists "paidAt" text;
alter table public.orders add column if not exists "acceptedAt" text;
alter table public.orders add column if not exists "preparingAt" text;
alter table public.orders add column if not exists "readyAt" text;
alter table public.orders add column if not exists "pickedUpAt" text;
alter table public.orders add column if not exists "completedAt" text;
alter table public.orders add column if not exists "cancelledAt" text;

create index if not exists restaurants_owner_idx on public.restaurants ("ownerId");
create index if not exists meals_restaurant_idx on public.meals ("restaurantId");
create index if not exists orders_user_idx on public.orders ("userId");
create index if not exists orders_restaurant_idx on public.orders ("restaurantId");
create index if not exists reviews_user_idx on public.reviews ("userId");
create index if not exists reviews_restaurant_idx on public.reviews ("restaurantId");
create index if not exists discounts_restaurant_idx on public.discounts ("restaurantId");

alter table public.users enable row level security;
alter table public.restaurants enable row level security;
alter table public.meals enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.discounts enable row level security;
alter table public.feedback enable row level security;
alter table public."platformStats" enable row level security;

drop policy if exists "users read authenticated" on public.users;
drop policy if exists "users insert own or seed" on public.users;
drop policy if exists "users update own" on public.users;
drop policy if exists "restaurants read authenticated" on public.restaurants;
drop policy if exists "restaurants insert owner or seed" on public.restaurants;
drop policy if exists "restaurants update owner" on public.restaurants;
drop policy if exists "restaurants delete owner" on public.restaurants;
drop policy if exists "meals read authenticated" on public.meals;
drop policy if exists "meals write authenticated" on public.meals;
drop policy if exists "orders read authenticated" on public.orders;
drop policy if exists "orders insert own" on public.orders;
drop policy if exists "orders update authenticated" on public.orders;
drop policy if exists "reviews read authenticated" on public.reviews;
drop policy if exists "reviews insert own or seed" on public.reviews;
drop policy if exists "reviews update own" on public.reviews;
drop policy if exists "discounts read authenticated" on public.discounts;
drop policy if exists "discounts write authenticated" on public.discounts;
drop policy if exists "feedback read admin or own" on public.feedback;
drop policy if exists "feedback insert own" on public.feedback;
drop policy if exists "feedback update admin" on public.feedback;
drop policy if exists "platform stats read authenticated" on public."platformStats";
drop policy if exists "platform stats write admin" on public."platformStats";

create or replace function public.is_bitepass_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()::text
      and u.role = 'admin'
  )
  or lower(coalesce(auth.jwt() ->> 'email', '')) = 'biteepass1@gmail.com';
$$;

create policy "users read authenticated" on public.users
  for select to authenticated
  using (true);

create policy "users insert own or seed" on public.users
  for insert to authenticated
  with check (
    id = auth.uid()::text
    or id in ('u-customer-demo', 'u-admin-demo', 'u-r1', 'u-r2', 'u-r3', 'u-r4', 'u-r5', 'u-r6', 'u-r7', 'u-r8')
  );

create policy "users update own" on public.users
  for update to authenticated
  using (id = auth.uid()::text or public.is_bitepass_admin())
  with check (id = auth.uid()::text or public.is_bitepass_admin());

create policy "restaurants read authenticated" on public.restaurants
  for select to authenticated
  using (true);

create policy "restaurants insert owner or seed" on public.restaurants
  for insert to authenticated
  with check ("ownerId" = auth.uid()::text or "ownerId" like 'u-r%');

create policy "restaurants update owner" on public.restaurants
  for update to authenticated
  using ("ownerId" = auth.uid()::text or public.is_bitepass_admin())
  with check ("ownerId" = auth.uid()::text or public.is_bitepass_admin());

create policy "restaurants delete owner" on public.restaurants
  for delete to authenticated
  using ("ownerId" = auth.uid()::text or public.is_bitepass_admin());

create policy "meals read authenticated" on public.meals
  for select to authenticated
  using (true);

create policy "meals write authenticated" on public.meals
  for all to authenticated
  using (true)
  with check (true);

create policy "orders read authenticated" on public.orders
  for select to authenticated
  using (public.is_bitepass_admin() or "userId" = auth.uid()::text or exists (
    select 1 from public.restaurants r
    where r.id = orders."restaurantId" and r."ownerId" = auth.uid()::text
  ));

create policy "orders insert own" on public.orders
  for insert to authenticated
  with check ("userId" = auth.uid()::text);

create policy "orders update authenticated" on public.orders
  for update to authenticated
  using (true)
  with check (true);

create policy "reviews read authenticated" on public.reviews
  for select to authenticated
  using (true);

create policy "reviews insert own or seed" on public.reviews
  for insert to authenticated
  with check ("userId" = auth.uid()::text or id like 'rv-%');

create policy "reviews update own" on public.reviews
  for update to authenticated
  using ("userId" = auth.uid()::text)
  with check ("userId" = auth.uid()::text);

create policy "discounts read authenticated" on public.discounts
  for select to authenticated
  using (true);

create policy "discounts write authenticated" on public.discounts
  for all to authenticated
  using (true)
  with check (true);

create policy "feedback read admin or own" on public.feedback
  for select to authenticated
  using (public.is_bitepass_admin() or "userId" = auth.uid()::text);

create policy "feedback insert own" on public.feedback
  for insert to authenticated
  with check ("userId" = auth.uid()::text);

create policy "feedback update admin" on public.feedback
  for update to authenticated
  using (public.is_bitepass_admin())
  with check (public.is_bitepass_admin());

create policy "platform stats read authenticated" on public."platformStats"
  for select to authenticated
  using (true);

create policy "platform stats write admin" on public."platformStats"
  for all to authenticated
  using (public.is_bitepass_admin())
  with check (public.is_bitepass_admin());
