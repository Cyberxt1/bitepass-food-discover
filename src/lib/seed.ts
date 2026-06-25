import { FILES, readTable, writeFile, writeTable } from "./csv-store";

const SEED_FLAG = "bitepass:seeded:v7:ibadan-lagos-restaurants";

export type Restaurant = {
  id: string; ownerId: string; name: string; cuisine: string; rating: string; reviews: string;
  prepTime: string; distance: string; image: string; tags: string; isOpen: string;
  description: string; address: string; phone: string; lat: string; lng: string;
  paystackSubaccount?: string; paymentSetupStatus?: string;
};
export type Meal = {
  id: string; restaurantId: string; name: string; description: string;
  price: string; image: string; category: string; prepTime: string;
  rating: string; reviewCount: string; popular: string; available: string;
  availableFrom: string; availableTo: string; servingUnit?: string; options?: string;
};
export type Review = {
  id: string; mealId: string; restaurantId?: string; userId: string; userName: string; rating: string;
  taste: string; portion: string; spice: string; waitTime: string;
  comment: string; createdAt: string;
};
export type Feedback = {
  id: string; userId: string; userName: string; email: string; category: string;
  message: string; status: string; createdAt: string;
};
export type PlatformStats = {
  id: string; foodies: string; kitchens: string; avgMinutesSaved: string; updatedAt: string;
};
export type Order = {
  id: string; userId: string; restaurantId: string; items: string;
  total: string; status: string; pickupTime: string; notes: string; createdAt: string;
  discountCode: string; paymentStatus?: string; paymentReference?: string; paymentRecipient?: string;
};
export type User = {
  id: string; name: string; email: string; password: string; role: string; avatar: string;
  address?: string; lat?: string; lng?: string;
};
export type Discount = {
  id: string; restaurantId: string; code: string; type: string;
  value: string; active: string; expiresAt: string; minOrder: string; uses: string;
};

const mealOptions = (items: { id: string; name: string; price: number }[]) => JSON.stringify(items);

const users: User[] = [
  {
    id: "u-customer-demo",
    name: "Justin Ade",
    email: "justin@bitepass.test",
    password: "1234",
    role: "customer",
    avatar: "J",
    address: "Victoria Island, Lagos",
    lat: "6.4281",
    lng: "3.4219",
  },
  { id: "u-admin-demo", name: "BitePass Admin", email: "admin@bitepass.test", password: "1234", role: "admin", avatar: "A" },
  { id: "u-r1", name: "Ada Okafor", email: "ada@bitepass.test", password: "1234", role: "restaurant", avatar: "A" },
  { id: "u-r2", name: "Kemi Balogun", email: "kemi@bitepass.test", password: "1234", role: "restaurant", avatar: "K" },
  { id: "u-r3", name: "Tunde Bello", email: "tunde@bitepass.test", password: "1234", role: "restaurant", avatar: "T" },
  { id: "u-r4", name: "Mariam Yusuf", email: "mariam@bitepass.test", password: "1234", role: "restaurant", avatar: "M" },
  { id: "u-r5", name: "Emeka Obi", email: "emeka@bitepass.test", password: "1234", role: "restaurant", avatar: "E" },
  { id: "u-r6", name: "Sade Cole", email: "sade@bitepass.test", password: "1234", role: "restaurant", avatar: "S" },
  { id: "u-r7", name: "Ibrahim Danjuma", email: "ibrahim@bitepass.test", password: "1234", role: "restaurant", avatar: "I" },
  { id: "u-r8", name: "Nneka Eze", email: "nneka@bitepass.test", password: "1234", role: "restaurant", avatar: "N" },
];

