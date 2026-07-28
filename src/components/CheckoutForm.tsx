import { useState } from "react";
import {
  PaymentElement,
  AddressElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

export function CheckoutForm({ amountCents }: { amountCents: number }) {
  const stripe = useStripe();
  const elements = useElements();

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const total = `$${(amountCents / 100).toFixed(2)}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Stripe.js has not finished loading yet.
    if (!stripe || !elements) return;

    setSubmitting(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/return`,
      },
    });

    // This point is only reached if confirmation fails immediately. On
    // success the customer is redirected to return_url, so there is nothing
    // to do here — and no state to reset.
    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message ?? "That payment could not be completed.");
    } else {
      setMessage("Something went wrong. No charge was made — please try again.");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-extrabold mb-3">Ship to</h2>
        <AddressElement options={{ mode: "shipping" }} />
      </div>

      <div>
        <h2 className="font-display text-xl font-extrabold mb-3">Payment</h2>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {message && (
        <p
          role="alert"
          className="rounded-xl border-[3px] border-ink bg-white px-4 py-3 text-sm font-semibold text-poppy"
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full tc-btn tc-btn-poppy disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Processing…" : `Pay ${total}`}
      </button>

      <p className="text-center text-xs font-semibold text-ink/60">
        Payments are processed securely by Stripe. Card details never touch our servers.
      </p>
    </form>
  );
}
