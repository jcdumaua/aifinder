import type { Tool } from "../app/data/tools";
import type { ToolCategory } from "./tool-categories";

type IntentGroup = {
  intent: string;
  triggers: string[];
  categories: ToolCategory[];
  terms: string[];
  excludedCategories?: ToolCategory[];
  strict?: boolean;
};

type IntentAlias = {
  aliases: string[];
  intents: string[];
  categories: ToolCategory[];
  terms: string[];
};

type SearchSuggestionGroup = {
  triggers: string[];
  suggestions: string[];
};

export type SearchIntent = {
  categories: Set<ToolCategory>;
  excludedCategories: Set<ToolCategory>;
  intents: Set<string>;
  normalizedQuery: string;
  strict: boolean;
  terms: Set<string>;
};

export type SearchableTool = Pick<
  Tool,
  | "bestFor"
  | "category"
  | "description"
  | "name"
  | "platforms"
  | "pricing"
  | "useCases"
>;

export type RankedTool<TSearchableTool extends SearchableTool = Tool> = {
  score: number;
  tool: TSearchableTool;
};

const minimumSearchScore = 28;
const videoQueryTerms = [
  "video",
  "editing",
  "reels",
  "tiktok",
  "youtube",
  "creator",
  "animation",
  "clips",
  "subtitles",
];

const stopWords = new Set([
  "a",
  "ai",
  "an",
  "and",
  "best",
  "can",
  "create",
  "find",
  "for",
  "get",
  "help",
  "how",
  "i",
  "in",
  "make",
  "me",
  "my",
  "need",
  "please",
  "that",
  "the",
  "to",
  "tool",
  "tools",
  "using",
  "want",
  "with",
]);

const intentGroups: IntentGroup[] = [
  {
    intent: "career-writing",
    strict: true,
    triggers: [
      "resume",
      "cv",
      "cover letter",
      "job application",
      "career",
      "interview",
    ],
    categories: ["Writing", "Productivity"],
    excludedCategories: [
      "Video AI",
      "Image AI",
      "Coding",
      "Voice AI",
      "Education AI",
    ],
    terms: [
      "resume",
      "cv",
      "cover letter",
      "job",
      "career",
      "interview",
      "writing",
      "copywriting",
      "document",
      "documents",
      "email",
    ],
  },
  {
    intent: "writing",
    triggers: [
      "write",
      "writing",
      "blog",
      "essay",
      "caption",
      "script",
      "story",
      "email",
      "grammar",
      "rewrite",
      "summarize",
      "content",
      "copywriting",
    ],
    categories: ["Writing", "Productivity"],
    terms: ["writing", "documents", "content", "copywriting", "summaries"],
  },
  {
    intent: "business",
    triggers: [
      "business",
      "startup",
      "sales",
      "customers",
      "invoice",
      "reports",
      "plan",
      "strategy",
      "operations",
      "workflow",
      "productivity",
      "small business",
    ],
    categories: ["Business", "Productivity", "AI Agents"],
    terms: ["business", "workflow", "analytics", "automation", "reports"],
  },
  {
    intent: "marketing",
    triggers: [
      "marketing",
      "ads",
      "social media",
      "instagram",
      "tiktok",
      "youtube",
      "brand",
      "campaign",
      "growth",
      "audience",
      "leads",
      "newsletter",
      "content creation",
    ],
    categories: [
      "Marketing AI",
      "Writing",
      "Image AI",
      "Video AI",
      "Productivity",
    ],
    terms: ["marketing", "ads", "social", "content", "campaigns", "brand"],
  },
  {
    intent: "design-image",
    triggers: [
      "logo",
      "image",
      "poster",
      "photo",
      "art",
      "design",
      "graphics",
      "thumbnail",
      "branding",
      "mockup",
      "picture",
    ],
    categories: ["Image AI", "Design AI"],
    terms: ["image", "logo", "design", "art", "visual", "creative"],
  },
  {
    intent: "video",
    triggers: [
      "video",
      "video editing",
      "edit video",
      "tiktok",
      "youtube",
      "youtube shorts",
      "reels",
      "animation",
      "clips",
      "subtitles",
      "creator",
    ],
    categories: ["Video AI", "Writing"],
    terms: ["video", "captions", "content", "social", "editing", "animation"],
  },
  {
    intent: "coding",
    triggers: [
      "code",
      "coding",
      "app",
      "website",
      "developer",
      "bug",
      "programming",
      "software",
      "build an app",
      "build software",
    ],
    categories: ["Coding", "Design AI", "AI Agents"],
    terms: ["coding", "developer", "app", "website", "debugging", "software"],
  },
  {
    intent: "education",
    triggers: [
      "school",
      "study",
      "homework",
      "tutor",
      "learn",
      "notes",
      "exam",
      "quiz",
      "student",
      "essay",
    ],
    categories: ["Education AI", "Writing", "Productivity"],
    terms: ["education", "study", "essay", "research", "summaries", "notes"],
  },
  {
    intent: "research",
    triggers: [
      "research",
      "sources",
      "web search",
      "answer questions",
      "fact finding",
      "compare information",
    ],
    categories: ["Education AI", "Chatbots", "Productivity"],
    terms: ["research", "sources", "summaries", "answers", "search", "analysis"],
  },
  {
    intent: "voice-audio",
    triggers: [
      "voice",
      "audio",
      "podcast",
      "speech",
      "voiceover",
      "text to speech",
      "music",
      "narration",
    ],
    categories: ["Voice AI"],
    terms: ["voice", "audio", "speech", "podcast", "voiceover", "music"],
  },
  {
    intent: "chatbot-support",
    triggers: [
      "chatbot",
      "assistant",
      "customer support",
      "answer customers",
      "live chat",
      "help desk",
      "support",
    ],
    categories: ["Chatbots", "Productivity"],
    terms: ["chatbot", "assistant", "support", "customer", "answers"],
  },
  {
    intent: "productivity",
    triggers: [
      "save time",
      "organize",
      "tasks",
      "notes",
      "calendar",
      "meetings",
      "email",
      "manage tasks",
    ],
    categories: ["Productivity", "AI Agents"],
    terms: ["productivity", "tasks", "notes", "workflow", "automation", "email"],
  },
  {
    intent: "automation-agents",
    triggers: [
      "agent",
      "automate",
      "automation",
      "workflow",
      "repetitive tasks",
      "connect apps",
      "business automation",
    ],
    categories: ["AI Agents", "Productivity"],
    terms: ["agents", "automation", "workflow", "tasks", "connect", "business"],
  },
  {
    intent: "seo",
    triggers: [
      "seo",
      "ranking",
      "keywords",
      "google traffic",
      "google search",
      "website traffic",
    ],
    categories: ["SEO AI", "Writing", "Marketing AI"],
    terms: ["seo", "keywords", "search", "website", "traffic", "blog"],
  },
];

