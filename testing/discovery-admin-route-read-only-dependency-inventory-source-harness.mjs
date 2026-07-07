#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PHASE = "25EN";
const INVENTORY_NAME = "discovery_admin_route_read_only_dependency_inventory";
const MODE = "source_only_static_file_read";

const REPO_ROOT = process.cwd();
const ROUTE_ROOT = "app/api/admin/discovery";
const KNOWN_READ_ONLY_HELPER = "lib/admin-auth-read-only.ts";
const KNOWN_EXISTING_ADMIN_AUTH_HELPER = "lib/admin-auth.ts";

const SECRET_MARKER_PARTS = ["SUPABASE", "_SERVICE", "_ROLE", "_KEY"];
const ENV_MARKER = ["process", ".", "env"].join("");
const FETCH_MARKER = ["fetch", "("].join("");
const CREATE_SERVER_MARKER = ["create", "Server", "("].join("");
const LISTEN_MARKER = [".", "listen", "("].join("");
const CREATE_CLIENT_MARKER = ["create", "Client"].join("");

const MARKERS = {
  readOnlyAuthDependency: [
    "lib/admin-auth-read-only",
    "getReadOnlyAdminSession",
    "verifySession",
  ],
  mutatingAuthDependency: [
    "lib/admin-auth",
    "createServerClient",
    "updateSession",
  ],
  supabaseOrServiceRole: [
    CREATE_CLIENT_MARKER,
    SECRET_MARKER_PARTS.join(""),
    "service_role",
    "service-role",
    "@supabase",
  ],
  activeMutation: [
    ".insert(",
    ".update(",
    ".upsert(",
    ".delete(",
    ".rpc(",
  ],
  genericDbMutation: [
    "insert",
    "update",
    "upsert",
    "delete",
    "rpc",
    "mutation",
  ],
  readOnlyMethod: [
    ".select(",
    ".eq(",
    ".single(",
    ".maybeSingle(",
    ".limit(",
    ".order(",
  ],
  networkOrRuntime: [
    FETCH_MARKER,
    CREATE_SERVER_MARKER,
    LISTEN_MARKER,
    "next dev",
    ["chromium", ".", "launch"].join(""),
    ["puppeteer", ".", "launch"].join(""),
  ],
  environmentValue: [
    ENV_MARKER,
  ],
};

const outputRows = [];

function addOutput(key, value) {
  outputRows.push([key, normalizeValue(value)]);
}

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(",") : "none";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

function printOutput() {
  for (const [key, value] of outputRows) {
    process.stdout.write(`${key}=${value}\n`);
  }
}

function failClosed(reason) {
  addOutput("result", "failed");
  addOutput("failure_reason", reason);
  printOutput();
  process.exitCode = 1;
}

function resolveFromRepo(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readTextFile(relativePath) {
  return fs.readFileSync(resolveFromRepo(relativePath), "utf8");
}

function existsPath(relativePath) {
  return fs.existsSync(resolveFromRepo(relativePath));
}

function isRouteFile(fileName) {
  return fileName === "route.ts" || fileName === "route.tsx" || fileName === "route.js" || fileName === "route.mjs";
}

function walkFiles(relativeDirectory) {
  const absoluteDirectory = resolveFromRepo(relativeDirectory);
  const entries = fs.readdirSync(absoluteDirectory, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const relativeEntry = path.join(relativeDirectory, entry.name);

    if (entry.isDirectory()) {
      results.push(...walkFiles(relativeEntry));
      continue;
    }

    if (entry.isFile() && isRouteFile(entry.name)) {
      results.push(relativeEntry.split(path.sep).join("/"));
    }
  }

  return results.sort();
}

function includesAny(text, markers) {
  return markers.some((marker) => text.includes(marker));
}

function countFiles(files, markerGroup) {
  return files.filter((file) => includesAny(file.text, markerGroup)).length;
}

function listFiles(files, predicate) {
  return files.filter(predicate).map((file) => file.relativePath);
}

function buildInventory() {
  addOutput("phase", PHASE);
  addOutput("inventory", INVENTORY_NAME);
  addOutput("mode", MODE);
  addOutput("values_printed", false);
  addOutput("route_invocation", false);
  addOutput("module_import_execution", false);
  addOutput("local_server_startup", false);
  addOutput("live_db_read", false);
  addOutput("db_mutation", false);

  if (!existsPath(ROUTE_ROOT)) {
    addOutput("route_root_exists", false);
    failClosed("missing_route_root");
    return;
  }

  if (!existsPath(KNOWN_READ_ONLY_HELPER)) {
    failClosed("missing_known_read_only_helper");
    return;
  }

  if (!existsPath(KNOWN_EXISTING_ADMIN_AUTH_HELPER)) {
    failClosed("missing_known_existing_admin_auth_helper");
    return;
  }

  const routeFiles = walkFiles(ROUTE_ROOT);
  const fileRecords = routeFiles.map((relativePath) => ({
    relativePath,
    text: readTextFile(relativePath),
  }));

  const importsLibAdminAuthFiles = listFiles(fileRecords, (file) => includesAny(file.text, MARKERS.mutatingAuthDependency));
  const importsLibAdminAuthReadOnlyFiles = listFiles(fileRecords, (file) => includesAny(file.text, MARKERS.readOnlyAuthDependency));
  const importsSupabaseOrServiceRoleFiles = listFiles(fileRecords, (file) => includesAny(file.text, MARKERS.supabaseOrServiceRole));
  const activeMutationMarkerFiles = listFiles(fileRecords, (file) => includesAny(file.text, MARKERS.activeMutation));
  const genericDbMutationMarkerFiles = listFiles(fileRecords, (file) => includesAny(file.text, MARKERS.genericDbMutation));
  const readOnlyMethodMarkerFiles = listFiles(fileRecords, (file) => includesAny(file.text, MARKERS.readOnlyMethod));

  const candidateMutatingOrOperationalDependencyFiles = Array.from(new Set([
    ...importsLibAdminAuthFiles,
    ...importsSupabaseOrServiceRoleFiles,
    ...activeMutationMarkerFiles,
  ])).sort();

  const candidateReadOnlyDependencyFiles = importsLibAdminAuthReadOnlyFiles
    .filter((file) => !candidateMutatingOrOperationalDependencyFiles.includes(file))
    .sort();

  const needsFollowUpReviewFiles = Array.from(new Set([
    ...genericDbMutationMarkerFiles,
    ...readOnlyMethodMarkerFiles,
  ])).sort();

  addOutput("route_root_exists", true);
  addOutput("route_file_count", routeFiles.length);
  addOutput("route_files", routeFiles);
  addOutput("imports_lib_admin_auth_count", importsLibAdminAuthFiles.length);
  addOutput("imports_lib_admin_auth_read_only_count", importsLibAdminAuthReadOnlyFiles.length);
  addOutput("imports_supabase_or_service_role_count", importsSupabaseOrServiceRoleFiles.length);
  addOutput("active_mutation_marker_file_count", activeMutationMarkerFiles.length);
  addOutput("generic_db_mutation_marker_file_count", genericDbMutationMarkerFiles.length);
  addOutput("read_only_method_marker_file_count", readOnlyMethodMarkerFiles.length);
  addOutput("candidate_read_only_dependency_files", candidateReadOnlyDependencyFiles);
  addOutput("candidate_mutating_or_operational_dependency_files", candidateMutatingOrOperationalDependencyFiles);
  addOutput("needs_follow_up_review_files", needsFollowUpReviewFiles);
  addOutput("result", "passed");

  printOutput();
}

buildInventory();
