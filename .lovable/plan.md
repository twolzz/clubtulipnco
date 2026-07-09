## Context (please read first)

You told me `club.tulipnco.com` is a **separate Cloudflare Pages deployment you built and manage yourself, outside Lovable**. That changes what I can and can't do here honestly:

- I only have access to this Lovable project (source + Lovable-hosted deploy at `clubtulipnco.lovable.app`, which currently returns HTTP 200 on `/shop` and `/pop-ups` — no crash).
- I cannot read your Cloudflare Pages logs, env vars, build output, or deploy config for `club.tulipnco.com`. I can't run `wrangler tail`, inspect your bindings, or verify what actually shipped.
- Any "fix" I make to this repo only reaches `club.tulipnco.com` after **you** rebuild and redeploy it from your own pipeline.

So this plan does two things: **(1) hardens the code in this repo** so a Cloudflare-Pages-on-Workers deploy has the best possible chance of working, and **(2) gives you the exact Cloudflare Pages checklist** to do on your side.

---

## Diagnosis (from the code in this repo)

### Issue 1 — `supabaseUrl is required` on `/shop` and `/pop-ups`

- **Browser client** (`src/integrations/supabase/client.ts`, lines 8–9): reads `import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL`. `VITE_*` is **inlined at build time** — if the values aren't set in your Cloudflare Pages **Build** env, they're literally missing from the JS bundle. That is the #1 cause of `supabaseUrl is required` on a self-hosted CF Pages build.
- **Server publishable client** (`src/lib/subscribers.functions.ts`, lines 25–27): reads `process.env.SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` inside the handler. Correct pattern for Workers — but Workers bindings only expose these if you've added them as **Runtime environment variables** in Cloudflare Pages.
- **Admin client** (`src/integrations/supabase/client.server.ts`): reads `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` inside a lazy factory. Correct pattern.

None of the initialization code is architecturally wrong for Workers. The failure mode "500 on `/shop`, `/pop-ups`" on your CF Pages host is almost certainly **missing envs in that Pages project**, not a code bug.

### Issue 2 — Welcome + Announcement emails not firing

- `src/lib/welcome.server.ts` and `src/lib/announce.server.ts` already: read `LOVABLE_API_KEY` / `RESEND_API_KEY` inside the handler, guard for undefined, wrap `fetch` in try/catch, and log `httpStatus`, `statusCode`, `name`, `message`, and raw body on non-2xx. The instrumentation you're asking for is already there.
- **But** `LOVABLE_API_KEY` is a Lovable-issued credential provisioned into Lovable-hosted deploys. On your own CF Pages deployment, you must add it yourself, and gateway calls fail closed if it's absent. Same for `RESEND_API_KEY`.
- Second likely cause on your CF deploy: `console.error` from a Worker doesn't appear in your browser or in Lovable logs — you need `wrangler pages deployment tail` (or the Pages dashboard "Real-time logs") to see it. If you haven't opened that, silent-failure is the appearance, not the reality.

---

## Plan — changes I'll make in this repo (build mode)

### A. Fail loud + early on missing envs (both issues)
Add a small `src/lib/env.server.ts` that validates required server envs on first server access and throws a descriptive `Error` naming the missing key(s). Wire `welcome.server.ts`, `announce.server.ts`, `subscribers.functions.ts`, and `pop-ups.functions.ts` to read through it. Result: instead of an opaque "supabaseUrl is required" or a silent Resend no-op, your CF Pages tail log gets a single line like `[env] missing SUPABASE_URL, LOVABLE_API_KEY at subscribeToClub`.

### B. Harden the browser Supabase client
Change `src/integrations/supabase/client.ts` to throw a descriptive error at first use listing exactly which of `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` were missing at build time. Right now the message you're getting (`supabaseUrl is required`) comes from `@supabase/supabase-js` and buries the root cause.

