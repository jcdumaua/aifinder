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
import CategoryDetailClient, {
  CategoryPageTool,
} from "./category-detail-client";

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

const categoryDescriptions: Record<string, string> = {
  Chatbots:
    "Discover AI chatbot tools for research, customer support, brainstorming, productivity, and everyday questions.",
  "Image AI":
    "Explore AI image tools for generating visuals, editing images, designing graphics, and creating marketing assets.",
  "Video AI":
    "Browse AI video tools for editing, captions, avatars, presentations, short-form content, and video production.",
  "Voice AI":
    "Discover voice AI tools for text-to-speech, transcription, audio editing, dubbing, and voice generation.",
  Coding:
    "Compare AI coding tools for app building, debugging, documentation, code generation, and developer productivity.",
  Business:
    "Browse AI business tools for operations, workflows, analytics, automation, customer support, and team productivity.",
  Productivity:
    "Find AI productivity tools that help with focus, planning, automation, task management, and daily work.",
  "Education AI":
    "Explore education AI tools for studying, tutoring, lesson planning, research, and skill building.",
  "Marketing AI":
    "Discover marketing AI tools for campaigns, content planning, social media, copywriting, and customer insights.",
  "SEO AI":
    "Find SEO AI tools for keyword research, content optimization, search analysis, and website growth.",
  "Design AI":
    "Browse design AI tools for branding, layouts, graphics, presentations, prototypes, and creative workflows.",
  "AI Agents":
    "Explore AI agents that can handle multi-step tasks, automate workflows, research topics, and connect apps.",
};

function normalizeCategory(category: string | null | undefined) {
  return normalizeToolCategory(category);
}

function normalizePricing(pricing: string | null | undefined) {
  if (pricing === "Free" || pricing === "Paid" || pricing === "Free + Paid") {
    return pricing;
  }

  if (pricing === "Freemium") return "Free + Paid";

  return "Free + Paid";
}

function cleanText(value: string | null | undefined, fallback = "") {
  return (value || fallback).trim();
}

function toArray(value: unknown, fallback: string[] = []) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0
      )
    : fallback;
}

function trimDescription(value: string, maxLength = 155) {
  const cleanValue = value.replace(/\s+/g, " ").trim();

  if (cleanValue.length <= maxLength) return cleanValue;

  return `${cleanValue.slice(0, maxLength - 1).trim()}…`;
}

function getCategoryFromSlug(slug: string) {
  const decodedSlug = decodeURIComponent(slug);

  return categories.find((category) => slugify(category) === decodedSlug) || null;
}

function getCategoryDescription(category: string) {
  return (
    categoryDescriptions[category] ||
    `Browse the best ${category} tools on AiFinder. Search, compare, and discover useful AI software by category, pricing, platform, and use case.`
  );
}

function buildToolData(row: ToolRow): CategoryPageTool | null {
  const name = cleanText(row.name);
  const website = cleanText(row.website);
  const description = cleanText(row.description);

  if (!name || !website || !description) {
    return null;
  }

  const category = normalizeCategory(row.category);

  return {
    name,
    slug: toolSlug(name),
    category,
    description,
    website,
    pricing: normalizePricing(row.pricing),
    logoUrl: cleanText(row.logo_url) || getLogoUrl(website),
    platforms: toArray(row.platforms, ["Web"]),
    featured: Boolean(row.featured),
    bestFor: cleanText(row.best_for) || description,
    useCases: toArray(row.use_cases, [category, `${category} tools`]),
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
    console.error("Category page tools load error:", error.message);
    return [];
  }

  return ((data || []) as ToolRow[])
    .map(buildToolData)
    .filter((tool): tool is CategoryPageTool => Boolean(tool));
}

async function getCategoryPageData(slug: string) {
  const category = getCategoryFromSlug(slug);

  if (!category) {
    return {
      category: null,
      categoryTools: [],
      featuredTools: [],
      relatedCategories: [],
    };
  }

  const tools = await getTools();
  const categoryTools = tools.filter((tool) => tool.category === category);
  const featuredTools = categoryTools
    .filter((tool) => tool.featured)
    .slice(0, 6);

  const relatedCategories = categories
    .filter((item) => item !== category)
    .slice(0, 6)
    .map((item) => ({
      name: item,
      slug: slugify(item),
      description: getCategoryDescription(item),
      count: tools.filter((tool) => tool.category === item).length,
    }));

  return {
    category,
    categoryTools,
    featuredTools,
    relatedCategories,
  };
}

function getCategoryJsonLd({
  category,
  categoryTools,
}: {
  category: string;
  categoryTools: CategoryPageTool[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category} AI Tools`,
    url: `${siteUrl}/category/${slugify(category)}`,
    description: getCategoryDescription(category),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: categoryTools.length,
      itemListElement: categoryTools.slice(0, 20).map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/tool/${tool.slug}`,
        name: tool.name,
        description: tool.description,
      })),
    },
  };
}

function getBreadcrumbJsonLd(category: string) {
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
        name: `${category} AI Tools`,
        item: `${siteUrl}/category/${slugify(category)}`,
      },
    ],
  };
}

export async function generateStaticParams() {
  return categories.map((category) => ({
    slug: slugify(category),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryFromSlug(slug);

  if (!category) {
    return {
      title: "AI Category Not Found",
      description: "This AI tools category could not be found on AiFinder.",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const title = `${category} AI Tools — Search, Compare & Discover`;
  const description = trimDescription(getCategoryDescription(category));

  return {
    title,
    description,
    alternates: {
      canonical: `/category/${slugify(category)}`,
    },
    openGraph: {
      type: "website",
      url: `${siteUrl}/category/${slugify(category)}`,
      siteName: "AiFinder",
      title,
      description,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${category} AI Tools on AiFinder`,
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

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const { category, categoryTools, featuredTools, relatedCategories } =
    await getCategoryPageData(slug);

  if (!category) {
    notFound();
  }

  const categoryJsonLd = getCategoryJsonLd({
    category,
    categoryTools,
  });
  const breadcrumbJsonLd = getBreadcrumbJsonLd(category);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(categoryJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <CategoryDetailClient
        category={category}
        description={getCategoryDescription(category)}
        tools={categoryTools}
        featuredTools={featuredTools}
        relatedCategories={relatedCategories}
      />
    </>
  );
}
