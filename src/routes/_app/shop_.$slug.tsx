// STEP 3 of 7
// Goes in: src/routes/shop_.$slug.tsx
//
// This file is NEW. The filename must be EXACTLY shop_.$slug.tsx —
// underscore after "shop", dollar sign before "slug". That underscore gives
// you the URL /shop/some-slug WITHOUT nesting inside shop.tsx. Name it
// shop.$slug.tsx by mistake and the shop grid renders on every product page.

import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, Minus, Plus, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { getProductBySlug, listProducts, type Product } from "@/lib/products.functions";
import { ProductCard, ProductMedia, collectionSlug, formatPrice } from "@/components/ProductCard";
import { cart, cartDrawer } from "@/lib/cart-store";
import { ProductDetailSkeleton } from "@/components/Skeletons";

const productsQO = queryOptions({
  queryKey: ["products", "all"] as const,
  queryFn: () => listProducts(),
});

const productQO = (slug: string) =>
  queryOptions({
    queryKey: ["products", "detail", slug] as const,
    queryFn: () => getProductBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/_app/shop_/$slug")({
  head: (ctx: any) => {
    const p = ctx?.loaderData as Product | null | undefined;
    const title = p ? `${p.name} | Tulip & Co.` : "Product | Tulip & Co.";
    const description =
      p?.description ?? "Curated Dutch design, shipped from San Diego by Tulip & Co.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(p?.images?.[0] ? [{ property: "og:image", content: p.images[0] }] : []),
      ],
    };
  },
  loader: async ({ context, params }) => {
    const [product] = await Promise.all([
      context.queryClient.ensureQueryData(productQO(params.slug)),
      context.queryClient.ensureQueryData(productsQO),
    ]);
    return product;
  },
  component: ProductRoute,
  pendingComponent: ProductDetailSkeleton,
  errorComponent: () => (
    <>
      <section className="px-5 md:px-8 py-24 text-center">
        <p className="font-display text-3xl font-extrabold">
          Something went wrong loading this product.
        </p>
        <Link to="/shop" search={{}} className="tc-btn tc-btn-poppy mt-8 inline-flex">
          Back to the shop
        </Link>
      </section>
    </>
  ),
});

function ProductRoute() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQO(slug));
  const { data: all } = useSuspenseQuery(productsQO);

  if (!product) {
    return (
      <>
        <section className="px-5 md:px-8 py-24 text-center max-w-2xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl font-extrabold">
            We couldn&apos;t find that one
          </h1>
          <p className="mt-4 text-lg text-ink/70">
            It may have sold out or been retired from the collection.
          </p>
          <Link to="/shop" search={{}} className="tc-btn tc-btn-poppy mt-8 inline-flex">
            Browse the shop
          </Link>
        </section>
      </>
    );
  }

  const sameCategory = all.filter((p) => p.id !== product.id && p.category === product.category);
  const others = all.filter((p) => p.id !== product.id && p.category !== product.category);
  const related = [...sameCategory, ...others].slice(0, 3);

  return <ProductDetail product={product} related={related} />;
}

