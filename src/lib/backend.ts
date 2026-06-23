import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { FILES, appendRow, deleteRow, readTable, updateRow } from "./csv-store";
import { db } from "./firebase";
import type { Discount, Meal, Order, Restaurant, Review, User } from "./seed";

type CollectionName = "users" | "restaurants" | "meals" | "orders" | "discounts" | "reviews";

const fileFor: Record<CollectionName, string> = {
  users: FILES.users,
  restaurants: FILES.restaurants,
  meals: FILES.meals,
  orders: FILES.orders,
  discounts: FILES.discounts,
  reviews: FILES.reviews,
};

const seededCollections = new Set<CollectionName>();

function upsertLocal<T extends { id: string }>(file: string, item: T) {
  const rows = readTable<T>(file);
  const exists = rows.some((row) => row.id === item.id);
  if (exists) updateRow(file, (row) => row.id === item.id, item);
  else appendRow(file, item);
}

async function seedCollectionIfEmpty<T extends { id: string }>(name: CollectionName) {
  if (seededCollections.has(name)) return;
  seededCollections.add(name);

  const fallbackRows = readTable<T>(fileFor[name]);
  if (fallbackRows.length === 0) return;

  const snap = await getDocs(collection(db, name));
  if (!snap.empty) return;

  await Promise.all(
    fallbackRows.map((row) => setDoc(doc(db, name, row.id), sanitizeForFirestore(row))),
  );
}

function sanitizeForFirestore<T extends Record<string, unknown>>(item: T): DocumentData {
  return Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined));
}

async function allDocs<T extends { id: string }>(name: CollectionName): Promise<T[]> {
  await seedCollectionIfEmpty<T>(name);
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as T);
}

async function readCollection<T extends { id: string }>(name: CollectionName): Promise<T[]> {
  try {
    const rows = await allDocs<T>(name);
    if (rows.length > 0) return rows;
  } catch (error) {
    console.warn(`Firestore ${name} read failed, using local fallback`, error);
  }
  return readTable<T>(fileFor[name]);
}

async function setCollectionDoc<T extends { id: string }>(name: CollectionName, item: T) {
  upsertLocal(fileFor[name], item);
  await setDoc(doc(db, name, item.id), sanitizeForFirestore(item));
}

async function patchCollectionDoc(name: CollectionName, id: string, patch: Record<string, unknown>) {
  updateRow(fileFor[name], (row) => row.id === id, patch);
  await updateDoc(doc(db, name, id), sanitizeForFirestore(patch));
}

async function deleteCollectionDoc(name: CollectionName, id: string) {
  deleteRow(fileFor[name], (row) => row.id === id);
  await deleteDoc(doc(db, name, id));
}

async function writeWithFallback(action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    console.warn("Firestore write failed after local write", error);
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
