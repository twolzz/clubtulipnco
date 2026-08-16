import { forwardRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { subscribeToClub } from "@/lib/subscribers.functions";

const schema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(60, "Too long"),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(255),
});

type FieldErrors = Partial<Record<"first_name" | "email", string>>;

type SubscribeFormProps = {
  variant?: "inline" | "modal";
  /** Fired once the subscription succeeds — lets a wrapping dialog auto-close. */
  onSuccess?: () => void;
};

// forwardRef exposes the first-name input so a wrapping dialog (JoinClubDialog)
// can move focus into it itself, deliberately deferred until its own entrance
// transition finishes — see the transitionend-based focus effect there. The
// plain <SubscribeForm variant="inline" /> usage elsewhere just never attaches
// a ref, so this is a no-op for it.
export const SubscribeForm = forwardRef<HTMLInputElement, SubscribeFormProps>(
  function SubscribeForm({ variant = "inline", onSuccess }, firstFieldRef) {
    const [firstName, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState<FieldErrors>({});
    const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
    const subscribe = useServerFn(subscribeToClub);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setErrors({});

      const parsed = schema.safeParse({ first_name: firstName, email });
      if (!parsed.success) {
        const fieldErrors: FieldErrors = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0] as "first_name" | "email";
          if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        }
        setErrors(fieldErrors);
        return;
      }

      setStatus("loading");
      try {
        const res = await subscribe({ data: parsed.data });
        if (res.ok) {
          setStatus("success");
          onSuccess?.();
          return;
        }
        setStatus("idle");
        if (res.error === "duplicate") {
          toast.error("You're already on the list!");
        } else {
          toast.error("Something went wrong — please try again.");
        }
      } catch {
        setStatus("idle");
        toast.error("Something went wrong — please try again.");
      }
    }

    if (status === "success") {
      return (
        <div
          className={`tc-card bg-cream p-6 md:p-8 text-center ${
            variant === "inline" ? "" : "tc-card-sun"
          }`}
          role="status"
        >
          <p className="font-display text-2xl md:text-3xl font-extrabold leading-tight">
            Welcome to the club!
          </p>
          <p className="mt-3 text-ink/80">
            Keep an eye on your inbox for our next San Diego pop-up date.
          </p>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <div>
          <label className="sr-only" htmlFor="sf-fname">
            First name
          </label>
          <input
            ref={firstFieldRef}
            id="sf-fname"
            name="first_name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            autoComplete="given-name"
            maxLength={60}
            className="tc-input"
            aria-invalid={!!errors.first_name}
            disabled={status === "loading"}
          />
          <p className="mt-1.5 ml-2 text-sm font-semibold text-poppy min-h-[1.25em]">
            {errors.first_name}
          </p>
        </div>
        <div>
          <label className="sr-only" htmlFor="sf-email">
            Email address
          </label>
          <input
            id="sf-email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            autoComplete="email"
            maxLength={255}
            className="tc-input"
            aria-invalid={!!errors.email}
            disabled={status === "loading"}
          />
          <p className="mt-1.5 ml-2 text-sm font-semibold text-poppy min-h-[1.25em]">
            {errors.email}
          </p>
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="tc-btn tc-btn-sun mt-1 disabled:opacity-80"
        >
          {status === "loading" ? (
            <>
              <Spinner />
              Sending…
            </>
          ) : (
            "Subscribe"
          )}
        </button>
      </form>
    );
  },
);

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
    </svg>
  );
}
