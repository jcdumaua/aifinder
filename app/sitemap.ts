import type { MetadataRoute } from "next";
import { supabaseAdmin } from "../lib/supabase-admin";
import { categories, slugify, toolSlug } from "./data/tools";

export const dynamic = "force-dynamic";
export const revalidate = 300;

const siteUrl = "https://aifinder-eight.vercel.app";

type ToolSitemapRow = {
  name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

async function getToolUrls() {
  const { data, error } = await supabaseAdmin
    .from("tools")
    .select("name, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Sitemap tools load error:", error.message);
    return [];
  }

  return ((data || []) as ToolSitemapRow[])
    .filter((tool) => Boolean(tool.name))
    .map((tool) => ({
      url: `${siteUrl}/tool/${toolSlug(tool.name || "")}`,
      lastModified: tool.updated_at || tool.created_at || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const toolUrls = await getToolUrls();

  const categoryUrls = categories.map((category) => ({
    url: `${siteUrl}/category/${slugify(category)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/submit`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...categoryUrls,
    ...toolUrls,
  ];
}
