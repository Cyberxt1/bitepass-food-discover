import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChefHat, ShoppingBag, PackageCheck } from "lucide-react";
import type { Order, Restaurant } from "@/lib/seed";
import { naira } from "@/lib/format";
import { backend } from "@/lib/backend";

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
  const [order, setOrder] = useState<Order | undefined>();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const found = (await backend.orders()).find((o) => o.id === orderId);
      if (!cancelled) setOrder(found);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId, tick]);

  // Auto-advance status for demo realism
  useEffect(() => {
    if (!order || order.status === "completed") return;
    const idx = flow.indexOf(order.status as (typeof flow)[number]);
    if (idx < 0 || idx >= flow.length - 1) return;
    const t = setTimeout(() => {
      void backend.updateOrder(orderId, { status: flow[idx + 1] });
      setTick((x) => x + 1);
    }, 8000);
    return () => clearTimeout(t);
  }, [order, orderId]);

  // 1s countdown tick
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const restaurant = useMemo(
    () => undefined as Restaurant | undefined,
    [],
  );

  const [restaurantName, setRestaurantName] = useState<string>("restaurant");

  useEffect(() => {
    if (!order) return;
    let cancelled = false;
    async function loadRestaurant() {
      const found = (await backend.restaurants()).find((r) => r.id === order.restaurantId);
      if (!cancelled) setRestaurantName(found?.name ?? "restaurant");
    }
    void loadRestaurant();
    return () => {
      cancelled = true;
    };
  }, [order]);

  if (!order) return <div className="p-8 text-center text-sm">Order not found.</div>;

  const items = JSON.parse(order.items) as { name: string; qty: number; price: number; servingUnit?: string; notes?: string; options?: { name: string; price: number }[] }[];
  const currentIdx = flow.indexOf(order.status as (typeof flow)[number]);
  const pickupMs = new Date(order.pickupTime).getTime() - Date.now();
  const mins = Math.max(0, Math.floor(pickupMs / 60000));
  const secs = Math.max(0, Math.floor((pickupMs % 60000) / 1000));
  const isAsap = pickupMs <= 0 && order.status !== "completed";

  return (
    <div>
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/orders" className="grid h-9 w-9 place-items-center rounded-full bg-card shadow-soft"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-base font-bold">Order #{order.id.slice(-5)}</h1>
        </div>
      </header>

      <main className="space-y-4 px-4 pt-4">
        {/* Countdown */}
        <div className="rounded-3xl bg-gradient-warm p-5 text-white shadow-glow animate-slide-up">
          <p className="text-xs uppercase tracking-wider opacity-85">
            {order.status === "completed" ? "Order finished" : isAsap ? "Kitchen started" : "Ready in approx."}
          </p>
          <p className="mt-1 font-mono text-4xl font-bold">
            {order.status === "completed"
              ? "00:00"
              : isAsap
                ? "ASAP"
              : `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`}
          </p>
          <p className="mt-1 text-xs opacity-85">Pickup at {restaurantName}</p>
        </div>

        {/* Progress */}
        <div className="rounded-2xl bg-card p-4 shadow-soft">
          <div className="space-y-4">
            {flow.map((s, i) => {
              const Meta = stepMeta[s];
              const done = i <= currentIdx;
              const active = i === currentIdx && order.status !== "completed";
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className="relative">
                    {active && <span className="absolute inset-0 animate-pulse-ring rounded-full" />}
                    <div className={`grid h-9 w-9 place-items-center rounded-full transition ${done ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Meta.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${done ? "font-semibold" : "text-muted-foreground"}`}>{Meta.label}</p>
                  </div>
                  {done && <Check className="h-4 w-4 text-success" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Items */}
        <div className="rounded-2xl bg-card p-4 shadow-soft">
          <h3 className="text-sm font-bold">Items</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {items.map((it, i) => (
              <li key={i} className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{it.qty}× {it.name}</p>
                  {it.servingUnit && <p className="text-[11px] text-muted-foreground">Base: per {it.servingUnit}</p>}
                  {it.options && it.options.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      {it.options.map((option) => `${option.name} (+${naira(option.price)})`).join(", ")}
                    </p>
                  )}
                  {it.notes && <p className="text-[11px] text-muted-foreground">Note: {it.notes}</p>}
                </div>
                <span className="text-sm font-semibold">{naira(it.qty * it.price)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-bold">
            <span>Total paid</span><span>{naira(order.total)}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
