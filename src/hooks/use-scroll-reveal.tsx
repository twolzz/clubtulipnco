import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Fade + rise entrance, triggered once when the element scrolls into view.
 * Under prefers-reduced-motion the element is simply visible from the first
 * render — no observer, no transition — rather than being disabled mid-flight.
 *
 * Pass `delayMs` when several instances sit in the same row/grid so they can
 * stagger in rather than popping in all at once (see ProductCard, event
 * cards, etc. — each passes its own index * step).
 */
export function useScrollReveal<T extends HTMLElement>(delayMs = 0) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style: CSSProperties | undefined =
    delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined;

  return { ref, visible, style };
}