// Keep aliases conservative: prefer common user phrases, avoid broad one-word
// aliases unless they signal clear intent, and do not turn this into a large
// synonym dictionary.
const intentAliases: IntentAlias[] = [
  {
    aliases: ["chat", "chatbot", "assistant"],
    intents: ["chatbot-support"],
    categories: ["Chatbots", "AI Agents", "Productivity"],
    terms: ["chatbot", "assistant", "support", "answers"],
  },
  {
    aliases: ["agent", "agents", "automation"],
    intents: ["automation-agents"],
    categories: ["AI Agents", "Productivity", "Business"],
    terms: ["agents", "automation", "workflow", "tasks"],
  },
  {
    aliases: ["ai art", "art generator", "photo generator"],
    intents: ["design-image"],
    categories: ["Image AI", "Design AI"],
    terms: ["image", "art", "photo", "design", "creative"],
  },
  {
    aliases: ["website builder", "site builder"],
    intents: ["business", "productivity"],
    categories: ["Design AI", "Business", "Productivity"],
    terms: ["website", "design", "business", "workflow"],
  },
  {
    aliases: ["code helper", "coding helper", "developer assistant"],
    intents: ["coding"],
    categories: ["Coding"],
    terms: ["code", "coding", "developer", "debugging"],
  },
  {
    aliases: ["voice generator", "audio generator", "speech generator"],
    intents: ["voice-audio"],
    categories: ["Voice AI"],
    terms: ["voice", "audio", "speech", "voiceover"],
  },
  {
    aliases: ["search ranking", "seo"],
    intents: ["seo"],
    categories: ["SEO AI", "Marketing AI"],
    terms: ["seo", "keywords", "ranking", "traffic"],
  },
];

const searchSuggestionGroups: SearchSuggestionGroup[] = [
  {
    triggers: [
      "ai art",
      "art",
      "art generator",
      "image",
      "photo",
      "photo generator",
    ],
    suggestions: ["ai art", "art generator", "photo generator"],
  },
  {
    triggers: ["assistant", "chat", "chatbot", "agent", "ai agents"],
    suggestions: ["assistant", "chatbot", "AI agents"],
  },
  {
    triggers: [
      "code",
      "code helper",
      "coding",
      "developer",
      "developer assistant",
    ],
    suggestions: ["code helper", "coding", "developer assistant"],
  },
  {
    triggers: [
      "voice",
      "voice generator",
      "audio",
      "audio generator",
      "speech",
      "speech generator",
    ],
    suggestions: ["voice generator", "audio generator", "speech generator"],
  },
  {
    triggers: ["seo", "search ranking", "marketing"],
    suggestions: ["seo", "search ranking", "marketing"],
  },
];

