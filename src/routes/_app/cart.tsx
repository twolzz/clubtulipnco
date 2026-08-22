// STEP 6 of 7
// Goes in: src/routes/cart.tsx  (replace the whole file)

import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, Plus, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { cart, useCart, type CartItem } from "@/lib/cart-store";
import { listProducts, type Product } from "@/lib/products.functions";
import { ProductMedia, formatPrice } from "@/components/ProductCard";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const STAGGER_MS = 60;

export const Route = createFileRoute("/_app/cart")({
  head: () => ({
    meta: [
      { title: "Cart | Tulip & Co." },
      { name: "description", content: "Review the quiet Dutch design in your cart." },
      { property: "og:title", content: "Cart | Tulip & Co." },
      { property: "og:description", content: "Review your cart." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items } = useCart();
  const listFn = useServerFn(listProducts);
  const { data: products } = useQuery<Product[]>({
    queryKey: ["products", "all"],
    queryFn: () => listFn({}),
    staleTime: 60_000,
  });

  const map = new Map((products ?? []).map((p) => [p.id, p]));
  const lines = items
    .map((i) => ({ item: i, product: map.get(i.productId) }))
    .filter((l): l is { item: typeof l.item; product: Product } => Boolean(l.product));
  const subtotal = lines.reduce((s, l) => s + l.product.price_cents * l.item.qty, 0);

  const emptyCard = useScrollReveal<HTMLDivElement>();
  const summary = useScrollReveal<HTMLDivElement>();

  return (
    <>
      <section className="px-5 md:px-8 py-14 md:py-20">
        <div className="max-w-4xl mx-auto">
          <nav className="text-sm font-semibold text-ink/70 mb-6">
            <Link to="/" className="hover:text-denim">
              Home
            </Link>
            <span className="mx-2 text-ink/40">/</span>
            <span className="text-ink">Cart</span>
          </nav>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-10">Your Cart</h1>

          {lines.length === 0 ? (
            <div
              ref={emptyCard.ref}
              style={emptyCard.style}
              className={`tc-card tc-card-sun p-10 md:p-16 text-center bg-cream tc-reveal ${emptyCard.visible ? "tc-reveal-visible" : ""}`}
            >
              <p className="font-display text-3xl font-extrabold mb-3">Nothing here yet.</p>
              <p className="text-ink/70 mb-6">Quiet things await.</p>
              <Link to="/shop" className="tc-btn tc-btn-poppy inline-flex">
                Browse the Shop
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-4">
                {lines.map(({ item, product }, i) => (
                  <CartLine key={item.productId} item={item} product={product} index={i} />
                ))}
              </ul>

              <div
                ref={summary.ref}
                style={summary.style}
                className={`mt-10 tc-card tc-card-poppy p-6 md:p-8 bg-cream tc-reveal ${summary.visible ? "tc-reveal-visible" : ""}`}
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="font-semibold text-lg">Subtotal</span>
                  <span className="font-extrabold text-3xl">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex flex-wrap gap-3 justify-end">
                  <Link to="/shop" className="tc-btn tc-btn-cream">
                    Continue Shopping
                  </Link>
                  <Link to="/checkout" className="tc-btn tc-btn-poppy">
                    Checkout
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

function CartLine({
  item,
  product,
  index,
}: {
  item: CartItem;
  product: Product;
  index: number;
}) {
  const reveal = useScrollReveal<HTMLLIElement>(Math.min(index, 4) * STAGGER_MS);

  return (
    <li
      ref={reveal.ref}
      style={reveal.style}
      className={`flex gap-4 sm:gap-5 items-start rounded-2xl border-4 border-ink bg-white p-4 sm:p-5 shadow-[6px_6px_0_var(--ink)] tc-reveal ${reveal.visible ? "tc-reveal-visible" : ""}`}
    >
      <Link
        to="/shop/$slug"
        params={{ slug: product.slug }}
        aria-label={`View ${product.name}`}
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-[3px] border-ink shrink-0 overflow-hidden"
      >
        <ProductMedia product={product} className="w-full h-full" />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-ink/60">
              {product.category}
            </p>
            <Link
              to="/shop/$slug"
              params={{ slug: product.slug }}
              className="block font-semibold text-base sm:text-lg hover:text-denim transition-colors"
            >
              {product.name}
            </Link>
          </div>
          <span className="font-extrabold text-lg sm:text-xl shrink-0">
            {formatPrice(product.price_cents * item.qty)}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            aria-label="decrease"
            onClick={() => cart.setQty(item.productId, item.qty - 1)}
            className="w-8 h-8 rounded-full border-2 border-ink bg-cream flex items-center justify-center hover:bg-sun transition-colors"
          >
            <Minus size={14} strokeWidth={3} />
          </button>
          <span className="font-bold w-6 text-center tabular-nums">{item.qty}</span>
          <button
            type="button"
            aria-label="increase"
            onClick={() => cart.setQty(item.productId, item.qty + 1)}
            className="w-8 h-8 rounded-full border-2 border-ink bg-cream flex items-center justify-center hover:bg-sun transition-colors"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
          <button
            type="button"
            aria-label="remove"
            onClick={() => cart.remove(item.productId)}
            className="ml-auto text-ink/60 hover:text-poppy transition-colors"
          >
            <Trash2 size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </li>
  );
}
