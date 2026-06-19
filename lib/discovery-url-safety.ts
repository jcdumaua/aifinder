export type DiscoveryUrlSafetyFailureReason =
  | "empty_url"
  | "invalid_url"
  | "non_https_protocol"
  | "credentials_not_allowed"
  | "blocked_hostname"
  | "blocked_ip_address";

export type SafeDiscoveryUrl = {
  ok: true;
  normalizedUrl: string;
  hostname: string;
  protocol: "https:";
};

export type UnsafeDiscoveryUrl = {
  ok: false;
  reason: DiscoveryUrlSafetyFailureReason;
};

export type DiscoveryUrlSafetyResult = SafeDiscoveryUrl | UnsafeDiscoveryUrl;

function parseIpv4Address(hostname: string) {
  const parts = hostname.split(".");

  if (
    parts.length !== 4 ||
    parts.some((part) => !/^\d{1,3}$/.test(part))
  ) {
    return null;
  }

  const octets = parts.map((part) => Number(part));

  if (octets.some((octet) => octet < 0 || octet > 255)) {
    return null;
  }

  return octets as [number, number, number, number];
}

function isBlockedIpv4Address(octets: [number, number, number, number]) {
  const [first, second, third] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && (third === 0 || third === 2)) ||
    (first === 192 && second === 88 && third === 99) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224
  );
}

function parseIpv6Address(hostname: string) {
  const address = hostname.replace(/^\[|\]$/g, "").toLowerCase();

  if (!address.includes(":") || address.includes(":::")) {
    return null;
  }

  const doubleColonIndex = address.indexOf("::");

  if (
    doubleColonIndex !== -1 &&
    address.indexOf("::", doubleColonIndex + 2) !== -1
  ) {
    return null;
  }

  const left = doubleColonIndex === -1 ? address : address.slice(0, doubleColonIndex);
  const right = doubleColonIndex === -1 ? "" : address.slice(doubleColonIndex + 2);
  const rawParts = [
    ...(left ? left.split(":") : []),
    ...(right ? right.split(":") : []),
  ];
  const segments: number[] = [];

  for (let index = 0; index < rawParts.length; index += 1) {
    const part = rawParts[index];

    if (part.includes(".")) {
      if (index !== rawParts.length - 1) {
        return null;
      }

      const ipv4 = parseIpv4Address(part);

      if (!ipv4) {
        return null;
      }

      segments.push((ipv4[0] << 8) | ipv4[1], (ipv4[2] << 8) | ipv4[3]);
      continue;
    }

    if (!/^[0-9a-f]{1,4}$/.test(part)) {
      return null;
    }

    segments.push(Number.parseInt(part, 16));
  }

  if (doubleColonIndex === -1) {
    return segments.length === 8 ? segments : null;
  }

  if (segments.length >= 8) {
    return null;
  }

  const leftSegmentCount = left ? left.split(":").length : 0;
  const missingSegments = 8 - segments.length;

  return [
    ...segments.slice(0, leftSegmentCount),
    ...Array<number>(missingSegments).fill(0),
    ...segments.slice(leftSegmentCount),
  ];
}

function isBlockedIpv6Address(segments: number[]) {
  const first = segments[0];
  const second = segments[1];
  const isIpv4Compatible = segments.slice(0, 6).every((segment) => segment === 0);
  const isIpv4Mapped =
    segments.slice(0, 5).every((segment) => segment === 0) && segments[5] === 0xffff;

  return (
    segments.every((segment) => segment === 0) ||
    (segments.slice(0, 7).every((segment) => segment === 0) && segments[7] === 1) ||
    isIpv4Compatible ||
    isIpv4Mapped ||
    (first & 0xfe00) === 0xfc00 ||
    (first & 0xffc0) === 0xfe80 ||
    (first & 0xffc0) === 0xfec0 ||
    (first & 0xff00) === 0xff00 ||
    (first === 0x2001 && second === 0x0db8)
  );
}

function isBlockedHostname(hostname: string) {
  const comparableHostname = hostname.toLowerCase().replace(/\.+$/, "");

  return (
    comparableHostname === "localhost" ||
    comparableHostname.endsWith(".localhost")
  );
}

function isBlockedIpAddress(hostname: string) {
  const ipv4 = parseIpv4Address(hostname);

  if (ipv4) {
    return isBlockedIpv4Address(ipv4);
  }

  const ipv6 = parseIpv6Address(hostname);

  return ipv6 ? isBlockedIpv6Address(ipv6) : false;
}

export function validateDiscoveryUrlSafety(value: unknown): DiscoveryUrlSafetyResult {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, reason: "empty_url" };
  }

  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "non_https_protocol" };
  }

  if (url.username || url.password) {
    return { ok: false, reason: "credentials_not_allowed" };
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (isBlockedHostname(hostname)) {
    return { ok: false, reason: "blocked_hostname" };
  }

  if (isBlockedIpAddress(hostname)) {
    return { ok: false, reason: "blocked_ip_address" };
  }

  return {
    ok: true,
    normalizedUrl: url.toString(),
    hostname,
    protocol: "https:",
  };
}
