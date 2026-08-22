// STEP 2 of 2
// Goes in: src/components/SiteLayout.tsx  (replace the whole file)
//
// Search removed sitewide: the HeaderSearch import and the <HeaderSearch />
// in the header cluster are both gone.

import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Lock, Instagram, Menu, X } from "lucide-react";
import { CartButton } from "./CartButton";
import { useWordHoverScope } from "@/hooks/use-word-hover";
import { usePageLoadReveal } from "@/hooks/use-page-load-reveal";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/support", label: "Support" },
  { to: "/blog", label: "Blog" },
  { to: "/our-story", label: "Our Story" },
  { to: "/pop-ups", label: "Pop-ups" },
] as const;

const FOOTER_LINKS = [
  { to: "/support", search: { tab: "privacy" as const }, label: "Privacy Policy" },
  { to: "/support", search: { tab: "terms" as const }, label: "Terms of Service" },
  { to: "/support", search: { tab: "shipping" as const }, label: "Shipping & Returns" },
  { to: "/support", search: { tab: "contact" as const }, label: "Contact Us" },
] as const;

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Payment marks                                                       */
/* Only methods actually enabled on the Stripe account are shown.      */
/* ------------------------------------------------------------------ */

function Mark({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="img"
      aria-label={label}
      title={label}
      className="h-8 min-w-[52px] px-2.5 flex items-center justify-center gap-1 rounded-lg border-2 border-ink bg-white"
    >
      {children}
    </div>
  );
}

function VisaMark() {
  return (
    <Mark label="Visa">
      <span className="font-display font-extrabold italic text-[13px] tracking-tight text-denim">
        VISA
      </span>
    </Mark>
  );
}

function MastercardMark() {
  return (
    <Mark label="Mastercard">
      <span className="relative flex items-center">
        <span className="block w-[15px] h-[15px] rounded-full bg-poppy" />
        <span className="block w-[15px] h-[15px] rounded-full bg-sun -ml-[6px] mix-blend-multiply" />
      </span>
    </Mark>
  );
}

function AmexMark() {
  return (
    <Mark label="American Express">
      <span className="font-display font-extrabold text-[10px] leading-none tracking-tight text-denim">
        AMEX
      </span>
    </Mark>
  );
}

