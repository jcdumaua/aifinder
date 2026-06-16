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

function cleanText(value: string | null | undefined, fallback = "") {
  return (value || fallback).trim();
}

function buildToolData(row: PublicToolRow): ComparePageTool | null {
  const publicTool = normalizePublicToolRow(row, {
    logoFallback: getLogoUrl,
    useCasesFallback: (category) => [category, `${category} tools`],
  });
  const name = cleanText(publicTool.name);
  const website = cleanText(publicTool.website);
  const description = cleanText(publicTool.description);

  if (!name || !website || !description) {
    return null;
  }

  const category = publicTool.category;

  return {
    ...publicTool,
    name,
    slug: toolSlug(name),
    category,
    description,
    website,
    logoUrl: cleanText(publicTool.logoUrl) || getLogoUrl(website),
    featured: Boolean(publicTool.featured),
    bestFor: cleanText(publicTool.bestFor) || description,
    rating: getToolRating(name),
    reviewCount: getReviewCount(name),
    ios: cleanText(publicTool.ios) || null,
    android: cleanText(publicTool.android) || null,
    createdAt: publicTool.createdAt || null,
    updatedAt: publicTool.updatedAt || null,
  };
}

async function getTools() {
  const { data, error } = await supabaseAdmin
    .from("public_safe_tools")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Compare page tools load error:", error.message);
    return [];
  }

  return ((data || []) as PublicToolRow[])
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
