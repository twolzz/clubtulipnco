import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Tulip & Co." },
      { name: "description", content: "Stories about Dutch design, Miffy, and quiet living." },
      { property: "og:title", content: "Blog — Tulip & Co." },
      { property: "og:description", content: "Stories about Dutch design, Miffy, and quiet living." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="The Journal"
      blurb="Essays on De Stijl, Dick Bruna, and the small joys of minimal design. Coming soon."
    />
  ),
});
