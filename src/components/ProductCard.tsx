// Goes in: src/components/ProductCard.tsx  (replace the whole file)

import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/products.functions";
import { cart, cartDrawer } from "@/lib/cart-store";

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/** "Plushies" -> "plushies". Used for the ?collection= URL param. */
export function collectionSlug(category: string) {
  return category.trim().toLowerCase().replace(/\s+/g, "-");
}

export const BG_CLASS: Record<string, string> = {
  "#E05A36": "bg-poppy",
  "#F2B73F": "bg-sun",
  "#3D6E97": "bg-denim",
  "#5D7A51": "bg-sage",
  "#F6F2E7": "bg-cream",
};

export function ProductGlyph({ shape, fg }: { shape: string; fg: string }) {
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
    default:
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

/**
 * Square media block. Renders the bucket image when one exists, and silently
 * falls back to the drawn glyph if the file is missing or fails to load.
 *
 * Reused by the shop grid, the product page gallery, the cart drawer and the
 * checkout summary, so a product looks identical everywhere.
 */
export function ProductMedia({
  product,
  src,
  className = "",
  priority = false,
}: {
  product: Product;
  src?: string;
  className?: string;
  priority?: boolean;
}) {
  const url = src ?? product.images[0];
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  const showImage = Boolean(url) && !failed;
  const bgClass = BG_CLASS[product.bg_color] ?? "";

  return (
    <div
      className={`${showImage ? "bg-white" : bgClass} aspect-square flex items-center justify-center overflow-hidden ${className}`}
      style={showImage || bgClass ? undefined : { background: product.bg_color }}
    >
      {showImage ? (
        <img
          src={url}
          alt={product.name}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <ProductGlyph shape={product.shape} fg={product.fg_color} />
      )}
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock_quantity <= 0;

  function addToCart() {
    cart.add(product.id);
    // No toast — the drawer opening is the confirmation.
    cartDrawer.open();
  }

  return (
    <article
      className={`tc-card ${product.shadow} bg-white overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px]`}
    >
      <Link
        to="/shop/$slug"
        params={{ slug: product.slug }}
        className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-denim"
      >
        <div className="relative">
          <ProductMedia
            product={product}
            className="border-b-[3px] sm:border-b-4 border-ink"
          />
          {soldOut && (
            <span className="absolute top-2 left-2 px-2 py-1 rounded-full bg-ink text-white text-[10px] font-bold uppercase tracking-widest">
              Sold Out
            </span>
          )}
        </div>

        <div className="px-3 sm:px-5 pt-3 sm:pt-5">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-ink/60">
            {product.category}
          </p>
          <h2 className="mt-1 text-sm sm:text-lg md:text-xl font-extrabold leading-tight hover:text-denim transition-colors">
            {product.name}
          </h2>
        </div>
      </Link>

      <div className="px-3 sm:px-5 pb-3 sm:pb-5 mt-auto pt-3 sm:pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <span className="text-lg sm:text-xl md:text-2xl font-extrabold">
          {formatPrice(product.price_cents)}
        </span>
        <button
          type="button"
          onClick={addToCart}
          disabled={soldOut}
          aria-label={`Add ${product.name} to cart`}
          className={`tc-btn ${soldOut ? "tc-btn-cream opacity-60 cursor-not-allowed" : "tc-btn-poppy"} w-full sm:w-auto text-xs sm:text-sm py-2 px-3 sm:px-4 shrink-0`}
        >
          {soldOut ? "Sold Out" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}
