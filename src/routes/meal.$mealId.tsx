import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Star, Clock, Plus, Minus, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FILES, readTable } from "@/lib/csv-store";
import type { Meal, Restaurant, Review } from "@/lib/seed";
import { useCart } from "@/lib/cart";
import { naira } from "@/lib/format";

export const Route = createFileRoute("/meal/$mealId")({ component: MealPage });

function MealPage() {
  const { mealId } = Route.useParams();
  const nav = useNavigate();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  const meal = useMemo(() => readTable<Meal>(FILES.meals).find((m) => m.id === mealId), [mealId]);
  const restaurant = useMemo(
    () => (meal ? readTable<Restaurant>(FILES.restaurants).find((r) => r.id === meal.restaurantId) : undefined),
    [meal],
  );
  const reviews = useMemo(
    () => readTable<Review>(FILES.reviews).filter((r) => r.mealId === mealId),
    [mealId],
  );

  if (!meal) return <div className="p-8 text-center text-sm">Meal not found.</div>;

  const addToCart = () => {
    add({
      mealId: meal.id, name: meal.name, price: Number(meal.price), image: meal.image,
      restaurantId: meal.restaurantId, restaurantName: restaurant?.name ?? "", qty, notes,
    });
    toast.success(`${qty} × ${meal.name} added to cart`);
    nav({ to: "/cart" });
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length).toFixed(1)
    : meal.rating;

  return (
    <div className="pb-32">
      <div className="relative h-64 overflow-hidden">
        <img src={meal.image} alt={meal.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-black/20" />
        <Link to="/discover" className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-soft">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>
      </div>

      <div className="-mt-8 rounded-t-3xl bg-background px-4 pt-5">
        <h1 className="text-2xl font-bold">{meal.name}</h1>
        {restaurant && (
          <Link to="/restaurant/$restaurantId" params={{ restaurantId: restaurant.id }}
            className="mt-1 inline-block text-sm text-primary">{restaurant.name} →</Link>
        )}
        <div className="mt-3 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 font-semibold"><Star className="h-4 w-4 fill-warning text-warning" />{avgRating}</span>
          <span className="text-muted-foreground">({reviews.length} reviews)</span>
          <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" />{meal.prepTime} min</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{meal.description}</p>

        {/* Quantity & notes */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-card p-3 shadow-soft">
            <span className="text-sm font-semibold">Quantity</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setQty(Math.max(1, qty - 1))}
                className="grid h-8 w-8 place-items-center rounded-full border border-border"><Minus className="h-3.5 w-3.5" /></button>
              <span className="w-6 text-center text-base font-bold">{qty}</span>
              <button onClick={() => setQty(qty + 1)}
                className="grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow"><Plus className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Add special instructions (e.g. extra spicy, no onions)…"
            className="w-full resize-none rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
            rows={2}
          />
        </div>

        {/* Reviews */}
        <section className="mt-7">
          <h3 className="text-base font-bold">What people say about this dish</h3>
          <p className="text-xs text-muted-foreground">Reviews are tied to the meal, not just the restaurant.</p>

          {reviews.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No reviews yet for this dish.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{r.userName}</p>
                      <p className="text-[11px] text-muted-foreground">{r.createdAt}</p>
                    </div>
                    <span className="flex items-center gap-0.5 rounded-md bg-success/10 px-1.5 py-0.5 text-xs font-bold text-success">
                      <Star className="h-3 w-3 fill-current" />{r.rating}.0
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{r.comment}</p>
                  <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
                    <Tag label="Taste" value={r.taste} />
                    <Tag label="Portion" value={r.portion} />
                    <Tag label="Spice" value={r.spice} />
                    <Tag label="Wait" value={r.waitTime} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-16 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4 pb-3">
        <button onClick={addToCart}
          className="flex w-full items-center justify-between rounded-2xl bg-gradient-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-95"
        >
          <span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Add to cart</span>
          <span>{naira(Number(meal.price) * qty)}</span>
        </button>
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
