# BitePass MVP Scope

## Product Goal

BitePass lets customers find nearby restaurants, preorder food, pay before pickup, and track the order until it is ready. Restaurants manage their menu, availability, and live order queue. Admins monitor the platform.

## Customer MVP

### Account

- Sign up with Supabase email/password using name, email, password, and optional phone number.
- Sign in and stay signed in across reloads.
- Reset password through Supabase Auth.
- Sign out.
- Edit profile basics: name, phone, default pickup location.
- Save or update current location using browser geolocation.

### Discover

- See restaurants near the saved/current location.
- See open/closed state before ordering.
- Browse by category, cuisine, popular meals, and search.
- See restaurant distance, prep time, rating, and availability.
- Open a restaurant profile.

### Restaurant Profile

- View restaurant name, image, address, phone, cuisine, opening status, rating, and menu.
- View available meals only by default.
- Filter menu by category.
- View meal details.
- View restaurant and meal reviews.

### Meal Detail

- See meal image, price, description, prep time, rating, and serving unit.
- Choose quantity.
- Choose extras/options with prices.
- Add special instructions.
- Add meal to cart.
- Prevent adding unavailable meals.
- Warn before mixing restaurants in one cart.

### Cart

- View selected meals, extras, notes, quantities, subtotal, service fee, and total.
- Increase/decrease quantity.
- Remove item.
- Clear cart.
- Choose pickup mode: ASAP or scheduled.
- Validate restaurant is still open before checkout.

### Checkout

- Start Paystack payment.
- Verify payment from backend before creating paid order.
- Create an order only after successful payment verification.
- Show failed/cancelled payment states clearly.
- Clear cart after successful order.

### Orders

- View active and past orders.
- Open order detail.
- Track order status in realtime:
  - received
  - preparing
  - ready
  - completed
  - cancelled
- See pickup time, restaurant, items, payment status, and total.
- Receive in-app notification when order is ready.

### Reviews

- Review completed orders only.
- Rate restaurant.
- Rate meal.
- Leave short comment.
- Prevent duplicate review for the same completed order item.

## Restaurant MVP

### Restaurant Onboarding

- Create restaurant account.
- Add restaurant name, cuisine, phone, image, address, and pinned location.
- Restaurant starts as closed until owner opens it.

### Dashboard

- View today revenue, active orders, available meals, and completed orders.
- Open or close restaurant.
- Receive live order queue updates.

### Menu Management

- Add meal.
- Edit meal.
- Delete meal.
- Toggle meal availability.
- Add price, category, prep time, serving unit, image, and options/extras.

### Order Management

- See incoming paid orders in realtime.
- Advance order status:
  - received to preparing
  - preparing to ready
  - ready to completed
- Cancel order with reason.
- See customer notes and pickup time.

### Promotions

- Create discount code.
- Set fixed or percentage discount.
- Set minimum order amount.
- Toggle discount active/inactive.

## Admin MVP

- View all users, restaurants, meals, and orders.
- View platform metrics: revenue, orders, active restaurants, customers.
- Disable restaurant.
- Disable user account record.
- View reported/cancelled orders.
- Manage featured restaurants/categories.

## Supabase Backend

### Postgres Tables

- `users`
- `restaurants`
- `meals`
- `orders`
- `reviews`
- `discounts`
- `notifications`

### Auth

- Supabase Auth handles email/password accounts.
- Google sign-in is optional.
- Phone/SMS auth is not used for the MVP.
- App data is stored in Supabase Postgres with local fallback.

### Storage

- Restaurant and meal images use external URLs for the MVP.
- Supabase Storage is not required unless file uploads are added later.
- Restaurant and meal images stay as URL fields for the MVP.

### Location

- Store restaurant location as:
  - `lat`
  - `lng`
  - `geohash`
- Query nearby restaurants using geohash bounds.
- Sort final results by actual distance in the client.

## Performance Rules

- Lazy load route pages.
- Use React Query cache for restaurant, meal, and order reads.
- Use realtime listeners only for active orders and restaurant order queue.
- Paginate restaurant/menu lists.
- Store image URLs with optimized sizes.
- Use skeleton states instead of blocking full-screen loaders.
- Keep cart local until checkout.

## Build Order

1. Add Supabase client setup.
2. Add Postgres tables and RLS policies.
3. Use Supabase Auth plus Postgres on the Free plan.
4. Rebuild auth and profile flow.
5. Rebuild customer discover, restaurant, meal, cart, checkout, and orders.
6. Rebuild restaurant dashboard around Supabase orders.
7. Rebuild admin dashboard from Supabase tables.
