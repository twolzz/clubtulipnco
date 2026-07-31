// Public JSON API for the "Join the Club!" form — specifically for the
// coming-soon splash page at www.tulipnco.com, which is a plain static HTML
// file on a *different* Cloudflare Pages project than this app. A browser
// blocks a fetch() to a different domain unless that domain's server
// explicitly allows it, which is what the CORS headers below do — restricted
// to a short list of known origins, not opened up to everyone.
//
// The main site's own SubscribeForm does NOT use this route — it calls
// subscribeToClub directly via useServerFn, same-origin, no CORS needed.
// This route exists only for callers outside club.tulipnco.com.
//
// Uses subscribeCore from subscribers.functions.ts — the exact same logic
// the main site's form runs, not a reimplementation.

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { subscribeCore } from "@/lib/subscribers.functions";

// Add the *.pages.dev preview URL here temporarily if you need to test the
// splash page before www.tulipnco.com is pointed at it.
const ALLOWED_ORIGINS = new Set([
  "https://www.tulipnco.com",
  "https://club.tulipnco.com",
]);

function corsHeaders(origin: string | null) {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

const bodySchema = z.object({
  first_name: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().email().max(255),
});

export const Route = createFileRoute("/api/public/subscribe")({
  server: {
    handlers: {
      // Browsers send this automatically before a cross-origin POST with a
      // JSON body — it's the browser asking permission, not a real request.
      OPTIONS: async ({ request }) => {
        const headers = corsHeaders(request.headers.get("origin"));
        if (!headers) return new Response(null, { status: 403 });
        return new Response(null, { status: 204, headers });
      },

      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        const headers = corsHeaders(origin);

        if (!headers) {
          console.warn("[public subscribe] rejected origin", { origin });
          return new Response(JSON.stringify({ ok: false, error: "invalid" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }

        let parsed;
        try {
          const body = await request.json();
          parsed = bodySchema.safeParse(body);
        } catch {
          parsed = { success: false } as const;
        }

        if (!parsed.success) {
          return new Response(JSON.stringify({ ok: false, error: "invalid" }), {
            status: 400,
            headers: { ...headers, "Content-Type": "application/json" },
          });
        }

        const result = await subscribeCore(parsed.data);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      },
    },
  },
});
