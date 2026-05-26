import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { ensureSeed } from "@/lib/seed";
import { BottomNav } from "@/components/BottomNav";
import { Splash } from "@/components/Splash";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The dish you're looking for isn't on the menu.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
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
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "BitePass — Preorder. Skip the line. Eat better." },
      { name: "description", content: "Discover nearby restaurants, preorder meals, pay ahead and track live preparation status." },
      { name: "theme-color", content: "#f97316" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [ready, setReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    ensureSeed();
    setReady(true);
    const seen = sessionStorage.getItem("bitepass:splash");
    if (seen) setSplashDone(true);
  }, []);

  const finishSplash = () => {
    sessionStorage.setItem("bitepass:splash", "1");
    setSplashDone(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            {ready && !splashDone && <Splash onDone={finishSplash} />}
            <div className="mx-auto min-h-screen max-w-md bg-background pb-24">
              <Outlet />
            </div>
            <BottomNav />
            <Toaster position="top-center" richColors closeButton />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
