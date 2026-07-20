# Global Typography & Casing Refresh

Bring the whole app in line with "Mindful Minimalism": warm neo-grotesque type, solid black text, and Sentence/Title Case throughout. Purely a presentation-layer pass — no routing, data, or business logic changes.

## 1. Fonts (Quicksand for display, Inter for body)

**`src/routes/__root.tsx`** — swap the Google Fonts `<link>` for:
`Quicksand:wght@500;600;700` + `Inter:wght@400;500;600;700`.

**`src/styles.css`** — update the theme tokens:
- `--font-display: "Quicksand", "Inter", sans-serif;` (warm, rounded — used for h1–h6)
- `--font-sans: "Inter", "Helvetica Neue", sans-serif;` (body)
- Soften display weight to `700` (Quicksand tops out there) and relax `letter-spacing` on headings from `-0.02em` to `-0.01em` so the rounder glyphs breathe.

## 2. Text color → solid black

In `src/styles.css`:
- `--ink: #000000;` (currently `#333333`)
- `--foreground: #000000;`
- `--color-muted-foreground: #4a4a4a;` (nudged darker for AA on cream)

Border tokens already reference `--ink`, so borders automatically become the required Dark Black. No component-level color rewrites needed.

## 3. Remove every `lowercase` utility

Strip the Tailwind `lowercase` class from these files (found via `rg -n "lowercase" src/`):

- `src/components/SiteLayout.tsx` (announcement bar, wordmark, nav links, search pill, footer heading, footer links, "secure checkout", footer wordmark)
- `src/components/CartButton.tsx`
- `src/components/CartDrawer.tsx`
- `src/components/HeaderSearch.tsx`
- `src/routes/index.tsx` (hero h1)
- `src/routes/shop.tsx`
- `src/routes/pop-ups.tsx`
- `src/routes/cart.tsx`
- `src/routes/support.tsx` (breadcrumb, h1, tab menu, section h2, form labels, submit button)
- `src/routes/login.tsx` (h1, sub-copy, labels, error toast, submit button)
- `src/routes/_authenticated/admin.pop-ups.tsx` (all admin headings, labels, checkboxes)

## 4. Rewrite hardcoded lowercase copy

Every string that was styled `lowercase` gets rewritten so the *source text* is already correctly cased — never rely on CSS to fake casing. Rules:
- Headings, buttons, and CTAs → **Title Case** (e.g. `Sign In`, `Your Cart`, `Add to Cart`, `Secure Checkout`, `Subtotal`, `Confirm Unsubscribe`)
- Nav links → **Title Case** (`Shop`, `Blog`, `Our Story`, `Pop-ups`, `Support`, `Contact Us`, `About`)
- Wordmark → `Tulip & Co.` (already correct in copy; just remove `lowercase`)
- Section headers / body prose → **Sentence case** (`Sign in.` → `Sign in.`, `staff access only.` → `Staff access only.`, `your cart.` → `Your cart.`)
- Form labels → **Sentence case** (`Email`, `Password`, `Name`, `Message`)
- Announcement bar keeps its existing sentence: `NEW: San Diego Pop-up Calendar Announced!` (already correct — just drop the `lowercase` class + `tracking-wide`)

Specific rewrites for currently lowercase strings:
- `sign in.` → `Sign in.`
- `staff access only.` → `Staff access only.`
- `email` / `password` labels → `Email` / `Password`
- `signing in...` / `sign in` button → `Signing in…` / `Sign in`
- `your cart.` → `Your cart.`
- `subtotal` → `Subtotal`
- `secure checkout` → `Secure Checkout`
- `tulip & co.` (footer/header wordmark) → `Tulip & Co.`
- Admin panel headings/labels → Title Case (`Pop-ups`, `Accent`, `Publish now`, `Resend announcement`, etc.)
- Support page breadcrumb → `Home / Support`; h1 → the panel's Title Case header
- Any remaining button text (`working…`, etc.) → `Working…`

## 5. Visual hierarchy preserved

No layout changes. Section padding, card spacing, and the "Layered-Cake" rhythm (large negative space between h1 → body → CTA blocks) stay exactly as they are. Headings remain `font-extrabold`/`font-bold` for punch; Quicksand's rounder shapes reinforce the warm-but-professional voice without adding visual noise.

## Out of scope

- No changes to route structure, server functions, Supabase schema/RLS, email templates, or the standalone unsubscribe page's inline styles beyond swapping `Working…`-style strings if they're lowercase.
- The unsubscribe page already uses Inter + sentence-case copy; leaving it untouched.

## Verification

- `rg -n "\\blowercase\\b" src/` returns zero results after the pass.
- Home, Shop, Our Story, Pop-ups, Blog, Cart, Support, Login, Admin all render with Quicksand headings, Inter body, black text, and no forced-lowercase anywhere.
