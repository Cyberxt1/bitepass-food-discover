import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, LocateFixed, Search as SearchIcon } from "lucide-react";
import { z } from "zod";

import { RestaurantCard } from "@/components/RestaurantCard";
import { ProgressiveItem } from "@/components/ProgressiveItem";
import { backend } from "@/lib/backend";
import { useAuth } from "@/lib/auth";
import type { Meal, Restaurant } from "@/lib/seed";
import {
  distanceKm,
  formatDistance,
  getCurrentLocationDetails,
  getStoredLocation,
  restaurantCoords,
  type Coordinates,
} from "@/lib/location";
import { notify } from "@/lib/notifications";
import { isMealPublic, isRestaurantPublic } from "@/lib/platform";

const searchSchema = z.object({ q: z.string().optional() });
const SEARCH_REFRESH_MS = 10000;

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: searchSchema,
});

function SearchPage() {
  const { user, updateProfile } = useAuth();
  const { q: initial } = Route.useSearch();
  const [q, setQ] = useState(initial ?? "");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [requestingLocation, setRequestingLocation] = useState(false);

  useEffect(() => {
    const stored = getStoredLocation(user);
    setCoords(stored ? { lat: stored.lat, lng: stored.lng } : null);

    let cancelled = false;
    const loadSearchData = async () => {
      const [nextRestaurants, nextMeals] = await Promise.all([
        backend.restaurants(),
        backend.meals(),
      ]);
      if (cancelled) return;
      setRestaurants(nextRestaurants.filter(isRestaurantPublic));
      setMeals(nextMeals.filter(isMealPublic));
      setLoading(false);
    };

    void loadSearchData();
    const interval = window.setInterval(() => {
      void loadSearchData();
    }, SEARCH_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    if (!q.trim()) {
      setSearching(false);
      return;
    }
    setSearching(true);
    const timeout = window.setTimeout(() => setSearching(false), 450);
    return () => window.clearTimeout(timeout);
  }, [q]);

  const enableLocation = async () => {
    if (requestingLocation) return;
    setRequestingLocation(true);
    try {
      const location = await getCurrentLocationDetails();
      setCoords({ lat: location.lat, lng: location.lng });
      if (user) {
        await updateProfile({
          address: location.address,
          lat: String(location.lat),
          lng: String(location.lng),
        });
      }
      notify("success", "Location updated for search", { id: "search-location-updated" });
    } catch (error) {
      notify(
        "error",
        error instanceof Error ? error.message : "We could not access your location",
        { id: "search-location-error" },
      );
    } finally {
      setRequestingLocation(false);
    }
  };

  const term = q.trim().toLowerCase();
  const hasSearch = term.length > 0;
  const matched = !hasSearch
    ? []
    : restaurants.filter((restaurant) => {
        const haystack =
          `${restaurant.name} ${restaurant.cuisine} ${restaurant.tags} ${restaurant.description}`.toLowerCase();
        if (haystack.includes(term)) return true;
        return meals.some(
          (meal) =>
            meal.restaurantId === restaurant.id &&
            `${meal.name} ${meal.category} ${meal.description}`.toLowerCase().includes(term),
        );
      });

  const results = coords
    ? [...matched].sort((a, b) => {
        const aCoords = restaurantCoords(a);
        const bCoords = restaurantCoords(b);
        const aDistance = aCoords ? distanceKm(coords, aCoords) : Number.POSITIVE_INFINITY;
        const bDistance = bCoords ? distanceKm(coords, bCoords) : Number.POSITIVE_INFINITY;
        return aDistance - bDistance;
      })
    : matched;

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/discover"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-border bg-card shadow-soft transition active:scale-95 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-soft focus-within:border-primary">
            <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search restaurants, cuisines, dishes..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-3 sm:px-6 lg:px-8 lg:pt-6">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-soft">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Search results
            </p>
            <h1 className="mt-0.5 truncate text-base font-black">
              {!hasSearch
                ? "Start typing"
                : searching || loading
                  ? "Searching..."
                  : `${results.length} ${results.length === 1 ? "restaurant" : "restaurants"}`}
            </h1>
          </div>
          {!coords && (
            <button
              type="button"
              onClick={enableLocation}
              disabled={requestingLocation}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground transition active:scale-95 hover:bg-muted disabled:opacity-70"
            >
              <LocateFixed className={`h-3.5 w-3.5 ${requestingLocation ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">
                {requestingLocation ? "Getting location..." : "Use location"}
              </span>
            </button>
          )}
        </div>

        {hasSearch && (searching || loading) ? (
          <LoadingPanel label="Searching restaurants..." />
        ) : hasSearch ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((restaurant, index) => (
              <ProgressiveItem key={restaurant.id} index={index} intrinsicSize="300px">
                <RestaurantCard
                  r={restaurant}
                  compact
                  distanceLabel={
                    coords && restaurantCoords(restaurant)
                      ? formatDistance(distanceKm(coords, restaurantCoords(restaurant)!))
                      : undefined
                  }
                />
              </ProgressiveItem>
            ))}
          </div>
        ) : (
          <div className="grid place-items-center px-6 pt-20 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <SearchIcon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold">Search for a restaurant, dish, or cuisine</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Results will appear after you type.
            </p>
          </div>
        )}

        {hasSearch && !searching && !loading && results.length === 0 && (
          <div className="grid place-items-center px-6 pt-20 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <SearchIcon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold">No restaurants match "{q}"</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different cuisine or dish name.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="grid place-items-center px-6 pt-20 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-3 text-sm font-semibold">{label}</p>
    </div>
  );
}
