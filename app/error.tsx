"use client";

import { PublicRouteError } from "@/components/public/public-route-error";

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PublicRouteError variant="root" reset={reset} />;
}
