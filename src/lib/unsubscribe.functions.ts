import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
});

export type UnsubscribeResult =
  | { ok: true; notFound?: boolean }
  | { ok: false; error: "invalid" | "server" };

export const unsubscribeByEmail = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => input.parse(raw))
  .handler(async ({ data }): Promise<UnsubscribeResult> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: rows, error } = await (supabaseAdmin as any)
        .from("subscribers")
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq("email", data.email)
        .select("id");
      if (error) {
        console.error("[unsubscribe] update failed", error);
        return { ok: false, error: "server" };
      }
      return { ok: true, notFound: !rows || rows.length === 0 };
    } catch (err) {
      console.error("[unsubscribe] fatal", err);
      return { ok: false, error: "server" };
    }
  });
