import type { MetadataRoute } from "next";
import { logPublicDiagnosticEvent } from "@/lib/public-diagnostics";
import { supabaseAdmin } from "../lib/supabase-admin";
import { categories, slugify } from "./data/tools";
import { PUBLIC_CANONICAL_ORIGIN } from "../lib/public-canonical-origin";

export const dynamic = "force-dynamic";

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
    logPublicDiagnosticEvent("PUBLIC_SITEMAP_TOOLS_LOAD_FAILED");
    return [];
  }

  return ((data || []) as ToolSitemapRow[])
    .filter(hasCanonicalToolSlug)
    .map((tool) => {
      const persistedDate = getPersistedDate(tool.updated_at, tool.created_at);

      return {
        url: `${PUBLIC_CANONICAL_ORIGIN}/tool/${tool.slug}`,
        ...(persistedDate ? { lastModified: persistedDate } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const toolUrls = await getToolUrls();

  const categoryUrls = categories.map((category) => ({
    url: `${PUBLIC_CANONICAL_ORIGIN}/category/${slugify(category)}`,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  return [
    {
      url: PUBLIC_CANONICAL_ORIGIN,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${PUBLIC_CANONICAL_ORIGIN}/submit`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${PUBLIC_CANONICAL_ORIGIN}/compare`,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    ...categoryUrls,
    ...toolUrls,
  ];
}