function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);

  const soldOut = product.stock_quantity <= 0;
  const lowStock = !soldOut && product.stock_quantity <= 5;
  const maxQty = soldOut ? 1 : Math.min(product.stock_quantity, 10);
  const hasGallery = product.images.length > 1;

  function changeQty(delta: number) {
    setQty((q) => Math.min(maxQty, Math.max(1, q + delta)));
  }

  function addToCart() {
    if (soldOut) return;
    cart.add(product.id, qty);
    // No toast — the drawer opening is the confirmation.
    cartDrawer.open();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    category: product.category,
    description: product.description ?? undefined,
    image: product.images.length ? product.images : undefined,
    brand: { "@type": "Brand", name: "Tulip & Co." },
    offers: {
      "@type": "Offer",
      price: (product.price_cents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="px-4 sm:px-5 md:px-8 py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb — the category now returns you to a filtered shop */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-ink/60 mb-6 sm:mb-10 flex-wrap"
          >
            <Link to="/shop" search={{}} className="hover:text-denim transition-colors">
              Shop
            </Link>
            <ChevronRight size={14} strokeWidth={2.5} className="shrink-0" />
            <Link
              to="/shop"
              search={{ collection: collectionSlug(product.category) }}
              className="hover:text-denim transition-colors"
            >
              {product.category}
            </Link>
            <ChevronRight size={14} strokeWidth={2.5} className="shrink-0" />
            <span className="text-ink">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
            {/* ---------- Gallery ---------- */}
            <div>
              <div className={`tc-card ${product.shadow} overflow-hidden`}>
                <ProductMedia product={product} src={product.images[activeImage]} priority />
              </div>

              {hasGallery && (
                <div className="mt-4 sm:mt-6 grid grid-cols-4 gap-2 sm:gap-3">
                  {product.images.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      aria-label={`View image ${i + 1} of ${product.images.length}`}
                      aria-current={i === activeImage}
                      className={`rounded-lg overflow-hidden border-[3px] bg-white transition-[filter,opacity,border-color] duration-fast ease-snap ${
                        i === activeImage
                          ? "border-poppy [filter:drop-shadow(3px_3px_0_var(--ink))]"
                          : "border-ink opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={url}
                        alt=""
                        loading="lazy"
                        className="w-full aspect-square object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ---------- Details ---------- */}
            <div className="lg:pt-2">
              <p className="text-xs font-bold uppercase tracking-widest text-ink/60">
                {product.category}
              </p>
              <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.08]">
                {product.name}
              </h1>

              <div className="mt-4 sm:mt-6 flex items-center gap-4 flex-wrap">
                <span className="text-3xl sm:text-4xl font-extrabold">
                  {formatPrice(product.price_cents)}
                </span>
                <span
                  className={`px-3 py-1 rounded-full border-[3px] border-ink text-xs font-bold ${
                    soldOut ? "bg-cream text-ink/60" : lowStock ? "bg-sun" : "bg-sage text-white"
                  }`}
                >
                  {soldOut
                    ? "Sold out"
                    : lowStock
                      ? `Only ${product.stock_quantity} left`
                      : "In stock"}
                </span>
              </div>

              <p className="mt-6 text-base sm:text-lg leading-relaxed text-ink/80">
                {product.description ??
                  "Sourced direct from Dutch makers and packed by hand in San Diego. Built to be used every day, not saved for a special occasion."}
              </p>

              {/* Quantity + add to cart */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                <div className="inline-flex items-center gap-1 rounded-full border-[3px] border-ink bg-white shadow-[4px_4px_0_var(--ink)] p-1 self-start">
                  <button
                    type="button"
                    onClick={() => changeQty(-1)}
                    disabled={qty <= 1 || soldOut}
                    aria-label="Decrease quantity"
                    className="w-10 h-10 inline-flex items-center justify-center rounded-full hover:bg-cream disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
                  >
                    <Minus size={18} strokeWidth={3} />
                  </button>
                  <span
                    aria-live="polite"
                    className="w-10 text-center font-extrabold text-lg tabular-nums"
                  >
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeQty(1)}
                    disabled={qty >= maxQty || soldOut}
                    aria-label="Increase quantity"
                    className="w-10 h-10 inline-flex items-center justify-center rounded-full hover:bg-cream disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
                  >
                    <Plus size={18} strokeWidth={3} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={addToCart}
                  disabled={soldOut}
                  className={`tc-btn ${soldOut ? "tc-btn-cream opacity-60 cursor-not-allowed" : "tc-btn-poppy"} flex-1 text-base`}
                >
                  {soldOut ? "Sold Out" : "Add to Cart"}
                </button>
              </div>

              {/* Trust strip */}
              <ul className="mt-10 flex flex-col gap-4 border-t-2 border-ink/15 pt-8">
                <li className="flex items-start gap-3">
                  <Truck size={20} strokeWidth={2.5} className="text-denim mt-0.5 shrink-0" />
                  <span className="text-sm font-semibold">
                    Ships from San Diego in 1–2 business days.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <RotateCcw size={20} strokeWidth={2.5} className="text-denim mt-0.5 shrink-0" />
                  <span className="text-sm font-semibold">
                    30-day returns.{" "}
                    <Link
                      to="/support"
                      search={{ tab: "shipping" as const }}
                      className="underline decoration-2 underline-offset-4 hover:text-denim"
                    >
                      Shipping &amp; returns
                    </Link>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck size={20} strokeWidth={2.5} className="text-denim mt-0.5 shrink-0" />
                  <span className="text-sm font-semibold">
                    Secure checkout: Visa, Mastercard, Amex, Klarna.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* ---------- Related ---------- */}
          {related.length > 0 && (
            <div className="mt-20 sm:mt-28">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                You may also like
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-10">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
