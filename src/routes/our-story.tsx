import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/our-story")({
  head: () => ({
    meta: [
      { title: "Our Story — Tulip & Co." },
      { name: "description", content: "Why we started Tulip & Co. — authentic Dutch design in San Diego." },
      { property: "og:title", content: "Our Story — Tulip & Co." },
      { property: "og:description", content: "Why we started Tulip & Co. — authentic Dutch design in San Diego." },
    ],
  }),
  component: OurStoryPage,
});

function OurStoryPage() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="px-5 md:px-8 pt-16 md:pt-24 pb-10">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 mb-6 rounded-full bg-sun border-[3px] border-ink text-sm font-bold">
            Our Story
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.02]">
            Welkom to <span className="text-poppy">Tulip &amp; Co.</span>
          </h1>
        </div>
      </section>

      {/* Story body */}
      <section className="px-5 md:px-8 pb-20 md:pb-28">
        <article className="max-w-2xl mx-auto text-lg md:text-xl leading-relaxed text-ink/85 space-y-10">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-ink mb-4">
              The Story
            </h2>
            <p>
              Hoi! I'm Thimo Wilts, the founder of Tulip &amp; Co. Growing up in the Netherlands,
              I was surrounded by the timeless, minimalist charm of Dutch design — most notably,
              Dick Bruna's beloved Nijntje (known to the rest of the world as Miffy). When I moved
              to Southern California, I noticed a gap in the market. While there was a huge
              appreciation for cozy, aesthetic lifestyle products, finding genuine, high-quality
              Dutch design was incredibly difficult. Too often, fans and collectors had to settle
              for cheap counterfeits or pay astronomical international shipping fees.
              That is why I started Tulip &amp; Co.
            </p>
          </div>

          {/* Pull quote / divider */}
          <div className="tc-card tc-card-poppy bg-sun p-6 md:p-8">
            <p className="font-display text-2xl md:text-3xl font-extrabold leading-tight text-ink">
              "A piece of authentic Dutch heritage, delivered to your neighborhood."
            </p>
          </div>

          <div>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-ink mb-4">
              Our Mission
            </h2>
            <p>
              Based in San Diego, Tulip &amp; Co. is a boutique curator of authentic Dutch design.
              We bypass the mass market by sourcing our premium, officially licensed stationery,
              eco-friendly plushies, and lifestyle accessories directly from authorized European
              suppliers. Whether you are a collector looking for that perfect handmade crochet
              collectible, or you are simply building a cozy, aesthetic desk setup, our mission
              is to bring a piece of authentic Dutch heritage directly to your neighborhood.
              We can't wait to meet you at our upcoming San Diego pop-up markets!
            </p>
          </div>
        </article>
      </section>

      {/* CTA */}
      <section className="px-5 md:px-8 pb-20 md:pb-28">
        <div className="max-w-3xl mx-auto tc-card tc-card-sage bg-denim text-white p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold">Meet us in person.</h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">
            Find our next San Diego pop-up — or join the Club for early access to drops.
          </p>
          <a
            href="https://formspree.io/f/mqeowzez"
            className="tc-btn tc-btn-sun mt-6 inline-block"
          >
            Join the Club!
          </a>
        </div>
      </section>
    </SiteLayout>
  );
}
