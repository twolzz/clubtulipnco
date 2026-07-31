import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

/**
 * Service-role client. The public key this function used to run on can only
 * INSERT into subscribers (see migration 20260618230332) — it has no SELECT
 * policy, so it could never check whether an email had unsubscribed before.
 * That's the whole reason a resubscribe used to fail: the database saw a
 * unique-constraint violation and had no way to tell "still subscribed" apart
 * from "opted out". This client can read unsubscribed_at before deciding.
 */
function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  ) as any;
}

const subscribeInput = z.object({
  first_name: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().email().max(255),
});

export type SubscribeResult =
  | { ok: true; duplicate?: boolean }
  | { ok: false; error: "duplicate" | "invalid" | "server" };

export type SubscribeInput = z.infer<typeof subscribeInput>;

/**
 * The actual work: add a subscriber, or bring a previously-unsubscribed one
 * back, then fire the welcome email inline.
 *
 * Three cases:
 *   - no existing row            -> insert, send welcome (unchanged behaviour)
 *   - row exists, unsubscribed   -> clear unsubscribed_at, send welcome again
 *   - row exists, still active   -> report "duplicate", same as before
 *
 * Email failures are logged but never surfaced to the caller — the row is
 * already saved and the UX should always confirm success.
 *
 * Exported as a plain function (not just the createServerFn wrapper below)
 * so src/routes/api/public/subscribe.ts — the CORS-enabled endpoint the
 * coming-soon splash page calls — can run the exact same logic. Two entry
 * points, one implementation: the alternative was copying this function into
 * the API route too, which is exactly how the SITE_URL and unsubscribe-filter
 * bugs happened earlier — the same fact living in two places, edited in only
 * one of them.
 */
export async function subscribeCore(data: SubscribeInput): Promise<SubscribeResult> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[subscribe] missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    return { ok: false, error: "server" };
  }

  const supabase = adminClient();

  const { data: existing, error: lookupError } = await supabase
    .from("subscribers")
    .select("id, unsubscribed_at")
    .eq("email", data.email)
    .maybeSingle();

  if (lookupError) {
    console.error("[subscribe] lookup failed", {
      code: (lookupError as any).code,
      message: lookupError.message,
    });
    return { ok: false, error: "server" };
  }

  if (existing && existing.unsubscribed_at === null) {
    // Already an active subscriber — don't re-send the welcome email.
    return { ok: false, error: "duplicate" };
  }

  if (existing) {
    // Previously unsubscribed. Welcome them back.
    const { error: updateError } = await supabase
      .from("subscribers")
      .update({ first_name: data.first_name, unsubscribed_at: null })
      .eq("id", existing.id);

    if (updateError) {
      console.error("[subscribe] resubscribe update failed", {
        code: (updateError as any).code,
        message: updateError.message,
      });
      return { ok: false, error: "server" };
    }
  } else {
    const { error: insertError } = await supabase
      .from("subscribers")
      .insert({ first_name: data.first_name, email: data.email });

    if (insertError) {
      if ((insertError as any).code === "23505") {
        // Race: another request inserted the same email between the lookup
        // and this insert. Treat it the same as finding it up front.
        return { ok: false, error: "duplicate" };
      }
      console.error("[subscribe] insert failed", {
        code: (insertError as any).code,
        message: insertError.message,
        details: (insertError as any).details,
        hint: (insertError as any).hint,
      });
      return { ok: false, error: "server" };
    }
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
}

/** Thin wrapper so the React form on club.tulipnco.com can call this via useServerFn. */
export const subscribeToClub = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => subscribeInput.parse(input))
  .handler(async ({ data }) => subscribeCore(data));
