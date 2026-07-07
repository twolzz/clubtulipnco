## Overview

Add two email flows (welcome + pop-up announcement) using the existing modern-stack pattern already in `announce.server.ts` — Resend via the Lovable connector gateway, called inline from server-side code. No Supabase Edge Functions or DB webhooks (your app runs on TanStack Start / Cloudflare, so an edge function would be a duplicate detour). Sender switches to the newly verified `hello@updates.tulipnco.com`. Existing UI, tables, and pop-up announce logic stay intact.

## Flow A — Welcome email (Join the Club)

**Trigger:** Currently `SubscribeForm` inserts directly into `subscribers` from the browser with the anon key — a client insert can't fan out an email. Move the insert into a new public server function `subscribeToClub` that (1) inserts the row, (2) fires the welcome email after a successful insert, (3) swallows 23505 duplicates the same way the UI does today.

**Email spec (from your outline):**
- From: `Tulip & Co. <hello@updates.tulipnco.com>`
- Reply-To: `hello@tulipnco.com`
- Subject: `You're in! Welcome to the Tulip & Co Club. 🌷`
- Preview: `Inside: Your exclusive member perk + a quick introduction.`
- Sections, in order:
  1. Personalized greeting using `first_name` (falls back to `friend`)
  2. Incentive block — `WELCOME10` code + pill CTA "shop now" → `${SITE_URL}/shop?discount=WELCOME10`
  3. Brand philosophy — 3–4 sentence Mindful Minimalism paragraph
  4. Collection shortcuts — three tag-style links (new arrivals, best sellers, pop-ups)
  5. Whitelist micro-copy — one sentence asking to add `hello@updates.tulipnco.com` to contacts
  6. Footer — © year, San Diego line, contact link, `{{unsubscribe_url}}` placeholder (real one-click unsubscribe is a follow-up)

**Design:** Pulled from the Knowledge File — cream `#F6F2E7` bg, `#333333` 4px borders, 16px radius, hard offset shadow (`6px 6px 0 #F2B73F`), pill CTA in poppy `#E05A36`, all-lowercase headings, Archivo/Inter fallbacks. Same table-based email HTML style as `announce.server.ts`.

**Safety:** Wrapped in try/catch — insert success is never blocked by an email failure; Resend errors log full status/name/message like the announce path.

## Flow B — Pop-up announcement (re-send guard)

**Schema:** add `announced_at timestamptz null` to `public.pop_ups` (single-column migration, no data loss, existing rows stay `null` so they can still fire on the next publish or manual resend).

**Server logic (`pop-ups.functions.ts`):**
- `createPopUp` — send only when `is_published === true` AND `announced_at` is null. On success, stamp `announced_at = now()`.
- `updatePopUp` — input schema gains optional `resend_announcement: boolean` (default false). Fetch the current row first; fire the email when either:
  - `is_published` transitions `false → true` and `announced_at` is null (first publish), OR
  - `resend_announcement === true` (explicit admin re-blast)
- Any other edit (typo, time tweak, location change) does **not** trigger a send. `announced_at` is stamped after a successful send.

**Admin UI (`admin.pop-ups.tsx`):** add a single "resend announcement to subscribers" checkbox in the edit dialog only (unchecked by default). Nothing else in the form changes.

**Sender switch:** `announce.server.ts` FROM becomes `hello@updates.tulipnco.com`; Reply-To stays `hello@tulipnco.com`.

## Files touched

- `supabase/migration` — `ALTER TABLE public.pop_ups ADD COLUMN announced_at timestamptz` (approval step)
- `src/lib/welcome.server.ts` — new, mirrors `announce.server.ts` structure
- `src/lib/subscribers.functions.ts` — new, `subscribeToClub` public server fn (insert + fire welcome)
- `src/components/SubscribeForm.tsx` — swap the direct `supabase.from("subscribers").insert(...)` for `useServerFn(subscribeToClub)`; UX unchanged
- `src/lib/announce.server.ts` — FROM constant only
- `src/lib/pop-ups.functions.ts` — add `resend_announcement`, transition/guard logic, stamp `announced_at`
- `src/routes/_authenticated/admin.pop-ups.tsx` — one checkbox in the edit dialog

## Out of scope (call out, don't build)

- Real one-click unsubscribe endpoint + `suppressed_emails` table — the footer will render a placeholder link and I'll flag it clearly. Wiring a real unsubscribe is a separate follow-up (adds a public route, a token table, and a suppression check before every send).
- Marketing-list compliance (physical address in footer, CAN-SPAM). Add your business address string in a follow-up and I'll drop it into both templates.

## Technical details

- All sends go through `https://connector-gateway.lovable.dev/resend/emails` with `Authorization: Bearer ${LOVABLE_API_KEY}` + `X-Connection-Api-Key: ${RESEND_API_KEY}` — both already present in your secrets.
- Every non-2xx response is logged with `httpStatus`, `statusCode`, `name`, `message` (same shape as the current announce logger) and the caller sees a typed `{ ok, error }` result rather than a thrown 500.
- Welcome send is fire-and-await inside the server fn so we can log failures, but a mail failure is never propagated to the browser — the subscriber row is already saved.
- Pop-up transition detection uses a single `SELECT is_published, announced_at` before the update to avoid race-based double-sends.