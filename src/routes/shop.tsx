import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Tulip & Co." },
      { name: "description", content: "Curated Dutch design for your daily life." },
      { property: "og:title", content: "Shop — Tulip & Co." },
      { property: "og:description", content: "Curated Dutch design for your daily life." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="The Shop"
      blurb="Plushies, stationery, and accessories — landing here soon. Join the club for first dibs."
    />
  ),
});
