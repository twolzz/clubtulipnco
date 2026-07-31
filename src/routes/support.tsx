import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import { SiteLayout } from "@/components/SiteLayout";
import { sendSupportMessage } from "@/lib/support.functions";

const tabSchema = z.object({
  tab: z.enum(["contact", "shipping", "privacy", "terms"]).optional(),
});

export const Route = createFileRoute("/support")({
  validateSearch: (search) => tabSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Support — Tulip & Co." },
      {
        name: "description",
        content:
          "Customer care & legal hub — contact us, shipping & returns, privacy policy, and terms of service for Tulip & Co.",
      },
      { property: "og:title", content: "Support — Tulip & Co." },
      {
        property: "og:description",
        content:
          "Contact us, shipping & returns, privacy policy, and terms of service — all in one place.",
      },
    ],
  }),
  component: SupportPage,
});

type TabKey = "contact" | "shipping" | "privacy" | "terms";

const TABS: { key: TabKey; label: string }[] = [
  { key: "contact", label: "Contact Us" },
  { key: "shipping", label: "Shipping & Returns" },
  { key: "privacy", label: "Privacy Policy" },
  { key: "terms", label: "Terms of Service" },
];

const EMAIL = "hello@tulipnco.com";

function MailLink() {
  return (
    <a
      href={`mailto:${EMAIL}`}
      className="font-semibold text-denim underline decoration-2 underline-offset-4 hover:text-poppy transition-colors break-all"
    >
      {EMAIL}
    </a>
  );
}

