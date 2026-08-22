// STEP 1 of 3
// Goes in: src/routes/our-story.tsx  (replace the whole file)

import { createFileRoute } from "@tanstack/react-router";
import { JoinClubDialog } from "@/components/JoinClubDialog";

export const Route = createFileRoute("/_app/our-story")({
  head: () => ({
    meta: [
      { title: "Our Story | Tulip & Co." },
      {
        name: "description",
        content: "Why we started Tulip & Co., authentic Dutch design in San Diego.",
      },
      { property: "og:title", content: "Our Story | Tulip & Co." },
      {
        property: "og:description",
        content: "Why we started Tulip & Co., authentic Dutch design in San Diego.",
      },
    ],
  }),
  component: OurStoryPage,
});

function OurStoryPage() {
  return (
    <>
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
          <div className="space-y-6">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-ink mb-4">
              The Story
            </h2>
            <p>
              Hoi! I'm Thimo Wilts, the founder of Tulip &amp; Co. Growing up in the Netherlands, I
              was surrounded by a design culture that prioritized peace, intentionality, and
              practicality. That's where we find Dick Bruna's beloved Nijntje (Miffy), a character
              whose simple lines and primary colors represent a global icon of visual quiet.
            </p>
            <p>
              When I moved to Southern California, I saw a deep appreciation for "cozy" and
              aesthetic lifestyle products. And while Nijntje is finally beginning to find its way
              into larger American stores, the native story behind these pieces is often lost in the
              noise of mass-market retail.
            </p>
            <p>
              I started Tulip &amp; Co. to offer something different, a personal touch. As someone
              who grew up with Nijntje, I wanted to go beyond simple transactions and build a real
              community: a place for people to meet, share stories, and discover Nijntje and Dutch
              culture.
            </p>
          </div>

          {/* Pull quote */}
          <div className="tc-card tc-card-poppy bg-sun p-6 md:p-8">
            <p className="font-display text-2xl md:text-3xl font-extrabold leading-tight text-ink">
              "one quiet moment at a time."
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-ink mb-4">
              Our Mission
            </h2>
            <p>
              Tulip &amp; Co. is a boutique curator dedicated to design integrity and authentic
              sourcing. We bypass the cold, clinical feel of big-box retail by working with
              authorized suppliers to bring you a hand-picked portfolio of genuine stationery,
              collectibles, and plushies.
            </p>
            <p>
              We focus on pieces that honor the legacy of Dick Bruna's minimalist vision. Whether
              you're a long-time collector or just building a quiet workspace, our mission is to
              bring a piece of Dutch heritage to you, one quiet moment at a time.
            </p>
          </div>
        </article>
      </section>

      {/* CTA */}
      <section className="px-5 md:px-8 pb-20 md:pb-28">
        <div className="max-w-3xl mx-auto tc-card tc-card-sage bg-denim text-white p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold">Meet us in person.</h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">
            Find our next San Diego pop-up, or join the Club for early access to drops.
          </p>
          <JoinClubDialog className="tc-btn tc-btn-sun mt-6 inline-flex">
            Join the Club!
          </JoinClubDialog>
        </div>
      </section>
    </>
  );
}
