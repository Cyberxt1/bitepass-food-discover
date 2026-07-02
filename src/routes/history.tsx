import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Clock3, History as HistoryIcon, Receipt } from "lucide-react";
import { useEffect, useState } from "react";

import { ProgressiveItem } from "@/components/ProgressiveItem";
import { useAuth } from "@/lib/auth";
import { backend } from "@/lib/backend";
import { naira } from "@/lib/format";
import type { Order } from "@/lib/seed";

export const Route = createFileRoute("/history")({ component: HistoryPage });

function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }

    let cancelled = false;
    void backend
      .orders()
      .then((allOrders) => {
        if (cancelled) return;
        setOrders(
          allOrders
            .filter(
              (order) =>
                order.userId === user.id && ["completed", "cancelled"].includes(order.status),
            )
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, user]);

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-border/40 glass">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/profile"
            aria-label="Back to settings"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold">Order history</h1>
            <p className="text-xs text-muted-foreground">Completed and cancelled orders</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <span className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          </div>
        ) : orders.length === 0 ? (
          <section className="grid place-items-center rounded-3xl bg-card px-6 py-16 text-center shadow-soft">
            <HistoryIcon className="h-11 w-11 text-muted-foreground" />
            <p className="mt-4 text-base font-bold">No past orders yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Finished orders will be kept here for you.
            </p>
            <Link
              to="/discover"
              className="mt-6 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Find food
            </Link>
          </section>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {orders.map((order, index) => (
              <ProgressiveItem key={order.id} index={index} intrinsicSize="190px">
                <Link
                  to="/orders/$orderId"
                  params={{ orderId: order.id }}
                  className="block rounded-3xl border border-border/70 bg-card p-5 shadow-soft transition hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-muted">
                        <Receipt className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-black">Order #{order.id.slice(-5)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black capitalize ${
                        order.status === "completed"
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
                    {orderSummary(order)}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      View details
                    </span>
                    <span className="text-sm font-black text-primary">{naira(order.total)}</span>
                  </div>
                </Link>
              </ProgressiveItem>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function orderSummary(order: Order) {
  try {
    const items = JSON.parse(order.items) as { name: string; qty: number }[];
    return items.map((item) => `${item.qty}x ${item.name}`).join(", ");
  } catch {
    return "Order details";
  }
}