const restaurants: Restaurant[] = [
  {
    id: "r-jollof-studio",
    ownerId: "u-r1",
    name: "Chicken Republic Victoria Island",
    cuisine: "Nigerian",
    rating: "4.8",
    reviews: "284",
    prepTime: "18",
    distance: "1.2",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=900&q=75",
    tags: "Chicken|Rice|Quick service",
    isOpen: "1",
    description: "Popular Lagos quick-service chicken, rice, sides, and grab-and-go lunch plates.",
    address: "Adeola Odeku Street, Victoria Island, Lagos",
    phone: "08010001001",
    lat: "6.4281",
    lng: "3.4219",
  },
  {
    id: "r-shawarma-lab",
    ownerId: "u-r2",
    name: "The Place Lekki",
    cuisine: "Nigerian",
    rating: "4.7",
    reviews: "196",
    prepTime: "12",
    distance: "2.8",
    image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=900&q=75",
    tags: "Rice|Grill|Late night",
    isOpen: "1",
    description: "A familiar Lagos stop for rice dishes, grilled meals, snacks, and quick pickup orders.",
    address: "Admiralty Way, Lekki Phase 1, Lagos",
    phone: "08010001002",
    lat: "6.4474",
    lng: "3.4723",
  },
  {
    id: "r-burger-district",
    ownerId: "u-r3",
    name: "Kilimanjaro Ikeja",
    cuisine: "Nigerian",
    rating: "4.6",
    reviews: "151",
    prepTime: "16",
    distance: "6.4",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=75",
    tags: "Rice|Chicken|Family meals",
    isOpen: "1",
    description: "Everyday Nigerian meals, chicken, rice, and quick lunch packs around Ikeja.",
    address: "Allen Avenue, Ikeja, Lagos",
    phone: "08010001003",
    lat: "6.6018",
    lng: "3.3515",
  },
  {
    id: "r-amala-house",
    ownerId: "u-r4",
    name: "Amala Skye Bodija",
    cuisine: "Yoruba",
    rating: "4.9",
    reviews: "332",
    prepTime: "14",
    distance: "10.9",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=75",
    tags: "Amala|Soup|Local",
    isOpen: "1",
    description: "Ibadan-style amala, ewedu, gbegiri, stew, and assorted meats served fast.",
    address: "Bodija, Ibadan, Oyo",
    phone: "08010001004",
    lat: "7.4356",
    lng: "3.9145",
  },
  {
    id: "r-noodle-yard",
    ownerId: "u-r5",
    name: "FoodCo Bodija",
    cuisine: "Cafe",
    rating: "4.5",
    reviews: "121",
    prepTime: "11",
    distance: "14.5",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=75",
    tags: "Bakery|Cafe|Quick meals",
    isOpen: "1",
    description: "Ibadan supermarket cafe meals, pastries, snacks, and everyday pickup food.",
    address: "Bodija, Ibadan, Oyo",
    phone: "08010001005",
    lat: "7.4332",
    lng: "3.9149",
  },
  {
    id: "r-suya-corner",
    ownerId: "u-r6",
    name: "Bukka Hut Surulere",
    cuisine: "Nigerian",
    rating: "4.7",
    reviews: "223",
    prepTime: "13",
    distance: "8.1",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=75",
    tags: "Rice|Soup|Local meals",
    isOpen: "1",
    description: "Lagos comfort meals, soups, rice, proteins, and quick lunch pickup packs.",
    address: "Bode Thomas Street, Surulere, Lagos",
    phone: "08010001006",
    lat: "6.5007",
    lng: "3.3568",
  },
  {
    id: "r-green-bowl",
    ownerId: "u-r7",
    name: "Kokodome Ibadan",
    cuisine: "Continental",
    rating: "4.4",
    reviews: "87",
    prepTime: "10",
    distance: "4.3",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=75",
    tags: "Continental|Local|Lounge",
    isOpen: "1",
    description: "Long-running Ibadan restaurant with continental plates, local meals, and relaxed dining.",
    address: "Dugbe, Ibadan, Oyo",
    phone: "08010001007",
    lat: "7.3878",
    lng: "3.8758",
  },
  {
    id: "r-rice-and-co",
    ownerId: "u-r8",
    name: "Sweet Sensation Yaba",
    cuisine: "Nigerian",
    rating: "4.6",
    reviews: "174",
    prepTime: "17",
    distance: "17.6",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=75",
    tags: "Rice|Pastries|Family packs",
    isOpen: "1",
    description: "Familiar Lagos pastries, rice meals, snacks, and family-friendly pickup orders.",
    address: "Herbert Macaulay Way, Yaba, Lagos",
    phone: "08010001008",
    lat: "6.5158",
    lng: "3.3899",
  },
  {
    id: "r-buka-express",
    ownerId: "u-r1",
    name: "Iya Meta Ibadan",
    cuisine: "Local Buka",
    rating: "4.3",
    reviews: "99",
    prepTime: "9",
    distance: "22.2",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=75",
    tags: "Buka|Affordable|Fast",
    isOpen: "0",
    description: "Budget-friendly Ibadan buka meals, beans, rice, soups, and peppery stews.",
    address: "Challenge, Ibadan, Oyo",
    phone: "08010001009",
    lat: "7.3624",
    lng: "3.8691",
  },
];

