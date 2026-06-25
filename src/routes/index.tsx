import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  Clock,
  CreditCard,
  MapPin,
  ShieldCheck,
  Utensils,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { backend } from "@/lib/backend";
import { readAuditEvents } from "@/lib/audit";
import {
  ensureSeed,
  type Meal,
  type Order,
  type PlatformStats,
  type Restaurant,
  type User,
} from "@/lib/seed";
import { isMealPublic, isRestaurantPublic } from "@/lib/platform";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "BitePass - Preorder meals without waiting" },
      {
        name: "description",
        content:
          "BitePass helps you preorder from nearby restaurants, pay ahead and pick up when your food is ready.",
      },
    ],
  }),
});

type LandingFoodCard = {
  name: string;
  place: string;
  time: string;
  image: string;
  className: string;
};

const cardPositions = [
  "left-2 top-16 rotate-[-13deg] z-10",
  "left-24 top-6 rotate-[-4deg] z-20",
  "right-16 top-12 rotate-[7deg] z-30",
  "right-0 top-28 rotate-[15deg] z-40",
];

const steps = [
  ["Choose a meal", "Browse ready-to-preorder dishes near you.", MapPin],
  ["Pay ahead", "Checkout before you leave your desk or car.", CreditCard],
  ["Pick it up", "Walk in when BitePass says it is ready.", Clock],
] satisfies Array<[string, string, LucideIcon]>;

const features = [
  ["Live order status", "Know when the kitchen starts and when to come in.", Bell],
  ["Verified kitchens", "Restaurants are checked before they go live.", ShieldCheck],
  ["Simple reorders", "Repeat your usual lunch in a few taps.", Utensils],
] satisfies Array<[string, string, LucideIcon]>;

const defaultLandingStats: PlatformStats = {
  id: "public",
  foodies: "0",
  kitchens: "0",
  avgMinutesSaved: "0",
  updatedAt: "",
};

const heroHeadlines = [
  "I hate wasting time when I am hungry.",
  "Lunch should not steal my afternoon.",
  "Good food should be ready when I arrive.",
  "I want to order now and pick up fast.",
];

function useReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setShown(true), {
      threshold: 0.15,
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, shown };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, shown } = useReveal();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

