import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, LocateFixed, Navigation } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { RestaurantCard } from "@/components/RestaurantCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { backend } from "@/lib/backend";
import { useAuth } from "@/lib/auth";
import {
  distanceKm,
  formatDistance,
  getCurrentLocationDetails,
  getStoredLocation,
  restaurantCoords,
  type Coordinates,
} from "@/lib/location";
import { notify } from "@/lib/notifications";
import type { Restaurant } from "@/lib/seed";

export const Route = createFileRoute("/nearby")({ component: NearbyPage });

const NEARBY_RADIUS_KM = 40;

function NearbyPage() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const stored = getStoredLocation(user);
    setCoords(stored ? { lat: stored.lat, lng: stored.lng } : null);

    let cancelled = false;
    async function load() {
      const nextRestaurants = await backend.restaurants();
      if (!cancelled) {
        setRestaurants(nextRestaurants);
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const sortedRestaurants = useMemo(() => {
    if (!coords) return [];
    return restaurants
      .map((restaurant) => {
        const target = restaurantCoords(restaurant);
        const distance = target ? distanceKm(coords, target) : Number.POSITIVE_INFINITY;
        return { restaurant, distance };
      })
      .filter(({ distance }) => distance <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.distance - b.distance);
  }, [coords, restaurants]);

  const refreshLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const location = await getCurrentLocationDetails();
      setCoords({ lat: location.lat, lng: location.lng });
      if (user) {
        await backend.updateUser(user.id, {
          address: location.address,
          lat: String(location.lat),
          lng: String(location.lng),
        });
      }
      notify("success", "Nearby restaurants refreshed", { id: "nearby-location-refreshed" });
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Location could not be read", {
        id: "nearby-location-error",
      });
    } finally {
      setLocating(false);
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/discover"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-border bg-card shadow-soft transition active:scale-95 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black">Nearby restaurants</h1>
              <p className="text-xs text-muted-foreground">Sorted by closest pickup distance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={refreshLocation}
            disabled={locating}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-border bg-card text-primary shadow-soft transition active:scale-95 hover:bg-muted disabled:opacity-70"
            aria-label="Refresh location"
          >
            <LocateFixed className={`h-4 w-4 ${locating ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:px-6 lg:px-8">
        {!coords && !loading ? (
          <section className="grid place-items-center rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center shadow-soft">
            <Navigation className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-black">Set your location first</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              Tap refresh so BitePass can sort restaurants by closeness.
            </p>
          </section>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : sortedRestaurants.length === 0 ? (
          <section className="grid place-items-center rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center shadow-soft">
            <Navigation className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-black">No restaurants within 40 km yet</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              Try again after refreshing location or search manually.
            </p>
          </section>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sortedRestaurants.map(({ restaurant, distance }) => (
              <RestaurantCard
                key={restaurant.id}
                r={restaurant}
                distanceLabel={formatDistance(distance)}
                compact
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
