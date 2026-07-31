import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

/**
 * Service-role client. Bypasses row-level security, so it is only ever
 * constructed inside a server function — never imported by a component.
 */
function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  ) as any;
}

function stripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not set.");

  // createFetchHttpClient is required on Cloudflare Workers — the default
  // Node HTTP client does not exist in that runtime.
  return new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() });
}

const CheckoutInput = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
  email: z.string().email().max(254),
  // What the customer was shown on screen. Compared against the server's own
  // total before anything is written, so nobody is ever charged an amount
  // different from the one they agreed to.
  expectedAmountCents: z.number().int().min(50),
});

type ProductRow = { id: string; name: string; price_cents: number };

/**
 * Creates the order and its Stripe PaymentIntent, in that order, and only
 * when the customer has actually pressed Pay.
 *
 * This used to run on checkout page load, which meant every visit — including
 * people who opened the page and immediately left — wrote a `pending` row and
 * an abandoned PaymentIntent. Now the form mounts with nothing but an amount
 * (Stripe's deferred intent creation), and this runs on submit.
 *
 * A `pending` row therefore now means "pressed Pay, outcome not yet confirmed"
 * rather than "loaded the page". The row still has to exist before the payment
 * is confirmed, because the webhook finds the order through
 * paymentIntent.metadata.order_id — so a declined card can still leave one
 * behind. That is expected and unavoidable.
 */
export const createOrderAndIntent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CheckoutInput.parse(input))
  .handler(async ({ data }) => {
    const supabase = adminClient();

    // Re-price on the server. Nothing price-related is trusted from the browser.
    const { data: rows, error } = await supabase
      .from("products")
      .select("id, name, price_cents")
      .in(
        "id",
        data.items.map((i) => i.productId),
      )
      .eq("is_active", true);

    if (error) throw new Error(error.message);

    const byId = new Map<string, ProductRow>(
      ((rows ?? []) as ProductRow[]).map((r) => [r.id, r]),
    );

    const lines = data.items.map((i) => {
      const product = byId.get(i.productId);
      if (!product) throw new Error("A product in your cart is no longer available.");
      return { product, qty: i.qty };
    });

    // All amounts are in cents, matching products.price_cents.
    const amountCents = lines.reduce(
      (sum, l) => sum + l.product.price_cents * l.qty,
      0,
    );

    if (amountCents < 50) {
      throw new Error("Order total is below the minimum charge amount.");
    }

    // Checked BEFORE any insert, so a stale price never leaves a junk row
    // behind. Only possible if a product's price changed mid-checkout.
    if (amountCents !== data.expectedAmountCents) {
      throw new Error(
        "Your cart total has changed. Please go back to your cart and check it.",
      );
    }

    // user_id stays null for guest checkout. The webhook flips status to paid.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        status: "pending",
        total_amount: amountCents,
        customer_email: data.email,
        user_id: null,
      })
      .select("id")
      .single();

    if (orderError) throw new Error(orderError.message);

    const { error: itemsError } = await supabase.from("order_items").insert(
      lines.map((l) => ({
        order_id: order.id,
        product_id: l.product.id,
        product_name: l.product.name,
        price_at_purchase: l.product.price_cents,
        quantity: l.qty,
      })),
    );

    if (itemsError) throw new Error(itemsError.message);

    const stripe = stripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      // The customer types their email before pressing Pay, so unlike the old
      // flow this can be set at creation instead of patched in afterwards.
      receipt_email: data.email,
      // The webhook reads this to find the order it belongs to.
      metadata: { order_id: order.id },
    });

    await supabase
      .from("orders")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    return {
      clientSecret: paymentIntent.client_secret!,
      amountCents,
      orderId: order.id as string,
    };
  });
