## Diagnosis

Root cause: `FROM = "Tulip & Co. <onboarding@resend.dev>"` in `src/lib/announce.server.ts`. `onboarding@resend.dev` is Resend's sandbox sender — it **only delivers to the Resend account owner's email**. All other subscribers are silently rejected upstream. The DB is fine (3 subscribers), the key is read from `process.env`, and the query targets the correct table — but every batch except the owner's silently fails.

Secondary issues in the same file:
- `to: [REPLY_TO]` puts `hello@tulipnco.com` in the visible To: header while everyone else is BCC. Once `hello@tulipnco.com` is the sender, sending to itself as the visible recipient looks odd and can trip spam filters. Better: send each subscriber as an individual `to:` (Resend's `/emails/batch` endpoint accepts up to 100 messages per call).
- Errors are logged but only as `res.status + body`. Resend returns a structured `{ name, message, statusCode }` — we should parse and log all three, plus include which batch/recipients failed.
- Empty subscriber list currently just `return 0` with no log — no dashboard signal.
- `RESEND_API_KEY` and `LOVABLE_API_KEY` presence check exists but returns `0` silently on missing — should log loudly.

## Fixes (all in `src/lib/announce.server.ts`)

1. **Sender swap**
   - `FROM = "Tulip & Co. <hello@tulipnco.com>"`
   - Keep `REPLY_TO = "hello@tulipnco.com"`.
   - Add a top-of-file comment noting the domain must be verified in the Resend dashboard (already is, per user).

2. **Confirm secret hygiene** (no code change needed, called out in the audit summary)
   - `RESEND_API_KEY` is read from `process.env.RESEND_API_KEY` inside the handler — server-only, never bundled to the client.
   - The file is `*.server.ts` and imported dynamically inside `createPopUp`'s handler, so it can't leak into the client graph.

3. **Switch from BCC-blast to Resend batch API**
   - Endpoint: `POST https://connector-gateway.lovable.dev/resend/emails/batch`
   - Body: array of up to 100 `{ from, to:[email], reply_to, subject, html, text, headers }` objects.
   - Chunk `emails` into groups of 100; one gateway call per chunk.
   - Success accounting: parse response `data[]` length for per-message ids; count only messages that returned an id.

4. **Robust try/catch logging**
   - Wrap the whole `sendPopUpAnnouncement` body in try/catch; log `err.name`, `err.message`, `err.stack`.
   - On non-2xx from the gateway, attempt `res.json()` first (Resend error shape: `{ statusCode, name, message }`), fall back to `res.text()`. Log:
     ```
     [announce] resend batch failed { httpStatus, statusCode, name, message, chunkIndex, chunkSize }
     ```
   - On subscriber query failure, log `{ code, message, details, hint }` from the PostgREST error.
   - Return a structured result to the caller: `{ attempted, succeeded, failed, errors: string[] }` instead of a bare count, so `createPopUp` can surface it to the admin UI.

5. **Empty-subscriber safety fallback**
   - After the subscriber query, if `emails.length === 0`:
     - `console.warn("[announce] ALERT: subscribers table returned 0 rows — nothing to send for pop-up:", popUp.name, popUp.id)`
     - Return `{ attempted: 0, succeeded: 0, failed: 0, empty: true }`.
   - `createPopUp` will pass this back to the admin dashboard so the toast reads "pop-up saved — 0 subscribers, no emails sent" instead of a silent "sent to 0".

6. **Small correctness fixes surfaced during the audit**
   - Guard `products` query error the same way (log, but don't abort the send — product grid is optional).
   - Include a real `Message-ID`-friendly `headers` block: keep `List-Unsubscribe` + add `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
   - Trim `emails` to unique, lowercased addresses before batching.

## Admin UI touch (`src/routes/_authenticated/admin.pop-ups.tsx`)

- Update the post-create toast to read the new structured result: e.g. `pop-up saved — sent to 42 / attempted 45 (3 failed, see logs)` or `pop-up saved — 0 subscribers`. No layout changes.

## Out of scope

- No schema changes.
- No new secrets — `RESEND_API_KEY` is already connector-managed.
- No changes to `pop-ups.functions.ts` beyond consuming the new return shape (one-liner).

## Verification plan

1. Create a throwaway pop-up (published, "send announcement" on).
2. Confirm the three current subscribers receive the mail from `hello@tulipnco.com`.
3. Check server logs for `[announce] sent { succeeded: 3, failed: 0 }`.
4. Temporarily delete subscribers → create pop-up → verify the empty-alert warning fires and toast reads "0 subscribers".
