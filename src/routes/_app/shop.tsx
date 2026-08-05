// STEP 2 of 7
// Goes in: src/routes/shop.tsx  (replace the whole file)

import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/products.functions";
import { ProductCard, collectionSlug } from "@/components/ProductCard";
import { ShopSkeleton } from "@/components/Skeletons";

export const productsQO = queryOptions({
  queryKey: ["products", "all"] as const,
  queryFn: () => listProducts(),
});

type ShopSearch = {
  /** Left undefined for "everything", which keeps the URL as a clean /shop */
  collection?: string;
};

export const Route = createFileRoute("/_app/shop")({
  /**
   * Reads ?collection= off the URL. Anything unrecognised is dropped rather
   * than throwing, so a mistyped link still lands on a working shop page.
   */
  validateSearch: (search: Record<string, unknown>): ShopSearch => {
    const raw = search.collection;
    if (typeof raw !== "string") return {};
    const slug = collectionSlug(raw);
    return slug && slug !== "all" ? { collection: slug } : {};
  },
  head: () => ({
    meta: [
      { title: "Shop — Tulip & Co." },
      { name: "description", content: "Curated Dutch plushies, stationery, and accessories." },
      { property: "og:title", content: "Shop — Tulip & Co." },
      {
        property: "og:description",
        content: "Curated Dutch plushies, stationery, and accessories.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQO),
  component: ShopPage,
  pendingComponent: ShopSkeleton,
  errorComponent: () => (
    <>
      <section className="px-5 md:px-8 py-24 text-center">
        <p className="font-display text-3xl font-extrabold">
          The shop is loading slowly — please refresh.
        </p>
      </section>
    </>
  ),
});

function ShopPage() {
  const { data: products } = useSuspenseQuery(productsQO);
  const { collection } = Route.useSearch();

  // Build the pills from the data itself, in sort_order sequence, so adding a
  // fourth collection in Supabase needs no code change here.
  const categories: string[] = [];
  for (const p of products) {
    if (!categories.includes(p.category)) categories.push(p.category);
  }

  const active = collection ?? "all";
  const visible =
    active === "all" ? products : products.filter((p) => collectionSlug(p.category) === active);

  const activeLabel = categories.find((c) => collectionSlug(c) === active);

  const filters = [
    { slug: "all", label: "All" },
    ...categories.map((c) => ({ slug: collectionSlug(c), label: c })),
  ];

  return (
    <>
      <section className="px-4 sm:px-5 md:px-8 py-10 sm:py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div>
            <span className="inline-block px-3 py-1 mb-4 sm:mb-6 rounded-full bg-sun border-[3px] border-ink text-sm font-bold">
              The Shop
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] md:leading-[1.02]">
              Quiet things, <span className="text-poppy">built to last</span>
            </h1>
          </div>

          {/* ---------- Collection filter ---------- */}
          <nav
            aria-label="Filter by collection"
            className="mt-8 sm:mt-12 flex flex-wrap items-center gap-2 sm:gap-3"
          >
            {filters.map((f) => {
              const isActive = f.slug === active;
              return (
                <Link
                  key={f.slug}
                  to="/shop"
                  search={f.slug === "all" ? {} : { collection: f.slug }}
                  resetScroll={false}
                  aria-current={isActive ? "page" : undefined}
                  className={`px-4 sm:px-5 py-2 rounded-full border-[3px] border-ink text-sm font-bold ${
                    isActive
                      ? "bg-ink text-cream shadow-[3px_3px_0_var(--poppy)]"
                      : "bg-white tc-press [--press-rest:0px] [--press-hover:3px]"
                  }`}
                >
                  {f.label}
                </Link>
              );
            })}
          </nav>

          <p className="mt-4 text-sm font-semibold text-ink/55">
            {visible.length} {visible.length === 1 ? "item" : "items"}
            {activeLabel ? ` in ${activeLabel}` : ""}
          </p>

          {/* ---------- Grid ---------- */}
          {visible.length === 0 ? (
            <div className="mt-10 sm:mt-14 py-12 text-center">
              <p className="text-lg font-semibold text-ink/70">
                Nothing in this collection right now.
              </p>
              <Link to="/shop" search={{}} className="tc-btn tc-btn-poppy mt-6 inline-flex">
                Show everything
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