function SupportPage() {
  const search = Route.useSearch();
  // Derived straight from the URL — no local state, so tabs work without JS,
  // are shareable, and respond to the back button.
  const active: TabKey = search.tab ?? "contact";

  return (
    <SiteLayout>
      <section className="px-4 sm:px-5 md:px-8 pt-8 md:pt-14 pb-16 md:pb-28">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="text-sm font-semibold text-ink/70 mb-5 md:mb-6">
            <Link to="/" className="hover:text-denim transition-colors">
              Home
            </Link>
            <span className="mx-2 text-ink/40">/</span>
            <span className="text-ink">Support</span>
          </nav>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] md:leading-[1.02] mb-8 md:mb-14">
            Support.
          </h1>

          <div className="grid md:grid-cols-12 gap-6 md:gap-10">
            {/* Tab menu — wraps on mobile (no horizontal scroll), stacks on desktop */}
            <aside className="md:col-span-4 lg:col-span-3 min-w-0">
              <div className="md:sticky md:top-32">
                <ul className="flex flex-wrap md:flex-col gap-2 md:gap-3">
                  {TABS.map((t) => {
                    const isActive = active === t.key;
                    return (
                      <li key={t.key} className="md:w-full">
                        <Link
                          to="/support"
                          search={{ tab: t.key }}
                          aria-current={isActive ? "page" : undefined}
                          className={[
                            "block text-left md:w-full",
                            "rounded-full border-[3px] border-ink px-4 py-2.5 md:px-5 md:py-3",
                            "text-sm md:text-base font-semibold text-ink transition-all",
                            isActive
                              ? "bg-sun shadow-[4px_4px_0_var(--ink)]"
                              : "bg-cream shadow-[4px_4px_0_var(--ink)] hover:text-denim hover:shadow-[6px_6px_0_var(--ink)] hover:-translate-x-[2px] hover:-translate-y-[2px]",
                          ].join(" ")}
                        >
                          {t.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>

            {/* Content container */}
            <div className="md:col-span-8 lg:col-span-9 min-w-0">
              <div className="bg-[#F6F2E7] border-[3px] sm:border-4 border-ink rounded-2xl p-5 sm:p-8 md:p-12 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)]">
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
    <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-extrabold text-ink mb-6 md:mb-8">
      {children}
    </h2>
  );
}

function ContactPanel() {
  const send = useServerFn(sendSupportMessage);
  // A ref, not state: an in-flight flag held in state would re-render and could
  // alter the button, and this panel has to look and behave identically.
  const sending = useRef(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending.current) return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      message: String(fd.get("message") ?? "").trim(),
    };

    sending.current = true;
    try {
      const res = await send({ data: payload });
      if (res.ok) {
        toast.success("Thanks — we'll be in touch within 24–48 hours.");
        form.reset();
      } else {
        toast.error(
          "We couldn't send that. Please email hello@tulipnco.com directly.",
        );
      }
    } catch (err) {
      console.error("[support] send failed", err);
      toast.error("We couldn't send that. Please email hello@tulipnco.com directly.");
    } finally {
      sending.current = false;
    }
  }

  const fieldBase =
    "w-full bg-cream border-[3px] border-ink text-ink placeholder:text-ink/50 px-5 py-3 font-medium shadow-[4px_4px_0_var(--ink)] focus:outline-none focus:shadow-[6px_6px_0_var(--ink)] focus:-translate-x-[1px] focus:-translate-y-[1px] transition-all";

  return (
    <div>
      <PanelHeading>Let's chat.</PanelHeading>
      <p className="text-base md:text-lg leading-relaxed text-ink/85 mb-8 md:mb-10 max-w-2xl">
        Have a question about our products or upcoming San Diego pop-ups? Drop us a
        line! You can reach us directly at <MailLink /> or fill out the form below.
        We are proudly based in San Diego, California, and aim to respond to all
        inquiries within 24–48 hours.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
        <div>
          <label htmlFor="support-name" className="block text-sm font-semibold mb-2">
            Name
          </label>
          <input
            id="support-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your name"
            className={`${fieldBase} rounded-full`}
          />
        </div>

        <div>
          <label htmlFor="support-email" className="block text-sm font-semibold mb-2">
            Email
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
          <label htmlFor="support-message" className="block text-sm font-semibold mb-2">
            Message
          </label>
          <textarea
            id="support-message"
            name="message"
            required
            rows={5}
            placeholder="How can we help?"
            className={`${fieldBase} rounded-3xl resize-none`}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border-[3px] border-ink bg-poppy px-8 py-3 font-bold text-white shadow-[6px_6px_0_var(--ink)] hover:shadow-[8px_8px_0_var(--ink)] hover:-translate-x-[2px] hover:-translate-y-[2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_var(--ink)] transition-all"
          >
            Send Message
          </button>
        </div>
      </form>
    </div>
  );
}

function ShippingPanel() {
  return (
    <div className="max-w-2xl">
      <PanelHeading>Shipping &amp; Returns.</PanelHeading>
      <div className="space-y-6 text-base md:text-lg leading-relaxed text-ink/85">
        <p>
          <span className="font-bold text-ink">Shipping:</span> We offer Free US
          Shipping on all orders over $50. All Tulip &amp; Co. orders are carefully
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
      <PanelHeading>Privacy Policy.</PanelHeading>
      <p className="text-base md:text-lg leading-relaxed text-ink/85 mb-2 font-semibold">
        Authentic Dutch design, with fiercely protected privacy.
      </p>
      <p className="text-sm text-ink/60 mb-6 md:mb-8">Last updated: July 2026</p>
      <ol className="space-y-6 text-base md:text-lg leading-relaxed text-ink/85 list-none">
        <li>
          <span className="font-bold text-ink">1. Information we collect:</span>{" "}
          When you join our club, we collect your first name and email address.
          When you place an order, we collect your email, shipping address, and
          the items you purchased — your payment card details go directly to our
          payment processor and never touch our servers. Your shopping cart is
          stored locally in your own browser and is not saved on our servers
          until you check out. If you contact us through our support form, we
          receive your name, email, and message by email — that message is not
          stored in our database.
        </li>
        <li>
          <span className="font-bold text-ink">2. How we use your information:</span>{" "}
          We use your information to process and ship your orders, send order
          confirmations, respond to questions you send us, and — only if you've
          joined the club — send you occasional emails about upcoming San Diego
          pop-up dates and new arrivals. We do not use tracking cookies or
          analytics scripts to follow you across the web, and we do not sell
          your personal information to anyone.
        </li>
        <li>
          <span className="font-bold text-ink">3. Who we share it with:</span>{" "}
          We share information only with the services that let us run Tulip
          &amp; Co., and only as much as each one needs to do its job:
          Stripe (payment processing — they receive your payment details
          directly; we never see your full card number), Supabase (our secure
          database host), Resend (delivering our emails), and Cloudflare (our
          website hosting). We do not sell, rent, or trade your personal
          information to third parties for marketing purposes.
        </li>
        <li>
          <span className="font-bold text-ink">4. Email preferences:</span>{" "}
          Joining the club is optional and every marketing email we send
          includes a working unsubscribe link. Order confirmations and shipping
          updates are sent regardless of club membership, since they relate
          directly to a purchase you made.
        </li>
        <li>
          <span className="font-bold text-ink">5. Data retention:</span>{" "}
          We keep order records for as long as needed for accounting, tax, and
          customer service purposes. If you unsubscribe from the club, we keep
          your email on file only to remember that you've opted out, so we
          don't accidentally email you again.
        </li>
        <li>
          <span className="font-bold text-ink">6. Your rights:</span>{" "}
          You can ask us what information we hold about you, ask us to correct
          it, or ask us to delete it, at any time. California residents have
          additional rights under state law to know, delete, or opt out of the
          sale of personal information — though as noted above, we don't sell
          personal information in the first place. To make any request, email
          us at <MailLink />.
        </li>
        <li>
          <span className="font-bold text-ink">7. Children's privacy:</span>{" "}
          Tulip &amp; Co. is not directed at children, and we do not knowingly
          collect information from anyone under 13. If you believe a child has
          provided us with personal information, please contact us and we'll
          remove it.
        </li>
        <li>
          <span className="font-bold text-ink">8. Security:</span>{" "}
          We rely on industry-standard, encrypted infrastructure from the
          providers listed above to protect your information. No method of
          transmission or storage is ever 100% secure, but we take reasonable
          steps to protect what you share with us.
        </li>
        <li>
          <span className="font-bold text-ink">9. Changes to this policy:</span>{" "}
          If we materially change how we handle your information, we'll update
          this page and revise the date at the top.
        </li>
        <li>
          <span className="font-bold text-ink">10. Contact us:</span> Questions
          about this policy, or a request about your data, can go to{" "}
          <MailLink />.
        </li>
      </ol>
    </div>
  );
}

function TermsPanel() {
  return (
    <div className="max-w-2xl">
      <PanelHeading>Terms of Service.</PanelHeading>
      <p className="text-sm text-ink/60 mb-6 md:mb-8">Last updated: July 2026</p>
      <ol className="space-y-6 text-base md:text-lg leading-relaxed text-ink/85 list-none">
        <li>
          <span className="font-bold text-ink">1. Acceptance of terms:</span>{" "}
          By using this website or placing an order, you agree to these terms.
          If you don't agree with them, please don't use the site.
        </li>
        <li>
          <span className="font-bold text-ink">2. Products:</span> We carry
          authentic, officially licensed Dutch design goods and collectibles.
          Product availability, descriptions, and pricing may change without
          notice, and we reserve the right to limit quantities on any item.
        </li>
        <li>
          <span className="font-bold text-ink">3. Pricing &amp; payment:</span>{" "}
          All prices are listed in US dollars. Payment is processed securely by
          Stripe at checkout — we never see or store your full card details.
          We reserve the right to correct pricing errors, and to cancel or
          refuse any order we reasonably suspect to be fraudulent.
        </li>
        <li>
          <span className="font-bold text-ink">4. Shipping:</span> We currently
          ship within the United States only. See our Shipping &amp; Returns
          tab for current rates and delivery details.
        </li>
        <li>
          <span className="font-bold text-ink">5. Returns:</span> Returns are
          accepted under the policy described in our Shipping &amp; Returns tab.
          Contact <MailLink /> with your order number to start a return.
        </li>
        <li>
          <span className="font-bold text-ink">6. Club emails:</span> Joining
          our email club is optional and not required to place an order. You
          can unsubscribe from marketing emails at any time using the link in
          any email we send.
        </li>
        <li>
          <span className="font-bold text-ink">7. Intellectual property:</span>{" "}
          The Tulip &amp; Co. name, logo, and website content are our property
          and may not be copied or reused without our permission. Product
          designs and characters remain the property of their respective
          rights holders.
        </li>
        <li>
          <span className="font-bold text-ink">8. Limitation of liability:</span>{" "}
          Tulip &amp; Co. is not liable for indirect, incidental, or
          consequential damages arising from your use of this site or your
          purchase, to the fullest extent permitted by law.
        </li>
        <li>
          <span className="font-bold text-ink">9. Governing law:</span> These
          terms are governed by the laws of the State of California.
        </li>
        <li>
          <span className="font-bold text-ink">10. Changes to these terms:</span>{" "}
          We may update these terms occasionally. Continued use of the site
          after a change means you accept the updated terms.
        </li>
        <li>
          <span className="font-bold text-ink">11. Contact us:</span> Questions
          about these terms can go to <MailLink />.
        </li>
      </ol>
    </div>
  );
}
