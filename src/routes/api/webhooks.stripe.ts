import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import type { Database } from "@/integrations/supabase/types";
import {
  sendOrderConfirmationEmail,
  type OrderLine,
  type ShippingAddress,
} from "@/lib/order-confirmation";

function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  ) as any;
}

function shippingFrom(intent: Stripe.PaymentIntent): ShippingAddress | null {
  const s = intent.shipping;
  if (!s) return null;
  return {
    name: s.name ?? null,
    line1: s.address?.line1 ?? null,
    line2: s.address?.line2 ?? null,
    city: s.address?.city ?? null,
    state: s.address?.state ?? null,
    postal_code: s.address?.postal_code ?? null,
  };
}

// The same address, mapped onto the orders table columns so it's persisted
// rather than only being emailed. Country and phone are included here (the
// email's ShippingAddress type doesn't carry them) because a shipping label
// needs the country, and couriers often want a contact number.
//
// Returns {} when Stripe has no address, so spreading it into an update is
// always safe and never overwrites existing values with nulls.
function shippingColumns(intent: Stripe.PaymentIntent): Record<string, string | null> {
  const s = intent.shipping;
  if (!s) return {};

  const columns: Record<string, string | null> = {
    shipping_name: s.name ?? null,
    shipping_phone: s.phone ?? null,
    shipping_address_line1: s.address?.line1 ?? null,
    shipping_address_line2: s.address?.line2 ?? null,
    shipping_city: s.address?.city ?? null,
    shipping_state: s.address?.state ?? null,
    shipping_postal_code: s.address?.postal_code ?? null,
    shipping_country: s.address?.country ?? null,
  };

  // Drop empty keys so a partial address can't blank out fields that were
  // already filled in (e.g. by the dashboard's Stripe sync).
  for (const key of Object.keys(columns)) {
    if (columns[key] === null || columns[key] === "") delete columns[key];
  }
  return columns;
}

export const Route = createFileRoute("/api/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_SECRET_KEY;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!secret || !webhookSecret) {
          return new Response("Webhook not configured", { status: 500 });
        }

        const stripe = new Stripe(secret, {
          httpClient: Stripe.createFetchHttpClient(),
        });

        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }

        // The raw body is required — parsing it first breaks verification.
        const body = await request.text();

        let event: Stripe.Event;
        try {
          // constructEventAsync (not constructEvent) is required on Cloudflare
          // Workers, where synchronous crypto is unavailable.
          event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret,
            undefined,
            Stripe.createSubtleCryptoProvider(),
          );
        } catch (err) {
          console.error("Webhook signature verification failed:", err);
          return new Response("Invalid signature", { status: 400 });
        }

        const supabase = adminClient();

        switch (event.type) {
          case "payment_intent.succeeded": {
            const intent = event.data.object as Stripe.PaymentIntent;
            const orderId = intent.metadata?.order_id;
            if (!orderId) break;

            const shipping = shippingColumns(intent);
            if (Object.keys(shipping).length === 0) {
              // Worth surfacing: without this the order can't be fulfilled,
              // and the cause is upstream (no address on the PaymentIntent).
              console.warn("[webhook] payment intent has no shipping address", {
                orderId,
                intentId: intent.id,
              });
            }

            // Only flip rows that are still pending. Stripe retries webhooks,
            // so this doubles as the guard against sending two receipts:
            // a replayed event updates zero rows and returns nothing.
            const { data: updated, error: updateError } = await supabase
              .from("orders")
              .update({
                status: "paid",
                customer_email: intent.receipt_email ?? undefined,
                stripe_payment_intent_id: intent.id,
                // Persist the shipping address so orders can actually be
                // shipped from the database instead of only being emailed.
                ...shipping,
                updated_at: new Date().toISOString(),
              })
              .eq("id", orderId)
              .eq("status", "pending")
              .select("id, customer_email, total_amount");

            if (updateError) {
              console.error("[webhook] order update failed", updateError.message);
              // Return 500 so Stripe retries rather than dropping the event.
              return new Response("Order update failed", { status: 500 });
            }

            const order = updated?.[0];
            if (!order) {
              // Already processed. Don't re-send the receipt, but do backfill
              // the address if an earlier run (or an older deploy) missed it —
              // otherwise a replayed event leaves the order unshippable.
              if (Object.keys(shipping).length > 0) {
                const { error: backfillError } = await supabase
                  .from("orders")
                  .update(shipping)
                  .eq("id", orderId)
                  .is("shipping_address_line1", null);
                if (backfillError) {
                  console.error(
                    "[webhook] shipping backfill failed",
                    backfillError.message,
                  );
                }
              }
              console.log("[webhook] order already processed, skipping", { orderId });
              break;
            }

            const { data: items, error: itemsError } = await supabase
              .from("order_items")
              .select("product_name, quantity, price_at_purchase")
              .eq("order_id", orderId);

            if (itemsError) {
              console.error("[webhook] order_items fetch failed", itemsError.message);
            }

            const email = order.customer_email ?? intent.receipt_email;
            if (email) {
              // A failed send must not fail the webhook — the payment is
              // already captured and the order already recorded.
              await sendOrderConfirmationEmail({
                orderId,
                email,
                amountCents: Number(order.total_amount),
                lines: (items ?? []) as OrderLine[],
                shipping: shippingFrom(intent),
              });
            } else {
              console.warn("[webhook] no email on order, receipt not sent", { orderId });
            }
            break;
          }

          case "payment_intent.payment_failed": {
            const intent = event.data.object as Stripe.PaymentIntent;
            const orderId = intent.metadata?.order_id;
            if (!orderId) break;

            await supabase
              .from("orders")
              .update({ status: "failed", updated_at: new Date().toISOString() })
              .eq("id", orderId)
              .eq("status", "pending");
            break;
          }

          default:
            // Unhandled event types are acknowledged so Stripe stops retrying.
            break;
        }

        return new Response(JSON.stringify({ received: true }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
