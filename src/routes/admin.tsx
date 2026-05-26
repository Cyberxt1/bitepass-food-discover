import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, TrendingUp, Users, ShoppingBag, Star, LogOut, ChefHat, Clock } from "lucide-react";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { FILES, readTable, updateRow } from "@/lib/csv-store";
import type { Meal, Order, Restaurant, User } from "@/lib/seed";
import { useAuth } from "@/lib/auth";
import { naira } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({ component: AdminDashboard });

function AdminDashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) nav({ to: "/login" });
    else if (user.role !== "admin") nav({ to: "/" });
  }, [user, nav]);

  const orders = useMemo(() => readTable<Order>(FILES.orders), [tick]);
  const meals = useMemo(() => readTable<Meal>(FILES.meals), [tick]);
  const restaurants = useMemo(() => readTable<Restaurant>(FILES.restaurants), []);
  const users = useMemo(() => readTable<User>(FILES.users), []);

  if (!user || user.role !== "admin") return null;

  const totalRevenue = orders.filter((o) => o.status === "completed").reduce((s, o) => s + Number(o.total), 0);
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length;
  const activeOrders = orders.filter((o) => ["received", "preparing", "ready"].includes(o.status));
  const completionRate = orders.length
    ? Math.round((orders.filter((o) => o.status === "completed").length / orders.length) * 100)
    : 0;

  // Top selling meals
  const mealSales: Record<string, { name: string; count: number; revenue: number }> = {};
  orders.forEach((o) => {
    const items = JSON.parse(o.items) as { mealId: string; name: string; qty: number; price: number }[];
    items.forEach((it) => {
      if (!mealSales[it.mealId]) mealSales[it.mealId] = { name: it.name, count: 0, revenue: 0 };
      mealSales[it.mealId].count += it.qty;
      mealSales[it.mealId].revenue += it.qty * it.price;
    });
  });
  const topMeals = Object.values(mealSales).sort((a, b) => b.count - a.count).slice(0, 5);

  // Busiest hours (mock distribution + real)
  const hourBuckets = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, orders: 0 }));
  orders.forEach((o) => { const h = new Date(o.createdAt).getHours(); hourBuckets[h].orders++; });
  const busyHours = hourBuckets.filter((_, i) => i >= 8 && i <= 22);

  // Revenue trend (last 7 days)
  const trend = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const rev = orders.filter((o) => new Date(o.createdAt).toDateString() === key).reduce((s, o) => s + Number(o.total), 0);
    return { day: d.toLocaleDateString("en", { weekday: "short" }), revenue: Math.round(rev / 100) / 10 }; // in thousands
  });

  // Repeat customers
  const userOrderCounts: Record<string, number> = {};
  orders.forEach((o) => { userOrderCounts[o.userId] = (userOrderCounts[o.userId] ?? 0) + 1; });
  const repeat = Object.values(userOrderCounts).filter((n) => n > 1).length;
  const retention = users.length ? Math.round((repeat / Math.max(1, Object.keys(userOrderCounts).length)) * 100) : 0;

  // Status distribution
  const statusDist = ["received", "preparing", "ready", "completed"].map((s) => ({
    name: s, value: orders.filter((o) => o.status === s).length,
  }));
  const COLORS = ["oklch(0.78 0.15 75)", "oklch(0.68 0.19 35)", "oklch(0.65 0.16 150)", "oklch(0.5 0.02 50)"];

  const advance = (id: string, next: string) => {
    updateRow(FILES.orders, (r) => r.id === id, { status: next });
    setTick((x) => x + 1);
    toast.success(`Order updated → ${next}`);
  };

  return (
    <div>
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
              <ChefHat className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Admin Dashboard</p>
              <p className="text-[10px] text-muted-foreground">BitePass for Restaurants</p>
            </div>
          </div>
          <button onClick={() => { logout(); nav({ to: "/" }); }} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="space-y-5 px-4 pt-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <Kpi icon={TrendingUp} label="Revenue" value={naira(totalRevenue)} accent="bg-gradient-primary" />
          <Kpi icon={ShoppingBag} label="Today" value={`${todayOrders} orders`} />
          <Kpi icon={Users} label="Repeat customers" value={`${repeat} (${retention}%)`} />
          <Kpi icon={Star} label="Completion rate" value={`${completionRate}%`} />
        </div>

        {/* Revenue trend */}
        <Card title="Revenue trend (last 7 days)" subtitle="In thousands ₦">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <XAxis dataKey="day" stroke="oklch(0.5 0.02 50)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.5 0.02 50)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.008 80)", fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" stroke="oklch(0.68 0.19 35)" strokeWidth={2.5} dot={{ r: 4, fill: "oklch(0.68 0.19 35)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Active orders */}
        <Card title="Active orders" subtitle={`${activeOrders.length} in queue`}>
          <div className="space-y-2">
            {activeOrders.length === 0 && <p className="text-xs text-muted-foreground">No active orders right now.</p>}
            {activeOrders.slice(0, 5).map((o) => {
              const items = JSON.parse(o.items) as { name: string; qty: number }[];
              const flow = ["received", "preparing", "ready", "completed"];
              const nextStatus = flow[flow.indexOf(o.status) + 1] ?? "completed";
              return (
                <div key={o.id} className="rounded-xl bg-muted/60 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold">#{o.id.slice(-5)} · {naira(o.total)}</p>
                      <p className="text-[11px] text-muted-foreground">{items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
                    </div>
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold capitalize text-primary">{o.status}</span>
                  </div>
                  <button onClick={() => advance(o.id, nextStatus)}
                    className="mt-2 w-full rounded-lg bg-gradient-primary py-1.5 text-[11px] font-semibold text-primary-foreground">
                    Mark as {nextStatus}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top meals */}
        <Card title="Top-performing meals" subtitle="By units sold">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMeals} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" stroke="oklch(0.5 0.02 50)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="oklch(0.5 0.02 50)" fontSize={10} tickLine={false} axisLine={false} width={110}
                  tickFormatter={(v) => (v.length > 14 ? v.slice(0, 14) + "…" : v)} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.008 80)", fontSize: 12 }} />
                <Bar dataKey="count" fill="oklch(0.68 0.19 35)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Busy hours + status distribution */}
        <div className="grid grid-cols-1 gap-3">
          <Card title="Busiest hours" subtitle="When orders peak">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={busyHours}>
                  <XAxis dataKey="hour" stroke="oklch(0.5 0.02 50)" fontSize={9} tickLine={false} axisLine={false} interval={1} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.008 80)", fontSize: 12 }} />
                  <Bar dataKey="orders" fill="oklch(0.78 0.17 50)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Order status distribution">
            <div className="flex items-center gap-4">
              <div className="h-32 w-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDist} dataKey="value" innerRadius={32} outerRadius={56} paddingAngle={2}>
                      {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 space-y-1.5 text-xs">
                {statusDist.map((s, i) => (
                  <li key={s.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 capitalize"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />{s.name}</span>
                    <span className="font-semibold">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>

        {/* Menu management */}
        <Card title="Menu" subtitle={`${meals.length} items across ${restaurants.length} restaurants`}>
          <div className="space-y-2">
            {meals.slice(0, 6).map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl bg-muted/60 p-2.5">
                <img src={m.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="text-xs font-semibold">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{m.prepTime}m</span>
                    <span>· ⭐ {m.rating}</span>
                  </p>
                </div>
                <span className="text-xs font-bold text-primary">{naira(m.price)}</span>
              </div>
            ))}
          </div>
          <Link to="/" className="mt-2 block text-center text-xs font-semibold text-primary">View menu →</Link>
        </Card>

        <div className="h-4" />
      </main>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent }: { icon: typeof BarChart3; label: string; value: string; accent?: string }) {
  return (
    <div className={`rounded-2xl p-3.5 shadow-soft ${accent ?? "bg-card"} ${accent ? "text-primary-foreground" : ""}`}>
      <Icon className={`h-4 w-4 ${accent ? "opacity-90" : "text-muted-foreground"}`} />
      <p className={`mt-2 text-[10px] uppercase tracking-wider ${accent ? "opacity-85" : "text-muted-foreground"}`}>{label}</p>
      <p className="text-base font-bold leading-tight">{value}</p>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="mb-3">
        <h3 className="text-sm font-bold">{title}</h3>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
