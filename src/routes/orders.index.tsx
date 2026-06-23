import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import type { Order } from "@/lib/seed";
import { useAuth } from "@/lib/auth";
import { naira } from "@/lib/format";
import { backend } from "@/lib/backend";

export const Route = createFileRoute("/orders/")({ component: OrdersList });

const statusColors: Record<string, string> = {
  received: "bg-warning/15 text-warning",
  preparing: "bg-primary/15 text-primary",
  ready: "bg-success/15 text-success",
  completed: "bg-muted text-muted-foreground",
};

function OrdersList() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const currentUser = user;
    if (!currentUser) {
      nav({ to: "/login" });
      return;
    }
    const activeUser = currentUser;
    let cancelled = false;
    async function loadOrders() {
      const list = (await backend.orders())
        .filter((order) => order.userId === activeUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (!cancelled) setOrders(list);
    }
    void loadOrders();
    const timer = window.setInterval(() => {
      void loadOrders();
    }, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [user, nav]);

  if (!user) return null;

  return (
    <div>
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
          <h1 className="text-base font-bold">Your orders</h1>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="grid place-items-center px-6 pt-20 text-center">
          <Receipt className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-base font-semibold">No orders yet</p>
          <Link to="/discover" className="mt-6 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
            Order something
          </Link>
        </div>
      ) : (
        <main className="mx-auto grid max-w-6xl gap-3 px-4 pt-4 sm:px-6 md:grid-cols-2 lg:px-8 lg:pt-8 xl:grid-cols-3">
          {orders.map((order) => {
            const items = JSON.parse(order.items) as { name: string; qty: number }[];
            return (
              <Link
                key={order.id}
                to="/orders/$orderId"
                params={{ orderId: order.id }}
                className="block rounded-2xl bg-card p-4 shadow-soft transition hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">Order #{order.id.slice(-5)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Pickup: {new Date(order.pickupTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusColors[order.status] ?? ""}`}>
                      {order.status}
                    </span>
                    {order.paymentStatus === "paid" && (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">paid</span>
                    )}
                  </div>
                </div>
                <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                  {items.map((item) => `${item.qty}x ${item.name}`).join(", ")}
                </p>
                <div className="mt-2 text-sm font-bold text-primary">{naira(order.total)}</div>
              </Link>
            );
          })}
        </main>
      )}
    </div>
  );
}
