import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/blog", label: "Blog" },
  { to: "/our-story", label: "Our Story" },
  { to: "/pop-ups", label: "Pop-ups" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink">
      {/* Announcement bar */}
      <div className="bg-poppy text-white text-center text-sm md:text-base font-semibold py-2.5 px-4 border-b-4 border-ink">
        NEW: San Diego Pop-up Calendar Announced!
      </div>

      {/* Header */}
      <header className="bg-cream border-b-4 border-ink">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-5 md:px-8 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
              Tulip &amp; Co.
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-7">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="font-semibold text-ink hover:text-poppy transition-colors"
                activeProps={{ className: "text-poppy underline decoration-4 underline-offset-8" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        {/* Mobile nav */}
        <nav className="md:hidden flex flex-wrap gap-2 px-5 pb-4">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="px-3 py-1.5 rounded-full border-2 border-ink bg-white text-sm font-semibold"
              activeProps={{ className: "bg-sun" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-cream border-t-4 border-ink py-16 px-5 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="tc-card tc-card-poppy p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
                  Welcome to <span className="text-poppy">the club!</span>
                </h2>
                <p className="mt-3 text-base md:text-lg text-ink/80">
                  Pop-up dates, fresh drops, and quiet Dutch design — straight to your inbox.
                </p>
              </div>
              <SubscribeForm variant="inline" />
            </div>
          </div>

          <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-ink/70">
            <p className="font-display text-xl text-ink">tulip &amp; co.</p>
            <p>© {new Date().getFullYear()} Tulip &amp; Co. — Authentic Dutch Design, San Diego.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