const starterSearchSuggestions = [
  "AI art",
  "Chatbot",
  "Code helper",
  "Voice generator",
  "SEO",
  "Website builder",
];

export function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizedPhraseIncludes(normalizedText: string, phrase: string) {
  const normalizedPhrase = normalizeSearchText(phrase);
  if (!normalizedText || !normalizedPhrase) return false;

  return ` ${normalizedText} `.includes(` ${normalizedPhrase} `);
}

export function normalizeIntentTerms(query: string): SearchIntent {
  const normalizedQuery = normalizeSearchText(query);
  const categories = new Set<ToolCategory>();
  const excludedCategories = new Set<ToolCategory>();
  const intents = new Set<string>();
  const terms = new Set<string>();
  const tokens = normalizedQuery
    .split(" ")
    .filter((token) => token.length > 2 && !stopWords.has(token));
  let strict = false;

  intentGroups.forEach((group) => {
    const matchesTrigger = group.triggers.some((trigger) =>
      normalizedPhraseIncludes(normalizedQuery, trigger)
    );

    if (!matchesTrigger) return;

    intents.add(group.intent);
    if (group.strict) strict = true;
    group.categories.forEach((category) => categories.add(category));
    group.excludedCategories?.forEach((category) =>
      excludedCategories.add(category),
    );
    group.terms.forEach((term) => terms.add(term));
  });

  intentAliases.forEach((aliasGroup) => {
    const matchesAlias = aliasGroup.aliases.some((alias) =>
      normalizedPhraseIncludes(normalizedQuery, alias)
    );

    if (!matchesAlias) return;

    aliasGroup.intents.forEach((intent) => intents.add(intent));
    aliasGroup.categories.forEach((category) => categories.add(category));
    aliasGroup.terms.forEach((term) => terms.add(term));
  });

  tokens.forEach((token) => terms.add(token));

  return {
    categories,
    excludedCategories,
    intents,
    normalizedQuery,
    strict,
    terms,
  };
}

export function getSearchSuggestionsForQuery(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const suggestions = searchSuggestionGroups.flatMap((group) => {
    const matchesGroup = group.triggers.some((trigger) =>
      normalizedPhraseIncludes(normalizedQuery, trigger)
    );

    return matchesGroup ? group.suggestions : [];
  });

  return Array.from(new Set(suggestions)).slice(0, 3);
}

export function getStarterSearchSuggestions() {
  return [...starterSearchSuggestions];
}

export function getToolSearchProfile(tool: SearchableTool) {
  const useCases = Array.isArray(tool.useCases) ? tool.useCases : [];
  const platforms = Array.isArray(tool.platforms) ? tool.platforms : [];
  const name = normalizeSearchText(tool.name);
  const category = normalizeSearchText(tool.category);
  const description = normalizeSearchText(tool.description);
  const bestFor = normalizeSearchText(tool.bestFor || "");
  const useCaseText = normalizeSearchText(useCases.join(" "));
  const pricing = normalizeSearchText(tool.pricing);
  const platformText = normalizeSearchText(platforms.join(" "));
  const allText = normalizeSearchText(
    `${tool.name} ${tool.category} ${tool.description} ${tool.pricing} ${tool.bestFor || ""} ${platforms.join(" ")} ${useCases.join(" ")}`
  );
  const inferredTerms = new Set<string>();

  intentGroups.forEach((group) => {
    const categoryMatch = group.categories.includes(tool.category);
    const metadataMatch = group.triggers.some((trigger) =>
      `${description} ${bestFor} ${useCaseText}`.includes(normalizeSearchText(trigger))
    );

    if (categoryMatch || metadataMatch) {
      group.terms.forEach((term) => inferredTerms.add(term));
    }
  });

  return {
    allText,
    bestFor,
    category,
    description,
    inferredTerms,
    name,
    platformText,
    pricing,
    useCaseText,
  };
}

function hasStrictIntentEvidence(
  profile: ReturnType<typeof getToolSearchProfile>,
  intent: SearchIntent,
) {
  const explicitTerms = Array.from(intent.terms).map(normalizeSearchText);
  return explicitTerms.some(
    (term) =>
      profile.name.includes(term) ||
      profile.category.includes(term) ||
      profile.description.includes(term) ||
      profile.bestFor.includes(term) ||
      profile.useCaseText.includes(term)
  );
}

