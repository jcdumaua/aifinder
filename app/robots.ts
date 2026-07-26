import type { MetadataRoute } from "next";
import {
  PUBLIC_CANONICAL_HOST,
  PUBLIC_CANONICAL_ORIGIN,
} from "../lib/public-canonical-origin";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin-login", "/api/"],
      },
    ],
    sitemap: `${PUBLIC_CANONICAL_ORIGIN}/sitemap.xml`,
    host: PUBLIC_CANONICAL_HOST,
  };
}
