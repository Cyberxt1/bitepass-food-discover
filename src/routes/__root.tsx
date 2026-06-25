import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChefHat, Home, Receipt, Search, ShoppingBag, User as UserIcon } from "lucide-react";

import { ThemeProvider } from "@/lib/theme";
import { AuthProvider, getDashboardPath, useAuth } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { NotificationsProvider } from "@/lib/notifications";
import { ensureSeed } from "@/lib/seed";
import { BottomNav } from "@/components/BottomNav";
import { Splash } from "@/components/Splash";
import { RouteLoadingOverlay } from "@/components/RouteLoadingOverlay";
import { Toaster } from "@/components/ui/sonner";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { trackAuditEvent } from "@/lib/audit";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The dish you're looking for isn't on the menu.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Back to discover
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [ready, setReady] = useState(false);
  const [splashDone, setSplashDone] = useState(true);

  useEffect(() => {
    ensureSeed();
    setReady(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <NotificationsProvider>
              {ready && !splashDone && <Splash onDone={() => setSplashDone(true)} />}
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
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNavigate();
  const { authReady, updateProfile, user } = useAuth();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<"next" | "previous" | null>(null);
  const fullWidth = path === "/" || path === "/login" || path === "/signup" || path.startsWith("/business") || path.startsWith("/admin");
  const showOverlay = !authReady;
  const isAuthPage = path === "/login" || path === "/signup";
  const isAdminPage = path.startsWith("/admin");
  const isPublicPage = path === "/" || isAuthPage || isAdminPage;
  const swipeRoutes = userNavItems.map((item) => item.to);
  const activeSwipeIndex = swipeRoutes.findIndex((to) => (to === "/discover" ? path === "/discover" : path.startsWith(to)));

  const handleTouchEnd = (clientX: number, clientY: number) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || activeSwipeIndex < 0 || window.matchMedia("(min-width: 1024px)").matches) return;

    const deltaX = clientX - start.x;
    const deltaY = clientY - start.y;
    if (Math.abs(deltaX) < 90 || Math.abs(deltaX) < Math.abs(deltaY) * 1.4) return;

    const nextIndex = deltaX < 0 ? activeSwipeIndex + 1 : activeSwipeIndex - 1;
    const nextRoute = swipeRoutes[nextIndex];
    if (nextRoute) {
      setSwipeDirection(deltaX < 0 ? "next" : "previous");
      nav({ to: nextRoute });
    }
  };

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

    if (path === "/" && user) {
      nav({ to: getDashboardPath(user), replace: true });
      return;
    }

    if (isAuthPage && user) {
      nav({ to: getDashboardPath(user), replace: true });
      return;
    }

    if (!isPublicPage && !user) {
      nav({ to: "/login", replace: true });
    }
  }, [authReady, isAuthPage, isPublicPage, nav, path, user]);

  if (fullWidth) {
    return (
      <>
        <div className={`min-h-screen bg-background transition duration-200 ${showOverlay ? "blur-sm opacity-60" : ""}`}>
          <Outlet />
        </div>
        <RouteLoadingOverlay visible={showOverlay} />
      </>
    );
  }

  return (
    <>
      <div className={`min-h-screen bg-background transition duration-200 ${showOverlay ? "blur-sm opacity-60" : ""}`}>
        <DesktopUserNav />
        <div
          key={path}
          className="mx-auto min-h-screen w-full max-w-md pb-32 lg:max-w-none lg:pb-0 lg:pl-24 xl:pl-28"
          data-swipe-direction={swipeDirection ?? undefined}
          onAnimationEnd={() => setSwipeDirection(null)}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
          }}
          onTouchEnd={(event) => {
            const touch = event.changedTouches[0];
            if (touch) handleTouchEnd(touch.clientX, touch.clientY);
          }}
        >
          <Outlet />
        </div>
      </div>
      <RouteLoadingOverlay visible={showOverlay} />
    </>
  );
}

const userNavItems: { to: "/discover" | "/search" | "/cart" | "/orders" | "/profile"; label: string; icon: typeof Home; badge?: boolean }[] = [
  { to: "/discover", label: "Discover", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/cart", label: "Cart", icon: ShoppingBag, badge: true },
  { to: "/orders", label: "Orders", icon: Receipt },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

function DesktopUserNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
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
                {active && <span className="absolute left-1 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="h-12" />
      </div>
    </aside>
  );
}
