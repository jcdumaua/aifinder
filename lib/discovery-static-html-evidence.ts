export type StaticHtmlEvidenceInput = {
  html: string;
  normalizedUrl: string;
  hostname: string;
  maxSnippetLength?: number;
  maxLinksPerType?: number;
};

export type StaticHtmlDerivedEvidenceResult = {
  extractionStatus: "derived" | "empty" | "failed_closed";
  extractionVersion: "1";
  title: string | null;
  metaDescription: string | null;
  openGraphTitle: string | null;
  openGraphDescription: string | null;
  canonicalUrl: string | null;
  homepageHeadlineSnippet: string | null;
  visibleTextSnippet: string | null;
  appStoreLinks: string[];
  pricingLinks: string[];
  contactLinks: string[];
  docsLinks: string[];
  productNameHint: string | null;
  companyNameHint: string | null;
  categoryHints: string[];
  aiToolRelevanceHints: string[];
  confidenceLabel: "tentative";
  truncated: boolean;
  safetyFlags: string[];
};

type TextResult = {
  value: string | null;
  truncated: boolean;
};

const DEFAULT_MAX_SNIPPET_LENGTH = 280;
const MAX_ALLOWED_SNIPPET_LENGTH = 1_000;
const DEFAULT_MAX_LINKS_PER_TYPE = 5;
const MAX_ALLOWED_LINKS_PER_TYPE = 10;
const EXTRACTION_VERSION = "1" as const;

const CATEGORY_HINTS: Array<[string, RegExp]> = [
  ["chat", /\bchat(?:bot|bots)?\b/i],
  ["image", /\bimage\b/i],
  ["video", /\bvideo\b/i],
  ["voice", /\bvoice\b/i],
  ["writing", /\bwriting\b/i],
  ["coding", /\bcoding\b/i],
  ["marketing", /\bmarketing\b/i],
  ["seo", /\bseo\b/i],
  ["design", /\bdesign\b/i],
  ["productivity", /\bproductivity\b/i],
  ["education", /\beducation\b/i],
  ["business", /\bbusiness\b/i],
  ["agents", /\bagents?\b/i],
];

const AI_RELEVANCE_HINTS: Array<[string, RegExp]> = [
  ["ai", /\bai\b/i],
  ["artificial_intelligence", /\bartificial intelligence\b/i],
  ["llm", /\bllms?\b/i],
  ["agent", /\bagents?\b/i],
  ["automation", /\bautomat(?:e|es|ed|ing|ion)\b/i],
  ["generate", /\bgenerat(?:e|es|ed|ing|ion)\b/i],
  ["copilot", /\bcopilot\b/i],
  ["chatbot", /\bchatbots?\b/i],
];

function emptyResult(safetyFlags: string[]): StaticHtmlDerivedEvidenceResult {
  return {
    extractionStatus: "empty",
    extractionVersion: EXTRACTION_VERSION,
    title: null,
    metaDescription: null,
    openGraphTitle: null,
    openGraphDescription: null,
    canonicalUrl: null,
    homepageHeadlineSnippet: null,
    visibleTextSnippet: null,
    appStoreLinks: [],
    pricingLinks: [],
    contactLinks: [],
    docsLinks: [],
    productNameHint: null,
    companyNameHint: null,
    categoryHints: [],
    aiToolRelevanceHints: [],
    confidenceLabel: "tentative",
    truncated: false,
    safetyFlags,
  };
}

function boundedPositiveInteger(value: number | undefined, fallback: number, maximum: number) {
  if (!Number.isInteger(value) || !value || value < 1) return fallback;

  return Math.min(value, maximum);
}

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, value) => {
      const normalizedValue = value.toLowerCase();

      if (normalizedValue in namedEntities) return namedEntities[normalizedValue];

      const codePoint = normalizedValue.startsWith("#x")
        ? Number.parseInt(normalizedValue.slice(2), 16)
        : normalizedValue.startsWith("#")
          ? Number.parseInt(normalizedValue.slice(1), 10)
          : Number.NaN;

      if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
        return entity;
      }

      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return entity;
      }
    })
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
}

