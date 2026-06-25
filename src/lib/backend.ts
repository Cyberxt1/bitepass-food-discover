import { FILES, appendRow, deleteRow, readTable, updateRow } from "./csv-store";
import { isSupabaseConfigured, supabase } from "./supabase";
import type {
  Discount,
  Feedback,
  Meal,
  Order,
  PlatformStats,
  Restaurant,
  Review,
  User,
} from "./seed";
import { ensureSeed } from "./seed";
import { trackAuditEvent } from "./audit";

type CollectionName =
  | "users"
  | "restaurants"
  | "meals"
  | "orders"
  | "discounts"
  | "reviews"
  | "feedback"
  | "platformStats";
type Row = { id: string } & Record<string, unknown>;

const useSupabase = import.meta.env.VITE_DATA_BACKEND === "supabase" && isSupabaseConfigured;

const fileFor: Record<CollectionName, string> = {
  users: FILES.users,
  restaurants: FILES.restaurants,
  meals: FILES.meals,
  orders: FILES.orders,
  discounts: FILES.discounts,
  reviews: FILES.reviews,
  feedback: FILES.feedback,
  platformStats: FILES.platformStats,
};

function upsertLocal<T extends { id: string }>(file: string, item: T) {
  const rows = readTable<T>(file);
  const exists = rows.some((row) => row.id === item.id);
  if (exists) updateRow(file, (row) => row.id === item.id, item);
  else appendRow(file, item);
}

function cleanRow<T extends Row>(item: T): Row {
  return Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined)) as Row;
}

async function readSupabaseTable<T extends Row>(name: CollectionName): Promise<T[]> {
  if (!supabase) return [];

  const { data, error } = await supabase.from(name).select("*");
  if (error) throw error;

  const rows = (data ?? []) as T[];
  rows.forEach((row) => upsertLocal(fileFor[name], row));
  return rows;
}

async function readCollection<T extends Row>(name: CollectionName): Promise<T[]> {
  ensureSeed();

  if (useSupabase) {
    try {
      const remoteRows = await readSupabaseTable<T>(name);
      if (remoteRows.length > 0) return remoteRows;

      const localRows = readTable<T>(fileFor[name]);
      if (localRows.length > 0) return localRows;

      return remoteRows;
    } catch (error) {
      console.warn(`Supabase ${name} read failed, using local fallback`, error);
    }
  }

  return readTable<T>(fileFor[name]);
}

async function setCollectionDoc<T extends Row>(name: CollectionName, item: T) {
  if (useSupabase && supabase) {
    const { error } = await supabase.from(name).upsert(cleanRow(item));
    if (error) {
      console.warn(`Supabase ${name} write failed, saving local fallback`, error);
    } else {
      upsertLocal(fileFor[name], item);
      return;
    }
  }
  upsertLocal(fileFor[name], item);
}

async function patchCollectionDoc(
  name: CollectionName,
  id: string,
  patch: Record<string, unknown>,
) {
  if (useSupabase && supabase) {
    const { error } = await supabase
      .from(name)
      .update(cleanRow({ id, ...patch }))
      .eq("id", id);
    if (error) {
      console.warn(`Supabase ${name} update failed, saving local fallback`, error);
    } else {
      updateRow(fileFor[name], (row) => row.id === id, patch);
      return;
    }
  }
  updateRow(fileFor[name], (row) => row.id === id, patch);
}

async function deleteCollectionDoc(name: CollectionName, id: string) {
  if (useSupabase && supabase) {
    const { error } = await supabase.from(name).delete().eq("id", id);
    if (error) {
      console.warn(`Supabase ${name} delete failed, deleting local fallback`, error);
    } else {
      deleteRow(fileFor[name], (row) => row.id === id);
      return;
    }
  }
  deleteRow(fileFor[name], (row) => row.id === id);
}

async function writeWithFallback(action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    console.warn("Write failed", error);
  }
}

