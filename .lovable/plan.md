## Phase 1 — UI & Routing Tweaks

**Hero (src/routes/index.tsx)**
- Replace headline with exactly: `dutch design is coming to san diego.` (all lowercase, period included), keeping the existing two-tone treatment (poppy accent on "san diego").
- Clean up the empty `<span>` and stray `\n` placeholders left from the prior copy.

**Header nav (src/components/SiteLayout.tsx)**
- Remove "about" entirely. New `NAV` order: `shop`, `support`, `blog`, `our-story`, `pop-ups`.
- All five route to their existing pages (`/shop`, `/support`, `/blog`, `/our-story`, `/pop-ups`).
- Keep `gap-8` and `justify-between` so spacing rebalances automatically; verify visually at 1280px and mobile.

**Footer deep-linking (SiteLayout.tsx + support.tsx)**
- Footer links currently point to `/privacy`, `/terms`, `/shipping-returns`, `/contact`. Change all four to `/support` with a query param:
  - `contact us` → `/support?tab=contact`
  - `shipping & returns` → `/support?tab=shipping`
  - `privacy policy` → `/support?tab=privacy`
  - `terms of service` → `/support?tab=terms`
- Use `<Link>` (not `<a>`) so client routing works.
- In `support.tsx`: declare typed `validateSearch` on the route (`z.object({ tab: z.enum([...]).optional() })`), read it with `Route.useSearch()`, and initialize `useState<TabKey>(search.tab ?? "contact")`. Also sync on subsequent param changes via `useEffect`.

## Phase 2 — Operational Frame

**Products table (replaces hardcoded array)**
- Migration creates `public.products`: `id uuid pk`, `slug text unique`, `name text`, `category text`, `price_cents int`, `bg text`, `shape text`, `fg text`, `shadow text`, `sort_order int`, `is_active bool`, timestamps.
- GRANT SELECT to anon + authenticated; full CRUD to service_role and admin (via policy `has_role(auth.uid(),'admin')`).
- RLS: public SELECT where `is_active = true`; admin ALL.
- Seed the 6 existing products in the same migration.
- `/shop` switches to a server fn `listProducts()` using the publishable-key server client, called via TanStack Query (`ensureQueryData` + `useSuspenseQuery`).

**Header search**
- Promote the header search icon to a button that opens a slide-down search panel (anchored under the sticky nav, De Stijl card: 4px ink border, 16px radius, hard 6px shadow).
- Pill-shaped input. As the user types, query `products` via a `searchProducts({ q })` server fn (`name ILIKE %q% OR category ILIKE %q%`, limit 8, debounced 200ms client-side).
- Results render as compact product rows with thumbnail glyph, name, category, price, and a poppy "view" link to `/shop` (anchored to product slug). `Esc` and outside-click close. Mobile: full-width drawer from the top.

**Shopping cart (drawer + /cart route)**
- New `src/lib/cart-store.ts`: tiny store (Zustand or a `useSyncExternalStore` hook) persisting `{ items: { productId, qty }[] }` in `localStorage` under `tulip-cart-v1`. Exposes `add`, `remove`, `setQty`, `clear`, `subtotal`.
- New `src/components/CartDrawer.tsx`: slide-over from the right using shadcn `Sheet`. Header pill, line items with qty steppers (pill buttons), subtotal, primary poppy "checkout" CTA (disabled with tooltip "checkout coming soon" for now), secondary "view cart" link to `/cart`.
- Wire the existing cart pill button in `SiteLayout` to open the drawer; replace the static `(0)` count with live `items.length`.
- "Add to Cart" buttons on `/shop` call `cart.add(productId)` and toast confirmation; the drawer auto-opens once on add (configurable).
- New route `src/routes/cart.tsx`: full-page review (same line-item UI, breadcrumb `home > cart`, "continue shopping" link). Empty state with a poppy CTA back to `/shop`.

## Phase 3 — Pop-Up Hub + Subscriber Emails