function redactSensitiveText(value: string) {
  return value
    .replace(
      /\b(api[_ -]?key|access[_ -]?token|csrf[_ -]?token|password|secret)\s*([:=])\s*([^\s<>"']+)/gi,
      (_match, label: string, separator: string) => `${label}${separator}[redacted]`
    )
    .replace(/\bbearer\s+[a-z0-9._~-]+/gi, "Bearer [redacted]");
}

function normalizeWhitespace(value: string) {
  return redactSensitiveText(
    decodeHtmlEntities(value).replace(/\s+/g, " ").trim()
  );
}

function stripNonVisibleMarkup(html: string) {
  return html
    .replace(/<!--[\s\S]*?(?:-->|$)/g, " ")
    .replace(/<(script|style|template|noscript)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, " ")
    .replace(
      /<([a-z][\w:-]*)\b[^>]*(?:\bhidden(?:\s|=|>|\/)|\baria-hidden\s*=\s*["']?true|\bstyle\s*=\s*["'][^"']*(?:display\s*:\s*none|visibility\s*:\s*hidden))[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi,
      " "
    );
}

function textFromHtml(html: string) {
  return normalizeWhitespace(stripNonVisibleMarkup(html).replace(/<[^>]*>/g, " "));
}

function truncateText(value: string | null, maximum: number): TextResult {
  if (!value) return { value: null, truncated: false };
  if (value.length <= maximum) return { value, truncated: false };

  const sliced = value.slice(0, Math.max(1, maximum - 1)).trim();
  const boundary = sliced.lastIndexOf(" ");
  const safeSlice = boundary >= Math.floor(maximum / 2) ? sliced.slice(0, boundary) : sliced;

  return { value: `${safeSlice}…`, truncated: true };
}

function attributesFromTag(tag: string) {
  const attributes = new Map<string, string>();
  const attributePattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(tag))) {
    const name = match[1]?.toLowerCase();
    if (!name || name === "meta" || name === "link" || name === "a") continue;

    const value = match[2] ?? match[3] ?? match[4] ?? "";
    attributes.set(name, normalizeWhitespace(value));
  }

  return attributes;
}

function firstTagText(html: string, tagName: string) {
  const match = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)(?:<\\/${tagName}\\s*>|$)`, "i").exec(
    html
  );

  return match ? textFromHtml(match[1]) || null : null;
}

function metaContent(html: string, attributeName: "name" | "property", attributeValue: string) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attributes = attributesFromTag(tag);
    if (attributes.get(attributeName)?.toLowerCase() !== attributeValue) continue;

    return attributes.get("content") || null;
  }

  return null;
}

function toSafeHttpUrl(value: string, baseUrl: string) {
  try {
    const url = new URL(value, baseUrl);

    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) {
      return null;
    }

    url.search = "";
    url.hash = "";

    return url.toString();
  } catch {
    return null;
  }
}

function canonicalUrl(html: string, normalizedUrl: string) {
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const attributes = attributesFromTag(tag);
    const rel = attributes.get("rel")?.toLowerCase().split(/\s+/) || [];
    const href = attributes.get("href");

    if (href && rel.includes("canonical")) {
      return toSafeHttpUrl(href, normalizedUrl);
    }
  }

  return null;
}

function collectLinks(html: string, normalizedUrl: string, maximum: number) {
  const links: Array<{ url: string; context: string }> = [];
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)(?:<\/a\s*>|$)/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html))) {
    const href = attributesFromTag(`<a ${match[1]}>`).get("href");
    if (!href) continue;

    const url = toSafeHttpUrl(href, normalizedUrl);
    if (!url) continue;

    links.push({ url, context: `${url} ${textFromHtml(match[2])}`.toLowerCase() });
  }

  const uniqueLinks = (matcher: (link: { url: string; context: string }) => boolean) => {
    const results: string[] = [];
    const seen = new Set<string>();

    for (const link of links) {
      if (!matcher(link) || seen.has(link.url)) continue;

      seen.add(link.url);
      results.push(link.url);
      if (results.length >= maximum) break;
    }

    return results;
  };

  return {
    appStoreLinks: uniqueLinks(({ url }) => {
      try {
        const hostname = new URL(url).hostname.toLowerCase();
        return hostname === "apps.apple.com" || hostname === "play.google.com";
      } catch {
        return false;
      }
    }),
    pricingLinks: uniqueLinks(({ context }) => /\b(?:pricing|plans?|billing)\b/.test(context)),
    contactLinks: uniqueLinks(({ context }) => /\b(?:contact|support)\b/.test(context)),
    docsLinks: uniqueLinks(({ context }) => /\b(?:docs?|documentation|guide|api|help)\b/.test(context)),
  };
}

function matchingHints(text: string, definitions: Array<[string, RegExp]>) {
  return definitions.filter(([, pattern]) => pattern.test(text)).map(([hint]) => hint);
}

function possibleMalformedHtml(html: string) {
  if (/<[^>]*$/.test(html)) return true;

  for (const tagName of ["html", "head", "body", "title", "h1", "h2", "p", "div"]) {
    const openings = html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi"))?.length || 0;
    const closings = html.match(new RegExp(`<\\/${tagName}\\s*>`, "gi"))?.length || 0;
    if (openings > closings) return true;
  }

  return false;
}

export function deriveStaticHtmlEvidence({
  html,
  normalizedUrl,
  hostname: _hostname,
  maxSnippetLength,
  maxLinksPerType,
}: StaticHtmlEvidenceInput): StaticHtmlDerivedEvidenceResult {
  void _hostname;

  const snippetLimit = boundedPositiveInteger(
    maxSnippetLength,
    DEFAULT_MAX_SNIPPET_LENGTH,
    MAX_ALLOWED_SNIPPET_LENGTH
  );
  const linksLimit = boundedPositiveInteger(
    maxLinksPerType,
    DEFAULT_MAX_LINKS_PER_TYPE,
    MAX_ALLOWED_LINKS_PER_TYPE
  );

  if (typeof html !== "string" || !html.trim()) {
    return emptyResult(["html_empty", "no_title_found", "no_visible_text_found"]);
  }

  try {
    const title = truncateText(firstTagText(html, "title"), 160);
    const metaDescription = truncateText(metaContent(html, "name", "description"), 320);
    const openGraphTitle = truncateText(metaContent(html, "property", "og:title"), 160);
    const openGraphDescription = truncateText(
      metaContent(html, "property", "og:description"),
      320
    );
    const headline = truncateText(firstTagText(html, "h1") || firstTagText(html, "h2"), snippetLimit);
    const visibleText = truncateText(textFromHtml(html), snippetLimit);
    const links = collectLinks(html, normalizedUrl, linksLimit);
    const hintText = [
      title.value,
      metaDescription.value,
      openGraphTitle.value,
      openGraphDescription.value,
      headline.value,
      visibleText.value,
    ]
      .filter((value): value is string => Boolean(value))
      .join(" ");
    const safetyFlags: string[] = [];

    if (possibleMalformedHtml(html)) safetyFlags.push("malformed_html_possible");
    if (!title.value) safetyFlags.push("no_title_found");
    if (!visibleText.value) safetyFlags.push("no_visible_text_found");
    if (visibleText.truncated || headline.truncated) safetyFlags.push("html_truncated");

    return {
      extractionStatus: "derived",
      extractionVersion: EXTRACTION_VERSION,
      title: title.value,
      metaDescription: metaDescription.value,
      openGraphTitle: openGraphTitle.value,
      openGraphDescription: openGraphDescription.value,
      canonicalUrl: canonicalUrl(html, normalizedUrl),
      homepageHeadlineSnippet: headline.value,
      visibleTextSnippet: visibleText.value,
      ...links,
      productNameHint: title.value,
      companyNameHint: null,
      categoryHints: matchingHints(hintText, CATEGORY_HINTS),
      aiToolRelevanceHints: matchingHints(hintText, AI_RELEVANCE_HINTS),
      confidenceLabel: "tentative",
      truncated: visibleText.truncated || headline.truncated,
      safetyFlags,
    };
  } catch {
    return {
      ...emptyResult(["extraction_failed_closed"]),
      extractionStatus: "failed_closed",
    };
  }
}
