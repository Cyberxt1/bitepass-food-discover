import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
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
import {
  ensureSeed,
  type Order,
  type Restaurant,
  type User,
} from "@/lib/seed";
import { naira } from "@/lib/format";

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

type LandingStats = {
  completedTransactions: number;
  completedRevenue: number;
  stores: number;
  users: number;
};

const cardPositions = [
  "left-2 top-16 rotate-[-13deg] z-10",
  "left-24 top-6 rotate-[-4deg] z-20",
  "right-16 top-12 rotate-[7deg] z-30",
  "right-0 top-28 rotate-[15deg] z-40",
];

const stableLandingCards: LandingFoodCard[] = [
  {
    name: "Smoky Jollof",
    place: "Ready lunch",
    time: "20 min",
    image:
      "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=900&q=80",
    className: cardPositions[0],
  },
  {
    name: "Grilled Chicken",
    place: "Campus pickup",
    time: "18 min",
    image:
      "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=80",
    className: cardPositions[1],
  },
  {
    name: "Pasta Bowl",
    place: "Fast meals",
    time: "15 min",
    image:
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=80",
    className: cardPositions[2],
  },
  {
    name: "Cold Drinks",
    place: "Quick add-on",
    time: "5 min",
    image:
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80",
    className: cardPositions[3],
  },
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

const defaultLandingStats: LandingStats = {
  completedTransactions: 0,
  completedRevenue: 0,
  stores: 0,
  users: 0,
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
  const [stats, setStats] = useState<LandingStats>(defaultLandingStats);
  const [landingDark, setLandingDark] = useState(false);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [typedHeadline, setTypedHeadline] = useState(heroHeadlines[0]);
  const currentHeadline = heroHeadlines[headlineIndex];

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        ensureSeed();
        const [users, restaurants, orders] = await Promise.all([
          backend.users(),
          backend.restaurants(),
          backend.orders(),
        ]);
        if (cancelled) return;
        setStats(deriveLandingStats(users, restaurants, orders));
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

  const themeStyle = {
    "--landing-bg": landingDark ? "#15110f" : "#fbfaf7",
    "--landing-surface": landingDark ? "rgba(38,31,27,0.78)" : "rgba(255,255,255,0.7)",
    "--landing-soft": landingDark ? "#211b18" : "#fbfaf7",
    "--landing-border": landingDark ? "#3a302a" : "#e8ddd2",
    "--landing-border-soft": landingDark ? "#473a33" : "#eadfd4",
    "--landing-text": landingDark ? "#fff8f1" : "#201b17",
    "--landing-muted": landingDark ? "#c6b7aa" : "#70665d",
    "--landing-card": landingDark ? "rgba(31,25,22,0.88)" : "rgba(255,255,255,0.75)",
    "--landing-invert": landingDark ? "#fff8f1" : "#201b17",
    "--landing-invert-text": landingDark ? "#201b17" : "#ffffff",
  } as CSSProperties;

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[var(--landing-bg)] text-[var(--landing-text)] transition-colors duration-300"
      style={themeStyle}
    >
      <nav className="sticky top-0 z-50 border-b border-[var(--landing-border-soft)] bg-[var(--landing-bg)]/90 backdrop-blur-xl transition-colors duration-300">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            <button
              type="button"
              onClick={() => setLandingDark((value) => !value)}
              className="h-6 w-6 rounded-full bg-[#ff6b2d] shadow-[0_0_0_5px_rgba(255,107,45,0.12)] transition active:scale-90"
              aria-label={landingDark ? "Switch landing page to light theme" : "Switch landing page to dark theme"}
            />
            <Link to="/" className="text-[var(--landing-text)]">
              BitePass
            </Link>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#how" className="text-sm text-[var(--landing-muted)] transition hover:text-[var(--landing-text)]">
              How it works
            </a>
            <a href="#features" className="text-sm text-[var(--landing-muted)] transition hover:text-[var(--landing-text)]">
              Features
            </a>
            <a
              href="#restaurants"
              className="text-sm text-[var(--landing-muted)] transition hover:text-[var(--landing-text)]"
            >
              Restaurants
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden px-3 py-2 text-sm text-[var(--landing-muted)] md:inline-flex">
              Sign in
            </Link>
            <Link
              to="/login"
              className="rounded-full bg-[var(--landing-invert)] px-4 py-2 text-sm font-bold text-[var(--landing-invert-text)] transition active:scale-95"
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

              <h1 className="relative mt-5 grid h-[210px] overflow-hidden text-5xl font-black leading-[1.02] tracking-[-0.03em] text-[var(--landing-text)] min-[430px]:h-[160px] md:h-[130px] md:text-6xl">
                <span className="pointer-events-none invisible col-start-1 row-start-1">
                  Good food should be ready when I arrive.
                </span>
                <span className="col-start-1 row-start-1 self-start">
                  {typedHeadline}
                  <span className="ml-1 inline-block h-[0.82em] w-[4px] translate-y-1 rounded-full bg-[#ff6b2d] align-baseline animate-type-caret" />
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-[var(--landing-muted)] md:text-lg">
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
                  className="inline-flex items-center rounded-full border border-[var(--landing-border)] bg-[var(--landing-card)] px-5 py-3 text-sm font-bold text-[var(--landing-text)] transition hover:border-[#d3c4b8]"
                >
                  Browse meals
                </Link>
              </div>

              <div className="mt-8 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-border)] sm:grid-cols-4">
                {[
                  [formatLandingCount(stats.completedTransactions), "completed"],
                  [naira(stats.completedRevenue), "revenue"],
                  [formatLandingCount(stats.stores), "stores"],
                  [formatLandingCount(stats.users), "users"],
                ].map(([value, label]) => (
                  <div key={label} className="bg-[var(--landing-card)] px-4 py-3">
                    <p className="text-lg font-black">{value}</p>
                    <p className="text-xs text-[var(--landing-muted)]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <Reveal>
              <FoodFan cards={stableLandingCards} />
            </Reveal>
          </div>
        </section>

        <section id="how" className="px-5 py-12">
          <div className="mx-auto max-w-6xl rounded-[1.5rem] border border-[var(--landing-border)] bg-[var(--landing-card)] p-5 md:p-7">
            <div className="flex flex-col justify-between gap-3 border-b border-[var(--landing-border-soft)] pb-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#df521b]">
                  How it works
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] md:text-3xl">
                  Three steps. That is it.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[var(--landing-muted)]">
                BitePass keeps lunch simple for customers and kitchens.
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {steps.map(([title, description, Icon], index) => (
                <Reveal key={title} delay={index * 80}>
                  <div className="h-full rounded-2xl border border-[var(--landing-border-soft)] bg-[var(--landing-soft)] p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf6ef] text-[#20854f]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 font-black">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--landing-muted)]">{description}</p>
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
                  <div className="h-full rounded-[1.25rem] border border-[var(--landing-border)] bg-[var(--landing-card)] p-5">
                    <Icon className="h-5 w-5 text-[#df521b]" />
                    <h3 className="mt-8 font-black">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--landing-muted)]">{description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="restaurants" className="px-5 py-12">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_0.8fr]">
            <Reveal>
              <div className="rounded-[1.5rem] border border-[var(--landing-border)] bg-[var(--landing-card)] p-7">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#df521b]">
                  For restaurants
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.02em]">
                  Sell before the rush starts.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--landing-muted)]">
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
                    className="inline-flex items-center rounded-full border border-[var(--landing-border)] px-5 py-3 text-sm font-bold text-[var(--landing-text)]"
                  >
                    Restaurant login
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="overflow-hidden rounded-[1.5rem] border border-[var(--landing-border)] bg-[var(--landing-card)]">
                {stableLandingCards.slice(0, 3).map((card, index) => [
                  `#${String(index + 1).padStart(2, "0")}`,
                  card.name,
                  card.place,
                ]).map(([id, meal, status]) => (
                  <div
                    key={id}
                    className="grid grid-cols-[0.7fr_1fr_0.7fr] gap-3 border-b border-[var(--landing-border-soft)] px-5 py-4 text-sm last:border-b-0"
                  >
                    <p className="font-black">{id}</p>
                    <p className="text-[var(--landing-muted)]">{meal}</p>
                    <p className="text-right font-bold text-[#20854f]">{status}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="px-5 py-14">
          <Reveal>
            <div className="mx-auto flex max-w-6xl flex-col justify-between gap-5 rounded-[1.5rem] border border-[var(--landing-border)] bg-[var(--landing-card)] p-7 md:flex-row md:items-center">
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
                    Live platform data
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
                    Join {formatLandingCount(stats.users)} users across {formatLandingCount(stats.stores)} stores.
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

      <footer className="border-t border-[var(--landing-border-soft)] px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-[var(--landing-muted)] md:flex-row">
          <div className="flex items-center gap-2 font-bold text-[var(--landing-text)]">
            <span className="h-5 w-5 rounded-full bg-[#ff6b2d]" />
            BitePass
          </div>
          <p className="text-xs">
            Copyright {new Date().getFullYear()} BitePass. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            <a href="#how" className="hover:text-[var(--landing-text)]">
              How it works
            </a>
            <a href="#features" className="hover:text-[var(--landing-text)]">
              Features
            </a>
            <Link to="/login" className="hover:text-[var(--landing-text)]">
              Sign in
            </Link>
            <Link to="/privacy" className="hover:text-[var(--landing-text)]">
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
): LandingStats {
  const completedOrders = orders.filter((order) => order.status === "completed");
  return {
    completedTransactions: completedOrders.length,
    completedRevenue: completedOrders.reduce((sum, order) => sum + Number(order.total), 0),
    stores: restaurants.length,
    users: users.length,
  };
}

function formatLandingCount(value: number | string) {
  const number = Number(value || 0);
  if (number >= 1000) return `${Math.floor(number / 1000)}k+`;
  return String(number);
}
