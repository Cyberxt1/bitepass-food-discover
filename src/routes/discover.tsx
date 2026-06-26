import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Beef,
  Bell,
  ChevronRight,
  CupSoda,
  Flame,
  LocateFixed,
  Navigation,
  Sandwich,
  Search,
  Soup,
  TrendingUp,
  Utensils,
  Wheat,
  EyeOff,
  Clock,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { notify, useNotifications } from "@/lib/notifications";
import { naira } from "@/lib/format";
import { isMealPublic, isRestaurantPublic } from "@/lib/platform";
import { AppHeader } from "@/components/AppHeader";
import { RestaurantCard } from "@/components/RestaurantCard";
import { MealCard } from "@/components/MealCard";
import { SkeletonCard } from "@/components/SkeletonCard";

export const Route = createFileRoute("/discover")({ component: Discover });
const NEARBY_RADIUS_KM = 40;
const DISCOVER_REFRESH_MS = 10000;
const NEARBY_POPUP_KEY = "bitepass:last-nearby-popup";
const NEARBY_POPUP_COOLDOWN_MS = 1000 * 60 * 60 * 6;

const categories = [
  { name: "Jollof", hint: "Rice bowls", icon: Flame, accent: "bg-orange-500/10 text-orange-700" },
  { name: "Shawarma", hint: "Wraps", icon: Sandwich, accent: "bg-emerald-500/10 text-emerald-700" },
  { name: "Burgers", hint: "Grills", icon: Beef, accent: "bg-red-500/10 text-red-700" },
  { name: "Swallow", hint: "Local plates", icon: Wheat, accent: "bg-amber-500/10 text-amber-700" },
  { name: "Soup", hint: "Hot bowls", icon: Soup, accent: "bg-lime-500/10 text-lime-700" },
  { name: "Noodles", hint: "Fast meals", icon: Utensils, accent: "bg-sky-500/10 text-sky-700" },
  {
    name: "Drinks",
    hint: "Cold sips",
    icon: CupSoda,
    accent: "bg-fuchsia-500/10 text-fuchsia-700",
  },
];

