import type { MetadataRoute } from "next";
import { supabaseAdmin } from "../lib/supabase-admin";
import { categories, slugify } from "./data/tools";

export const dynamic = "force-dynamic";

const siteUrl = "https://aifinder.to";

type ToolSitemapRow = {
  slug?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const canonicalToolSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function hasCanonicalToolSlug(
  tool: ToolSitemapRow,
): tool is ToolSitemapRow & { slug: string } {
  return (
    typeof tool.slug === "string" && canonicalToolSlugPattern.test(tool.slug)
  );
}

function getPersistedDate(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (!value) continue;
    const candidate = new Date(value);
    if (!Number.isNaN(candidate.getTime())) return candidate;
  }

  return undefined;
}

async function getToolUrls() {
  const { data, error } = await supabaseAdmin
    .from("public_safe_tools")
    .select("slug, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Sitemap tools load error:", error.message);
    return [];
  }

  return ((data || []) as ToolSitemapRow[])
    .filter(hasCanonicalToolSlug)
    .map((tool) => {
      const persistedDate = getPersistedDate(tool.updated_at, tool.created_at);

      return {
        url: `${siteUrl}/tool/${tool.slug}`,
        ...(persistedDate ? { lastModified: persistedDate } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const toolUrls = await getToolUrls();

  const categoryUrls = categories.map((category) => ({
    url: `${siteUrl}/category/${slugify(category)}`,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  return [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/submit`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/compare`,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    ...categoryUrls,
    ...toolUrls,
  ];
}
