import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AiFinder — AI Tools Directory",
    short_name: "AiFinder",
    description:
      "Discover useful AI tools for chatbots, images, videos, writing, coding, business, productivity, marketing, SEO, design, and AI agents.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    categories: ["productivity", "business", "utilities"],
  };
}
