// Goes in: src/lib/products.functions.ts  (replace the whole file)

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
  description: string | null;
  stock_quantity: number;
  /** Fully-resolved public URLs, built on the server. */
  images: string[];
};

const BUCKET = "product-images";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  ) as any;
}

/**
 * Encode one path segment without double-encoding values that were already
 * encoded (e.g. someone pasted "Kuromi%20in%20Furr.png" instead of a raw name).
 */
function encodeSegment(segment: string) {
  let raw = segment;
  try {
    raw = decodeURIComponent(segment);
  } catch {
    /* not encoded — use as-is */
  }
  return encodeURIComponent(raw);
}

/**
 * Accepts either a bucket-relative path ("kuromi/01.png") or an absolute URL
 * and returns something the browser can load. Returns null for junk values.
 */
function toPublicUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const base = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
  if (!base) return null;

  const path = trimmed
    .replace(/^\/+/, "")
    .split("/")
    .map(encodeSegment)
    .join("/");

  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

function toProduct(row: any): Product {
  const { image_paths, ...rest } = row ?? {};
  const paths: unknown[] = Array.isArray(image_paths) ? image_paths : [];

  return {
    ...rest,
    description: rest?.description ?? null,
    stock_quantity:
      typeof rest?.stock_quantity === "number" ? rest.stock_quantity : 0,
    images: paths
      .map(toPublicUrl)
      .filter((url): url is string => Boolean(url)),
  } as Product;
}

const SELECT =
  "id, slug, name, category, price_cents, bg_color, fg_color, shape, shadow, sort_order, description, stock_quantity, image_paths";

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toProduct);
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) =>
    z.object({ slug: z.string().min(1).max(160) }).parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: row, error } = await supabase
      .from("products")
      .select(SELECT)
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? toProduct(row) : null;
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
    return (rows ?? []).map(toProduct);
  });
