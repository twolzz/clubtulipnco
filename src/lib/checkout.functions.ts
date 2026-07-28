import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const SITE_URL = process.env.SITE_URL ?? "https://club.tulipnco.com";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  ) as any;
}

const CheckoutInput = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .min(1),
});

export const startCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CheckoutInput.parse(input))
  .handler(async ({ data }) => {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      throw new Error("STRIPE_SECRET_KEY is not set.");
    }

    // createFetchHttpClient is required on Cloudflare Workers — the default
    // Node HTTP client does not exist in that runtime.
    const stripe = new Stripe(stripeSecret, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = publicClient();

    // Re-price on the server. Never trust prices sent from the browser.
    const { data: rows, error } = await supabase
      .from("products")
      .select("id, name, price_cents")
      .in(
        "id",
        data.items.map((i) => i.productId),
      )
      .eq("is_active", true);

    if (error) throw new Error(error.message);

    const byId = new Map(
      (rows ?? []).map((r: { id: string; name: string; price_cents: number }) => [r.id, r]),
    );

    const line_items = data.items.map((i) => {
      const product = byId.get(i.productId) as
        | { id: string; name: string; price_cents: number }
        | undefined;

      if (!product) {
        throw new Error(`That product is no longer available.`);
      }

      return {
        quantity: i.qty,
        price_data: {
          currency: "usd",
          unit_amount: product.price_cents,
          product_data: { name: product.name },
        },
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${SITE_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/cart`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return { url: session.url };
  });
