import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Clock, Minus, Plus, Tag, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { naira } from "@/lib/format";
import { FILES, readTable, updateRow } from "@/lib/csv-store";
import { backend } from "@/lib/backend";
import type { Discount } from "@/lib/seed";
import { MealPlaceholder } from "@/components/MealPlaceholder";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { items, setQty, remove, total, clear, setNotes } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [pickupMode, setPickupMode] = useState<"asap" | "scheduled">("asap");
  const [pickupAt, setPickupAt] = useState(getDefaultPickupTime());
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<Discount | null>(null);

  const restaurantId = items[0]?.restaurantId ?? "";
  const restaurantDiscounts = useMemo(
    () => readTable<Discount>(FILES.discounts).filter((discount) => discount.restaurantId === restaurantId && discount.active === "1"),
    [restaurantId],
  );

  const apply = () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    const discount = restaurantDiscounts.find((item) => item.code.toUpperCase() === normalized);
    if (!discount) {
      toast.error("Invalid or expired code");
      return;
    }
    if (Number(discount.minOrder) > total) {
      toast.error(`Minimum order ${naira(discount.minOrder)}`);
      return;
    }
    if (new Date(discount.expiresAt) < new Date()) {
      toast.error("This code has expired");
      return;
    }
    setApplied(discount);
    toast.success(`${discount.code} applied`);
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

    const restaurant = (await backend.restaurants()).find((entry) => entry.id === restaurantId);
    if (!restaurant || restaurant.isOpen === "0") {
      toast.error("You can't place an order because this restaurant is closed");
      return;
    }

    setPlacing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const orderId = "o" + Date.now();
    const pickupTime = pickupMode === "scheduled" && pickupAt ? new Date(pickupAt).toISOString() : new Date().toISOString();
    await backend.addOrder({
      id: orderId,
      userId: user.id,
      restaurantId,
      items: JSON.stringify(
        items.map((item) => ({
          mealId: item.mealId,
          name: item.name,
          qty: item.qty,
          price: item.price,
          servingUnit: item.servingUnit,
          notes: item.notes,
          options: item.options ?? [],
        })),
      ),
      total: String(grand),
      status: "received",
      pickupTime,
      notes: "",
      createdAt: new Date().toISOString(),
      discountCode: applied?.code ?? "",
      paymentStatus: "paid",
    });
    if (applied) {
      updateRow(FILES.discounts, (row) => row.id === applied.id, { uses: String(Number(applied.uses) + 1) });
    }
    clear();
    toast.success("Payment successful, order sent to the store");
    nav({ to: "/orders/$orderId", params: { orderId } });
  };

  return (
    <div>
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/discover" className="grid h-9 w-9 place-items-center rounded-full bg-card shadow-soft">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-base font-bold">Your cart</h1>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="grid place-items-center px-6 pt-20 text-center">
          <div className="text-6xl">Empty</div>
          <p className="mt-4 text-base font-semibold">Your cart is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">Discover meals and add them here.</p>
          <Link to="/discover" className="mt-6 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
            Browse restaurants
          </Link>
        </div>
      ) : (
        <>
          <main className="space-y-3 px-4 pt-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl bg-card p-3 shadow-soft animate-slide-up">
                <div className="flex gap-3">
                  <MealPlaceholder name={item.name} className="h-20 w-20 text-3xl" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold leading-tight">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">{item.restaurantName}</p>
                    {item.options && item.options.length > 0 && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {item.options.map((option) => `${option.name}${option.qty && option.qty > 1 ? ` x${option.qty}` : ""}`).join(", ")}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-bold text-primary">
                      {naira(item.price)}
                      {item.servingUnit && <span className="text-[10px] font-semibold text-muted-foreground">/{item.servingUnit}</span>}
                    </p>
                  </div>
                  <button onClick={() => remove(item.id)} className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  value={item.notes ?? ""}
                  onChange={(event) => setNotes(item.id, event.target.value)}
                  placeholder="Add note (optional)..."
                  className="mt-2 w-full rounded-xl bg-muted px-3 py-2 text-xs outline-none placeholder:text-muted-foreground"
                />
                <div className="mt-2 flex items-center justify-end gap-3">
                  <button onClick={() => setQty(item.id, item.qty - 1)} className="grid h-7 w-7 place-items-center rounded-full border border-border">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-bold">{item.qty}</span>
                  <button onClick={() => setQty(item.id, item.qty + 1)} className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}

            <div className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Tag className="h-4 w-4 text-primary" />
                Promo code
              </div>
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
                    <input
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="Enter code"
                      className="flex-1 rounded-xl bg-muted px-3 py-2 text-sm font-mono uppercase outline-none placeholder:text-muted-foreground placeholder:normal-case placeholder:font-sans"
                    />
                    <button onClick={apply} className="rounded-xl bg-gradient-primary px-4 text-xs font-bold text-primary-foreground shadow-soft">
                      Apply
                    </button>
                  </div>
                  {restaurantDiscounts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {restaurantDiscounts.slice(0, 3).map((discount) => (
                        <button
                          key={discount.id}
                          onClick={() => { setCode(discount.code); }}
                          className="rounded-full border border-dashed border-primary/40 px-2 py-0.5 text-[10px] font-mono font-bold text-primary hover:bg-primary/5 transition"
                        >
                          {discount.code}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-primary" />
                Pickup time
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPickupMode("asap")}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${pickupMode === "asap" ? "border-primary bg-primary/10 text-foreground" : "border-border bg-muted/40 text-muted-foreground"}`}
                >
                  <p className="text-sm font-semibold">ASAP</p>
                  <p className="mt-1 text-xs">Send now and let the store prepare immediately.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPickupMode("scheduled")}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${pickupMode === "scheduled" ? "border-primary bg-primary/10 text-foreground" : "border-border bg-muted/40 text-muted-foreground"}`}
                >
                  <p className="text-sm font-semibold">Set a time</p>
                  <p className="mt-1 text-xs">Choose the pickup time you want.</p>
                </button>
              </div>
              {pickupMode === "scheduled" && (
                <div className="mt-3">
                  <input
                    type="datetime-local"
                    value={pickupAt}
                    min={getMinPickupTime()}
                    onChange={(event) => setPickupAt(event.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">The store will see this requested pickup time.</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-card p-4 shadow-soft">
              <p className="text-sm font-semibold">Payment and fulfilment</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Once you pay, the order goes straight to the store. The store also sees that the order is already paid.
              </p>
            </div>

            <div className="rounded-2xl bg-card p-4 shadow-soft">
              <Row label="Subtotal" value={naira(total)} />
              {applied && <Row label={`Discount (${applied.code})`} value={`- ${naira(discountAmount)}`} accent />}
              <Row label="Service fee" value={naira(fee)} />
              <div className="my-2 border-t border-border" />
              <Row label="Total" value={naira(grand)} bold />
            </div>
          </main>

          <div className="fixed bottom-16 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4 pb-3">
            <button
              onClick={place}
              disabled={placing}
              className="flex w-full items-center justify-between rounded-2xl bg-gradient-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow active:scale-95 disabled:opacity-70"
            >
              <span>{placing ? "Processing payment..." : "Pay and place order"}</span>
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

function toLocalInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function getDefaultPickupTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 30, 0, 0);
  return toLocalInputValue(date);
}

function getMinPickupTime() {
  return toLocalInputValue(new Date());
}
