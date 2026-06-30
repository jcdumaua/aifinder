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
  panelSource.includes("currentCursor"),
  true,
  "panel must track the current forward cursor",
);
assert.equal(
  panelSource.includes("nextCursor"),
  true,
  "panel must track the next forward cursor",
);
assert.equal(
  panelSource.includes("hasNextPage"),
  true,
  "panel must track whether another page exists",
);
assert.equal(
  panelSource.includes("pageIndex"),
  true,
  "panel must track a safe page index instead of rendering raw cursors",
);
assert.equal(
  /if\s*\(\s*currentCursor\s*\)[\s\S]*params\.set\(["']cursor["'],\s*currentCursor\)/.test(
    panelSource,
  ),
  true,
  "panel must include cursor query parameter only when a current cursor exists",
);
assert.equal(
  panelSource.includes("Next page"),
  true,
  "panel must include a forward-only Next page control",
);
assert.equal(
  panelSource.includes("Back to first page"),
  true,
  "panel must include a safe reset-to-first-page control",
);
assert.equal(
  /value=\{currentCursor\}|name=["']cursor["']|id=["'].*cursor|htmlFor=["'].*cursor|placeholder=["'][^"']*cursor/i.test(
    panelSource,
  ),
  false,
  "panel must not render raw cursor values or expose cursor inputs",
);
assert.equal(
  panelSource.includes("candidate_queue_invalid_cursor"),
  true,
  "panel must handle safe invalid cursor error codes",
);
assert.equal(
  panelSource.includes("candidate_queue_cursor_mismatch"),
  true,
  "panel must handle safe cursor mismatch error codes",
);
assert.equal(
  panelSource.includes("candidate_queue_cursor_version_unsupported"),
  true,
  "panel must handle safe unsupported cursor version error codes",
);
assert.equal(
  panelSource.includes("CandidateStagingQueueDetailDrawer"),
  true,
  "panel must preserve detail drawer rendering",
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
