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
});

type ProductRow = { id: string; name: string; price_cents: number };

export const createCheckoutIntent = createServerFn({ method: "POST" })
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

    // Record the order as pending. The webhook flips it to paid.
    // user_id stays null for guest checkout.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        status: "pending",
        total_amount: amountCents,
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

const EmailInput = z.object({
  orderId: z.string().uuid(),
  email: z.string().email().max(254),
});

/**
 * Attaches the customer's email to the order and to the PaymentIntent.
 * Called just before payment confirmation, because the email is entered
 * after the intent has already been created.
 */
export const setOrderEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmailInput.parse(input))
  .handler(async ({ data }) => {
    const supabase = adminClient();

    const { data: order, error } = await supabase
      .from("orders")
      .update({
        customer_email: data.email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.orderId)
      .select("stripe_payment_intent_id")
      .single();

    if (error) throw new Error(error.message);

    // Also set receipt_email so Stripe's own receipt reaches the customer.
    if (order?.stripe_payment_intent_id) {
      const stripe = stripeClient();
      await stripe.paymentIntents.update(order.stripe_payment_intent_id, {
        receipt_email: data.email,
      });
    }

    return { ok: true };
  });
