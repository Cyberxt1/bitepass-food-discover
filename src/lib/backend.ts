import { FILES, appendRow, deleteRow, readTable, updateRow } from "./csv-store";
import { getFirebase } from "./firebase";
import type { Discount, Meal, Order, Restaurant, Review, User } from "./seed";

type CollectionName = "users" | "restaurants" | "meals" | "orders" | "discounts" | "reviews";

async function collectionDocs<T>(name: CollectionName): Promise<T[]> {
  const { db, firestoreSdk } = await getFirebase();
  const snap = await firestoreSdk.getDocs(firestoreSdk.collection(db, name)) as {
    docs: { id: string; data: () => Record<string, unknown> }[];
  };
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
}

async function setDoc<T extends { id: string }>(name: CollectionName, item: T): Promise<void> {
  const { db, firestoreSdk } = await getFirebase();
  await firestoreSdk.setDoc(firestoreSdk.doc(db, name, item.id), item);
}

async function patchDoc(name: CollectionName, id: string, patch: Record<string, unknown>): Promise<void> {
  const { db, firestoreSdk } = await getFirebase();
  await firestoreSdk.updateDoc(firestoreSdk.doc(db, name, id), patch);
}

async function removeDoc(name: CollectionName, id: string): Promise<void> {
  const { db, firestoreSdk } = await getFirebase();
  await firestoreSdk.deleteDoc(firestoreSdk.doc(db, name, id));
}

function mergeById<T extends { id: string }>(cloudRows: T[], localRows: T[]): T[] {
  const map = new Map<string, T>();
  for (const row of localRows) map.set(row.id, row);
  for (const row of cloudRows) map.set(row.id, row);
  return Array.from(map.values());
}

async function mergedCollection<T extends { id: string }>(
  cloud: () => Promise<T[]>,
  local: () => T[],
): Promise<T[]> {
  try {
    return mergeById(await cloud(), local());
  } catch (error) {
    console.warn("Firebase unavailable, using local fallback", error);
    return local();
  }
}

async function writeThrough(cloud: () => Promise<void>, local: () => void): Promise<void> {
  local();
  try {
    await cloud();
  } catch (error) {
    console.warn("Firebase write unavailable, saved locally", error);
  }
}

export const backend = {
  users: () => mergedCollection(() => collectionDocs<User>("users"), () => readTable<User>(FILES.users)),
  restaurants: () => mergedCollection(() => collectionDocs<Restaurant>("restaurants"), () => readTable<Restaurant>(FILES.restaurants)),
  meals: () => mergedCollection(() => collectionDocs<Meal>("meals"), () => readTable<Meal>(FILES.meals)),
  orders: () => mergedCollection(() => collectionDocs<Order>("orders"), () => readTable<Order>(FILES.orders)),
  reviews: () => mergedCollection(() => collectionDocs<Review>("reviews"), () => readTable<Review>(FILES.reviews)),
  discounts: () => mergedCollection(() => collectionDocs<Discount>("discounts"), () => readTable<Discount>(FILES.discounts)),

  setUser: (user: User) => writeThrough(() => setDoc("users", user), () => appendRow(FILES.users, user)),
  setRestaurant: (restaurant: Restaurant) =>
    writeThrough(() => setDoc("restaurants", restaurant), () => appendRow(FILES.restaurants, restaurant)),
  addOrder: (order: Order) => writeThrough(() => setDoc("orders", order), () => appendRow(FILES.orders, order)),
  addMeal: (meal: Meal) => writeThrough(() => setDoc("meals", meal), () => appendRow(FILES.meals, meal)),
  addDiscount: (discount: Discount) => writeThrough(() => setDoc("discounts", discount), () => appendRow(FILES.discounts, discount)),
  addReview: (review: Review) => writeThrough(() => setDoc("reviews", review), () => appendRow(FILES.reviews, review)),

  updateRestaurant: (id: string, patch: Partial<Restaurant>) =>
    writeThrough(() => patchDoc("restaurants", id, patch), () => updateRow(FILES.restaurants, (row) => row.id === id, patch)),
  updateOrder: (id: string, patch: Partial<Order>) =>
    writeThrough(() => patchDoc("orders", id, patch), () => updateRow(FILES.orders, (row) => row.id === id, patch)),
  updateMeal: (id: string, patch: Partial<Meal>) =>
    writeThrough(() => patchDoc("meals", id, patch), () => updateRow(FILES.meals, (row) => row.id === id, patch)),
  updateDiscount: (id: string, patch: Partial<Discount>) =>
    writeThrough(() => patchDoc("discounts", id, patch), () => updateRow(FILES.discounts, (row) => row.id === id, patch)),

  deleteMeal: (id: string) =>
    writeThrough(() => removeDoc("meals", id), () => deleteRow(FILES.meals, (row) => row.id === id)),
  deleteDiscount: (id: string) =>
    writeThrough(() => removeDoc("discounts", id), () => deleteRow(FILES.discounts, (row) => row.id === id)),
};
