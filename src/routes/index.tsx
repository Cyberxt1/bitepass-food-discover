import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ChefHat, ArrowRight, Star, Clock, MapPin, Sparkles, Zap, ShieldCheck,
  Bell, ChevronRight, Quote,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "BitePass — Preorder. Skip the line. Eat better." },
      { name: "description", content: "Discover top restaurants near you. Preorder meals, pay ahead, track live preparation and walk straight to your food." },
    ],
  }),
});

function useReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown(true), { threshold: 0.15 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, shown } = useReveal();
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      {children}
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* NAV */}
      <nav className="sticky top-0 z-40 glass border-b border-border/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <ChefHat className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">BitePass</span>
          </Link>
          <div className="hidden items-center gap-7 md:flex">
            <a href="#how" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">How it works</a>
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">Features</a>
            <a href="#restaurants" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">For restaurants</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition md:inline-flex">Sign in</Link>
            <Link to="/discover" className="rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-95">
              Open app
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative px-5 pt-14 pb-20 md:pt-24 md:pb-32">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-float" />
          <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-primary-glow/30 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div className="animate-slide-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-soft">
              <Sparkles className="h-3 w-3 text-primary" />
              Now serving Lagos, Abuja & Port Harcourt
            </span>
            <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Skip the line.
              <br />
              <span className="text-gradient">Taste the city.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
              Preorder from the restaurants you love. Pay in seconds, track preparation live, and walk in to a meal that's already waiting.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/discover" className="group inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition hover:shadow-card active:scale-95">
                Start ordering
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-bold text-foreground transition hover:bg-muted">
                Restaurant login
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-5">
              <div className="flex -space-x-2">
                {["🥘", "🍔", "🌯", "🍣"].map((e) => (
                  <span key={e} className="grid h-9 w-9 place-items-center rounded-full border-2 border-background bg-card text-sm shadow-soft">{e}</span>
                ))}
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1 font-bold">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3 w-3 fill-warning text-warning" />)}
                  <span className="ml-1">4.9 · 12,400+ reviews</span>
                </div>
                <p className="text-muted-foreground">Loved by foodies across Nigeria</p>
              </div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative mx-auto w-full max-w-sm animate-slide-up" style={{ animationDelay: "150ms" }}>
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-warm opacity-30 blur-2xl" />
            <div className="relative rounded-[2.5rem] border-[10px] border-foreground/90 bg-background shadow-[0_30px_80px_-20px_oklch(0.4_0.05_40_/_0.45)]">
              <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-foreground/90" />
              <div className="space-y-3 rounded-[2rem] bg-gradient-hero p-4 pt-9">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span>9:41</span>
                  <span>BitePass</span>
                </div>
                <div className="rounded-2xl bg-card p-3 shadow-soft">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><MapPin className="h-3 w-3" />Victoria Island</div>
                  <p className="text-sm font-bold">Hey, Tobi 👋</p>
                </div>
                <div className="rounded-2xl bg-gradient-warm p-3 text-white shadow-glow">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Preorder pickup</span>
                  <p className="mt-1 text-sm font-bold leading-tight">Preorder lunch. Skip the queue.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "Smoky Jollof", price: "₦4,500", img: "photo-1604329760661-e71dc83f8f26" },
                    { name: "Beef Shawarma", price: "₦3,500", img: "photo-1561651823-34feb02250e4" },
                  ].map((m) => (
                    <div key={m.name} className="overflow-hidden rounded-xl bg-card shadow-soft">
                      <div className="h-16 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/${m.img}?auto=format&fit=crop&w=400&q=70)` }} />
                      <div className="p-2">
                        <p className="text-[10px] font-bold leading-tight">{m.name}</p>
                        <p className="text-[10px] font-bold text-primary">{m.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl bg-card p-3 shadow-soft">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold">Order #BP4821</p>
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[9px] font-bold text-success">Preparing</span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {[1, 1, 0.5, 0].map((v, i) => (
                      <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-gradient-primary transition-all" style={{ width: `${v * 100}%` }} />
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">Ready in <span className="font-bold text-foreground">8 mins</span></p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-2xl bg-card p-3 shadow-card sm:block animate-float">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-success/15 text-success"><Bell className="h-4 w-4" /></div>
                <div className="text-[10px]">
                  <p className="font-bold">Your order is ready 🎉</p>
                  <p className="text-muted-foreground">Mama Cass Kitchen · just now</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE / STATS */}
      <section className="border-y border-border bg-card/50 py-7">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 md:grid-cols-4">
          {[
            { v: "120+", l: "Partner restaurants" },
            { v: "45k", l: "Orders preordered" },
            { v: "6 min", l: "Avg pickup time" },
            { v: "4.9★", l: "Customer rating" },
          ].map((s, i) => (
            <Reveal key={s.l} delay={i * 80}>
              <div className="text-center md:text-left">
                <p className="text-2xl font-extrabold text-gradient md:text-3xl">{s.v}</p>
                <p className="text-xs text-muted-foreground">{s.l}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">How it works</span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Three taps to your next meal.</h2>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { n: "01", t: "Discover", d: "Browse curated restaurants and menus near you, ranked by what's hot right now.", icon: MapPin },
              { n: "02", t: "Preorder & pay", d: "Customize, set your pickup time and pay in seconds — no awkward waits.", icon: Zap },
              { n: "03", t: "Walk in & eat", d: "Track preparation live. Your food is ready the moment you arrive.", icon: Clock },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="group h-full rounded-3xl border border-border bg-card p-7 shadow-soft transition hover:-translate-y-1 hover:shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">{s.n}</span>
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition group-hover:scale-110">
                      <s.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{s.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED RESTAURANTS */}
      <section className="px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Trending</span>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Restaurants people love</h2>
              </div>
              <Link to="/discover" className="hidden items-center gap-1 text-sm font-semibold text-primary md:inline-flex">
                See all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              { n: "Mama Cass Kitchen", c: "African · Jollof", r: "4.8", img: "photo-1555939594-58d7cb561ad1" },
              { n: "The Shawarma Lab", c: "Middle Eastern", r: "4.7", img: "photo-1561651823-34feb02250e4" },
              { n: "Burger District", c: "American", r: "4.6", img: "photo-1568901346375-23c9450c58cd" },
            ].map((r, i) => (
              <Reveal key={r.n} delay={i * 100}>
                <Link to="/discover" className="group block overflow-hidden rounded-3xl bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card">
                  <div className="relative h-48 overflow-hidden">
                    <img src={`https://images.unsplash.com/${r.img}?auto=format&fit=crop&w=900&q=70`} alt={r.n}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-bold text-foreground">
                      <Star className="h-3 w-3 fill-warning text-warning" />{r.r}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold">{r.n}</h3>
                    <p className="text-sm text-muted-foreground">{r.c}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Built for you</span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Everything you need.<br />Nothing you don't.</h2>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { t: "Per-meal reviews", d: "See ratings for taste, portion size, spice level — for the dish, not the whole place.", icon: Star },
              { t: "Live preparation tracking", d: "Watch your order go from received → preparing → ready, in real time.", icon: Zap },
              { t: "Secure preorder payments", d: "Pay once, walk in, walk out. Refunds in one tap if anything goes wrong.", icon: ShieldCheck },
              { t: "Smart pickup timing", d: "Set when you'll arrive and we time the kitchen to match.", icon: Clock },
              { t: "Discount codes", d: "Restaurants drop daily codes — stack savings on dishes you already love.", icon: Sparkles },
              { t: "One-tap reorder", d: "Loved it? Reorder your last meal with a single thumb-tap.", icon: ArrowRight },
            ].map((f, i) => (
              <Reveal key={f.t} delay={(i % 3) * 80}>
                <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:border-primary/30 hover:shadow-card">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold">{f.t}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-warm p-10 text-white shadow-glow md:p-14">
              <Quote className="absolute right-6 top-6 h-20 w-20 text-white/15" />
              <p className="text-xl font-semibold leading-relaxed md:text-2xl">
                "I used to lose 30 minutes every lunch hour. With BitePass I walk in, grab my jollof and leave. It actually gave me back my workday."
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-white/20 text-lg font-bold backdrop-blur">T</div>
                <div>
                  <p className="font-bold">Tobi Adekunle</p>
                  <p className="text-xs opacity-80">Product designer · Lagos</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOR RESTAURANTS */}
      <section id="restaurants" className="px-5 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <Reveal>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">For restaurants</span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Fill your kitchen before the rush.</h2>
              <p className="mt-4 text-base text-muted-foreground">
                Manage your menu, control availability hour-by-hour, run flash discounts and track every order live — all from one dashboard built for busy kitchens.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Toggle dishes on/off in real time",
                  "Set per-meal price, prep time and available hours",
                  "Create discount codes that drive repeat orders",
                  "Live order queue with one-tap status updates",
                ].map((b) => (
                  <li key={b} className="flex items-center gap-3">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary text-xs font-bold">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-3">
                <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow">
                  Restaurant login <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/signup" className="inline-flex rounded-full border border-border bg-card px-6 py-3 text-sm font-bold">
                  Become a partner
                </Link>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative rounded-3xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><ChefHat className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs font-bold">Mama Cass Kitchen</p>
                    <p className="text-[10px] text-muted-foreground">Live dashboard</p>
                  </div>
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">Open</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[{ l: "Today", v: "₦128k" }, { l: "Orders", v: "47" }, { l: "Pending", v: "6" }].map((k) => (
                  <div key={k.l} className="rounded-xl bg-muted/60 p-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{k.l}</p>
                    <p className="text-sm font-bold">{k.v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { id: "#BP4821", n: "2× Smoky Jollof", s: "Preparing", c: "bg-warning/15 text-warning" },
                  { id: "#BP4820", n: "1× Fried Rice", s: "Ready", c: "bg-success/15 text-success" },
                  { id: "#BP4819", n: "3× Shawarma", s: "Received", c: "bg-primary/15 text-primary" },
                ].map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-xl bg-muted/40 p-2.5">
                    <div>
                      <p className="text-[11px] font-bold">{o.id}</p>
                      <p className="text-[10px] text-muted-foreground">{o.n}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${o.c}`}>{o.s}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-foreground p-10 text-background shadow-card md:p-16">
              <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-primary/40 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-primary-glow/30 blur-3xl" />
              <div className="relative text-center">
                <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">Your next meal is waiting.</h2>
                <p className="mt-4 text-base opacity-80 md:text-lg">Open BitePass and preorder in under 60 seconds.</p>
                <Link to="/discover" className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-7 py-4 text-sm font-bold text-primary-foreground shadow-glow transition active:scale-95">
                  Start ordering <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-primary"><ChefHat className="h-3.5 w-3.5 text-primary-foreground" /></div>
            <span className="text-sm font-bold">BitePass</span>
            <span className="text-xs text-muted-foreground">© 2026</span>
          </div>
          <div className="flex gap-5 text-xs text-muted-foreground">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
