-- Adds shipping_cents to orders.
--
-- WHY THIS EXISTS
-- Returns policy: a customer-preference return refunds the product price and
-- keeps the shipping fee; a return caused by our own error refunds
-- everything, shipping included. Both cases need to know how much of
-- total_amount was shipping — and once an order is a single combined number,
-- that split can't be reconstructed afterwards. This column is written once,
-- at checkout, by src/lib/checkout.functions.ts.
--
-- Existing rows get 0, which is accurate: they predate the shipping charge
-- entirely, so none of their total was shipping.
--
-- Safe to re-run.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_cents integer NOT NULL DEFAULT 0
    CHECK (shipping_cents >= 0);

-- ---------------------------------------------------------------------------
-- After running this, regenerate your TypeScript types so the app can see the
-- new column (same command noted in the earlier schema-catchup migration):
--
--   npx supabase gen types typescript --project-id jkiijlqsrxczpazscbaj \
--     > src/integrations/supabase/types.ts
--
-- Not required for the checkout code to work — every write to `orders` in
-- this codebase goes through a client typed `as any`, so this compiles either
-- way — but regenerating keeps the file honest about what's really in the
-- database.
-- ---------------------------------------------------------------------------
