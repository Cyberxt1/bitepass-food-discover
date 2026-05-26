import { Link } from "@tanstack/react-router";
import { Star, Clock, Flame } from "lucide-react";
import type { Meal } from "@/lib/seed";
import { naira } from "@/lib/format";

export function MealCard({ meal, restaurantName }: { meal: Meal; restaurantName?: string }) {
  return (
    <Link
      to="/meal/$mealId"
      params={{ mealId: meal.id }}
      className="group flex gap-3 rounded-2xl bg-card p-3 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
        <img src={meal.image} alt={meal.name} loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
        {meal.popular === "1" && (
          <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-gradient-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
            <Flame className="h-2.5 w-2.5" /> HOT
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold">{meal.name}</h3>
          {restaurantName && <p className="text-xs text-muted-foreground">{restaurantName}</p>}
          <p className="line-clamp-1 text-xs text-muted-foreground">{meal.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-warning text-warning" />{meal.rating}</span>
            <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{meal.prepTime}m</span>
          </div>
          <span className="text-sm font-bold text-primary">{naira(meal.price)}</span>
        </div>
      </div>
    </Link>
  );
}
