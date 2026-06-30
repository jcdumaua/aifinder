import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const clientPath = "components/admin/admin-dashboard-client.tsx";
const routePath = "app/api/admin/tools/route.ts";

const clientSource = readFileSync(clientPath, "utf8");
const routeSource = readFileSync(routePath, "utf8");

assert.equal(
  clientSource.includes('import { supabase } from "../../lib/supabase";'),
  false,
  "admin dashboard client must not import the browser Supabase client",
);

assert.equal(
  clientSource.includes(".from(\"tools\")"),
  false,
  "admin dashboard client must not perform a browser Supabase tools read",
);

assert.equal(
  clientSource.includes(".from('tools')"),
  false,
  "admin dashboard client must not perform a browser Supabase tools read",
);

assert.equal(
  clientSource.includes(".from(`tools`)"),
  false,
  "admin dashboard client must not perform a browser Supabase tools read",
);

assert.equal(
  clientSource.includes("rest/v1/tools"),
  false,
  "admin dashboard client must not depend on direct Supabase REST tools paths",
);

assert.equal(
  clientSource.includes('fetch("/api/admin/tools"'),
  true,
  "admin dashboard client must fetch live tools through the admin API boundary",
);

assert.equal(
  clientSource.includes('method: "GET"'),
  true,
  "admin dashboard client must use a GET request for the read-only tools load",
);

assert.equal(
  clientSource.includes('cache: "no-store"'),
  true,
  "admin dashboard tools fetch must avoid caching admin data",
);

assert.equal(
  clientSource.includes("service_role"),
  false,
  "admin dashboard client must not contain service-role markers",
);

assert.equal(
  clientSource.includes("SUPABASE_SERVICE"),
  false,
  "admin dashboard client must not contain service-role environment markers",
);

const getStart = routeSource.indexOf("export async function GET");
const postStart = routeSource.indexOf("export async function POST");

assert.notEqual(getStart, -1, "admin tools route must expose a GET handler");
assert.notEqual(postStart, -1, "admin tools route must keep its POST handler");
assert.equal(
  getStart < postStart,
  true,
  "admin tools GET handler should be declared before mutation handlers for review clarity",
);

const getSource = routeSource.slice(getStart, postStart);

assert.equal(
  getSource.includes("requireAdminSecurity(request)"),
  true,
  "admin tools GET handler must use the existing admin security wrapper",
);

assert.equal(
  getSource.includes('select("id, name, category, description, website, pricing, logo_url, status, deleted_at")'),
  true,
  "admin tools GET handler must use an explicit safe projection",
);

assert.equal(
  getSource.includes('.select("*")'),
  false,
  "admin tools GET handler must not use a broad select star projection",
);

for (const forbiddenMutation of [
  ".insert(",
  ".update(",
  ".upsert(",
  ".delete(",
  ".rpc(",
  "createAdminAuditLog(",
]) {
  assert.equal(
    getSource.includes(forbiddenMutation),
    false,
    `admin tools GET handler must remain read-only and avoid ${forbiddenMutation}`,
  );
}

assert.equal(
  getSource.includes('order("id", { ascending: false })'),
  true,
  "admin tools GET handler must preserve descending id ordering",
);

assert.equal(
  getSource.includes("Failed to load live tools."),
  true,
  "admin tools GET handler must return a safe generic load error",
);

console.log("admin shell Supabase read hardening static assertions passed");
