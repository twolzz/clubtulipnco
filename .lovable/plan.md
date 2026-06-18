# Native "Join the Club" Subscriber Form

Replace the Formspree integration with a native email collector backed by Lovable Cloud (Supabase), styled to the existing De Stijl system.

## 1. Enable Lovable Cloud & create `subscribers` table

Enable Cloud, then run a migration:

```sql
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

grant select, insert on public.subscribers to anon, authenticated;
grant all on public.subscribers to service_role;

alter table public.subscribers enable row level security;

-- Anyone can subscribe
create policy "Anyone can insert a subscriber"
  on public.subscribers for insert
  to anon, authenticated
  with check (true);

-- No public reads (admin-only via service_role)
```

Email uniqueness is enforced at the DB level so duplicate signups surface a clean error.

## 2. New `SubscribeForm` component

`src/components/SubscribeForm.tsx` — reusable, self-contained:

- Zod schema: `first_name` (1–60 chars, trimmed), `email` (valid email, max 255, lowercased).
- Calls `supabase.from('subscribers').insert(...)` directly from the client (RLS allows anon insert).
- States:
  - **Idle** — two `tc-input` fields ("First Name", "Email Address") + Sun Yellow `tc-btn tc-btn-sun` "Subscribe".
  - **Loading** — button disabled, label "Sending…" with a small spinning SVG.
  - **Success** — form swapped for a card-styled message: *"Welcome to the club! Keep an eye on your inbox for our next San Diego pop-up date."*
  - **Error** — `sonner` toast: duplicate email → "You're already on the list!"; anything else → "Something went wrong — please try again." Inline field errors for validation.
- Accepts an optional `variant` prop (`inline` for footer, `modal` for popover use) so it can render in both contexts without duplication.

## 3. Modal trigger for "Join the Club!" buttons

`src/components/JoinClubDialog.tsx` — wraps shadcn `Dialog`:

- Trigger is a `tc-btn tc-btn-sun` "Join the Club!" (children-as-trigger pattern via `asChild`).
- Dialog content styled with thick black border, hard offset shadow, cream background, headline "Join the Club!", subtext "Sign up for exclusive San Diego pop-up updates, new Miffy arrivals, and authentic Dutch design drops.", and `<SubscribeForm variant="modal" />`.

## 4. Replace existing Formspree usages

- `src/components/SiteLayout.tsx` footer — replace the `<form action="https://formspree.io/...">` block with `<SubscribeForm variant="inline" />` (keeps the existing poppy card + headline).
- `src/routes/pop-ups.tsx` — replace the prominent "Join the Club!" CTA with `<JoinClubDialog>Join the Club!</JoinClubDialog>` so clicking opens the modal.
- Audit `shop.tsx`, `blog.tsx`, `our-story.tsx`, `index.tsx` for any other Formspree links/forms and swap them for `JoinClubDialog` or `SubscribeForm` as appropriate.

## 5. Aesthetic rules preserved

- Reuses existing `tc-card`, `tc-input`, `tc-btn`, `tc-btn-sun` tokens — no new colors, gradients, or soft shadows.
- Dialog gets `border-4 border-ink rounded-2xl bg-cream` + `8px 8px 0 var(--poppy)` offset shadow to match the brand cards.
- Spinner is a simple 2px stroked SVG in `currentColor`, no blur/glow.

## Technical notes

- Insert runs from the browser using the publishable key client (`@/integrations/supabase/client`); no server function needed since the policy is `with check (true)` and no read access is granted to anon.
- Duplicate-email detection: check `error.code === '23505'` (Postgres unique violation) to choose the friendly toast copy.
- Email is stored lowercased + trimmed to keep the unique index meaningful.
- No PII is read back to the client; success state is purely UI.
