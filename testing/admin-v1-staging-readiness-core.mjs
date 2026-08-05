import { createHash } from "node:crypto";

const ENVIRONMENT_NAMES = Object.freeze([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
]);
const ENVIRONMENT_NAME_SET = new Set(ENVIRONMENT_NAMES);
const TABLE_REQUIREMENTS = Object.freeze({
  tools: Object.freeze([
    "id",
    "name",
    "slug",
    "normalized_domain",
    "category",
    "description",
    "website",
    "pricing",
    "logo_url",
    "status",
    "deleted_at",
    "platforms",
    "featured",
    "best_for",
    "use_cases",
  ]),
  submitted_tools: Object.freeze([
    "id",
    "name",
    "category",
    "description",
    "website",
    "pricing",
    "logo_url",
    "submitter_name",
    "submitter_email",
    "status",
    "created_at",
    "normalized_domain",
  ]),
  admin_audit_logs: Object.freeze([
    "id",
    "action",
    "target_type",
    "target_id",
    "target_name",
    "details",
    "ip_address",
    "user_agent",
    "created_at",
  ]),
});

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function digestNames(names) {
  return createHash("sha256")
    .update([...names].sort().join("\n"), "utf8")
    .digest("hex");
}

function parseValue(rawValue) {
  if (rawValue.endsWith("\\")) fail("ENVIRONMENT_MULTILINE_VALUE");
  const quote = rawValue[0];
  if (quote === '"' || quote === "'") {
    if (rawValue.length < 2 || rawValue.at(-1) !== quote) {
      fail("ENVIRONMENT_MULTILINE_VALUE");
    }
    const value = rawValue.slice(1, -1);
    if (value.includes(quote)) fail("ENVIRONMENT_QUOTED_VALUE");
    return value;
  }
  if (rawValue.endsWith('"') || rawValue.endsWith("'")) {
    fail("ENVIRONMENT_QUOTED_VALUE");
  }
  return rawValue;
}

function resolveReference(document, reference) {
  if (typeof reference !== "string" || !reference.startsWith("#/")) return null;
  let current = document;
  for (const encodedPart of reference.slice(2).split("/")) {
    const part = encodedPart.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!current || typeof current !== "object" || !Object.hasOwn(current, part)) {
      return null;
    }
    current = current[part];
  }
  return current;
}

function containsRpcInput(node, document, visited = new Set()) {
  if (!node || typeof node !== "object" || visited.has(node)) return false;
  visited.add(node);
  if (node.name === "submission_id") return true;
  if (
    node.properties &&
    typeof node.properties === "object" &&
    Object.hasOwn(node.properties, "submission_id")
  ) return true;
  if (typeof node.$ref === "string") {
    const resolved = resolveReference(document, node.$ref);
    if (resolved && containsRpcInput(resolved, document, visited)) return true;
  }
  return Object.values(node).some((value) =>
    value && typeof value === "object"
      ? containsRpcInput(value, document, visited)
      : false
  );
}

function observedProperties(document, tableName) {
  const candidates = [
    document?.definitions?.[tableName]?.properties,
    document?.components?.schemas?.[tableName]?.properties,
  ];
  const properties = candidates.find(
    (candidate) => candidate && typeof candidate === "object" && !Array.isArray(candidate),
  );
  return properties ? Object.keys(properties).sort() : [];
}

function normalizedJson(value) {
  if (Array.isArray(value)) return value.map(normalizedJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalizedJson(value[key])]),
    );
  }
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) return value;
  fail("CANONICAL_JSON_VALUE");
}

export function parseStrictEnvironmentText(text) {
  if (typeof text !== "string") fail("ENVIRONMENT_TEXT");
  if (text.includes("\0")) fail("ENVIRONMENT_NUL");
  if (text.includes("\r")) fail("ENVIRONMENT_LINE_ENDING");
  if (text.includes("$(") || text.includes("`")) {
    fail("ENVIRONMENT_COMMAND_SUBSTITUTION");
  }

  const seen = new Set();
  const selected = {};
  for (const line of text.split("\n")) {
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    const assignment = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/u);
    if (!assignment) fail("ENVIRONMENT_SYNTAX");
    const key = assignment[1];
    if (seen.has(key)) fail("ENVIRONMENT_DUPLICATE_KEY");
    seen.add(key);
    if (!ENVIRONMENT_NAME_SET.has(key)) continue;
    selected[key] = parseValue(assignment[2]);
  }
  if (!ENVIRONMENT_NAMES.every((name) => Object.hasOwn(selected, name))) {
    fail("ENVIRONMENT_REQUIRED_VARIABLE");
  }
  return Object.freeze({ ...selected });
}

export function deriveSupabaseTargetIdentity(urlValue) {
  let parsed;
  try {
    parsed = new URL(urlValue);
  } catch {
    fail("SUPABASE_URL");
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.search !== "" ||
    parsed.hash !== "" ||
    parsed.pathname !== "/" ||
    parsed.port !== ""
  ) fail("SUPABASE_URL");
  const match = parsed.hostname.match(/^([a-z0-9]+)\.supabase\.co$/u);
  if (!match) fail("SUPABASE_HOSTNAME");
  return Object.freeze({
    project_ref: match[1],
    normalized_origin: parsed.origin,
    project_ref_sha256: createHash("sha256").update(match[1], "utf8").digest("hex"),
    origin_sha256: createHash("sha256").update(parsed.origin, "utf8").digest("hex"),
  });
}

