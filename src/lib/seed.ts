import { FILES, writeFile, writeTable } from "./csv-store";

const SEED_FLAG = "bitepass:seeded:v5:no-demo-data";

export type Restaurant = {
  id: string; ownerId: string; name: string; cuisine: string; rating: string; reviews: string;
  prepTime: string; distance: string; image: string; tags: string; isOpen: string;
  description: string; address: string; phone: string; lat: string; lng: string;
};
export type Meal = {
  id: string; restaurantId: string; name: string; description: string;
  price: string; image: string; category: string; prepTime: string;
  rating: string; reviewCount: string; popular: string; available: string;
  availableFrom: string; availableTo: string; servingUnit?: string; options?: string; // hours 0-23
};
export type Review = {
  id: string; mealId: string; restaurantId?: string; userId: string; userName: string; rating: string;
  taste: string; portion: string; spice: string; waitTime: string;
  comment: string; createdAt: string;
};
export type Order = {
  id: string; userId: string; restaurantId: string; items: string;
  total: string; status: string; pickupTime: string; notes: string; createdAt: string;
  discountCode: string; paymentStatus?: string;
};
export type User = {
  id: string; name: string; email: string; password: string; role: string; avatar: string;
  address?: string; lat?: string; lng?: string;
};
export type Discount = {
  id: string; restaurantId: string; code: string; type: string; // "percent" | "fixed"
  value: string; active: string; expiresAt: string; minOrder: string; uses: string;
};

const restaurants: Restaurant[] = [];
const meals: Meal[] = [];
const reviews: Review[] = [];
const users: User[] = [];
const orders: Order[] = [];
const discounts: Discount[] = [];

export function seedIfNeeded() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEED_FLAG)) return;
  writeTable(FILES.users, users);
  writeTable(FILES.restaurants, restaurants);
  writeTable(FILES.meals, meals);
  writeTable(FILES.reviews, reviews);
  writeTable(FILES.orders, orders);
  writeTable(FILES.discounts, discounts);
  writeFile(FILES.session, "");
  window.localStorage.setItem(SEED_FLAG, "1");
}

export function ensureSeed() {
  if (typeof window === "undefined") return;
  if (!window.localStorage.getItem(SEED_FLAG)) seedIfNeeded();
}
