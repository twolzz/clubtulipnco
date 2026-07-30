// One-click unsubscribe endpoint (RFC 8058).
//
// Gmail, Outlook and Yahoo show a native "Unsubscribe" button next to the
// sender when an email carries a List-Unsubscribe header. Pressing it sends a
// POST here — no browser, no page, no confirmation screen. If that POST fails,
// providers start treating the mail as spam, so this route has to answer 200
// quickly and opt the address out on its own.
//
// This is backend only. It renders nothing and changes no existing page. The
// visible /unsubscribe page is untouched and still works exactly as before.

import { createFileRoute } from "@tanstack/react-router";

function normalise(value: string | null): string | null {
  if (!value) return null;
  const email = value.trim().toLowerCase();
  // Deliberately loose: this is an opt-out, so a near-miss should still work.
  if (!email.includes("@") || email.length > 255) return null;
  return email;
}

async function optOut(email: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await (supabaseAdmin as any)
    .from("subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("email", email)
    .is("unsubscribed_at", null);

  if (error) {
    console.error("[one-click-unsubscribe] update failed", error.message);
    return false;
  }
  return true;
}

export const Route = createFileRoute("/api/public/unsubscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        let email = normalise(url.searchParams.get("email"));

        // Some providers put the address in the form body instead of the query.
        if (!email) {
          try {
            const form = await request.formData();
            email = normalise(String(form.get("email") ?? ""));
          } catch {
            /* no body — fall through */
          }
        }

        if (!email) {
          console.warn("[one-click-unsubscribe] no email on request");
          // Still 200: a 4xx here counts against sender reputation.
          return new Response("ok", { status: 200 });
        }

        await optOut(email);
        console.log("[one-click-unsubscribe] processed", { email });
        return new Response("ok", { status: 200 });
      },

      // A few older clients follow the link with a GET instead of posting.
      // Hand those to the real page so the person sees the normal confirmation.
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const email = normalise(url.searchParams.get("email"));
        const target = email
          ? `/unsubscribe?email=${encodeURIComponent(email)}`
          : "/unsubscribe";
        return new Response(null, { status: 302, headers: { location: target } });
      },
    },
  },
});
