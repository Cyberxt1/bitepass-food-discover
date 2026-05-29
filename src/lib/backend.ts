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

async function withFallback<T>(cloud: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await cloud();
  } catch (error) {
    console.warn("Firebase unavailable, using local fallback", error);
    return fallback();
  }
}

export const backend = {
  users: () => withFallback(() => collectionDocs<User>("users"), () => readTable<User>(FILES.users)),
  restaurants: () =>
    withFallback(() => collectionDocs<Restaurant>("restaurants"), () => readTable<Restaurant>(FILES.restaurants)),
  meals: () => withFallback(() => collectionDocs<Meal>("meals"), () => readTable<Meal>(FILES.meals)),
  orders: () => withFallback(() => collectionDocs<Order>("orders"), () => readTable<Order>(FILES.orders)),
  reviews: () => withFallback(() => collectionDocs<Review>("reviews"), () => readTable<Review>(FILES.reviews)),
  discounts: () =>
    withFallback(() => collectionDocs<Discount>("discounts"), () => readTable<Discount>(FILES.discounts)),

  setUser: (user: User) => withFallback(() => setDoc("users", user), () => appendRow(FILES.users, user)),
  setRestaurant: (restaurant: Restaurant) =>
    withFallback(() => setDoc("restaurants", restaurant), () => appendRow(FILES.restaurants, restaurant)),

  updateRestaurant: (id: string, patch: Partial<Restaurant>) =>
    withFallback(() => patchDoc("restaurants", id, patch), () => updateRow(FILES.restaurants, (r) => r.id === id, patch)),
  updateOrder: (id: string, patch: Partial<Order>) =>
    withFallback(() => patchDoc("orders", id, patch), () => updateRow(FILES.orders, (r) => r.id === id, patch)),
  addMeal: (meal: Meal) => withFallback(() => setDoc("meals", meal), () => appendRow(FILES.meals, meal)),
  updateMeal: (id: string, patch: Partial<Meal>) =>
    withFallback(() => patchDoc("meals", id, patch), () => updateRow(FILES.meals, (r) => r.id === id, patch)),
  deleteMeal: (id: string) =>
    withFallback(() => removeDoc("meals", id), () => deleteRow(FILES.meals, (r) => r.id === id)),
  addDiscount: (discount: Discount) =>
    withFallback(() => setDoc("discounts", discount), () => appendRow(FILES.discounts, discount)),
  addReview: (review: Review) =>
    withFallback(() => setDoc("reviews", review), () => appendRow(FILES.reviews, review)),
  updateDiscount: (id: string, patch: Partial<Discount>) =>
    withFallback(() => patchDoc("discounts", id, patch), () => updateRow(FILES.discounts, (r) => r.id === id, patch)),
  deleteDiscount: (id: string) =>
    withFallback(() => removeDoc("discounts", id), () => deleteRow(FILES.discounts, (r) => r.id === id)),
};
