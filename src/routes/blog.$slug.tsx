import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

type Article = {
  slug: string;
  title: string;
  image: string;
  tag: string;
  shadow: string;
  body: string[];
};

const ARTICLES: Record<string, Article> = {
  "magic-of-minimalism": {
    slug: "magic-of-minimalism",
    title: "The Magic of Minimalism: Why We Can't Get Enough of Miffy",
    image: "https://i.imgur.com/llMgAdo.jpeg",
    tag: "Design",
    shadow: "tc-card-poppy",
    body: [
      "If you have been following Tulip & Co., you know that our curated collections lean heavily into the world of Miffy. But why has this little white rabbit captivated both children and design-conscious adults around the world for decades? The answer lies in the brilliance of her creator, Dutch artist Dick Bruna, and his absolute mastery of minimalist design.",
      "Dick Bruna did not view himself strictly as a children's book illustrator; instead, he considered himself a 'graphic artist'. Heavily influenced by the De Stijl movement and modern art icons like Henri Matisse and Piet Mondrian, Bruna stripped away all unnecessary details from his work. He famously utilized a technique of 'drawing with scissors,' cutting out shapes from custom-mixed colored paper to create his scenes. He restricted his palette almost entirely to primary colors — a warm red, yellow, blue, and green — along with black, white, brown, and grey.",
      "But perhaps the most fascinating aspect of Miffy's design is her face. Miffy is drawn with just two black dots for eyes and a small, diagonal cross for a mouth. By avoiding complex or hyper-expressive detailing, Bruna achieved a state of 'emotional neutrality'. Because Miffy's face does not force a specific emotion onto the reader, it functions as a psychological mirror. If you are happy, Miffy looks quietly content; if you are sad, she appears watchful and understanding. This allows readers of all ages to project their own feelings onto her, creating a deep, personal connection.",
      "Furthermore, Miffy almost always faces directly forward. This direct frontal gaze arrests the reader's attention, establishing an immediate, unmediated face-to-face connection that psychological research shows triggers a positive emotional response.",
      "At Tulip & Co., we believe that this precise, uncluttered design is exactly why Miffy fits so perfectly into modern, cozy aesthetics. She is a reminder that sometimes, less truly is more.",
    ],
  },
  "origin-of-nijntje": {
    slug: "origin-of-nijntje",
    title: "From the Dutch Dunes to the World: The True Origin Story of Nijntje",
    image: "https://i.imgur.com/BKdgNKh.jpeg",
    tag: "History",
    shadow: "tc-card-denim",
    body: [
      "Before she was a global design icon, and long before she was featured on premium stationery and aesthetic plushies, Miffy began as a simple bedtime story. In the summer of 1955, Dutch graphic designer Dick Bruna was on holiday with his wife Irene and their one-year-old son, Sierk, at the seaside town of Egmond aan Zee in the Netherlands. While playing near the shore, they spotted a little wild rabbit skipping around in the sand dunes. That evening, Bruna entertained his son with bedtime stories about the little bunny they had seen, and eventually, he began to sketch the character.",
      "In the Netherlands, she is named Nijntje. The name is simply a child-like shortening of the Dutch word konijntje, which translates to 'little rabbit'. When the books were eventually translated for international audiences, the name 'Miffy' was chosen because it doesn't have any specific meaning, but is very easy for people to pronounce in all languages.",
      "If you look at the very first Miffy book published in 1955, you might be surprised! Originally, she looked more like a lopsided, soft plush toy with asymmetrical, floppy ears. Over the decades, Bruna systematically refined her design, flattening her head into a balanced oval, making her ears sharp and perfectly symmetrical, and widening her eyes.",
      "You might also wonder: why is Miffy a girl? Bruna made that decision simply because he decided he preferred drawing little dresses instead of trousers!",
      "Today, Dick Bruna's creation is a global phenomenon. Her adventures have been translated into over 50 languages and have sold more than 85 million copies worldwide. As a Miffy fan with native Dutch roots, I am incredibly proud to bring the authentic history and premium design of Nijntje directly to you here in California.",
    ],
  },
};

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const article = ARTICLES[params.slug];
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    const a = loaderData?.article;
    if (!a) return { meta: [{ title: "Article — Tulip & Co." }] };
    return {
      meta: [
        { title: `${a.title} — Tulip & Co.` },
        { name: "description", content: a.body[0].slice(0, 155) },
        { property: "og:title", content: a.title },
        { property: "og:description", content: a.body[0].slice(0, 155) },
        { property: "og:image", content: a.image },
        { name: "twitter:image", content: a.image },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <section className="px-5 md:px-8 py-24 max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold">Article not found</h1>
        <Link to="/blog" className="tc-btn tc-btn-sun mt-6 inline-block">
          Back to the Journal
        </Link>
      </section>
    </SiteLayout>
  ),
  errorComponent: () => (
    <SiteLayout>
      <section className="px-5 md:px-8 py-24 max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold">Something went wrong</h1>
        <Link to="/blog" className="tc-btn tc-btn-sun mt-6 inline-block">
          Back to the Journal
        </Link>
      </section>
    </SiteLayout>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  return (
    <SiteLayout>
      <section className="px-5 md:px-8 pt-12 md:pt-16">
        <div className="max-w-3xl mx-auto">
          <Link to="/blog" className="text-sm font-bold text-ink/70 hover:text-poppy">
            ← The Journal
          </Link>
          <span className="inline-block mt-6 px-2.5 py-0.5 rounded-full bg-sun border-2 border-ink text-xs font-bold">
            {article.tag}
          </span>
          <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
            {article.title}
          </h1>
        </div>
      </section>

      <section className="px-5 md:px-8 pt-10">
        <div className={`max-w-4xl mx-auto tc-card ${article.shadow} bg-white overflow-hidden`}>
          <img
            src={article.image}
            alt={article.title}
            className="w-full aspect-[16/9] object-cover"
          />
        </div>
      </section>

      <section className="px-5 md:px-8 py-14 md:py-20">
        <article className="max-w-2xl mx-auto text-lg md:text-xl leading-relaxed text-ink/85 space-y-6">
          {article.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </article>
      </section>

      <section className="px-5 md:px-8 pb-20 md:pb-28">
        <div className="max-w-3xl mx-auto tc-card tc-card-sage bg-denim text-white p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold">Like quiet things?</h2>
          <p className="mt-3 text-white/90">
            Join the Club for new essays, drops, and pop-up dates.
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
