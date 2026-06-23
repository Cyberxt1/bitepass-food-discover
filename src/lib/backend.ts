import { FILES, appendRow, deleteRow, readTable, updateRow } from "./csv-store";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { Discount, Meal, Order, Restaurant, Review, User } from "./seed";

type CollectionName = "users" | "restaurants" | "meals" | "orders" | "discounts" | "reviews";
type Row = { id: string } & Record<string, unknown>;

const useSupabase = import.meta.env.VITE_DATA_BACKEND === "supabase" && isSupabaseConfigured;

const fileFor: Record<CollectionName, string> = {
  users: FILES.users,
  restaurants: FILES.restaurants,
  meals: FILES.meals,
  orders: FILES.orders,
  discounts: FILES.discounts,
  reviews: FILES.reviews,
};

const seededTables = new Set<CollectionName>();

function upsertLocal<T extends { id: string }>(file: string, item: T) {
  const rows = readTable<T>(file);
  const exists = rows.some((row) => row.id === item.id);
  if (exists) updateRow(file, (row) => row.id === item.id, item);
  else appendRow(file, item);
}

function cleanRow<T extends Row>(item: T): Row {
  return Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined)) as Row;
}

async function seedSupabaseTableIfEmpty<T extends Row>(name: CollectionName) {
  if (!useSupabase || !supabase || seededTables.has(name)) return;
  seededTables.add(name);

  const fallbackRows = readTable<T>(fileFor[name]);
  if (fallbackRows.length === 0) return;

  const { count, error } = await supabase.from(name).select("id", { count: "exact", head: true });
  if (error) throw error;
  if ((count ?? 0) > 0) return;

  const { error: upsertError } = await supabase.from(name).upsert(fallbackRows.map(cleanRow));
  if (upsertError) throw upsertError;
}

async function readSupabaseTable<T extends Row>(name: CollectionName): Promise<T[]> {
  if (!supabase) return [];
  await seedSupabaseTableIfEmpty<T>(name);

  const { data, error } = await supabase.from(name).select("*");
  if (error) throw error;

  const rows = (data ?? []) as T[];
  rows.forEach((row) => upsertLocal(fileFor[name], row));
  return rows;
}

async function readCollection<T extends Row>(name: CollectionName): Promise<T[]> {
  if (useSupabase) {
    try {
      const rows = await readSupabaseTable<T>(name);
      if (rows.length > 0) return rows;
    } catch (error) {
      console.warn(`Supabase ${name} read failed, using local fallback`, error);
    }
  }

  return readTable<T>(fileFor[name]);
}

async function setCollectionDoc<T extends Row>(name: CollectionName, item: T) {
  upsertLocal(fileFor[name], item);
  if (useSupabase && supabase) {
    const { error } = await supabase.from(name).upsert(cleanRow(item));
    if (error) throw error;
  }
}

async function patchCollectionDoc(name: CollectionName, id: string, patch: Record<string, unknown>) {
  updateRow(fileFor[name], (row) => row.id === id, patch);
  if (useSupabase && supabase) {
    const { error } = await supabase.from(name).update(cleanRow({ id, ...patch })).eq("id", id);
    if (error) throw error;
  }
}

async function deleteCollectionDoc(name: CollectionName, id: string) {
  deleteRow(fileFor[name], (row) => row.id === id);
  if (useSupabase && supabase) {
    const { error } = await supabase.from(name).delete().eq("id", id);
    if (error) throw error;
  }
}

async function writeWithFallback(action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    console.warn("Remote write failed after local write", error);
  }
}

export const backend = {
  users: () => readCollection<User>("users"),
  restaurants: () => readCollection<Restaurant>("restaurants"),
  meals: () => readCollection<Meal>("meals"),
  orders: () => readCollection<Order>("orders"),
  reviews: () => readCollection<Review>("reviews"),
  discounts: () => readCollection<Discount>("discounts"),

  setUser: (user: User) => writeWithFallback(() => setCollectionDoc("users", user)),
  setRestaurant: (restaurant: Restaurant) => writeWithFallback(() => setCollectionDoc("restaurants", restaurant)),
  addOrder: (order: Order) => writeWithFallback(() => setCollectionDoc("orders", order)),
  addMeal: (meal: Meal) => writeWithFallback(() => setCollectionDoc("meals", meal)),
  addDiscount: (discount: Discount) => writeWithFallback(() => setCollectionDoc("discounts", discount)),
  addReview: (review: Review) => writeWithFallback(() => setCollectionDoc("reviews", review)),

  updateUser: (id: string, patch: Partial<User>) => writeWithFallback(() => patchCollectionDoc("users", id, patch)),
  updateRestaurant: (id: string, patch: Partial<Restaurant>) =>
    writeWithFallback(() => patchCollectionDoc("restaurants", id, patch)),
  updateOrder: (id: string, patch: Partial<Order>) => writeWithFallback(() => patchCollectionDoc("orders", id, patch)),
  updateMeal: (id: string, patch: Partial<Meal>) => writeWithFallback(() => patchCollectionDoc("meals", id, patch)),
  updateDiscount: (id: string, patch: Partial<Discount>) =>
    writeWithFallback(() => patchCollectionDoc("discounts", id, patch)),

  deleteMeal: (id: string) => writeWithFallback(() => deleteCollectionDoc("meals", id)),
  deleteDiscount: (id: string) => writeWithFallback(() => deleteCollectionDoc("discounts", id)),
};
