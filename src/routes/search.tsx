import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon, ArrowLeft, Star, Clock, MapPin } from "lucide-react";
import { FILES, readTable } from "@/lib/csv-store";
import type { Meal, Restaurant } from "@/lib/seed";
import { z } from "zod";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: searchSchema,
});

function SearchPage() {
  const { q: initial } = Route.useSearch();
  const [q, setQ] = useState(initial ?? "");

  const restaurants = useMemo(() => readTable<Restaurant>(FILES.restaurants), []);
  const meals = useMemo(() => readTable<Meal>(FILES.meals), []);
  const term = q.trim().toLowerCase();

  const results = !term
    ? restaurants
    : restaurants.filter((r) => {
        const haystack = `${r.name} ${r.cuisine} ${r.tags} ${r.description}`.toLowerCase();
        if (haystack.includes(term)) return true;
        // also match if any of its meals match the term
        return meals.some((m) => m.restaurantId === r.id && (m.name + " " + m.category + " " + m.description).toLowerCase().includes(term));
      });

  return (
    <div>
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link to="/discover" className="grid h-9 w-9 place-items-center rounded-full bg-card shadow-soft"><ArrowLeft className="h-4 w-4" /></Link>
          <label className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search restaurants, cuisines, dishes…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </label>
        </div>
      </header>

      <main className="px-4 pt-4">
        <p className="text-xs text-muted-foreground">{results.length} {results.length === 1 ? "restaurant" : "restaurants"}</p>
        <div className="mt-3 space-y-3">
          {results.map((r) => {
            const items = meals.filter((m) => m.restaurantId === r.id);
            return (
              <Link
                key={r.id}
                to="/restaurant/$restaurantId"
                params={{ restaurantId: r.id }}
                className="group flex gap-3 overflow-hidden rounded-2xl bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-card animate-slide-up"
              >
                <div className="relative h-24 w-28 shrink-0 overflow-hidden bg-muted">
                  <img src={r.image} alt={r.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                  {r.isOpen === "0" && (
                    <span className="absolute left-1 top-1 rounded-full bg-destructive/95 px-1.5 py-0.5 text-[9px] font-bold text-destructive-foreground">Closed</span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between py-2.5 pr-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 text-sm font-bold">{r.name}</h3>
                      <span className="flex shrink-0 items-center gap-0.5 rounded-md bg-success/10 px-1.5 py-0.5 text-xs font-bold text-success">
                        <Star className="h-3 w-3 fill-current" />{r.rating}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-[11px] text-muted-foreground">{r.cuisine} · {items.length} dishes</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{r.prepTime}m</span>
                    <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{r.distance}km</span>
                    <span>· {r.reviews} reviews</span>
                  </div>
                </div>
              </Link>
            );
          })}
          {results.length === 0 && (
            <div className="grid place-items-center px-6 pt-20 text-center">
              <div className="text-5xl">🔎</div>
              <p className="mt-3 text-sm font-semibold">No restaurants match "{q}"</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a different cuisine or dish name.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