export const backend = {
  users: () => readCollection<User>("users"),
  restaurants: () => readCollection<Restaurant>("restaurants"),
  meals: () => readCollection<Meal>("meals"),
  orders: () => readCollection<Order>("orders"),
  reviews: () => readCollection<Review>("reviews"),
  feedback: () => readCollection<Feedback>("feedback"),
  discounts: () => readCollection<Discount>("discounts"),
  platformStats: () => readCollection<PlatformStats>("platformStats"),

  setUser: (user: User) => writeWithFallback(() => setCollectionDoc("users", user)),
  setRestaurant: (restaurant: Restaurant) => {
    trackAuditEvent({
      type: "restaurant_created",
      actorId: restaurant.ownerId,
      targetId: restaurant.id,
      targetType: "restaurant",
      title: `${restaurant.name} store saved`,
      detail: restaurant.address || restaurant.cuisine,
    });
    return writeWithFallback(() => setCollectionDoc("restaurants", restaurant));
  },
  addOrder: (order: Order) => {
    trackAuditEvent({
      type: "order_created",
      actorId: order.userId,
      targetId: order.id,
      targetType: "order",
      title: `Order #${order.id.slice(-5)} created`,
      detail: `${order.status} - ${order.total}`,
    });
    return writeWithFallback(() => setCollectionDoc("orders", order));
  },
  addMeal: (meal: Meal) => writeWithFallback(() => setCollectionDoc("meals", meal)),
  addDiscount: (discount: Discount) =>
    writeWithFallback(() => setCollectionDoc("discounts", discount)),
  addReview: (review: Review) => {
    trackAuditEvent({
      type: "review_created",
      actorId: review.userId,
      actorName: review.userName,
      targetId: review.id,
      targetType: "review",
      title: `${review.userName} left a ${review.rating}-star review`,
      detail: review.comment,
    });
    return writeWithFallback(() => setCollectionDoc("reviews", review));
  },
  addFeedback: (feedback: Feedback) => {
    trackAuditEvent({
      type: "review_created",
      actorId: feedback.userId,
      actorName: feedback.userName,
      targetId: feedback.id,
      targetType: "review",
      title: `${feedback.userName} sent ${feedback.category} feedback`,
      detail: feedback.message,
    });
    return writeWithFallback(() => setCollectionDoc("feedback", feedback));
  },

  updateUser: (id: string, patch: Partial<User>) =>
    writeWithFallback(() => patchCollectionDoc("users", id, patch)),
  updateRestaurant: (id: string, patch: Partial<Restaurant>) => {
    trackAuditEvent({
      type: "restaurant_updated",
      targetId: id,
      targetType: "restaurant",
      title: `Restaurant ${id} updated`,
      detail: Object.keys(patch).join(", "),
    });
    return writeWithFallback(() => patchCollectionDoc("restaurants", id, patch));
  },
  updateOrder: (id: string, patch: Partial<Order>) => {
    trackAuditEvent({
      type: "order_updated",
      targetId: id,
      targetType: "order",
      title: `Order #${id.slice(-5)} updated`,
      detail: Object.entries(patch)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", "),
    });
    return writeWithFallback(() => patchCollectionDoc("orders", id, patch));
  },
  updateMeal: (id: string, patch: Partial<Meal>) =>
    writeWithFallback(() => patchCollectionDoc("meals", id, patch)),
  updateFeedback: (id: string, patch: Partial<Feedback>) =>
    writeWithFallback(() => patchCollectionDoc("feedback", id, patch)),
  updatePlatformStats: (stats: PlatformStats) =>
    writeWithFallback(() => setCollectionDoc("platformStats", stats)),
  updateDiscount: (id: string, patch: Partial<Discount>) =>
    writeWithFallback(() => patchCollectionDoc("discounts", id, patch)),

  deleteMeal: (id: string) => writeWithFallback(() => deleteCollectionDoc("meals", id)),
  deleteDiscount: (id: string) => writeWithFallback(() => deleteCollectionDoc("discounts", id)),
};
