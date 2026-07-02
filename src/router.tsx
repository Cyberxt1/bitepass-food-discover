import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function RoutePending() {
  return (
    <div className="grid min-h-[45vh] place-items-center px-6">
      <div className="text-center" role="status" aria-live="polite">
        <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="mt-3 text-sm font-bold text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 80,
    defaultPreloadStaleTime: 0,
    defaultPendingMs: 120,
    defaultPendingMinMs: 350,
    defaultPendingComponent: RoutePending,
  });

  return router;
};
