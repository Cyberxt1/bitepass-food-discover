import { FILES, readFile, writeTable } from "./csv-store";

const SEED_FLAG = "bitepass:seeded:v1";

export type Restaurant = {
  id: string; name: string; cuisine: string; rating: string; reviews: string;
  prepTime: string; distance: string; image: string; tags: string; isOpen: string;
};
export type Meal = {
  id: string; restaurantId: string; name: string; description: string;
  price: string; image: string; category: string; prepTime: string;
  rating: string; reviewCount: string; popular: string; available: string;
};
export type Review = {
  id: string; mealId: string; userId: string; userName: string; rating: string;
  taste: string; portion: string; spice: string; waitTime: string;
  comment: string; createdAt: string;
};
export type Order = {
  id: string; userId: string; restaurantId: string; items: string; // json string
  total: string; status: string; pickupTime: string; notes: string; createdAt: string;
};
export type User = {
  id: string; name: string; email: string; password: string; role: string; avatar: string;
};

const img = (q: string) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=900&q=70`;

const restaurants: Restaurant[] = [
  { id: "r1", name: "Mama Cass Kitchen", cuisine: "African", rating: "4.8", reviews: "1247", prepTime: "15", distance: "0.4", image: img("photo-1555939594-58d7cb561ad1"), tags: "Jollof|Local|Trending", isOpen: "1" },
  { id: "r2", name: "The Shawarma Lab", cuisine: "Middle Eastern", rating: "4.7", reviews: "892", prepTime: "10", distance: "0.8", image: img("photo-1561651823-34feb02250e4"), tags: "Wraps|Fast", isOpen: "1" },
  { id: "r3", name: "Burger District", cuisine: "American", rating: "4.6", reviews: "2103", prepTime: "12", distance: "1.2", image: img("photo-1568901346375-23c9450c58cd"), tags: "Burgers|Combos", isOpen: "1" },
  { id: "r4", name: "Iya Basira", cuisine: "Yoruba", rating: "4.9", reviews: "634", prepTime: "20", distance: "1.5", image: img("photo-1604329760661-e71dc83f8f26"), tags: "Amala|Authentic", isOpen: "1" },
  { id: "r5", name: "Pepper & Spice", cuisine: "Nigerian", rating: "4.5", reviews: "478", prepTime: "18", distance: "2.0", image: img("photo-1547592180-85f173990554"), tags: "Soup|Spicy", isOpen: "1" },
  { id: "r6", name: "Tokyo Bites", cuisine: "Japanese", rating: "4.7", reviews: "1023", prepTime: "14", distance: "2.4", image: img("photo-1579871494447-9811cf80d66c"), tags: "Sushi|Ramen", isOpen: "0" },
];

const meals: Meal[] = [
  { id: "m1", restaurantId: "r1", name: "Smoky Jollof Rice & Chicken", description: "Party-style jollof with grilled chicken and fried plantain.", price: "4500", image: img("photo-1604329760661-e71dc83f8f26"), category: "Rice", prepTime: "15", rating: "4.9", reviewCount: "412", popular: "1", available: "1" },
  { id: "m2", restaurantId: "r1", name: "Fried Rice Combo", description: "Veggie fried rice with chicken, plantain & coleslaw.", price: "4200", image: img("photo-1512058564366-18510be2db19"), category: "Rice", prepTime: "15", rating: "4.7", reviewCount: "298", popular: "1", available: "1" },
  { id: "m3", restaurantId: "r2", name: "Beef Shawarma Deluxe", description: "Double beef, garlic sauce, fries inside.", price: "3500", image: img("photo-1561651823-34feb02250e4"), category: "Wraps", prepTime: "10", rating: "4.8", reviewCount: "521", popular: "1", available: "1" },
  { id: "m4", restaurantId: "r2", name: "Chicken Shawarma", description: "Grilled chicken, garlic mayo, pickles.", price: "3000", image: img("photo-1565299585323-38d6b0865b47"), category: "Wraps", prepTime: "10", rating: "4.6", reviewCount: "342", popular: "0", available: "1" },
  { id: "m5", restaurantId: "r3", name: "Double Smash Burger Combo", description: "Two patties, cheddar, fries & drink.", price: "5800", image: img("photo-1568901346375-23c9450c58cd"), category: "Burgers", prepTime: "12", rating: "4.7", reviewCount: "667", popular: "1", available: "1" },
  { id: "m6", restaurantId: "r3", name: "Crispy Chicken Burger", description: "Buttermilk chicken, slaw, brioche.", price: "4200", image: img("photo-1606755962773-d324e0a13086"), category: "Burgers", prepTime: "11", rating: "4.5", reviewCount: "289", popular: "0", available: "1" },
  { id: "m7", restaurantId: "r4", name: "Amala & Ewedu", description: "Smooth amala, ewedu, gbegiri & assorted meat.", price: "3800", image: img("photo-1567337710282-00832b415979"), category: "Swallow", prepTime: "20", rating: "4.9", reviewCount: "201", popular: "1", available: "1" },
  { id: "m8", restaurantId: "r5", name: "Catfish Pepper Soup", description: "Fiery catfish, scent leaves, served hot.", price: "5500", image: img("photo-1547592180-85f173990554"), category: "Soup", prepTime: "18", rating: "4.6", reviewCount: "156", popular: "1", available: "1" },
  { id: "m9", restaurantId: "r6", name: "Salmon Ramen", description: "Tonkotsu broth, fresh salmon, soft egg.", price: "6800", image: img("photo-1579871494447-9811cf80d66c"), category: "Noodles", prepTime: "14", rating: "4.7", reviewCount: "98", popular: "0", available: "0" },
];

const reviews: Review[] = [
  { id: "rv1", mealId: "m1", userId: "u2", userName: "Tobi A.", rating: "5", taste: "Amazing", portion: "Generous", spice: "Medium", waitTime: "12 mins", comment: "Best jollof I've had in months. The smokiness is real.", createdAt: "2025-05-20" },
  { id: "rv2", mealId: "m1", userId: "u3", userName: "Adaeze O.", rating: "5", taste: "Excellent", portion: "Just right", spice: "Mild", waitTime: "15 mins", comment: "Plantain was perfectly ripe. Chicken juicy.", createdAt: "2025-05-18" },
  { id: "rv3", mealId: "m1", userId: "u4", userName: "Kingsley E.", rating: "4", taste: "Great", portion: "Could be more", spice: "Hot", waitTime: "18 mins", comment: "Loved the flavor, would love a bigger portion.", createdAt: "2025-05-15" },
  { id: "rv4", mealId: "m3", userId: "u2", userName: "Tobi A.", rating: "5", taste: "Incredible", portion: "Huge", spice: "Medium", waitTime: "9 mins", comment: "Wrapped tight, no leaks. Garlic sauce is god-tier.", createdAt: "2025-05-22" },
  { id: "rv5", mealId: "m3", userId: "u5", userName: "Funmi B.", rating: "4", taste: "Tasty", portion: "Generous", spice: "Hot", waitTime: "11 mins", comment: "A bit too spicy but flavor was top.", createdAt: "2025-05-19" },
  { id: "rv6", mealId: "m5", userId: "u3", userName: "Adaeze O.", rating: "5", taste: "Juicy", portion: "Filling", spice: "Mild", waitTime: "13 mins", comment: "Patties cooked perfectly. Fries were crispy.", createdAt: "2025-05-21" },
  { id: "rv7", mealId: "m7", userId: "u4", userName: "Kingsley E.", rating: "5", taste: "Authentic", portion: "Plenty", spice: "Medium", waitTime: "22 mins", comment: "Tastes like home. Ewedu was smooth, no lumps.", createdAt: "2025-05-17" },
  { id: "rv8", mealId: "m8", userId: "u5", userName: "Funmi B.", rating: "5", taste: "Fiery", portion: "Good", spice: "Very Hot", waitTime: "20 mins", comment: "Cleared my flu. Catfish was fresh.", createdAt: "2025-05-16" },
];

const users: User[] = [
  { id: "u1", name: "Demo Customer", email: "user@bitepass.app", password: "password", role: "customer", avatar: "🍽️" },
  { id: "u2", name: "Tobi A.", email: "tobi@bitepass.app", password: "password", role: "customer", avatar: "🥘" },
  { id: "u3", name: "Adaeze O.", email: "adaeze@bitepass.app", password: "password", role: "customer", avatar: "🍱" },
  { id: "u4", name: "Kingsley E.", email: "kingsley@bitepass.app", password: "password", role: "customer", avatar: "🍔" },
  { id: "u5", name: "Funmi B.", email: "funmi@bitepass.app", password: "password", role: "customer", avatar: "🌶️" },
  { id: "u9", name: "Mama Cass (Admin)", email: "admin@bitepass.app", password: "admin", role: "admin", avatar: "👩‍🍳" },
];

// Seed past orders so admin analytics has data
const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const orders: Order[] = Array.from({ length: 32 }).map((_, i) => {
  const meal = meals[i % meals.length];
  const qty = 1 + (i % 3);
  const total = String(Number(meal.price) * qty);
  const created = new Date(now - (i * day) / 2).toISOString();
  const statuses = ["completed", "completed", "completed", "ready", "preparing", "received"];
  return {
    id: `o${100 + i}`,
    userId: users[1 + (i % 4)].id,
    restaurantId: meal.restaurantId,
    items: JSON.stringify([{ mealId: meal.id, name: meal.name, qty, price: Number(meal.price) }]),
    total,
    status: statuses[i % statuses.length],
    pickupTime: new Date(now - (i * day) / 2 + 30 * 60 * 1000).toISOString(),
    notes: "",
    createdAt: created,
  };
});

export function seedIfNeeded() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEED_FLAG)) return;
  writeTable(FILES.users, users);
  writeTable(FILES.restaurants, restaurants);
  writeTable(FILES.meals, meals);
  writeTable(FILES.reviews, reviews);
  writeTable(FILES.orders, orders);
  window.localStorage.setItem(SEED_FLAG, "1");
}

export function ensureSeed() {
  if (typeof window === "undefined") return;
  if (!readFile(FILES.restaurants)) seedIfNeeded();
}
