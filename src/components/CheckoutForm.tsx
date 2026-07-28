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

    // Billing details are collected by the AddressElement above and reused,
    // so the Payment Element does not ask for them a second time. Because
    // those fields are set to "never" below, we must supply them here.
    const addressElement = elements.getElement(AddressElement);
    if (!addressElement) {
      setMessage("Something went wrong loading the form. Please refresh.");
      setSubmitting(false);
      return;
    }

    const { complete, value } = await addressElement.getValue();
    if (!complete) {
      setMessage("Please complete your shipping address.");
      setSubmitting(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/return`,
        payment_method_data: {
          billing_details: {
            name: value.name,
            address: value.address,
          },
        },
        // Recorded on the PaymentIntent so the address is visible in the
        // Stripe dashboard when fulfilling the order.
        shipping: {
          name: value.name,
          address: value.address,
        },
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
        <AddressElement
          options={{
            mode: "shipping",
            // Shorten the country list to places we actually ship. This also
            // sidesteps the unstyleable native dropdown on macOS/iOS.
            allowedCountries: ["US"],
          }}
        />
      </div>

      <div>
        <h2 className="font-display text-xl font-extrabold mb-3">Payment</h2>
        <PaymentElement
          options={{
            layout: "tabs",
            // Suppress Stripe's own billing name/address collection. The
            // shipping address above is used instead, which removes the
            // "Billing is same as shipping" checkbox entirely.
            fields: {
              billingDetails: {
                name: "never",
                address: "never",
              },
            },
          }}
        />
        <p className="mt-3 text-xs font-semibold text-ink/60">
          Your card will be billed to the shipping address above.
        </p>
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
