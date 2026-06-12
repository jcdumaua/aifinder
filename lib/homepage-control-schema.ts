export const HOMEPAGE_SECTION_IDS = [
  "hero",
  "starter-search",
  "recent-searches",
  "saved-tools",
  "top-picks",
  "trending",
  "recently-added",
  "categories",
  "seo-section",
  "how-it-works",
  "faq",
] as const;

export type HomepageSectionId = (typeof HOMEPAGE_SECTION_IDS)[number];

export const HOMEPAGE_LAYOUT_PRESETS = [
  "clean",
  "premium",
  "compact",
  "spacious",
  "search-first",
] as const;

export type HomepageLayoutPreset = (typeof HOMEPAGE_LAYOUT_PRESETS)[number];

export const HOMEPAGE_DENSITY_PRESETS = [
  "compact",
  "comfortable",
  "spacious",
] as const;

export type HomepageDensityPreset = (typeof HOMEPAGE_DENSITY_PRESETS)[number];

export const HOMEPAGE_PUBLISH_STATUSES = [
  "draft",
  "preview",
  "published",
] as const;

export type HomepagePublishStatus = (typeof HOMEPAGE_PUBLISH_STATUSES)[number];
