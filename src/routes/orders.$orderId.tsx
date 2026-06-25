import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChefHat, ShoppingBag, PackageCheck } from "lucide-react";
import type { Order, Review } from "@/lib/seed";
import { naira } from "@/lib/format";
import { backend } from "@/lib/backend";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/notifications";

export const Route = createFileRoute("/orders/$orderId")({ component: OrderDetail });

const flow = ["received", "preparing", "ready", "completed"] as const;
const stepMeta = {
  received: { label: "Order received", icon: ShoppingBag },
  preparing: { label: "Preparing", icon: ChefHat },
  ready: { label: "Ready for pickup", icon: PackageCheck },
  completed: { label: "Completed", icon: Check },
};

function OrderDetail() {
  const { orderId } = Route.useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | undefined>();
  const [tick, setTick] = useState(0);
  const [restaurantName, setRestaurantName] = useState("restaurant");
  const [reviewTarget, setReviewTarget] = useState("restaurant");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const found = (await backend.orders()).find((item) => item.id === orderId);
      if (!cancelled) setOrder(found);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId, tick]);

  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const currentOrder = order;
    if (!currentOrder) return;
    const activeOrder = currentOrder;
    let cancelled = false;
    async function loadRestaurant() {
      const found = (await backend.restaurants()).find(
        (restaurant) => restaurant.id === activeOrder.restaurantId,
      );
      if (!cancelled) setRestaurantName(found?.name ?? "restaurant");
    }
    void loadRestaurant();
    return () => {
      cancelled = true;
    };
  }, [order]);

  if (!order) return <div className="p-8 text-center text-sm">Order not found.</div>;

  const items = JSON.parse(order.items) as {
    mealId?: string;
    name: string;
    qty: number;
    price: number;
    servingUnit?: string;
    notes?: string;
    options?: { name: string; price: number; qty?: number }[];
  }[];
  const currentIdx = flow.indexOf(order.status as (typeof flow)[number]);
  const submitReview = async () => {
    if (!user || reviewing) return;
    if (!reviewComment.trim()) {
      notify("error", "Write a short review first", { id: "order-review-empty" });
      return;
    }
    setReviewing(true);
    try {
      const mealId = reviewTarget === "restaurant" ? "" : reviewTarget;
      const review: Review = {
        id: "rv" + Date.now(),
        mealId,
        restaurantId: reviewTarget === "restaurant" ? order.restaurantId : undefined,
        userId: user.id,
        userName: user.name,
        rating: String(reviewRating),
        taste: "",
        portion: "",
        spice: "",
        waitTime: "",
        comment: reviewComment.trim(),
        createdAt: new Date().toISOString(),
      };
      await backend.addReview(review);
      setReviewComment("");
      setReviewRating(5);
      notify("success", "Review sent", { id: `order-review:${order.id}:${reviewTarget}` });
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/orders"
            className="grid h-9 w-9 place-items-center rounded-full bg-card shadow-soft"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-base font-bold">Order #{order.id.slice(-5)}</h1>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-4 px-4 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:pt-8">
        <div className="rounded-3xl bg-gradient-warm p-5 text-white shadow-glow animate-slide-up">
          <p className="text-xs uppercase tracking-wider opacity-85">
            {order.status === "completed" ? "Order finished" : "Order sent to store"}
          </p>
          <p className="mt-1 font-mono text-4xl font-bold">
            {order.status === "completed" ? "DONE" : "PAID"}
          </p>
          <p className="mt-1 text-xs opacity-85">Pickup at {restaurantName}</p>
          <p className="mt-1 text-xs opacity-85">
            Requested pickup: {new Date(order.pickupTime).toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-soft lg:row-span-2">
          <div className="space-y-4">
            {flow.map((step, index) => {
              const Meta = stepMeta[step];
              const done = index <= currentIdx;
              const active = index === currentIdx && order.status !== "completed";
              return (
                <div key={step} className="flex items-center gap-3">
                  <div className="relative">
                    {active && (
                      <span className="absolute inset-0 animate-pulse-ring rounded-full" />
                    )}
                    <div
                      className={`grid h-9 w-9 place-items-center rounded-full transition ${done ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      <Meta.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${done ? "font-semibold" : "text-muted-foreground"}`}>
                      {Meta.label}
                    </p>
                  </div>
                  {done && <Check className="h-4 w-4 text-success" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-soft">
          <h3 className="text-sm font-bold">Items</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {items.map((item, index) => (
              <li key={index} className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {item.qty}x {item.name}
                  </p>
                  {item.servingUnit && (
                    <p className="text-[11px] text-muted-foreground">
                      Base: per {item.servingUnit}
                    </p>
                  )}
                  {item.options && item.options.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      {item.options
                        .map(
                          (option) =>
                            `${option.name}${option.qty && option.qty > 1 ? ` x${option.qty}` : ""} (+${naira(option.price)})`,
                        )
                        .join(", ")}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-[11px] text-muted-foreground">Note: {item.notes}</p>
                  )}
                </div>
                <span className="text-sm font-semibold">{naira(item.qty * item.price)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-bold">
            <span>Total paid</span>
            <span>{naira(order.total)}</span>
          </div>
        </div>

        {order.status === "completed" && (
          <div className="rounded-2xl bg-card p-4 shadow-soft lg:col-span-2">
            <h3 className="text-sm font-bold">Review this order</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-[220px_1fr_auto] md:items-start">
              <select
                value={reviewTarget}
                onChange={(event) => setReviewTarget(event.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="restaurant">Restaurant service</option>
                {items
                  .filter((item) => item.mealId)
                  .map((item) => (
                    <option key={item.mealId} value={item.mealId}>
                      {item.name}
                    </option>
                  ))}
              </select>
              <div>
                <div className="mb-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReviewRating(value)}
                      className="text-lg"
                    >
                      <span
                        className={value <= reviewRating ? "text-warning" : "text-muted-foreground"}
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="How was the food or service?"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <button
                type="button"
                onClick={submitReview}
                disabled={reviewing}
                className="rounded-xl bg-gradient-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-glow disabled:opacity-60"
              >
                {reviewing ? "Sending..." : "Send review"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
