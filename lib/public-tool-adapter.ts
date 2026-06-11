import type { PublicToolCardData } from "../components/public/tool-card";
import type { Tool } from "../app/data/tools";
import { normalizeToolCategory } from "./tool-categories";

export type PublicToolRow = {
  id?: number | null;
  slug?: string | null;
  name?: string | null;
  category?: string | null;
  description?: string | null;
  website?: string | null;
  logo_url?: string | null;
  pricing?: string | null;
  platforms?: unknown;
  featured?: boolean | null;
  best_for?: string | null;
  use_cases?: unknown;
  ios?: string | null;
  android?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PublicTool = Tool & {
  id?: number;
  slug?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type NormalizePublicToolRowOptions = {
  logoFallback?: (website: string) => string;
  useCasesFallback?: (category: Tool["category"]) => string[];
};

type PublicToolCardSource = Omit<
  PublicTool,
  "android" | "ios" | "logoUrl" | "slug"
> & {
  slug?: string | null;
  logoUrl?: string | null;
  rating?: PublicToolCardData["rating"];
  reviewCount?: number;
  fallbackIcon?: string;
  ios?: string | null;
  android?: string | null;
};

type PublicToolCardDataOptions = {
  slugFallback?: (name: string) => string;
  logoFallback?: (website: string) => string;
  ratingFallback?: (name: string) => PublicToolCardData["rating"];
  reviewCountFallback?: (name: string) => number;
  fallbackIcon?: (category: Tool["category"]) => string;
};

export function normalizePublicToolPricing(
  pricing: string | null | undefined,
): Tool["pricing"] {
  if (pricing === "Free" || pricing === "Paid" || pricing === "Free + Paid") {
    return pricing;
  }

  if (pricing === "Freemium") return "Free + Paid";

  return "Free + Paid";
}

function toStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;

  return value.filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
}

function toOptionalString(value: string | null | undefined) {
  return value || undefined;
}

export function normalizePublicToolRow(
  row: PublicToolRow,
  options: NormalizePublicToolRowOptions = {},
): PublicTool {
  const description = row.description || "";
  const website = row.website || "";
  const category = normalizeToolCategory(row.category);
  const logoUrl = options.logoFallback
    ? toOptionalString(row.logo_url) || options.logoFallback(website)
    : undefined;
  const useCases = toStringArray(
    row.use_cases,
    options.useCasesFallback?.(category),
  );

  return {
    id: row.id || undefined,
    slug: row.slug || undefined,
    name: row.name || "",
    category,
    description,
    website,
    logoUrl,
    pricing: normalizePublicToolPricing(row.pricing),
    platforms: toStringArray(row.platforms, ["Web"]),
    featured: row.featured || false,
    bestFor: row.best_for || description,
    useCases,
    ios: toOptionalString(row.ios),
    android: toOptionalString(row.android),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || row.created_at || null,
  };
}

export function toPublicToolCardData(
  tool: PublicToolCardSource,
  options: PublicToolCardDataOptions = {},
): PublicToolCardData {
  const explicitSlug =
    typeof tool.slug === "string" ? tool.slug.trim() : "";
  const slug = explicitSlug || options.slugFallback?.(tool.name) || "";
  const logoUrl = tool.logoUrl || options.logoFallback?.(tool.website) || "";

  return {
    name: tool.name,
    slug,
    category: tool.category,
    description: tool.description,
    website: tool.website,
    logoUrl,
    pricing: tool.pricing,
    platforms: tool.platforms,
    rating: tool.rating ?? options.ratingFallback?.(tool.name) ?? 0,
    reviewCount:
      tool.reviewCount ?? options.reviewCountFallback?.(tool.name) ?? 0,
    bestFor: tool.bestFor,
    useCases: tool.useCases,
    ios: tool.ios,
    android: tool.android,
    fallbackIcon: tool.fallbackIcon || options.fallbackIcon?.(tool.category),
  };
}