function intentHasAnyTerm(intent: SearchIntent, terms: string[]) {
  return terms.some((term) => intent.terms.has(term));
}

export function scoreToolForQuery(tool: SearchableTool, query: string) {
  const intent = normalizeIntentTerms(query);
  if (!intent.normalizedQuery) return 1;

  const profile = getToolSearchProfile(tool);

  if (
    intent.strict &&
    intent.excludedCategories.has(tool.category) &&
    !hasStrictIntentEvidence(profile, intent)
  ) {
    return 0;
  }

  const hasDetectedIntent = intent.categories.size > 0;
  const categoryMatchesDetectedIntent = intent.categories.has(tool.category);
  const isVideoAllowed =
    intent.intents.has("video") ||
    intent.intents.has("marketing") ||
    intentHasAnyTerm(intent, videoQueryTerms);

  if (hasDetectedIntent && tool.category === "Video AI" && !isVideoAllowed) {
    return 0;
  }

  let score = 0;

  // Relevance weights: exact name/category matches dominate, strong intent
  // category matches come next, then descriptive/use-case evidence.
  if (profile.name === intent.normalizedQuery) score += 120;
  if (profile.name.includes(intent.normalizedQuery)) score += 70;
  if (profile.category === intent.normalizedQuery) score += 90;
  if (profile.category.includes(intent.normalizedQuery)) score += 45;
  if (profile.allText.includes(intent.normalizedQuery)) score += 30;

  if (intent.categories.has(tool.category)) score += intent.strict ? 45 : 35;

  intent.terms.forEach((term) => {
    const normalizedTerm = normalizeSearchText(term);
    if (!normalizedTerm) return;

    if (profile.name.includes(normalizedTerm)) score += 24;
    if (profile.category.includes(normalizedTerm)) score += 20;
    if (profile.useCaseText.includes(normalizedTerm)) score += 14;
    if (profile.bestFor.includes(normalizedTerm)) score += 12;
    if (profile.description.includes(normalizedTerm)) score += 9;
    if (profile.inferredTerms.has(normalizedTerm)) score += 5;
    if (profile.pricing.includes(normalizedTerm)) score += 1;
    if (profile.platformText.includes(normalizedTerm)) score += 1;
  });

  if (intent.excludedCategories.has(tool.category) && !hasStrictIntentEvidence(profile, intent)) {
    score -= 40;
  }

  // If the query clearly maps to one or more intent categories, unrelated
  // categories must prove themselves through direct metadata evidence.
  if (hasDetectedIntent && !categoryMatchesDetectedIntent) {
    score -= hasStrictIntentEvidence(profile, intent) ? 20 : 45;
  }

  return Math.max(0, score);
}

export function rankToolsForQuery<TSearchableTool extends SearchableTool>(
  tools: TSearchableTool[],
  query: string,
): RankedTool<TSearchableTool>[] {
  const intent = normalizeIntentTerms(query);

  return tools
    .map((tool, index) => ({
      index,
      score: scoreToolForQuery(tool, query),
      tool,
    }))
    .filter(({ score }) => !intent.normalizedQuery || score >= minimumSearchScore)
    .sort((a, b) => {
      if (!intent.normalizedQuery) return a.index - b.index;
      return b.score - a.score || a.index - b.index;
    })
    .map(({ score, tool }) => ({ score, tool }));
}

