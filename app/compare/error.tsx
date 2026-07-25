"use client";

import { PublicRouteError } from "@/components/public/public-route-error";

export default function CompareError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PublicRouteError variant="compare" reset={reset} />;
}
