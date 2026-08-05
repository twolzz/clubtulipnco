import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

/**
 * Pathless layout route ("_app" adds no URL segment).
 *
 * Every page that should sit inside the site chrome lives in this directory.
 * Because the header, nav, cart button and footer are rendered here rather
 * than by each page, they stay mounted across navigation instead of being
 * torn down and rebuilt on every route change.
 *
 * Deliberately outside it: /unsubscribe (renders standalone, no chrome) and
 * everything under /api (server routes, no React at all).
 */
export const Route = createFileRoute("/_app")({
  component: AppLayout,
  errorComponent: AppErrorPanel,
});

function AppLayout() {
  return (
    <SiteLayout>
      <Outlet />
    </SiteLayout>
  );
}

function AppErrorPanel({ error }: { error: Error }) {
  return (
    <SiteLayout>
      <section className="px-5 md:px-8 py-20 md:py-28">
        <div className="max-w-xl mx-auto tc-card p-8 md:p-10 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold mb-3">
            Something went wrong
          </h1>
          <p className="text-ink/70 mb-7">{error?.message ?? "An unexpected error occurred."}</p>
          <Link to="/" className="tc-btn tc-btn-sun inline-flex">
            Back to home
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
