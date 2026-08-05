// Supports the pre-launch site gate wired up in src/start.ts.
//
// Two secrets, both Cloudflare Pages environment variables — never in source:
//   GATE_PINCODE          the pincode a visitor types in
//   GATE_SESSION_SECRET    a separate, long random string that signs the
//                          "already unlocked" cookie so it can't be forged
//
// Why two different secrets instead of one: the pincode is only 8 digits —
// fine for a human to type, but far too few combinations to safely use as a
// cryptographic signing key. Keeping them separate means the cookie can't be
// forged even by someone who could guess an 8-digit number, and the pincode
// itself is never embedded in anything sent to the browser except as the
// output of an HMAC, never in the clear.

const GATE_COOKIE_NAME = "tc_gate";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function timingSafeEqual(a: string, b: string): boolean {
  // Compares every character regardless of where a mismatch occurs, so how
  // long the check takes doesn't leak how many characters were correct.
  const len = Math.max(a.length, b.length);
  let result = a.length === b.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    result |= ca ^ cb;
  }
  return result === 0;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isCorrectPincode(submitted: string): boolean {
  const expected = process.env.GATE_PINCODE;
  if (!expected) {
    console.error("[site-gate] GATE_PINCODE is not set");
    return false;
  }
  return timingSafeEqual(submitted, expected);
}

/** Builds a fresh, signed cookie value good for 30 days. */
export async function createSessionCookieValue(): Promise<string> {
  const secret = process.env.GATE_SESSION_SECRET;
  if (!secret) throw new Error("GATE_SESSION_SECRET is not set");
  const expiresAt = Date.now() + THIRTY_DAYS_MS;
  const sig = await hmacHex(secret, String(expiresAt));
  return `${expiresAt}.${sig}`;
}

/** Verifies the cookie's signature and expiry. Never trusts the value alone. */
export async function isSessionValid(cookieHeader: string | null): Promise<boolean> {
  const secret = process.env.GATE_SESSION_SECRET;
  if (!secret || !cookieHeader) return false;

  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${GATE_COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const value = decodeURIComponent(match[1]);
  const dot = value.indexOf(".");
  if (dot === -1) return false;

  const expiresAtStr = value.slice(0, dot);
  const providedSig = value.slice(dot + 1);
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const expectedSig = await hmacHex(secret, expiresAtStr);
  return timingSafeEqual(providedSig, expectedSig);
}

export function gateCookieHeader(value: string): string {
  // Secure requires HTTPS — dropped only in dev, since `bun dev` is served
  // over plain HTTP on the LAN for phone testing, and browsers silently
  // discard a Secure cookie set over an insecure connection. The production
  // build (and every Cloudflare deploy) always runs with NODE_ENV=production
  // and keeps Secure.
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${GATE_COOKIE_NAME}=${value}; Path=/; Max-Age=2592000; HttpOnly;${secure} SameSite=Lax`;
}

/** Only ever redirect to a same-origin relative path — never an open redirect. */
export function safeRedirectTarget(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return "/";
  return raw;
}

function esc(str: string) {
  return str.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}

/**
 * Fully self-contained HTML — no dependency on the app's own bundled CSS/JS,
 * since this is returned directly by middleware before any of that loads.
 * Brand tokens matched to src/styles.css by hand.
 */
export function renderGatePage(opts: { error: boolean; redirectTo: string }): string {
  const redirectTo = esc(opts.redirectTo);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tulip & Co.</title>
<meta name="robots" content="noindex, nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --cream: #F6F2E7; --ink: #000000; --poppy: #E05A36; --sun: #F2B73F; --denim: #3D6E97;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; min-height: 100%; background: var(--cream); color: var(--ink);
    font-family: "Inter", "Helvetica Neue", sans-serif;
  }
  body { display: flex; align-items: center; justify-content: center; min-height: 100vh; min-height: 100dvh; padding: 24px; }
  .card {
    max-width: 380px; width: 100%; text-align: center;
    background: #fff; border: 4px solid var(--ink); border-radius: 16px;
    box-shadow: 8px 8px 0 var(--ink); padding: 36px 28px;
  }
  .wordmark {
    font-family: "Quicksand", "Inter", sans-serif; font-weight: 800; font-size: 20px;
    letter-spacing: -0.02em; margin-bottom: 24px;
  }
  .accent-bar {
    width: 72px; height: 8px; border: 2px solid var(--ink); border-radius: 999px;
    overflow: hidden; display: flex; margin: 0 auto 24px;
  }
  .accent-bar span { flex: 1; }
  .accent-bar span:nth-child(1) { background: var(--poppy); }
  .accent-bar span:nth-child(2) { background: var(--sun); }
  .accent-bar span:nth-child(3) { background: var(--denim); }
  h1 {
    font-family: "Quicksand", "Inter", sans-serif; font-weight: 800; font-size: 1.5rem;
    margin: 0 0 8px;
  }
  p.sub { margin: 0 0 24px; color: rgba(0,0,0,0.7); font-size: 0.95rem; line-height: 1.6; }
  input {
    width: 100%; padding: 0.85rem 1.25rem; font-size: 16px; font-family: inherit;
    border: 3px solid var(--ink); border-radius: 999px; text-align: center;
    letter-spacing: 0.15em; background: #fff; color: var(--ink);
  }
  input:focus { outline: none; box-shadow: 4px 4px 0 var(--ink); }
  button {
    width: 100%; margin-top: 12px; padding: 0.85rem 1.75rem; font-weight: 700; font-size: 15px;
    border: 3px solid var(--ink); border-radius: 999px; background: var(--sun); color: var(--ink);
    cursor: pointer; box-shadow: 4px 4px 0 var(--ink); transition: transform 120ms ease, box-shadow 120ms ease;
  }
  button:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 var(--ink); }
  button:active { transform: translate(2px,2px); box-shadow: 2px 2px 0 var(--ink); }
  .error { margin-top: 14px; font-size: 14px; font-weight: 600; color: var(--poppy); }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
</style>
</head>
<body>
  <div class="card">
    <div class="wordmark">Tulip &amp; Co.</div>
    <div class="accent-bar" aria-hidden="true"><span></span><span></span><span></span></div>
    <h1>Not open yet</h1>
    <p class="sub">This site is private while we get ready. Enter the pincode to continue.</p>
    <form method="POST" action="/__gate">
      <input type="hidden" name="redirect" value="${redirectTo}">
      <label class="sr-only" for="pincode">Pincode</label>
      <input id="pincode" name="pincode" type="password" inputmode="numeric" autocomplete="current-password" placeholder="Pincode" autofocus required>
      <button type="submit">Enter</button>
      ${opts.error ? '<p class="error">Incorrect pincode — try again.</p>' : ""}
    </form>
  </div>
</body>
</html>`;
}