function FoodFan({ cards }: { cards: LandingFoodCard[] }) {
  const visibleCards = cards;
  return (
    <div className="relative mx-auto h-[380px] w-full max-w-[540px] sm:h-[430px]">
      <div className="absolute inset-x-8 bottom-2 h-24 rounded-full bg-primary/15 blur-3xl" />
      {visibleCards.length === 0 && (
        <div className="absolute left-1/2 top-1/2 w-[min(82vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#eadfd4] bg-white/80 p-6 text-center shadow-[0_22px_48px_-28px_oklch(0.18_0.02_50)]">
          <p className="text-sm font-black">No foods yet</p>
          <p className="mt-2 text-xs leading-5 text-[#70665d]">
            Real dishes from approved restaurants will show here.
          </p>
        </div>
      )}
      {visibleCards.map((card) => (
        <div
          key={card.name}
          className={`absolute h-[250px] w-[178px] overflow-hidden rounded-2xl border border-white/80 bg-card shadow-[0_22px_48px_-28px_oklch(0.18_0.02_50)] transition duration-300 hover:z-50 hover:-translate-y-2 hover:rotate-0 sm:h-[300px] sm:w-[214px] ${card.className}`}
        >
          <div
            className="h-full bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(180deg, transparent 48%, rgba(0,0,0,.72) 100%), url(${card.image})`,
            }}
          />
          <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/15 bg-black/45 p-3 text-white backdrop-blur">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">
                  {card.place}
                </p>
                <p className="mt-0.5 text-sm font-black">{card.name}</p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-foreground">
                {card.time}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Landing() {
  const [stats, setStats] = useState<PlatformStats>(defaultLandingStats);
  const [usersToday, setUsersToday] = useState(1);
  const [topFoodCards, setTopFoodCards] = useState<LandingFoodCard[]>([]);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [typedHeadline, setTypedHeadline] = useState(heroHeadlines[0]);
  const currentHeadline = heroHeadlines[headlineIndex];

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        ensureSeed();
        const [users, restaurants, orders, meals] = await Promise.all([
          backend.users(),
          backend.restaurants(),
          backend.orders(),
          backend.meals(),
        ]);
        const published = await backend.platformStats().catch(() => []);
        if (cancelled) return;
        setStats(mergeLandingStats(deriveLandingStats(users, restaurants, orders), published[0]));
        setUsersToday(countUsersToday(users));
        setTopFoodCards(buildTopFoodCards(restaurants, meals));
      } catch (error) {
        console.error("Landing stats could not be loaded", error);
        if (!cancelled) setStats(defaultLandingStats);
      }
    }
    void loadStats();
    const timer = window.setInterval(() => void loadStats(), 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeadlineIndex((index) => (index + 1) % heroHeadlines.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let character = 0;
    setTypedHeadline("");
    const timer = window.setInterval(() => {
      character += 1;
      setTypedHeadline(currentHeadline.slice(0, character));
      if (character >= currentHeadline.length) {
        window.clearInterval(timer);
      }
    }, 28);
    return () => window.clearInterval(timer);
  }, [currentHeadline]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfaf7] text-[#201b17]">
      <nav className="sticky top-0 z-50 border-b border-[#eadfd4] bg-[#fbfaf7]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold">
            <span className="h-6 w-6 rounded-full bg-[#ff6b2d]" />
            BitePass
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#how" className="text-sm text-[#70665d] transition hover:text-[#201b17]">
              How it works
            </a>
            <a href="#features" className="text-sm text-[#70665d] transition hover:text-[#201b17]">
              Features
            </a>
            <a
              href="#restaurants"
              className="text-sm text-[#70665d] transition hover:text-[#201b17]"
            >
              Restaurants
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden px-3 py-2 text-sm text-[#70665d] md:inline-flex">
              Sign in
            </Link>
            <Link
              to="/login"
              className="rounded-full bg-[#201b17] px-4 py-2 text-sm font-bold text-white transition active:scale-95"
            >
              Open app
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="px-5 py-12 md:py-16">
          <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1fr]">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#f4c9b6] bg-[#fff2eb] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#df521b]">
                <span className="h-2 w-2 rounded-full bg-[#ff6b2d]" />
                Osun State
              </span>

              <h1 className="mt-5 min-h-[3.15em] text-5xl font-black leading-[1.02] tracking-[-0.03em] text-[#201b17] md:min-h-[2.1em] md:text-6xl">
                <span>{typedHeadline}</span>
                <span className="ml-1 inline-block h-[0.82em] w-[4px] translate-y-1 rounded-full bg-[#ff6b2d] align-baseline animate-type-caret" />
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-[#6f6259] md:text-lg">
                Currently Piloting in Universities
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-[#ff6b2d] px-5 py-3 text-sm font-black text-white shadow-[0_16px_30px_-20px_#ff6b2d] transition hover:bg-[#ee5b1f] active:scale-95"
                >
                  Start ordering <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-full border border-[#e3d7cb] bg-white px-5 py-3 text-sm font-bold text-[#201b17] transition hover:border-[#d3c4b8]"
                >
                  Browse meals
                </Link>
              </div>

              <div className="mt-8 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[#e8ddd2] bg-[#e8ddd2]">
                {[
                  [formatLandingCount(stats.foodies), "foodies"],
                  [formatLandingCount(stats.kitchens), "kitchens"],
                  [`${Number(stats.avgMinutesSaved || 0)} min`, "saved"],
                ].map(([value, label]) => (
                  <div key={label} className="bg-white/75 px-4 py-3">
                    <p className="text-lg font-black">{value}</p>
                    <p className="text-xs text-[#74685f]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <Reveal>
              <FoodFan cards={topFoodCards} />
            </Reveal>
          </div>
        </section>

        <section id="how" className="px-5 py-12">
          <div className="mx-auto max-w-6xl rounded-[1.5rem] border border-[#e8ddd2] bg-white/65 p-5 md:p-7">
            <div className="flex flex-col justify-between gap-3 border-b border-[#eadfd4] pb-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#df521b]">
                  How it works
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] md:text-3xl">
                  Three steps. That is it.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#70665d]">
                BitePass keeps lunch simple for customers and kitchens.
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {steps.map(([title, description, Icon], index) => (
                <Reveal key={title} delay={index * 80}>
                  <div className="h-full rounded-2xl border border-[#eadfd4] bg-[#fbfaf7] p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf6ef] text-[#20854f]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 font-black">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#70665d]">{description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="px-5 py-12">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.55fr_1fr]">
            <Reveal>
              <div className="rounded-[1.5rem] border border-[#e8ddd2] bg-[#201b17] p-7 text-white">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffb591]">
                  Overview
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.02em]">
                  Built for quick pickups.
                </h2>
                <p className="mt-4 text-sm leading-6 text-white/70">
                  Clear meals, clear timing, clear pickup. Nothing extra in the way.
                </p>
              </div>
            </Reveal>

            <div className="grid gap-3 md:grid-cols-3">
              {features.map(([title, description, Icon], index) => (
                <Reveal key={title} delay={index * 80}>
                  <div className="h-full rounded-[1.25rem] border border-[#e8ddd2] bg-white/70 p-5">
                    <Icon className="h-5 w-5 text-[#df521b]" />
                    <h3 className="mt-8 font-black">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#70665d]">{description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="restaurants" className="px-5 py-12">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_0.8fr]">
            <Reveal>
              <div className="rounded-[1.5rem] border border-[#e8ddd2] bg-white/70 p-7">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#df521b]">
                  For restaurants
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.02em]">
                  Sell before the rush starts.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-[#70665d]">
                  Accept preorders, control pickup times and keep customers updated from one simple
                  queue.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 rounded-full bg-[#201b17] px-5 py-3 text-sm font-black text-white"
                  >
                    Become a partner <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center rounded-full border border-[#e3d7cb] px-5 py-3 text-sm font-bold"
                  >
                    Restaurant login
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="overflow-hidden rounded-[1.5rem] border border-[#e8ddd2] bg-white/75">
                {(topFoodCards.length > 0
                  ? topFoodCards.slice(0, 3).map((card, index) => [
                      `#${String(index + 1).padStart(2, "0")}`,
                      card.name,
                      card.place,
                    ])
                  : [["--", "No foods yet", "Awaiting restaurants"]]
                ).map(([id, meal, status]) => (
                  <div
                    key={id}
                    className="grid grid-cols-[0.7fr_1fr_0.7fr] gap-3 border-b border-[#eadfd4] px-5 py-4 text-sm last:border-b-0"
                  >
                    <p className="font-black">{id}</p>
                    <p className="text-[#70665d]">{meal}</p>
                    <p className="text-right font-bold text-[#20854f]">{status}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="px-5 py-14">
          <Reveal>
            <div className="mx-auto flex max-w-6xl flex-col justify-between gap-5 rounded-[1.5rem] border border-[#e8ddd2] bg-[#fff2eb] p-7 md:flex-row md:items-center">
              <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#df521b]">
                  <Check className="h-4 w-4" />
                  Ready when you are
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
                  Open BitePass and pick lunch in minutes.
                </h2>
              </div>
              <Link
                to="/login"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-[#ff6b2d] px-5 py-3 text-sm font-black text-white"
              >
                Open app <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </section>

        <section className="px-5 pb-12">
          <Reveal>
            <div className="mx-auto flex max-w-6xl flex-col gap-5 rounded-[1.5rem] border border-[#e8ddd2] bg-[#201b17] p-6 text-white md:flex-row md:items-center md:justify-between md:p-7">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#ffb591]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffb591]">
                    Live community
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
                    Join {formatLandingCount(String(usersToday))} people using BitePass today.
                  </h2>
                </div>
              </div>
              <Link
                to="/signup"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#201b17]"
              >
                Join BitePass <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-[#eadfd4] px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-[#70665d] md:flex-row">
          <div className="flex items-center gap-2 font-bold text-[#201b17]">
            <span className="h-5 w-5 rounded-full bg-[#ff6b2d]" />
            BitePass
          </div>
          <p className="text-xs">
            Copyright {new Date().getFullYear()} BitePass. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            <a href="#how" className="hover:text-[#201b17]">
              How it works
            </a>
            <a href="#features" className="hover:text-[#201b17]">
              Features
            </a>
            <Link to="/login" className="hover:text-[#201b17]">
              Sign in
            </Link>
            <Link to="/privacy" className="hover:text-[#201b17]">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function deriveLandingStats(
  users: User[],
  restaurants: Restaurant[],
  orders: Order[],
): PlatformStats {
  return {
    id: "public",
    foodies: String(Math.max(Number(defaultLandingStats.foodies), users.length)),
    kitchens: String(
      Math.max(Number(defaultLandingStats.kitchens), restaurants.filter(isRestaurantPublic).length),
    ),
    avgMinutesSaved: String(
      Math.max(Number(defaultLandingStats.avgMinutesSaved), orders.length ? 6 : 0),
    ),
    updatedAt: new Date().toISOString(),
  };
}

function mergeLandingStats(liveStats: PlatformStats, published?: PlatformStats): PlatformStats {
  if (!published) return liveStats;
  return {
    id: "public",
    foodies: String(Math.max(Number(liveStats.foodies), Number(published.foodies || 0))),
    kitchens: String(Math.max(Number(liveStats.kitchens), Number(published.kitchens || 0))),
    avgMinutesSaved: String(
      Math.max(Number(liveStats.avgMinutesSaved), Number(published.avgMinutesSaved || 0)),
    ),
    updatedAt: liveStats.updatedAt,
  };
}

function formatLandingCount(value: string) {
  const number = Number(value || 0);
  if (number >= 1000) return `${Math.floor(number / 1000)}k+`;
  return String(number);
}

function countUsersToday(users: User[]) {
  const today = new Date().toDateString();
  const activeUserIds = new Set(
    readAuditEvents()
      .filter((event) => event.actorId && new Date(event.createdAt).toDateString() === today)
      .map((event) => event.actorId as string),
  );

  return Math.max(activeUserIds.size, users.length, 1);
}

function buildTopFoodCards(restaurants: Restaurant[], meals: Meal[]): LandingFoodCard[] {
  const publicRestaurants = restaurants.filter(isRestaurantPublic);
  const restaurantById = new Map(publicRestaurants.map((restaurant) => [restaurant.id, restaurant]));
  const byRestaurant = new Map<string, Meal>();
  meals
    .filter((meal) => isMealPublic(meal) && restaurantById.has(meal.restaurantId))
    .sort((a, b) => {
      const popular = Number(b.popular === "1") - Number(a.popular === "1");
      if (popular !== 0) return popular;
      return Number(b.rating || 0) - Number(a.rating || 0);
    })
    .forEach((meal) => {
      if (!byRestaurant.has(meal.restaurantId)) byRestaurant.set(meal.restaurantId, meal);
    });

  return Array.from(byRestaurant.values())
    .slice(0, 4)
    .map((meal, index) => {
      const restaurant = restaurantById.get(meal.restaurantId);
      return {
        name: meal.name,
        place: restaurant?.name ?? "BitePass",
        time: `${meal.prepTime || restaurant?.prepTime || "15"} min`,
        image: meal.image || restaurant?.image || "",
        className: cardPositions[index] ?? cardPositions[0],
      };
    });
}
