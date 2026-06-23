import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, LocateFixed, Search as SearchIcon } from "lucide-react";
import { z } from "zod";

import { RestaurantCard } from "@/components/RestaurantCard";
import { backend } from "@/lib/backend";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import type { Meal, Restaurant } from "@/lib/seed";
import {
  distanceKm,
  formatDistance,
  getCurrentLocationDetails,
  getStoredLocation,
  restaurantCoords,
  type Coordinates,
} from "@/lib/location";

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
  const [requestingLocation, setRequestingLocation] = useState(false);

  useEffect(() => {
    const stored = getStoredLocation(user);
    setCoords(stored ? { lat: stored.lat, lng: stored.lng } : null);

    let cancelled = false;
    const loadSearchData = async () => {
      const [nextRestaurants, nextMeals] = await Promise.all([backend.restaurants(), backend.meals()]);
      if (cancelled) return;
      setRestaurants(nextRestaurants);
      setMeals(nextMeals);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not access your location";
      notify("error", message, { id: "search-location-error" });
    } finally {
      setRequestingLocation(false);
    }
  };

  const term = q.trim().toLowerCase();
  const matched = !term
    ? restaurants
    : restaurants.filter((restaurant) => {
        const haystack = `${restaurant.name} ${restaurant.cuisine} ${restaurant.tags} ${restaurant.description}`.toLowerCase();
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
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/discover" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-card shadow-soft">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5">
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

      <main className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8 lg:pt-8">
        <div className="flex flex-col gap-3 rounded-[1.75rem] border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between lg:p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Search results</p>
            <h1 className="mt-1 text-xl font-black">
              {results.length} {results.length === 1 ? "restaurant" : "restaurants"}
            </h1>
          </div>
          {!coords && (
            <button
              type="button"
              onClick={enableLocation}
              disabled={requestingLocation}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-bold text-foreground transition hover:bg-muted disabled:opacity-70"
            >
              <LocateFixed className="h-3.5 w-3.5" />
              <span>{requestingLocation ? "Getting location..." : "Turn on location"}</span>
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {results.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              r={restaurant}
              distanceLabel={
                coords && restaurantCoords(restaurant)
                  ? formatDistance(distanceKm(coords, restaurantCoords(restaurant)!))
                  : undefined
              }
            />
          ))}
        </div>

        {results.length === 0 && (
          <div className="grid place-items-center px-6 pt-20 text-center">
            <div className="text-5xl">Search</div>
            <p className="mt-3 text-sm font-semibold">No restaurants match "{q}"</p>
            <p className="mt-1 text-xs text-muted-foreground">Try a different cuisine or dish name.</p>
          </div>
        )}
      </main>
    </div>
  );
}
