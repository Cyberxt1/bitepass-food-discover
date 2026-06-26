import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Clock,
  Flame,
  Loader2,
  MapPin,
  MessageSquare,
  Send,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { backend } from "@/lib/backend";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import type { Meal, Restaurant, Review } from "@/lib/seed";
import { naira } from "@/lib/format";
import { shortLocationLabel } from "@/lib/location";
import { useCart } from "@/lib/cart";
import { isMealPublic, isRestaurantPublic } from "@/lib/platform";

export const Route = createFileRoute("/restaurant/$restaurantId")({ component: RestaurantPage });

function RestaurantPage() {
  const { restaurantId } = Route.useParams();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | undefined>();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"menu" | "reviews">("menu");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([backend.restaurants(), backend.meals(), backend.reviews()])
      .then(([restaurants, allMeals, allReviews]) => {
        if (cancelled) return;
        const nextRestaurant = restaurants.find((r) => r.id === restaurantId);
        const restaurantMeals = allMeals.filter(
          (m) => m.restaurantId === restaurantId && isMealPublic(m),
        );
        const mealIds = new Set(restaurantMeals.map((m) => m.id));
        setRestaurant(
          nextRestaurant && isRestaurantPublic(nextRestaurant) ? nextRestaurant : undefined,
        );
        setMeals(restaurantMeals);
        setReviews(
          allReviews
            .filter((r) => r.restaurantId === restaurantId || mealIds.has(r.mealId))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        );
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  if (loading) return <RestaurantLoading />;
  if (!restaurant)
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div>
          <p className="text-sm font-bold">Restaurant not found</p>
          <Link
            to="/discover"
            className="mt-4 inline-flex rounded-full bg-gradient-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-glow"
          >
            Back to discover
          </Link>
        </div>
      </div>
    );

  const avgRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length).toFixed(1)
    : restaurant.rating;
  const closed = restaurant.isOpen === "0";

  const submitReview = async () => {
    if (submitting) return;
    if (!user) {
      notify("info", "Please sign in to leave feedback", { id: "review-login-required" });
      return;
    }
    if (!comment.trim()) {
      notify("error", "Write a short comment before sending feedback", {
        id: "review-comment-required",
      });
      return;
    }

    setSubmitting(true);
    try {
      const review: Review = {
        id: "rv" + Date.now(),
        mealId: "",
        restaurantId,
        userId: user.id,
        userName: user.name,
        rating: String(rating),
        taste: "",
        portion: "",
        spice: "",
        waitTime: "",
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      };
      await backend.addReview(review);
      setReviews((prev) => [review, ...prev]);
      setComment("");
      setRating(5);
      notify("success", "Thanks for the feedback", { id: `review-success:${restaurantId}` });
    } catch {
      notify("error", "Feedback could not be sent", { id: `review-error:${restaurantId}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="relative bg-[linear-gradient(135deg,oklch(0.2_0.04_45),oklch(0.46_0.14_36))] px-4 pb-16 pt-4 text-white lg:px-8 lg:pb-20">
        <Link
          to="/discover"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-soft"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>
        <div className="mx-auto mt-8 max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
            {restaurant.cuisine}
          </p>
          <h1 className="mt-2 max-w-2xl text-3xl font-black leading-tight lg:text-5xl">
            {restaurant.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">{restaurant.description}</p>
        </div>
      </div>

      <div className="-mt-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-card p-5 shadow-card animate-slide-up">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">{restaurant.name}</h1>
                {restaurant.verificationStatus === "verified" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-[10px] font-black text-success">
                    <Check className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{restaurant.cuisine} cuisine</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-lg bg-success/10 px-2 py-1 text-sm font-bold text-success">
              <Star className="h-3.5 w-3.5 fill-current" />
              {avgRating}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {restaurant.prepTime} min prep
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {restaurant.distance} km away
            </span>
            {restaurant.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {shortLocationLabel(restaurant.address)}
              </span>
            )}
            <span>{reviews.length} reviews</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {restaurant.tags
              .split("|")
              .filter(Boolean)
              .map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground"
                >
                  {t}
                </span>
              ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setTab("menu")}
              className="flex-1 rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              View menu
            </button>
          </div>
          {closed && (
            <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
              This restaurant is closed. Ordering is disabled until it opens again.
            </p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-card p-1 shadow-soft">
          <button
            type="button"
            onClick={() => setTab("menu")}
            className={`rounded-xl py-2 text-xs font-bold transition ${tab === "menu" ? "bg-gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground"}`}
          >
            Menu
          </button>
          <button
            type="button"
            onClick={() => setTab("reviews")}
            className={`rounded-xl py-2 text-xs font-bold transition ${tab === "reviews" ? "bg-gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground"}`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {tab === "menu" ? (
          <MenuSection meals={meals} restaurant={restaurant} closed={closed} />
        ) : (
          <ReviewsSection
            reviews={reviews}
            rating={rating}
            setRating={setRating}
            comment={comment}
            setComment={setComment}
            submitting={submitting}
            submitReview={submitReview}
          />
        )}
      </div>
    </div>
  );
}

function RestaurantLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div>
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm font-semibold">Loading restaurant...</p>
      </div>
    </div>
  );
}

function MenuSection({
  meals,
  restaurant,
  closed,
}: {
  meals: Meal[];
  restaurant: Restaurant;
  closed: boolean;
}) {
  const { user } = useAuth();
  const categories = Array.from(new Set(meals.map((meal) => meal.category || "Meals")));
  const [category, setCategory] = useState(categories[0] ?? "Meals");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [likedMealIds, setLikedMealIds] = useState<Set<string>>(new Set());
  const visibleMeals = meals.filter((meal) => (meal.category || "Meals") === category);

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(category)) setCategory(categories[0]);
  }, [categories, category]);

  useEffect(() => {
    const key = `bitepass:liked-meals:${user?.id ?? "guest"}`;
    try {
      const localIds = JSON.parse(window.localStorage.getItem(key) ?? "[]") as string[];
      const accountIds = user?.likedMealIds ? (JSON.parse(user.likedMealIds) as string[]) : [];
      setLikedMealIds(new Set([...localIds, ...accountIds]));
    } catch {
      setLikedMealIds(new Set());
    }
  }, [user?.id, user?.likedMealIds]);

  const toggleMealLike = (meal: Meal) => {
    const key = `bitepass:liked-meals:${user?.id ?? "guest"}`;
    setLikedMealIds((current) => {
      const next = new Set(current);
      const liked = next.has(meal.id);
      if (liked) next.delete(meal.id);
      else next.add(meal.id);
      window.localStorage.setItem(key, JSON.stringify([...next]));
      if (user) void backend.updateUser(user.id, { likedMealIds: JSON.stringify([...next]) });
      notify(
        liked ? "info" : "success",
        liked ? "Removed from cravings" : `${meal.name} saved to cravings`,
        {
          id: `meal-like:${meal.id}:${liked ? "off" : "on"}`,
          persist: false,
        },
      );
      return next;
    });
  };

  return (
    <section className="mt-6">
      <h3 className="mb-3 text-base font-bold">Menu</h3>
      {meals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
          <p className="text-sm font-semibold">No menu items yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This restaurant has not published a menu.
          </p>
        </div>
      ) : (
        <>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${
                  category === item
                    ? "bg-foreground text-background"
                    : "bg-card text-muted-foreground shadow-soft"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {visibleMeals.map((meal) => (
              <div
                key={meal.id}
                className="flex min-w-0 items-center gap-3 rounded-2xl bg-card p-2 text-left shadow-soft transition hover:bg-muted"
              >
                <button
                  type="button"
                  onClick={() => setSelectedMeal(meal)}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted text-left"
                >
                  {meal.image ? (
                    <img src={meal.image} alt={meal.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center px-2 text-center text-[10px] font-black">
                      {meal.name}
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMeal(meal)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="line-clamp-1 text-sm font-black">{meal.name}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{meal.description}</p>
                  <p className="mt-1 text-sm font-black text-primary">{naira(meal.price)}</p>
                </button>
                <button
                  type="button"
                  onClick={() => toggleMealLike(meal)}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition active:scale-95 ${
                    likedMealIds.has(meal.id)
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-label={
                    likedMealIds.has(meal.id) ? "Remove from cravings" : "Save to cravings"
                  }
                >
                  <Flame className={`h-4 w-4 ${likedMealIds.has(meal.id) ? "fill-current" : ""}`} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      {selectedMeal && (
        <MealDetailModal
          meal={selectedMeal}
          restaurant={restaurant}
          closed={closed}
          onClose={() => setSelectedMeal(null)}
        />
      )}
    </section>
  );
}

function MealDetailModal({
  meal,
  restaurant,
  closed,
  onClose,
}: {
  meal: Meal;
  restaurant: Restaurant;
  closed: boolean;
  onClose: () => void;
}) {
  const { add, items } = useCart();
  const [added, setAdded] = useState(false);

  const addMeal = () => {
    if (closed) {
      notify("error", "This restaurant is closed right now", { id: "restaurant-menu-closed" });
      return;
    }
    if (items.length > 0 && items.some((item) => item.restaurantId !== meal.restaurantId)) {
      notify("error", "Finish or clear your current cart before ordering from another restaurant", {
        id: "restaurant-menu-mixed-cart",
      });
      return;
    }

    add({
      id: `${meal.id}::::`,
      mealId: meal.id,
      name: meal.name,
      price: Number(meal.price),
      basePrice: Number(meal.price),
      servingUnit: meal.servingUnit,
      image: meal.image,
      restaurantId: meal.restaurantId,
      restaurantName: restaurant.name,
      qty: 1,
      notes: "",
      options: [],
    });
    setAdded(true);
    notify("success", `${meal.name} added to cart`, {
      id: `restaurant-menu-add:${meal.id}:${Date.now()}`,
    });
    window.setTimeout(() => setAdded(false), 1300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 px-4 pb-24 pt-10 backdrop-blur-sm sm:items-center sm:pb-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[1.5rem] bg-card p-4 shadow-card animate-slide-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
            {meal.image ? (
              <img src={meal.image} alt={meal.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-black leading-tight">{meal.name}</h3>
              <button
                type="button"
                onClick={onClose}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-sm font-black text-primary">{naira(meal.price)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{meal.reviewCount || "0"} reviews</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{meal.description}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
          <span className="rounded-full bg-muted px-2.5 py-1">{meal.category}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">{meal.prepTime} min</span>
          <span className="rounded-full bg-muted px-2.5 py-1">{meal.rating} rating</span>
        </div>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <button
            type="button"
            onClick={addMeal}
            disabled={closed}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black shadow-glow transition active:scale-95 disabled:opacity-60 ${
              added ? "bg-success text-white" : "bg-gradient-primary text-primary-foreground"
            }`}
          >
            {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
            {closed ? "Closed" : added ? "Added" : "Add to cart"}
          </button>
          <Link
            to="/meal/$mealId"
            params={{ mealId: meal.id }}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-black transition hover:bg-muted"
          >
            Customize
          </Link>
        </div>
      </div>
    </div>
  );
}

function ReviewsSection({
  reviews,
  rating,
  setRating,
  comment,
  setComment,
  submitting,
  submitReview,
}: {
  reviews: Review[];
  rating: number;
  setRating: (rating: number) => void;
  comment: string;
  setComment: (comment: string) => void;
  submitting: boolean;
  submitReview: () => void;
}) {
  return (
    <section className="mt-6 space-y-4">
      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-bold">
          <MessageSquare className="h-4 w-4 text-primary" />
          Leave feedback
        </div>
        <div className="mt-3 flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" onClick={() => setRating(value)} className="p-1">
              <Star
                className={`h-5 w-5 ${value <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`}
              />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was your experience with this restaurant?"
          rows={3}
          className="mt-3 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={submitReview}
          disabled={submitting}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-2.5 text-xs font-bold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          <Send className="h-3.5 w-3.5" />
          {submitting ? "Sending..." : "Send feedback"}
        </button>
      </div>

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
            <p className="text-sm font-semibold">No reviews yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Be the first to share feedback.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{review.userName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(review.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-2 py-1 text-xs font-bold text-success">
                  <Star className="h-3 w-3 fill-current" />
                  {review.rating}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
