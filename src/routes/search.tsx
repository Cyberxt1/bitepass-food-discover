import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon, ArrowLeft } from "lucide-react";
import { FILES, readTable } from "@/lib/csv-store";
import type { Meal, Restaurant } from "@/lib/seed";
import { MealCard } from "@/components/MealCard";
import { z } from "zod";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: searchSchema,
});

function SearchPage() {
  const { q: initial } = Route.useSearch();
  const [q, setQ] = useState(initial ?? "");

  const meals = useMemo(() => readTable<Meal>(FILES.meals), []);
  const restaurants = useMemo(() => readTable<Restaurant>(FILES.restaurants), []);
  const term = q.trim().toLowerCase();
  const results = !term ? meals : meals.filter((m) =>
    m.name.toLowerCase().includes(term) || m.category.toLowerCase().includes(term) || m.description.toLowerCase().includes(term),
  );

  return (
    <div>
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link to="/" className="grid h-9 w-9 place-items-center rounded-full bg-card shadow-soft"><ArrowLeft className="h-4 w-4" /></Link>
          <label className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search meals, cuisines…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </label>
        </div>
      </header>

      <main className="px-4 pt-4">
        <p className="text-xs text-muted-foreground">{results.length} {results.length === 1 ? "result" : "results"}</p>
        <div className="mt-3 space-y-2.5">
          {results.map((m) => (
            <MealCard key={m.id} meal={m} restaurantName={restaurants.find((r) => r.id === m.restaurantId)?.name} />
          ))}
        </div>
      </main>
    </div>
  );
}
