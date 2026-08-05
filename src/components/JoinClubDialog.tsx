import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePresence } from "@/hooks/use-presence";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { SubscribeForm } from "./SubscribeForm";

type Props = {
  children: ReactNode;
  className?: string;
};

// Long enough to read "Welcome to the club!", short enough not to feel stuck.
const AUTO_CLOSE_MS = 1800;
// Slightly longer than --dur-exit (280ms) so the fade/zoom-out finishes first.
const EXIT_MS = 320;

export function JoinClubDialog({ children, className }: Props) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  // Deliberately not tw-animate-css's animate-in/out (which Radix's Presence
  // detects via the `animationend` event): under prefers-reduced-motion this
  // app clamps animation-duration to 1ms globally, short enough that the event
  // can fire before Presence's listener attaches — leaving it waiting forever,
  // so the dialog never unmounts and is stuck open. A plain CSS transition
  // timed by usePresence sidesteps that race entirely.
  const { present, visible } = usePresence(open, EXIT_MS);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  function handleSuccess() {
    closeTimer.current = window.setTimeout(() => setOpen(false), AUTO_CLOSE_MS);
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) window.clearTimeout(closeTimer.current);
        setOpen(next);
      }}
    >
      <DialogPrimitive.Trigger className={className ?? "tc-btn tc-btn-sun inline-flex"}>
        {children}
      </DialogPrimitive.Trigger>
      {present && (
        <DialogPrimitive.Portal forceMount>
          <DialogPrimitive.Overlay
            forceMount
            data-state={visible ? "open" : "closed"}
            className="fixed inset-0 z-50 bg-ink/60 [will-change:opacity] transition-opacity duration-base ease-glide data-[state=closed]:opacity-0 data-[state=closed]:duration-exit data-[state=closed]:pointer-events-none"
          />
          <DialogPrimitive.Content
            forceMount
            data-state={visible ? "open" : "closed"}
            inert={!open || undefined}
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 bg-cream border-4 border-ink rounded-2xl p-7 md:p-9 outline-none scale-100 opacity-100 [will-change:opacity,scale] transition-[opacity,scale] duration-base ease-spring data-[state=closed]:opacity-0 data-[state=closed]:scale-95 data-[state=closed]:duration-exit data-[state=closed]:ease-snap"
            style={{ boxShadow: "8px 8px 0 var(--poppy)" }}
          >
            <DialogPrimitive.Close
              aria-label="Close"
              className="absolute right-4 top-4 w-9 h-9 inline-flex items-center justify-center rounded-full border-2 border-ink bg-white hover:bg-sun transition-colors touch-manipulation"
            >
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>
            <DialogPrimitive.Title className="font-display text-3xl md:text-4xl font-extrabold leading-tight pr-10">
              Join the Club!
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-ink/80">
              Join our community to stay in the loop on upcoming pop-ups, new Miffy arrivals, and
              special surprises!
            </DialogPrimitive.Description>
            <div className="mt-6">
              <SubscribeForm variant="modal" onSuccess={handleSuccess} />
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </DialogPrimitive.Root>
  );
}
