import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import type { Database } from "@/integrations/supabase/types";

function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  ) as any;
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

            await supabase
              .from("orders")
              .update({
                status: "paid",
                customer_email: intent.receipt_email ?? null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", orderId);
            break;
          }

          case "payment_intent.payment_failed": {
            const intent = event.data.object as Stripe.PaymentIntent;
            const orderId = intent.metadata?.order_id;
            if (!orderId) break;

            await supabase
              .from("orders")
              .update({ status: "failed", updated_at: new Date().toISOString() })
              .eq("id", orderId);
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
