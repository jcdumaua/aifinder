import type { Tool } from "../app/data/tools";
import { normalizeToolCategory } from "./tool-categories";

export type PublicToolRow = {
  name?: string | null;
  category?: string | null;
  description?: string | null;
  website?: string | null;
  pricing?: string | null;
  platforms?: unknown;
  featured?: boolean | null;
  best_for?: string | null;
  use_cases?: unknown;
  ios?: string | null;
  android?: string | null;
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

export function normalizePublicToolRow(row: PublicToolRow): Tool {
  const description = row.description || "";

  return {
    name: row.name || "",
    category: normalizeToolCategory(row.category),
    description,
    website: row.website || "",
    pricing: normalizePublicToolPricing(row.pricing),
    platforms: toStringArray(row.platforms, ["Web"]),
    featured: row.featured || false,
    bestFor: row.best_for || description,
    useCases: toStringArray(row.use_cases),
    ios: toOptionalString(row.ios),
    android: toOptionalString(row.android),
  };
}
