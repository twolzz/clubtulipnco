// STEP 7 of 7
// Goes in: the file you sent me that starts with createFileRoute("/checkout/")
// — most likely src/routes/checkout/index.tsx (or src/routes/checkout.index.tsx).
// Put it back exactly where it came from.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Elements } from "@stripe/react-stripe-js";
import { CheckoutForm } from "@/components/CheckoutForm";
import { useCart, useCartHydrated } from "@/lib/cart-store";
import { listProducts, type Product } from "@/lib/products.functions";
import { getStripe, buildAppearance } from "@/lib/stripe-elements";
import { ProductMedia, formatPrice } from "@/components/ProductCard";
import { shippingCentsFor } from "@/lib/shipping";

/**
 * The Stripe fields render inside an iframe, which does not inherit the page
 * stylesheet. Inter (--font-sans, used by the inputs) and Quicksand
 * (--font-display, used by the labels) both have to be passed to Elements.
 */
const STRIPE_FONTS = [
  {
    cssSrc:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Quicksand:wght@500;600;700&display=swap",
  },
];

export const Route = createFileRoute("/_app/checkout/")({
  head: () => ({
    meta: [
      { title: "Checkout — Tulip & Co." },
      { name: "description", content: "Complete your order." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items } = useCart();
  const cartHydrated = useCartHydrated();

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
  // Same rule the server applies in checkout.functions.ts — imported from the
  // same file so this number and the amount actually charged can never
  // disagree with each other.
  const shipping = shippingCentsFor(subtotal);
  const total = subtotal + shipping;

  // Stripe's deferred flow mounts the form from an amount alone, so the form
  // cannot render until the product prices have loaded. 50 cents is Stripe's
  // minimum charge.
  const ready = lines.length > 0 && total >= 50;

  // An empty cart has nothing to pay for. Wait for localStorage to hydrate
  // first — on a cold load (direct URL, refresh, or the Stripe return trip)
  // the very first render always reads an empty cart, and redirecting on
  // that stale read would bounce a customer with real items in their cart.
  useEffect(() => {
    if (cartHydrated && items.length === 0) {
      navigate({ to: "/cart", replace: true });
    }
  }, [cartHydrated, items.length, navigate]);

  const appearance = buildAppearance();

  return (
    <>
      <section className="px-5 md:px-8 py-14 md:py-20">
        <div className="max-w-5xl mx-auto">
          <nav className="text-sm font-semibold text-ink/70 mb-6">
            <Link to="/" className="hover:text-denim">
              Home
            </Link>
            <span className="mx-2 text-ink/40">/</span>
            <Link to="/cart" className="hover:text-denim">
              Cart
            </Link>
            <span className="mx-2 text-ink/40">/</span>
            <span className="text-ink">Checkout</span>
          </nav>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-10">Checkout</h1>

          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
            {/* Payment */}
            <div className="tc-card p-6 md:p-8 order-2 lg:order-1">
              {ready ? (
                <Elements
                  stripe={getStripe()}
                  options={{
                    mode: "payment",
                    amount: total,
                    currency: "usd",
                    appearance,
                    fonts: STRIPE_FONTS,
                  }}
                >
                  <CheckoutForm
                    amountCents={total}
                    items={items.map((i) => ({ productId: i.productId, qty: i.qty }))}
                  />
                </Elements>
              ) : (
                <div className="py-16 text-center">
                  <p className="font-display text-xl font-extrabold text-ink/60">
                    Preparing your order…
                  </p>
                </div>
              )}
            </div>

            {/* Order summary */}
            <aside className="tc-card tc-card-sun p-6 order-1 lg:order-2 lg:sticky lg:top-40">
              <h2 className="font-display text-xl font-extrabold mb-4">Your order</h2>
              <ul className="space-y-3 mb-5">
                {lines.map(({ item, product }) => (
                  <li key={item.productId} className="flex gap-3 items-center">
                    {/* Deliberately not a link — nothing on this page should
                        tempt someone away mid-payment. */}
                    <div className="w-12 h-12 rounded-xl border-2 border-ink shrink-0 overflow-hidden">
                      <ProductMedia product={product} className="w-full h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{product.name}</p>
                      <p className="text-xs font-bold text-ink/60">Qty {item.qty}</p>
                    </div>
                    <span className="font-extrabold text-sm shrink-0">
                      {formatPrice(product.price_cents * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t-2 border-ink/15 pt-4 space-y-2">
                <div className="flex justify-between items-center text-sm font-semibold text-ink/70">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold text-ink/70">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-sage font-extrabold" : undefined}>
                    {shipping === 0 ? "Free" : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-ink/15">
                  <span className="font-semibold">Total</span>
                  <span className="font-extrabold text-2xl">{formatPrice(total)}</span>
                </div>
              </div>
              <Link
                to="/cart"
                className="mt-5 w-full tc-btn tc-btn-cream text-center inline-flex justify-center"
              >
                Edit Cart
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
