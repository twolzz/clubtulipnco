import { createFileRoute, Link } from "@tanstack/react-router";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const STAGGER_MS = 60;

export const Route = createFileRoute("/_app/blog")({
  head: () => ({
    meta: [
      { title: "The Journal | Tulip & Co." },
      { name: "description", content: "Stories about Dutch design, Miffy, and quiet living." },
      { property: "og:title", content: "The Journal | Tulip & Co." },
      {
        property: "og:description",
        content: "Stories about Dutch design, Miffy, and quiet living.",
      },
    ],
  }),
  component: BlogPage,
});

type Article = {
  slug: string;
  title: string;
  image: string;
  excerpt: string;
  tag: string;
  shadow: string;
};

const ARTICLES: Article[] = [
  {
    slug: "magic-of-minimalism",
    title: "The Magic of Minimalism: Why We Can't Get Enough of Miffy",
    image: "https://i.imgur.com/llMgAdo.jpeg",
    excerpt:
      "Why has this little white rabbit captivated children and design-conscious adults for decades? The answer lies in Dick Bruna's mastery of minimalist design.",
    tag: "Design",
    shadow: "tc-card-poppy",
  },
  {
    slug: "origin-of-nijntje",
    title: "From the Dutch Dunes to the World: The True Origin Story of Nijntje",
    image: "https://i.imgur.com/BKdgNKh.jpeg",
    excerpt:
      "Before she was a global design icon, Miffy began as a bedtime story, sparked by a wild rabbit in the dunes of Egmond aan Zee, the summer of 1955.",
    tag: "History",
    shadow: "tc-card-denim",
  },
];

function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="px-5 md:px-8 pt-8 sm:pt-10 md:pt-14 pb-6 sm:pb-8 md:pb-10">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 mb-3 sm:mb-4 rounded-full bg-sage border-[3px] border-ink text-sm font-bold text-white">
            The Journal
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] md:leading-[1.02]">
            Quiet stories from the <span className="text-denim">studio</span>
          </h1>
          <p className="mt-5 sm:mt-6 text-lg md:text-xl text-ink/80 max-w-2xl">
            Essays on De Stijl, Dick Bruna, and the small joys of minimal design.
          </p>
        </div>
      </section>

      {/* Articles grid — flex-1 + justify-center so a short list (today: two
          articles) sits centered in the available height instead of leaving
          a bare gap above the footer; a no-op once enough posts fill the
          viewport on their own. Cards are sized to land fully within one
          screen alongside the hero: a shorter thumbnail ratio, a clamped
          excerpt, and tighter internal spacing. */}
      <section className="px-5 md:px-8 pb-10 md:pb-16 flex-1 flex flex-col justify-center">
        <div className="max-w-5xl mx-auto w-full grid md:grid-cols-2 gap-6 md:gap-8">
          {ARTICLES.map((a, i) => (
            <ArticleCard key={a.slug} article={a} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}

function ArticleCard({ article: a, index }: { article: Article; index: number }) {
  const reveal = useScrollReveal<HTMLAnchorElement>(index * STAGGER_MS);
  return (
    <Link
      ref={reveal.ref}
      style={reveal.style}
      to="/blog/$slug"
      params={{ slug: a.slug }}
      className={`tc-card ${a.shadow} bg-white flex flex-col overflow-hidden tc-lift tc-reveal ${reveal.visible ? "tc-reveal-visible" : ""}`}
    >
      <div className="border-b-4 border-ink bg-cream">
        <img src={a.image} alt={a.title} loading="lazy" className="w-full aspect-[21/9] object-cover" />
      </div>
      <div className="p-4 sm:p-4 md:p-5 flex flex-col gap-1.5">
        <span className="inline-block self-start px-2.5 py-0.5 rounded-full bg-sun border-2 border-ink text-xs font-bold">
          {a.tag}
        </span>
        <h2 className="font-display text-xl font-extrabold leading-tight">{a.title}</h2>
        <p className="text-ink/80 line-clamp-2">{a.excerpt}</p>
        <span className="mt-1 font-bold text-denim">Read the story →</span>
      </div>
    </Link>
  );
}
