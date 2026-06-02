export const TOOL_CATEGORIES = [
  "Chatbots",
  "Image AI",
  "Video AI",
  "Voice AI",
  "Writing",
  "Coding",
  "Business",
  "Productivity",
  "Education AI",
  "Marketing AI",
  "SEO AI",
  "Design AI",
  "AI Agents",
] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

const LEGACY_CATEGORY_MAP: Record<string, ToolCategory> = {
  Audio: "Voice AI",
  Automation: "AI Agents",
  Chat: "Chatbots",
  Image: "Image AI",
  "Music AI": "Voice AI",
  Research: "Education AI",
  Video: "Video AI",
  "Website Builders": "Design AI",
};

export function isToolCategory(category: string): category is ToolCategory {
  return TOOL_CATEGORIES.some((item) => item === category);
}

export function normalizeToolCategory(
  category: string | null | undefined,
  fallback: ToolCategory = "Productivity",
): ToolCategory {
  if (!category) return fallback;
  if (isToolCategory(category)) return category;

  return LEGACY_CATEGORY_MAP[category] ?? fallback;
}