function Discover() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
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
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [cravingIndex, setCravingIndex] = useState(0);
  const [deckDrag, setDeckDrag] = useState({ x: 0, y: 0 });
  const [deckSwipe, setDeckSwipe] = useState<{
    x: number;
    y: number;
    action: "like" | "mute" | "next" | "previous";
  } | null>(null);
  const seenNearbyIdsRef = useRef<Set<string> | null>(null);
  const deckTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const cravingsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDiscoverData = async () => {
      const [nextRestaurants, nextMeals] = await Promise.all([
        backend.restaurants(),
        backend.meals(),
      ]);
      if (cancelled) return;
      setRestaurants(nextRestaurants.filter(isRestaurantPublic));
      setMeals(nextMeals.filter(isMealPublic));
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

  const restaurantsWithDistance = useMemo(
    () =>
      coords
        ? restaurants
            .map((restaurant) => {
              const target = restaurantCoords(restaurant);
              const distance = target ? distanceKm(coords, target) : Number.POSITIVE_INFINITY;
              return { restaurant, distance };
            })
            .sort((a, b) => a.distance - b.distance)
        : [],
    [coords, restaurants],
  );

  const nearbyRestaurants = useMemo(
    () =>
      coords
        ? restaurantsWithDistance
            .filter(({ distance }) => distance <= NEARBY_RADIUS_KM)
            .map(({ restaurant }) => restaurant)
        : [],
    [coords, restaurantsWithDistance],
  );
  const visibleNearbyRestaurants = nearbyRestaurants.filter(
    (restaurant) => !mutedRestaurantIds.has(restaurant.id),
  );
  const displayLimit =
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches ? 6 : 4;
  const displayRestaurants = (coords ? visibleNearbyRestaurants : []).slice(0, displayLimit);

  useEffect(() => {
    if (!coords) {
      seenNearbyIdsRef.current = null;
      return;
    }

    const nextIds = new Set(nearbyRestaurants.map((restaurant) => restaurant.id));
    if (!seenNearbyIdsRef.current) {
      seenNearbyIdsRef.current = nextIds;
      return;
    }

    const newRestaurants = nearbyRestaurants.filter(
      (restaurant) => !seenNearbyIdsRef.current?.has(restaurant.id),
    );
    seenNearbyIdsRef.current = nextIds;
    if (newRestaurants.length === 0) return;

    const lastPopup = Number(window.localStorage.getItem(NEARBY_POPUP_KEY) ?? 0);
    if (!Number.isFinite(lastPopup) || Date.now() - lastPopup > NEARBY_POPUP_COOLDOWN_MS) {
      window.localStorage.setItem(NEARBY_POPUP_KEY, String(Date.now()));
    }
  }, [coords, nearbyRestaurants]);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    const key = `bitepass:feedback-settings-notice:${user.id}`;
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
    notify("info", "Feedback and contact help live in Settings now", {
      id: `feedback-settings-notice:${user.id}`,
      persist: false,
    });
  }, [user]);

  const distanceFor = (restaurant: Restaurant) => {
    if (!coords) return undefined;
    const target = restaurantCoords(restaurant);
    return target ? formatDistance(distanceKm(coords, target)) : undefined;
  };

  const currentDeckRestaurant =
    visibleNearbyRestaurants[deckIndex % Math.max(visibleNearbyRestaurants.length, 1)];
  const moveDeck = (direction: 1 | -1) => {
    if (visibleNearbyRestaurants.length === 0) return;
    setDeckIndex(
      (value) =>
        (value + direction + visibleNearbyRestaurants.length) % visibleNearbyRestaurants.length,
    );
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
  const finishDeckSwipe = (x: number, y: number, action: "like" | "mute" | "next" | "previous") => {
    setDeckSwipe({ x, y, action });
    window.setTimeout(() => {
      if (action === "like") likeCurrentRestaurant();
      if (action === "mute") muteCurrentRestaurant();
      if (action === "next") moveDeck(1);
      if (action === "previous") moveDeck(-1);
      setDeckDrag({ x: 0, y: 0 });
      setDeckSwipe(null);
      requestAnimationFrame(() => {
        const card = document.querySelector("[data-nearby-card='active']");
        card?.classList.add("animate-card-pop");
        window.setTimeout(() => card?.classList.remove("animate-card-pop"), 360);
      });
    }, 280);
  };
  const handleDeckTouch = (startX: number, startY: number, endX: number, endY: number) => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    setDeckDrag({ x: 0, y: 0 });
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 45) return;
    const fallX = deltaX === 0 ? (deltaY > 0 ? 44 : -44) : deltaX * 2.4;
    const fallY = deltaY * 2.4 + (deltaY > 0 ? 260 : -260);
    if (Math.abs(deltaY) >= Math.abs(deltaX)) {
      finishDeckSwipe(fallX, fallY, deltaY > 0 ? "like" : "mute");
    } else {
      finishDeckSwipe(fallX, deltaY * 2.1 + 180, deltaX > 0 ? "next" : "previous");
    }
  };

  const trending = useMemo(() => {
    const nearbyRestaurantIds = new Set(nearbyRestaurants.map((restaurant) => restaurant.id));
    return meals
      .filter((meal) => nearbyRestaurantIds.has(meal.restaurantId))
      .sort((a, b) => {
        const popular = Number(b.popular === "1") - Number(a.popular === "1");
        if (popular !== 0) return popular;
        return Number(b.rating || 0) - Number(a.rating || 0);
      })
      .slice(0, 6);
  }, [meals, nearbyRestaurants]);
  const deckTransform = deckSwipe
    ? `translate(${deckSwipe.x}px, ${deckSwipe.y}px) rotate(${Math.max(-24, Math.min(24, deckSwipe.x / 12))}deg)`
    : `translate(${deckDrag.x}px, ${deckDrag.y}px) rotate(${Math.max(-10, Math.min(10, deckDrag.x / 18))}deg)`;
  return (
    <>
      <AppHeader
        locationLabel={locationLabel}
        subtitle="Welcome to BitePass"
        showNotifications={false}
      />
      <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-3 sm:px-6 lg:px-8 lg:py-6">
        <section className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
          <Link
            to="/search"
            className="flex min-h-12 min-w-0 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-soft transition hover:-translate-y-0.5 hover:bg-muted"
          >
            <Search className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-sm font-semibold text-muted-foreground">
              Search meals or restaurants
            </span>
          </Link>
          <Link
            to="/notifications"
            className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-border bg-card shadow-soft transition active:scale-95 hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={enableLocation}
            disabled={requestingLocation}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-border bg-card text-primary shadow-soft transition active:scale-95 hover:bg-muted disabled:opacity-70"
            aria-label={coords ? "Refresh location" : "Use location"}
          >
            <LocateFixed className={`h-4 w-4 ${requestingLocation ? "animate-spin" : ""}`} />
          </button>
        </section>

        <section>
          <div className="min-w-0 space-y-7">
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-black sm:text-lg">
                  <Utensils className="h-4 w-4 text-primary" />
                  Cravings
                </h2>
                <Link
                  to="/search"
                  className="hidden items-center gap-1 text-xs font-bold text-primary sm:flex"
                >
                  Browse all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="rounded-[1.5rem] border border-border bg-card p-2 shadow-soft">
                <div
                  ref={cravingsRef}
                  className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth"
                  onTouchStart={(event) => event.stopPropagation()}
                  onTouchMove={(event) => event.stopPropagation()}
                  onTouchEnd={(event) => event.stopPropagation()}
                  onScroll={(event) => {
                    const el = event.currentTarget;
                    const cardWidth = 144;
                    setCravingIndex(Math.round(el.scrollLeft / cardWidth));
                  }}
                >
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <Link
                        key={category.name}
                        to="/search"
                        search={{ q: category.name }}
                        className="group flex min-h-16 w-36 shrink-0 snap-start items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-muted"
                      >
                        <span
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition group-hover:scale-105 ${category.accent}`}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black leading-tight">
                            {category.name}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] font-semibold text-muted-foreground">
                            {category.hint}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-1.5 flex justify-center gap-1 sm:hidden">
                  {[0, 1, 2].map((dot) => (
                    <button
                      key={dot}
                      type="button"
                      aria-label={`Show cravings group ${dot + 1}`}
                      onClick={() =>
                        cravingsRef.current?.scrollTo({ left: dot * 144 * 2, behavior: "smooth" })
                      }
                      className={`h-1.5 rounded-full transition-all ${Math.min(2, Math.floor(cravingIndex / 2)) === dot ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/35"}`}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <Link
                  to="/nearby"
                  className="flex items-center gap-2 text-left text-base font-black sm:text-lg"
                >
                  <Navigation className="h-4 w-4 text-primary" />
                  Near you
                </Link>
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
                  <Link
                    to="/nearby"
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-muted"
                  >
                    View all
                  </Link>
                )}
              </div>

              {!coords && !loading ? (
                <EmptyPanel
                  title="Set your location to see nearby restaurants"
                  detail="Tap refresh above or use location here. Search stays available when you want to browse manually."
                />
              ) : coords && !loading && visibleNearbyRestaurants.length === 0 ? (
                <EmptyPanel
                  title="No restaurants within 40 km yet"
                  detail="Try searching while more kitchens join your area."
                />
              ) : (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                    : displayRestaurants.map((r) => (
                        <RestaurantCard key={r.id} r={r} distanceLabel={distanceFor(r)} compact />
                      ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-black sm:text-lg">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Trending now
                </h2>
                <Link to="/nearby" className="flex items-center text-xs font-bold text-primary">
                  See all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div
                data-no-tab-swipe
                className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3"
                style={{ touchAction: "pan-x" }}
                onTouchStart={(event) => event.stopPropagation()}
                onTouchMove={(event) => event.stopPropagation()}
                onTouchEnd={(event) => event.stopPropagation()}
              >
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-[82vw] max-w-[360px] shrink-0 snap-center sm:w-auto sm:max-w-none sm:shrink"
                      >
                        <SkeletonCard />
                      </div>
                    ))
                  : !coords
                    ? (
                      <div className="w-[82vw] max-w-[360px] shrink-0 snap-center sm:col-span-2 sm:w-auto sm:max-w-none sm:shrink lg:col-span-3">
                        <EmptyPanel
                          title="Set your location to see nearby foods"
                          detail="Trending now only shows dishes from restaurants near you."
                          compact
                        />
                      </div>
                    )
                    : trending.length === 0
                    ? (
                      <div className="w-[82vw] max-w-[360px] shrink-0 snap-center sm:col-span-2 sm:w-auto sm:max-w-none sm:shrink lg:col-span-3">
                        <EmptyPanel
                          title="No nearby foods yet"
                          detail="Approved dishes from restaurants within 40 km will show here."
                          compact
                        />
                      </div>
                    )
                    : trending.map((m) => {
                      const rest = restaurants.find((r) => r.id === m.restaurantId);
                      return (
                        <div
                          key={m.id}
                          className="w-[82vw] max-w-[360px] shrink-0 snap-center sm:w-auto sm:max-w-none sm:shrink"
                        >
                          <MealCard
                            meal={m}
                            restaurantName={rest?.name}
                            onQuickView={setSelectedMeal}
                          />
                        </div>
                      );
                    })}
              </div>
            </section>
          </div>
        </section>
      </main>
      {nearbyDeckOpen && currentDeckRestaurant && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 px-4 pb-5 pt-10 backdrop-blur-sm sm:items-center sm:pb-10"
          onClick={() => setNearbyDeckOpen(false)}
        >
          <div
            className="relative w-full max-w-[340px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              data-nearby-card="active"
              className="overflow-hidden rounded-[1.5rem] bg-card shadow-card touch-none"
              style={{
                transform: deckTransform,
                opacity: deckSwipe ? 0.1 : 1,
                transition: deckSwipe
                  ? "transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease"
                  : "transform 120ms ease-out",
              }}
              onTouchStart={(event) => {
                const touch = event.touches[0];
                deckTouchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
              }}
              onTouchMove={(event) => {
                const touch = event.touches[0];
                if (!touch || !deckTouchStartRef.current || deckSwipe) return;
                setDeckDrag({
                  x: touch.clientX - deckTouchStartRef.current.x,
                  y: touch.clientY - deckTouchStartRef.current.y,
                });
              }}
              onTouchEnd={(event) => {
                const touch = event.changedTouches[0];
                if (deckTouchStartRef.current && touch) {
                  handleDeckTouch(
                    deckTouchStartRef.current.x,
                    deckTouchStartRef.current.y,
                    touch.clientX,
                    touch.clientY,
                  );
                }
                deckTouchStartRef.current = null;
              }}
            >
              <div className="relative aspect-[4/3.25] bg-muted">
                {currentDeckRestaurant.image && (
                  <img
                    src={currentDeckRestaurant.image}
                    alt={currentDeckRestaurant.name}
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-xl font-black">
                        {currentDeckRestaurant.name}
                      </p>
                      <p className="mt-1 line-clamp-1 text-sm font-semibold text-white/82">
                        {shortLocationLabel(
                          currentDeckRestaurant.address || currentDeckRestaurant.cuisine,
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/18 px-3 py-1 text-xs font-black backdrop-blur">
                      {distanceFor(currentDeckRestaurant) ?? `${currentDeckRestaurant.distance} km`}
                    </span>
                  </div>
                </div>
                {likedRestaurantIds.has(currentDeckRestaurant.id) && (
                  <span className="absolute left-4 top-4 rounded-full bg-success px-3 py-1 text-xs font-black text-success-foreground animate-fire-pop">
                    Fire picked
                  </span>
                )}
              </div>
              <div className="space-y-3 p-3.5">
                <p className="line-clamp-1 text-sm leading-6 text-muted-foreground">
                  {currentDeckRestaurant.description}
                </p>
                <div className="grid grid-cols-[1fr_1.4fr] gap-2">
                  <button
                    type="button"
                    onClick={muteCurrentRestaurant}
                    className="grid place-items-center rounded-2xl bg-muted py-3 text-muted-foreground"
                  >
                    <EyeOff className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={likeCurrentRestaurant}
                    className={`grid place-items-center rounded-2xl py-3 text-xl transition active:scale-95 ${
                      likedRestaurantIds.has(currentDeckRestaurant.id)
                        ? "bg-success text-success-foreground shadow-soft animate-fire-pop"
                        : "bg-success/15"
                    }`}
                    aria-label="Like restaurant"
                  >
                    <span className="animate-fire-pop">🔥</span>
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
                  Swipe the card. Down likes, up hides, sideways browses.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedMeal && (
        <MealQuickView
          meal={selectedMeal}
          restaurant={restaurants.find((restaurant) => restaurant.id === selectedMeal.restaurantId)}
          onClose={() => setSelectedMeal(null)}
        />
      )}
    </>
  );
}

function MealQuickView({
  meal,
  restaurant,
  onClose,
}: {
  meal: Meal;
  restaurant?: Restaurant;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 px-4 pb-24 pt-10 backdrop-blur-sm sm:items-center sm:pb-10"
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100dvh-8rem)] w-full max-w-md overflow-y-auto rounded-[1.75rem] bg-card p-4 shadow-card animate-slide-up sm:max-h-[calc(100dvh-5rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-soft">
              {meal.image ? (
                <img src={meal.image} alt={meal.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center bg-[linear-gradient(135deg,oklch(0.93_0.04_75),oklch(0.86_0.12_42))] px-2 text-center">
                  <span className="text-xs font-black leading-tight">{meal.name}</span>
                </div>
              )}
              {meal.popular === "1" && (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-black leading-tight">{meal.name}</h3>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                {restaurant?.name ?? "Restaurant"}
              </p>
              {restaurant?.address && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {restaurant.address}
                </p>
              )}
              <span className="mt-2 inline-block text-base font-black text-primary">
                {naira(meal.price)}
              </span>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{meal.description}</p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              {meal.rating}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <Clock className="h-3.5 w-3.5" />
              {meal.prepTime} min
            </span>
            {meal.servingUnit && (
              <span className="rounded-full bg-muted px-2.5 py-1">Per {meal.servingUnit}</span>
            )}
          </div>
          <Link
            to="/meal/$mealId"
            params={{ mealId: meal.id }}
            className="block rounded-2xl bg-gradient-primary px-5 py-3 text-center text-sm font-black text-primary-foreground shadow-glow"
          >
            Choose this meal
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyPanel({
  title,
  detail,
  compact = false,
}: {
  title: string;
  detail: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-border bg-card/70 text-center ${compact ? "px-4 py-5" : "px-4 py-10"}`}
    >
      <p className="text-sm font-black">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}
