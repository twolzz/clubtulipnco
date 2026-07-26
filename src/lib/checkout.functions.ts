import { createServerFn } from "@tanstack/react-start";
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const startCheckout = createServerFn("POST", async (items: any[]) => {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecret || !supabaseUrl || !supabaseServiceKey) {
    throw new Error('Infrastructure misalignment.');
  }

  const stripe = new Stripe(stripeSecret);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ... (Remaining logic from your current checkout.ts) ...
  // Ensure you return { url: session.url }
});
