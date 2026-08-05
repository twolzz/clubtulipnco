import { useEffect, useState } from "react";

/**
 * Keeps an element mounted through its exit transition.
 *
 * Returns `present` (render it at all) and `visible` (drive the open/closed
 * styling). They're deliberately separate so the element can mount in its
 * closed state and transition in on a later frame — mounting straight into the
 * open state gives the browser only one computed style, so nothing animates.
 *
 * The enter uses a *double* requestAnimationFrame on purpose: a single rAF can
 * still run before the browser has painted the initial closed styles, so both
 * style changes collapse into one frame and the transition is skipped
 * entirely. That's what makes a drawer appear to snap open instead of slide,
 * and it shows up on fast machines first. The second frame guarantees the
 * closed styles were painted before we flip to open.
 *
 * The exit is timed rather than driven by `transitionend`: under reduced
 * motion the transition can be ~0ms and the event may never fire. Anything
 * relying on unmount would then be stranded — Radix restores body
 * pointer-events and releases the scroll lock on unmount, so a missed unmount
 * leaves the whole page unclickable.
 */
export function usePresence(open: boolean, exitMs: number) {
  const [present, setPresent] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setPresent(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setVisible(false);
    const timer = window.setTimeout(() => setPresent(false), exitMs);
    return () => window.clearTimeout(timer);
  }, [open, exitMs]);

  return { present, visible };
}
