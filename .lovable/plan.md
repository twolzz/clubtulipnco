## Goal

Rebuild the site's structural frame — sticky top navigation and a trust-focused footer — in `src/components/SiteLayout.tsx`, strictly following the De Stijl / Bruna constraints (thick black borders, hard zero-blur shadows, no gradients, no blur, all-lowercase headings, pill interactive shapes). No middle-page content or backend changes.

I confirm the aesthetic constraints: warm cream background, 4px `#333` borders, hard offset shadows with zero blur, pill-shaped buttons/inputs, all-lowercase nav, Denim Blue hover, Poppy Red reserved for the cart CTA.

## Task 1 — Sticky Primary Navigation

Replace the current `<header>` with a sticky bar:

- `sticky top-0 z-50`, background `#F6F2E7`, `border-b-4 border-ink`.
- Three-column flex layout inside `max-w-7xl` container:
  - **Left:** text logo `tulip & co.` — all-lowercase, neo-grotesque, bold, links to `/`.
  - **Center (desktop):** horizontal text links `shop`, `about`, `pop-ups` — all-lowercase, ink color, hover → Denim Blue (`#3D6E97`), active state subtle underline. (Note: copy says `about`, current route is `/our-story` — I'll wire `about` → `/our-story` unless you want a new `/about` route.)
  - **Right:** minimal search icon button (lucide `Search`, ghost circular hit area) + pill-shaped cart button (lucide `ShoppingBag` + count badge slot), pill border-radius 50px, 4px ink border, hard 4px ink offset shadow. Cart stays neutral cream here (no Poppy) since it's navigation, not the primary conversion CTA — confirm if you'd rather it be Poppy.
- The existing announcement bar stays above the sticky header (also sticky as part of the same wrapper so they stick together).
- Mobile: condensed row — logo left, icon + cart right, links collapse into a pill-row below (kept simple, no hamburger drawer this pass).

## Task 2 — Trust & Compliance Footer

Replace the current footer with a minimal trust-first version (the "Join the Club" subscribe block stays — it lives above the footer in the existing layout; I'll keep it but separated by spacing, not merged into the footer). The new footer itself:

- Container with `border-t-4 border-ink`, cream background, generous padding.
- Two rows inside `max-w-7xl`:
  1. **Links + social row:**
     - Lowercase text links: `privacy policy`, `terms of service`, `shipping & returns`, `contact us` (placeholders → `/privacy`, `/terms`, `/shipping-returns`, `/contact`; routes not created this pass, links render as `<a href>` placeholders until routes exist to avoid TanStack type errors).
     - Outline Instagram + TikTok icons (lucide `Instagram`, custom inline TikTok SVG since lucide lacks one) — circular 4px ink border, hard offset shadow on hover.
  2. **Trust signals row:**
     - Inline SVG monochrome marks for Visa, Mastercard, Apple Pay inside small white pill chips with 2px ink border.
     - Lucide `Lock` icon + text `secure checkout` (lowercase).
     - Copyright line on the right: `© {year} tulip & co.`
- No gradients, no blur, no shadows softer than hard-offset.

## Technical notes

- File touched: `src/components/SiteLayout.tsx` only.
- Uses existing Tailwind tokens (`bg-cream`, `border-ink`, `text-poppy`, etc.) already defined in `styles.css`.
- Icons via `lucide-react` (already installed): `Search`, `ShoppingBag`, `Lock`, `Instagram`. TikTok via inline SVG.
- Payment marks: inline SVGs (no new deps, no external images).
- No new routes, no new components, no DB changes.

## Open questions before I build

1. `about` link → point at existing `/our-story`, or create a new `/about` route?
2. Cart button — keep neutral cream (matches "trust/navigation" role) or override with Poppy Red since it's the path to checkout?
3. Keep the existing "Join the Club" subscribe block sitting above the footer, or remove it entirely for this pure-frame pass?
