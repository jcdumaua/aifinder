import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();

const candidatePreviewRoutePath = "app/api/admin/discovery/runs/[id]/candidate-preview/route.ts";
const readOnlyHelperPath = "lib/admin-auth-read-only.ts";
const mutatingAuthDependencyPath = "lib/admin-auth.ts";

const failures = [];

function print(name, value) {
  console.log(`${name}=${value}`);
}

function fail(message) {
  failures.push(message);
}

function assertEquals(name, actual, expected) {
  print(name, actual);

  if (actual !== expected) {
    fail(`${name}: expected ${expected}, received ${actual}`);
  }
}

function assertFileExists(label, relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  const exists = existsSync(absolutePath);
  print(`${label}_exists`, exists);

  if (!exists) {
    fail(`Missing required file: ${relativePath}`);
  }

  return absolutePath;
}

function readSource(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  return readFileSync(absolutePath, "utf8");
}

function importsLibAdminAuth(source) {
  return /from\s+["'][^"']*lib\/admin-auth["']/.test(source);
}

function importsReadOnlyAdminAuth(source) {
  return /from\s+["'][^"']*lib\/admin-auth-read-only["']/.test(source);
}

function referencesSupabaseOrServiceRole(source) {
  return /from\s+["'][^"']*supabase|createClient|service[_-]?role|SUPABASE_SERVICE_ROLE_KEY/i.test(source);
}

function containsActiveHelperMutationMarker(source) {
  return /createHmac|\.update\s*\(|\.digest\s*\(/.test(source);
}

function containsActiveRouteMutationMarker(source) {
  return /\.update\s*\(/.test(source);
}

function containsGenericDbMutationMarker(source) {
  return /\.(insert|upsert|delete|rpc)\s*\(/.test(source);
}

function containsLiveDbReadMarker(source) {
  return /\.select\s*\(/.test(source);
}

function containsNetworkOrResponseMutationMarker(source) {
  return /fetch\s*\(|cookies\(\)\.set|\.cookies\.set|headers\(\)\.set|\.headers\.set|Set-Cookie|set-cookie|NextResponse\.redirect|Response\.redirect/.test(source);
}

function hasObjectShapedActorContract(source) {
  return source.includes("type ReadOnlyAdminActor = {")
    && source.includes("actor: ReadOnlyAdminActor | null;");
}

function hasActorLabelContract(source) {
  return source.includes("label?: string;");
}

function main() {
  print("phase", "25EE");
  print("implementation_phase", "25ED");
  print("harness", "discovery_candidate_preview_read_only_auth_contract_source_harness");
  print("mode", "source_only_file_read");
  print("values_printed", false);
  print("route_invocation", false);
  print("module_import_execution", false);
  print("local_server_startup", false);
  print("live_db_read", false);
  print("db_mutation", false);

  assertFileExists("candidate_preview_route", candidatePreviewRoutePath);
  assertFileExists("read_only_helper", readOnlyHelperPath);
  assertFileExists("mutating_auth_dependency_reference", mutatingAuthDependencyPath);

  if (failures.length > 0) {
    throw new Error(failures.join("\n"));
  }

  const candidatePreviewRouteSource = readSource(candidatePreviewRoutePath);
  const readOnlyHelperSource = readSource(readOnlyHelperPath);

  assertEquals(
    "candidate_preview_route_imports_lib_admin_auth",
    importsLibAdminAuth(candidatePreviewRouteSource),
    false,
  );

  assertEquals(
    "candidate_preview_route_imports_lib_admin_auth_read_only",
    importsReadOnlyAdminAuth(candidatePreviewRouteSource),
    true,
  );

  assertEquals(
    "candidate_preview_route_uses_getReadOnlyAdminSession",
    candidatePreviewRouteSource.includes("getReadOnlyAdminSession"),
    true,
  );

  assertEquals(
    "candidate_preview_route_async_returntype_recovered",
    candidatePreviewRouteSource.includes("type AdminSession = Awaited<ReturnType<typeof getReadOnlyAdminSession>>;"),
    true,
  );

  assertEquals(
    "candidate_preview_route_awaits_verify_session",
    /await\s+verifySession\s*\(\s*request\s*\)/.test(candidatePreviewRouteSource),
    true,
  );

  assertEquals(
    "read_only_helper_imports_lib_admin_auth",
    importsLibAdminAuth(readOnlyHelperSource),
    false,
  );

  assertEquals(
    "read_only_helper_imports_supabase_or_service_role",
    referencesSupabaseOrServiceRole(readOnlyHelperSource),
    false,
  );

  assertEquals(
    "read_only_helper_exports_getReadOnlyAdminSession",
    readOnlyHelperSource.includes("export async function getReadOnlyAdminSession"),
    true,
  );

  assertEquals(
    "read_only_helper_actor_contract_object_shape",
    hasObjectShapedActorContract(readOnlyHelperSource),
    true,
  );

  assertEquals(
    "read_only_helper_actor_label_contract_present",
    hasActorLabelContract(readOnlyHelperSource),
    true,
  );

  assertEquals(
    "read_only_helper_active_mutation_marker_count",
    containsActiveHelperMutationMarker(readOnlyHelperSource) ? 1 : 0,
    0,
  );

  assertEquals(
    "candidate_preview_route_active_mutation_marker_count",
    containsActiveRouteMutationMarker(candidatePreviewRouteSource) ? 1 : 0,
    0,
  );

  assertEquals(
    "read_only_helper_generic_db_mutation_marker_count",
    containsGenericDbMutationMarker(readOnlyHelperSource) ? 1 : 0,
    0,
  );

  assertEquals(
    "candidate_preview_route_generic_db_mutation_marker_count",
    containsGenericDbMutationMarker(candidatePreviewRouteSource) ? 1 : 0,
    0,
  );

  assertEquals(
    "read_only_helper_live_db_read_marker_count",
    containsLiveDbReadMarker(readOnlyHelperSource) ? 1 : 0,
    0,
  );

  assertEquals(
    "read_only_helper_network_or_response_mutation_marker_count",
    containsNetworkOrResponseMutationMarker(readOnlyHelperSource) ? 1 : 0,
    0,
  );

  print("internal_Map_set_cookie_parse_false_positive_ignored", true);

  if (failures.length > 0) {
    print("result", "failed");
    throw new Error(failures.join("\n"));
  }

  print("result", "passed");
}

try {
  main();
} catch (error) {
  print("result", "failed");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
}
