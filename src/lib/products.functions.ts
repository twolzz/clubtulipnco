import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price_cents: number;
  bg_color: string;
  fg_color: string;
  shape: string;
  shadow: string;
  sort_order: number;
};

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  );
}

const SELECT =
  "id, slug, name, category, price_cents, bg_color, fg_color, shape, shadow, sort_order";

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Product[];
});

export const searchProducts = createServerFn({ method: "GET" })
  .inputValidator((input: { q: string }) =>
    z.object({ q: z.string().max(60) }).parse(input),
  )
  .handler(async ({ data }) => {
    const q = data.q.trim();
    if (!q) return [] as Product[];
    const supabase = publicClient();
    const like = `%${q.replace(/[%_]/g, "")}%`;
    const { data: rows, error } = await supabase
      .from("products")
      .select(SELECT)
      .eq("is_active", true)
      .or(`name.ilike.${like},category.ilike.${like}`)
      .order("sort_order", { ascending: true })
      .limit(8);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as Product[];
  });
