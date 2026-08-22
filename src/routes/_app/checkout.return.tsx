import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cart } from "@/lib/cart-store";
import { getStripe } from "@/lib/stripe-elements";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

type Status = "loading" | "succeeded" | "processing" | "failed";

export const Route = createFileRoute("/_app/checkout/return")({
  validateSearch: (search: Record<string, unknown>) => ({
    payment_intent_client_secret:
      typeof search.payment_intent_client_secret === "string"
        ? search.payment_intent_client_secret
        : "",
  }),
  head: () => ({
    meta: [{ title: "Order status | Tulip & Co." }],
  }),
  component: CheckoutReturnPage,
});

const COPY: Record<Exclude<Status, "loading">, { title: string; body: string }> = {
  succeeded: {
    title: "Thank you",
    body: "Your order is confirmed. A receipt is on its way to your inbox.",
  },
  processing: {
    title: "Payment processing",
    body: "Your payment is still clearing. We'll email you the moment it settles.",
  },
  failed: {
    title: "Payment not completed",
    body: "Your card was not charged. Your cart is still here if you'd like to try again.",
  },
};

function CheckoutReturnPage() {
  const { payment_intent_client_secret: clientSecret } = Route.useSearch();
  const [status, setStatus] = useState<Status>("loading");
  const card = useScrollReveal<HTMLDivElement>();

  useEffect(() => {
    if (!clientSecret) {
      setStatus("failed");
      return;
    }

    let cancelled = false;

    getStripe().then(async (stripe) => {
      if (!stripe) return;

      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
      if (cancelled) return;

      switch (paymentIntent?.status) {
        case "succeeded":
          setStatus("succeeded");
          // The order is recorded server-side by the webhook, so it is safe
          // to clear the local cart now.
          cart.clear();
          break;
        case "processing":
          setStatus("processing");
          break;
        default:
          setStatus("failed");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [clientSecret]);

  return (
    <>
      <section className="px-5 md:px-8 py-20 md:py-28">
        <div className="max-w-2xl mx-auto">
          {status === "loading" ? (
            <div
              ref={card.ref}
              style={card.style}
              className={`tc-card p-10 md:p-16 text-center bg-cream tc-reveal ${card.visible ? "tc-reveal-visible" : ""}`}
            >
              <p className="font-display text-2xl font-extrabold text-ink/60">
                Confirming your payment…
              </p>
            </div>
          ) : (
            <div
              ref={card.ref}
              style={card.style}
              className={`tc-card p-10 md:p-16 text-center bg-cream tc-reveal tc-reveal-visible ${
                status === "succeeded" ? "tc-card-sun" : "tc-card-poppy"
              }`}
              // This copy swaps in place once the async status check resolves —
              // excluded so word-hover's DOM wrapping can't detach the text
              // node React needs to update.
              data-no-word-hover
            >
              <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                {COPY[status].title}
              </h1>
              <p className="text-ink/75 text-lg mb-8">{COPY[status].body}</p>

              <div className="flex flex-wrap gap-3 justify-center">
                {status === "failed" ? (
                  <Link to="/cart" className="tc-btn tc-btn-poppy inline-flex">
                    Back to Cart
                  </Link>
                ) : null}
                <Link to="/shop" className="tc-btn tc-btn-cream inline-flex">
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
