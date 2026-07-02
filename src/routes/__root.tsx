import { QueryClient } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  useNavigate,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

import { hasActiveSession } from "@/lib/session-cookie";
import { isRunningAsPwa } from "@/lib/pwa";

const AppRuntime = lazy(() => import("@/components/AppRuntime"));

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The dish you're looking for isn't on the menu.
        </p>
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
  const path = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const [resumeSession, setResumeSession] = useState(false);
  const runningAsPwa = isRunningAsPwa();

  useEffect(() => {
    if (path === "/" && runningAsPwa) {
      navigate({ to: "/discover", replace: true });
      return;
    }
    setResumeSession(path === "/" && hasActiveSession());
  }, [navigate, path, runningAsPwa]);

  if (path === "/" && runningAsPwa) {
    return <AppLoadingFallback />;
  }

  if (path === "/" && !resumeSession) {
    return <Outlet />;
  }

  return (
    <Suspense fallback={<AppLoadingFallback />}>
      <AppRuntime queryClient={queryClient} />
    </Suspense>
  );
}

function AppLoadingFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="text-center">
        <img
          src="/splash-logo.jpg"
          alt="BitePass"
          className="mx-auto w-64 max-w-[72vw] rounded-2xl"
        />
        <span className="mx-auto mt-5 block h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="mt-4 text-sm font-bold">Opening BitePass...</p>
      </div>
    </div>
  );
}
