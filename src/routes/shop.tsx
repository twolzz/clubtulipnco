// Goes in: src/routes/shop.tsx  (replace the whole file)

import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/ProductCard";

export const productsQO = queryOptions({
  queryKey: ["products", "all"] as const,
  queryFn: () => listProducts(),
});

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Tulip & Co." },
      { name: "description", content: "Curated Dutch plushies, stationery, and accessories." },
      { property: "og:title", content: "Shop — Tulip & Co." },
      { property: "og:description", content: "Curated Dutch plushies, stationery, and accessories." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQO),
  component: ShopPage,
  errorComponent: () => (
    <SiteLayout>
      <section className="px-5 md:px-8 py-24 text-center">
        <p className="font-display text-3xl font-extrabold">
          The shop is loading slowly — please refresh.
        </p>
      </section>
    </SiteLayout>
  ),
});

function ShopPage() {
  const { data: products } = useSuspenseQuery(productsQO);

  return (
    <SiteLayout>
      <section className="px-4 sm:px-5 md:px-8 py-10 sm:py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div>
            <span className="inline-block px-3 py-1 mb-4 sm:mb-6 rounded-full bg-sun border-[3px] border-ink text-sm font-bold">
              The Shop
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] md:leading-[1.02]">
              Quiet things, <span className="text-poppy">built to last.</span>
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-ink/80">
              Curated essentials. Sourced direct from Dutch makers and shipped from San Diego.
            </p>
          </div>

          {products.length === 0 ? (
            <p className="mt-14 text-lg font-semibold text-ink/70">
              Nothing in stock right now — check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-8 sm:mt-14">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
