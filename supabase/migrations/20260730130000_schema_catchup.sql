-- Schema catch-up: bring supabase/migrations in line with the live database.
--
-- WHY
-- Several things the app depends on were created by hand in the Supabase
-- dashboard and never written down as migrations:
--   * public.orders          — every checkout writes here
--   * public.order_items     — every line item
--   * products.description, products.stock_quantity, products.image_paths
-- Because they are missing, src/integrations/supabase/types.ts does not know
-- they exist, which is why checkout.functions.ts and products.functions.ts are
-- full of `as any` casts.
--
-- EVERY STATEMENT BELOW IS A NO-OP IF THE OBJECT ALREADY EXISTS.
-- Nothing is dropped, renamed, or overwritten. If your live tables already
-- match, this migration changes nothing except the RLS/grant hardening in
-- section 3 — which is the one part that does real work on an existing setup.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Product columns the app reads but the migrations never declared.
-- ---------------------------------------------------------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description    text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_paths    text[]  NOT NULL DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- 2. Orders.
--    Column names/types mirror what the code already writes in
--    src/lib/checkout.functions.ts and src/routes/api/webhooks.stripe.ts.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid,                       -- null for guest checkout
  status                   text NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'paid', 'failed')),
  total_amount             integer NOT NULL CHECK (total_amount >= 0),  -- cents
  customer_email           text,
  stripe_payment_intent_id text,
  shipping_name            text,
  shipping_phone           text,
  shipping_address_line1   text,
  shipping_address_line2   text,
  shipping_city            text,
  shipping_state           text,
  shipping_postal_code     text,
  shipping_country         text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id        uuid,
  product_name      text NOT NULL,                     -- snapshot, survives renames
  price_at_purchase integer NOT NULL CHECK (price_at_purchase >= 0),
  quantity          integer NOT NULL CHECK (quantity > 0),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- The webhook looks orders up by PaymentIntent; the admin view lists newest first.
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON public.orders (stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id  ON public.order_items (order_id);

DROP TRIGGER IF EXISTS trg_orders_updated ON public.orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 3. Lock both tables down.
--
-- THIS IS THE PART THAT MATTERS on an existing database. Orders hold customer
-- emails and full shipping addresses. Only the service-role key touches them
-- (checkout.functions.ts and the Stripe webhook), and service_role bypasses RLS
-- entirely — so enabling RLS with no permissive policy closes public access
-- without breaking a single code path.
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orders      FROM anon, authenticated;
REVOKE ALL ON public.order_items FROM anon, authenticated;

GRANT ALL ON public.orders      TO service_role;
GRANT ALL ON public.order_items TO service_role;

-- Signed-in customers may read their own orders. Guest orders (user_id null)
-- stay invisible to everyone but the service role.
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (user_id IS NOT NULL AND user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. AFTER RUNNING THIS, regenerate your TypeScript types so the app can see
--    the tables. In a terminal, from the repo root:
--
--      npx supabase gen types typescript --project-id jkiijlqsrxczpazscbaj \
--        > src/integrations/supabase/types.ts
--
--    Then commit the updated types.ts. That is what lets you start deleting the
--    `as any` casts. I did not hand-write that file — it is generated from your
--    real database, and guessing at it would be worse than regenerating it.
-- ---------------------------------------------------------------------------
