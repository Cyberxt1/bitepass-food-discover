import type { Meal, Order, Restaurant, User } from "./seed";

export const orderFlow = [
  "placed",
  "paid",
  "accepted",
  "preparing",
  "ready",
  "picked_up",
  "completed",
] as const;
export type OrderStatus = (typeof orderFlow)[number] | "cancelled";

export function normalizeOrderStatus(status: string): OrderStatus {
  if (status === "received") return "paid";
  if (status === "pickedup") return "picked_up";
  return (
    orderFlow.includes(status as (typeof orderFlow)[number]) ? status : "placed"
  ) as OrderStatus;
}

export function nextOrderStatus(status: string): OrderStatus | null {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "cancelled") return null;
  const index = orderFlow.indexOf(normalized as (typeof orderFlow)[number]);
  return index >= 0 && index < orderFlow.length - 1 ? orderFlow[index + 1] : null;
}

export function orderTimestampPatch(status: string) {
  const now = new Date().toISOString();
  const normalized = normalizeOrderStatus(status);
  const keyByStatus: Partial<Record<OrderStatus, keyof Order>> = {
    placed: "placedAt",
    paid: "paidAt",
    accepted: "acceptedAt",
    preparing: "preparingAt",
    ready: "readyAt",
    picked_up: "pickedUpAt",
    completed: "completedAt",
    cancelled: "cancelledAt",
  };
  const key = keyByStatus[normalized];
  return key ? { [key]: now } : {};
}

export function isRestaurantPublic(restaurant: Restaurant) {
  const active = (restaurant.moderationStatus ?? "active") === "active";
  return active;
}

export function isMealPublic(meal: Meal) {
  return meal.available === "1" && (meal.moderationStatus ?? "active") === "active";
}

export function canManageRestaurant(user: User | null | undefined, restaurant: Restaurant) {
  if (!user) return false;
  return user.role === "admin" || restaurant.ownerId === user.id;
}

export function canViewOrder(user: User | null | undefined, order: Order, restaurant?: Restaurant) {
  if (!user) return false;
  return user.role === "admin" || order.userId === user.id || restaurant?.ownerId === user.id;
}

export function validateCheckout(params: {
  user: User | null | undefined;
  restaurant?: Restaurant;
  items: { restaurantId: string; mealId: string; qty: number }[];
  meals: Meal[];
  paystackConfigured: boolean;
}) {
  const { user, restaurant, items, meals } = params;
  if (!user) return "Please sign in to checkout";
  if (items.length === 0) return "Select at least one cart item to checkout";
  if (new Set(items.map((item) => item.restaurantId)).size > 1) {
    return "Checkout one restaurant at a time";
  }
  if (!restaurant) return "Restaurant could not be found";
  if (!isRestaurantPublic(restaurant)) return "This restaurant is not accepting orders yet";
  if (restaurant.isOpen === "0") return "This restaurant is closed right now";
  const mealById = new Map(meals.map((meal) => [meal.id, meal]));
  const unavailable = items.find((item) => {
    const meal = mealById.get(item.mealId);
    return !meal || !isMealPublic(meal);
  });
  if (unavailable) return "One or more items are no longer available";
  if (items.some((item) => item.qty < 1 || item.qty > 50)) return "Choose a valid quantity";
  return null;
}
