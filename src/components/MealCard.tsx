import { Link } from "@tanstack/react-router";
import { Star, Clock, Flame } from "lucide-react";
import type { Meal } from "@/lib/seed";
import { naira } from "@/lib/format";

export function MealCard({
  meal,
  restaurantName,
  hideImage = false,
  onQuickView,
}: {
  meal: Meal;
  restaurantName?: string;
  hideImage?: boolean;
  onQuickView?: (meal: Meal) => void;
}) {
  const content = (
    <>
      {!hideImage && (
        <div className="mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-muted">
          {meal.image ? (
            <img
              src={meal.image}
              alt={meal.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center bg-[linear-gradient(135deg,oklch(0.93_0.04_75),oklch(0.86_0.12_42))] px-4 text-center">
              <span className="text-sm font-black leading-tight text-foreground">{meal.name}</span>
            </div>
          )}
        </div>
      )}
      <div className="flex min-w-0 flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-sm font-semibold">{meal.name}</h3>
            {meal.popular === "1" && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-gradient-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                <Flame className="h-2.5 w-2.5" /> HOT
              </span>
            )}
          </div>
          {restaurantName && <p className="text-xs text-muted-foreground">{restaurantName}</p>}
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {meal.description}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-warning text-warning" />
              {meal.rating}
            </span>
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {meal.prepTime}m
            </span>
          </div>
          <span className="text-sm font-bold text-primary">
            {naira(meal.price)}
            {meal.servingUnit && (
              <span className="text-[10px] font-semibold text-muted-foreground">
                /{meal.servingUnit}
              </span>
            )}
          </span>
        </div>
      </div>
    </>
  );

  const className =
    "group block w-full rounded-2xl bg-card p-3 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-card";

  if (onQuickView) {
    return (
      <button type="button" onClick={() => onQuickView(meal)} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link to="/meal/$mealId" params={{ mealId: meal.id }} className={className}>
      {content}
    </Link>
  );
}
