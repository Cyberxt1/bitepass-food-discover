import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  id: string;
  mealId: string;
  name: string;
  price: number;
  basePrice?: number;
  servingUnit?: string;
  image: string;
  restaurantId: string;
  restaurantName: string;
  qty: number;
  notes?: string;
  options?: { id: string; name: string; price: number; qty?: number }[];
};

type CartCtx = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (itemId: string) => void;
  setQty: (itemId: string, qty: number) => void;
  setNotes: (itemId: string, notes: string) => void;
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
      const existing = prev.find((entry) => entry.id === item.id);
      if (existing) {
        return prev.map((entry) => (entry.id === item.id ? { ...entry, qty: entry.qty + item.qty } : entry));
      }
      return [...prev, item];
    });

  const remove = (itemId: string) => setItems((prev) => prev.filter((item) => item.id !== itemId));
  const setQty = (itemId: string, qty: number) =>
    setItems((prev) => (qty <= 0 ? prev.filter((item) => item.id !== itemId) : prev.map((item) => (item.id === itemId ? { ...item, qty } : item))));
  const setNotes = (itemId: string, notes: string) =>
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, notes } : item)));
  const clear = () => setItems([]);

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = items.reduce((sum, item) => sum + item.qty, 0);

  return <Ctx.Provider value={{ items, add, remove, setQty, setNotes, clear, total, count }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
