import { execFileSync } from "node:child_process";

const ENV = process.env;

const REQUIRED = {
  optIn: "AIFINDER_RUN_CANDIDATE_DECISION_READ_ONLY_LISTING_GATE",
  phase: "AIFINDER_CANDIDATE_DECISION_LISTING_PHASE",
  expectedCommit: "AIFINDER_CANDIDATE_DECISION_LISTING_EXPECTED_COMMIT",
  status: "AIFINDER_CANDIDATE_DECISION_LISTING_STATUS",
  limit: "AIFINDER_CANDIDATE_DECISION_LISTING_LIMIT",
  publicPublishing: "AIFINDER_CANDIDATE_DECISION_PUBLIC_PUBLISHING_ALLOWED",
  approveForDraft: "AIFINDER_CANDIDATE_DECISION_APPROVE_FOR_DRAFT_ALLOWED",
  cleanup: "AIFINDER_CANDIDATE_DECISION_CLEANUP_ALLOWED",
  execution: "AIFINDER_CANDIDATE_DECISION_EXECUTION_ALLOWED",
  approvalPhrase: "AIFINDER_CANDIDATE_DECISION_LISTING_APPROVAL_PHRASE",
};

const TABLE_NAME = "discovery_candidate_tools";
const STATUS_ALLOWLIST = new Set(["staged"]);
const SELECT_FIELDS = [
  "id",
  "candidate_status",
  "created_at",
  "updated_at",
];

function safeValue(value) {
  return String(value ?? "")
    .replace(/[\r\n\t]/g, " ")
    .replace(/[^\x20-\x7E]/g, "?")
    .slice(0, 300);
}

function failLocked(reason) {
  console.log("LIVE_CANDIDATE_LISTING_READ_ONLY_FAIL_LOCKED");
  console.log(`reason=${safeValue(reason)}`);
  process.exit(1);
}

function requireEnv(name) {
  const value = ENV[name];
  if (value === undefined || value === "") {
    failLocked(`missing ${name}`);
  }
  return value;
}

function validatePhaseToken(value) {
  if (!/^(?:Phase)?[0-9]{1,3}[A-Z]{1,3}$/.test(value)) {
    failLocked("invalid phase token");
  }
}

function phaseForPhrase(value) {
  return value.startsWith("Phase") ? value.slice("Phase".length) : value;
}

function validateCommit(value) {
  if (!/^[a-f0-9]{7,40}$/.test(value)) {
    failLocked("invalid expected commit");
  }
}

function validateLimit(value) {
  if (!/^[0-9]+$/.test(value)) {
    failLocked("invalid limit");
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 10) {
    failLocked("limit outside allowed range");
  }

  return parsed;
}

function requireFalse(name) {
  const value = requireEnv(name);
  if (value !== "false") {
    failLocked(`${name} must remain false`);
  }
}

function verifyRepository(expectedCommit) {
  let status = "";
  let shortCommit = "";
  let fullCommit = "";

  try {
    status = execFileSync("git", ["status", "--short", "--branch"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();

    shortCommit = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();

    fullCommit = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    failLocked("git repository verification failed");
  }

  if (status !== "## main...origin/main") {
    failLocked("repository must be clean and synced with origin/main");
  }

  if (shortCommit !== expectedCommit && fullCommit !== expectedCommit) {
    failLocked("current commit does not match expected commit");
  }

  return shortCommit;
}

function getSupabaseConfig() {
  const url = ENV.NEXT_PUBLIC_SUPABASE_URL || ENV.SUPABASE_URL;
  const key = ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_SERVICE_ROLE || ENV.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    failLocked("missing Supabase configuration");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    failLocked("invalid Supabase URL");
  }

  if (!["https:", "http:"].includes(parsedUrl.protocol)) {
    failLocked("unsupported Supabase URL protocol");
  }

  return {
    url: parsedUrl.origin,
    key,
  };
}

function buildListingUrl(baseUrl, status, limit) {
  const query = new URLSearchParams();
  query.set("select", SELECT_FIELDS.join(","));
  query.set("candidate_status", `eq.${status}`);
  query.append("order", "created_at.asc");
  query.append("order", "id.asc");
  query.set("limit", String(limit));
  return `${baseUrl}/rest/v1/${TABLE_NAME}?${query.toString()}`;
}

function printNoResults({ phase, commit, status, limit }) {
  console.log("LIVE_CANDIDATE_LISTING_READ_ONLY_NO_RESULTS");
  console.log(`phase=${safeValue(phase)}`);
  console.log(`commit=${safeValue(commit)}`);
  console.log(`status_filter=${safeValue(status)}`);
  console.log(`limit=${safeValue(limit)}`);
  console.log("count=0");
  console.log("NO_CANDIDATE_SELECTED_BY_LISTING");
}

function printRows({ phase, commit, status, limit, rows }) {
  console.log("LIVE_CANDIDATE_LISTING_READ_ONLY_PASS");
  console.log(`phase=${safeValue(phase)}`);
  console.log(`commit=${safeValue(commit)}`);
  console.log(`status_filter=${safeValue(status)}`);
  console.log(`limit=${safeValue(limit)}`);
  console.log(`count=${rows.length}`);
  console.log("NO_CANDIDATE_SELECTED_BY_LISTING");

  rows.forEach((row, index) => {
    const number = index + 1;
    console.log(`candidate[${number}].id=${safeValue(row.id)}`);
    console.log(`candidate[${number}].status=${safeValue(row.candidate_status)}`);
    console.log(`candidate[${number}].name=`);
    console.log(`candidate[${number}].url=`);
    console.log(`candidate[${number}].source=`);
    console.log(`candidate[${number}].created_at=${safeValue(row.created_at)}`);
    console.log(`candidate[${number}].updated_at=${safeValue(row.updated_at)}`);
  });
}

async function run() {
  if (ENV[REQUIRED.optIn] !== "1") {
    failLocked("missing opt-in");
  }

  const phase = requireEnv(REQUIRED.phase);
  validatePhaseToken(phase);

  const expectedCommit = requireEnv(REQUIRED.expectedCommit);
  validateCommit(expectedCommit);

  const status = requireEnv(REQUIRED.status);
  if (!STATUS_ALLOWLIST.has(status)) {
    failLocked("unsupported status filter");
  }

  const limit = validateLimit(requireEnv(REQUIRED.limit));

  requireFalse(REQUIRED.publicPublishing);
  requireFalse(REQUIRED.approveForDraft);
  requireFalse(REQUIRED.cleanup);
  requireFalse(REQUIRED.execution);

  const approvalPhrase = requireEnv(REQUIRED.approvalPhrase);
  const expectedPhrase = `Approve Phase ${phaseForPhrase(phase)} read-only candidate listing gate status ${status} limit ${limit}`;
  if (approvalPhrase !== expectedPhrase) {
    failLocked("approval phrase mismatch");
  }

  const currentCommit = verifyRepository(expectedCommit);
  const supabase = getSupabaseConfig();

  if (typeof fetch !== "function") {
    failLocked("fetch unavailable");
  }

  const response = await fetch(buildListingUrl(supabase.url, status, limit), {
    method: "GET",
    headers: {
      apikey: supabase.key,
      Authorization: `Bearer ${supabase.key}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    failLocked(`read-only query failed with status ${response.status}`);
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) {
    failLocked("unexpected query response shape");
  }

  if (rows.length === 0) {
    printNoResults({ phase, commit: currentCommit, status, limit });
    return;
  }

  printRows({ phase, commit: currentCommit, status, limit, rows });
}

run().catch(() => {
  failLocked("unexpected safe failure");
});
