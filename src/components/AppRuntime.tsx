import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChefHat, Home, Receipt, Search, ShoppingBag, User as UserIcon } from "lucide-react";
import { useEffect } from "react";

import { BottomNav } from "@/components/BottomNav";
import { RouteLoadingOverlay } from "@/components/RouteLoadingOverlay";
import { Toaster } from "@/components/ui/sonner";
import { trackAuditEvent } from "@/lib/audit";
import { AuthProvider, getDashboardPath, useAuth } from "@/lib/auth";
import { CartProvider, useCart } from "@/lib/cart";
import { NotificationsProvider } from "@/lib/notifications";
import { ensureSeed } from "@/lib/seed";
import { ThemeProvider } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function AppRuntime({ queryClient }: { queryClient: QueryClient }) {
  useEffect(() => {
    ensureSeed();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <NotificationsProvider>
              <AppShell />
              <BottomNav />
              <Toaster position="top-center" richColors closeButton offset={20} />
            </NotificationsProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppShell() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const { authReady, user } = useAuth();
  const fullWidth =
    path === "/" ||
    path === "/login" ||
    path === "/signup" ||
    path.startsWith("/business") ||
    path.startsWith("/admin");
  const showOverlay = !authReady;
  const isAuthPage = path === "/login" || path === "/signup";
  const isPublicPage = path === "/" || isAuthPage || path.startsWith("/admin");

  useEffect(() => {
    if (!authReady) return;
    trackAuditEvent({
      type: "page_view",
      actorId: user?.id,
      actorName: user?.name,
      targetId: path,
      targetType: "page",
      title: `Viewed ${path}`,
      detail: user ? `${user.name} opened ${path}` : `Guest opened ${path}`,
    });

    if ((path === "/" || isAuthPage) && user) {
      navigate({ to: getDashboardPath(user), replace: true });
      return;
    }

    if (!isPublicPage && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [authReady, isAuthPage, isPublicPage, navigate, path, user]);

  if (fullWidth) {
    return (
      <>
        <div
          className={`min-h-screen bg-background transition duration-200 ${showOverlay ? "blur-sm opacity-60" : ""}`}
        >
          <Outlet />
        </div>
        <RouteLoadingOverlay visible={showOverlay} />
      </>
    );
  }

  return (
    <>
      <div
        className={`min-h-screen bg-background transition duration-200 ${showOverlay ? "blur-sm opacity-60" : ""}`}
      >
        <DesktopUserNav />
        <div
          key={path}
          className="mx-auto min-h-screen w-full max-w-md pb-32 lg:max-w-none lg:pb-0 lg:pl-24 xl:pl-28"
        >
          <Outlet />
        </div>
      </div>
      <RouteLoadingOverlay visible={showOverlay} />
    </>
  );
}

const userNavItems: {
  to: "/discover" | "/search" | "/cart" | "/orders" | "/profile";
  label: string;
  icon: typeof Home;
  badge?: boolean;
}[] = [
  { to: "/discover", label: "Discover", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/cart", label: "Cart", icon: ShoppingBag, badge: true },
  { to: "/orders", label: "Orders", icon: Receipt },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

function DesktopUserNav() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const { count } = useCart();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-24 border-r border-border/70 bg-card/90 px-3 py-5 shadow-soft backdrop-blur-xl lg:flex xl:w-28">
      <div className="flex w-full flex-col items-center">
        <Link
          to="/discover"
          aria-label="BitePass home"
          className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow"
        >
          <ChefHat className="h-5 w-5" />
        </Link>

        <nav className="mt-8 flex w-full flex-1 flex-col items-center gap-2">
          {userNavItems.map(({ to, label, icon: Icon, badge }) => {
            const active = to === "/discover" ? path === "/discover" : path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "group relative flex h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold transition",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {badge && count > 0 && (
                    <span className="absolute -right-2.5 -top-2 grid min-h-4 min-w-4 place-items-center rounded-full bg-gradient-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                <span>{label}</span>
                {active && (
                  <span className="absolute left-1 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="h-12" />
      </div>
    </aside>
  );
}