### C. Add a `/api/public/_healthz` server route
Returns JSON with a boolean for each expected server env (present/absent, never the value). Lets you curl `https://club.tulipnco.com/api/public/_healthz` after a deploy and see immediately which envs are missing on that host.

### D. Confirm the email log surface
No code change — verify `welcome.server.ts` / `announce.server.ts` already `console.error` the full Resend body (they do). Add one extra `console.log('[welcome] attempt', { to })` before the fetch so a tail log shows the send was reached even if it later fails.

**I will NOT:**
- Change `import.meta.env` to `process.env` in the browser client — that would break the Lovable-hosted deploy where it works correctly today.
- Introduce a Cloudflare-specific `getRequestContext()` / `env` binding read — this project uses `@tanstack/react-start` on Workers, and `process.env` is the supported access pattern via `nodejs_compat`. Reading `event.locals.runtime.env` is a Nitro-adapter pattern that doesn't apply here.
- Touch `src/routes/shop.tsx`, `src/routes/pop-ups.tsx`, or `SubscribeForm.tsx` — the crash is env-driven, not route logic.

---

## Plan — what you must do in the Cloudflare Pages dashboard (I can't do this for you)

Open your CF Pages project → **Settings → Environment variables**. Add **both** to **Production** and **Preview**.

**Runtime environment variables** (available in the Worker via `process.env` with `nodejs_compat`):
- `SUPABASE_URL` → `https://nrrvkhnmaivqgaeqvcdp.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` → `sb_publishable_xrumNC9vci5ygzo30FBTmA_S6-mBN_P`
- `SUPABASE_SERVICE_ROLE_KEY` → *(you need to get this from Lovable Cloud project settings; do NOT commit it)*
- `RESEND_API_KEY` → *(from your Resend dashboard)*
- `LOVABLE_API_KEY` → *(required for the connector gateway; if you're on a self-hosted CF deploy and want to keep using `connector-gateway.lovable.dev`, you need this. Otherwise, switch to Resend direct — see note below)*
- `SITE_URL` → `https://club.tulipnco.com`

**Build environment variables** (inlined into the JS bundle at build time — `VITE_*` **must** be set here, not just runtime):
- `VITE_SUPABASE_URL` → `https://nrrvkhnmaivqgaeqvcdp.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` → `sb_publishable_xrumNC9vci5ygzo30FBTmA_S6-mBN_P`
- `VITE_SUPABASE_PROJECT_ID` → `nrrvkhnmaivqgaeqvcdp`

**Compatibility flags** (Settings → Functions → Compatibility flags): ensure `nodejs_compat` is enabled for both Production and Preview. Without it, `process.env` reads in Node-style code break in Workers.

**Note on `LOVABLE_API_KEY`:** it authenticates the Lovable connector gateway. On a self-hosted CF Pages deploy outside Lovable, you may or may not have a valid one — if not, we'd need to swap `welcome.server.ts` / `announce.server.ts` to call the Resend API directly (`https://api.resend.com/emails` with `Authorization: Bearer ${RESEND_API_KEY}`). Tell me if that applies and I'll add that variant behind an env flag.

---

## After you redeploy

1. `curl https://club.tulipnco.com/api/public/_healthz` → confirms every env is present.
2. `curl https://club.tulipnco.com/shop -I` → expect HTTP 200.
3. Subscribe with a test email, then `wrangler pages deployment tail --project-name=<your-project>` → look for `[welcome] attempt` then either `[welcome] sent` or the exact Resend error body.

---

## Files touched (build mode)

- **new** `src/lib/env.server.ts`
- **new** `src/routes/api/public/_healthz.ts`
- **edit** `src/integrations/supabase/client.ts` (better error message only; behavior unchanged when envs are present)
- **edit** `src/lib/welcome.server.ts`, `src/lib/announce.server.ts`, `src/lib/subscribers.functions.ts`, `src/lib/pop-ups.functions.ts` (route env reads through `env.server.ts`, add attempt log)

No DB migrations. No changes to UI, cart, auth, or admin pages.