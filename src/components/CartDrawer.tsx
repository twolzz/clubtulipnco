// STEP 4 of 7
// Goes in: src/components/CartDrawer.tsx  (replace the whole file)

import { Link } from "@tanstack/react-router";
import { X, Trash2, Plus, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { cart, cartDrawer, useCart, useCartDrawer } from "@/lib/cart-store";
import { listProducts } from "@/lib/products.functions";
import type { Product } from "@/lib/products.functions";
import { ProductMedia, formatPrice } from "@/components/ProductCard";

export function CartDrawer() {
  const open = useCartDrawer();
  const { items } = useCart();
  const listFn = useServerFn(listProducts);
  const { data: products } = useQuery<Product[]>({
    queryKey: ["products", "all"],
    queryFn: () => listFn({}),
    staleTime: 60_000,
  });

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const lines = items
    .map((i) => ({ item: i, product: productMap.get(i.productId) }))
    .filter((l): l is { item: typeof l.item; product: Product } => Boolean(l.product));
  const subtotal = lines.reduce((s, l) => s + l.product.price_cents * l.item.qty, 0);

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden={!open}
        onClick={() => cartDrawer.close()}
        className={`fixed inset-0 z-[60] bg-ink/40 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-label="shopping cart"
        aria-hidden={!open}
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[440px] z-[61] bg-cream border-l-4 border-ink flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between px-5 sm:px-6 py-5 border-b-4 border-ink">
          <h2 className="font-display text-2xl font-extrabold">Your Cart.</h2>
          <button
            type="button"
            aria-label="close cart"
            onClick={() => cartDrawer.close()}
            className="w-10 h-10 rounded-full border-[3px] border-ink bg-white flex items-center justify-center shadow-[3px_3px_0_var(--ink)] hover:shadow-[5px_5px_0_var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          {lines.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-display text-3xl font-extrabold mb-3">
                Your cart is empty.
              </p>
              <p className="text-ink/70 mb-6">Quiet things await.</p>
              <Link
                to="/shop"
                onClick={() => cartDrawer.close()}
                className="tc-btn tc-btn-sun inline-flex"
              >
                Browse the Shop
              </Link>
            </div>
          ) : (
            lines.map(({ item, product }) => (
              <div
                key={item.productId}
                className="flex gap-3 sm:gap-4 items-start rounded-2xl border-[3px] border-ink bg-white p-3 sm:p-4 shadow-[4px_4px_0_var(--ink)]"
              >
                {/* Thumbnail — real photo, glyph fallback, tap to reopen product */}
                <Link
                  to="/shop/$slug"
                  params={{ slug: product.slug }}
                  onClick={() => cartDrawer.close()}
                  aria-label={`View ${product.name}`}
                  className="w-16 h-16 shrink-0 rounded-xl border-2 border-ink overflow-hidden"
                >
                  <ProductMedia product={product} className="w-full h-full" />
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-ink/60">
                        {product.category}
                      </p>
                      <Link
                        to="/shop/$slug"
                        params={{ slug: product.slug }}
                        onClick={() => cartDrawer.close()}
                        className="block font-semibold text-ink truncate hover:text-denim transition-colors"
                      >
                        {product.name}
                      </Link>
                    </div>
                    <span className="font-extrabold shrink-0">
                      {formatPrice(product.price_cents * item.qty)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="decrease quantity"
                      onClick={() => cart.setQty(item.productId, item.qty - 1)}
                      className="w-7 h-7 rounded-full border-2 border-ink bg-cream flex items-center justify-center hover:bg-sun transition-colors"
                    >
                      <Minus size={12} strokeWidth={3} />
                    </button>
                    <span className="font-bold text-sm w-6 text-center tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      aria-label="increase quantity"
                      onClick={() => cart.setQty(item.productId, item.qty + 1)}
                      className="w-7 h-7 rounded-full border-2 border-ink bg-cream flex items-center justify-center hover:bg-sun transition-colors"
                    >
                      <Plus size={12} strokeWidth={3} />
                    </button>
                    <button
                      type="button"
                      aria-label="remove item"
                      onClick={() => cart.remove(item.productId)}
                      className="ml-auto text-ink/60 hover:text-poppy transition-colors"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {lines.length > 0 && (
          <footer className="p-5 sm:p-6 flex flex-col gap-4 border-t-4 border-ink bg-cream">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-ink">Estimated Total</span>
              <span className="text-lg font-bold text-ink">{formatPrice(subtotal)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={() => cartDrawer.close()}
              className="w-full tc-btn tc-btn-poppy text-center inline-flex justify-center"
            >
              Proceed to checkout
            </Link>
            <Link
              to="/cart"
              onClick={() => cartDrawer.close()}
              className="w-full tc-btn tc-btn-cream text-center"
            >
              View Full Cart
            </Link>
          </footer>
        )}
      </aside>
    </>
  );
}
