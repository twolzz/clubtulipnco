import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Tulip & Co." },
      { name: "description", content: "Curated Dutch plushies, stationery, and accessories. Premium, minimalist, and proudly sourced from the Netherlands." },
      { property: "og:title", content: "Shop — Tulip & Co." },
      { property: "og:description", content: "Curated Dutch plushies, stationery, and accessories." },
    ],
  }),
  component: ShopPage,
});

type Product = {
  name: string;
  category: string;
  price: string;
  bg: string;
  shadow: string;
  shape: "bunny" | "journal" | "pen" | "keychain" | "pouch" | "pin";
  fg: string;
};

const PRODUCTS: Product[] = [
  { name: "Miffy Corduroy Plushie", category: "Plushies", price: "$42", bg: "bg-poppy", shadow: "tc-card-sun", shape: "bunny", fg: "#F6F2E7" },
  { name: "De Stijl Linen Journal", category: "Stationery", price: "$28", bg: "bg-sun", shadow: "tc-card-denim", shape: "journal", fg: "#333333" },
  { name: "Delft Fineliner Set", category: "Stationery", price: "$18", bg: "bg-denim", shadow: "tc-card-poppy", shape: "pen", fg: "#F6F2E7" },
  { name: "Tulip Brass Keychain", category: "Accessories", price: "$14", bg: "bg-sage", shadow: "tc-card-sun", shape: "keychain", fg: "#F6F2E7" },
  { name: "Amsterdam Canvas Pouch", category: "Accessories", price: "$24", bg: "bg-cream", shadow: "tc-card-sage", shape: "pouch", fg: "#333333" },
  { name: "Nijntje Enamel Pin", category: "Accessories", price: "$9", bg: "bg-poppy", shadow: "tc-card-denim", shape: "pin", fg: "#F6F2E7" },
];

function ProductGlyph({ shape, fg }: { shape: Product["shape"]; fg: string }) {
  const stroke = { stroke: "#333333", strokeWidth: 4, fill: fg } as const;
  switch (shape) {
    case "bunny":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <ellipse cx="42" cy="30" rx="10" ry="22" {...stroke} />
          <ellipse cx="78" cy="30" rx="10" ry="22" {...stroke} />
          <circle cx="60" cy="72" r="32" {...stroke} />
          <circle cx="50" cy="70" r="3" fill="#333" />
          <circle cx="70" cy="70" r="3" fill="#333" />
          <path d="M55 82 Q60 86 65 82" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "journal":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <rect x="24" y="20" width="72" height="84" rx="6" {...stroke} />
          <line x1="36" y1="20" x2="36" y2="104" stroke="#333" strokeWidth="4" />
          <line x1="48" y1="42" x2="86" y2="42" stroke="#333" strokeWidth="3" />
          <line x1="48" y1="56" x2="86" y2="56" stroke="#333" strokeWidth="3" />
          <line x1="48" y1="70" x2="74" y2="70" stroke="#333" strokeWidth="3" />
        </svg>
      );
    case "pen":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <rect x="32" y="18" width="20" height="84" rx="4" {...stroke} />
          <polygon points="32,102 52,102 42,118" {...stroke} />
          <rect x="62" y="28" width="20" height="74" rx="4" {...stroke} />
          <polygon points="62,102 82,102 72,118" {...stroke} />
        </svg>
      );
    case "keychain":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <circle cx="42" cy="60" r="22" fill="none" stroke="#333" strokeWidth="6" />
          <line x1="62" y1="60" x2="86" y2="60" stroke="#333" strokeWidth="6" />
          <path d="M60 38 Q70 50 60 60 Q50 50 60 38 Z" {...stroke} />
          <path d="M52 60 Q60 78 68 60 Z" {...stroke} />
        </svg>
      );
    case "pouch":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <rect x="20" y="38" width="80" height="62" rx="8" {...stroke} />
          <path d="M40 38 Q40 22 60 22 Q80 22 80 38" fill="none" stroke="#333" strokeWidth="4" />
          <circle cx="60" cy="68" r="6" fill="#333" />
        </svg>
      );
    case "pin":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <circle cx="60" cy="58" r="32" {...stroke} />
          <ellipse cx="52" cy="48" rx="5" ry="10" fill="#333" />
          <ellipse cx="68" cy="48" rx="5" ry="10" fill="#333" />
          <path d="M52 70 Q60 76 68 70" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );
  }
}

function ShopPage() {
  return (
    <SiteLayout>
      <section className="px-5 md:px-8 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 mb-6 rounded-full bg-sun border-[3px] border-ink text-sm font-bold">
              The Shop
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.02]">
              Quiet things, <span className="text-poppy">built to last.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-ink/80">
              Six essentials. No filler. Each piece sourced direct from Dutch makers and
              shipped from San Diego.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-14">
            {PRODUCTS.map((p) => (
              <article key={p.name} className={`tc-card ${p.shadow} bg-white overflow-hidden flex flex-col`}>
                <div className={`${p.bg} aspect-square flex items-center justify-center border-b-4 border-ink`}>
                  <ProductGlyph shape={p.shape} fg={p.fg} />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink/60">
                    {p.category}
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold leading-tight">{p.name}</h2>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-2xl font-extrabold">{p.price}</span>
                    <button type="button" className="tc-btn tc-btn-cream text-sm py-2 px-4">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
