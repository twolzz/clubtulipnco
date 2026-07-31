// Sends the visitor straight to their phone's own maps app.
//
// Used two places: the "Get directions" button on /pop-ups, and the same
// button inside pop-up announcement emails. A plain email link can't run
// JavaScript to check the device, but it CAN link here — this route reads
// the request's User-Agent header itself (an ordinary HTTP header, present
// whether the click came from a browser or a mail app's in-app browser) and
// 302-redirects to the right place. One implementation, identical behaviour
// in both places.
//
// iPhone/iPad -> Apple Maps. Everyone else (Android, desktop) -> Google Maps.
// Public, read-only, no side effects — nothing here needs auth.

import { createFileRoute } from "@tanstack/react-router";

const APPLE_UA = /iPhone|iPod|iPad/i;

function destinationUrl(address: string, userAgent: string) {
  const encoded = encodeURIComponent(address);
  return APPLE_UA.test(userAgent)
    ? `https://maps.apple.com/?daddr=${encoded}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
}

export const Route = createFileRoute("/api/public/maps")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const address = url.searchParams.get("address")?.trim();
        const userAgent = request.headers.get("user-agent") ?? "";

        // No address to work with — send them to a blank map rather than a
        // broken link.
        if (!address) {
          return new Response(null, {
            status: 302,
            headers: { location: "https://www.google.com/maps" },
          });
        }

        return new Response(null, {
          status: 302,
          headers: { location: destinationUrl(address, userAgent) },
        });
      },
    },
  },
});
