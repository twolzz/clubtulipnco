import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { searchProducts } from "@/lib/products.functions";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchFn = useServerFn(searchProducts);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    // delay outside-click bind so opening click doesn't close it
    const t = setTimeout(() => window.addEventListener("mousedown", onClick), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
      clearTimeout(t);
    };
  }, [open]);

  const { data } = useQuery({
    queryKey: ["product-search", debounced],
    queryFn: () => searchFn({ data: { q: debounced } }),
    enabled: open && debounced.length >= 1,
    staleTime: 30_000,
  });

  const results = data ?? [];

  return (
    <>
      <button
        type="button"
        aria-label="search"
        onClick={() => setOpen(true)}
        className="w-10 h-10 flex items-center justify-center rounded-full text-ink hover:text-denim transition-colors"
      >
        <Search size={20} strokeWidth={2.5} />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute left-0 right-0 top-full bg-cream border-b-4 border-ink px-5 md:px-8 py-6 z-40"
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 rounded-full border-4 border-ink bg-white px-5 py-3 shadow-[6px_6px_0_var(--ink)]">
              <Search size={18} strokeWidth={2.5} className="text-ink/60" />
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="search plushies, stationery, accessories…"
                className="flex-1 bg-transparent focus:outline-none font-medium lowercase placeholder:text-ink/50"
              />
              <button
                type="button"
                aria-label="close search"
                onClick={() => setOpen(false)}
                className="text-ink/60 hover:text-ink"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {debounced.length >= 1 && (
              <ul className="mt-4 space-y-2">
                {results.length === 0 ? (
                  <li className="text-sm font-semibold lowercase text-ink/60 px-2">
                    no matches — try "miffy", "journal", or "pen".
                  </li>
                ) : (
                  results.map((p) => (
                    <li key={p.id}>
                      <Link
                        to="/shop"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-4 rounded-2xl border-[3px] border-ink bg-white px-4 py-3 shadow-[4px_4px_0_var(--ink)] hover:shadow-[6px_6px_0_var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all"
                      >
                        <div
                          className="w-10 h-10 rounded-full border-2 border-ink shrink-0"
                          style={{ background: p.bg_color }}
                          aria-hidden
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold uppercase tracking-widest text-ink/60">
                            {p.category}
                          </p>
                          <p className="font-semibold text-ink truncate">{p.name}</p>
                        </div>
                        <span className="font-extrabold">{formatPrice(p.price_cents)}</span>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
