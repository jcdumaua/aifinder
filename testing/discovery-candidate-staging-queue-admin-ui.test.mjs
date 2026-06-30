import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const panelPath = path.resolve(
  "components/admin/discovery/candidate-staging-queue-panel.tsx",
);
const pagePath = path.resolve("app/admin/discovery/page.tsx");
const adminClientPath = path.resolve("components/admin/admin-dashboard-client.tsx");

assert.equal(existsSync(panelPath), true, "candidate staging queue panel must exist");
assert.equal(existsSync(pagePath), true, "admin discovery page must exist");
assert.equal(existsSync(adminClientPath), true, "admin dashboard client must exist");

const panelSource = readFileSync(panelPath, "utf8");
const pageSource = readFileSync(pagePath, "utf8");
const adminClientSource = readFileSync(adminClientPath, "utf8");

function hasForbiddenUiToken(source, forbidden) {
  if (forbidden === "live") {
    return /(^|[^A-Za-z0-9_-])live([^A-Za-z0-9_-]|$)/.test(
      source.replaceAll("aria-live", "aria_accessibility_region"),
    );
  }

  if (/^[a-z_]+$/.test(forbidden)) {
    return new RegExp(`(^|[^A-Za-z0-9_-])${forbidden}([^A-Za-z0-9_-]|$)`).test(
      source,
    );
  }

  return source.includes(forbidden);
}

assert.equal(
  panelSource.trimStart().startsWith('"use client";'),
  true,
  "panel must be a client component",
);

assert.equal(
  panelSource.includes("/api/admin/discovery/candidate-staging-queue"),
  true,
  "panel must fetch only the candidate staging queue admin API path",
);

assert.equal(panelSource.includes('method: "GET"'), true, "panel fetch must use GET");
assert.equal(
  panelSource.includes('cache: "no-store"'),
  true,
  "panel fetch must use cache no-store",
);

assert.equal(
  panelSource.includes("Loading candidate staging queue..."),
  true,
  "panel must render loading copy",
);
assert.equal(
  panelSource.includes("No active staged candidates found."),
  true,
  "panel must render empty copy",
);
assert.equal(
  panelSource.includes("Candidate staging queue could not be loaded."),
  true,
  "panel must render safe error copy",
);
assert.equal(panelSource.includes("Refresh"), true, "panel must include refresh behavior");

for (const status of ["staged", "needs_review", "duplicate_suspected"]) {
  assert.equal(panelSource.includes(`"${status}"`), true, `${status} must be present`);
}

for (const forbidden of [
  "archived",
  "rejected",
  "approved",
  "published",
  "promoted",
  "live",
  "public",
  "Approve",
  "Publish",
  "Promote",
  "Reject",
  "Archive",
  "Delete",
  "Insert into public tools",
  "Write to discovered_tools",
  "Run extraction",
  "Run crawler",
]) {
  assert.equal(
    hasForbiddenUiToken(panelSource, forbidden),
    false,
    `panel must not include forbidden status/action: ${forbidden}`,
  );
  assert.equal(
    hasForbiddenUiToken(pageSource, forbidden),
    false,
    `admin discovery page must not include forbidden status/action: ${forbidden}`,
  );
}

assert.equal(
  /supabase|supabaseAdmin|service-role|SERVICE_ROLE|createClient\(/i.test(panelSource),
  false,
  "panel must not import or reference Supabase/service-role code",
);

assert.equal(
  /method:\s*["'](?:POST|PUT|PATCH|DELETE)["']|\.insert\(|\.update\(|\.upsert\(|\.delete\(|\.rpc\(/.test(
    panelSource,
  ),
  false,
  "panel must not include mutation methods or mutation query calls",
);

assert.equal(
  /method:\s*["'](?:POST|PUT|PATCH|DELETE)["']|\.insert\(|\.update\(|\.upsert\(|\.delete\(|\.rpc\(/.test(
    pageSource,
  ),
  false,
  "admin discovery page must not include mutation methods or mutation query calls",
);

assert.equal(
  /params\.set\(["']cursor["']|name=["']cursor["']|id=["'].*cursor|htmlFor=["'].*cursor/i.test(panelSource),
  false,
  "panel must not expose cursor query construction or cursor UI in Phase 15C",
);

assert.equal(
  pageSource.includes("CandidateStagingQueuePanel"),
  true,
  "admin discovery page must import/render CandidateStagingQueuePanel",
);

assert.equal(
  adminClientSource.includes("children?: ReactNode;"),
  true,
  "AdminDashboardClient must accept a minimal children slot",
);

assert.equal(
  adminClientSource.includes('{view === "discovery" && children}'),
  true,
  "AdminDashboardClient must render children inside the discovery view",
);

console.log("Phase 15C candidate staging queue admin UI static tests passed.");
