import type { Metadata } from "next";
import {
  normalizePublicToolRow,
  type PublicToolRow,
} from "../../lib/public-tool-adapter";
import { supabaseAdmin } from "../../lib/supabase-admin";
import {
  getLogoUrl,
  getReviewCount,
  getToolRating,
  toolSlug,
} from "../data/tools";
import CompareClient, { ComparePageTool } from "./compare-client";

export const revalidate = 300;

const siteUrl = "https://aifinder-eight.vercel.app";

type ToolRow = PublicToolRow & {
  id?: number;
  logo_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function cleanText(value: string | null | undefined, fallback = "") {
  return (value || fallback).trim();
}

function buildToolData(row: ToolRow): ComparePageTool | null {
  const publicTool = normalizePublicToolRow(row);
  const name = cleanText(publicTool.name);
  const website = cleanText(publicTool.website);
  const description = cleanText(publicTool.description);

  if (!name || !website || !description) {
    return null;
  }

  const category = publicTool.category;
  const useCases =
    publicTool.useCases.length > 0
      ? publicTool.useCases
      : [category, `${category} tools`];

  return {
    name,
    slug: toolSlug(name),
    category,
    description,
    website,
    pricing: publicTool.pricing,
    logoUrl: cleanText(row.logo_url) || getLogoUrl(website),
    platforms: publicTool.platforms,
    featured: Boolean(publicTool.featured),
    bestFor: cleanText(publicTool.bestFor) || description,
    useCases,
    rating: getToolRating(name),
    reviewCount: getReviewCount(name),
    ios: cleanText(publicTool.ios) || null,
    android: cleanText(publicTool.android) || null,
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
    console.error("Compare page tools load error:", error.message);
    return [];
  }

  return ((data || []) as ToolRow[])
    .map(buildToolData)
    .filter((tool): tool is ComparePageTool => Boolean(tool));
}

const title = "Compare AI Tools — Side-by-Side AI Tool Comparison";
const description =
  "Compare AI tools side-by-side by category, pricing, platforms, ratings, use cases, and best-fit workflows on AiFinder.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/compare",
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/compare`,
    siteName: "AiFinder",
    title,
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Compare AI Tools on AiFinder",
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

function getCompareJsonLd(tools: ComparePageTool[]) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Compare AI Tools",
    url: `${siteUrl}/compare`,
    description,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: tools.length,
      itemListElement: tools.slice(0, 20).map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/tool/${tool.slug}`,
        name: tool.name,
        description: tool.description,
      })),
    },
  };
}

export default async function ComparePage() {
  const tools = await getTools();
  const compareJsonLd = getCompareJsonLd(tools);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(compareJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <CompareClient tools={tools} />
    </>
  );
}