export function classifyEnvironmentReadiness(environment) {
  const target = deriveSupabaseTargetIdentity(environment.NEXT_PUBLIC_SUPABASE_URL);
  const anon = environment.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = environment.SUPABASE_SERVICE_ROLE_KEY;
  const password = environment.ADMIN_PASSWORD;
  const session = environment.ADMIN_SESSION_SECRET;
  const trimmedMinimum = (value, minimum) =>
    typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value &&
    Buffer.byteLength(value, "utf8") >= minimum;
  const categories = Object.freeze({
    NEXT_PUBLIC_SUPABASE_URL: true,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: trimmedMinimum(anon, 32),
    SUPABASE_SERVICE_ROLE_KEY: trimmedMinimum(service, 32),
    ADMIN_PASSWORD:
      trimmedMinimum(password, 16) &&
      password.trim() !== "" &&
      !/^(?:admin|password|changeme|replace-me|example)$/iu.test(password),
    ADMIN_SESSION_SECRET: trimmedMinimum(session, 32),
  });
  const serviceRoleDistinctFromAnon = service !== anon;
  const sessionSecretDistinctFromPassword = session !== password;
  return Object.freeze({
    ready:
      Object.values(categories).every(Boolean) &&
      serviceRoleDistinctFromAnon &&
      sessionSecretDistinctFromPassword,
    target,
    variable_names: ENVIRONMENT_NAMES,
    categories,
    length_buckets: Object.freeze({
      NEXT_PUBLIC_SUPABASE_ANON_KEY: categories.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "AT_LEAST_32_BYTES"
        : "BELOW_32_BYTES_OR_UNTRIMMED",
      SUPABASE_SERVICE_ROLE_KEY: categories.SUPABASE_SERVICE_ROLE_KEY
        ? "AT_LEAST_32_BYTES"
        : "BELOW_32_BYTES_OR_UNTRIMMED",
      ADMIN_PASSWORD: categories.ADMIN_PASSWORD
        ? "AT_LEAST_16_BYTES_NON_PLACEHOLDER"
        : "NOT_READY",
      ADMIN_SESSION_SECRET: categories.ADMIN_SESSION_SECRET
        ? "AT_LEAST_32_BYTES"
        : "BELOW_32_BYTES_OR_UNTRIMMED",
    }),
    service_role_distinct_from_anon: serviceRoleDistinctFromAnon,
    session_secret_distinct_from_password: sessionSecretDistinctFromPassword,
  });
}

export function validateOpenApiContract(document) {
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    fail("OPENAPI_DOCUMENT");
  }
  const tableResults = {};
  for (const [tableName, required] of Object.entries(TABLE_REQUIREMENTS)) {
    const observed = observedProperties(document, tableName);
    const pathPresent = Boolean(document.paths?.[`/${tableName}`]);
    const requiredPresent = required.every((name) => observed.includes(name));
    tableResults[tableName] = Object.freeze({
      path_present: pathPresent,
      required_present: requiredPresent,
      required_count: required.length,
      observed_count: observed.length,
      required_property_set_sha256: digestNames(required),
      observed_property_set_sha256: digestNames(observed),
    });
  }
  const rpcPath = document.paths?.["/rpc/approve_submitted_tool"];
  const rpc = Object.freeze({
    path_present: Boolean(rpcPath),
    submission_id_input_present: containsRpcInput(rpcPath, document),
  });
  return Object.freeze({
    ready:
      Object.values(tableResults).every(
        (result) => result.path_present && result.required_present,
      ) &&
      rpc.path_present &&
      rpc.submission_id_input_present,
    openapi_present: true,
    tables: Object.freeze(tableResults),
    rpc,
  });
}

export function validateTableProbeContract(status, bodyText) {
  if (!Number.isInteger(status) || status < 200 || status >= 300) {
    fail("TABLE_PROBE_STATUS");
  }
  if (typeof bodyText !== "string") fail("TABLE_PROBE_BODY");
  const trimmed = bodyText.trim();
  if (trimmed === "") {
    return Object.freeze({ status, status_category: "SUCCESS_2XX", zero_rows: true });
  }
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    fail("TABLE_PROBE_JSON");
  }
  if (!Array.isArray(parsed) || parsed.length !== 0) fail("TABLE_PROBE_ROWS");
  return Object.freeze({ status, status_category: "SUCCESS_2XX", zero_rows: true });
}

export function validateStorageBucketContract(bucket) {
  if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) {
    fail("STORAGE_BUCKET");
  }
  const identityReady = bucket.id === "tool-logos" && bucket.name === "tool-logos";
  const publicReady = bucket.public === true;
  const sizeReady =
    bucket.file_size_limit === null ||
    (Number.isFinite(bucket.file_size_limit) && bucket.file_size_limit >= 2_097_152);
  const requiredMimeTypes = ["image/png", "image/jpeg", "image/webp"];
  const mimeReady =
    bucket.allowed_mime_types === null ||
    (Array.isArray(bucket.allowed_mime_types) &&
      requiredMimeTypes.every((mime) => bucket.allowed_mime_types.includes(mime)));
  return Object.freeze({
    ready: identityReady && publicReady && sizeReady && mimeReady,
    bucket_name: "tool-logos",
    identity_ready: identityReady,
    public_ready: publicReady,
    file_size_limit_ready: sizeReady,
    mime_types_ready: mimeReady,
  });
}

export function canonicalJson(value) {
  return `${JSON.stringify(normalizedJson(value), null, 2)}\n`;
}
