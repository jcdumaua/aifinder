"use client";

import { PublicRouteError } from "@/components/public/public-route-error";

export default function CategoryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PublicRouteError variant="category" reset={reset} />;
}
