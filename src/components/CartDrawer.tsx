import { Link } from "@tanstack/react-router";
import { X, Trash2, Plus, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { cart, cartDrawer, useCart, useCartDrawer } from "@/lib/cart-store";
import { listProducts } from "@/lib/products.functions";
import type { Product } from "@/lib/products.functions";
import { startCheckout } from "@/lib/checkout.functions";

const handleCheckout = async () => {
  const { url } = await startCheckout(checkoutItems);
  if (url) window.location.href = url;
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

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

 // Step 3: Logic to initiate our secure transaction flow
  const handleCheckout = async () => {
    try {
      // 1. Gather the selected heirlooms from the resolved 'lines' array.
      // This ensures we have access to line.product.price_cents for our margin snapshot.
      const checkoutItems = lines.map((line) => ({
        productId: line.item.productId, // Matches your cart-store property
        quantity: line.item.qty,       // Matches your cart-store property
        priceAtPurchase: line.product.price_cents, // Snapshot in cents for accuracy
      }));

      if (checkoutItems.length === 0) return;

      // 2. Request a secure checkout session from our server-side Nitro engine.
      // This keeps your STRIPE_SECRET_KEY hidden from the public browser [4, 5].
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: checkoutItems }),
      });

      const { url } = await response.json();

      if (url) {
        // 3. Quietly redirect to our customized Warm Cream Stripe page [4].
        window.location.href = url;
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      // We maintain our calm brand voice even in error states [2, 6].
      alert('We encountered a quiet issue while preparing your selection. Please try again.');
    }
  };
  
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
        <header className="flex items-center justify-between px-6 py-5 border-b-4 border-ink">
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

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
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
                className="flex gap-4 items-center rounded-2xl border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_var(--ink)]"
              >
                <div
                  className="w-14 h-14 rounded-xl border-2 border-ink shrink-0"
                  style={{ background: product.bg_color }}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink/60">
                    {product.category}
                  </p>
                  <p className="font-semibold text-ink truncate">{product.name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="decrease quantity"
                      onClick={() => cart.setQty(item.productId, item.qty - 1)}
                      className="w-7 h-7 rounded-full border-2 border-ink bg-cream flex items-center justify-center"
                    >
                      <Minus size={12} strokeWidth={3} />
                    </button>
                    <span className="font-bold text-sm w-6 text-center">{item.qty}</span>
                    <button
                      type="button"
                      aria-label="increase quantity"
                      onClick={() => cart.setQty(item.productId, item.qty + 1)}
                      className="w-7 h-7 rounded-full border-2 border-ink bg-cream flex items-center justify-center"
                    >
                      <Plus size={12} strokeWidth={3} />
                    </button>
                    <button
                      type="button"
                      aria-label="remove item"
                      onClick={() => cart.remove(item.productId)}
                      className="ml-auto text-ink/60 hover:text-poppy"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                <span className="font-extrabold">
                  {formatPrice(product.price_cents * item.qty)}
                </span>
              </div>
            ))
          )}
        </div>

        {lines.length > 0 && (
          <footer className="p-6 flex flex-col gap-4 border-t-4 border-[#333333] bg-[#F6F2E7]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[#333333]">Estimated Total</span>
<span className="text-lg font-bold text-[#333333]">
  {/* Convert cents to dollars for the final display */}
  ${(subtotal / 100).toFixed(2)}
</span>
            </div>
            <button
              type="button"
              onClick={() => handleCheckout()}
              className="w-full tc-btn tc-btn-poppy"
            >
              Proceed to checkout
            </button>
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
