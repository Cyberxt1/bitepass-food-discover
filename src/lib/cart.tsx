import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  mealId: string;
  name: string;
  price: number;
  image: string;
  restaurantId: string;
  restaurantName: string;
  qty: number;
  notes?: string;
};

type CartCtx = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (mealId: string) => void;
  setQty: (mealId: string, qty: number) => void;
  setNotes: (mealId: string, notes: string) => void;
  clear: () => void;
  total: number;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "bitepass:cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) setItems(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = (item: CartItem) =>
    setItems((prev) => {
      const ex = prev.find((p) => p.mealId === item.mealId);
      if (ex) return prev.map((p) => (p.mealId === item.mealId ? { ...p, qty: p.qty + item.qty } : p));
      return [...prev, item];
    });
  const remove = (mealId: string) => setItems((p) => p.filter((x) => x.mealId !== mealId));
  const setQty = (mealId: string, qty: number) =>
    setItems((p) => (qty <= 0 ? p.filter((x) => x.mealId !== mealId) : p.map((x) => (x.mealId === mealId ? { ...x, qty } : x))));
  const setNotes = (mealId: string, notes: string) =>
    setItems((p) => p.map((x) => (x.mealId === mealId ? { ...x, notes } : x)));
  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return <Ctx.Provider value={{ items, add, remove, setQty, setNotes, clear, total, count }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
