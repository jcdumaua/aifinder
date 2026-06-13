import type {
  HomepageControlChecklistItem,
  HomepageControlConfigRow,
} from "./homepage-control-types";

export const DEFAULT_HOMEPAGE_CONTROL_CHECKLIST: readonly HomepageControlChecklistItem[] =
  [
    {
      id: "hero-content-reviewed",
      label: "Hero content reviewed",
      description: "Confirm homepage hero text is clear and publish-ready.",
      required: true,
      completed: false,
    },
    {
      id: "tool-placements-reviewed",
      label: "Tool placements reviewed",
      description: "Confirm featured tool placements are curated and accurate.",
      required: true,
      completed: false,
    },
    {
      id: "featured-sections-reviewed",
      label: "Featured sections reviewed",
      description: "Confirm homepage sections are appropriate for publishing.",
      required: true,
      completed: false,
    },
    {
      id: "mobile-layout-reviewed",
      label: "Mobile layout reviewed",
      description: "Confirm mobile layout is readable and usable.",
      required: true,
      completed: false,
    },
    {
      id: "no-empty-required-content",
      label: "No empty required content",
      description: "Confirm required homepage content is not empty.",
      required: true,
      completed: false,
    },
    {
      id: "ready-for-publish",
      label: "Ready for publish",
      description: "Final confirmation before publishing homepage changes.",
      required: true,
      completed: false,
    },
  ];

export const DEFAULT_HOMEPAGE_CONTROL_CONFIG: Record<string, unknown> = {
  layoutPreset: "clean",
  densityPreset: "comfortable",
  sectionOrder: [],
  visibleSections: [],
};

export const DEFAULT_HOMEPAGE_CONTROL_CONTENT: Record<string, unknown> = {
  hero: {},
  featuredSections: {},
};

export const DEFAULT_HOMEPAGE_TOOL_PLACEMENTS: readonly unknown[] = [];

export type DefaultHomepageControlDraftValues = Pick<
  HomepageControlConfigRow,
  | "status"
  | "version"
  | "is_active"
  | "config"
  | "content"
  | "tool_placements"
  | "pre_publish_checklist"
  | "validation_errors"
  | "validation_warnings"
>;

export function createDefaultHomepageControlChecklist(): HomepageControlChecklistItem[] {
  return DEFAULT_HOMEPAGE_CONTROL_CHECKLIST.map((item) => ({ ...item }));
}

export function createDefaultHomepageControlDraftValues(): DefaultHomepageControlDraftValues {
  return {
    status: "draft",
    version: 1,
    is_active: false,
    config: {
      ...DEFAULT_HOMEPAGE_CONTROL_CONFIG,
      sectionOrder: [],
      visibleSections: [],
    },
    content: {
      ...DEFAULT_HOMEPAGE_CONTROL_CONTENT,
      hero: {},
      featuredSections: {},
    },
    tool_placements: [...DEFAULT_HOMEPAGE_TOOL_PLACEMENTS],
    pre_publish_checklist: createDefaultHomepageControlChecklist(),
    validation_errors: [],
    validation_warnings: [],
  };
}
