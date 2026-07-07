-- Ensure the function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  bg_color text NOT NULL DEFAULT '#F6F2E7',
  fg_color text NOT NULL DEFAULT '#333333',
  shape text NOT NULL DEFAULT 'bunny',
  shadow text NOT NULL DEFAULT 'tc-card-sun',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Pop-ups Table
CREATE TABLE IF NOT EXISTS public.pop_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  event_date date NOT NULL,
  start_time time,
  end_time time,
  tag text NOT NULL DEFAULT 'Featured',
  accent text NOT NULL DEFAULT 'poppy' CHECK (accent IN ('poppy','sun','sage','denim')),
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Triggers (using OR REPLACE logic where applicable)
DROP TRIGGER IF EXISTS trg_products_updated ON public.products;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_pop_ups_updated ON public.pop_ups;
CREATE TRIGGER trg_pop_ups_updated BEFORE UPDATE ON public.pop_ups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
