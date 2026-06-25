import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Filter,
  Headphones,
  Lock,
  LogOut,
  MapPin,
  Mail,
  MessageSquare,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  TrendingUp,
  Utensils,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { backend } from "@/lib/backend";
import { useAuth } from "@/lib/auth";
import { naira } from "@/lib/format";
import type { Feedback, Meal, Order, PlatformStats, Restaurant, Review, User } from "@/lib/seed";
import { readAuditEvents, type AuditEvent } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export const Route = createFileRoute("/admin")({ component: AdminDashboard });

type AdminTab = "overview" | "feedback" | "landing" | "activity" | "records" | "admins" | "help";
type SearchFilter = "all" | "stores" | "users" | "orders";
type OrderItem = { mealId?: string; name: string; qty: number; price?: number };
type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: Date;
  type: "order" | "account" | "review" | "store";
};

const statusColors = [
  "oklch(0.78 0.15 75)",
  "oklch(0.68 0.19 35)",
  "oklch(0.65 0.16 150)",
  "oklch(0.5 0.02 50)",
];

function AdminAccess({ login }: { login: (email: string, password: string) => Promise<User> }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@bitepass.test");
  const [password, setPassword] = useState("1234");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const admin = await login(email, password);
      if (admin.role !== "admin") {
        notify("error", "This account is not an admin account", { id: "admin-login-role-error" });
        return;
      }
      notify("success", "Admin access granted", { id: "admin-login-success" });
      nav({ to: "/admin", replace: true });
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Admin login failed", {
        id: "admin-login-error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-hero px-5 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-border/80 bg-background/85 p-5 shadow-card backdrop-blur md:p-7">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-black">Admin access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use an admin account to open operations.
          </p>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-3">
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 focus-within:border-primary">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              required
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 focus-within:border-primary">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-primary py-3.5 text-sm font-black text-primary-foreground shadow-glow transition active:scale-95 disabled:opacity-60"
          >
            {loading ? "Opening admin..." : "Open admin"}
          </button>
        </form>

        <div className="mt-5 rounded-2xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
          Local dev admin: <span className="font-black text-foreground">admin@bitepass.test</span> /{" "}
          <span className="font-black text-foreground">1234</span>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { authReady, login, user, logout } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [statsForm, setStatsForm] = useState({ foodies: "", kitchens: "", avgMinutesSaved: "" });
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [selectedStore, setSelectedStore] = useState<Restaurant | null>(null);

  useEffect(() => {
    if (user && user.role !== "admin") nav({ to: "/" });
  }, [user, nav]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    let cancelled = false;

    async function loadAdminData() {
      const [
        nextOrders,
        nextMeals,
        nextRestaurants,
        nextUsers,
        nextReviews,
        nextFeedback,
        nextStats,
      ] = await Promise.all([
        backend.orders(),
        backend.meals(),
        backend.restaurants(),
        backend.users(),
        backend.reviews(),
        backend.feedback(),
        backend.platformStats(),
      ]);
      if (cancelled) return;
      setOrders(nextOrders);
      setMeals(nextMeals);
      setRestaurants(nextRestaurants);
      setUsers(nextUsers);
      setReviews(nextReviews);
      setFeedback(nextFeedback);
      const latestStats =
        nextStats[0] ?? derivePlatformStats(nextUsers, nextRestaurants, nextOrders);
      setStatsForm({
        foodies: latestStats.foodies,
        kitchens: latestStats.kitchens,
        avgMinutesSaved: latestStats.avgMinutesSaved,
      });
      setAuditEvents(readAuditEvents());
    }

    void loadAdminData();
    const timer = window.setInterval(() => setTick((value) => value + 1), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [tick, user]);

  const metrics = useMemo(
    () => buildMetrics({ orders, users, restaurants, reviews, auditEvents }),
    [orders, users, restaurants, reviews, auditEvents],
  );
  const activity = useMemo(
    () => buildActivity({ orders, users, restaurants, reviews, auditEvents }),
    [orders, users, restaurants, reviews, auditEvents],
  );
  const helpItems = useMemo(
    () => buildHelpItems({ orders, users, restaurants, reviews, feedback }),
    [orders, users, restaurants, reviews, feedback],
  );
  const records = useMemo(
    () => buildSearchRecords({ orders, users, restaurants, auditEvents, query, filter }),
    [orders, users, restaurants, auditEvents, query, filter],
  );

  if (!authReady) return null;
  if (!user) return <AdminAccess login={login} />;
  if (user.role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-5 text-center">
        <div className="max-w-sm rounded-2xl bg-card p-6 shadow-soft">
          <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-base font-black">Admin access only</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign out and use an admin account to open this page.
          </p>
          <button
            type="button"
            onClick={() => {
              logout();
              nav({ to: "/admin", replace: true });
            }}
            className="mt-5 rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-glow"
          >
            Switch account
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: LucideIcon }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "landing", label: "Landing", icon: TrendingUp },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "records", label: "Records", icon: Search },
    { id: "admins", label: "Admins", icon: ShieldCheck },
    { id: "help", label: "Help center", icon: Headphones },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black leading-tight">Admin operations</p>
              <p className="text-[11px] text-muted-foreground">
                Traffic, accounts, stores, orders, and support
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              nav({ to: "/" });
            }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-black transition ${
                tab === item.id
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <Kpi
            icon={CircleDollarSign}
            label="Completed value"
            value={naira(metrics.completedRevenue)}
            accent
          />
          <Kpi icon={ShoppingBag} label="Transactions" value={`${metrics.completedOrders}`} />
          <Kpi icon={Store} label="Stores" value={`${restaurants.length}`} />
          <Kpi icon={Users} label="Users" value={`${users.length}`} />
          <Kpi icon={Activity} label="Traffic" value={`${metrics.pageViews}`} />
          <Kpi
            icon={MessageSquare}
            label="Feedback"
            value={`${feedback.length + reviews.length}`}
          />
        </section>

        {tab === "overview" && (
          <>
            <section className="grid gap-3 md:grid-cols-4">
              <ActionCard
                icon={Users}
                title="Customers"
                value={`${users.filter((entry) => entry.role === "customer").length}`}
              />
              <ActionCard icon={Store} title="Restaurants" value={`${restaurants.length}`} />
              <ActionCard icon={Utensils} title="Menu items" value={`${meals.length}`} />
              <ActionCard
                icon={MessageSquare}
                title="Open feedback"
                value={`${feedback.filter((item) => item.status !== "closed").length}`}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
              <Panel
                title="Growth dashboard"
                subtitle="Completed transactions, account growth, and traffic events"
              >
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={metrics.growth}>
                      <CartesianGrid
                        vertical={false}
                        stroke="oklch(0.9 0.01 80)"
                        strokeDasharray="4 4"
                      />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        stroke="oklch(0.5 0.02 50)"
                      />
                      <YAxis
                        yAxisId="left"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        stroke="oklch(0.5 0.02 50)"
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        stroke="oklch(0.5 0.02 50)"
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number, name: string) => [
                          name === "revenue" ? naira(value) : value,
                          labelMetric(name),
                        ]}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="revenue"
                        fill="oklch(0.68 0.19 35)"
                        radius={[8, 8, 2, 2]}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="transactions"
                        stroke="oklch(0.58 0.14 150)"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 0 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="traffic"
                        stroke="oklch(0.62 0.18 260)"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Traffic mix" subtitle="Captured page views and account actions">
                {metrics.trafficMix.some((item) => item.value > 0) ? (
                  <div className="flex items-center gap-4">
                    <div className="h-44 w-44 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={metrics.trafficMix}
                            dataKey="value"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={2}
                          >
                            {metrics.trafficMix.map((_, index) => (
                              <Cell key={index} fill={statusColors[index % statusColors.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      {metrics.trafficMix.map((item, index) => (
                        <MetricRow
                          key={item.name}
                          label={item.name}
                          value={`${item.value}`}
                          color={statusColors[index % statusColors.length]}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No traffic captured yet"
                    detail="Open a few pages or sign in again to populate this chart."
                  />
                )}
              </Panel>
            </section>

            <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <Panel title="Stores" subtitle="Click any store to view details">
                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {restaurants.map((restaurant) => (
                    <button
                      key={restaurant.id}
                      type="button"
                      onClick={() => setSelectedStore(restaurant)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-muted/55 p-3 text-left transition hover:bg-muted"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-card">
                        {restaurant.image ? (
                          <img
                            src={restaurant.image}
                            alt={restaurant.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{restaurant.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {restaurant.address}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black ${restaurant.isOpen === "1" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}
                      >
                        {restaurant.isOpen === "1" ? "Open" : "Closed"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel
                title="Recent activity"
                subtitle="Logins, accounts, orders, reviews, and store actions"
              >
                <ActivityFeed items={activity.slice(0, 14)} />
              </Panel>
            </section>
          </>
        )}

        {tab === "feedback" && (
          <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
            <Panel title="Feedback inbox" subtitle={`${feedback.length} customer messages`}>
              <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
                {feedback.length === 0 && (
                  <EmptyState
                    title="No feedback yet"
                    detail="Customer feedback hub messages will appear here."
                  />
                )}
                {feedback
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">{item.userName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.email} - {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${item.status === "closed" ? "bg-success/10 text-success" : "bg-warning/15 text-warning"}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] font-black uppercase tracking-[0.14em] text-primary">
                        {item.category}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.message}</p>
                      <div className="mt-3 flex gap-2">
                        {(["open", "reviewing", "closed"] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              void backend
                                .updateFeedback(item.id, { status })
                                .then(() => setTick((value) => value + 1));
                              notify("success", `Feedback marked ${status}`, {
                                id: `feedback-status:${item.id}:${status}`,
                              });
                            }}
                            className={`rounded-xl px-3 py-2 text-[11px] font-black capitalize transition ${
                              item.status === status
                                ? "bg-foreground text-background"
                                : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </Panel>
            <Panel title="Reviews" subtitle={`${reviews.length} restaurant and meal reviews`}>
              <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
                {reviews.length === 0 && (
                  <EmptyState
                    title="No reviews yet"
                    detail="Reviews will appear after customers rate orders or restaurants."
                  />
                )}
                {reviews.slice(0, 18).map((review) => (
                  <div key={review.id} className="rounded-2xl bg-muted/50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-black">{review.userName}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-xs font-black text-success">
                        <Star className="h-3 w-3 fill-current" />
                        {review.rating}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {tab === "landing" && (
          <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <Panel
              title="Landing stats"
              subtitle="These numbers publish directly to the public landing page"
            >
              <div className="grid gap-3">
                <AdminStatField
                  label="Foodies"
                  value={statsForm.foodies}
                  onChange={(value) => setStatsForm((current) => ({ ...current, foodies: value }))}
                />
                <AdminStatField
                  label="Kitchens"
                  value={statsForm.kitchens}
                  onChange={(value) => setStatsForm((current) => ({ ...current, kitchens: value }))}
                />
                <AdminStatField
                  label="Average minutes saved"
                  value={statsForm.avgMinutesSaved}
                  onChange={(value) =>
                    setStatsForm((current) => ({ ...current, avgMinutesSaved: value }))
                  }
                />
                <button
                  type="button"
                  onClick={() => {
                    void backend
                      .updatePlatformStats({
                        id: "public",
                        ...statsForm,
                        updatedAt: new Date().toISOString(),
                      })
                      .then(() => {
                        setTick((value) => value + 1);
                        notify("success", "Landing stats updated", { id: "landing-stats-updated" });
                      });
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-glow"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Publish stats
                </button>
              </div>
            </Panel>
            <Panel title="Live platform snapshot" subtitle="Real data currently in the platform">
              <div className="grid gap-3 md:grid-cols-2">
                <ActionCard icon={Users} title="Total users" value={`${users.length}`} />
                <ActionCard
                  icon={Store}
                  title="Total restaurants"
                  value={`${restaurants.length}`}
                />
                <ActionCard icon={ShoppingBag} title="Orders" value={`${orders.length}`} />
                <ActionCard
                  icon={MessageSquare}
                  title="Feedback + reviews"
                  value={`${feedback.length + reviews.length}`}
                />
              </div>
            </Panel>
          </section>
        )}

        {tab === "activity" && (
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Panel title="Review activity" subtitle="Newest customer feedback">
              <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
                {reviews.length === 0 && (
                  <EmptyState
                    title="No reviews yet"
                    detail="Reviews will appear here when customers leave feedback."
                  />
                )}
                {reviews.slice(0, 10).map((review) => (
                  <div key={review.id} className="rounded-2xl border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{review.userName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDateTime(review.createdAt)}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-xs font-black text-success">
                        <Star className="h-3 w-3 fill-current" />
                        {review.rating}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Account actions" subtitle="Created accounts and platform actions">
              <ActivityFeed items={activity} />
            </Panel>
          </section>
        )}

        {tab === "admins" && (
          <section className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
            <Panel title="Admin profile" subtitle="Current signed-in operator">
              <div className="rounded-2xl bg-muted/55 p-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-xl font-black text-primary-foreground shadow-glow">
                  {user.avatar || user.name.charAt(0)}
                </div>
                <p className="mt-4 text-lg font-black">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <DetailPill label="Role" value={user.role} />
                  <DetailPill label="Session" value="Active" />
                </div>
              </div>
            </Panel>

            <Panel title="Delegate admins" subtitle="Promote trusted users or remove admin access">
              <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
                {users.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 rounded-2xl bg-muted/55 p-3"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card text-sm font-black">
                      {entry.avatar || entry.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">{entry.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{entry.email}</p>
                    </div>
                    <span className="rounded-full bg-card px-2 py-1 text-[10px] font-black capitalize text-muted-foreground">
                      {entry.role}
                    </span>
                    {entry.id !== user.id && (
                      <button
                        type="button"
                        onClick={() => {
                          void backend
                            .updateUser(entry.id, {
                              role: entry.role === "admin" ? "customer" : "admin",
                            })
                            .then(() => setTick((value) => value + 1));
                          notify(
                            "success",
                            entry.role === "admin"
                              ? "Admin access removed"
                              : "Admin access granted",
                          );
                        }}
                        className="rounded-xl bg-foreground px-3 py-2 text-[11px] font-black text-background"
                      >
                        {entry.role === "admin" ? "Remove" : "Make admin"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {tab === "records" && (
          <section className="space-y-4">
            <div className="grid gap-3 rounded-2xl bg-card p-3 shadow-soft md:grid-cols-[1fr_auto]">
              <label className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search users, stores, orders, email, location..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </label>
              <div className="flex gap-2 overflow-x-auto">
                {(["all", "stores", "users", "orders"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-black capitalize ${
                      filter === item
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <Panel title="Search results" subtitle={`${records.length} matching records`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Detail</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-t border-border">
                        <td className="px-3 py-3 font-black capitalize">{record.type}</td>
                        <td className="px-3 py-3">{record.name}</td>
                        <td className="px-3 py-3 text-muted-foreground">{record.detail}</td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-black capitalize">
                            {record.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-black">{record.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>
        )}

        {tab === "help" && (
          <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Panel title="Account help center" subtitle={`${helpItems.length} items need review`}>
              <div className="space-y-2">
                {helpItems.length === 0 && (
                  <EmptyState
                    title="Help queue is clear"
                    detail="Account and store issues will show up here."
                  />
                )}
                {helpItems.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-muted/55 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {item.detail}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-black ${item.level === "urgent" ? "bg-destructive/10 text-destructive" : "bg-warning/20 text-warning"}`}
                      >
                        {item.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Admin actions" subtitle="Fast checks for operations">
              <div className="grid gap-3 sm:grid-cols-2">
                <ActionCard
                  icon={Building2}
                  title="Store verification"
                  value={`${restaurants.filter((store) => store.phone && store.address).length}/${restaurants.length}`}
                />
                <ActionCard
                  icon={Users}
                  title="Restaurant accounts"
                  value={`${users.filter((entry) => entry.role === "restaurant").length}`}
                />
                <ActionCard
                  icon={CheckCircle2}
                  title="Paid orders"
                  value={`${orders.filter((order) => order.paymentStatus === "paid").length}`}
                />
                <ActionCard
                  icon={MessageSquare}
                  title="Reviews received"
                  value={`${reviews.length}`}
                />
              </div>
            </Panel>
          </section>
        )}
      </main>

      {selectedStore && (
        <StoreDetail
          store={selectedStore}
          owner={users.find((entry) => entry.id === selectedStore.ownerId)}
          meals={meals.filter((meal) => meal.restaurantId === selectedStore.id)}
          orders={orders.filter((order) => order.restaurantId === selectedStore.id)}
          reviews={reviews.filter((review) => review.restaurantId === selectedStore.id)}
          onClose={() => setSelectedStore(null)}
        />
      )}
    </div>
  );
}

function buildMetrics({
  orders,
  users,
  restaurants,
  reviews,
  auditEvents,
}: {
  orders: Order[];
  users: User[];
  restaurants: Restaurant[];
  reviews: Review[];
  auditEvents: AuditEvent[];
}) {
  const completedOrders = orders.filter((order) => order.status === "completed").length;
  const completedRevenue = orders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + Number(order.total), 0);
  const pageViews = auditEvents.filter((event) => event.type === "page_view").length;
  const trafficMix = [
    { name: "Page views", value: Math.max(pageViews, 0) },
    { name: "Logins", value: auditEvents.filter((event) => event.type === "login").length },
    { name: "Signups", value: auditEvents.filter((event) => event.type === "signup").length },
    {
      name: "Order actions",
      value: auditEvents.filter(
        (event) => event.type === "order_created" || event.type === "order_updated",
      ).length,
    },
  ];

  const growth = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toDateString();
    const dayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === key);
    const dayReviews = reviews.filter(
      (review) => new Date(review.createdAt).toDateString() === key,
    );
    const dayAudit = auditEvents.filter(
      (event) => new Date(event.createdAt).toDateString() === key,
    );
    return {
      day: date.toLocaleDateString("en", { weekday: "short" }),
      revenue: dayOrders
        .filter((order) => order.status === "completed")
        .reduce((sum, order) => sum + Number(order.total), 0),
      transactions: dayOrders.length,
      traffic: dayAudit.filter((event) => event.type === "page_view").length + dayReviews.length,
    };
  });

  return { completedOrders, completedRevenue, pageViews, trafficMix, growth };
}

function derivePlatformStats(
  users: User[],
  restaurants: Restaurant[],
  orders: Order[],
): PlatformStats {
  return {
    id: "public",
    foodies: String(users.filter((entry) => entry.role === "customer").length),
    kitchens: String(restaurants.length),
    avgMinutesSaved: String(Math.max(0, Math.round(orders.length ? 6 : 0))),
    updatedAt: new Date().toISOString(),
  };
}

function buildActivity({
  orders,
  users,
  restaurants,
  reviews,
  auditEvents,
}: {
  orders: Order[];
  users: User[];
  restaurants: Restaurant[];
  reviews: Review[];
  auditEvents: AuditEvent[];
}) {
  const now = Date.now();
  const audited: ActivityItem[] = auditEvents.map((event) => ({
    id: event.id,
    title: event.title,
    detail: event.detail ?? event.targetId ?? "",
    time: new Date(event.createdAt),
    type: event.type.includes("order")
      ? "order"
      : event.type.includes("review")
        ? "review"
        : event.type.includes("restaurant")
          ? "store"
          : "account",
  }));

  const fallback: ActivityItem[] = [
    ...orders.map((order) => ({
      id: `order:${order.id}`,
      title: `Order #${order.id.slice(-5)} ${order.status}`,
      detail: `${naira(order.total)} transaction from ${restaurants.find((store) => store.id === order.restaurantId)?.name ?? "store"}`,
      time: new Date(order.createdAt),
      type: "order" as const,
    })),
    ...reviews.map((review) => ({
      id: `review:${review.id}`,
      title: `${review.userName} left a ${review.rating}-star review`,
      detail: review.comment,
      time: new Date(review.createdAt),
      type: "review" as const,
    })),
    ...users.map((entry, index) => ({
      id: `user:${entry.id}`,
      title: `${entry.name} account created`,
      detail: `${entry.role} account - ${entry.email}`,
      time: new Date(now - (index + 1) * 3600000),
      type: "account" as const,
    })),
    ...restaurants.map((store, index) => ({
      id: `store:${store.id}`,
      title: `${store.name} ${store.isOpen === "1" ? "is open" : "is closed"}`,
      detail: store.address,
      time: new Date(now - (index + 1) * 5400000),
      type: "store" as const,
    })),
  ];

  return [...audited, ...fallback].sort((a, b) => b.time.getTime() - a.time.getTime());
}

function buildHelpItems({
  orders,
  users,
  restaurants,
  reviews,
  feedback,
}: {
  orders: Order[];
  users: User[];
  restaurants: Restaurant[];
  reviews: Review[];
  feedback: Feedback[];
}) {
  const missingStoreInfo = restaurants
    .filter((store) => !store.phone || !store.address || !store.lat || !store.lng)
    .map((store) => ({
      id: `store-help:${store.id}`,
      title: `${store.name} profile needs completion`,
      detail: "Missing contact or location details can block customer pickup confidence.",
      level: "urgent" as const,
    }));
  const failedPayments = orders
    .filter((order) => order.paymentStatus && order.paymentStatus !== "paid")
    .map((order) => ({
      id: `payment-help:${order.id}`,
      title: `Payment review for order #${order.id.slice(-5)}`,
      detail: `${naira(order.total)} has payment status ${order.paymentStatus}.`,
      level: "urgent" as const,
    }));
  const lowReviews = reviews
    .filter((review) => Number(review.rating) <= 3)
    .map((review) => ({
      id: `review-help:${review.id}`,
      title: `Low rating from ${review.userName}`,
      detail: review.comment,
      level: "normal" as const,
    }));
  const inactiveUsers = users
    .filter(
      (entry) => entry.role === "customer" && !orders.some((order) => order.userId === entry.id),
    )
    .map((entry) => ({
      id: `user-help:${entry.id}`,
      title: `${entry.name} has no orders yet`,
      detail: "Customer account exists but has not completed a transaction.",
      level: "normal" as const,
    }));
  const openFeedback = feedback
    .filter((item) => item.status !== "closed")
    .map((item) => ({
      id: `feedback-help:${item.id}`,
      title: `${item.userName} needs help`,
      detail: item.message,
      level:
        item.category === "payment" || item.category === "order"
          ? ("urgent" as const)
          : ("normal" as const),
    }));
  return [
    ...openFeedback,
    ...missingStoreInfo,
    ...failedPayments,
    ...lowReviews,
    ...inactiveUsers,
  ].slice(0, 12);
}

function buildSearchRecords({
  orders,
  users,
  restaurants,
  auditEvents,
  query,
  filter,
}: {
  orders: Order[];
  users: User[];
  restaurants: Restaurant[];
  auditEvents: AuditEvent[];
  query: string;
  filter: SearchFilter;
}) {
  const normalized = query.trim().toLowerCase();
  const records = [
    ...restaurants.map((store) => ({
      id: `store:${store.id}`,
      type: "store",
      name: store.name,
      detail: store.address,
      status: store.isOpen === "1" ? "open" : "closed",
      value: store.rating,
      haystack: `${store.name} ${store.address} ${store.cuisine} ${store.phone}`,
    })),
    ...users.map((entry) => ({
      id: `user:${entry.id}`,
      type: "user",
      name: entry.name,
      detail: entry.email,
      status: entry.role,
      value: entry.address ?? "-",
      haystack: `${entry.name} ${entry.email} ${entry.role} ${entry.address ?? ""}`,
    })),
    ...orders.map((order) => ({
      id: `order:${order.id}`,
      type: "order",
      name: `Order #${order.id.slice(-5)}`,
      detail:
        restaurants.find((store) => store.id === order.restaurantId)?.name ?? order.restaurantId,
      status: order.status,
      value: naira(order.total),
      haystack: `${order.id} ${order.status} ${order.paymentStatus ?? ""} ${order.total}`,
    })),
    ...auditEvents.map((event) => ({
      id: event.id,
      type: "activity",
      name: event.title,
      detail: event.detail ?? event.targetId ?? "",
      status: event.type.replaceAll("_", " "),
      value: formatDateTime(event.createdAt),
      haystack: `${event.title} ${event.detail ?? ""} ${event.type} ${event.actorName ?? ""}`,
    })),
  ];

  return records.filter((record) => {
    const matchesFilter = filter === "all" || record.type === filter.slice(0, -1);
    const matchesQuery = !normalized || record.haystack.toLowerCase().includes(normalized);
    return matchesFilter && matchesQuery;
  });
}

function parseOrderItems(order: Order): OrderItem[] {
  try {
    return JSON.parse(order.items) as OrderItem[];
  } catch {
    return [];
  }
}

function labelMetric(name: string) {
  if (name === "revenue") return "Revenue";
  if (name === "transactions") return "Transactions";
  if (name === "traffic") return "Traffic";
  return name;
}

function formatDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString();
}

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-3.5 shadow-soft ${accent ? "bg-gradient-primary text-primary-foreground" : "bg-card"}`}
    >
      <Icon className={`h-4 w-4 ${accent ? "opacity-90" : "text-muted-foreground"}`} />
      <p
        className={`mt-3 text-[10px] font-black uppercase tracking-wider ${accent ? "opacity-85" : "text-muted-foreground"}`}
      >
        {label}
      </p>
      <p className="mt-1 truncate text-lg font-black leading-tight">{value}</p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="mb-4">
        <h2 className="text-base font-black">{title}</h2>
        {subtitle && <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
        <span className="truncate">{label}</span>
      </span>
      <span className="font-black">{value}</span>
    </div>
  );
}

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
      {items.length === 0 && (
        <EmptyState title="No activity yet" detail="Platform actions will show here." />
      )}
      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-[34px_1fr] gap-3 rounded-2xl bg-muted/55 p-3">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-card text-primary">
            {item.type === "order" && <ShoppingBag className="h-4 w-4" />}
            {item.type === "account" && <Users className="h-4 w-4" />}
            {item.type === "review" && <MessageSquare className="h-4 w-4" />}
            {item.type === "store" && <Store className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <p className="line-clamp-1 text-sm font-black">{item.title}</p>
              <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                {formatDateTime(item.time)}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {item.detail}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate font-black capitalize">{value}</p>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/55 p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-4 text-xs font-black text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function AdminStatField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ""))}
        inputMode="numeric"
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold outline-none focus:border-primary"
      />
    </label>
  );
}

function StoreDetail({
  store,
  owner,
  meals,
  orders,
  reviews,
  onClose,
}: {
  store: Restaurant;
  owner?: User;
  meals: Meal[];
  orders: Order[];
  reviews: Review[];
  onClose: () => void;
}) {
  const revenue = orders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + Number(order.total), 0);
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        className="h-full w-full max-w-xl overflow-y-auto bg-background shadow-card animate-slide-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
          <div>
            <p className="text-sm font-black">{store.name}</p>
            <p className="text-[11px] text-muted-foreground">Store details</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
            <div className="aspect-[5/2.4] bg-muted">
              {store.image ? (
                <img src={store.image} alt={store.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="p-4">
              <h3 className="text-xl font-black">{store.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{store.description}</p>
              <p className="mt-3 flex items-start gap-2 text-sm font-semibold">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {store.address}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Kpi icon={CircleDollarSign} label="Revenue" value={naira(revenue)} />
            <Kpi icon={ShoppingBag} label="Orders" value={`${orders.length}`} />
            <Kpi icon={Star} label="Rating" value={store.rating} />
            <Kpi icon={Clock} label="Prep time" value={`${store.prepTime}m`} />
          </div>

          <Panel title="Owner and account">
            <div className="space-y-2 text-sm">
              <DetailRow label="Owner" value={owner?.name ?? "Unknown"} />
              <DetailRow label="Email" value={owner?.email ?? "-"} />
              <DetailRow label="Phone" value={store.phone || "-"} />
              <DetailRow label="Status" value={store.isOpen === "1" ? "Open" : "Closed"} />
            </div>
          </Panel>

          <Panel title="Menu items" subtitle={`${meals.length} published dishes`}>
            <div className="space-y-2">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-muted/55 p-2.5 text-sm"
                >
                  <span className="min-w-0 truncate font-semibold">{meal.name}</span>
                  <span className="shrink-0 font-black text-primary">{naira(meal.price)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent orders">
            <div className="space-y-2">
              {orders.length === 0 && (
                <EmptyState title="No orders" detail="This store has no order records yet." />
              )}
              {orders.slice(0, 6).map((order) => (
                <div key={order.id} className="rounded-xl bg-muted/55 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-black">#{order.id.slice(-5)}</span>
                    <span className="font-black text-primary">{naira(order.total)}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {parseOrderItems(order)
                      .map((item) => `${item.qty}x ${item.name}`)
                      .join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </aside>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/55 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-black">{value}</span>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background/70 p-6 text-center">
      <p className="text-sm font-black">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid oklch(0.92 0.008 80)",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
  fontSize: 12,
};
