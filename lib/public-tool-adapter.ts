import type { Tool } from "../app/data/tools";
import { normalizeToolCategory } from "./tool-categories";

export type PublicToolRow = {
  id?: number | null;
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
  createdAt?: string | null;
  updatedAt?: string | null;
};

type NormalizePublicToolRowOptions = {
  logoFallback?: (website: string) => string;
  useCasesFallback?: (category: Tool["category"]) => string[];
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
