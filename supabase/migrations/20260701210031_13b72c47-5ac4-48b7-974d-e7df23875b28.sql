
-- Products table
CREATE TABLE public.products (
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

GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.products (slug, name, category, price_cents, bg_color, fg_color, shape, shadow, sort_order) VALUES
  ('miffy-corduroy-plushie', 'Miffy Corduroy Plushie', 'Plushies',    4200, '#E05A36', '#F6F2E7', 'bunny',    'tc-card-sun',   1),
  ('destijl-linen-journal', 'De Stijl Linen Journal', 'Stationery',   2800, '#F2B73F', '#333333', 'journal',  'tc-card-denim', 2),
  ('delft-fineliner-set',   'Delft Fineliner Set',    'Stationery',   1800, '#3D6E97', '#F6F2E7', 'pen',      'tc-card-poppy', 3),
  ('tulip-brass-keychain',  'Tulip Brass Keychain',   'Accessories',  1400, '#5D7A51', '#F6F2E7', 'keychain', 'tc-card-sun',   4),
  ('amsterdam-canvas-pouch','Amsterdam Canvas Pouch', 'Accessories',  2400, '#F6F2E7', '#333333', 'pouch',    'tc-card-sage',  5),
  ('nijntje-enamel-pin',    'Nijntje Enamel Pin',     'Accessories',   900, '#E05A36', '#F6F2E7', 'pin',      'tc-card-denim', 6);

-- Pop-ups table
CREATE TABLE public.pop_ups (
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

GRANT SELECT ON public.pop_ups TO anon, authenticated;
GRANT ALL ON public.pop_ups TO service_role;

ALTER TABLE public.pop_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published pop-ups" ON public.pop_ups
  FOR SELECT TO anon, authenticated USING (is_published = true);

CREATE POLICY "Admins can view all pop-ups" ON public.pop_ups
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage pop-ups" ON public.pop_ups
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_pop_ups_updated BEFORE UPDATE ON public.pop_ups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.pop_ups (name, location, event_date, start_time, end_time, tag, accent) VALUES
  ('Neighborhood Farmers Market', 'North Park, San Diego',      '2026-07-12', '09:00', '13:00', 'This Weekend', 'poppy'),
  ('Downtown Pop-up Festival',    'Little Italy Piazza',        '2026-07-20', '10:00', '16:00', 'Featured',     'sun'),
  ('Coastal Makers Market',       'Encinitas Boardwalk',        '2026-08-02', '11:00', '17:00', 'New',          'sage'),
  ('Sunday Stationery Social',    'South Park Walkabout',       '2026-08-17', '12:00', '18:00', 'RSVP',         'denim'),
  ('Mercato Centrale',            'Little Italy, San Diego',    '2026-09-06', '09:00', '13:30', 'Returning',    'poppy');
