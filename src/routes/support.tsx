import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteLayout } from "@/components/SiteLayout";

const tabSchema = z.object({
  tab: z.enum(["contact", "shipping", "privacy", "terms"]).optional(),
});

export const Route = createFileRoute("/support")({
  validateSearch: (search) => tabSchema.parse(search),
  head: () => ({
    meta: [
      { title: "support — tulip & co." },
      {
        name: "description",
        content:
          "customer care & legal hub — contact us, shipping & returns, privacy policy, and terms of service for tulip & co.",
      },
      { property: "og:title", content: "support — tulip & co." },
      {
        property: "og:description",
        content:
          "contact us, shipping & returns, privacy policy, and terms of service — all in one place.",
      },
    ],
  }),
  component: SupportPage,
});

type TabKey = "contact" | "shipping" | "privacy" | "terms";

const TABS: { key: TabKey; label: string }[] = [
  { key: "contact", label: "contact us" },
  { key: "shipping", label: "shipping & returns" },
  { key: "privacy", label: "privacy policy" },
  { key: "terms", label: "terms of service" },
];

const EMAIL = "hello@tulipnco.com";

function MailLink() {
  return (
    <a
      href={`mailto:${EMAIL}`}
      className="font-semibold text-denim underline decoration-2 underline-offset-4 hover:text-poppy transition-colors"
    >
      {EMAIL}
    </a>
  );
}

