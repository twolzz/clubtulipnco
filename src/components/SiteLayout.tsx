import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Search, ShoppingBag, Lock, Instagram } from "lucide-react";
import { SubscribeForm } from "./SubscribeForm";

const NAV = [
  { to: "/shop", label: "shop" },
  { to: "/our-story", label: "about" },
  { to: "/pop-ups", label: "pop-ups" },
] as const;

const FOOTER_LINKS = [
  { href: "/privacy", label: "privacy policy" },
  { href: "/terms", label: "terms of service" },
  { href: "/shipping-returns", label: "shipping & returns" },
  { href: "/contact", label: "contact us" },
];

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

function VisaMark() {
  return (
    <div className="h-7 px-3 flex items-center justify-center rounded-md border-2 border-ink bg-white">
      <span className="font-display font-extrabold italic text-[13px] tracking-tight text-denim">
        VISA
      </span>
    </div>
  );
}

function MastercardMark() {
  return (
    <div className="h-7 px-2 flex items-center justify-center rounded-md border-2 border-ink bg-white gap-[-6px]">
      <span className="block w-4 h-4 rounded-full bg-poppy" />
      <span className="block w-4 h-4 rounded-full bg-sun -ml-2 mix-blend-multiply" />
    </div>
  );
}

function ApplePayMark() {
  return (
    <div className="h-7 px-3 flex items-center justify-center rounded-md border-2 border-ink bg-white">
      <span className="font-display font-semibold text-[12px] text-ink leading-none">
         Pay
      </span>
    </div>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink">
      {/* Sticky shell: announcement + primary nav */}
      <div className="sticky top-0 z-50">
        <div className="bg-poppy text-white text-center text-xs md:text-sm font-semibold py-2 px-4 border-b-4 border-ink lowercase tracking-wide">
          new: san diego pop-up calendar announced
        </div>

        <header className="bg-cream border-b-4 border-ink">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-5 md:px-8 py-3 md:py-4">
            {/* Left: logo */}
            <Link to="/" className="flex items-center">
              <span className="font-display lowercase text-xl md:text-2xl font-extrabold tracking-tight text-ink">
                tulip &amp; co.
              </span>
            </Link>

            {/* Center: links */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="font-semibold lowercase text-ink hover:text-denim transition-colors"
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
              <button
                type="button"
                aria-label="search"
                className="w-10 h-10 flex items-center justify-center rounded-full text-ink hover:text-denim transition-colors"
              >
                <Search size={20} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                aria-label="shopping cart"
                className="inline-flex items-center gap-2 rounded-full border-[3px] border-ink bg-cream px-4 py-2 font-semibold lowercase text-ink shadow-[4px_4px_0_var(--ink)] hover:shadow-[6px_6px_0_var(--ink)] hover:-translate-x-[2px] hover:-translate-y-[2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_var(--ink)] transition-all"
              >
                <ShoppingBag size={18} strokeWidth={2.5} />
                <span className="text-sm">cart (0)</span>
              </button>
            </div>
          </div>

          {/* Mobile nav row */}
          <nav className="md:hidden flex flex-wrap gap-2 px-5 pb-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3 py-1.5 rounded-full border-2 border-ink bg-white text-sm font-semibold lowercase"
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
                <h2 className="text-4xl md:text-5xl font-extrabold leading-tight lowercase">
                  welcome to <span className="text-poppy">the club!</span>
                </h2>
                <p className="mt-3 text-base md:text-lg text-ink/80">
                  pop-up dates, fresh drops, and quiet dutch design — straight to your inbox.
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
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm font-semibold lowercase text-ink hover:text-denim transition-colors"
                >
                  {l.label}
                </a>
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
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-2 text-ink">
                <Lock size={16} strokeWidth={2.5} />
                <span className="text-sm font-semibold lowercase">secure checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <VisaMark />
                <MastercardMark />
                <ApplePayMark />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-ink/70">
              <span className="font-display font-extrabold lowercase text-ink">tulip &amp; co.</span>
              <span>© {new Date().getFullYear()} — authentic dutch design, san diego.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
