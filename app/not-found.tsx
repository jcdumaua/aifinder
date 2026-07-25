import { PublicRouteError } from "@/components/public/public-route-error";

export default function NotFound() {
  return <PublicRouteError variant="notFound" />;
}
