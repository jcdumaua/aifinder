import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const panelPath = path.resolve(
  "components/admin/discovery/candidate-staging-queue-panel.tsx",
);
const drawerPath = path.resolve(
  "components/admin/discovery/candidate-staging-queue-detail-drawer.tsx",
);
const unexpectedDetailRoutePath = path.resolve(
  "app/api/admin/discovery/candidate-staging-queue/detail/route.ts",
);

assert.equal(existsSync(panelPath), true, "candidate staging queue panel must exist");
assert.equal(
  existsSync(drawerPath),
  true,
  "candidate staging queue detail drawer must exist",
);
assert.equal(
  existsSync(unexpectedDetailRoutePath),
  false,
  "drawer must not require a new candidate staging queue detail API route",
);

const panelSource = readFileSync(panelPath, "utf8");
const drawerSource = readFileSync(drawerPath, "utf8");
const combinedSource = `${panelSource}\n${drawerSource}`;

function includesForbiddenMutationLabel(source, label) {
  return new RegExp(`(^|[^A-Za-z0-9_-])${label}([^A-Za-z0-9_-]|$)`).test(
    source.replaceAll("aria-live", "aria_accessibility_region"),
  );
}

assert.equal(
  drawerSource.trimStart().startsWith('"use client";'),
  true,
  "drawer must be a client-safe component",
);

assert.equal(
  panelSource.includes("CandidateStagingQueueDetailDrawer"),
  true,
  "panel must import/render CandidateStagingQueueDetailDrawer",
);
assert.equal(
  panelSource.includes("selectedCandidate"),
  true,
  "panel must own selectedCandidate state",
);
assert.equal(
  panelSource.includes("setSelectedCandidate"),
  true,
  "panel must reset selectedCandidate when the drawer closes",
);
assert.equal(
  panelSource.includes("View details"),
  true,
  "panel must expose a read-only View details trigger",
);

for (const sectionLabel of [
  "Candidate Summary",
  "URLs",
  "Duplicate and Risk Signals",
  "Discovery Metadata",
  "Timestamps",
]) {
  assert.equal(
    drawerSource.includes(sectionLabel),
    true,
    `drawer must render ${sectionLabel}`,
  );
}

assert.equal(
  drawerSource.includes("DialogClose"),
  true,
  "drawer must include close behavior",
);
assert.equal(
  drawerSource.includes("Close details"),
  true,
  "drawer must include a visible close control",
);
assert.equal(
  drawerSource.includes("Not provided"),
  true,
  "drawer must include safe missing-value placeholder",
);
assert.equal(
  drawerSource.includes("None reported"),
  true,
  "drawer must include safe empty-array placeholder",
);

for (const forbiddenLabel of [
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
    includesForbiddenMutationLabel(combinedSource, forbiddenLabel),
    false,
    `drawer/panel must not include forbidden mutation label: ${forbiddenLabel}`,
  );
}

for (const forbiddenMethod of [
  'method: "POST"',
  'method: "PATCH"',
  'method: "PUT"',
  'method: "DELETE"',
  "method: 'POST'",
  "method: 'PATCH'",
  "method: 'PUT'",
  "method: 'DELETE'",
]) {
  assert.equal(
    combinedSource.includes(forbiddenMethod),
    false,
    `drawer/panel must not introduce mutation fetch method: ${forbiddenMethod}`,
  );
}

assert.equal(
  drawerSource.includes("fetch("),
  false,
  "drawer must not fetch candidate details",
);
assert.equal(
  combinedSource.includes("/api/admin/discovery/candidate-extraction/invoke"),
  false,
  "drawer/panel must not introduce candidate extraction invocation fetch",
);
assert.equal(
  /supabase|service-role|SERVICE_ROLE|serviceRole|service_role/i.test(
    combinedSource,
  ),
  false,
  "drawer/panel must not import or reference Supabase/service-role code",
);
assert.equal(
  combinedSource.includes("public.tools"),
  false,
  "drawer/panel must not reference public.tools writes",
);
assert.equal(
  combinedSource.includes("discovered_tools"),
  false,
  "drawer/panel must not reference discovered_tools writes",
);
assert.equal(
  /\.insert\(|\.update\(|\.upsert\(|\.delete\(|\.rpc\(/.test(combinedSource),
  false,
  "drawer/panel must not include mutation query calls",
);

assert.equal(
  drawerSource.includes("getSafeHttpsUrl"),
  true,
  "drawer must retain safe HTTPS URL handling",
);
assert.equal(
  drawerSource.includes("url.username || url.password"),
  true,
  "drawer must block credentialed URLs from clickable links",
);
assert.equal(
  drawerSource.includes('url.protocol !== "https:"'),
  true,
  "drawer must avoid clickable non-HTTPS URLs",
);
assert.equal(
  drawerSource.includes("break-words") || drawerSource.includes("break-all"),
  true,
  "drawer must wrap long IDs and URLs safely",
);

console.log(
  "Future browser QA markers: Desktop, Tablet/iPad, and Mobile drawer checks remain required after implementation review.",
);
console.log("Phase 15I candidate staging queue detail drawer static tests passed.");
