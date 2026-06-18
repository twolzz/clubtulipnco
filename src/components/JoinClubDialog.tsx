import { useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { SubscribeForm } from "./SubscribeForm";

type Props = {
  children: ReactNode;
  className?: string;
};

export function JoinClubDialog({ children, className }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        className={className ?? "tc-btn tc-btn-sun inline-flex"}
      >
        {children}
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 bg-cream border-4 border-ink rounded-2xl p-7 md:p-9 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          style={{ boxShadow: "8px 8px 0 var(--poppy)" }}
        >
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute right-4 top-4 w-9 h-9 inline-flex items-center justify-center rounded-full border-2 border-ink bg-white hover:bg-sun transition-colors"
          >
            <X className="w-4 h-4" />
          </DialogPrimitive.Close>
          <DialogPrimitive.Title className="font-display text-3xl md:text-4xl font-extrabold leading-tight pr-10">
            Join the Club!
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 text-ink/80">
            Sign up for exclusive San Diego pop-up updates, new Miffy arrivals, and authentic Dutch design drops.
          </DialogPrimitive.Description>
          <div className="mt-6">
            <SubscribeForm variant="modal" />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
