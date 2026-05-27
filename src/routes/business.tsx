import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChefHat, LogOut, Store, ShoppingBag, UtensilsCrossed, Tag, BarChart3,
  Plus, Trash2, Power, TrendingUp, Clock, Pencil, Check, X,
} from "lucide-react";
import { FILES, appendRow, deleteRow, readTable, updateRow } from "@/lib/csv-store";
import type { Discount, Meal, Order, Restaurant } from "@/lib/seed";
import { useAuth } from "@/lib/auth";
import { naira } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/business")({ component: BusinessDashboard });

type Tab = "overview" | "orders" | "menu" | "discounts" | "profile";

function BusinessDashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((x) => x + 1);

  useEffect(() => {
    if (!user) nav({ to: "/login" });
    else if (user.role !== "restaurant" && user.role !== "admin") nav({ to: "/discover" });
  }, [user, nav]);

  const restaurant = useMemo(() => {
    const all = readTable<Restaurant>(FILES.restaurants);
    if (!user) return undefined;
    return all.find((r) => r.ownerId === user.id) ?? all[0];
  }, [user, tick]);

  const orders = useMemo(
    () => readTable<Order>(FILES.orders).filter((o) => o.restaurantId === restaurant?.id),
    [restaurant, tick],
  );
  const meals = useMemo(
    () => readTable<Meal>(FILES.meals).filter((m) => m.restaurantId === restaurant?.id),
    [restaurant, tick],
  );
  const discounts = useMemo(
    () => readTable<Discount>(FILES.discounts).filter((d) => d.restaurantId === restaurant?.id),
    [restaurant, tick],
  );

  if (!user || !restaurant) return null;

  const tabs: { id: Tab; label: string; icon: typeof Store }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "menu", label: "Menu", icon: UtensilsCrossed },
    { id: "discounts", label: "Discounts", icon: Tag },
    { id: "profile", label: "Profile", icon: Store },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">{restaurant.name}</p>
              <p className="text-[11px] text-muted-foreground">
                Business dashboard ·{" "}
                <span className={restaurant.isOpen === "1" ? "text-success font-semibold" : "text-destructive font-semibold"}>
                  {restaurant.isOpen === "1" ? "Open now" : "Closed"}
                </span>
              </p>
            </div>
          </div>
          <button onClick={() => { logout(); nav({ to: "/" }); }}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted transition">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>

        <div className="no-scrollbar mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                tab === t.id ? "bg-gradient-primary text-primary-foreground shadow-soft" : "bg-muted text-muted-foreground hover:bg-accent"
              }`}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        {tab === "overview" && <Overview restaurant={restaurant} orders={orders} meals={meals} discounts={discounts} />}
        {tab === "orders" && <OrdersTab orders={orders} refresh={refresh} />}
        {tab === "menu" && <MenuTab restaurantId={restaurant.id} meals={meals} refresh={refresh} />}
        {tab === "discounts" && <DiscountsTab restaurantId={restaurant.id} discounts={discounts} refresh={refresh} />}
        {tab === "profile" && <ProfileTab restaurant={restaurant} refresh={refresh} />}
      </main>
    </div>
  );
}

/* ---------------- OVERVIEW ---------------- */
function Overview({ restaurant, orders, meals, discounts }: { restaurant: Restaurant; orders: Order[]; meals: Meal[]; discounts: Discount[] }) {
  const completed = orders.filter((o) => o.status === "completed");
  const revenue = completed.reduce((s, o) => s + Number(o.total), 0);
  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const active = orders.filter((o) => ["received", "preparing", "ready"].includes(o.status));
  const availMeals = meals.filter((m) => m.available === "1").length;
  const activeDisc = discounts.filter((d) => d.active === "1").length;

  // 7-day mini sparkline
  const trend = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const rev = orders.filter((o) => new Date(o.createdAt).toDateString() === key).reduce((s, o) => s + Number(o.total), 0);
    return { day: d.toLocaleDateString("en", { weekday: "short" }), rev };
  });
  const max = Math.max(1, ...trend.map((t) => t.rev));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={TrendingUp} label="Total revenue" value={naira(revenue)} accent />
        <Kpi icon={ShoppingBag} label="Today" value={`${todayOrders.length} orders`} />
        <Kpi icon={Clock} label="Active queue" value={`${active.length}`} />
        <Kpi icon={UtensilsCrossed} label="Available dishes" value={`${availMeals} / ${meals.length}`} />
      </div>

      <Card title="Revenue · last 7 days" subtitle={`${restaurant.name}`}>
        <div className="flex h-40 items-end gap-2">
          {trend.map((t) => (
            <div key={t.day} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="relative flex w-full flex-1 items-end">
                <div className="w-full rounded-t-lg bg-gradient-primary transition-all duration-700 shadow-glow"
                  style={{ height: `${(t.rev / max) * 100}%`, minHeight: t.rev > 0 ? 8 : 2 }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{t.day}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card title="Active orders" subtitle={`${active.length} in queue`}>
          {active.length === 0 ? <p className="text-xs text-muted-foreground">All clear ✨</p> : (
            <ul className="space-y-2">
              {active.slice(0, 4).map((o) => (
                <li key={o.id} className="flex items-center justify-between rounded-xl bg-muted/60 p-2.5 text-xs">
                  <span className="font-bold">#{o.id.slice(-5)}</span>
                  <span className="capitalize text-muted-foreground">{o.status}</span>
                  <span className="font-bold text-primary">{naira(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Active discounts" subtitle={`${activeDisc} live`}>
          {activeDisc === 0 ? <p className="text-xs text-muted-foreground">No active promotions.</p> : (
            <ul className="space-y-2">
              {discounts.filter((d) => d.active === "1").slice(0, 4).map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-xl bg-muted/60 p-2.5 text-xs">
                  <span className="font-mono font-bold">{d.code}</span>
                  <span className="text-muted-foreground">{d.type === "percent" ? `${d.value}% off` : `${naira(d.value)} off`}</span>
                  <span className="text-muted-foreground">{d.uses} used</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------------- ORDERS ---------------- */
function OrdersTab({ orders, refresh }: { orders: Order[]; refresh: () => void }) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");
  const flow = ["received", "preparing", "ready", "completed"];

  const filtered = orders
    .filter((o) => filter === "all" ? true : filter === "active" ? ["received", "preparing", "ready"].includes(o.status) : o.status === "completed")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const advance = (id: string, next: string) => {
    updateRow(FILES.orders, (r) => r.id === id, { status: next });
    refresh();
    toast.success(`Order → ${next}`);
  };
  const cancel = (id: string) => {
    updateRow(FILES.orders, (r) => r.id === id, { status: "cancelled" });
    refresh();
    toast.info("Order cancelled");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["active", "completed", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition capitalize ${
              filter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <div className="text-3xl">📭</div>
          <p className="mt-2 text-sm font-semibold">No {filter} orders</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const items = JSON.parse(o.items) as { name: string; qty: number; price: number }[];
            const idx = flow.indexOf(o.status);
            const next = idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
            return (
              <div key={o.id} className="rounded-2xl bg-card p-4 shadow-soft animate-slide-up">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">Order #{o.id.slice(-5)}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                    o.status === "completed" ? "bg-muted text-muted-foreground" :
                    o.status === "ready" ? "bg-success/15 text-success" :
                    o.status === "preparing" ? "bg-warning/15 text-warning" :
                    o.status === "cancelled" ? "bg-destructive/15 text-destructive" :
                    "bg-primary/15 text-primary"
                  }`}>{o.status}</span>
                </div>
                <ul className="mt-3 space-y-1 text-xs">
                  {items.map((it, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{it.qty}× {it.name}</span>
                      <span className="text-muted-foreground">{naira(it.qty * it.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm font-bold">Total · {naira(o.total)}</span>
                  <div className="flex gap-2">
                    {o.status !== "completed" && o.status !== "cancelled" && (
                      <button onClick={() => cancel(o.id)}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive transition">
                        Cancel
                      </button>
                    )}
                    {next && (
                      <button onClick={() => advance(o.id, next)}
                        className="rounded-full bg-gradient-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-soft transition active:scale-95">
                        Mark as {next}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- MENU ---------------- */
function MenuTab({ restaurantId, meals, refresh }: { restaurantId: string; meals: Meal[]; refresh: () => void }) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const toggleAvail = (id: string, cur: string) => {
    updateRow(FILES.meals, (r) => r.id === id, { available: cur === "1" ? "0" : "1" });
    refresh();
    toast.success(cur === "1" ? "Dish hidden" : "Dish available");
  };
  const remove = (id: string) => {
    if (!confirm("Remove this dish?")) return;
    deleteRow(FILES.meals, (r) => r.id === id);
    refresh();
    toast.success("Dish removed");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{meals.length} dishes · {meals.filter((m) => m.available === "1").length} available</p>
        <button onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow transition active:scale-95">
          <Plus className="h-3.5 w-3.5" /> Add dish
        </button>
      </div>

      {adding && <MealForm restaurantId={restaurantId} onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); refresh(); }} />}

      <div className="grid gap-3 md:grid-cols-2">
        {meals.map((m) => editId === m.id ? (
          <MealForm key={m.id} restaurantId={restaurantId} meal={m} onCancel={() => setEditId(null)} onSaved={() => { setEditId(null); refresh(); }} />
        ) : (
          <div key={m.id} className="flex gap-3 rounded-2xl bg-card p-3 shadow-soft animate-slide-up">
            <img src={m.image} alt={m.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-bold">{m.name}</p>
                  <p className="line-clamp-1 text-[11px] text-muted-foreground">{m.description}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-primary">{naira(m.price)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{m.category}</span>
                <span>· {m.prepTime}m prep</span>
                <span>· Avail {m.availableFrom}:00–{m.availableTo}:00</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <button onClick={() => toggleAvail(m.id, m.available)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                    m.available === "1" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}>
                  <Power className="h-3 w-3" /> {m.available === "1" ? "Live" : "Hidden"}
                </button>
                <button onClick={() => setEditId(m.id)} className="grid h-6 w-6 place-items-center rounded-full bg-muted hover:bg-accent transition">
                  <Pencil className="h-3 w-3" />
                </button>
                <button onClick={() => remove(m.id)} className="grid h-6 w-6 place-items-center rounded-full bg-muted text-destructive hover:bg-destructive/10 transition">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MealForm({ restaurantId, meal, onCancel, onSaved }: { restaurantId: string; meal?: Meal; onCancel: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: meal?.name ?? "",
    description: meal?.description ?? "",
    price: meal?.price ?? "",
    image: meal?.image ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=70",
    category: meal?.category ?? "Rice",
    prepTime: meal?.prepTime ?? "15",
    availableFrom: meal?.availableFrom ?? "10",
    availableTo: meal?.availableTo ?? "22",
  });

  const save = () => {
    if (!form.name || !form.price) { toast.error("Name and price required"); return; }
    if (meal) {
      updateRow(FILES.meals, (r) => r.id === meal.id, form);
      toast.success("Dish updated");
    } else {
      appendRow(FILES.meals, {
        id: "m" + Date.now(),
        restaurantId,
        ...form,
        rating: "0", reviewCount: "0", popular: "0", available: "1",
      });
      toast.success("Dish added");
    }
    onSaved();
  };

  const F = (k: keyof typeof form, label: string, type = "text") => (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
    </label>
  );

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-card p-4 shadow-card md:col-span-2 animate-slide-up">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">{meal ? "Edit dish" : "New dish"}</p>
        <button onClick={onCancel} className="grid h-7 w-7 place-items-center rounded-full bg-muted"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {F("name", "Name")}
        {F("price", "Price (₦)", "number")}
        <label className="block md:col-span-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Description</span>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" rows={2} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Image URL</span>
          <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </label>
        {F("category", "Category")}
        {F("prepTime", "Prep time (min)", "number")}
        {F("availableFrom", "Available from (hour 0-23)", "number")}
        {F("availableTo", "Available to (hour 0-23)", "number")}
      </div>
      <button onClick={save}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-glow">
        <Check className="h-3.5 w-3.5" /> {meal ? "Save changes" : "Create dish"}
      </button>
    </div>
  );
}

/* ---------------- DISCOUNTS ---------------- */
function DiscountsTab({ restaurantId, discounts, refresh }: { restaurantId: string; discounts: Discount[]; refresh: () => void }) {
  const [adding, setAdding] = useState(false);

  const toggle = (id: string, cur: string) => {
    updateRow(FILES.discounts, (r) => r.id === id, { active: cur === "1" ? "0" : "1" });
    refresh();
  };
  const remove = (id: string) => {
    if (!confirm("Delete this discount?")) return;
    deleteRow(FILES.discounts, (r) => r.id === id);
    refresh();
    toast.success("Discount deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{discounts.length} codes · {discounts.filter((d) => d.active === "1").length} active</p>
        <button onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow transition active:scale-95">
          <Plus className="h-3.5 w-3.5" /> New code
        </button>
      </div>

      {adding && <DiscountForm restaurantId={restaurantId} onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); refresh(); }} />}

      <div className="grid gap-3 md:grid-cols-2">
        {discounts.map((d) => (
          <div key={d.id} className="rounded-2xl bg-card p-4 shadow-soft animate-slide-up">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-lg font-extrabold tracking-tight text-gradient">{d.code}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {d.type === "percent" ? `${d.value}% off` : `${naira(d.value)} off`}
                  {Number(d.minOrder) > 0 && ` · min ${naira(d.minOrder)}`}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                d.active === "1" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
              }`}>{d.active === "1" ? "Active" : "Paused"}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Used {d.uses}×</span>
              <span>Expires {d.expiresAt}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => toggle(d.id, d.active)}
                className="flex-1 rounded-full border border-border bg-card py-1.5 text-xs font-semibold hover:bg-muted transition">
                {d.active === "1" ? "Pause" : "Activate"}
              </button>
              <button onClick={() => remove(d.id)}
                className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-destructive hover:bg-destructive/10 transition">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {discounts.length === 0 && !adding && (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center md:col-span-2">
            <div className="text-3xl">🏷️</div>
            <p className="mt-2 text-sm font-semibold">No discount codes yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Create your first code to drive more orders.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DiscountForm({ restaurantId, onCancel, onSaved }: { restaurantId: string; onCancel: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    code: "", type: "percent", value: "10", minOrder: "0",
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });
  const save = () => {
    if (!form.code) { toast.error("Code required"); return; }
    appendRow(FILES.discounts, {
      id: "d" + Date.now(),
      restaurantId,
      code: form.code.toUpperCase(),
      type: form.type,
      value: form.value,
      active: "1",
      expiresAt: form.expiresAt,
      minOrder: form.minOrder,
      uses: "0",
    });
    toast.success("Discount created");
    onSaved();
  };

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-card p-4 shadow-card md:col-span-2 animate-slide-up">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">New discount</p>
        <button onClick={onCancel} className="grid h-7 w-7 place-items-center rounded-full bg-muted"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Code</span>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="LAUNCH20"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono uppercase outline-none focus:border-primary" />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</span>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="percent">% off</option>
            <option value="fixed">Fixed ₦ off</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Value</span>
          <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Min order (₦)</span>
          <input type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Expires</span>
          <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </label>
      </div>
      <button onClick={save}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-glow">
        <Check className="h-3.5 w-3.5" /> Create discount
      </button>
    </div>
  );
}

/* ---------------- PROFILE ---------------- */
function ProfileTab({ restaurant, refresh }: { restaurant: Restaurant; refresh: () => void }) {
  const [form, setForm] = useState(restaurant);

  const save = () => {
    updateRow(FILES.restaurants, (r) => r.id === restaurant.id, form);
    refresh();
    toast.success("Profile updated");
  };
  const toggleOpen = () => {
    const next = form.isOpen === "1" ? "0" : "1";
    setForm({ ...form, isOpen: next });
    updateRow(FILES.restaurants, (r) => r.id === restaurant.id, { isOpen: next });
    refresh();
    toast.success(next === "1" ? "Restaurant is now open" : "Restaurant set to closed");
  };

  const F = (k: keyof Restaurant, label: string, type = "text") => (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={form[k] as string} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
        <div className="relative h-44 bg-muted">
          <img src={form.image} alt={form.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div className="text-white">
              <p className="text-lg font-bold drop-shadow">{form.name}</p>
              <p className="text-xs opacity-90">{form.cuisine}</p>
            </div>
            <button onClick={toggleOpen}
              className={`rounded-full px-4 py-1.5 text-xs font-bold shadow-glow transition ${
                form.isOpen === "1" ? "bg-success text-white" : "bg-destructive text-white"
              }`}>
              {form.isOpen === "1" ? "OPEN" : "CLOSED"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <p className="text-sm font-bold">Restaurant details</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {F("name", "Name")}
          {F("cuisine", "Cuisine")}
          {F("image", "Cover image URL")}
          {F("tags", "Tags (pipe-separated)")}
          {F("prepTime", "Avg prep time (min)", "number")}
          {F("distance", "Distance from center (km)", "number")}
          {F("phone", "Phone")}
          {F("address", "Address")}
          <label className="block md:col-span-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Description</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" rows={3} />
          </label>
        </div>
        <button onClick={save}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-glow">
          <Check className="h-3.5 w-3.5" /> Save profile
        </button>
      </div>
    </div>
  );
}

/* ---------------- shared ---------------- */
function Kpi({ icon: Icon, label, value, accent }: { icon: typeof TrendingUp; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-3.5 shadow-soft ${accent ? "bg-gradient-primary text-primary-foreground" : "bg-card"}`}>
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