const meals: Meal[] = [
  {
    id: "m-jollof-smoky",
    restaurantId: "r-jollof-studio",
    name: "Smoky Party Jollof",
    description: "Firewood-style jollof rice with peppered chicken and plantain.",
    price: "4500",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=900&q=75",
    category: "Jollof",
    prepTime: "18",
    rating: "4.9",
    reviewCount: "88",
    popular: "1",
    available: "1",
    availableFrom: "9",
    availableTo: "22",
    servingUnit: "plate",
    options: mealOptions([
      { id: "opt-chicken", name: "Extra chicken", price: 1800 },
      { id: "opt-plantain", name: "Extra plantain", price: 700 },
    ]),
  },
  {
    id: "m-jollof-fried",
    restaurantId: "r-jollof-studio",
    name: "Fried Rice Combo",
    description: "Fried rice with coleslaw, plantain, and turkey.",
    price: "5200",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=75",
    category: "Rice",
    prepTime: "16",
    rating: "4.7",
    reviewCount: "53",
    popular: "0",
    available: "1",
    availableFrom: "10",
    availableTo: "21",
    servingUnit: "plate",
    options: mealOptions([{ id: "opt-turkey", name: "Extra turkey", price: 2400 }]),
  },
  {
    id: "m-shawarma-beef",
    restaurantId: "r-shawarma-lab",
    name: "Double Beef Shawarma",
    description: "Loaded beef shawarma with sausage, chips, and house pepper sauce.",
    price: "3800",
    image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=900&q=75",
    category: "Shawarma",
    prepTime: "12",
    rating: "4.8",
    reviewCount: "71",
    popular: "1",
    available: "1",
    availableFrom: "11",
    availableTo: "23",
    servingUnit: "wrap",
    options: mealOptions([
      { id: "opt-sausage", name: "Extra sausage", price: 600 },
      { id: "opt-cheese", name: "Cheese", price: 500 },
    ]),
  },
  {
    id: "m-shawarma-fries",
    restaurantId: "r-shawarma-lab",
    name: "Loaded Shawarma Fries",
    description: "Fries topped with chicken strips, sauce, and vegetables.",
    price: "4200",
    image: "https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=900&q=75",
    category: "Fries",
    prepTime: "13",
    rating: "4.6",
    reviewCount: "39",
    popular: "0",
    available: "1",
    availableFrom: "12",
    availableTo: "23",
    servingUnit: "bowl",
    options: mealOptions([{ id: "opt-chicken", name: "Extra chicken", price: 1200 }]),
  },
  {
    id: "m-burger-classic",
    restaurantId: "r-burger-district",
    name: "District Classic Burger",
    description: "Beef patty, cheddar, lettuce, onions, and district sauce.",
    price: "5500",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=75",
    category: "Burgers",
    prepTime: "16",
    rating: "4.7",
    reviewCount: "64",
    popular: "1",
    available: "1",
    availableFrom: "10",
    availableTo: "22",
    servingUnit: "piece",
    options: mealOptions([
      { id: "opt-fries", name: "Add fries", price: 1500 },
      { id: "opt-patty", name: "Extra patty", price: 2200 },
    ]),
  },
  {
    id: "m-amala-abula",
    restaurantId: "r-amala-house",
    name: "Amala Abula",
    description: "Amala with ewedu, gbegiri, stew, and assorted meat.",
    price: "3600",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=75",
    category: "Swallow",
    prepTime: "14",
    rating: "4.9",
    reviewCount: "102",
    popular: "1",
    available: "1",
    availableFrom: "8",
    availableTo: "20",
    servingUnit: "portion",
    options: mealOptions([
      { id: "opt-meat", name: "Extra assorted meat", price: 1500 },
      { id: "opt-amala", name: "Extra wrap", price: 600 },
    ]),
  },
  {
    id: "m-noodle-chicken",
    restaurantId: "r-noodle-yard",
    name: "Chicken Wok Noodles",
    description: "Stir-fried noodles with chicken, peppers, and sesame sauce.",
    price: "4300",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=75",
    category: "Noodles",
    prepTime: "11",
    rating: "4.5",
    reviewCount: "44",
    popular: "1",
    available: "1",
    availableFrom: "10",
    availableTo: "22",
    servingUnit: "bowl",
    options: mealOptions([{ id: "opt-egg", name: "Fried egg", price: 500 }]),
  },
  {
    id: "m-suya-pack",
    restaurantId: "r-suya-corner",
    name: "Beef Suya Pack",
    description: "Spicy beef suya with onions, cabbage, pepper, and yaji.",
    price: "3200",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=75",
    category: "Grill",
    prepTime: "13",
    rating: "4.8",
    reviewCount: "76",
    popular: "1",
    available: "1",
    availableFrom: "16",
    availableTo: "23",
    servingUnit: "pack",
    options: mealOptions([{ id: "opt-extra", name: "Extra suya", price: 1600 }]),
  },
  {
    id: "m-green-salad",
    restaurantId: "r-green-bowl",
    name: "Chicken Avocado Bowl",
    description: "Greens, grilled chicken, avocado, sweet corn, and citrus dressing.",
    price: "5000",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=75",
    category: "Salads",
    prepTime: "10",
    rating: "4.4",
    reviewCount: "31",
    popular: "0",
    available: "1",
    availableFrom: "9",
    availableTo: "19",
    servingUnit: "bowl",
    options: mealOptions([{ id: "opt-smoothie", name: "Add smoothie", price: 2000 }]),
  },
  {
    id: "m-rice-coconut",
    restaurantId: "r-rice-and-co",
    name: "Coconut Rice Bowl",
    description: "Coconut rice with grilled fish, pepper sauce, and plantain.",
    price: "5800",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=75",
    category: "Rice",
    prepTime: "17",
    rating: "4.6",
    reviewCount: "49",
    popular: "0",
    available: "1",
    availableFrom: "10",
    availableTo: "21",
    servingUnit: "plate",
    options: mealOptions([{ id: "opt-fish", name: "Extra fish", price: 2500 }]),
  },
  {
    id: "m-buka-beans",
    restaurantId: "r-buka-express",
    name: "Beans and Plantain",
    description: "Soft beans, fried plantain, stew, and fish.",
    price: "2800",
    image: "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?auto=format&fit=crop&w=900&q=75",
    category: "Local",
    prepTime: "9",
    rating: "4.3",
    reviewCount: "25",
    popular: "0",
    available: "1",
    availableFrom: "8",
    availableTo: "18",
    servingUnit: "plate",
    options: mealOptions([{ id: "opt-fish", name: "Extra fish", price: 1200 }]),
  },
];

