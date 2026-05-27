import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Star, Clock, MapPin, Phone } from "lucide-react";
import { useMemo } from "react";
import { FILES, readTable } from "@/lib/csv-store";
import type { Meal, Restaurant } from "@/lib/seed";
import { MealCard } from "@/components/MealCard";

export const Route = createFileRoute("/restaurant/$restaurantId")({ component: RestaurantPage });

function RestaurantPage() {
  const { restaurantId } = Route.useParams();
  const restaurant = useMemo(
    () => readTable<Restaurant>(FILES.restaurants).find((r) => r.id === restaurantId),
    [restaurantId],
  );
  const meals = useMemo(
    () => readTable<Meal>(FILES.meals).filter((m) => m.restaurantId === restaurantId),
    [restaurantId],
  );

  if (!restaurant) return <div className="p-8 text-center text-sm">Restaurant not found.</div>;

  const popular = meals.filter((m) => m.popular === "1");
  const others = meals.filter((m) => m.popular !== "1");

  return (
    <div>
      <div className="relative h-56 overflow-hidden">
        <img src={restaurant.image} alt={restaurant.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-black/30" />
        <Link to="/discover" className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-soft">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>
      </div>

      <div className="-mt-10 px-4">
        <div className="rounded-3xl bg-card p-5 shadow-card animate-slide-up">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold">{restaurant.name}</h1>
              <p className="text-sm text-muted-foreground">{restaurant.cuisine} cuisine</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-lg bg-success/10 px-2 py-1 text-sm font-bold text-success">
              <Star className="h-3.5 w-3.5 fill-current" />{restaurant.rating}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{restaurant.prepTime} min prep</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{restaurant.distance} km away</span>
            <span>· {restaurant.reviews} reviews</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {restaurant.tags.split("|").map((t) => (
              <span key={t} className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">{t}</span>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button className="flex-1 rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">Order now</button>
            <button className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
              <Phone className="h-4 w-4" />
            </button>
          </div>
        </div>

        {popular.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-3 text-base font-bold">🔥 Popular dishes</h3>
            <div className="space-y-2.5">
              {popular.map((m) => <MealCard key={m.id} meal={m} />)}
            </div>
          </section>
        )}

        {others.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-3 text-base font-bold">Full menu</h3>
            <div className="space-y-2.5">
              {others.map((m) => <MealCard key={m.id} meal={m} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
