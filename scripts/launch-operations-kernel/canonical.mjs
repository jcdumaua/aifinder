import { createHash } from "node:crypto";

export const SHA256_PATTERN = /^[0-9a-f]{64}$/u;

export class CanonicalValueError extends Error {
  constructor(code) {
    super(code);
    this.name = "CanonicalValueError";
    this.code = code;
  }
}

function canonicalValue(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new CanonicalValueError("CANONICAL_NUMBER");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalValue(entry)).join(",")}]`;
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new CanonicalValueError("CANONICAL_OBJECT");
    }
    return `{${Object.keys(value)
      .sort((left, right) => left.localeCompare(right, "en"))
      .map((key) => {
        if (value[key] === undefined) {
          throw new CanonicalValueError("CANONICAL_UNDEFINED");
        }
        return `${JSON.stringify(key)}:${canonicalValue(value[key])}`;
      })
      .join(",")}}`;
  }
  throw new CanonicalValueError("CANONICAL_TYPE");
}

export function canonicalJson(value) {
  return canonicalValue(value);
}

export function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function isSha256(value) {
  return typeof value === "string" && SHA256_PATTERN.test(value);
}

export function digestMemberRows(entries) {
  const paths = entries.map((entry) => entry.path);
  const ordered = [...paths].sort((left, right) => left.localeCompare(right, "en"));
  if (
    paths.length !== new Set(paths).size ||
    !paths.every((entry, index) => entry === ordered[index])
  ) {
    throw new CanonicalValueError("CANONICAL_MEMBER_ORDER");
  }
  return sha256Hex(
    entries
      .map((entry) =>
        [entry.path, entry.sha256, String(entry.bytes), entry.mode].join("\0"),
      )
      .join("\n"),
  );
}
