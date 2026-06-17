import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/our-story")({
  head: () => ({
    meta: [
      { title: "Our Story — Tulip & Co." },
      { name: "description", content: "Why we started Tulip & Co. — authentic Dutch design in San Diego." },
      { property: "og:title", content: "Our Story — Tulip & Co." },
      { property: "og:description", content: "Why we started Tulip & Co. — authentic Dutch design in San Diego." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Our Story"
      blurb="From the Dutch dunes to Southern California. The full story is on its way."
    />
  ),
});
