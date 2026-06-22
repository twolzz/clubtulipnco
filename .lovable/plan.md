## Plan: `/support` Customer Care & Legal Hub

Confirmed — strict De Stijl/Bruna constraints, all-lowercase headings, pill shapes, hard 4px ink borders + zero-blur offset shadows, no gradients/blur, Poppy Red reserved for the primary CTA. Global nav/footer (SiteLayout) untouched.

### Files
- **Create** `src/routes/support.tsx` — new route at `/support`, wrapped in `SiteLayout`, with `head()` metadata (title: "support — tulip & co.", description, og:title, og:description).
- **No other files modified.** Route tree regenerates automatically.

### Layout
Two-column inside `max-w-6xl` centered on cream background:

```text
┌──────────── /support ────────────┐
│ breadcrumb: home > support       │
│ h1 "support."                    │
│                                  │
│ ┌─ sticky menu ─┐ ┌─ content ──┐ │
│ │ contact us    │ │            │ │
│ │ shipping &    │ │  panel     │ │
│ │   returns     │ │  (cream,   │ │
│ │ privacy       │ │  4px ink,  │ │
│ │   policy      │ │  hard      │ │
│ │ terms of      │ │  shadow)   │ │
│ │   service     │ │            │ │
│ └───────────────┘ └────────────┘ │
└──────────────────────────────────┘
```

- Left column (`md:col-span-4`, `lg:col-span-3`): `sticky top-24` vertical stack of 4 pill buttons (`rounded-full`, 4px ink border, hard 4px ink offset shadow). Active tab = Sun Yellow `#F2B73F` fill; inactive = cream fill, ink text. Hover = Denim Blue `#3D6E97` text.
- Right column (`md:col-span-8`, `lg:col-span-9`): content container — `bg-[#F6F2E7]`, `border-4 border-ink`, `rounded-2xl` (16px), hard `8px 8px 0 #333` shadow, generous `p-8 md:p-12` padding for the Layered-Cake rhythm.
- Mobile: menu collapses above content as a horizontal pill row (scroll-x), content stacks below. No drawer/accordion.

### Tab state
Local `useState<'contact' | 'shipping' | 'privacy' | 'terms'>('contact')`. Plain React conditional rendering — no shadcn Tabs (keeps full control over the pill styling, no extra deps). Tab change is instant; no animation needed.

### Tab 1 — contact us (default)
- h2 `let's chat.` (lowercase, neo-grotesque, bold, large)
- Body paragraph using the exact copy provided, with `hello@tulipnco.com` rendered as a `mailto:` link in Denim Blue.
- Form: three pill-shaped inputs (Name, Email, Message → multi-line textarea also pill-rounded `rounded-3xl`), 4px ink border, hard 4px ink offset shadow, cream fill, ink text.
- Submit: pill Poppy Red `#E05A36` button "send message", white text, hard 6px ink offset shadow.
- Submission behavior: **client-side only for this pass** — `e.preventDefault()` + a `sonner` toast "thanks — we'll be in touch within 24–48 hours." and a form reset. No DB write, no server function (matches "do not build database logic yet" stance from the navigation/footer turn). If you want it wired to a `contact_messages` table, say the word and I'll add a follow-up migration + server function.

### Tabs 2–4 — static content
Each panel: lowercase h2 header + body copy exactly as provided. `shipping & returns` and `privacy policy` rendered as separated paragraphs / numbered list with clear vertical rhythm (no decorative dividers — negative space does the work). `hello@tulipnco.com` linked everywhere it appears.

### SEO
Route-level `head()` with unique title/description and matching og:title/og:description. No og:image (no hero asset for this page).

### Open question
1. Contact form — keep client-only toast for now, or wire it to a new `contact_messages` table with RLS + a server function this same turn?

Default if you don't answer: **client-only toast**, no DB.
