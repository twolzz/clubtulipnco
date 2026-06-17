import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/pop-ups")({
  head: () => ({
    meta: [
      { title: "Pop-ups — Tulip & Co." },
      { name: "description", content: "Find Tulip & Co. at San Diego pop-up markets." },
      { property: "og:title", content: "Pop-ups — Tulip & Co." },
      { property: "og:description", content: "Find Tulip & Co. at San Diego pop-up markets." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Find Us Live"
      blurb="Our full pop-up calendar drops soon. Currently: Little Italy Mercato, select Saturdays."
    />
  ),
});
