import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Flame, Loader2, Trash2 } from "lucide-react";
import { backend } from "@/lib/backend";
import { useAuth } from "@/lib/auth";
import { naira } from "@/lib/format";
import { notify } from "@/lib/notifications";
import type { Meal, Restaurant } from "@/lib/seed";

export const Route = createFileRoute("/cravings")({ component: CravingsPage });

function parseLikedMealIds(value?: string) {
  try {
    return value ? (JSON.parse(value) as string[]) : [];
  } catch {
    return [];
  }
}

function CravingsPage() {
  const { user, updateProfile } = useAuth();
  const nav = useNavigate();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");

  useEffect(() => {
    if (!user) {
      nav({ to: "/login", replace: true });
      return;
    }

    const key = `bitepass:liked-meals:${user.id}`;
    const localIds = parseLikedMealIds(window.localStorage.getItem(key) ?? undefined);
    const accountIds = parseLikedMealIds(user.likedMealIds);
    setLikedIds([...new Set([...localIds, ...accountIds])]);
  }, [nav, user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [nextMeals, nextRestaurants] = await Promise.all([
        backend.meals(),
        backend.restaurants(),
      ]);
      if (cancelled) return;
      setMeals(nextMeals);
      setRestaurants(nextRestaurants);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const restaurantById = useMemo(
    () => new Map(restaurants.map((restaurant) => [restaurant.id, restaurant])),
    [restaurants],
  );
  const likedMeals = likedIds
    .map((id) => meals.find((meal) => meal.id === id))
    .filter((meal): meal is Meal => Boolean(meal));

  const removeCraving = async (meal: Meal) => {
    if (!user || removingId) return;
    setRemovingId(meal.id);
    const nextIds = likedIds.filter((id) => id !== meal.id);
    try {
      window.localStorage.setItem(`bitepass:liked-meals:${user.id}`, JSON.stringify(nextIds));
      await updateProfile({ likedMealIds: JSON.stringify(nextIds) });
      setLikedIds(nextIds);
      notify("info", `${meal.name} removed from cravings`, {
        id: `craving-remove:${meal.id}`,
        persist: false,
      });
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Could not update cravings", {
        id: `craving-remove-error:${meal.id}`,
      });
    } finally {
      setRemovingId("");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/profile"
            className="grid h-9 w-9 place-items-center rounded-full bg-card shadow-soft"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-base font-black">My cravings</h1>
            <p className="text-xs text-muted-foreground">Meals you saved for later</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid min-h-[45vh] place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : likedMeals.length === 0 ? (
          <section className="grid place-items-center rounded-3xl border border-dashed border-border bg-card px-5 py-14 text-center shadow-soft">
            <Flame className="h-9 w-9 text-muted-foreground" />
            <p className="mt-4 text-base font-black">No cravings saved yet</p>
            <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
              Tap the flame on any meal inside a restaurant menu and it will show here.
            </p>
            <Link
              to="/discover"
              className="mt-5 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-black text-primary-foreground shadow-glow"
            >
              Find meals
            </Link>
          </section>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {likedMeals.map((meal) => {
              const restaurant = restaurantById.get(meal.restaurantId);
              return (
                <article key={meal.id} className="overflow-hidden rounded-2xl bg-card shadow-soft">
                  <Link to="/meal/$mealId" params={{ mealId: meal.id }} className="block">
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      {meal.image ? (
                        <img src={meal.image} alt={meal.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center px-5 text-center text-sm font-black">
                          {meal.name}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-1 text-sm font-black">{meal.name}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {restaurant?.name ?? "Restaurant"}
                      </p>
                      <p className="mt-2 text-sm font-black text-primary">{naira(meal.price)}</p>
                    </div>
                  </Link>
                  <div className="border-t border-border p-2">
                    <button
                      type="button"
                      onClick={() => void removeCraving(meal)}
                      disabled={Boolean(removingId)}
                      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 text-xs font-black text-destructive transition active:scale-95 disabled:opacity-60"
                    >
                      {removingId === meal.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
