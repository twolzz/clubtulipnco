// Public health check. Returns booleans (never values) for each expected
// server env so a self-hosted deploy can be diagnosed with a single curl.
// NEVER return the actual secret values.
import { createFileRoute } from "@tanstack/react-router";

const KEYS = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "LOVABLE_API_KEY",
  "RESEND_API_KEY",
  "SITE_URL",
] as const;

export const Route = createFileRoute("/api/public/_healthz")({
  server: {
    handlers: {
      GET: async () => {
        const env: Record<string, boolean> = {};
        for (const k of KEYS) env[k] = Boolean(process.env[k]);
        const allPresent = Object.values(env).every(Boolean);
        return Response.json(
          {
            ok: allPresent,
            env,
            runtime: {
              hasProcessEnv: typeof process !== "undefined" && !!process.env,
              nodeVersion: typeof process !== "undefined" ? process.version ?? null : null,
            },
            checkedAt: new Date().toISOString(),
          },
          {
            status: allPresent ? 200 : 503,
            headers: { "cache-control": "no-store" },
          },
        );
      },
    },
  },
});
