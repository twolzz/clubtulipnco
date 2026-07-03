import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "sign in — tulip & co." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin/pop-ups" });
    });
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: "/admin/pop-ups" });
  }

  return (
    <SiteLayout>
      <section className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-6 py-20">
        <div
          className="w-full rounded-[16px] border-4 border-[#333] bg-[#F6F2E7] p-8"
          style={{ boxShadow: "8px 8px 0px #3D6E97" }}
        >
          <h1 className="mb-2 text-3xl font-bold lowercase text-[#333]">sign in.</h1>
          <p className="mb-6 text-sm text-[#333]/70 lowercase">
            staff access only.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs lowercase text-[#333]" htmlFor="email">
                email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border-4 border-[#333] bg-white px-5 py-3 text-sm outline-none focus:border-[#3D6E97]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs lowercase text-[#333]" htmlFor="password">
                password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-full border-4 border-[#333] bg-white px-5 py-3 text-sm outline-none focus:border-[#3D6E97]"
              />
            </div>
            {error && (
              <p className="rounded-[12px] border-4 border-[#333] bg-[#E05A36] px-4 py-2 text-sm lowercase text-white">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full border-4 border-[#333] bg-[#E05A36] px-6 py-3 text-sm font-bold lowercase text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              style={{ boxShadow: "6px 6px 0px #333" }}
            >
              {loading ? "signing in..." : "sign in"}
            </button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
