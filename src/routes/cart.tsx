import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Minus, Plus, Trash2, Clock, Tag, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { naira } from "@/lib/format";
import { FILES, appendRow, readTable, updateRow } from "@/lib/csv-store";
import type { Discount } from "@/lib/seed";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { items, setQty, remove, total, clear, setNotes } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [pickupMins, setPickupMins] = useState(30);
  const [placing, setPlacing] = useState(false);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<Discount | null>(null);

  const restaurantId = items[0]?.restaurantId ?? "";
  const restaurantDiscounts = useMemo(
    () => readTable<Discount>(FILES.discounts).filter((d) => d.restaurantId === restaurantId && d.active === "1"),
    [restaurantId],
  );

  const apply = () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    const d = restaurantDiscounts.find((x) => x.code.toUpperCase() === c);
    if (!d) { toast.error("Invalid or expired code"); return; }
    if (Number(d.minOrder) > total) { toast.error(`Minimum order ${naira(d.minOrder)}`); return; }
    if (new Date(d.expiresAt) < new Date()) { toast.error("This code has expired"); return; }
    setApplied(d);
    toast.success(`${d.code} applied 🎉`);
  };

  const discountAmount = applied
    ? applied.type === "percent"
      ? Math.round((total * Number(applied.value)) / 100)
      : Math.min(total, Number(applied.value))
    : 0;
  const fee = items.length > 0 ? 200 : 0;
  const grand = Math.max(0, total - discountAmount) + fee;

  const place = async () => {
    if (!user) {
      toast.info("Please sign in to checkout");
      nav({ to: "/login" });
      return;
    }
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 1200));
    const orderId = "o" + Date.now();
    appendRow(FILES.orders, {
      id: orderId,
      userId: user.id,
      restaurantId,
      items: JSON.stringify(items.map((i) => ({ mealId: i.mealId, name: i.name, qty: i.qty, price: i.price, servingUnit: i.servingUnit, notes: i.notes, options: i.options ?? [] }))),
      total: grand,
      status: "received",
      pickupTime: new Date(Date.now() + pickupMins * 60 * 1000).toISOString(),
      notes: "",
      createdAt: new Date().toISOString(),
      discountCode: applied?.code ?? "",
    });
    if (applied) {
      updateRow(FILES.discounts, (r) => r.id === applied.id, { uses: String(Number(applied.uses) + 1) });
    }
    clear();
    toast.success("Payment successful — order placed!");
    nav({ to: "/orders/$orderId", params: { orderId } });
  };

  return (
    <div>
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/discover" className="grid h-9 w-9 place-items-center rounded-full bg-card shadow-soft"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-base font-bold">Your cart</h1>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="grid place-items-center px-6 pt-20 text-center">
          <div className="text-6xl">🍽️</div>
          <p className="mt-4 text-base font-semibold">Your cart is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">Discover meals and add them here.</p>
          <Link to="/discover" className="mt-6 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
            Browse restaurants
          </Link>
        </div>
      ) : (
        <>
          <main className="space-y-3 px-4 pt-4">
            {items.map((it) => (
              <div key={it.mealId} className="rounded-2xl bg-card p-3 shadow-soft animate-slide-up">
                <div className="flex gap-3">
                  <img src={it.image} alt={it.name} className="h-20 w-20 rounded-xl object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold leading-tight">{it.name}</p>
                    <p className="text-[11px] text-muted-foreground">{it.restaurantName}</p>
                    {it.options && it.options.length > 0 && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {it.options.map((option) => option.name).join(", ")}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-bold text-primary">
                      {naira(it.price)}
                      {it.servingUnit && <span className="text-[10px] font-semibold text-muted-foreground">/{it.servingUnit}</span>}
                    </p>
                  </div>
                  <button onClick={() => remove(it.mealId)} className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  value={it.notes ?? ""} onChange={(e) => setNotes(it.mealId, e.target.value)}
                  placeholder="Add note (optional)…"
                  className="mt-2 w-full rounded-xl bg-muted px-3 py-2 text-xs outline-none placeholder:text-muted-foreground"
                />
                <div className="mt-2 flex items-center justify-end gap-3">
                  <button onClick={() => setQty(it.mealId, it.qty - 1)} className="grid h-7 w-7 place-items-center rounded-full border border-border"><Minus className="h-3 w-3" /></button>
                  <span className="w-5 text-center text-sm font-bold">{it.qty}</span>
                  <button onClick={() => setQty(it.mealId, it.qty + 1)} className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-primary-foreground"><Plus className="h-3 w-3" /></button>
                </div>
              </div>
            ))}

            {/* Discount code */}
            <div className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-center gap-2 text-sm font-semibold"><Tag className="h-4 w-4 text-primary" />Promo code</div>
              {applied ? (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-success/10 px-3 py-2">
                  <div>
                    <p className="font-mono text-sm font-bold text-success">{applied.code}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Saved {naira(discountAmount)} ({applied.type === "percent" ? `${applied.value}%` : "fixed"})
                    </p>
                  </div>
                  <button onClick={() => { setApplied(null); setCode(""); }} className="grid h-7 w-7 place-items-center rounded-full bg-card">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-2 flex gap-2">
                    <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code"
                      className="flex-1 rounded-xl bg-muted px-3 py-2 text-sm font-mono uppercase outline-none placeholder:text-muted-foreground placeholder:normal-case placeholder:font-sans" />
                    <button onClick={apply} className="rounded-xl bg-gradient-primary px-4 text-xs font-bold text-primary-foreground shadow-soft">Apply</button>
                  </div>
                  {restaurantDiscounts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {restaurantDiscounts.slice(0, 3).map((d) => (
                        <button key={d.id} onClick={() => { setCode(d.code); }}
                          className="rounded-full border border-dashed border-primary/40 px-2 py-0.5 text-[10px] font-mono font-bold text-primary hover:bg-primary/5 transition">
                          {d.code}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4 text-primary" />Pickup time</div>
              <p className="mt-1 text-xs text-muted-foreground">Ready in approximately {pickupMins} minutes</p>
              <input type="range" min={15} max={120} step={5} value={pickupMins} onChange={(e) => setPickupMins(Number(e.target.value))}
                className="mt-3 w-full accent-[oklch(var(--primary))]" />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>15 min</span><span>2 hours</span></div>
            </div>

            <div className="rounded-2xl bg-card p-4 shadow-soft">
              <Row label="Subtotal" value={naira(total)} />
              {applied && <Row label={`Discount (${applied.code})`} value={`− ${naira(discountAmount)}`} accent />}
              <Row label="Service fee" value={naira(fee)} />
              <div className="my-2 border-t border-border" />
              <Row label="Total" value={naira(grand)} bold />
            </div>
          </main>

          <div className="fixed bottom-16 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4 pb-3">
            <button onClick={place} disabled={placing}
              className="flex w-full items-center justify-between rounded-2xl bg-gradient-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow active:scale-95 disabled:opacity-70"
            >
              <span>{placing ? "Processing payment…" : "Pay & preorder"}</span>
              <span>{naira(grand)}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 text-sm ${bold ? "font-bold" : ""} ${accent ? "text-success font-semibold" : ""}`}>
      <span className={bold || accent ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
