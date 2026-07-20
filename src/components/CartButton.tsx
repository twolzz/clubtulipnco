import { ShoppingBag } from "lucide-react";
import { useCartCount, cartDrawer } from "@/lib/cart-store";
import { CartDrawer } from "./CartDrawer";

export function CartButton() {
  const count = useCartCount();
  return (
    <>
      <button
        type="button"
        aria-label="shopping cart"
        onClick={() => cartDrawer.open()}
        className="inline-flex items-center gap-2 rounded-full border-[3px] border-ink bg-cream px-4 py-2 font-semibold text-ink shadow-[4px_4px_0_var(--ink)] hover:shadow-[6px_6px_0_var(--ink)] hover:-translate-x-[2px] hover:-translate-y-[2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_var(--ink)] transition-all"
      >
        <ShoppingBag size={18} strokeWidth={2.5} />
        <span className="text-sm">cart ({count})</span>
      </button>
      <CartDrawer />
    </>
  );
}
