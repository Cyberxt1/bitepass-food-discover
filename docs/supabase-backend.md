# BitePass Supabase Backend

This project uses Supabase Auth and Supabase Postgres for the main backend, with browser local storage as a fallback while setup is incomplete.

## Free Plan Setup

1. Create a Supabase project on the Free plan.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Authentication > Providers, enable Email.
4. For easiest MVP testing, disable email confirmation while developing.
5. Google sign-in is optional. If enabled, configure Google under Authentication > Providers.
6. Copy Project URL and anon public key into `.env.local`.

## Netlify Setup

The Supabase URL and anon key are public browser values, so `netlify.toml` includes them for Netlify builds. After changing `netlify.toml`, redeploy the site so Vite bakes the env values into the frontend bundle.

For Google sign-in on Netlify, add your deployed Netlify URL in two places:

1. Supabase dashboard:
   - Authentication > URL Configuration
   - Site URL: `https://your-site.netlify.app`
   - Redirect URLs: `https://your-site.netlify.app/**`
2. Google Cloud OAuth client:
   - Authorized JavaScript origins: `https://your-site.netlify.app`
   - Authorized redirect URI: `https://vvtydnkcsicmtqztvqmw.supabase.co/auth/v1/callback`

The Google redirect URI stays as the Supabase callback URL. Your Netlify URL belongs in JavaScript origins and Supabase redirect allow-list.

## Environment

Use `.env.example` as the template:

```text
VITE_DATA_BACKEND=supabase
VITE_AUTH_BACKEND=supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

The anon key is designed for browser use. Do not put the service role key in the frontend.

## Tables

The app expects these public tables:

- `users`
- `restaurants`
- `meals`
- `orders`
- `reviews`
- `discounts`

The schema keeps the existing app field names, including camelCase columns like `"ownerId"` and `"restaurantId"`, so the React code does not need broad data-mapping changes.

## Storage

The current app does not upload files. Restaurant and meal images are URL fields. Supabase Storage can be added later for image uploads, but it is not required for the current MVP.

## Production Notes

Payment verification is still client-demo mode when `VITE_PAYSTACK_PUBLIC_KEY` is missing. A real launch should verify Paystack from a server-side endpoint or Supabase Edge Function before marking orders paid.
