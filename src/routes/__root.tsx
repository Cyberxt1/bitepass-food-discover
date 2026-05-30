import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { ensureSeed } from "@/lib/seed";
import { BottomNav } from "@/components/BottomNav";
import { Splash } from "@/components/Splash";
import { RouteLoadingOverlay } from "@/components/RouteLoadingOverlay";

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
            {ready && !splashDone && <Splash onDone={() => setSplashDone(true)} />}
            <AppShell />
            <BottomNav />
            <Toaster position="top-center" richColors closeButton />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isLoading = useRouterState({ select: (s) => s.status === "pending" });
  const { authReady } = useAuth();
  const fullWidth = path === "/" || path.startsWith("/business") || path.startsWith("/admin");
  const showOverlay = isLoading || !authReady;

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
      <div className={`mx-auto min-h-screen max-w-md bg-background pb-24 transition duration-200 ${showOverlay ? "blur-sm opacity-60" : ""}`}>
        <Outlet />
      </div>
      <RouteLoadingOverlay visible={showOverlay} />
    </>
  );
}
