import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import {
  isCorrectPincode,
  isSessionValid,
  createSessionCookieValue,
  gateCookieHeader,
  safeRedirectTarget,
  renderGatePage,
} from "@/lib/site-gate.server";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

/**
 * Pre-launch pincode gate. Every request needs a valid signed session
 * cookie, except everything under /api/ — those are webhook and public
 * endpoints called by Stripe, Supabase, mail providers, and the coming-soon
 * splash page on a different domain, none of which can type in a pincode.
 *
 * GATE_PINCODE and GATE_SESSION_SECRET are Cloudflare Pages environment
 * variables, never committed to source — see src/lib/site-gate.server.ts.
 *
 * To take this gate down once the store is ready to open, delete this
 * middleware (or just remove it from the requestMiddleware array below) and
 * redeploy. Nothing else in the app depends on it.
 */
const siteGateMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/")) {
    return next();
  }

  if (request.method === "POST" && url.pathname === "/__gate") {
    const form = await request.formData();
    const submitted = String(form.get("pincode") ?? "");
    const redirectTo = safeRedirectTarget(String(form.get("redirect") ?? ""));

    if (!isCorrectPincode(submitted)) {
      return new Response(renderGatePage({ error: true, redirectTo }), {
        status: 401,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    const cookieValue = await createSessionCookieValue();
    return new Response(null, {
      status: 302,
      headers: {
        location: redirectTo,
        "set-cookie": gateCookieHeader(cookieValue),
      },
    });
  }

  const authorized = await isSessionValid(request.headers.get("cookie"));
  if (authorized) {
    return next();
  }

  const redirectTo = safeRedirectTarget(url.pathname + url.search);
  return new Response(renderGatePage({ error: false, redirectTo }), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, siteGateMiddleware],
}));
