"use client";

import { PublicRouteError } from "@/components/public/public-route-error";

export default function ToolError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PublicRouteError variant="tool" reset={reset} />;
}
