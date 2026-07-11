import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { unsubscribeByEmail } from "@/lib/unsubscribe.functions";

const searchSchema = z.object({
  email: z.string().email().optional().catch(undefined),
});

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Unsubscribe — Tulip & Co." },
      { name: "description", content: "Manage your Tulip & Co. email preferences." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const { email: emailFromUrl } = useSearch({ from: "/unsubscribe" });
  const unsubscribe = useServerFn(unsubscribeByEmail);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const targetEmail = emailFromUrl ?? email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail) return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await unsubscribe({ data: { email: targetEmail } });
      if (res.ok) setStatus("done");
      else {
        setStatus("error");
        setErrorMsg(res.error === "invalid" ? "Please enter a valid email address." : "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  return (
    <main style={{ backgroundColor: "#F9F6F0", minHeight: "100vh", color: "#000000", fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px" }}>
        <p style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.5px", margin: 0 }}>Tulip &amp; Co.</p>

        <div style={{ display: "flex", marginTop: 32, marginBottom: 48 }}>
          <div style={{ flex: 1, height: 3, backgroundColor: "#E05A36" }} />
          <div style={{ flex: 1, height: 3, backgroundColor: "#F2B73F" }} />
          <div style={{ flex: 1, height: 3, backgroundColor: "#3D6E97" }} />
        </div>

        {status === "done" ? (
          <>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 20px" }}>All done.</h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, margin: 0 }}>You have been safely unsubscribed.</p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 20px" }}>Taking a break?</h1>

            {emailFromUrl ? (
              <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 32px" }}>
                Click below to stop receiving updates for <strong>{emailFromUrl}</strong>. No hard feelings.
              </p>
            ) : (
              <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 32px" }}>
                Enter your email address below to stop receiving updates. No hard feelings.
              </p>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {!emailFromUrl && (
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    padding: "14px 24px",
                    borderRadius: 50,
                    border: "2px solid #000000",
                    backgroundColor: "#ffffff",
                    fontSize: 15,
                    color: "#000000",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  alignSelf: "flex-start",
                  padding: "14px 32px",
                  borderRadius: 50,
                  backgroundColor: "#E05A36",
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: 700,
                  border: "2px solid #000000",
                  boxShadow: "3px 3px 0px 0px #000000",
                  cursor: status === "loading" ? "not-allowed" : "pointer",
                  opacity: status === "loading" ? 0.7 : 1,
                  fontFamily: "inherit",
                }}
              >
                {status === "loading" ? "Working…" : "Confirm Unsubscribe"}
              </button>

              {errorMsg && (
                <p style={{ color: "#E05A36", fontSize: 14, margin: 0 }}>{errorMsg}</p>
              )}
            </form>
          </>
        )}
      </div>
    </main>
  );
}
