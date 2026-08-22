import { useLayoutEffect, type RefObject } from "react";

/**
 * Fades + rises every heading and paragraph under `root` (opacity 0 -> 1,
 * translateY ~10px -> 0) whenever it first appears — on the initial page
 * load, on a route navigation, and on same-path content swaps like a
 * Support tab switch or a Shop filter tap. Same component type, same
 * entrance treatment, regardless of how the user arrived at that view.
 *
 * Driven by a MutationObserver rather than a router-state effect: this
 * component (SiteLayout) re-renders on a *different* tick than the route
 * content it wraps — SiteLayout subscribes to the router's own state,
 * while the page's tab/filter content reacts to its own `useSearch()` —
 * so a layout effect keyed on the router's location reliably fires before
 * the new panel has actually committed to the DOM, and ends up tagging the
 * *old* content that's about to be replaced. Reacting to the mutation
 * itself sidesteps that race entirely: whatever DOM shows up gets tagged,
 * whenever it actually shows up.
 *
 * Each pass only tags elements that don't yet carry `tc-load-in` — already
 * revealed content is left alone — and staggers just that batch of new
 * elements relative to each other, so a tab switch's freshly-mounted
 * heading+paragraph stagger 0/80ms like any other page's do, independent
 * of whatever was already on screen.
 *
 * A CSS `animation` (not `transition`) is used specifically so
 * `animation-fill-mode: both` can hold the pre-animation (invisible) state
 * automatically during the delay — no manual show/hide toggling needed,
 * and MutationObserver callbacks run as a microtask (before the next
 * paint), so tagging here still lands before the browser paints the new
 * content, same as the old layout-effect approach did for a full page load.
 */

const HEADING_STEP_MS = 90;
const PARAGRAPH_GAP_MS = 80;
const CAP_MS = 550;

function tagNewElements(container: HTMLElement, reduceMotion: boolean) {
  const elements = container.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6, p");

  let headingStep = 0;
  let lastDelay = 0;

  elements.forEach((el) => {
    if (el.classList.contains("tc-load-in")) return; // already tagged

    const isHeading = /^H[1-6]$/.test(el.tagName);
    let delay: number;
    if (isHeading) {
      delay = Math.min(headingStep * HEADING_STEP_MS, CAP_MS);
      headingStep++;
    } else {
      delay = Math.min(lastDelay + PARAGRAPH_GAP_MS, CAP_MS);
    }
    lastDelay = delay;

    if (reduceMotion) return;
    el.style.animationDelay = `${delay}ms`;
    el.classList.add("tc-load-in");
  });
}

export function usePageLoadReveal(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tagNewElements(container, reduceMotion);

    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        tagNewElements(container, reduceMotion);
      });
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [root]);
}
