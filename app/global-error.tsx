"use client";

import { PublicRouteError } from "@/components/public/public-route-error";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <PublicRouteError variant="root" reset={reset} />
      </body>
    </html>
  );
}
