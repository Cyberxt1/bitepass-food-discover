import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Beef,
  ChevronRight,
  CupSoda,
  Flame,
  Heart,
  LocateFixed,
  Navigation,
  Sandwich,
  Search,
  Soup,
  Sparkles,
  TrendingUp,
  Utensils,
  Wheat,
  X,
  EyeOff,
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
  const [nearbyDeckOpen, setNearbyDeckOpen] = useState(false);
  const [deckIndex, setDeckIndex] = useState(0);
  const [likedRestaurantIds, setLikedRestaurantIds] = useState<Set<string>>(new Set());
  const [mutedRestaurantIds, setMutedRestaurantIds] = useState<Set<string>>(new Set());

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
  const visibleNearbyRestaurants = nearbyRestaurants.filter((restaurant) => !mutedRestaurantIds.has(restaurant.id));
  const displayLimit = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches ? 6 : 4;
  const displayRestaurants = (coords ? visibleNearbyRestaurants : restaurants).slice(0, displayLimit);

  const nearbyRestaurantIds = new Set(nearbyRestaurants.map((restaurant) => restaurant.id));

  const distanceFor = (restaurant: Restaurant) => {
    if (!coords) return undefined;
    const target = restaurantCoords(restaurant);
    return target ? formatDistance(distanceKm(coords, target)) : undefined;
  };

  const currentDeckRestaurant = visibleNearbyRestaurants[deckIndex % Math.max(visibleNearbyRestaurants.length, 1)];
  const moveDeck = (direction: 1 | -1) => {
    if (visibleNearbyRestaurants.length === 0) return;
    setDeckIndex((value) => (value + direction + visibleNearbyRestaurants.length) % visibleNearbyRestaurants.length);
  };
  const likeCurrentRestaurant = () => {
    if (!currentDeckRestaurant) return;
    setLikedRestaurantIds((current) => new Set(current).add(currentDeckRestaurant.id));
    moveDeck(1);
  };
  const muteCurrentRestaurant = () => {
    if (!currentDeckRestaurant) return;
    setMutedRestaurantIds((current) => new Set(current).add(currentDeckRestaurant.id));
    setDeckIndex(0);
  };
  const handleDeckTouch = (startX: number, startY: number, endX: number, endY: number) => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 45) return;
    if (Math.abs(deltaX) > Math.abs(deltaY)) moveDeck(deltaX > 0 ? 1 : -1);
    else if (deltaY > 0) likeCurrentRestaurant();
    else muteCurrentRestaurant();
  };

  const trending = meals.filter((m) => m.popular === "1").slice(0, 6);
  let touchStart: { x: number; y: number } | null = null;
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
                <div className="mt-4 rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur sm:hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wide text-white/65">Your area</p>
                      <p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-white">
                        {coords ? shortLocationLabel(locationLabel) : "Tap refresh to use exact location"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={enableLocation}
                      disabled={requestingLocation}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-soft transition active:scale-95 disabled:opacity-70"
                      aria-label="Refresh location"
                    >
                      <LocateFixed className={`h-4 w-4 ${requestingLocation ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>
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
                <button
                  type="button"
                  onClick={() => coords && visibleNearbyRestaurants.length > 0 && setNearbyDeckOpen(true)}
                  className="flex items-center gap-2 text-left text-base font-black sm:text-lg"
                >
                  <Navigation className="h-4 w-4 text-primary" />
                  {coords ? "Near you" : "Restaurants to explore"}
                </button>
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
                {coords && visibleNearbyRestaurants.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNearbyDeckOpen(true)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-muted"
                  >
                    Swipe view
                  </button>
                )}
              </div>

              {coords && !loading && visibleNearbyRestaurants.length === 0 ? (
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
              <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="w-[82vw] max-w-[360px] shrink-0 snap-center sm:w-auto sm:max-w-none sm:shrink">
                        <SkeletonCard />
                      </div>
                    ))
                  : trending.slice(0, 3).map((m) => {
                      const rest = restaurants.find((r) => r.id === m.restaurantId);
                      return (
                        <div key={m.id} className="w-[82vw] max-w-[360px] shrink-0 snap-center sm:w-auto sm:max-w-none sm:shrink">
                          <MealCard meal={m} restaurantName={rest?.name} />
                        </div>
                      );
                    })}
              </div>
            </section>
          </div>
        </section>
      </main>
      {nearbyDeckOpen && currentDeckRestaurant && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 px-4 pb-5 pt-10 backdrop-blur-sm sm:items-center sm:pb-10">
          <div className="relative w-full max-w-sm">
            <button
              type="button"
              onClick={() => setNearbyDeckOpen(false)}
              className="absolute -top-3 right-0 z-10 grid h-10 w-10 -translate-y-full place-items-center rounded-full bg-white text-foreground shadow-soft"
              aria-label="Close nearby restaurants"
            >
              <X className="h-4 w-4" />
            </button>
            <div
              className="overflow-hidden rounded-[1.75rem] bg-card shadow-card"
              onTouchStart={(event) => {
                const touch = event.touches[0];
                touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
              }}
              onTouchEnd={(event) => {
                const touch = event.changedTouches[0];
                if (touchStart && touch) handleDeckTouch(touchStart.x, touchStart.y, touch.clientX, touch.clientY);
                touchStart = null;
              }}
            >
              <div className="relative aspect-[4/4.6] bg-muted">
                {currentDeckRestaurant.image && (
                  <img src={currentDeckRestaurant.image} alt={currentDeckRestaurant.name} className="h-full w-full object-cover" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-2xl font-black">{currentDeckRestaurant.name}</p>
                      <p className="mt-1 line-clamp-1 text-sm font-semibold text-white/82">
                        {currentDeckRestaurant.address || "Pinned restaurant area"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/18 px-3 py-1 text-xs font-black backdrop-blur">
                      {distanceFor(currentDeckRestaurant) ?? `${currentDeckRestaurant.distance} km`}
                    </span>
                  </div>
                </div>
                {likedRestaurantIds.has(currentDeckRestaurant.id) && (
                  <span className="absolute left-4 top-4 rounded-full bg-success px-3 py-1 text-xs font-black text-success-foreground">
                    Liked
                  </span>
                )}
              </div>
              <div className="space-y-4 p-4">
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{currentDeckRestaurant.description}</p>
                <div className="grid grid-cols-4 gap-2">
                  <button type="button" onClick={() => moveDeck(-1)} className="rounded-2xl border border-border py-3 text-sm font-black">
                    Left
                  </button>
                  <button type="button" onClick={() => moveDeck(1)} className="rounded-2xl border border-border py-3 text-sm font-black">
                    Right
                  </button>
                  <button type="button" onClick={muteCurrentRestaurant} className="grid place-items-center rounded-2xl bg-muted py-3 text-muted-foreground">
                    <EyeOff className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={likeCurrentRestaurant} className="grid place-items-center rounded-2xl bg-success py-3 text-success-foreground">
                    <Heart className="h-4 w-4 fill-current" />
                  </button>
                </div>
                <Link
                  to="/restaurant/$restaurantId"
                  params={{ restaurantId: currentDeckRestaurant.id }}
                  className="block rounded-2xl bg-gradient-primary px-5 py-3 text-center text-sm font-black text-primary-foreground shadow-glow"
                >
                  Open restaurant
                </Link>
                <p className="text-center text-[11px] font-semibold text-muted-foreground">
                  Swipe left/right to browse, down to like, up to mute.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
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
