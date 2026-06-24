import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Loader2, MapPin, MessageSquare, Phone, Send, Star } from "lucide-react";
import { useEffect, useState } from "react";

import { MealCard } from "@/components/MealCard";
import { backend } from "@/lib/backend";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import type { Meal, Restaurant, Review } from "@/lib/seed";

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
    Promise.all([backend.restaurants(), backend.meals(), backend.reviews()]).then(([restaurants, allMeals, allReviews]) => {
      if (cancelled) return;
      const restaurantMeals = allMeals.filter((m) => m.restaurantId === restaurantId);
      const mealIds = new Set(restaurantMeals.map((m) => m.id));
      setRestaurant(restaurants.find((r) => r.id === restaurantId));
      setMeals(restaurantMeals);
      setReviews(
        allReviews
          .filter((r) => r.restaurantId === restaurantId || mealIds.has(r.mealId))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      );
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  if (loading) return <RestaurantLoading />;
  if (!restaurant) return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div>
        <p className="text-sm font-bold">Restaurant not found</p>
        <Link to="/discover" className="mt-4 inline-flex rounded-full bg-gradient-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-glow">
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
      notify("error", "Write a short comment before sending feedback", { id: "review-comment-required" });
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
        <Link to="/discover" className="grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-soft">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>
        <div className="mx-auto mt-8 max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">{restaurant.cuisine}</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-black leading-tight lg:text-5xl">{restaurant.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">{restaurant.description}</p>
        </div>
      </div>

      <div className="-mt-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-card p-5 shadow-card animate-slide-up">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold">{restaurant.name}</h1>
              <p className="text-sm text-muted-foreground">{restaurant.cuisine} cuisine</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-lg bg-success/10 px-2 py-1 text-sm font-bold text-success">
              <Star className="h-3.5 w-3.5 fill-current" />
              {avgRating}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{restaurant.prepTime} min prep</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{restaurant.distance} km away</span>
            {restaurant.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{restaurant.address}</span>}
            <span>{reviews.length} reviews</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {restaurant.tags.split("|").filter(Boolean).map((t) => (
              <span key={t} className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">{t}</span>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setTab("menu")} className="flex-1 rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
              View menu
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
              <Phone className="h-4 w-4" />
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

        {restaurant.address && (
          <section className="mt-4 rounded-2xl bg-card p-3 shadow-soft">
            <p className="text-sm font-semibold">Pickup location</p>
            <p className="text-xs text-muted-foreground">{restaurant.address}</p>
          </section>
        )}

        {tab === "menu" ? (
          <MenuSection meals={meals} closed={closed} />
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

function MenuSection({ meals, closed }: { meals: Meal[]; closed: boolean }) {
  return (
    <section className="mt-6">
      <h3 className="mb-3 text-base font-bold">Menu</h3>
      {meals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
          <p className="text-sm font-semibold">No menu items yet</p>
          <p className="mt-1 text-xs text-muted-foreground">This restaurant has not published a menu.</p>
        </div>
      ) : (
        <div className="grid gap-2.5 lg:grid-cols-2">
          {meals.map((m) => <MealCard key={m.id} meal={m} />)}
        </div>
      )}
    </section>
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
              <Star className={`h-5 w-5 ${value <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
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
                  <p className="text-[11px] text-muted-foreground">{new Date(review.createdAt).toLocaleString()}</p>
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
