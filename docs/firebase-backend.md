# BitePass Firebase Backend

This project is wired to Firebase Auth and Firestore for the MVP backend.

## Firebase project

- Project ID: `bitepass-3b65d`
- Auth: Email/password and Google sign-in
- Database: Cloud Firestore
- Storage: not used for this MVP pass

## Deploy backend rules and indexes

Install or run Firebase CLI, then sign in:

```powershell
npx firebase-tools login
```

Deploy Firestore rules and indexes:

```powershell
npm run firebase:deploy
```

Rules only:

```powershell
npm run firebase:deploy:rules
```

Indexes only:

```powershell
npm run firebase:deploy:indexes
```

## Required Firebase console setup

1. Enable Authentication.
2. Enable Email/Password provider.
3. Enable Google provider.
4. Enable Cloud Firestore.
5. Add local and deployed domains under Authentication > Settings > Authorized domains.

## Data model

Top-level collections used by the app:

- `users`
- `restaurants`
- `meals`
- `orders`
- `reviews`
- `discounts`
- `notifications`

The app currently keeps local CSV fallback data for demo resilience. When Firestore is reachable, reads and writes go through `src/lib/backend.ts`.

On the first signed-in app session, the client can bootstrap the bundled demo users, restaurants, meals, reviews, and discounts into an empty Firestore database. The deployed rules allow create-only access for those seeded document IDs, then normal owner/admin rules control updates after that.

## Important production note

Payment verification is still client-demo mode when `VITE_PAYSTACK_PUBLIC_KEY` is missing. For a real launch, order creation should move behind a server function that verifies Paystack before writing a paid order.
