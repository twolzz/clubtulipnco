import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export default defineEventHandler(async (event) => {
  // 1. establish our secure environment using dashboard secrets
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecret || !supabaseUrl || !supabaseServiceKey) {
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Internal infrastructure misalignment.' 
    });
  }

  const stripe = new Stripe(stripeSecret);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 2. parse the collector's selection from the body
  const body = await readBody(event);
  const { items } = body; // Array of { productId, quantity, priceAtPurchase }

  try {
    // 3. create the secure Stripe Checkout Session
    // This utilizes the Warm Cream (#F6F2E7) branding we will set in the Stripe Dashboard
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tulip & Co. Heirloom Collectible', 
          },
          // we use the price snapshot to protect our 50% margin architecture [3]
          unit_amount: item.priceAtPurchase, 
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.SITE_URL}/thank-you`,
      cancel_url: `${process.env.SITE_URL}/cart`,
    });

    // 4. record the 'pending' order in our database for idempotency [4]
    // we use the service key to bypass RLS for this internal system write [2]
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        stripe_session_id: session.id,
        total_amount: session.amount_total ? session.amount_total / 100 : 0,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 5. snapshot the individual items for historical integrity [4]
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      price_at_purchase: item.priceAtPurchase / 100, // stored in dollars for the ledger
    }));

    await supabase.from('order_items').insert(orderItems);

    // 6. return the unique checkout URL for the quiet redirect
    return { url: session.url };
  } catch (error) {
    console.error('Checkout logic failure:', error);
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'We encountered a quiet issue while preparing your session.' 
    });
  }
});