function KlarnaMark() {
  return (
    <Mark label="Klarna">
      <span className="font-display font-extrabold text-[11px] leading-none tracking-tight text-ink">
        Klarna.
      </span>
    </Mark>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile menu                                                         */
/* ------------------------------------------------------------------ */

function MobileMenuPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Always mounted (never conditionally rendered) so closing can animate —
  // visibility is driven entirely by data-state, and `inert` keeps the
  // closed panel out of tab order and off-limits to assistive tech.
  return (
    <>
      {/* Backdrop — starts below the header so the close button stays reachable */}
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        data-state={open ? "open" : "closed"}
        className="md:hidden absolute top-full left-0 right-0 h-[calc(100dvh-var(--header-h))] bg-ink/40 cursor-default [will-change:opacity] transition-opacity duration-base ease-glide data-[state=closed]:opacity-0 data-[state=closed]:pointer-events-none data-[state=closed]:duration-exit"
      />

      <div
        id="mobile-menu"
        inert={!open || undefined}
        data-state={open ? "open" : "closed"}
        className="md:hidden absolute top-full left-0 right-0 bg-cream border-b-4 border-ink shadow-[0_8px_0_rgba(0,0,0,0.15)] [will-change:opacity,translate] transition-[opacity,translate] duration-base ease-glide data-[state=closed]:opacity-0 data-[state=closed]:-translate-y-2 data-[state=closed]:pointer-events-none data-[state=closed]:duration-exit"
      >
        <nav className="flex flex-col px-5 py-3">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={onClose}
              className="font-display text-xl font-bold py-4 border-b-2 border-ink/10 last:border-b-0 active:text-denim"
              activeProps={{ className: "text-denim" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 px-5 pb-5 pt-1">
          <a
            href="https://instagram.com"
            aria-label="Instagram"
            className="w-11 h-11 inline-flex items-center justify-center rounded-full border-[3px] border-ink bg-white text-ink tc-press [--press-rest:3px] [--press-hover:5px] [--press-active:1px]"
          >
            <Instagram size={18} strokeWidth={2.5} />
          </a>
          <a
            href="https://tiktok.com"
            aria-label="TikTok"
            className="w-11 h-11 inline-flex items-center justify-center rounded-full border-[3px] border-ink bg-white text-ink tc-press [--press-rest:3px] [--press-hover:5px] [--press-active:1px]"
          >
            <TikTokIcon className="w-[18px] h-[18px]" />
          </a>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

export function SiteLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Effect 1A (per-word hover) scans the whole document — see
  // use-word-hover.tsx for why — so the primary nav below is excluded via
  // its own data-no-word-hover rather than by scope. Effect 1B (page-load
  // fade+rise) stays scoped to <main>: the header/footer never unmount
  // between routes, so there's no "page load" for it to react to there.
  useWordHoverScope();
  usePageLoadReveal(mainRef);

  // Lock body scroll and wire up Escape while the menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-cream text-ink">
      {/* Sticky shell: primary nav. data-no-word-hover: the literal nav bar
          (desktop + its mobile-menu duplicate) is the one thing word-hover
          should never reach, per the brief. */}
      <div className="sticky top-0 z-50" data-no-word-hover>
        <header
          className="bg-cream border-b-4 border-ink"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 md:gap-4 px-4 md:px-8 py-3 md:py-4">
            {/* Left: logo */}
            <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center shrink-0">
              <span className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-ink">
                Tulip &amp; Co.
              </span>
            </Link>

            {/* Center: links (desktop only) */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="font-semibold text-ink hover:text-denim transition-colors"
                  activeProps={{
                    className: "text-denim underline decoration-2 underline-offset-8",
                  }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            {/* Right: cart + menu toggle */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <CartButton />
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                className="md:hidden w-11 h-11 inline-flex items-center justify-center rounded-full border-[3px] border-ink bg-cream tc-press [--press-rest:3px] [--press-hover:5px] [--press-active:1px]"
              >
                {menuOpen ? (
                  <X size={20} strokeWidth={2.5} />
                ) : (
                  <Menu size={20} strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>
        </header>

        <MobileMenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>

      {/* flex flex-col: lets a page's own last section opt into flex-1 and
          absorb any leftover height, instead of it collecting as dead space
          between short content and the footer (see /support, /blog). */}
      <main ref={mainRef} className="flex-1 tc-page flex flex-col">
        {children}
      </main>

      {/* Trust & compliance footer */}
      <footer className="bg-cream border-t-4 border-ink mt-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-14 flex flex-col gap-10">
          {/* Row 1: links + socials */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {FOOTER_LINKS.map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  search={l.search}
                  className="text-sm font-semibold text-ink hover:text-denim transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                className="w-10 h-10 inline-flex items-center justify-center rounded-full border-[3px] border-ink bg-cream text-ink hover:text-denim tc-press [--press-rest:3px] [--press-hover:5px] [--press-active:1px]"
              >
                <Instagram size={18} strokeWidth={2.5} />
              </a>
              <a
                href="https://tiktok.com"
                aria-label="TikTok"
                className="w-10 h-10 inline-flex items-center justify-center rounded-full border-[3px] border-ink bg-cream text-ink hover:text-denim tc-press [--press-rest:3px] [--press-hover:5px] [--press-active:1px]"
              >
                <TikTokIcon className="w-[18px] h-[18px]" />
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="h-[2px] bg-ink/15" />

          {/* Row 2: trust signals */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="inline-flex items-center gap-2 text-denim shrink-0">
                <Lock size={16} strokeWidth={2.5} />
                <span className="text-sm font-semibold">Secure Checkout</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <VisaMark />
                <MastercardMark />
                <AmexMark />
                <KlarnaMark />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-ink/70">
              <span className="font-display font-extrabold text-ink">Tulip &amp; Co.</span>
              <span>© {new Date().getFullYear()} Tulip &amp; Co. Authentic Miffy goods, San Diego.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
