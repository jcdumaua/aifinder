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

export type HomepageControlConfig = {
  status: HomepagePublishStatus;
  layoutPreset: HomepageLayoutPreset;
  densityPreset: HomepageDensityPreset;
  visibleSections: HomepageSectionId[];
  sectionOrder: HomepageSectionId[];
};

export const DEFAULT_HOMEPAGE_CONTROL_CONFIG: HomepageControlConfig = {
  status: "draft",
  layoutPreset: "clean",
  densityPreset: "comfortable",
  visibleSections: [...HOMEPAGE_SECTION_IDS],
  sectionOrder: [...HOMEPAGE_SECTION_IDS],
};

export function isHomepageSectionId(value: string): value is HomepageSectionId {
  return (HOMEPAGE_SECTION_IDS as readonly string[]).includes(value);
}

export function isHomepageLayoutPreset(
  value: string
): value is HomepageLayoutPreset {
  return (HOMEPAGE_LAYOUT_PRESETS as readonly string[]).includes(value);
}

export function isHomepageDensityPreset(
  value: string
): value is HomepageDensityPreset {
  return (HOMEPAGE_DENSITY_PRESETS as readonly string[]).includes(value);
}

export function isHomepagePublishStatus(
  value: string
): value is HomepagePublishStatus {
  return (HOMEPAGE_PUBLISH_STATUSES as readonly string[]).includes(value);
}

function hasDuplicateValues(values: readonly string[]) {
  return new Set(values).size !== values.length;
}

export function validateHomepageControlConfig(
  config: HomepageControlConfig
): string[] {
  const errors: string[] = [];

  if (!isHomepagePublishStatus(config.status)) {
    errors.push("Publish status is not allowed.");
  }

  if (!isHomepageLayoutPreset(config.layoutPreset)) {
    errors.push("Layout preset is not allowed.");
  }

  if (!isHomepageDensityPreset(config.densityPreset)) {
    errors.push("Density preset is not allowed.");
  }

  if (!config.visibleSections.every(isHomepageSectionId)) {
    errors.push("Visible sections include an unknown section.");
  }

  if (!config.sectionOrder.every(isHomepageSectionId)) {
    errors.push("Section order includes an unknown section.");
  }

  if (hasDuplicateValues(config.visibleSections)) {
    errors.push("Visible sections include duplicates.");
  }

  if (hasDuplicateValues(config.sectionOrder)) {
    errors.push("Section order includes duplicates.");
  }

  return errors;
}
