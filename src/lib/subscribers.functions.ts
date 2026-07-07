import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const subscribeInput = z.object({
  first_name: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().email().max(255),
});

export type SubscribeResult =
  | { ok: true; duplicate?: boolean }
  | { ok: false; error: "duplicate" | "invalid" | "server" };

/**
 * Public server fn: insert a subscriber, then fire the welcome email inline.
 * Email failures are logged but never surfaced to the browser — the row is
 * already saved and the UX should always confirm success.
 */
export const subscribeToClub = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => subscribeInput.parse(input))
  .handler(async ({ data }): Promise<SubscribeResult> => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      console.error("[subscribe] missing SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY");
      return { ok: false, error: "server" };
    }

    const supabase = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { error } = await (supabase as any)
      .from("subscribers")
      .insert({ first_name: data.first_name, email: data.email });

    if (error) {
      if ((error as any).code === "23505") {
        // already on the list — surface duplicate to the UI, don't re-send welcome
        return { ok: false, error: "duplicate" };
      }
      console.error("[subscribe] insert failed", {
        code: (error as any).code,
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
      });
      return { ok: false, error: "server" };
    }

    // Fire welcome email — never block success on this
    try {
      const { sendWelcomeEmail } = await import("./welcome.server");
      const res = await sendWelcomeEmail(data.first_name, data.email);
      if (!res.ok) {
        console.warn("[subscribe] welcome email did not send", res);
      }
    } catch (err) {
      const e = err as Error;
      console.error("[subscribe] welcome email threw", {
        name: e.name,
        message: e.message,
      });
    }

    return { ok: true };
  });
