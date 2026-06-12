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

export type HomepageLayoutPresetDetail = {
  id: HomepageLayoutPreset;
  label: string;
  description: string;
};

export const HOMEPAGE_LAYOUT_PRESET_DETAILS: HomepageLayoutPresetDetail[] = [
  {
    id: "clean",
    label: "Clean",
    description: "Balanced default layout for clear discovery.",
  },
  {
    id: "premium",
    label: "Premium",
    description: "More polished visual emphasis while staying controlled.",
  },
  {
    id: "compact",
    label: "Compact",
    description: "Tighter layout for denser homepage content.",
  },
  {
    id: "spacious",
    label: "Spacious",
    description: "More breathing room between homepage sections.",
  },
  {
    id: "search-first",
    label: "Search First",
    description: "Prioritizes the discovery and search experience.",
  },
];

export type HomepageDensityPresetDetail = {
  id: HomepageDensityPreset;
  label: string;
  description: string;
};

export const HOMEPAGE_DENSITY_PRESET_DETAILS: HomepageDensityPresetDetail[] = [
  {
    id: "compact",
    label: "Compact",
    description: "Smaller spacing for denser sections.",
  },
  {
    id: "comfortable",
    label: "Comfortable",
    description: "Balanced default density for most homepage layouts.",
  },
  {
    id: "spacious",
    label: "Spacious",
    description: "More breathing room for a calmer page rhythm.",
  },
];

export const HOMEPAGE_PUBLISH_STATUSES = [
  "draft",
  "preview",
  "published",
] as const;

export type HomepagePublishStatus = (typeof HOMEPAGE_PUBLISH_STATUSES)[number];

export const HOMEPAGE_CONTROL_STATUS_TRANSITIONS: Record<
  HomepagePublishStatus,
  HomepagePublishStatus[]
> = {
  draft: ["preview"],
  preview: ["draft", "published"],
  published: ["draft", "preview"],
};

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

export function canTransitionHomepageControlStatus(
  from: HomepagePublishStatus,
  to: HomepagePublishStatus
) {
  return HOMEPAGE_CONTROL_STATUS_TRANSITIONS[from].includes(to);
}

