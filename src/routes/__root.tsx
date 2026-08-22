import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { SiteLayout } from "@/components/SiteLayout";

// Rendered inside the site chrome so a 404 still has navigation and a way
// back. Deliberately a notFoundComponent rather than a catch-all route: a
// splat would match every unknown path and answer 200, turning genuine 404s
// into soft-404s that search engines treat as real pages.
function NotFoundComponent() {
  return (
    <SiteLayout>
      <section className="px-5 md:px-8 py-20 md:py-28">
        <div className="max-w-xl mx-auto tc-card p-8 md:p-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-ink/55 mb-3">404</p>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold mb-3">
            We couldn&apos;t find that
          </h1>
          <p className="text-ink/70 mb-7">
            The page may have moved, or the link may be out of date.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="tc-btn tc-btn-sun inline-flex">
              Back to home
            </Link>
            <Link to="/shop" className="tc-btn tc-btn-cream inline-flex">
              Browse the shop
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Tulip & Co. | Authentic Dutch Design" },
      {
        name: "description",
        content:
          "Premium Dutch stationery, plushies, and Miffy collectibles. Curated in San Diego.",
      },
      { name: "author", content: "Tulip & Co." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Tulip & Co. | Authentic Dutch Design" },
      { name: "twitter:title", content: "Tulip & Co. | Authentic Dutch Design" },
      {
        property: "og:description",
        content:
          "Premium Dutch stationery, plushies, and Miffy collectibles. Curated in San Diego.",
      },
      {
        name: "twitter:description",
        content:
          "Premium Dutch stationery, plushies, and Miffy collectibles. Curated in San Diego.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/023db74a-1f7d-43e6-a835-8e7ec653fe20/id-preview-3de8c346--730d208e-2a7b-48b2-91ac-f83177a702bb.lovable.app-1782268820663.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/023db74a-1f7d-43e6-a835-8e7ec653fe20/id-preview-3de8c346--730d208e-2a7b-48b2-91ac-f83177a702bb.lovable.app-1782268820663.png",
      },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "https://i.imgur.com/HxWe3nz.png" },
      { rel: "apple-touch-icon", href: "https://i.imgur.com/HxWe3nz.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
