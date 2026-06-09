import { isToolCategory, type ToolCategory } from "./tool-categories";

export const TOOL_PRICING_OPTIONS = ["Free + Paid", "Free", "Paid"] as const;

const BLOCKED_FILE_EXTENSIONS = [
  ".exe",
  ".zip",
  ".rar",
  ".7z",
  ".apk",
  ".dmg",
  ".pkg",
  ".msi",
  ".bat",
  ".cmd",
  ".scr",
  ".ps1",
  ".vbs",
  ".jar",
  ".iso",
  ".torrent",
];

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/;

const SUSPICIOUS_TEXT_PATTERNS = [
  "<script",
  "</script",
  "javascript:",
  "data:text/html",
  "onerror=",
  "onload=",
  "onclick=",
  "<iframe",
  "</iframe",
  "<object",
  "</object",
  "<embed",
  "</embed",
];

export const TOOL_FIELD_LENGTHS = {
  name: 80,
  category: 40,
  website: 500,
  logoUrl: 500,
  pricing: 80,
  description: 500,
  submitterName: 80,
  submitterEmail: 120,
  companyWebsite: 200,
};

type TextFieldOptions = {
  required?: boolean;
  unsafeCheck?: boolean;
};

export function validateTextField(
  value: unknown,
  fieldName: string,
  maxLength: number,
  options: TextFieldOptions = {}
) {
  const { required = false, unsafeCheck = true } = options;

  if (typeof value !== "string") {
    if (required) {
      throw new Error(`${fieldName} is required.`);
    }

    return "";
  }

  if (CONTROL_CHARACTER_PATTERN.test(value)) {
    throw new Error(`${fieldName} contains invalid characters.`);
  }

  const trimmedValue = value.trim();

  if (required && !trimmedValue) {
    throw new Error(`${fieldName} is required.`);
  }

  if (trimmedValue.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`);
  }

  if (unsafeCheck) {
    const lowerValue = trimmedValue.toLowerCase();

    if (SUSPICIOUS_TEXT_PATTERNS.some((pattern) => lowerValue.includes(pattern))) {
      throw new Error(`${fieldName} contains unsafe content.`);
    }
  }

  return trimmedValue;
}

export function validateToolCategory(value: unknown): ToolCategory {
  const category = validateTextField(
    value,
    "Category",
    TOOL_FIELD_LENGTHS.category,
    {
      required: true,
      unsafeCheck: false,
    }
  );

  if (!isToolCategory(category)) {
    throw new Error("Please select a valid category.");
  }

  return category;
}

export function validateToolPricing(value: unknown) {
  const pricing = validateTextField(
    value,
    "Pricing",
    TOOL_FIELD_LENGTHS.pricing,
    {
      required: false,
      unsafeCheck: false,
    }
  );

  if (pricing && !TOOL_PRICING_OPTIONS.some((option) => option === pricing)) {
    throw new Error("Please select a valid pricing option.");
  }

  return pricing;
}

function getComparableHostname(url: URL) {
  return url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
}

function isBlockedHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0" ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("169.254.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
    /^fc[0-9a-f]{2}:/i.test(hostname) ||
    /^fd[0-9a-f]{2}:/i.test(hostname) ||
    /^fe80:/i.test(hostname)
  );
}

export function validateHttpsUrl(
  value: unknown,
  fieldName: string,
  options: { required?: boolean } = {}
) {
  const rawValue = validateTextField(value, fieldName, TOOL_FIELD_LENGTHS.website, {
    required: options.required ?? true,
    unsafeCheck: false,
  });

  if (!rawValue) return "";

  let url: URL;

  try {
    url = new URL(rawValue);
  } catch {
    throw new Error(`${fieldName} must be a valid URL.`);
  }

  if (url.protocol !== "https:") {
    throw new Error(`${fieldName} must start with https://`);
  }

  if (url.username || url.password) {
    throw new Error(`${fieldName} cannot contain username or password.`);
  }

  if (isBlockedHostname(getComparableHostname(url))) {
    throw new Error(`${fieldName} cannot use local or private addresses.`);
  }

  let pathname = "";

  try {
    pathname = decodeURIComponent(url.pathname).toLowerCase();
  } catch {
    pathname = url.pathname.toLowerCase();
  }

  if (BLOCKED_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    throw new Error(`${fieldName} cannot link directly to a downloadable file.`);
  }

  url.hash = "";

  return url.toString();
}

export function validateOptionalLogoUrl(value: unknown) {
  const logoUrl = validateTextField(value, "Logo URL", TOOL_FIELD_LENGTHS.logoUrl, {
    required: false,
    unsafeCheck: false,
  });

  if (!logoUrl) return "";

  return validateHttpsUrl(logoUrl, "Logo URL", { required: true });
}

export function getNormalizedDomain(value: string) {
  const url = new URL(value);
  return getComparableHostname(url).replace(/^www\./, "");
}

export function validateOptionalEmail(value: unknown) {
  const email = validateTextField(
    value,
    "Submitter email",
    TOOL_FIELD_LENGTHS.submitterEmail,
    {
      required: false,
      unsafeCheck: false,
    }
  );

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  return email;
}
