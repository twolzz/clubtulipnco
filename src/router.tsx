import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Product and pop-up data changes rarely; without this every route
        // entry refetches immediately and navigation feels like it stalls.
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,

    // Start loading on hover (desktop) and touchstart (mobile). A touch
    // lands 80–150ms before the click fires, which is usually enough to have
    // the next route's data cached before the tap completes.
    defaultPreload: "intent",
    defaultPreloadDelay: 50,
    // Query's own staleTime governs freshness, so preloads can always serve
    // from cache rather than refetching on arrival.
    defaultPreloadStaleTime: 0,

    // Only show a pending state if the load is genuinely slow (>180ms), and
    // once shown keep it up long enough to read instead of strobing.
    defaultPendingMs: 180,
    defaultPendingMinMs: 320,

    // A subtle crossfade on the page content only (see styles.css) — never
    // on a same-path navigation, e.g. a /shop?collection= filter tap, where
    // a page-level transition would just read as a delay.
    defaultViewTransition: {
      types: ({ pathChanged }) => (pathChanged ? ["page"] : false),
    },
  });

  return router;
};
