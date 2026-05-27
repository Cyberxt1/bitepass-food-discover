import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, TrendingUp, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { FILES, readTable } from "@/lib/csv-store";
import type { Meal, Restaurant } from "@/lib/seed";
import { AppHeader } from "@/components/AppHeader";
import { RestaurantCard } from "@/components/RestaurantCard";
import { MealCard } from "@/components/MealCard";
import { SkeletonCard } from "@/components/SkeletonCard";

export const Route = createFileRoute("/discover")({ component: Discover });

const categories = [
  { name: "Jollof", emoji: "🍚" },
  { name: "Shawarma", emoji: "🌯" },
  { name: "Burgers", emoji: "🍔" },
  { name: "Swallow", emoji: "🍲" },
  { name: "Soup", emoji: "🥣" },
  { name: "Noodles", emoji: "🍜" },
  { name: "Drinks", emoji: "🥤" },
];

function Discover() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setRestaurants(readTable<Restaurant>(FILES.restaurants));
      setMeals(readTable<Meal>(FILES.meals));
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const trending = meals.filter((m) => m.popular === "1").slice(0, 6);
  const recommended = meals.slice(0, 4);

  return (
    <>
      <AppHeader />
      <main className="space-y-6 px-4 pt-4">
        <Link to="/search" className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft animate-slide-up">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search restaurants…</span>
        </Link>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-warm p-5 text-white shadow-glow animate-slide-up">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
              <Sparkles className="h-3 w-3" /> Limited time
            </span>
            <h2 className="mt-2 text-xl font-bold leading-tight">Preorder lunch.<br />Skip the 30-min queue.</h2>
            <p className="mt-1 text-xs text-white/85">Get 15% off your first preorder with code BITE15</p>
          </div>
        </div>

        <section>
          <h3 className="mb-3 text-base font-bold">Categories</h3>
          <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4">
            {categories.map((c) => (
              <Link
                key={c.name}
                to="/search"
                search={{ q: c.name }}
                className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 rounded-2xl bg-card p-3 shadow-soft transition hover:-translate-y-0.5"
              >
                <span className="text-2xl">{c.emoji}</span>
                <span className="text-[11px] font-medium">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-base font-bold">
              <TrendingUp className="h-4 w-4 text-primary" /> Trending now
            </h3>
            <Link to="/search" className="flex items-center text-xs font-medium text-primary">
              See all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="w-44 shrink-0"><SkeletonCard /></div>)
              : trending.map((m) => (
                  <Link key={m.id} to="/meal/$mealId" params={{ mealId: m.id }}
                    className="group block w-44 shrink-0 overflow-hidden rounded-2xl bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card"
                  >
                    <div className="h-28 overflow-hidden bg-muted">
                      <img src={m.image} alt={m.name} loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                    </div>
                    <div className="p-2.5">
                      <p className="line-clamp-1 text-xs font-semibold">{m.name}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">⭐ {m.rating}</span>
                        <span className="text-xs font-bold text-primary">₦{Number(m.price).toLocaleString()}</span>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-base font-bold">Nearby restaurants</h3>
          <div className="grid grid-cols-2 gap-3">
            {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : restaurants.map((r) => <RestaurantCard key={r.id} r={r} />)}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-base font-bold">Recommended for you</h3>
          <div className="space-y-2.5">
            {(loading ? [] : recommended).map((m) => {
              const rest = restaurants.find((r) => r.id === m.restaurantId);
              return <MealCard key={m.id} meal={m} restaurantName={rest?.name} />;
            })}
          </div>
        </section>
      </main>
    </>
  );
}