export function validateHomepageControlStatusTransition(
  from: string,
  to: string
): string[] {
  const errors: string[] = [];
  const fromStatus = isHomepagePublishStatus(from) ? from : null;
  const toStatus = isHomepagePublishStatus(to) ? to : null;

  if (!fromStatus) {
    errors.push("Current publish status is not allowed.");
  }

  if (!toStatus) {
    errors.push("Next publish status is not allowed.");
  }

  if (!fromStatus || !toStatus) {
    return errors;
  }

  if (!canTransitionHomepageControlStatus(fromStatus, toStatus)) {
    errors.push("Homepage control status transition is not allowed.");
  }

  return errors;
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

export type HomepageContentConfig = {
  heroTitle: string;
  heroSubtitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  starterSearchHeading: string;
  featuredToolsHeading: string;
};

export const DEFAULT_HOMEPAGE_CONTENT_CONFIG: HomepageContentConfig = {
  heroTitle: "Find the right AI tools faster",
  heroSubtitle:
    "Search, compare, and save curated AI tools for your next workflow.",
  primaryCtaLabel: "Explore tools",
  secondaryCtaLabel: "Compare tools",
  starterSearchHeading: "Start with a popular AI search",
  featuredToolsHeading: "Featured AI tools",
};

const HOMEPAGE_CONTENT_MAX_LENGTHS: Record<keyof HomepageContentConfig, number> =
  {
    heroTitle: 80,
    heroSubtitle: 180,
    primaryCtaLabel: 32,
    secondaryCtaLabel: 32,
    starterSearchHeading: 72,
    featuredToolsHeading: 72,
  };

function containsRawHtml(value: string) {
  return /<[^>]+>/.test(value);
}

function containsScriptLikeContent(value: string) {
  return /script|javascript:|onerror\s*=|onload\s*=/i.test(value);
}

export function validateHomepageContentConfig(
  config: HomepageContentConfig
): string[] {
  const errors: string[] = [];

  (Object.keys(HOMEPAGE_CONTENT_MAX_LENGTHS) as Array<
    keyof HomepageContentConfig
  >).forEach((field) => {
    const value = config[field].trim();
    const maxLength = HOMEPAGE_CONTENT_MAX_LENGTHS[field];

    if (!value) {
      errors.push(`${field} is required.`);
    }

    if (value.length > maxLength) {
      errors.push(`${field} must be ${maxLength} characters or fewer.`);
    }

    if (containsRawHtml(value)) {
      errors.push(`${field} cannot include raw HTML.`);
    }

    if (containsScriptLikeContent(value)) {
      errors.push(`${field} cannot include script-like content.`);
    }
  });

  return errors;
}

export const HOMEPAGE_TOOL_PLACEMENT_IDS = [
  "featured-tools",
  "editors-picks",
  "trending-override",
  "new-tools-highlight",
] as const;

export type HomepageToolPlacementId =
  (typeof HOMEPAGE_TOOL_PLACEMENT_IDS)[number];

export const HOMEPAGE_TOOL_PLACEMENT_MAX_ITEMS = [3, 6, 12] as const;

export type HomepageToolPlacementMaxItems =
  (typeof HOMEPAGE_TOOL_PLACEMENT_MAX_ITEMS)[number];

export type HomepageToolPlacementConfig = {
  placementId: HomepageToolPlacementId;
  enabled: boolean;
  title: string;
  toolSlugs: string[];
  maxItems: HomepageToolPlacementMaxItems;
};

export const DEFAULT_HOMEPAGE_TOOL_PLACEMENTS: HomepageToolPlacementConfig[] = [
  {
    placementId: "featured-tools",
    enabled: false,
    title: "Featured AI tools",
    toolSlugs: [],
    maxItems: 6,
  },
  {
    placementId: "editors-picks",
    enabled: false,
    title: "Editor's picks",
    toolSlugs: [],
    maxItems: 6,
  },
  {
    placementId: "trending-override",
    enabled: false,
    title: "Trending tools",
    toolSlugs: [],
    maxItems: 6,
  },
  {
    placementId: "new-tools-highlight",
    enabled: false,
    title: "New tools to try",
    toolSlugs: [],
    maxItems: 6,
  },
];

export function isHomepageToolPlacementId(
  value: string
): value is HomepageToolPlacementId {
  return (HOMEPAGE_TOOL_PLACEMENT_IDS as readonly string[]).includes(value);
}

function isHomepageToolPlacementMaxItems(
  value: number
): value is HomepageToolPlacementMaxItems {
  return (HOMEPAGE_TOOL_PLACEMENT_MAX_ITEMS as readonly number[]).includes(
    value
  );
}

export function validateHomepageToolPlacementConfig(
  config: HomepageToolPlacementConfig
): string[] {
  const errors: string[] = [];
  const title = config.title.trim();

  if (!isHomepageToolPlacementId(config.placementId)) {
    errors.push("Tool placement ID is not allowed.");
  }

  if (!title) {
    errors.push("Tool placement title is required.");
  }

  if (title.length > 72) {
    errors.push("Tool placement title must be 72 characters or fewer.");
  }

  if (containsRawHtml(title)) {
    errors.push("Tool placement title cannot include raw HTML.");
  }

  if (containsScriptLikeContent(title)) {
    errors.push("Tool placement title cannot include script-like content.");
  }

  if (!isHomepageToolPlacementMaxItems(config.maxItems)) {
    errors.push("Tool placement maxItems is not allowed.");
  }

  if (!Array.isArray(config.toolSlugs)) {
    errors.push("Tool placement slugs must be an array.");
  } else {
    if (config.toolSlugs.some((slug) => typeof slug !== "string" || !slug.trim())) {
      errors.push("Tool placement slugs must be non-empty strings.");
    }

    if (config.toolSlugs.some(containsRawHtml)) {
      errors.push("Tool placement slugs cannot include raw HTML.");
    }

    if (config.toolSlugs.some(containsScriptLikeContent)) {
      errors.push("Tool placement slugs cannot include script-like content.");
    }

    if (hasDuplicateValues(config.toolSlugs)) {
      errors.push("Tool placement slugs include duplicates.");
    }

    if (config.toolSlugs.length > config.maxItems) {
      errors.push("Tool placement slugs exceed maxItems.");
    }
  }

  return errors;
}

export const HOMEPAGE_CONTROL_AUDIT_ACTIONS = [
  "created-draft",
  "updated-draft",
  "previewed",
  "published",
  "reverted",
  "validation-failed",
] as const;

export type HomepageControlAuditAction =
  (typeof HOMEPAGE_CONTROL_AUDIT_ACTIONS)[number];

export type HomepageControlAuditEvent = {
  action: HomepageControlAuditAction;
  message: string;
  createdAt: string;
  actorLabel: string;
  validationErrors?: string[];
};

export function isHomepageControlAuditAction(
  value: string
): value is HomepageControlAuditAction {
  return (HOMEPAGE_CONTROL_AUDIT_ACTIONS as readonly string[]).includes(value);
}

export function validateHomepageControlAuditEvent(
  event: HomepageControlAuditEvent
): string[] {
  const errors: string[] = [];

  if (!isHomepageControlAuditAction(event.action)) {
    errors.push("Audit action is not allowed.");
  }

  if (!event.message.trim()) {
    errors.push("Audit message is required.");
  }

  if (!event.createdAt.trim()) {
    errors.push("Audit createdAt is required.");
  }

  if (!event.actorLabel.trim()) {
    errors.push("Audit actorLabel is required.");
  }

  if (
    event.validationErrors !== undefined &&
    !Array.isArray(event.validationErrors)
  ) {
    errors.push("Audit validationErrors must be an array.");
  }

  if (
    Array.isArray(event.validationErrors) &&
    event.validationErrors.some((error) => typeof error !== "string")
  ) {
    errors.push("Audit validationErrors must contain strings only.");
  }

  return errors;
}

export const HOMEPAGE_PRE_PUBLISH_CHECK_IDS = [
  "content-valid",
  "layout-valid",
  "tool-placements-valid",
  "workflow-valid",
  "audit-event-ready",
  "desktop-qa-complete",
  "tablet-qa-complete",
  "mobile-qa-complete",
  "accessibility-qa-complete",
] as const;

export type HomepagePrePublishCheckId =
  (typeof HOMEPAGE_PRE_PUBLISH_CHECK_IDS)[number];

export type HomepagePrePublishChecklistItem = {
  id: HomepagePrePublishCheckId;
  label: string;
  required: boolean;
  description: string;
};

export const HOMEPAGE_PRE_PUBLISH_CHECKLIST: HomepagePrePublishChecklistItem[] =
  [
    {
      id: "content-valid",
      label: "Content valid",
      required: true,
      description: "Homepage content passes length and safety validation.",
    },
    {
      id: "layout-valid",
      label: "Layout valid",
      required: true,
      description: "Section visibility, ordering, and presets are allowed.",
    },
    {
      id: "tool-placements-valid",
      label: "Tool placements valid",
      required: true,
      description: "Featured tool placements use safe IDs and limits.",
    },
    {
      id: "workflow-valid",
      label: "Workflow valid",
      required: true,
      description: "Publish status transition is allowed.",
    },
    {
      id: "audit-event-ready",
      label: "Audit event ready",
      required: true,
      description: "Publish action can create a safe audit trail event.",
    },
    {
      id: "desktop-qa-complete",
      label: "Desktop QA complete",
      required: true,
      description: "Desktop visual QA has been completed.",
    },
    {
      id: "tablet-qa-complete",
      label: "Tablet QA complete",
      required: true,
      description: "Tablet and iPad visual QA has been completed.",
    },
    {
      id: "mobile-qa-complete",
      label: "Mobile QA complete",
      required: true,
      description: "Mobile visual QA has been completed.",
    },
    {
      id: "accessibility-qa-complete",
      label: "Accessibility QA complete",
      required: true,
      description: "Readability, contrast, and accessibility checks are done.",
    },
  ];

export function isHomepagePrePublishCheckId(
  value: string
): value is HomepagePrePublishCheckId {
  return (HOMEPAGE_PRE_PUBLISH_CHECK_IDS as readonly string[]).includes(value);
}

export function validateHomepagePrePublishChecklist(
  checklist: HomepagePrePublishChecklistItem[]
): string[] {
  const errors: string[] = [];
  const checkIds = checklist.map((item) => item.id);

  if (!checklist.every((item) => isHomepagePrePublishCheckId(item.id))) {
    errors.push("Pre-publish checklist includes an unknown check ID.");
  }

  if (hasDuplicateValues(checkIds)) {
    errors.push("Pre-publish checklist includes duplicate check IDs.");
  }

  checklist.forEach((item) => {
    if (!item.label.trim()) {
      errors.push(`${item.id} label is required.`);
    }

    if (!item.description.trim()) {
      errors.push(`${item.id} description is required.`);
    }

    if (typeof item.required !== "boolean") {
      errors.push(`${item.id} required must be a boolean.`);
    }
  });

  return errors;
}

export type HomepageControlReadinessResult = {
  isReady: boolean;
  errors: string[];
  warnings: string[];
};

export function validateHomepageControlReadiness(): HomepageControlReadinessResult {
  const errors = [
    ...validateHomepageControlConfig(DEFAULT_HOMEPAGE_CONTROL_CONFIG),
    ...validateHomepageContentConfig(DEFAULT_HOMEPAGE_CONTENT_CONFIG),
    ...DEFAULT_HOMEPAGE_TOOL_PLACEMENTS.flatMap(
      validateHomepageToolPlacementConfig
    ),
    ...validateHomepagePrePublishChecklist(HOMEPAGE_PRE_PUBLISH_CHECKLIST),
  ];

  return {
    isReady: errors.length === 0,
    errors,
    warnings: [],
  };
}
