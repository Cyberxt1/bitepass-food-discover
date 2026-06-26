import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ChefHat,
  LogOut,
  Store,
  ShoppingBag,
  UtensilsCrossed,
  Tag,
  BarChart3,
  Plus,
  Trash2,
  Power,
  TrendingUp,
  Clock,
  Pencil,
  Check,
  X,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ImagePlus,
  User,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { backend } from "@/lib/backend";
import type { Discount, Meal, Order, Restaurant } from "@/lib/seed";
import { useAuth } from "@/lib/auth";
import { naira } from "@/lib/format";
import { parseMealOptions, stringifyMealOptions, type MealOption } from "@/lib/meal-options";
import { inferMealCategory, mealCategories } from "@/lib/meal-category";
import { normalizeOrderStatus, orderTimestampPatch } from "@/lib/platform";
import { pickupTimingLabel } from "@/lib/pickup-time";
import { compressImageFile } from "@/lib/image-upload";
import { getCurrentLocationDetails } from "@/lib/location";
import { LocationPreview } from "@/components/LocationPreview";
import { toast } from "sonner";

export const Route = createFileRoute("/business")({ component: BusinessDashboard });

type Tab = "analytics" | "orders" | "menu" | "profile";

function BusinessDashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("analytics");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tick, setTick] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const refresh = () => setTick((x) => x + 1);

  const signOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      nav({ to: "/", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    if (!user) nav({ to: "/login" });
    else if (user.role !== "restaurant" && user.role !== "admin") nav({ to: "/discover" });
  }, [user, nav]);

  const [restaurant, setRestaurant] = useState<Restaurant | undefined>();
  const [taskPanelOpen, setTaskPanelOpen] = useState(false);
  const [dashboardLoaded, setDashboardLoaded] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const seenOrderIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    const currentUser = user;
    if (!currentUser) return;
    const activeUser = currentUser;
    let cancelled = false;
    async function loadDashboard() {
      const allRestaurants = await backend.restaurants();
      const ownedRestaurant =
        activeUser.role === "admin"
          ? allRestaurants[0]
          : allRestaurants.find((r) => r.ownerId === activeUser.id);
      if (!ownedRestaurant || cancelled) {
        if (!cancelled) {
          setDashboardLoaded(true);
        }
        return;
      }
      const [allOrders, allMeals, allDiscounts] = await Promise.all([
        backend.orders(),
        backend.meals(),
        backend.discounts(),
      ]);
      if (cancelled) return;
      const restaurantOrders = allOrders.filter((o) => o.restaurantId === ownedRestaurant.id);
      const paidQueue = restaurantOrders.filter(
        (order) =>
          order.paymentStatus === "paid" &&
          ["received", "paid", "accepted", "preparing", "ready"].includes(order.status),
      );
      const nextOrderIds = new Set(paidQueue.map((order) => order.id));

      if (seenOrderIds.current) {
        const newOrders = paidQueue.filter((order) => !seenOrderIds.current?.has(order.id));
        if (newOrders.length > 0) {
          setTab("orders");
          setSidebarOpen(false);
          toast.success(`${newOrders.length} new paid order${newOrders.length === 1 ? "" : "s"}`, {
            id: `vendor-new-orders:${newOrders.map((order) => order.id).join(":")}`,
            duration: 7000,
          });
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate?.([180, 80, 180]);
          }
        }
      }
      seenOrderIds.current = nextOrderIds;

      setRestaurant(ownedRestaurant);
      setOrders(restaurantOrders);
      setMeals(allMeals.filter((m) => m.restaurantId === ownedRestaurant.id));
      setDiscounts(allDiscounts.filter((d) => d.restaurantId === ownedRestaurant.id));
      setDashboardLoaded(true);
    }
    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [user, tick]);

  useEffect(() => {
    if (!user || !restaurant?.id) return;
    const timer = window.setInterval(() => setTick((x) => x + 1), 2000);
    return () => window.clearInterval(timer);
  }, [user, restaurant?.id]);

  if (!user || !dashboardLoaded) return null;
  if (!restaurant)
    return (
      <RestaurantOnboarding
        userId={user.id}
        ownerName={user.name}
        refresh={refresh}
        onCreated={setRestaurant}
        logout={logout}
      />
    );

  const tabs: { id: Tab; label: string; icon: typeof Store }[] = [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "menu", label: "Menu", icon: UtensilsCrossed },
    { id: "profile", label: "Profile", icon: Store },
  ];
  const activeTab = tabs.find((t) => t.id === tab) ?? tabs[0];

  return (
    <div
      className={`min-h-screen bg-background transition-[padding] duration-300 ${sidebarOpen ? "lg:pl-72" : "lg:pl-20"}`}
    >
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card shadow-card transition-all duration-300 ${
          sidebarOpen ? "w-72 translate-x-0" : "w-20 -translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <ChefHat className="h-5 w-5" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight">{restaurant.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  Business dashboard ·{" "}
                  <span
                    className={
                      restaurant.isOpen === "1"
                        ? "text-success font-semibold"
                        : "text-destructive font-semibold"
                    }
                  >
                    {restaurant.isOpen === "1" ? "Open now" : "Closed"}
                  </span>
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label={sidebarOpen ? "Collapse navigation" : "Expand navigation"}
            onClick={() => setSidebarOpen((open) => !open)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                if (typeof window !== "undefined" && window.innerWidth < 1024)
                  setSidebarOpen(false);
              }}
              className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                tab === t.id
                  ? "bg-gradient-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              } ${sidebarOpen ? "justify-start" : "justify-center"}`}
            >
              <t.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>{t.label}</span>}
            </button>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={() => void signOut()}
            disabled={loggingOut}
            className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive ${
              sidebarOpen ? "justify-start" : "justify-center"
            }`}
          >
            {loggingOut ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <LogOut className="h-4 w-4 shrink-0" />}
            {sidebarOpen && <span>{loggingOut ? "Signing out..." : "Sign out"}</span>}
          </button>
        </div>
      </aside>

      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">{activeTab.label}</p>
              <p className="text-[11px] text-muted-foreground">
                Business dashboard ·{" "}
                <span
                  className={
                    restaurant.isOpen === "1"
                      ? "text-success font-semibold"
                      : "text-destructive font-semibold"
                  }
                >
                  {restaurant.isOpen === "1" ? "Open now" : "Closed"}
                </span>
              </p>
            </div>
          </div>
          <span
            className={
              restaurant.isOpen === "1"
                ? "rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-bold text-success"
                : "rounded-full bg-destructive/15 px-2.5 py-1 text-[11px] font-bold text-destructive"
            }
          >
            {restaurant.isOpen === "1" ? "Open" : "Closed"}
          </span>
        </div>

        <div className="hidden">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                tab === t.id
                  ? "bg-gradient-primary text-primary-foreground shadow-soft"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        {tab === "analytics" && (
          <Overview
            restaurant={restaurant}
            orders={orders}
            meals={meals}
            discounts={discounts}
            refresh={refresh}
          />
        )}
        {tab === "orders" && <OrdersTab orders={orders} refresh={refresh} />}
        {tab === "menu" && <MenuTab restaurantId={restaurant.id} meals={meals} refresh={refresh} />}
        {tab === "profile" && <ProfileTab restaurant={restaurant} refresh={refresh} />}
      </main>

      <StoreSetupTasks
        restaurant={restaurant}
        open={taskPanelOpen}
        onOpenChange={setTaskPanelOpen}
        onUpdated={(patch) => {
          setRestaurant((current) => (current ? { ...current, ...patch } : current));
          refresh();
        }}
      />
    </div>
  );
}

function RestaurantOnboarding({
  userId,
  ownerName,
  refresh,
  onCreated,
  logout,
}: {
  userId: string;
  ownerName: string;
  refresh: () => void;
  onCreated: (restaurant: Restaurant) => void;
  logout: () => Promise<void>;
}) {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({
    owner: ownerName,
    restaurant: "",
    intro: "",
    cuisine: "Nigerian",
    phone: "",
    address: "",
    lat: "",
    lng: "",
    image: "",
  });
  const [imageBusy, setImageBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const latNumber = Number(form.lat);
  const lngNumber = Number(form.lng);
  const hasValidCoords =
    Number.isFinite(latNumber) &&
    Number.isFinite(lngNumber) &&
    Math.abs(latNumber) <= 90 &&
    Math.abs(lngNumber) <= 180;
  const coords = hasValidCoords ? { lat: latNumber, lng: lngNumber } : null;
  const canContinue =
    step === 0
      ? form.owner.trim().length > 1 && form.restaurant.trim().length > 1
      : step === 1
        ? form.intro.trim().length > 0 && form.phone.trim().length > 5
        : form.address.trim().length > 3;

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const signOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      nav({ to: "/", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const location = await getCurrentLocationDetails();
      setForm((current) => ({
        ...current,
        address: location.address,
        lat: String(location.lat),
        lng: String(location.lng),
      }));
      toast.success("Restaurant location pinned");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Location could not be set");
    } finally {
      setLocating(false);
    }
  };

  const uploadRestaurantImage = async (file?: File) => {
    if (!file) return;
    setImageBusy(true);
    try {
      update("image", await compressImageFile(file));
      toast.success("Restaurant photo added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Photo could not be added");
    } finally {
      setImageBusy(false);
    }
  };

  const save = async () => {
    if (saving) return;
    if (!canContinue) return;
    setSaving(true);
    try {
      const restaurant: Restaurant = {
        id: "r" + Date.now(),
        ownerId: userId,
        name: form.restaurant.trim(),
        cuisine: form.cuisine.trim() || "Food",
        rating: "0",
        reviews: "0",
        prepTime: "15",
        distance: "0",
        image: form.image,
        tags: `${form.intro.trim()}|${form.cuisine.trim() || "Food"}|New`,
        isOpen: "1",
        description: form.intro.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        lat: hasValidCoords ? form.lat.trim() : "",
        lng: hasValidCoords ? form.lng.trim() : "",
        paymentSetupStatus: "not_started",
        verificationStatus: "not_started",
        moderationStatus: "active",
      };
      await backend.setRestaurant(restaurant);
      const savedRestaurant = (await backend.restaurants()).find((entry) => entry.id === restaurant.id);
      if (!savedRestaurant) {
        throw new Error("Restaurant was saved but could not be read back. Check database policies.");
      }
      toast.success("Restaurant profile created");
      onCreated(savedRestaurant);
      refresh();
      nav({ to: "/business", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Restaurant setup failed");
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { label: "Owner", title: "Who runs this kitchen?" },
    { label: "Details", title: "Keep the profile sharp" },
    { label: "Location", title: "Pin the pickup spot" },
  ];

  return (
    <div className="relative flex min-h-[100dvh] items-start justify-center bg-gradient-hero px-5 pb-8 pt-20 sm:items-center sm:py-16">
      <button
        type="button"
        onClick={() => void signOut()}
        disabled={loggingOut}
        className="absolute right-5 top-6 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-bold text-muted-foreground shadow-soft transition hover:text-destructive disabled:opacity-60"
      >
        {loggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
        {loggingOut ? "Signing out..." : "Sign out"}
      </button>

      <div className="w-full max-w-md">
        <div className="rounded-[2rem] border border-border/80 bg-background/85 p-5 shadow-card backdrop-blur md:p-7">
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
              <ChefHat className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="mt-4 text-2xl font-bold">Set up your restaurant</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              A few quick details so nearby shoppers can find you.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {steps.map((item, index) => (
              <div
                key={item.label}
                className={`rounded-2xl px-3 py-2 text-center text-[11px] font-bold ${
                  index === step
                    ? "bg-gradient-primary text-primary-foreground shadow-soft"
                    : "bg-card text-muted-foreground"
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>

          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {steps[step].title}
            </p>

            {step === 0 && (
              <div className="mt-3 space-y-3">
                <OnboardingField icon={User}>
                  <input
                    value={form.owner}
                    onChange={(event) => update("owner", event.target.value)}
                    placeholder="Owner name"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </OnboardingField>
                <OnboardingField icon={Store}>
                  <input
                    value={form.restaurant}
                    onChange={(event) => update("restaurant", event.target.value)}
                    placeholder="Restaurant name"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </OnboardingField>
              </div>
            )}

            {step === 1 && (
              <div className="mt-3 space-y-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Restaurant photo
                  </span>
                  <div className="mt-1 grid gap-3 sm:grid-cols-[128px_1fr] sm:items-center">
                    <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card">
                      {form.image ? (
                        <img
                          src={form.image}
                          alt={form.restaurant || "Restaurant preview"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-xs font-semibold text-muted-foreground">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold shadow-soft transition hover:bg-muted">
                        <ImagePlus className="h-3.5 w-3.5" />
                        {imageBusy ? "Processing..." : "Upload photo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={imageBusy}
                          onChange={(event) => void uploadRestaurantImage(event.target.files?.[0])}
                        />
                      </label>
                      {form.image && (
                        <button
                          type="button"
                          onClick={() => update("image", "")}
                          className="ml-2 rounded-full px-3 py-2 text-xs font-bold text-destructive transition hover:bg-destructive/10"
                        >
                          Remove
                        </button>
                      )}
                      <p className="text-[11px] leading-4 text-muted-foreground">
                        JPG/PNG only, max 1 MB.
                      </p>
                    </div>
                  </div>
                </div>
                <OnboardingField icon={Mail}>
                  <input
                    value={form.intro}
                    onChange={(event) => update("intro", event.target.value.slice(0, 80))}
                    placeholder="Short intro, e.g. Smoky jollof spot"
                    maxLength={80}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </OnboardingField>
                <OnboardingField icon={Store}>
                  <input
                    value={form.cuisine}
                    onChange={(event) => update("cuisine", event.target.value)}
                    placeholder="Cuisine"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </OnboardingField>
                <OnboardingField icon={Phone}>
                  <input
                    value={form.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    placeholder="Phone number"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </OnboardingField>
              </div>
            )}

            {step === 2 && (
              <div className="mt-3 space-y-3">
                <LocationPreview
                  coords={
                    Number.isFinite(coords?.lat) && Number.isFinite(coords?.lng) ? coords : null
                  }
                  address={form.address}
                  emptyText="Pin your restaurant location."
                />
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold shadow-soft transition hover:bg-muted disabled:opacity-60"
                >
                  {locating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  {locating ? "Getting location..." : "Use current location"}
                </button>
                <textarea
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                  placeholder="Restaurant address"
                  rows={2}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Manual coordinates
                  </p>
                  <div className="mt-1 grid gap-2 sm:grid-cols-2">
                    <input
                      value={form.lat}
                      onChange={(event) => update("lat", event.target.value)}
                      inputMode="decimal"
                      placeholder="Latitude"
                      className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                    <input
                      value={form.lng}
                      onChange={(event) => update("lng", event.target.value)}
                      inputMode="decimal"
                      placeholder="Longitude"
                      className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                    Optional. Add map coordinates when you have them; the address is enough to finish setup.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((value) => value - 1)}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-border bg-card shadow-soft transition hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              disabled={!canContinue || saving}
              onClick={() => {
                if (step < steps.length - 1) setStep((value) => value + 1);
                else void save();
              }}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-5 text-sm font-bold text-primary-foreground shadow-glow transition active:scale-95 disabled:opacity-60"
            >
              {saving ? "Creating..." : step === steps.length - 1 ? "Finish setup" : "Continue"}
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingField({
  icon: Icon,
  children,
}: {
  icon: typeof Store;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 focus-within:border-primary">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {children}
    </label>
  );
}

function StoreSetupTasks({
  restaurant,
  open,
  onOpenChange,
  onUpdated,
}: {
  restaurant: Restaurant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (patch: Partial<Restaurant>) => void;
}) {
  const verificationStatus = restaurant.verificationStatus ?? "not_started";
  const paymentStatus = restaurant.paymentSetupStatus ?? "not_started";
  const verified = verificationStatus === "verified";
  const paymentReady = paymentStatus === "ready";
  const [paymentName, setPaymentName] = useState(
    restaurant.paymentDisplayName || restaurant.name || "",
  );
  const [busy, setBusy] = useState<"verify" | "payment" | null>(null);

  useEffect(() => {
    setPaymentName(restaurant.paymentDisplayName || restaurant.name || "");
  }, [restaurant.id, restaurant.name, restaurant.paymentDisplayName]);

  const requestVerification = async () => {
    if (busy || verificationStatus === "pending_review" || verified) return;
    setBusy("verify");
    const patch = { verificationStatus: "pending_review" };
    onUpdated(patch);
    try {
      await backend.updateRestaurant(restaurant.id, patch);
      toast.success("Verification request sent to admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification request failed");
    } finally {
      setBusy(null);
    }
  };

  const requestPayment = async () => {
    if (busy || paymentStatus === "pending_review" || paymentReady) return;
    const name = paymentName.trim();
    if (name.length < 2) {
      toast.error("Enter the payment display name");
      return;
    }
    setBusy("payment");
    const patch = {
      paymentDisplayName: name,
      paymentSetupStatus: "pending_review",
    };
    onUpdated(patch);
    try {
      await backend.updateRestaurant(restaurant.id, patch);
      toast.success("Payment setup request sent to admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment request failed");
    } finally {
      setBusy(null);
    }
  };

  if (verified && paymentReady) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-success px-4 py-3 text-sm font-black text-success-foreground shadow-card"
      >
        <Check className="h-4 w-4" />
        Store ready
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-black text-background shadow-card"
      >
        <ShieldCheck className="h-4 w-4" />
        Complete setup
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-black/45 px-3 py-4 backdrop-blur-sm sm:place-items-center"
          onClick={() => onOpenChange(false)}
        >
          <section
            className="w-full max-w-lg rounded-2xl bg-background p-4 shadow-card animate-slide-up"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black">Complete store setup</p>
                <p className="mt-1 text-sm text-muted-foreground">{restaurant.name}</p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-black">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Verify store
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Ask admin to verify this restaurant. Verified stores show a green check to customers.
                    </p>
                  </div>
                  <TaskStatus status={verificationStatus} completeLabel="Verified" />
                </div>
                <button
                  type="button"
                  onClick={() => void requestVerification()}
                  disabled={busy === "verify" || verificationStatus === "pending_review" || verified}
                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-black text-background transition active:scale-95 disabled:opacity-55 sm:w-auto"
                >
                  {busy === "verify" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {verified
                    ? "Verified"
                    : verificationStatus === "pending_review"
                      ? "Verification pending"
                      : "Request verification"}
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-black">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Setup payment
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Enter the store name exactly how it should appear for payments, then send the request.
                    </p>
                  </div>
                  <TaskStatus status={paymentStatus} completeLabel="Ready" />
                </div>
                <input
                  value={paymentName}
                  onChange={(event) => setPaymentName(event.target.value)}
                  disabled={paymentReady || paymentStatus === "pending_review"}
                  placeholder="Payment display name"
                  className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold outline-none focus:border-primary disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => void requestPayment()}
                  disabled={busy === "payment" || paymentStatus === "pending_review" || paymentReady}
                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-black text-background transition active:scale-95 disabled:opacity-55 sm:w-auto"
                >
                  {busy === "payment" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {paymentReady
                    ? "Payment ready"
                    : paymentStatus === "pending_review"
                      ? "Payment request pending"
                      : "Request payment setup"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function TaskStatus({ status, completeLabel }: { status: string; completeLabel: string }) {
  const complete = status === "verified" || status === "ready";
  const pending = status === "pending_review";
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${
        complete
          ? "bg-success/15 text-success"
          : pending
            ? "bg-warning/15 text-warning"
            : "bg-muted text-muted-foreground"
      }`}
    >
      {complete ? completeLabel : pending ? "Pending" : "Open"}
    </span>
  );
}

/* ---------------- OVERVIEW ---------------- */
function Overview({
  restaurant,
  orders,
  meals,
  discounts,
  refresh,
}: {
  restaurant: Restaurant;
  orders: Order[];
  meals: Meal[];
  discounts: Discount[];
  refresh: () => void;
}) {
  const completed = orders.filter((o) => o.status === "completed");
  const revenue = completed.reduce((s, o) => s + Number(o.total), 0);
  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const active = orders.filter((o) => ["received", "preparing", "ready"].includes(o.status));
  const availMeals = meals.filter((m) => m.available === "1").length;
  const activeDisc = discounts.filter((d) => d.active === "1").length;
  const toggleOpen = () => {
    const next = restaurant.isOpen === "1" ? "0" : "1";
    void backend.updateRestaurant(restaurant.id, { isOpen: next });
    refresh();
    toast.success(next === "1" ? "Restaurant is now open" : "Restaurant set to closed");
  };

  // 7-day revenue trend
  const trend = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const dayOrders = completed.filter((o) => new Date(o.createdAt).toDateString() === key);
    const rev = dayOrders.reduce((s, o) => s + Number(o.total), 0);
    return {
      day: d.toLocaleDateString("en", { weekday: "short" }),
      fullDate: d.toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
      rev,
      orders: dayOrders.length,
    };
  });
  const weeklyRevenue = trend.reduce((sum, day) => sum + day.rev, 0);
  const totalTrendOrders = trend.reduce((sum, day) => sum + day.orders, 0);
  const averageRevenue = weeklyRevenue / trend.length;
  const bestDay = trend.reduce(
    (best, current) => (current.rev > best.rev ? current : best),
    trend[0],
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={TrendingUp} label="Total revenue" value={naira(revenue)} accent />
        <Kpi icon={ShoppingBag} label="Today" value={`${todayOrders.length} orders`} />
        <Kpi icon={Clock} label="Active queue" value={`${active.length}`} />
        <Kpi
          icon={UtensilsCrossed}
          label="Available dishes"
          value={`${availMeals} / ${meals.length}`}
        />
      </div>

      <Card title="Restaurant status" subtitle="Control whether customers see you as available">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className={`text-sm font-bold ${restaurant.isOpen === "1" ? "text-success" : "text-destructive"}`}
            >
              {restaurant.isOpen === "1" ? "Open now" : "Closed"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {restaurant.isOpen === "1"
                ? "Customers can discover and order from your restaurant."
                : "Your restaurant is marked closed for customers."}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleOpen}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white shadow-soft transition active:scale-95 ${
              restaurant.isOpen === "1" ? "bg-destructive" : "bg-success"
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            {restaurant.isOpen === "1" ? "Set closed" : "Open restaurant"}
          </button>
        </div>
      </Card>

      <Card title="Sales snapshot" subtitle="Last 7 days">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-muted/35 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              This week
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">{naira(weeklyRevenue)}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/35 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Orders
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">{totalTrendOrders}</p>
            <p className="text-[11px] text-muted-foreground">
              {naira(Math.round(averageRevenue))} avg/day
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/35 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Best day
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {bestDay.rev > 0 ? bestDay.day : "No sales yet"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {bestDay.rev > 0 ? naira(bestDay.rev) : "Complete orders to build a trend"}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[28px] border border-border/60 bg-background p-3">
          <div className="mb-3 flex flex-wrap gap-3 text-[11px] font-bold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Revenue
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-success" /> Orders
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trend} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="oklch(0.9 0.01 80)" strokeDasharray="4 4" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="oklch(0.5 0.02 50)"
                />
                <YAxis
                  yAxisId="revenue"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={42}
                  stroke="oklch(0.5 0.02 50)"
                  tickFormatter={(value: number) => compactNaira(value)}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={28}
                  stroke="oklch(0.5 0.02 50)"
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "oklch(0.94 0.02 70 / 0.75)" }}
                  contentStyle={{
                    borderRadius: 18,
                    border: "1px solid oklch(0.92 0.008 80)",
                    background: "rgba(255,255,255,0.96)",
                    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [
                    name === "rev" ? naira(value) : value,
                    name === "rev" ? "Revenue" : "Orders",
                  ]}
                  labelFormatter={(_, payload) => {
                    const item = payload?.[0]?.payload as
                      | { fullDate?: string; orders?: number }
                      | undefined;
                    if (!item) return "";
                    return `${item.fullDate} - ${item.orders ?? 0} order${item.orders === 1 ? "" : "s"}`;
                  }}
                />
                <Bar
                  yAxisId="revenue"
                  dataKey="rev"
                  fill="oklch(0.68 0.19 35)"
                  radius={[8, 8, 3, 3]}
                  barSize={28}
                />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  stroke="oklch(0.58 0.14 150)"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 0, fill: "oklch(0.58 0.14 150)" }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "oklch(0.58 0.14 150)" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card title="Active orders" subtitle={`${active.length} in queue`}>
          {active.length === 0 ? (
            <p className="text-xs text-muted-foreground">All clear ✨</p>
          ) : (
            <ul className="space-y-2">
              {active.slice(0, 4).map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between rounded-xl bg-muted/60 p-2.5 text-xs"
                >
                  <span className="font-bold">#{o.id.slice(-5)}</span>
                  <span className="capitalize text-muted-foreground">{o.status}</span>
                  <span className="font-bold text-primary">{naira(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Active discounts" subtitle={`${activeDisc} live`}>
          {activeDisc === 0 ? (
            <p className="text-xs text-muted-foreground">No active promotions.</p>
          ) : (
            <ul className="space-y-2">
              {discounts
                .filter((d) => d.active === "1")
                .slice(0, 4)
                .map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between rounded-xl bg-muted/60 p-2.5 text-xs"
                  >
                    <span className="font-mono font-bold">{d.code}</span>
                    <span className="text-muted-foreground">
                      {d.type === "percent" ? `${d.value}% off` : `${naira(d.value)} off`}
                    </span>
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
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const statusRank: Record<string, number> = {
    received: 0,
    paid: 0,
    accepted: 1,
    preparing: 2,
    ready: 3,
    picked_up: 4,
    completed: 5,
    cancelled: 6,
  };

  const vendorActionForOrder = (order: Order): { label: string; success: string; patch: Partial<Order> } | null => {
    const normalized = normalizeOrderStatus(order.status);
    const isPaid = order.paymentStatus === "paid";
    if (!isPaid && !["ready", "picked_up", "completed"].includes(normalized)) return null;
    if (normalized === "paid") {
      return {
        label: "Accept order",
        success: "Order accepted",
        patch: {
          status: "preparing",
          ...orderTimestampPatch("accepted"),
          ...orderTimestampPatch("preparing"),
        },
      };
    }
    if (normalized === "accepted" || normalized === "preparing") {
      return {
        label: "Ready for pickup",
        success: "Order marked ready",
        patch: { status: "ready", ...orderTimestampPatch("ready") },
      };
    }
    if (normalized === "ready" || normalized === "picked_up") {
      return {
        label: "Complete order",
        success: "Order completed",
        patch: {
          status: "completed",
          ...orderTimestampPatch("picked_up"),
          ...orderTimestampPatch("completed"),
        },
      };
    }
    return null;
  };

  const filtered = orders
    .filter((o) =>
      filter === "all"
        ? true
        : filter === "active"
          ? ["received", "paid", "accepted", "preparing", "ready", "picked_up"].includes(o.status)
          : o.status === "completed",
    )
    .sort((a, b) => {
      const rankDiff = (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9);
      if (filter === "active" && rankDiff !== 0) return rankDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const advance = async (id: string, action: NonNullable<ReturnType<typeof vendorActionForOrder>>) => {
    if (busyOrderId) return;
    setBusyOrderId(id);
    try {
      await backend.updateOrder(id, action.patch);
      refresh();
      toast.success(action.success);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update order");
    } finally {
      setBusyOrderId(null);
    }
  };
  const cancel = async (id: string) => {
    if (busyOrderId) return;
    setBusyOrderId(id);
    try {
      await backend.updateOrder(id, { status: "cancelled", ...orderTimestampPatch("cancelled") });
      refresh();
      toast.info("Order cancelled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel order");
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["active", "completed", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition capitalize ${
              filter === f
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {f}
          </button>
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
            const items = JSON.parse(o.items) as {
              name: string;
              qty: number;
              price: number;
              servingUnit?: string;
              options?: { name: string; price: number; qty?: number }[];
            }[];
            const normalizedStatus = normalizeOrderStatus(o.status);
            const vendorAction = vendorActionForOrder(o);
            const canCancel = ["accepted", "preparing"].includes(normalizedStatus);
            const isBusy = busyOrderId === o.id;
            const isNewPaid = o.paymentStatus === "paid" && ["received", "paid"].includes(o.status);
            return (
              <div
                key={o.id}
                className={`rounded-2xl border p-4 shadow-soft animate-slide-up ${
                  isNewPaid
                    ? "border-primary/45 bg-primary/8 ring-2 ring-primary/10"
                    : "border-transparent bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold">Order #{o.id.slice(-5)}</p>
                      {isNewPaid && (
                        <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-primary-foreground">
                          New paid order
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString()}
                    </p>
                    <p className="text-[11px] font-bold text-primary">
                      {pickupTimingLabel(o.pickupTime)}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {o.paymentStatus === "paid" && (
                      <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-bold text-success">
                        Paid
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                        normalizedStatus === "completed"
                          ? "bg-muted text-muted-foreground"
                          : normalizedStatus === "ready"
                            ? "bg-success/15 text-success"
                            : normalizedStatus === "preparing" || normalizedStatus === "accepted"
                              ? "bg-warning/15 text-warning"
                              : normalizedStatus === "cancelled"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-primary/15 text-primary"
                      }`}
                    >
                      {normalizedStatus.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-xs">
                  {items.map((it, i) => (
                    <li key={i} className="flex justify-between">
                      <span>
                        {it.qty} x {it.name}
                        {it.servingUnit && (
                          <span className="block text-[11px] text-muted-foreground">
                            Base: per {it.servingUnit}
                          </span>
                        )}
                        {it.options && it.options.length > 0 && (
                          <span className="block text-[11px] text-muted-foreground">
                            {it.options
                              .map(
                                (option) =>
                                  `${option.name}${option.qty && option.qty > 1 ? ` x${option.qty}` : ""}`,
                              )
                              .join(", ")}
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground">{naira(it.qty * it.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm font-bold">Total: {naira(o.total)}</span>
                  <div className="flex gap-2">
                    {canCancel && (
                      <button
                        onClick={() => cancel(o.id)}
                        disabled={Boolean(busyOrderId)}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cancel"}
                      </button>
                    )}
                    {vendorAction && (
                      <button
                        onClick={() => advance(o.id, vendorAction)}
                        disabled={Boolean(busyOrderId)}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-soft transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {vendorAction.label}
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
function MenuTab({
  restaurantId,
  meals,
  refresh,
}: {
  restaurantId: string;
  meals: Meal[];
  refresh: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const toggleAvail = (id: string, cur: string) => {
    backend.updateMeal(id, { available: cur === "1" ? "0" : "1" }).then(refresh);
    toast.success(cur === "1" ? "Dish hidden" : "Dish available");
  };
  const remove = (id: string) => {
    if (!confirm("Remove this dish?")) return;
    backend.deleteMeal(id).then(refresh);
    toast.success("Dish removed");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meals.length} dishes · {meals.filter((m) => m.available === "1").length} available
        </p>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow transition active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" /> Add dish
        </button>
      </div>

      {adding && (
        <MealForm
          restaurantId={restaurantId}
          onCancel={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            refresh();
          }}
        />
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {meals.map((m) =>
          editId === m.id ? (
            <MealForm
              key={m.id}
              restaurantId={restaurantId}
              meal={m}
              onCancel={() => setEditId(null)}
              onSaved={() => {
                setEditId(null);
                refresh();
              }}
            />
          ) : (
            <div key={m.id} className="rounded-2xl bg-card p-3 shadow-soft animate-slide-up">
              <div className="flex gap-3">
                {m.image && (
                  <img
                    src={m.image}
                    alt={m.name}
                    className="h-20 w-20 shrink-0 rounded-xl object-cover"
                  />
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-bold">{m.name}</p>
                      <p className="line-clamp-1 text-[11px] text-muted-foreground">
                        {m.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-primary">
                      {naira(m.price)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{m.category}</span>
                    <span>· {m.prepTime}m prep</span>
                    <span>
                      · Avail {m.availableFrom}:00–{m.availableTo}:00
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      onClick={() => toggleAvail(m.id, m.available)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                        m.available === "1"
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Power className="h-3 w-3" /> {m.available === "1" ? "Live" : "Hidden"}
                    </button>
                    <button
                      onClick={() => setEditId(m.id)}
                      className="grid h-6 w-6 place-items-center rounded-full bg-muted hover:bg-accent transition"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => remove(m.id)}
                      className="grid h-6 w-6 place-items-center rounded-full bg-muted text-destructive hover:bg-destructive/10 transition"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function MealForm({
  restaurantId,
  meal,
  onCancel,
  onSaved,
}: {
  restaurantId: string;
  meal?: Meal;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: meal?.name || "",
    description: meal?.description || "",
    price: meal?.price || "",
    servingUnit: meal?.servingUnit || "plate",
    category: meal?.category || inferMealCategory(meal?.name ?? "", meal?.description ?? ""),
    prepTime: meal?.prepTime || "15",
    availableFrom: meal?.availableFrom || "10",
    availableTo: meal?.availableTo || "22",
  });
  const [options, setOptions] = useState<MealOption[]>(parseMealOptions(meal?.options));
  const [image, setImage] = useState(meal?.image || "");
  const [imageBusy, setImageBusy] = useState(false);
  const [categoryTouched, setCategoryTouched] = useState(Boolean(meal?.category));

  useEffect(() => {
    if (categoryTouched) return;
    const nextCategory = inferMealCategory(form.name, form.description);
    setForm((current) =>
      current.category === nextCategory ? current : { ...current, category: nextCategory },
    );
  }, [categoryTouched, form.description, form.name]);

  const uploadImage = async (file?: File) => {
    if (!file) return;
    setImageBusy(true);
    try {
      setImage(await compressImageFile(file));
      toast.success("Image added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image could not be added");
    } finally {
      setImageBusy(false);
    }
  };

  const save = () => {
    if (!form.name || !form.price) {
      toast.error("Name and price required");
      return;
    }
    const mealForm = {
      ...form,
      category: form.category.trim() || inferMealCategory(form.name, form.description),
    };
    if (meal) {
      void backend.updateMeal(meal.id, {
        ...mealForm,
        image,
        options: stringifyMealOptions(options),
      });
      toast.success("Dish updated");
    } else {
      void backend.addMeal({
        id: "m" + Date.now(),
        restaurantId,
        ...mealForm,
        image,
        options: stringifyMealOptions(options),
        rating: "0",
        reviewCount: "0",
        popular: "0",
        available: "1",
      });
      toast.success("Dish added");
    }
    onSaved();
  };

  const F = (k: keyof typeof form, label: string, type = "text") => (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={form[k]}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-card p-4 shadow-card md:col-span-2 animate-slide-up">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">{meal ? "Edit dish" : "New dish"}</p>
        <button
          onClick={onCancel}
          className="grid h-7 w-7 place-items-center rounded-full bg-muted"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Dish image
          </span>
          <div className="mt-1 grid gap-3 sm:grid-cols-[160px_1fr] sm:items-center">
            <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
              {image ? (
                <img
                  src={image}
                  alt={form.name || "Dish preview"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-xs font-semibold text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold transition hover:bg-muted">
                <ImagePlus className="h-3.5 w-3.5" />
                {imageBusy ? "Processing..." : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={imageBusy}
                  onChange={(event) => void uploadImage(event.target.files?.[0])}
                />
              </label>
              {image && (
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="ml-2 rounded-full px-3 py-2 text-xs font-bold text-destructive transition hover:bg-destructive/10"
                >
                  Remove
                </button>
              )}
              <p className="text-[11px] leading-4 text-muted-foreground">
                Images are compressed before saving so meal cards stay fast.
              </p>
            </div>
          </div>
        </div>
        {F("name", "Name")}
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Serving unit
          </span>
          <select
            value={form.servingUnit}
            onChange={(e) => setForm({ ...form, servingUnit: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="plate">Per plate</option>
            <option value="spoon">Per spoon</option>
            <option value="piece">Per piece</option>
            <option value="wrap">Per wrap</option>
            <option value="bowl">Per bowl</option>
            <option value="portion">Per portion</option>
          </select>
        </label>
        {F("price", "Price (₦)", "number")}
        <label className="block md:col-span-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            rows={2}
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Category
          </span>
          <input
            value={form.category}
            list="meal-category-options"
            onChange={(e) => {
              setCategoryTouched(true);
              setForm({ ...form, category: e.target.value });
            }}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <datalist id="meal-category-options">
            {mealCategories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          {!categoryTouched && form.category !== "Meals" && (
            <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-1 text-[10px] font-black text-primary">
              Auto: {form.category}
            </span>
          )}
        </label>
        {F("prepTime", "Prep time (min)", "number")}
        {F("availableFrom", "Available from (hour 0-23)", "number")}
        {F("availableTo", "Available to (hour 0-23)", "number")}
        <div className="md:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Add items and prices
              </p>
              <p className="text-[11px] text-muted-foreground">
                Examples: extra spoon, with egg, with fish. Prices are in naira.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setOptions((prev) => [...prev, { id: "opt" + Date.now(), name: "", price: 0 }])
              }
              className="rounded-full border border-border px-3 py-1.5 text-[11px] font-bold hover:bg-muted"
            >
              Add item
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {options.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                No extra items yet. Customers will buy the base serving only.
              </div>
            )}
            {options.map((option, index) => (
              <div
                key={option.id}
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_86px_36px] gap-2 sm:grid-cols-[minmax(0,1fr)_110px_36px]"
              >
                <input
                  value={option.name}
                  onChange={(e) =>
                    setOptions((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, name: e.target.value } : item,
                      ),
                    )
                  }
                  placeholder="Item name"
                  className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <input
                  type="number"
                  value={option.price}
                  onChange={(e) =>
                    setOptions((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, price: Number(e.target.value) } : item,
                      ),
                    )
                  }
                  placeholder="₦ price"
                  className="min-w-0 rounded-lg border border-border bg-background px-2 py-2 text-sm outline-none focus:border-primary sm:px-3"
                />
                <button
                  type="button"
                  onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={save}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-glow"
      >
        <Check className="h-3.5 w-3.5" /> {meal ? "Save changes" : "Create dish"}
      </button>
    </div>
  );
}

/* ---------------- DISCOUNTS ---------------- */
function DiscountsTab({
  restaurantId,
  discounts,
  refresh,
}: {
  restaurantId: string;
  discounts: Discount[];
  refresh: () => void;
}) {
  const [adding, setAdding] = useState(false);

  const toggle = (id: string, cur: string) => {
    backend.updateDiscount(id, { active: cur === "1" ? "0" : "1" }).then(refresh);
  };
  const remove = (id: string) => {
    if (!confirm("Delete this discount?")) return;
    backend.deleteDiscount(id).then(refresh);
    toast.success("Discount deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {discounts.length} codes · {discounts.filter((d) => d.active === "1").length} active
        </p>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow transition active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" /> New code
        </button>
      </div>

      {adding && (
        <DiscountForm
          restaurantId={restaurantId}
          onCancel={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            refresh();
          }}
        />
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {discounts.map((d) => (
          <div key={d.id} className="rounded-2xl bg-card p-4 shadow-soft animate-slide-up">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-lg font-extrabold tracking-tight text-gradient">
                  {d.code}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {d.type === "percent" ? `${d.value}% off` : `${naira(d.value)} off`}
                  {Number(d.minOrder) > 0 && ` · min ${naira(d.minOrder)}`}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  d.active === "1" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {d.active === "1" ? "Active" : "Paused"}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Used {d.uses}×</span>
              <span>Expires {d.expiresAt}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => toggle(d.id, d.active)}
                className="flex-1 rounded-full border border-border bg-card py-1.5 text-xs font-semibold hover:bg-muted transition"
              >
                {d.active === "1" ? "Pause" : "Activate"}
              </button>
              <button
                onClick={() => remove(d.id)}
                className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-destructive hover:bg-destructive/10 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {discounts.length === 0 && !adding && (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center md:col-span-2">
            <div className="text-3xl">🏷️</div>
            <p className="mt-2 text-sm font-semibold">No discount codes yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create your first code to drive more orders.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DiscountForm({
  restaurantId,
  onCancel,
  onSaved,
}: {
  restaurantId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    code: "",
    type: "percent",
    value: "10",
    minOrder: "0",
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });
  const save = () => {
    if (!form.code) {
      toast.error("Code required");
      return;
    }
    void backend.addDiscount({
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
        <button
          onClick={onCancel}
          className="grid h-7 w-7 place-items-center rounded-full bg-muted"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Code
          </span>
          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="LAUNCH20"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono uppercase outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Type
          </span>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="percent">% off</option>
            <option value="fixed">Fixed ₦ off</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Value
          </span>
          <input
            type="number"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Min order (₦)
          </span>
          <input
            type="number"
            value={form.minOrder}
            onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Expires
          </span>
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>
      <button
        onClick={save}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-glow"
      >
        <Check className="h-3.5 w-3.5" /> Create discount
      </button>
    </div>
  );
}

/* ---------------- PROFILE ---------------- */
function ProfileTab({ restaurant, refresh }: { restaurant: Restaurant; refresh: () => void }) {
  const [form, setForm] = useState(restaurant);
  const [locating, setLocating] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(restaurant.paymentSetupStatus ?? "not_started");
  const coords = form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : null;

  useEffect(() => {
    setForm(restaurant);
    setPaymentStatus(restaurant.paymentSetupStatus ?? "not_started");
  }, [restaurant]);

  const save = () => {
    const {
      paystackSubaccount,
      paymentDisplayName,
      paymentSetupStatus,
      verificationStatus,
      moderationStatus,
      suspensionReason,
      ...profile
    } = form;
    void paystackSubaccount;
    void paymentDisplayName;
    void paymentSetupStatus;
    void verificationStatus;
    void moderationStatus;
    void suspensionReason;
    backend.updateRestaurant(restaurant.id, profile).then(refresh);
    toast.success("Profile updated");
  };
  const requestPaymentSetup = () => {
    setPaymentStatus("pending_review");
    backend
      .updateRestaurant(restaurant.id, { paymentSetupStatus: "pending_review" })
      .then(() => {
        refresh();
        setPaymentStatus("pending_review");
      });
    toast.success("Payment setup request sent to admin");
  };
  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const location = await getCurrentLocationDetails();
      setForm((current) => ({
        ...current,
        address: location.address,
        lat: String(location.lat),
        lng: String(location.lng),
        distance: "0",
      }));
      toast.success("Restaurant location pinned");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Location could not be set");
    } finally {
      setLocating(false);
    }
  };
  const toggleOpen = () => {
    const next = form.isOpen === "1" ? "0" : "1";
    setForm({ ...form, isOpen: next });
    backend.updateRestaurant(restaurant.id, { isOpen: next }).then(refresh);
    toast.success(next === "1" ? "Restaurant is now open" : "Restaurant set to closed");
  };
  const uploadRestaurantImage = async (file?: File) => {
    if (!file) return;
    setImageBusy(true);
    try {
      const image = await compressImageFile(file);
      setForm((current) => ({ ...current, image }));
      toast.success("Restaurant photo updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Photo could not be added");
    } finally {
      setImageBusy(false);
    }
  };

  const F = (k: keyof Restaurant, label: string, type = "text") => (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={(form[k] ?? "") as string}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold">{form.name}</p>
            <p className="text-xs text-muted-foreground">{form.cuisine}</p>
          </div>
          <button
            onClick={toggleOpen}
            className={`rounded-full px-4 py-1.5 text-xs font-bold shadow-glow transition ${
              form.isOpen === "1" ? "bg-success text-white" : "bg-destructive text-white"
            }`}
          >
            {form.isOpen === "1" ? "OPEN" : "CLOSED"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <p className="text-sm font-bold">Restaurant details</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Restaurant photo
            </span>
            <div className="mt-1 grid gap-3 sm:grid-cols-[180px_1fr] sm:items-center">
              <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
                {form.image ? (
                  <img
                    src={form.image}
                    alt={form.name || "Restaurant preview"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-xs font-semibold text-muted-foreground">
                    No photo
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold transition hover:bg-muted">
                  <ImagePlus className="h-3.5 w-3.5" />
                  {imageBusy ? "Processing..." : "Upload photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={imageBusy}
                    onChange={(event) => void uploadRestaurantImage(event.target.files?.[0])}
                  />
                </label>
                {form.image && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, image: "" })}
                    className="ml-2 rounded-full px-3 py-2 text-xs font-bold text-destructive transition hover:bg-destructive/10"
                  >
                    Remove
                  </button>
                )}
                <p className="text-[11px] leading-4 text-muted-foreground">
                  JPG/PNG only, max 1 MB. Save profile after changing it.
                </p>
              </div>
            </div>
          </div>
          {F("name", "Name")}
          {F("cuisine", "Cuisine")}
          {F("tags", "Tags (pipe-separated)")}
          {F("prepTime", "Avg prep time (min)", "number")}
          {F("phone", "Phone")}
          <div className="md:col-span-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Location
            </span>
            <div className="mt-1 space-y-3">
              <LocationPreview
                coords={
                  Number.isFinite(coords?.lat) && Number.isFinite(coords?.lng) ? coords : null
                }
                address={form.address}
                emptyText="Pin your restaurant location."
              />
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-sm font-semibold transition hover:bg-muted disabled:opacity-60 sm:w-auto sm:px-4"
              >
                {locating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                {locating ? "Getting location..." : "Use current location"}
              </button>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                rows={2}
              />
            </div>
          </div>
          {F("lat", "Latitude")}
          {F("lng", "Longitude")}
          <label className="block md:col-span-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              rows={3}
            />
          </label>
        </div>
        <button
          onClick={save}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-glow"
        >
          <Check className="h-3.5 w-3.5" /> Save profile
        </button>
      </div>
    </div>
  );
}

/* ---------------- shared ---------------- */
function compactNaira(value: number) {
  const amount = Math.abs(value);
  if (amount >= 1_000_000) return `N${(value / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1)}m`;
  if (amount >= 1_000) return `N${(value / 1_000).toFixed(amount >= 10_000 ? 0 : 1)}k`;
  return `N${Math.round(value)}`;
}

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof TrendingUp;
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
        className={`mt-2 text-[10px] uppercase tracking-wider ${accent ? "opacity-85" : "text-muted-foreground"}`}
      >
        {label}
      </p>
      <p className="text-base font-bold leading-tight">{value}</p>
    </div>
  );
}
function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
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