**`pop_ups` table**
- Migration: `id uuid pk`, `name text`, `location text`, `event_date date`, `start_time time`, `end_time time`, `tag text` (`This Weekend|Featured|New|RSVP|Returning|custom`), `accent text check in ('poppy','sun','sage','denim')`, `is_published bool default true`, `created_by uuid`, timestamps.
- GRANT SELECT to anon + authenticated for `is_published = true`; admin ALL (via `has_role`). Service_role full.
- Seed the 5 existing hardcoded events in the same migration so the page looks unchanged on first deploy.
- `/pop-ups` swaps the hardcoded `EVENTS` array for `listPopUps()` server fn (publishable-key client, `is_published=true`, `order by event_date asc`). Card markup is byte-identical to current — only the data source changes.

**Admin UI `/admin/pop-ups`**
- Route placed under `src/routes/_authenticated/admin.pop-ups.tsx` (managed `_authenticated` gate protects it).
- In-component check: `has_role(auth.uid(),'admin')` via a `requireAdmin` server fn. Non-admin → friendly "you don't have access" panel + back link.
- UI in brand: cream cards, 4px ink borders, pill inputs, poppy primary "add pop-up" CTA, sun "save", denim secondary. Table/list of existing rows with edit + delete (confirm dialog).
- Server fns: `createPopUp`, `updatePopUp`, `deletePopUp` — all `requireSupabaseAuth` + admin role re-check inside the handler.
- `createPopUp` additionally enqueues the announcement email job (below).

**Resend integration + announcement email**
- Connect the Resend connector via `standard_connectors--connect`. This is a setup step that needs to happen before the email send code can run.
- Sender domain: a verified domain on Resend (you choose; I'll surface what's needed). For dev I can use `onboarding@resend.dev`.
- Public server route `POST /api/public/hooks/announce-pop-up` is NOT exposed externally; instead, sending happens inline inside `createPopUp` after the insert succeeds.
- Sending logic (`src/lib/announce.server.ts`):
  1. Fetch active subscribers from `subscribers` (service-role read inside handler).
  2. Fetch the 4 most recent active products as the "curated look at new products" block.
  3. Render a De Stijl HTML email (cream `#F6F2E7` body, 4px ink borders on inner card, hard `8px 8px 0 #E05A36` offset shadow, sun-yellow CTA "see the calendar", lowercase headers): announces the new pop-up's date / location / tag, then a 2×2 product grid with name + price.
  4. Send one Resend request per subscriber via the connector gateway (`POST https://connector-gateway.lovable.dev/resend/emails`) with `Bcc` batching of up to 50 recipients per call to stay within Resend's per-request limit; include `Reply-To: hello@tulipnco.com`, plain-text fallback, and a `List-Unsubscribe` mailto header. Failures logged, success count toasted back to the admin.
- Send is fire-and-forget from the admin UI's perspective: the create returns immediately; emails are sent in the background via `waitUntil`-style awaited promise inside the server fn (Workers runtime).
- An "also send announcement now" checkbox on the create form (default on) controls whether email goes out, so you can add a pop-up silently when needed.

## Technical Details (collapsed reference)

- **Routes added**: `src/routes/cart.tsx`, `src/routes/_authenticated/admin.pop-ups.tsx`. The `_authenticated` layout already exists (integration-managed).
- **Server fns added** (all in `src/lib/`): `products.functions.ts` (`listProducts`, `searchProducts`), `pop-ups.functions.ts` (`listPopUps`, `createPopUp`, `updatePopUp`, `deletePopUp`), `admin.functions.ts` (`requireAdmin` helper).
- **Server-only helpers** (`*.server.ts`): `src/lib/announce.server.ts`, `src/lib/email-templates/pop-up-announcement.server.tsx` (React Email rendered to string).
- **Migrations**: (1) products table + grants + RLS + seed; (2) pop_ups table + grants + RLS + seed.
- **Secrets**: `RESEND_API_KEY` (connector-managed) + existing `LOVABLE_API_KEY`. No new manual secrets.
- **Open follow-ups** (NOT in scope): bootstrapping the first admin user — after the migration lands, I'll insert your `user_roles` row by hand once you give me the email of the account you signed up with.

## Build order

1. Phase 1 UI + footer tab deep-linking (no DB).
2. Products migration + seed → swap `/shop` to DB → header search overlay.
3. Cart store + drawer + `/cart` route.
4. Pop-ups migration + seed → swap `/pop-ups` to DB → admin CRUD UI.
5. Connect Resend → wire announcement email on create.

Each phase is independently shippable; if you want me to pause after any step for review, say which one.
