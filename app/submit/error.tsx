"use client";

import { PublicRouteError } from "@/components/public/public-route-error";

export default function SubmitError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PublicRouteError variant="submit" reset={reset} />;
}
