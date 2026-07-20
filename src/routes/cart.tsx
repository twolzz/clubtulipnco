import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, Plus, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/SiteLayout";
import { cart, useCart } from "@/lib/cart-store";
import { listProducts, type Product } from "@/lib/products.functions";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "cart — tulip & co." },
      { name: "description", content: "review the quiet dutch design in your cart." },
      { property: "og:title", content: "cart — tulip & co." },
      { property: "og:description", content: "review your cart." },
    ],
  }),
  component: CartPage,
});

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

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

  return (
    <SiteLayout>
      <section className="px-5 md:px-8 py-14 md:py-20">
        <div className="max-w-4xl mx-auto">
          <nav className="text-sm font-semibold text-ink/70 mb-6">
            <Link to="/" className="hover:text-denim">home</Link>
            <span className="mx-2 text-ink/40">/</span>
            <span className="text-ink">cart</span>
          </nav>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-10">
            your cart.
          </h1>

          {lines.length === 0 ? (
            <div className="tc-card tc-card-sun p-10 md:p-16 text-center bg-cream">
              <p className="font-display text-3xl font-extrabold mb-3">
                nothing here yet.
              </p>
              <p className="text-ink/70 mb-6">quiet things await.</p>
              <Link to="/shop" className="tc-btn tc-btn-poppy inline-flex">
                browse the shop
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-4">
                {lines.map(({ item, product }) => (
                  <li
                    key={item.productId}
                    className="flex gap-4 items-center rounded-2xl border-4 border-ink bg-white p-5 shadow-[6px_6px_0_var(--ink)]"
                  >
                    <div
                      className="w-20 h-20 rounded-2xl border-[3px] border-ink shrink-0"
                      style={{ background: product.bg_color }}
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-widest text-ink/60">
                        {product.category}
                      </p>
                      <p className="font-semibold text-lg">{product.name}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          type="button"
                          aria-label="decrease"
                          onClick={() => cart.setQty(item.productId, item.qty - 1)}
                          className="w-8 h-8 rounded-full border-2 border-ink bg-cream flex items-center justify-center"
                        >
                          <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="font-bold w-6 text-center">{item.qty}</span>
                        <button
                          type="button"
                          aria-label="increase"
                          onClick={() => cart.setQty(item.productId, item.qty + 1)}
                          className="w-8 h-8 rounded-full border-2 border-ink bg-cream flex items-center justify-center"
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                        <button
                          type="button"
                          aria-label="remove"
                          onClick={() => cart.remove(item.productId)}
                          className="ml-4 text-ink/60 hover:text-poppy"
                        >
                          <Trash2 size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                    <span className="font-extrabold text-xl">
                      {formatPrice(product.price_cents * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 tc-card tc-card-poppy p-6 md:p-8 bg-cream">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-semibold text-lg">subtotal</span>
                  <span className="font-extrabold text-3xl">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex flex-wrap gap-3 justify-end">
                  <Link to="/shop" className="tc-btn tc-btn-cream">continue shopping</Link>
                  <button
                    type="button"
                    disabled
                    title="checkout coming soon"
                    className="tc-btn tc-btn-poppy opacity-60 cursor-not-allowed"
                  >
                    checkout — coming soon
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
