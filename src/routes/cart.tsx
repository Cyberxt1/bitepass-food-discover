import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckSquare, Clock, Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { naira } from "@/lib/format";
import { backend } from "@/lib/backend";
import { isPaystackConfigured, startPaystackPayment } from "@/lib/paystack";
import { notify } from "@/lib/notifications";
import type { Restaurant } from "@/lib/seed";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { items, setQty, remove, setNotes, setOptionQty } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [checkoutStage, setCheckoutStage] = useState("Pay and place order");
  const [pickupMode, setPickupMode] = useState<"asap" | "scheduled">("asap");
  const [pickupAt, setPickupAt] = useState(getDefaultPickupTime());
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | undefined>();
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedItemIds((current) => {
      const itemIds = new Set(items.map((item) => item.id));
      const next = new Set([...current].filter((id) => itemIds.has(id)));
      items.forEach((item) => {
        if (!current.has(item.id)) next.add(item.id);
      });
      return next;
    });
  }, [items]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedItemIds.has(item.id)),
    [items, selectedItemIds],
  );
  const selectedSubtotal = selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const restaurantId = selectedItems[0]?.restaurantId ?? items[0]?.restaurantId ?? "";
  const restaurantClosed = currentRestaurant?.isOpen === "0";
  const fee = selectedItems.length > 0 ? 200 : 0;
  const grand = selectedSubtotal + fee;

  useEffect(() => {
    if (!restaurantId) {
      setCurrentRestaurant(undefined);
      return;
    }

    let cancelled = false;
    async function loadRestaurant() {
      const restaurant = (await backend.restaurants()).find((entry) => entry.id === restaurantId);
      if (!cancelled) setCurrentRestaurant(restaurant);
    }
    void loadRestaurant();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const place = async () => {
    if (placing) return;
    if (!user) {
      notify("info", "Please sign in to checkout", { id: "cart-login-required" });
      nav({ to: "/login" });
      return;
    }
    if (selectedItems.length === 0) {
      notify("info", "Select at least one cart item to checkout", { id: "cart-select-required" });
      return;
    }

    const restaurant = (await backend.restaurants()).find((entry) => entry.id === restaurantId);
    if (!restaurant || restaurant.isOpen === "0") {
      notify("error", "You can't place an order because this restaurant is closed", {
        id: "cart-restaurant-closed",
      });
      return;
    }
    if (
      isPaystackConfigured() &&
      (!restaurant.paystackSubaccount?.trim() || restaurant.paymentSetupStatus !== "ready")
    ) {
      notify("error", "This store has not finished payment setup yet", {
        id: `cart-payment-setup:${restaurant.id}`,
      });
      return;
    }

    if (pickupMode === "scheduled") {
      if (!pickupAt) {
        notify("error", "Choose a pickup time", { id: "cart-pickup-required" });
        return;
      }

      const scheduledPickup = new Date(pickupAt);
      if (Number.isNaN(scheduledPickup.getTime())) {
        notify("error", "Choose a valid pickup time", { id: "cart-pickup-invalid" });
        return;
      }

      if (scheduledPickup.getTime() < Date.now()) {
        notify("error", "Pickup time must be in the future", { id: "cart-pickup-past" });
        return;
      }
    }

    setPlacing(true);
    setCheckoutStage("Opening payment...");
    try {
      const orderId = "o" + Date.now();
      const paymentReference = await startPaystackPayment({
        amountNaira: grand,
        email: user.email,
        name: user.name,
        reference: `bitepass-${orderId}`,
        address: user.address,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        subaccountCode: restaurant.paystackSubaccount?.trim(),
        platformFeeNaira: fee,
      });
      setCheckoutStage("Sending order to kitchen...");
      const pickupTime =
        pickupMode === "scheduled" && pickupAt
          ? new Date(pickupAt).toISOString()
          : new Date().toISOString();
      await backend.addOrder({
        id: orderId,
        userId: user.id,
        restaurantId,
        items: JSON.stringify(
          selectedItems.map((item) => ({
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
        discountCode: "",
        paymentStatus: "paid",
        paymentReference,
        paymentRecipient: restaurant.paystackSubaccount?.trim() || "platform",
      });
      setCheckoutStage("Order received...");
      selectedItems.forEach((item) => remove(item.id));
      notify("success", "Payment successful, order sent to the store", {
        id: `order-paid:${orderId}`,
      });
      nav({ to: "/orders/$orderId", params: { orderId } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment could not be completed";
      notify("error", message, { id: `cart-payment-error:${message}` });
    } finally {
      setPlacing(false);
      setCheckoutStage("Pay and place order");
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/discover"
            className="grid h-9 w-9 place-items-center rounded-full bg-card shadow-soft"
          >
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
          <Link
            to="/discover"
            className="mt-6 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Browse restaurants
          </Link>
        </div>
      ) : (
        <>
          <main className="mx-auto grid max-w-5xl gap-4 px-4 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8 lg:pt-8">
            <section className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 shadow-soft">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <p className="text-sm font-bold">{selectedItems.length} selected</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedItemIds(
                      selectedItems.length === items.length
                        ? new Set()
                        : new Set(items.map((item) => item.id)),
                    )
                  }
                  className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-accent"
                >
                  {selectedItems.length === items.length ? "Uncheck all" : "Check all"}
                </button>
              </div>
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl bg-card p-3 shadow-soft animate-slide-up">
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.has(item.id)}
                      onChange={(event) => {
                        setSelectedItemIds((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(item.id);
                          else next.delete(item.id);
                          return next;
                        });
                      }}
                      className="mt-4 h-4 w-4 shrink-0 accent-primary"
                      aria-label={`Select ${item.name}`}
                    />
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-14 sm:w-14">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center px-2 text-center text-[10px] font-black leading-tight">
                          {item.name.split(" ").slice(0, 2).join(" ")}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold leading-tight">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">{item.restaurantName}</p>
                      {item.options && item.options.length > 0 && (
                        <div className="mt-1 space-y-1.5">
                          {item.options.map((option) => (
                            <div
                              key={option.id}
                              className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-2 py-1"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-[11px] font-medium text-muted-foreground">
                                  {option.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {naira(option.price)} each
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOptionQty(item.id, option.id, (option.qty ?? 1) - 1)
                                  }
                                  className="grid h-6 w-6 place-items-center rounded-full border border-border"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-4 text-center text-xs font-bold">
                                  {option.qty ?? 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOptionQty(item.id, option.id, (option.qty ?? 1) + 1)
                                  }
                                  className="grid h-6 w-6 place-items-center rounded-full bg-gradient-primary text-primary-foreground"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="mt-1 text-sm font-bold text-primary">
                        {naira(item.price)}
                        {item.servingUnit && (
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            /{item.servingUnit}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(item.id)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground"
                    >
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
                    <button
                      onClick={() => setQty(item.id, item.qty - 1)}
                      className="grid h-7 w-7 place-items-center rounded-full border border-border"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold">{item.qty}</span>
                    <button
                      onClick={() => setQty(item.id, item.qty + 1)}
                      className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-primary-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </section>

            <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
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
                    <p className="mt-1 text-xs">Prepare right away</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickupMode("scheduled")}
                    className={`rounded-2xl border px-3 py-3 text-left transition ${pickupMode === "scheduled" ? "border-primary bg-primary/10 text-foreground" : "border-border bg-muted/40 text-muted-foreground"}`}
                  >
                    <p className="text-sm font-semibold">Set a time</p>
                    <p className="mt-1 text-xs">Choose pickup time</p>
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
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-card p-4 shadow-soft">
                <p className="text-sm font-semibold">Payment</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isPaystackConfigured()
                    ? "Checkout is powered by Paystack."
                    : "Demo checkout is active until Paystack is configured."}
                </p>
                {restaurantClosed && (
                  <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                    This restaurant is closed. You cannot place this order until it reopens.
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-card p-4 shadow-soft">
                <Row label="Subtotal" value={naira(selectedSubtotal)} />
                <Row label="Service fee" value={naira(fee)} />
                <div className="my-2 border-t border-border" />
                <Row label="Total" value={naira(grand)} bold />
              </div>
            </aside>
          </main>

          <div className="fixed bottom-16 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4 pb-3 lg:bottom-6 lg:left-auto lg:right-8 lg:max-w-sm lg:translate-x-0">
            <button
              onClick={place}
              disabled={placing || restaurantClosed || selectedItems.length === 0}
              className="flex w-full items-center justify-between rounded-2xl bg-gradient-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow active:scale-95 disabled:opacity-70"
            >
              <span>{placing ? checkoutStage : "Pay and place order"}</span>
              <span>{naira(grand)}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 text-sm ${bold ? "font-bold" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
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
