import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { normalizeToolCategory } from "../../../lib/tool-categories";
import {
  categories,
  getLogoUrl,
  getReviewCount,
  getToolRating,
  slugify,
  toolSlug,
} from "../../data/tools";
import ToolDetailClient, { ToolPageData } from "./tool-detail-client";

export const revalidate = 300;

const siteUrl = "https://aifinder-eight.vercel.app";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ToolRow = {
  id?: number;
  name?: string | null;
  category?: string | null;
  description?: string | null;
  website?: string | null;
  pricing?: string | null;
  logo_url?: string | null;
  platforms?: string[] | null;
  featured?: boolean | null;
  best_for?: string | null;
  use_cases?: string[] | null;
  ios?: string | null;
  android?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function normalizeCategory(category: string | null | undefined) {
  return normalizeToolCategory(category);
}

function normalizePricing(pricing: string | null | undefined) {
  if (pricing === "Freemium") return "Free + Paid";

  return pricing || "Free + Paid";
}

function cleanText(value: string | null | undefined, fallback = "") {
  return (value || fallback).trim();
}

function toArray(value: unknown, fallback: string[] = []) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      )
    : fallback;
}

function trimDescription(value: string, maxLength = 155) {
  const cleanValue = value.replace(/\s+/g, " ").trim();

  if (cleanValue.length <= maxLength) return cleanValue;

  return `${cleanValue.slice(0, maxLength - 1).trim()}…`;
}

function buildToolData(row: ToolRow): ToolPageData | null {
  const name = cleanText(row.name);
  const website = cleanText(row.website);
  const description = cleanText(row.description);

  if (!name || !website || !description) {
    return null;
  }

  const category = normalizeCategory(row.category);
  const pricing = normalizePricing(row.pricing);
  const platforms = toArray(row.platforms, ["Web"]);
  const useCases = toArray(row.use_cases, [
    category,
    `${category} tools`,
    "AI productivity",
  ]);

  return {
    name,
    slug: toolSlug(name),
    category,
    description,
    website,
    pricing,
    logoUrl: cleanText(row.logo_url) || getLogoUrl(website),
    platforms,
    featured: Boolean(row.featured),
    bestFor: cleanText(row.best_for) || description,
    useCases,
    ios: cleanText(row.ios) || null,
    android: cleanText(row.android) || null,
    rating: getToolRating(name),
    reviewCount: getReviewCount(name),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || row.created_at || null,
  };
}

async function getTools() {
  const { data, error } = await supabaseAdmin
    .from("tools")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Tool detail page load error:", error.message);
    return [];
  }

  return ((data || []) as ToolRow[])
    .map(buildToolData)
    .filter((tool): tool is ToolPageData => Boolean(tool));
}

async function getToolPageData(slug: string) {
  const tools = await getTools();
  const decodedSlug = decodeURIComponent(slug);

  const tool = tools.find((item) => item.slug === decodedSlug);

  if (!tool) {
    return {
      tool: null,
      similarTools: [],
    };
  }

  const similarTools = tools
    .filter((item) => item.category === tool.category && item.slug !== tool.slug)
    .slice(0, 4);

  return {
    tool,
    similarTools,
  };
}

function getToolJsonLd(tool: ToolPageData) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    applicationCategory: `${tool.category} AI Tool`,
    operatingSystem: tool.platforms.join(", ") || "Web",
    url: tool.website,
    description: tool.description,
    image: tool.logoUrl,
    offers: {
      "@type": "Offer",
      price: tool.pricing.toLowerCase().includes("free") ? "0" : undefined,
      priceCurrency: tool.pricing.toLowerCase().includes("free")
        ? "USD"
        : undefined,
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: tool.rating,
      reviewCount: tool.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

function getBreadcrumbJsonLd(tool: ToolPageData) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "AiFinder",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: tool.category,
        item: `${siteUrl}/category/${slugify(tool.category)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: `${siteUrl}/tool/${tool.slug}`,
      },
    ],
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { tool } = await getToolPageData(slug);

  if (!tool) {
    return {
      title: "AI Tool Not Found",
      description: "This AI tool could not be found on AiFinder.",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const title = `${tool.name} AI Tool — Pricing, Features & Alternatives`;
  const description = trimDescription(
    `${tool.name} is a ${tool.category} tool. ${tool.description}`
  );

  return {
    title,
    description,
    alternates: {
      canonical: `/tool/${tool.slug}`,
    },
    openGraph: {
      type: "article",
      url: `${siteUrl}/tool/${tool.slug}`,
      siteName: "AiFinder",
      title,
      description,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${tool.name} on AiFinder`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-image"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const { tool, similarTools } = await getToolPageData(slug);

  if (!tool) {
    notFound();
  }

  const toolJsonLd = getToolJsonLd(tool);
  const breadcrumbJsonLd = getBreadcrumbJsonLd(tool);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(toolJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <ToolDetailClient tool={tool} similarTools={similarTools} />
    </>
  );
}