function SupportPage() {
  const search = Route.useSearch();
  const [active, setActive] = useState<TabKey>(search.tab ?? "contact");
  useEffect(() => {
    if (search.tab && search.tab !== active) setActive(search.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.tab]);

  return (
    <SiteLayout>
      <section className="px-5 md:px-8 pt-10 md:pt-14 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav
            aria-label="breadcrumb"
            className="text-sm font-semibold text-ink/70 mb-6"
          >
            <Link to="/" className="hover:text-denim transition-colors">
              home
            </Link>
            <span className="mx-2 text-ink/40">/</span>
            <span className="text-ink">support</span>
          </nav>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.02] mb-10 md:mb-14">
            support.
          </h1>

          <div className="grid md:grid-cols-12 gap-8 md:gap-10">
            {/* Sticky pill menu */}
            <aside className="md:col-span-4 lg:col-span-3">
              <div className="md:sticky md:top-32">
                <ul className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
                  {TABS.map((t) => {
                    const isActive = active === t.key;
                    return (
                      <li key={t.key} className="shrink-0 md:shrink">
                        <button
                          type="button"
                          onClick={() => setActive(t.key)}
                          aria-pressed={isActive}
                          className={[
                            "w-full whitespace-nowrap md:whitespace-normal text-left",
                            "rounded-full border-[3px] border-ink px-5 py-3",
                            "font-semibold text-ink transition-all",
                            isActive
                              ? "bg-sun shadow-[4px_4px_0_var(--ink)]"
                              : "bg-cream shadow-[4px_4px_0_var(--ink)] hover:text-denim hover:shadow-[6px_6px_0_var(--ink)] hover:-translate-x-[2px] hover:-translate-y-[2px]",
                          ].join(" ")}
                        >
                          {t.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>

            {/* Content container */}
            <div className="md:col-span-8 lg:col-span-9">
              <div
                className="bg-[#F6F2E7] border-4 border-ink rounded-2xl p-8 md:p-12 shadow-[8px_8px_0_var(--ink)]"
              >
                {active === "contact" && <ContactPanel />}
                {active === "shipping" && <ShippingPanel />}
                {active === "privacy" && <PrivacyPanel />}
                {active === "terms" && <TermsPanel />}
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function PanelHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-3xl md:text-5xl font-extrabold text-ink mb-8">
      {children}
    </h2>
  );
}

function ContactPanel() {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    toast.success("thanks — we'll be in touch within 24–48 hours.");
    form.reset();
  }

  const fieldBase =
    "w-full bg-cream border-[3px] border-ink text-ink placeholder:text-ink/50 px-5 py-3 font-medium shadow-[4px_4px_0_var(--ink)] focus:outline-none focus:shadow-[6px_6px_0_var(--ink)] focus:-translate-x-[1px] focus:-translate-y-[1px] transition-all";

  return (
    <div>
      <PanelHeading>let's chat.</PanelHeading>
      <p className="text-base md:text-lg leading-relaxed text-ink/85 mb-10 max-w-2xl">
        Have a question about our products or upcoming San Diego pop-ups? Drop us a
        line! You can reach us directly at <MailLink /> or fill out the form below.
        We are proudly based in San Diego, California, and aim to respond to all
        inquiries within 24–48 hours.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
        <div>
          <label
            htmlFor="support-name"
            className="block text-sm font-semibold mb-2"
          >
            name
          </label>
          <input
            id="support-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="your name"
            className={`${fieldBase} rounded-full`}
          />
        </div>

        <div>
          <label
            htmlFor="support-email"
            className="block text-sm font-semibold mb-2"
          >
            email
          </label>
          <input
            id="support-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={`${fieldBase} rounded-full`}
          />
        </div>

        <div>
          <label
            htmlFor="support-message"
            className="block text-sm font-semibold mb-2"
          >
            message
          </label>
          <textarea
            id="support-message"
            name="message"
            required
            rows={5}
            placeholder="how can we help?"
            className={`${fieldBase} rounded-3xl resize-none`}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full border-[3px] border-ink bg-poppy px-8 py-3 font-bold text-white shadow-[6px_6px_0_var(--ink)] hover:shadow-[8px_8px_0_var(--ink)] hover:-translate-x-[2px] hover:-translate-y-[2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_var(--ink)] transition-all"
          >
            send message
          </button>
        </div>
      </form>
    </div>
  );
}

function ShippingPanel() {
  return (
    <div className="max-w-2xl">
      <PanelHeading>shipping & returns.</PanelHeading>
      <div className="space-y-6 text-base md:text-lg leading-relaxed text-ink/85">
        <p>
          <span className="font-bold text-ink">Shipping:</span> We offer Free US
          Shipping on all orders over $50. All Tulip & Co. orders are carefully
          packaged and shipped directly from San Diego, California.
        </p>
        <p>
          <span className="font-bold text-ink">Returns:</span> We offer a 30-Day
          Return Policy for unused, unopened stationery and plushies in their
          original packaging. To initiate a return, please contact us at{" "}
          <MailLink /> with your order number.
        </p>
      </div>
    </div>
  );
}

function PrivacyPanel() {
  return (
    <div className="max-w-2xl">
      <PanelHeading>privacy policy.</PanelHeading>
      <p className="text-base md:text-lg leading-relaxed text-ink/85 mb-8 font-semibold">
        Authentic Dutch design, with fiercely protected privacy.
      </p>
      <ol className="space-y-6 text-base md:text-lg leading-relaxed text-ink/85 list-none counter-reset-[item] [counter-reset:item]">
        <li>
          <span className="font-bold text-ink">1. Information We Collect:</span>{" "}
          Welcome to Tulip & Co. We only collect the information necessary to
          provide you with a premium shopping experience. This includes your
          Contact Information (when you join our club), Order Information (for
          physical purchases), and securely processed Payment Information.
        </li>
        <li>
          <span className="font-bold text-ink">2. How We Use Your Data:</span>{" "}
          Your information is used strictly to process and ship your Tulip & Co.
          orders, communicate with you regarding your order status, and send you
          exclusive updates regarding our San Diego pop-up dates and new
          inventory arrivals.
        </li>
        <li>
          <span className="font-bold text-ink">
            3. Third-Party Services & Security:
          </span>{" "}
          We will never sell your personal data. We only share necessary data
          with trusted platforms to run our business securely. This includes our
          SSL-encrypted Lovable/Supabase host, Stripe/PayPal (for secure
          transactions), and our email marketing provider.
        </li>
        <li>
          <span className="font-bold text-ink">4. Contact Us:</span> If you have
          any questions about how we handle your data or wish to request
          deletion of your information, please reach out to us directly at{" "}
          <MailLink />.
        </li>
      </ol>
    </div>
  );
}

function TermsPanel() {
  return (
    <div className="max-w-2xl">
      <PanelHeading>terms of service.</PanelHeading>
      <p className="text-base md:text-lg leading-relaxed text-ink/85">
        Welcome to Tulip & Co. By accessing our webshop, you agree to our terms
        of service. All curated merchandise and collections are authentic and
        officially licensed. We reserve the right to update product availability
        and pricing as our Test Batch inventory fluctuates.
      </p>
    </div>
  );
}
