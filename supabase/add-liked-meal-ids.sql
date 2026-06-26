-- Adds the cravings field used by the profile and My cravings pages.
-- Run this in Supabase SQL Editor if removing a liked meal fails with:
-- "Could not find the 'likedMealIds' column of 'users' in the schema cache"

alter table public.users add column if not exists "likedMealIds" text;
