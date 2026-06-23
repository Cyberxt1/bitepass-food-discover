import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Beef,
  ChevronRight,
  CupSoda,
  Flame,
  LocateFixed,
  Navigation,
  Sandwich,
  Search,
  Soup,
  Sparkles,
  TrendingUp,
  Utensils,
  Wheat,
} from "lucide-react";
import { useEffect, useState } from "react";
import { backend } from "@/lib/backend";
import { useAuth } from "@/lib/auth";
import type { Meal, Restaurant } from "@/lib/seed";
import {
  getCurrentLocationDetails,
  getStoredLocation,
  distanceKm,
  formatDistance,
  restaurantCoords,
  shortLocationLabel,
  type Coordinates,
} from "@/lib/location";
import { notify } from "@/lib/notifications";
import { AppHeader } from "@/components/AppHeader";
import { RestaurantCard } from "@/components/RestaurantCard";
import { MealCard } from "@/components/MealCard";
import { SkeletonCard } from "@/components/SkeletonCard";

export const Route = createFileRoute("/discover")({ component: Discover });
const NEARBY_RADIUS_KM = 40;
const DISCOVER_REFRESH_MS = 10000;

const categories = [
  { name: "Jollof", hint: "Rice bowls", icon: Flame, accent: "bg-orange-500/10 text-orange-700" },
  { name: "Shawarma", hint: "Wraps", icon: Sandwich, accent: "bg-emerald-500/10 text-emerald-700" },
  { name: "Burgers", hint: "Grills", icon: Beef, accent: "bg-red-500/10 text-red-700" },
  { name: "Swallow", hint: "Local plates", icon: Wheat, accent: "bg-amber-500/10 text-amber-700" },
  { name: "Soup", hint: "Hot bowls", icon: Soup, accent: "bg-lime-500/10 text-lime-700" },
  { name: "Noodles", hint: "Fast meals", icon: Utensils, accent: "bg-sky-500/10 text-sky-700" },
  { name: "Drinks", hint: "Cold sips", icon: CupSoda, accent: "bg-fuchsia-500/10 text-fuchsia-700" },
];

