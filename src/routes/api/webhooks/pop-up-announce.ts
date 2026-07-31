// Fired by a Supabase Database Webhook on public.pop_ups (see the setup
// steps below). Sends the announcement exactly once per row: after a
// successful send, this stamps announced_at, and every request checks that
// column first so retries and later edits never send a duplicate.
//
// SETUP (one-time, in the Supabase dashboard — no SQL needed):
//   1. Database -> Webhooks -> Create a new hook
//   2. Table: pop_ups   Events: Insert, Update   Type: HTTP Request
//   3. Method: POST   URL: https://club.tulipnco.com/api/webhooks/pop-up-announce
//   4. HTTP Headers: add one —
//        x-popup-webhook-secret: <same random string as POPUP_WEBHOOK_SECRET>
//      Generate any long random string for this; it just has to match the
//      Cloudflare Pages environment variable of the same value.
//
// WHEN THIS SENDS
//   - INSERT of a row with is_published = true, or
//   - UPDATE where is_published flips from false to true
//   ...and only if announced_at is still null. Any other event (a typo fix,
//   an unrelated edit, a row that stays unpublished) is acknowledged with 200
//   and does nothing, so Supabase never retries it as a failure.

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { sendPopUpAnnouncement, type PopUpRow } from "@/lib/pop-up-announcement.server";

function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  ) as any;
}

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: (PopUpRow & { is_published: boolean; announced_at: string | null }) | null;
  old_record: { is_published: boolean } | null;
};

export const Route = createFileRoute("/api/webhooks/pop-up-announce")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.POPUP_WEBHOOK_SECRET;
        if (!secret) {
          console.error("[pop-up-announce webhook] POPUP_WEBHOOK_SECRET is not set");
          return new Response("Webhook not configured", { status: 500 });
        }

        if (request.headers.get("x-popup-webhook-secret") !== secret) {
          console.warn("[pop-up-announce webhook] bad or missing secret header");
          return new Response("Unauthorized", { status: 401 });
        }

        let body: WebhookPayload;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        if (body.table !== "pop_ups" || !body.record) {
          // Not something this route needs to act on. 200 so it isn't retried.
          return new Response("ignored", { status: 200 });
        }

        const { record, old_record, type } = body;

        const justPublished =
          type === "INSERT" ? record.is_published === true
          : type === "UPDATE" ? record.is_published === true && old_record?.is_published !== true
          : false;

        if (!justPublished || record.announced_at) {
          return new Response("ignored", { status: 200 });
        }

        const result = await sendPopUpAnnouncement(record);

        if (!result.ok) {
          console.error("[pop-up-announce webhook] send failed", result.error);
          // 500 so Supabase retries the delivery.
          return new Response("Send failed", { status: 500 });
        }

        const supabase = adminClient();
        const { error: stampError } = await supabase
          .from("pop_ups")
          .update({ announced_at: new Date().toISOString() })
          .eq("id", record.id);

        if (stampError) {
          // The email already went out — log loudly, but don't return 500,
          // since that would make Supabase retry and re-send the email.
          console.error(
            "[pop-up-announce webhook] sent OK but failed to stamp announced_at — " +
              "this row may re-send on its next edit",
            { popUpId: record.id, error: stampError.message },
          );
        }

        console.log("[pop-up-announce webhook] announced", {
          popUpId: record.id,
          sentTo: result.sentTo,
        });
        return new Response("ok", { status: 200 });
      },
    },
  },
});
