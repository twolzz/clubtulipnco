import { useLayoutEffect, type RefObject } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Fades + rises every heading and paragraph under `root` on each page
 * navigation (opacity 0 -> 1, translateY ~10px -> 0). Keyed on pathname
 * only — same-path search/state changes (a /shop filter tap, a Support tab
 * switch) intentionally don't replay this, matching the existing rule for
 * the router's own page-crossfade (see router.tsx's defaultViewTransition).
 *
 * useLayoutEffect, not useEffect: the class + animation-delay must land
 * before the browser's first paint of the new route, or the heading would
 * flash fully visible for a frame before jumping back to its hidden
 * "from" state when the animation kicks in.
 *
 * A CSS `animation` (not `transition`) is used specifically so
 * `animation-fill-mode: both` can hold the pre-animation (invisible) state
 * automatically during the delay — no manual two-step "set hidden, then
 * flip visible" dance required.
 */

const HEADING_STEP_MS = 90;
const PARAGRAPH_GAP_MS = 80;
const CAP_MS = 550;

export function usePageLoadReveal(root: RefObject<HTMLElement | null>) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = container.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6, p");

    let headingStep = 0;
    let lastDelay = 0;

    elements.forEach((el) => {
      const isHeading = /^H[1-6]$/.test(el.tagName);
      let delay: number;
      if (isHeading) {
        delay = Math.min(headingStep * HEADING_STEP_MS, CAP_MS);
        headingStep++;
      } else {
        delay = Math.min(lastDelay + PARAGRAPH_GAP_MS, CAP_MS);
      }
      lastDelay = delay;

      if (reduceMotion) {
        el.style.animation = "";
        return;
      }
      el.style.animationDelay = `${delay}ms`;
      el.classList.add("tc-load-in");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}