function Discover() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [locationLabel, setLocationLabel] = useState("Location off");
  const [requestingLocation, setRequestingLocation] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadDiscoverData = async () => {
      const [nextRestaurants, nextMeals] = await Promise.all([backend.restaurants(), backend.meals()]);
      if (cancelled) return;
      setRestaurants(nextRestaurants);
      setMeals(nextMeals);
      setLoading(false);
    };

    const timeout = window.setTimeout(() => {
      void loadDiscoverData();
    }, 400);
    const interval = window.setInterval(() => {
      void loadDiscoverData();
    }, DISCOVER_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const stored = getStoredLocation(user);
    if (!stored) {
      setCoords(null);
      setLocationLabel("Location off");
      return;
    }

    setCoords({ lat: stored.lat, lng: stored.lng });
    setLocationLabel(stored.address);
  }, [user]);

  useEffect(() => {
    if (coords || typeof navigator === "undefined" || !navigator.permissions) return;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (status.state === "granted") void enableLocation();
      })
      .catch(() => {});
  }, [coords]);

  const enableLocation = async () => {
    if (requestingLocation) return;
    setRequestingLocation(true);
    try {
      const location = await getCurrentLocationDetails();
      setCoords({ lat: location.lat, lng: location.lng });
      setLocationLabel(location.address);
      if (user) {
        await backend.updateUser(user.id, {
          address: location.address,
          lat: String(location.lat),
          lng: String(location.lng),
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not access your location";
      notify("error", message, { id: "discover-location-error" });
    } finally {
      setRequestingLocation(false);
    }
  };

  const restaurantsWithDistance = coords
    ? restaurants
        .map((restaurant) => {
          const target = restaurantCoords(restaurant);
          const distance = target ? distanceKm(coords, target) : Number.POSITIVE_INFINITY;
          return { restaurant, distance };
        })
        .sort((a, b) => a.distance - b.distance)
    : [];

  const nearbyRestaurants = coords
    ? restaurantsWithDistance
        .filter(({ distance }) => distance <= NEARBY_RADIUS_KM)
        .map(({ restaurant }) => restaurant)
    : [];
  const displayRestaurants = (coords ? nearbyRestaurants : restaurants).slice(0, 6);

  const nearbyRestaurantIds = new Set(nearbyRestaurants.map((restaurant) => restaurant.id));

  const distanceFor = (restaurant: Restaurant) => {
    if (!coords) return undefined;
    const target = restaurantCoords(restaurant);
    return target ? formatDistance(distanceKm(coords, target)) : undefined;
  };

  const trending = meals.filter((m) => m.popular === "1").slice(0, 6);
  return (
    <>
      <AppHeader locationLabel={locationLabel} subtitle="Welcome to BitePass" />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-7">
        <section>
          <div className="relative overflow-hidden rounded-[1.5rem] bg-[linear-gradient(135deg,oklch(0.2_0.04_45),oklch(0.42_0.14_36)_55%,oklch(0.74_0.16_68))] p-4 text-white shadow-card sm:rounded-[2rem] sm:p-6 lg:min-h-[250px] lg:p-7">
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/25 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-4 sm:gap-8">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/14 px-2.5 py-1 text-[10px] font-bold backdrop-blur sm:px-3 sm:text-[11px]">
                  <Sparkles className="h-3.5 w-3.5" />
                  BitePass
                </span>
                <h1 className="mt-3 max-w-2xl text-2xl font-black leading-[1.08] sm:mt-4 sm:text-4xl lg:text-[2.7rem]">
                  Find food nearby. Pay ahead.
                </h1>
                <p className="mt-2 max-w-xl text-xs leading-5 text-white/82 sm:mt-3 sm:text-base sm:leading-6">
                  Quick pickup from restaurants around you.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <Link
                  to="/search"
                  className="flex min-w-0 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-foreground shadow-soft transition hover:-translate-y-0.5"
                >
                  <Search className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-sm font-semibold text-muted-foreground">Search meals or restaurants</span>
                </Link>
                <button
                  type="button"
                  onClick={enableLocation}
                  disabled={requestingLocation}
                  className="hidden items-center justify-center gap-2 rounded-2xl bg-black/30 px-4 py-3 text-sm font-bold text-white ring-1 ring-white/18 backdrop-blur transition hover:bg-black/40 disabled:opacity-70 sm:inline-flex"
                >
                  <LocateFixed className="h-4 w-4" />
                  <span>{requestingLocation ? "Locating..." : coords ? "Refresh location" : "Use location"}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="min-w-0 space-y-7">
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-black sm:text-lg">
                  <Utensils className="h-4 w-4 text-primary" />
                  Cravings
                </h2>
                <Link to="/search" className="hidden items-center gap-1 text-xs font-bold text-primary sm:flex">
                  Browse all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="rounded-[1.5rem] border border-border bg-card p-2 shadow-soft">
                <div className="no-scrollbar flex gap-2 overflow-x-auto">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <Link
                        key={category.name}
                        to="/search"
                        search={{ q: category.name }}
                        className="group flex min-h-16 w-36 shrink-0 items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-muted"
                      >
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition group-hover:scale-105 ${category.accent}`}>
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black leading-tight">{category.name}</span>
                          <span className="mt-0.5 block truncate text-[11px] font-semibold text-muted-foreground">{category.hint}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-black sm:text-lg">
                  <Navigation className="h-4 w-4 text-primary" />
                  {coords ? "Near you" : "Restaurants to explore"}
                </h2>
                {!coords && !loading && (
                  <button
                    type="button"
                    onClick={enableLocation}
                    disabled={requestingLocation}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-muted disabled:opacity-70"
                  >
                    {requestingLocation ? "Locating..." : "Use location"}
                  </button>
                )}
              </div>

              {coords && !loading && nearbyRestaurants.length === 0 ? (
                <EmptyPanel title="No restaurants within 40 km yet" detail="Try browsing all restaurants while more kitchens join your area." />
              ) : (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                    : displayRestaurants.map((r) => <RestaurantCard key={r.id} r={r} distanceLabel={distanceFor(r)} />)}
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-black sm:text-lg">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Trending now
                </h2>
                <Link to="/search" className="flex items-center text-xs font-bold text-primary">
                  See all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                  : trending.slice(0, 3).map((m) => {
                      const rest = restaurants.find((r) => r.id === m.restaurantId);
                      return <MealCard key={m.id} meal={m} restaurantName={rest?.name} />;
                    })}
              </div>
            </section>
          </div>
        </section>
      </main>
    </>
  );
}

function EmptyPanel({ title, detail, compact = false }: { title: string; detail: string; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-dashed border-border bg-card/70 text-center ${compact ? "px-4 py-5" : "px-4 py-10"}`}>
      <p className="text-sm font-black">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}
