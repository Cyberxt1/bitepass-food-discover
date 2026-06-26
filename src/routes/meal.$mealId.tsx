import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Star, Clock, Plus, Minus, ShoppingBag, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { backend } from "@/lib/backend";
import type { Meal, Restaurant, Review } from "@/lib/seed";
import { useCart } from "@/lib/cart";
import { naira } from "@/lib/format";
import { parseMealOptions, type MealOption } from "@/lib/meal-options";
import { RouteLoadingOverlay } from "@/components/RouteLoadingOverlay";
import { notify } from "@/lib/notifications";

type SelectedMealOption = MealOption & { qty: number };

export const Route = createFileRoute("/meal/$mealId")({ component: MealPage });

function MealPage() {
  const { mealId } = Route.useParams();
  const { add, items } = useCart();
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [meal, setMeal] = useState<Meal | undefined>();
  const [restaurant, setRestaurant] = useState<Restaurant | undefined>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<SelectedMealOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const updateQty = (value: number) => {
    if (!Number.isFinite(value)) return;
    setQty(Math.max(1, Math.min(99, Math.floor(value))));
  };

  useEffect(() => {
    Promise.all([backend.meals(), backend.restaurants(), backend.reviews()]).then(
      ([allMeals, restaurants, allReviews]) => {
        const nextMeal = allMeals.find((entry) => entry.id === mealId);
        setMeal(nextMeal);
        setRestaurant(
          nextMeal ? restaurants.find((entry) => entry.id === nextMeal.restaurantId) : undefined,
        );
        setReviews(allReviews.filter((review) => review.mealId === mealId));
        setLoading(false);
      },
    );
  }, [mealId]);

  if (loading || !meal) return <RouteLoadingOverlay visible />;

  const options = parseMealOptions(meal.options);
  const optionsTotal = selectedOptions.reduce((sum, option) => sum + option.price * option.qty, 0);
  const unitPrice = Number(meal.price) + optionsTotal;

  const toggleOption = (option: MealOption) => {
    setSelectedOptions((prev) =>
      prev.some((item) => item.id === option.id)
        ? prev.filter((item) => item.id !== option.id)
        : [...prev, { ...option, qty: 1 }],
    );
  };

  const setOptionQty = (option: MealOption, nextQty: number) => {
    setSelectedOptions((prev) => {
      if (nextQty <= 0) return prev.filter((item) => item.id !== option.id);
      const current = prev.find((item) => item.id === option.id);
      if (!current) return [...prev, { ...option, qty: nextQty }];
      return prev.map((item) => (item.id === option.id ? { ...item, qty: nextQty } : item));
    });
  };

  const addToCart = () => {
    if (addingToCart) return;
    if (restaurant?.isOpen === "0") {
      notify("error", "This restaurant is closed right now", { id: "meal-restaurant-closed" });
      return;
    }
    if (items.length > 0 && items.some((item) => item.restaurantId !== meal.restaurantId)) {
      notify("error", "Finish or clear your current cart before ordering from another restaurant", {
        id: "meal-mixed-restaurant-cart",
      });
      return;
    }
    setAddingToCart(true);
    const optionsSignature = selectedOptions
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((option) => `${option.id}:${option.qty}`)
      .join("|");
    const noteSignature = notes.trim();
    add({
      id: `${meal.id}::${optionsSignature}::${noteSignature}`,
      mealId: meal.id,
      name: meal.name,
      price: unitPrice,
      basePrice: Number(meal.price),
      servingUnit: meal.servingUnit,
      image: meal.image,
      restaurantId: meal.restaurantId,
      restaurantName: restaurant?.name ?? "",
      qty,
      notes,
      options: selectedOptions,
    });
    notify("success", `${qty} x ${meal.name} added to cart`, {
      id: `cart-add:${meal.id}:${optionsSignature}:${noteSignature}`,
    });
    setAddedToCart(true);
    window.setTimeout(() => {
      setAddingToCart(false);
      setAddedToCart(false);
    }, 1200);
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length).toFixed(1)
    : meal.rating;

  return (
    <div className="overflow-x-hidden pb-32 lg:pb-10">
      <div className="relative h-64 bg-muted sm:h-80">
        {meal.image ? (
          <img src={meal.image} alt={meal.name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center bg-[linear-gradient(135deg,oklch(0.93_0.04_75),oklch(0.86_0.12_42))] px-6 text-center">
            <span className="text-3xl font-black leading-tight">{meal.name}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        <Link
          to="/discover"
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-soft lg:left-8"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>
      </div>

      <div className="relative z-10 mx-auto -mt-3 max-w-3xl rounded-t-3xl bg-background px-4 pt-5 shadow-[0_-10px_30px_rgba(0,0,0,0.04)] sm:px-6 sm:pt-6 lg:mt-0 lg:px-8 lg:shadow-none">
        <main className="min-w-0">
          <h1 className="break-words text-2xl font-bold leading-tight">{meal.name}</h1>
          {restaurant && (
            <Link
              to="/restaurant/$restaurantId"
              params={{ restaurantId: restaurant.id }}
              className="mt-1 inline-block text-sm text-primary"
            >
              {restaurant.name} -
            </Link>
          )}
          {restaurant?.isOpen === "0" && (
            <p className="mt-2 inline-flex rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
              Restaurant is closed
            </p>
          )}
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 font-semibold">
              <Star className="h-4 w-4 fill-warning text-warning" />
              {avgRating}
            </span>
            <span className="text-muted-foreground">({reviews.length} reviews)</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {meal.prepTime} min
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{meal.description}</p>
          <div className="mt-4 rounded-2xl bg-card p-3 shadow-soft">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Base serving
            </p>
            <p className="mt-1 text-sm font-bold text-primary">
              {naira(meal.price)} per {meal.servingUnit ?? "serving"}
            </p>
          </div>

          {options.length > 0 && (
            <section className="mt-5">
              <h3 className="text-sm font-bold">Servings and extras</h3>
              <div className="mt-2 space-y-2">
                {options.map((option) => {
                  const selected = selectedOptions.find((item) => item.id === option.id);
                  return (
                    <div
                      key={option.id}
                      className={`min-w-0 rounded-2xl border p-3 transition ${selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                    >
                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={() => toggleOption(option)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className="block break-words text-sm font-semibold leading-5">
                            {option.name}
                          </span>
                          <span className="mt-1 block text-sm font-bold text-primary">
                            + {naira(option.price)} each
                          </span>
                        </button>
                        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setOptionQty(option, (selected?.qty ?? 0) - 1)}
                            className="grid h-8 w-8 place-items-center rounded-full border border-border"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-5 text-center text-sm font-bold">
                            {selected?.qty ?? 0}
                          </span>
                          <button
                            type="button"
                            onClick={() => setOptionQty(option, (selected?.qty ?? 0) + 1)}
                            className="grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-primary-foreground"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-card p-3 shadow-soft">
              <span className="text-sm font-semibold">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQty(qty - 1)}
                  className="grid h-8 w-8 place-items-center rounded-full border border-border"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={99}
                  inputMode="numeric"
                  value={qty}
                  onChange={(event) => updateQty(Number(event.target.value))}
                  className="h-9 w-16 rounded-xl border border-border bg-background text-center text-sm font-black outline-none focus:border-primary"
                  aria-label="Quantity"
                />
                <button
                  onClick={() => updateQty(qty + 1)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add special instructions (e.g. extra spicy, no onions)..."
              className="w-full resize-none rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
              rows={2}
            />
          </div>

          <section className="mt-7">
            <h3 className="text-base font-bold">What people say about this dish</h3>
            <p className="text-xs text-muted-foreground">
              Reviews are tied to the meal, not just the restaurant.
            </p>

            {reviews.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No reviews yet for this dish.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-border bg-card p-4 shadow-soft"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{review.userName}</p>
                        <p className="text-[11px] text-muted-foreground">{review.createdAt}</p>
                      </div>
                      <span className="flex items-center gap-0.5 rounded-md bg-success/10 px-1.5 py-0.5 text-xs font-bold text-success">
                        <Star className="h-3 w-3 fill-current" />
                        {review.rating}.0
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{review.comment}</p>
                    <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
                      <Tag label="Taste" value={review.taste} />
                      <Tag label="Portion" value={review.portion} />
                      <Tag label="Spice" value={review.spice} />
                      <Tag label="Wait" value={review.waitTime} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <div className="fixed bottom-16 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4 pb-3 lg:bottom-6 lg:left-auto lg:right-8 lg:max-w-sm lg:translate-x-0">
        <button
          onClick={addToCart}
          disabled={restaurant?.isOpen === "0" || addingToCart}
          className={`flex w-full items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-95 disabled:opacity-70 ${
            addedToCart ? "bg-success" : "bg-gradient-primary"
          }`}
        >
          <span className="flex items-center gap-2">
            {addedToCart ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
            {addedToCart ? "Added to cart" : addingToCart ? "Adding..." : "Add to cart"}
          </span>
          <span>{naira(unitPrice * qty)}</span>
        </button>
        {items.length > 0 && (
          <Link
            to="/cart"
            className="mt-2 flex w-full items-center justify-center rounded-2xl border border-border bg-background py-2.5 text-xs font-black shadow-soft transition hover:bg-muted"
          >
            View cart
          </Link>
        )}
      </div>
    </div>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted px-2 py-1">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