function getDirectSearchTokens(normalizedQuery: string) {
  return normalizedQuery
    .split(" ")
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function createDirectToolMatcher(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = getDirectSearchTokens(normalizedQuery);

  return (tool: SearchableTool) => {
    if (!normalizedQuery) return false;

    const profile = getToolSearchProfile(tool);
    const directFields = [
      profile.name,
      profile.description,
      profile.category,
      profile.pricing,
      profile.platformText,
      profile.useCaseText,
      profile.bestFor,
    ];

    if (directFields.some((field) => field.includes(normalizedQuery))) {
      return true;
    }

    return (
      tokens.length > 0 &&
      tokens.every((token) =>
        directFields.some((field) => field.includes(token)),
      )
    );
  };
}

export function toolDirectlyMatchesQuery(
  tool: SearchableTool,
  query: string,
) {
  return createDirectToolMatcher(query)(tool);
}

export function rankToolsForQueryWithDirectMatches<
  TSearchableTool extends SearchableTool,
>(
  tools: TSearchableTool[],
  query: string,
): RankedTool<TSearchableTool>[] {
  const rankedMatches = rankToolsForQuery(tools, query);
  const rankedTools = new Set(rankedMatches.map(({ tool }) => tool));
  const directlyMatchesQuery = createDirectToolMatcher(query);
  const fallbackMatches = tools
    .filter(
      (tool) => !rankedTools.has(tool) && directlyMatchesQuery(tool),
    )
    .map((tool) => ({
      score: scoreToolForQuery(tool, query),
      tool,
    }));

  return [...rankedMatches, ...fallbackMatches];
}

export function getBestMatchLabel(tool: Tool, query: string) {
  const intent = normalizeIntentTerms(query);
  if (!intent.normalizedQuery) return undefined;

  const score = scoreToolForQuery(tool, query);
  if (score < minimumSearchScore) return undefined;

  if (score >= 60) return "Best match";
  if (intent.intents.has("writing") || intent.intents.has("career-writing")) return "Great for writing";
  if (intent.intents.has("business")) return "Good for business";
  if (intent.intents.has("video")) return "Recommended for video";
  if (intent.intents.has("automation-agents")) return "Helpful for automation";
  if (intent.intents.has("coding")) return "Popular for coding";
  if (intent.intents.has("design-image")) return "Great for design";
  if (intent.intents.has("marketing")) return "Good for marketing";
  if (intent.intents.has("voice-audio")) return "Good for audio";
  if (intent.intents.has("research") || intent.intents.has("education")) return "Useful for research";

  return "Best match";
}

export function getSearchMatchExplanation(tool: Tool, query: string) {
  const intent = normalizeIntentTerms(query);
  if (!intent.normalizedQuery) return undefined;

  const score = scoreToolForQuery(tool, query);
  if (score < minimumSearchScore) return undefined;

  if (intent.intents.has("career-writing")) return "Matched career writing intent";
  if (intent.intents.has("writing")) return "Matched writing intent";
  if (intent.intents.has("business")) return "Good for business workflows";
  if (intent.intents.has("video")) return "Recommended for video creation";
  if (intent.intents.has("coding")) return "Matched coding assistant";
  if (intent.intents.has("automation-agents")) return "Useful for automation";
  if (intent.intents.has("productivity")) return "Useful for productivity";
  if (intent.intents.has("design-image")) return "Matched design intent";
  if (intent.intents.has("marketing")) return "Good for marketing tasks";
  if (intent.intents.has("chatbot-support")) return "Helpful for support workflows";
  if (intent.intents.has("voice-audio")) return "Matched audio intent";
  if (intent.intents.has("seo")) return "Matched SEO intent";
  if (intent.intents.has("education")) return "Useful for study tasks";
  if (intent.intents.has("research")) return "Useful for research";

  return "Matched your search intent";
}

export function getSearchConfidenceLabel(score: number) {
  if (score >= 70) return "Strong match";
  if (score >= 40) return "Good match";
  return "Related match";
}

export function getConversationalSearchResponse(query: string, resultCount: number) {
  const intent = normalizeIntentTerms(query);
  if (!intent.normalizedQuery) return undefined;

  if (resultCount === 0) {
    return "I could not find a strong match yet, but you can try a broader AI task or category.";
  }

  if (intent.intents.has("career-writing")) {
    return "Here are AI tools that can help with resumes, cover letters, and career documents.";
  }

  if (intent.intents.has("writing")) {
    return "Here are AI tools that can help with writing and document creation.";
  }

  if (intent.intents.has("business") || intent.intents.has("automation-agents")) {
    return "I found tools focused on business automation and productivity.";
  }

  if (intent.intents.has("video") || intent.intents.has("marketing")) {
    return "These tools are useful for video creation, marketing, and content workflows.";
  }

  if (intent.intents.has("coding")) {
    return "Here are coding-focused AI assistants and developer tools.";
  }

  if (intent.intents.has("design-image")) {
    return "I found visual AI tools for design, images, branding, and creative work.";
  }

  if (intent.intents.has("chatbot-support")) {
    return "These tools can help with chatbots, assistants, and customer support workflows.";
  }

  if (intent.intents.has("voice-audio")) {
    return "Here are AI tools for voice, audio, podcasting, and narration tasks.";
  }

  if (intent.intents.has("seo")) {
    return "I found tools that can help with SEO, keywords, and website growth.";
  }

  if (intent.intents.has("education") || intent.intents.has("research")) {
    return "These tools can help with learning, research, summaries, and answers.";
  }

  if (intent.intents.has("productivity")) {
    return "I found productivity-focused tools to help organize work and save time.";
  }

  return "I matched your request with the most relevant AI tools I could find.";
}
