// Server-only env validation. Reads process.env inside a function (never at
// module scope) so Cloudflare Workers can inject bindings per request.
// Throws a descriptive error naming every missing key so failures land in
// tail logs instead of surfacing as opaque provider messages.

export type ServerEnvKey =
  | "SUPABASE_URL"
  | "SUPABASE_PUBLISHABLE_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "LOVABLE_API_KEY"
  | "RESEND_API_KEY"
  | "SITE_URL";

export function readServerEnv<K extends ServerEnvKey>(
  keys: readonly K[],
  ctx: string,
): Record<K, string> {
  const out = {} as Record<K, string>;
  const missing: string[] = [];
  for (const k of keys) {
    const v = process.env[k];
    if (!v) missing.push(k);
    else out[k] = v;
  }
  if (missing.length) {
    const msg = `[env] ${ctx}: missing required env var(s): ${missing.join(", ")}`;
    console.error(msg);
    throw new Error(msg);
  }
  return out;
}

export function readOptionalEnv<K extends ServerEnvKey>(
  keys: readonly K[],
): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {};
  for (const k of keys) {
    const v = process.env[k];
    if (v) out[k] = v;
  }
  return out;
}
