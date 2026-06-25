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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { backend } from "@/lib/backend";
import { ensureSeed, type Order, type PlatformStats, type Restaurant, type User } from "@/lib/seed";

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

const foodCards = [
  {
    name: "Jollof Bowl",
    place: "VI",
    time: "12 min",
    image:
      "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=720&q=85",
    className: "left-2 top-16 rotate-[-13deg] z-10",
  },
  {
    name: "Chicken Suya",
    place: "Wuse",
    time: "9 min",
    image:
      "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=720&q=85",
    className: "left-24 top-6 rotate-[-4deg] z-20",
  },
  {
    name: "Shawarma",
    place: "Lekki",
    time: "14 min",
    image:
      "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=720&q=85",
    className: "right-16 top-12 rotate-[7deg] z-30",
  },
  {
    name: "Burger Stack",
    place: "GRA",
    time: "11 min",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=720&q=85",
    className: "right-0 top-28 rotate-[15deg] z-40",
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

const defaultLandingStats: PlatformStats = {
  id: "public",
  foodies: "1",
  kitchens: "9",
  avgMinutesSaved: "6",
  updatedAt: "",
};

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

function FoodFan() {
  return (
    <div className="relative mx-auto h-[380px] w-full max-w-[540px] sm:h-[430px]">
      <div className="absolute inset-x-8 bottom-2 h-24 rounded-full bg-primary/15 blur-3xl" />
      {foodCards.map((card) => (
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

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      ensureSeed();
      const [published, users, restaurants, orders] = await Promise.all([
        backend.platformStats(),
        backend.users(),
        backend.restaurants(),
        backend.orders(),
      ]);
      if (cancelled) return;
      setStats(getPublishedStats(published) ?? deriveLandingStats(users, restaurants, orders));
    }
    void loadStats();
    const timer = window.setInterval(() => void loadStats(), 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

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

              <h1 className="mt-5 text-5xl font-black leading-[1.02] tracking-[-0.03em] text-[#201b17] md:text-6xl">
                Order before you arrive.
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
              <FoodFan />
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
                {[
                  ["#BP4821", "Smoky Jollof", "Preparing"],
                  ["#BP4820", "Fried Rice", "Ready"],
                  ["#BP4819", "Shawarma", "Received"],
                ].map(([id, meal, status]) => (
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
      </main>

      <footer className="border-t border-[#eadfd4] px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-[#70665d] md:flex-row">
          <div className="flex items-center gap-2 font-bold text-[#201b17]">
            <span className="h-5 w-5 rounded-full bg-[#ff6b2d]" />
            BitePass
          </div>
          <p className="text-xs">Copyright {new Date().getFullYear()} BitePass. All rights reserved.</p>
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

function deriveLandingStats(users: User[], restaurants: Restaurant[], orders: Order[]): PlatformStats {
  return {
    id: "public",
    foodies: String(Math.max(Number(defaultLandingStats.foodies), users.filter((entry) => entry.role === "customer").length)),
    kitchens: String(Math.max(Number(defaultLandingStats.kitchens), restaurants.length)),
    avgMinutesSaved: String(Math.max(Number(defaultLandingStats.avgMinutesSaved), orders.length ? 6 : 0)),
    updatedAt: new Date().toISOString(),
  };
}

function getPublishedStats(stats: PlatformStats[]) {
  const published = stats[0];
  if (!published) return null;
  const hasRealValue = [published.foodies, published.kitchens, published.avgMinutesSaved].some((value) => Number(value) > 0);
  return hasRealValue ? published : null;
}

function formatLandingCount(value: string) {
  const number = Number(value || 0);
  if (number >= 1000) return `${Math.floor(number / 1000)}k+`;
  return String(number);
}
