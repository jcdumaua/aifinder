import assert from "node:assert/strict";
import test from "node:test";

const { validateDiscoveryUrlSafety } = await import(
  "../lib/discovery-url-safety.ts"
);

test("allows public HTTPS URLs and returns normalized metadata", () => {
  assert.deepEqual(validateDiscoveryUrlSafety("https://example.com"), {
    ok: true,
    normalizedUrl: "https://example.com/",
    hostname: "example.com",
    protocol: "https:",
  });

  assert.deepEqual(
    validateDiscoveryUrlSafety("https://www.example.com/path?query=1"),
    {
      ok: true,
      normalizedUrl: "https://www.example.com/path?query=1",
      hostname: "www.example.com",
      protocol: "https:",
    }
  );
});

for (const unsafeUrl of [
  "",
  "not a URL",
  "http://example.com",
  "ftp://example.com",
  "file:///etc/passwd",
  "data:text/html,test",
  "javascript:alert(1)",
  "mailto:test@example.com",
  "https://localhost",
  "https://LOCALHOST.",
  "https://127.0.0.1",
  "https://0.0.0.0",
  "https://10.0.0.1",
  "https://172.16.0.1",
  "https://192.168.1.1",
  "https://169.254.169.254",
  "https://[::1]",
  "https://[fc00::1]",
  "https://[fd12:3456:789a::1]",
  "https://[fe80::1]",
  "https://[::ffff:127.0.0.1]",
  "https://user:pass@example.com",
  "https://2130706433",
  "https://0x7f000001",
  "https://0177.0.0.1",
]) {
  test(`rejects unsafe URL: ${unsafeUrl || "empty"}`, () => {
    const result = validateDiscoveryUrlSafety(unsafeUrl);

    assert.equal(result.ok, false);
  });
}
