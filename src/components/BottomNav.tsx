import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, ShoppingBag, Receipt, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

const items: { to: "/discover" | "/search" | "/cart" | "/orders" | "/profile"; label: string; icon: typeof Home; badge?: boolean }[] = [
  { to: "/discover", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/cart", label: "Cart", icon: ShoppingBag, badge: true },
  { to: "/orders", label: "Orders", icon: Receipt },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useCart();

  const hidden =
    path === "/" ||
    path.startsWith("/admin") ||
    path.startsWith("/business") ||
    path === "/login" ||
    path === "/signup" ||
    path === "/splash";
  if (hidden) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background shadow-[0_-12px_32px_-24px_oklch(0.2_0.03_45)] pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {items.map(({ to, label, icon: Icon, badge }) => {
          const active = to === "/discover" ? path === "/discover" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-all",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
                {badge && count > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-primary px-1 text-[10px] font-bold text-primary-foreground shadow-glow">
                    {count}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
              {active && <span className="absolute -bottom-2 h-1 w-1 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
