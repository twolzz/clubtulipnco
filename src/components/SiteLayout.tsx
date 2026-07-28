import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Lock, Instagram } from "lucide-react";
import { SubscribeForm } from "./SubscribeForm";
import { CartButton } from "./CartButton";
import { HeaderSearch } from "./HeaderSearch";

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

function Mark({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
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

function DiscoverMark() {
  return (
    <Mark label="Discover">
      <span className="font-display font-bold text-[10px] leading-none tracking-tight text-ink">
        DISC
      </span>
      <span className="block w-[9px] h-[9px] rounded-full bg-poppy" />
    </Mark>
  );
}

function ApplePayMark() {
  return (
    <Mark label="Apple Pay">
      <span className="font-display font-semibold text-[12px] leading-none text-ink">
        &#63743; Pay
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

function AffirmMark() {
  return (
    <Mark label="Affirm">
      <span className="font-display font-extrabold text-[11px] leading-none tracking-tight text-sage">
        affirm
      </span>
    </Mark>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink">
      {/* Sticky shell: announcement + primary nav */}
      <div className="sticky top-0 z-50">
        <div className="bg-poppy text-white text-center text-xs md:text-sm font-semibold py-2 px-4 border-b-4 border-ink">
          NEW: San Diego Pop-up Calendar Announced!
        </div>

        <header className="bg-cream border-b-4 border-ink">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-5 md:px-8 py-3 md:py-4">
            {/* Left: logo */}
            <Link to="/" className="flex items-center">
              <span className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-ink">
                Tulip &amp; Co.
              </span>
            </Link>

            {/* Center: links */}
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

            {/* Right: search + cart */}
            <div className="flex items-center gap-2 md:gap-3">
              <HeaderSearch />
              <CartButton />
            </div>
          </div>

          {/* Mobile nav row */}
          <nav className="md:hidden flex flex-wrap gap-2 px-5 pb-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3 py-1.5 rounded-full border-2 border-ink bg-white text-sm font-semibold"
                activeProps={{ className: "bg-sun" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
      </div>

      <main className="flex-1">{children}</main>

      {/* Subscribe block (kept above footer) */}
      <section className="px-5 md:px-8 pt-16 pb-10">
        <div className="max-w-5xl mx-auto">
          <div className="tc-card tc-card-poppy p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
                  Welcome to <span className="text-poppy">the Club!</span>
                </h2>
                <p className="mt-3 text-base md:text-lg text-ink/80">
                  Pop-up dates, fresh drops, and quiet Dutch design — straight to your inbox.
                </p>
              </div>
              <SubscribeForm variant="inline" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust & compliance footer */}
      <footer className="bg-cream border-t-4 border-ink mt-4">
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
                aria-label="instagram"
                className="w-10 h-10 inline-flex items-center justify-center rounded-full border-[3px] border-ink bg-cream text-ink shadow-[3px_3px_0_var(--ink)] hover:text-denim hover:shadow-[5px_5px_0_var(--ink)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
              >
                <Instagram size={18} strokeWidth={2.5} />
              </a>
              <a
                href="https://tiktok.com"
                aria-label="tiktok"
                className="w-10 h-10 inline-flex items-center justify-center rounded-full border-[3px] border-ink bg-cream text-ink shadow-[3px_3px_0_var(--ink)] hover:text-denim hover:shadow-[5px_5px_0_var(--ink)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
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
                <DiscoverMark />
                <ApplePayMark />
                <KlarnaMark />
                <AffirmMark />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-ink/70">
              <span className="font-display font-extrabold text-ink">Tulip &amp; Co.</span>
              <span>© {new Date().getFullYear()} — Authentic Dutch design, San Diego.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