const reviews: Review[] = [
  {
    id: "rv-1",
    mealId: "m-jollof-smoky",
    restaurantId: "r-jollof-studio",
    userId: "u-customer-demo",
    userName: "Justin Ade",
    rating: "5",
    taste: "Smoky",
    portion: "Full",
    spice: "Medium",
    waitTime: "Fast",
    comment: "Picked it up in minutes. The rice actually tasted like party jollof.",
    createdAt: "2026-06-18T12:20:00.000Z",
  },
  {
    id: "rv-2",
    mealId: "m-amala-abula",
    restaurantId: "r-amala-house",
    userId: "u-customer-demo",
    userName: "Justin Ade",
    rating: "5",
    taste: "Rich",
    portion: "Heavy",
    spice: "Hot",
    waitTime: "Fast",
    comment: "No queue, no stress. The abula was hot when I arrived.",
    createdAt: "2026-06-19T14:10:00.000Z",
  },
  {
    id: "rv-3",
    mealId: "m-shawarma-beef",
    restaurantId: "r-shawarma-lab",
    userId: "u-customer-demo",
    userName: "Justin Ade",
    rating: "4",
    taste: "Good",
    portion: "Full",
    spice: "Medium",
    waitTime: "Fast",
    comment: "Loaded and neatly packed. Good quick dinner.",
    createdAt: "2026-06-20T18:45:00.000Z",
  },
];

const orders: Order[] = [];

const discounts: Discount[] = [
  { id: "d-launch", restaurantId: "r-jollof-studio", code: "SKIP10", type: "percent", value: "10", active: "1", expiresAt: "2026-12-31", minOrder: "3000", uses: "42" },
  { id: "d-wrap", restaurantId: "r-shawarma-lab", code: "WRAP500", type: "fixed", value: "500", active: "1", expiresAt: "2026-12-31", minOrder: "3500", uses: "18" },
  { id: "d-burger", restaurantId: "r-burger-district", code: "DISTRICT15", type: "percent", value: "15", active: "1", expiresAt: "2026-12-31", minOrder: "5000", uses: "23" },
];

function mergeSeedRows<T extends { id: string }>(file: string, seedRows: T[]) {
  const existingRows = readTable<T>(file);
  const byId = new Map(existingRows.map((row) => [row.id, row]));
  for (const row of seedRows) {
    byId.set(row.id, row);
  }
  writeTable(file, Array.from(byId.values()));
}

export function seedIfNeeded() {
  if (typeof window === "undefined") return;
  const hasSeed = Boolean(window.localStorage.getItem(SEED_FLAG));

  mergeSeedRows(FILES.users, users);
  mergeSeedRows(FILES.restaurants, restaurants);
  mergeSeedRows(FILES.meals, meals);
  mergeSeedRows(FILES.reviews, reviews);
  mergeSeedRows(FILES.discounts, discounts);
  if (!hasSeed || readTable(FILES.orders).length === 0) writeTable(FILES.orders, orders);
  if (!hasSeed) writeFile(FILES.session, "");
  window.localStorage.setItem(SEED_FLAG, "1");
}

export function ensureSeed() {
  if (typeof window === "undefined") return;
  seedIfNeeded();
}
