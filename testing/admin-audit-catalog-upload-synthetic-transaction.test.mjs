#!/usr/bin/env node

import { createRequire } from "node:module";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const DEFAULT_SOURCE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function parseSourceRoot(argv) {
  if (argv.length === 0) return realpathSync(DEFAULT_SOURCE_ROOT);
  if (argv.length !== 2 || argv[0] !== "--source-root" || !argv[1]) {
    throw new Error(
      "usage: admin-audit-catalog-upload-synthetic-transaction.test.mjs [--source-root <dir>]",
    );
  }
  return realpathSync(path.resolve(argv[1]));
}

const SOURCE_ROOT = parseSourceRoot(process.argv.slice(2));
const failures = new Map();

const PATHS = {
  audit: "app/api/admin/audit-logs/handler.ts",
  submissions: "app/api/admin/submissions/handler.ts",
  tools: "app/api/admin/tools/handler.ts",
  upload: "app/api/admin/upload-logo/handler.ts",
};

const DOMAINS = [
  "AUDIT_ARCHIVE_UPLOAD_FAILURE",
  "AUDIT_ARCHIVE_METADATA_FAILURE_AND_ROLLBACK",
  "AUDIT_ARCHIVE_DELETE_FAILURE_AND_ROLLBACK",
  "AUDIT_ARCHIVE_CONCURRENCY_AND_IDEMPOTENCY",
  "CATALOG_PRIMARY_SUCCESS_AUDIT_FAILURE",
  "UPLOAD_STRUCTURAL_IMAGE_VALIDATION",
  "UPLOAD_POST_STORAGE_CLEANUP_AND_RETRY",
];

function isContained(candidate) {
  return candidate === SOURCE_ROOT || candidate.startsWith(`${SOURCE_ROOT}${path.sep}`);
}

function containedPath(relativePath) {
  const candidate = path.resolve(SOURCE_ROOT, relativePath);
  if (!isContained(candidate)) {
    throw new Error(`source path escapes source root: ${relativePath}`);
  }
  return candidate;
}

function source(relativePath) {
  const candidate = containedPath(relativePath);
  if (!existsSync(candidate)) return "";
  const resolved = realpathSync(candidate);
  if (!isContained(resolved)) {
    throw new Error(`resolved source path escapes source root: ${relativePath}`);
  }
  return readFileSync(resolved, "utf8");
}

function fail(domain, reason) {
  if (!failures.has(domain)) failures.set(domain, reason);
}

function expect(domain, condition, reason) {
  if (!condition) fail(domain, reason);
}

function stripImports(text) {
  return text.replace(/^import(?:[\s\S]*?from\s*)?["'][^"']+["'];?\s*$/gmu, "");
}

async function importSyntheticTypeScript(relativePath, prelude) {
  if (!existsSync(containedPath(relativePath))) return null;
  const output = ts.transpileModule(`${prelude}\n${stripImports(source(relativePath))}`, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      strict: true,
    },
    fileName: relativePath,
    reportDiagnostics: false,
  }).outputText;
  const encoded = Buffer.from(output, "utf8").toString("base64");
  return import(`data:text/javascript;base64,${encoded}#${encodeURIComponent(relativePath)}`);
}

const SYNTHETIC_PRELUDE = `
const NextResponse = {
  json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      status: init.status ?? 200,
      headers: { "content-type": "application/json", ...(init.headers || {}) },
    });
  },
};
const ADMIN_RATE_LIMIT_ACTIONS = {
  auditLogsRead: "audit-logs-read",
  auditLogsArchive: "audit-logs-archive",
  catalogSubmissions: "catalog-submissions",
  catalogTools: "catalog-tools",
  uploadLogo: "upload-logo",
};
class PublicLiveRouteSafetyError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
async function readBoundedRequestBody(request, maximumBytes) {
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > maximumBytes) {
    throw new PublicLiveRouteSafetyError("request_body_too_large");
  }
  return bytes;
}
function parseBoundedJsonBody(bytes) {
  return JSON.parse(new TextDecoder().decode(bytes));
}
async function parseBoundedFormData(bytes, contentType) {
  return new Response(bytes, { headers: { "content-type": contentType } }).formData();
}
`;

function authorizedSession() {
  return {
    isAdmin: true,
    actor: { id: "synthetic-admin", label: "Synthetic Admin" },
    errors: [],
  };
}

function allowedRateLimit() {
  return {
    allowed: true,
    limit: 100,
    remaining: 99,
    resetAt: 4_102_444_800_000,
    windowSeconds: 900,
  };
}

function adminRequest(method, body) {
  return new Request(`https://aifinder.test/api/admin/synthetic/${method.toLowerCase()}`, {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
}

async function responseBody(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function captureConsole(operation) {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  const events = [];
  console.error = (...values) => events.push(["error", ...values]);
  console.warn = (...values) => events.push(["warn", ...values]);
  console.info = (...values) => events.push(["info", ...values]);
  try {
    return { value: await operation(), events };
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
    console.info = originalInfo;
  }
}

function createGate() {
  let release;
  let entered;
  return {
    entered: new Promise((resolve) => {
      entered = resolve;
    }),
    wait: new Promise((resolve) => {
      release = resolve;
    }),
    signalEntered() {
      entered();
    },
    release() {
      release();
    },
  };
}

function syntheticAuditRow(id, details = {}) {
  return {
    id,
    action: "synthetic_action",
    target_type: "tool",
    target_id: String(id),
    target_name: `Synthetic ${id}`,
    details,
    ip_address: "127.0.0.1",
    user_agent: "synthetic",
    created_at: `2026-07-31T00:00:${String(id).padStart(2, "0")}.000Z`,
  };
}

function createAuditClient({
  failAt = null,
  uploadGate = null,
  archiveRows = null,
  deletedIds = null,
} = {}) {
  const calls = [];
  const defaultArchiveRow = syntheticAuditRow(1);
  const rows = archiveRows || [defaultArchiveRow];
  const returnedDeletedIds = deletedIds || rows.map((row) => row.id);

  class Query {
    constructor(table) {
      this.table = table;
      this.operation = null;
    }
    select(_projection, options = {}) {
      if (["live_delete", "metadata_delete"].includes(this.operation)) {
        return this;
      }
      this.operation = options.head ? "count" : "select";
      return this;
    }
    order() {
      return this;
    }
    limit() {
      return this;
    }
    insert() {
      this.operation = "metadata_insert";
      return this;
    }
    delete() {
      this.operation =
        this.table === "admin_audit_archives" ? "metadata_delete" : "live_delete";
      return this;
    }
    in() {
      return this;
    }
    eq() {
      return this;
    }
    async resolve() {
      if (this.operation === "count") {
        calls.push("count");
        return { count: 100 + rows.length, error: null };
      }
      if (this.operation === "select" && this.table === "admin_audit_logs") {
        calls.push("archive_fetch");
        return { data: rows, error: null };
      }
      if (this.operation === "metadata_insert") {
        calls.push("metadata_insert");
        if (failAt === "metadata_insert") throw new Error("fabricated_metadata_insert_throw");
        return { error: null };
      }
      if (this.operation === "live_delete") {
        calls.push("live_delete");
        if (failAt === "live_delete") throw new Error("fabricated_live_delete_throw");
        return {
          data: returnedDeletedIds.map((id) => ({ id })),
          error: null,
        };
      }
      if (this.operation === "metadata_delete") {
        calls.push("metadata_delete");
        return { error: failAt === "metadata_delete" ? { fabricated: true } : null };
      }
      throw new Error(`unmodeled fabricated audit query: ${this.table}:${this.operation}`);
    }
    then(resolve, reject) {
      return this.resolve().then(resolve, reject);
    }
  }

  const client = {
    from(table) {
      if (!["admin_audit_logs", "admin_audit_archives"].includes(table)) {
        throw new Error(`forbidden fabricated table: ${table}`);
      }
      return new Query(table);
    },
    storage: {
      from(bucket) {
        if (bucket !== "admin-audit-archives") {
          throw new Error(`forbidden fabricated bucket: ${bucket}`);
        }
        return {
          async upload() {
            calls.push("upload");
            if (uploadGate) {
              uploadGate.signalEntered();
              await uploadGate.wait;
            }
            if (failAt === "upload") throw new Error("fabricated_upload_throw");
            return { error: null };
          },
          async remove() {
            calls.push("object_remove");
            return { error: failAt === "object_remove" ? { fabricated: true } : null };
          },
        };
      },
    },
  };
  return { client, calls };
}

function auditDependencies(client) {
  return {
    verifySession: authorizedSession,
    verifyCsrf: () => true,
    checkRateLimit: allowedRateLimit,
    client,
    compressArchive: (text) => new TextEncoder().encode(text),
    now: () => new Date("2026-07-31T12:00:00.000Z"),
  };
}

function createMutationClient(expectedTable, row, calls) {
  return {
    from(table) {
      if (table !== expectedTable) throw new Error(`forbidden fabricated table: ${table}`);
      return {
        update(payload) {
          calls.push(["primary_write", payload]);
          return this;
        },
        eq() {
          return this;
        },
        is() {
          return this;
        },
        select() {
          return this;
        },
        async single() {
          return { data: row, error: null };
        },
      };
    },
  };
}

function createPngBytes() {
  return new Uint8Array(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  );
}

function createHeaderOnlyWebpBytes() {
  const bytes = new Uint8Array(30);
  const view = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode("RIFF"), 0);
  view.setUint32(4, 22, true);
  bytes.set(new TextEncoder().encode("WEBP"), 8);
  bytes.set(new TextEncoder().encode("VP8X"), 12);
  view.setUint32(16, 10, true);
  return bytes;
}

function createJpegBytes(scanBytes = [0x11]) {
  return new Uint8Array([
    0xff, 0xd8,
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
    ...scanBytes,
    0xff, 0xd9,
  ]);
}

function uploadRequest(bytes, name = "logo.png", type = "image/png") {
  const formData = new FormData();
  formData.append("file", new File([bytes], name, { type }));
  return new Request("https://aifinder.test/api/admin/upload-logo", {
    method: "POST",
    body: formData,
  });
}

const handlerSources = Object.fromEntries(
  Object.entries(PATHS).map(([name, relativePath]) => [name, source(relativePath)]),
);

for (const [name, text] of Object.entries(handlerSources)) {
  const relatedDomains =
    name === "audit"
      ? DOMAINS.slice(0, 4)
      : name === "upload"
        ? DOMAINS.slice(5)
        : ["CATALOG_PRIMARY_SUCCESS_AUDIT_FAILURE"];
  for (const domain of relatedDomains) {
    expect(
      domain,
      text.startsWith('import "server-only";') &&
        !/(supabase-admin|process\.env|createClient|service.?role)/iu.test(text),
      `${name} handler lacks a pure server-only injected capability boundary`,
    );
  }
}

expect(
  "AUDIT_ARCHIVE_METADATA_FAILURE_AND_ROLLBACK",
  handlerSources.audit.includes("removeArchiveObject") &&
    handlerSources.audit.includes("compensation_failed"),
  "audit metadata compensation markers are absent",
);
expect(
  "AUDIT_ARCHIVE_DELETE_FAILURE_AND_ROLLBACK",
  handlerSources.audit.includes("deleteArchiveMetadata") &&
    handlerSources.audit.includes("removeArchiveObject"),
  "audit delete compensation markers are absent",
);
expect(
  "UPLOAD_STRUCTURAL_IMAGE_VALIDATION",
  ["validatePngStructure", "validateJpegStructure", "validateWebpStructure", "MAX_IMAGE_DIMENSION"].every(
    (marker) => handlerSources.upload.includes(marker),
  ),
  "structural image validators are absent",
);

const modules = {};
for (const [name, relativePath] of Object.entries(PATHS)) {
  try {
    modules[name] = await importSyntheticTypeScript(relativePath, SYNTHETIC_PRELUDE);
  } catch (error) {
    modules[name] = null;
    const relatedDomains =
      name === "audit"
        ? DOMAINS.slice(0, 4)
        : name === "upload"
          ? DOMAINS.slice(5)
          : ["CATALOG_PRIMARY_SUCCESS_AUDIT_FAILURE"];
    for (const domain of relatedDomains) {
      fail(domain, `${name} handler could not be loaded synthetically: ${error?.name || "load_failure"}`);
    }
  }
}

const capabilityGuard = { networkCalls: 0 };
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  capabilityGuard.networkCalls += 1;
  throw new Error("synthetic test forbids network access");
};

try {
  const auditFactory = modules.audit?.createAdminAuditLogsHandler;
  if (typeof auditFactory !== "function") {
    for (const domain of DOMAINS.slice(0, 4)) fail(domain, "audit handler factory export is absent");
  } else {
    for (const scenario of [
      {
        domain: "AUDIT_ARCHIVE_UPLOAD_FAILURE",
        failAt: "upload",
        expectedCalls: ["count", "archive_fetch", "upload"],
        expectedEvent: "audit_logs_archive_upload_failed",
      },
      {
        domain: "AUDIT_ARCHIVE_METADATA_FAILURE_AND_ROLLBACK",
        failAt: "metadata_insert",
        expectedCalls: ["count", "archive_fetch", "upload", "metadata_insert", "object_remove"],
        expectedEvent: "audit_logs_archive_metadata_failed",
      },
      {
        domain: "AUDIT_ARCHIVE_DELETE_FAILURE_AND_ROLLBACK",
        failAt: "live_delete",
        expectedCalls: [
          "count",
          "archive_fetch",
          "upload",
          "metadata_insert",
          "live_delete",
          "metadata_delete",
          "object_remove",
        ],
        expectedEvent: "audit_logs_archive_delete_failed",
      },
    ]) {
      try {
        const fabricated = createAuditClient({ failAt: scenario.failAt });
        const handler = auditFactory(auditDependencies(fabricated.client));
        const captured = await captureConsole(() => handler.POST(adminRequest("POST")));
        const body = await responseBody(captured.value);
        expect(
          scenario.domain,
          captured.value.status === 500 &&
            body?.error === "ARCHIVE_FAILED" &&
            fabricated.calls.join(",") === scenario.expectedCalls.join(",") &&
            captured.events.some(
              ([method, event]) => method === "error" && event === scenario.expectedEvent,
            ),
          `actual audit factory did not fail closed and compensate at ${scenario.failAt}`,
        );
      } catch (error) {
        fail(scenario.domain, `actual audit factory threw at ${scenario.failAt}: ${error?.name || "failure"}`);
      }
    }

    try {
      const fabricated = createAuditClient({
        archiveRows: [
          syntheticAuditRow(1, {
            oversized: "é".repeat(3 * 1024 * 1024),
          }),
        ],
      });
      const handler = auditFactory(auditDependencies(fabricated.client));
      const captured = await captureConsole(() => handler.POST(adminRequest("POST")));
      const body = await responseBody(captured.value);
      expect(
        "AUDIT_ARCHIVE_UPLOAD_FAILURE",
        captured.value.status === 500 &&
          body?.error === "ARCHIVE_FAILED" &&
          fabricated.calls.join(",") === "count,archive_fetch" &&
          captured.events.some(
            ([method, event]) =>
              method === "error" && event === "audit_logs_archive_payload_too_large",
          ),
        "actual audit factory did not reject an oversized UTF-8 archive before compression/upload",
      );
    } catch (error) {
      fail(
        "AUDIT_ARCHIVE_UPLOAD_FAILURE",
        `oversized archive execution threw: ${error?.name || "failure"}`,
      );
    }

    for (const mismatch of [
      {
        label: "zero",
        rows: [syntheticAuditRow(1)],
        deletedIds: [],
      },
      {
        label: "partial",
        rows: [syntheticAuditRow(1), syntheticAuditRow(2)],
        deletedIds: [1],
      },
    ]) {
      try {
        const fabricated = createAuditClient({
          archiveRows: mismatch.rows,
          deletedIds: mismatch.deletedIds,
        });
        const handler = auditFactory(auditDependencies(fabricated.client));
        const captured = await captureConsole(() => handler.POST(adminRequest("POST")));
        const body = await responseBody(captured.value);
        expect(
          "AUDIT_ARCHIVE_DELETE_FAILURE_AND_ROLLBACK",
          captured.value.status === 500 &&
            body?.error === "ARCHIVE_FAILED" &&
            fabricated.calls.join(",") ===
              "count,archive_fetch,upload,metadata_insert,live_delete" &&
            captured.events.some(
              ([method, event]) =>
                method === "error" && event === "audit_logs_archive_delete_mismatch",
            ),
          `actual audit factory committed or removed the archive after a ${mismatch.label}-row delete result`,
        );
      } catch (error) {
        fail(
          "AUDIT_ARCHIVE_DELETE_FAILURE_AND_ROLLBACK",
          `${mismatch.label}-row delete mismatch execution threw: ${error?.name || "failure"}`,
        );
      }
    }

    try {
      const gate = createGate();
      const fabricated = createAuditClient({ uploadGate: gate });
      const handler = auditFactory(auditDependencies(fabricated.client));
      const captured = await captureConsole(async () => {
        const first = handler.POST(adminRequest("POST"));
        await gate.entered;
        const second = handler.POST(adminRequest("POST"));
        gate.release();
        return Promise.all([first, second]);
      });
      const bodies = await Promise.all(captured.value.map(responseBody));
      expect(
        "AUDIT_ARCHIVE_CONCURRENCY_AND_IDEMPOTENCY",
        captured.value.every((response) => response.status === 200) &&
          bodies.every(
            (body) => body?.result === "ARCHIVE_COMPLETED" && body?.archived_count === 1,
          ) &&
          fabricated.calls.join(",") ===
            "count,archive_fetch,upload,metadata_insert,live_delete" &&
          captured.events.some(
            ([method, event]) =>
              method === "info" && event === "audit_logs_archive_already_in_progress",
          ),
        "actual audit factory did not coalesce concurrent archive requests into one transaction",
      );
    } catch (error) {
      fail(
        "AUDIT_ARCHIVE_CONCURRENCY_AND_IDEMPOTENCY",
        `actual concurrent audit factory execution threw: ${error?.name || "failure"}`,
      );
    }
  }

  const submissionsFactory = modules.submissions?.createAdminSubmissionsHandler;
  const toolsFactory = modules.tools?.createAdminToolsHandler;
  if (typeof submissionsFactory !== "function" || typeof toolsFactory !== "function") {
    fail("CATALOG_PRIMARY_SUCCESS_AUDIT_FAILURE", "catalog handler factory export is absent");
  } else {
    try {
      const submissionCalls = [];
      const submissions = submissionsFactory({
        verifySession: authorizedSession,
        verifyCsrf: () => true,
        checkRateLimit: allowedRateLimit,
        client: createMutationClient(
          "submitted_tools",
          { id: 7, name: "Synthetic Submission", website: "https://submission.test" },
          submissionCalls,
        ),
        async writeAudit() {
          submissionCalls.push(["audit"]);
          throw new Error("fabricated audit rejection");
        },
      });
      const toolCalls = [];
      const tools = toolsFactory({
        verifySession: authorizedSession,
        verifyCsrf: () => true,
        checkRateLimit: allowedRateLimit,
        client: createMutationClient(
          "tools",
          { id: 8, name: "Synthetic Tool", website: "https://tool.test" },
          toolCalls,
        ),
        async writeAudit() {
          toolCalls.push(["audit"]);
          throw new Error("fabricated audit rejection");
        },
        now: () => new Date("2026-07-31T12:00:00.000Z"),
      });
      const captured = await captureConsole(async () => {
        const submissionResponse = await submissions.PATCH(
          adminRequest("PATCH", { submissionId: 7 }),
        );
        const toolResponse = await tools.DELETE(adminRequest("DELETE", { id: 8 }));
        return [submissionResponse, toolResponse];
      });
      const [submissionBody, toolBody] = await Promise.all(
        captured.value.map(responseBody),
      );
      expect(
        "CATALOG_PRIMARY_SUCCESS_AUDIT_FAILURE",
        captured.value.every((response) => response.status === 200) &&
          submissionBody?.success === true &&
          toolBody?.success === true &&
          submissionCalls.map(([name]) => name).join(",") === "primary_write,audit" &&
          toolCalls.map(([name]) => name).join(",") === "primary_write,audit" &&
          captured.events.some(([, event]) => event === "admin_submissions_audit_write_failed") &&
          captured.events.some(([, event]) => event === "admin_tools_audit_write_failed"),
        "actual catalog factories did not preserve committed primary success across audit rejection",
      );
    } catch (error) {
      fail(
        "CATALOG_PRIMARY_SUCCESS_AUDIT_FAILURE",
        `actual catalog factory execution threw: ${error?.name || "failure"}`,
      );
    }
  }

  const uploadFactory = modules.upload?.createAdminUploadLogoHandler;
  if (typeof uploadFactory !== "function") {
    for (const domain of DOMAINS.slice(5)) fail(domain, "upload handler factory export is absent");
  } else {
    try {
      const storageCalls = [];
      const handler = uploadFactory({
        verifySession: authorizedSession,
        verifyCsrf: () => true,
        checkRateLimit: allowedRateLimit,
        storage: {
          async upload() {
            storageCalls.push("upload");
            return { error: null };
          },
          async remove() {
            storageCalls.push("remove");
            return { error: null };
          },
          getPublicUrl() {
            storageCalls.push("public_url");
            return { data: { publicUrl: "https://cdn.test/invalid" } };
          },
        },
        async writeAudit() {
          storageCalls.push("audit");
        },
        createObjectName() {
          storageCalls.push("object_name");
          return "admin/invalid.png";
        },
      });
      const corruptCrcPng = createPngBytes();
      corruptCrcPng[29] ^= 0x01;
      const invalidSosLengthJpeg = createJpegBytes([0x11]);
      invalidSosLengthJpeg[18] = 0x07;
      const validateJpeg = modules.upload?.validateJpegStructure;
      expect(
        "UPLOAD_STRUCTURAL_IMAGE_VALIDATION",
        typeof validateJpeg === "function" &&
          validateJpeg(createJpegBytes([0x11, 0xff, 0x00, 0xff, 0xd0, 0x22])),
        "actual JPEG validator rejected fabricated entropy bytes with stuffing and a restart marker",
      );
      const captured = await captureConsole(async () => [
        await handler.POST(
          uploadRequest(
            new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
            "signature-only.png",
          ),
        ),
        await handler.POST(uploadRequest(corruptCrcPng, "corrupt-crc.png")),
        await handler.POST(
          uploadRequest(
            createHeaderOnlyWebpBytes(),
            "header-only.webp",
            "image/webp",
          ),
        ),
        await handler.POST(
          uploadRequest(createJpegBytes([]), "no-scan-data.jpg", "image/jpeg"),
        ),
        await handler.POST(
          uploadRequest(
            invalidSosLengthJpeg,
            "invalid-sos-length.jpg",
            "image/jpeg",
          ),
        ),
        await handler.POST(
          uploadRequest(
            createJpegBytes([0x11, 0xff, 0xc4, 0x22]),
            "unescaped-marker.jpg",
            "image/jpeg",
          ),
        ),
      ]);
      const bodies = await Promise.all(captured.value.map(responseBody));
      const structureEvents = captured.events.filter(
        ([method, event]) =>
          method === "warn" && event === "admin_logo_upload_image_structure_invalid",
      );
      expect(
        "UPLOAD_STRUCTURAL_IMAGE_VALIDATION",
        captured.value.every((response) => response.status === 400) &&
          bodies.every(
            (body) =>
              body?.error ===
              "Invalid image file. Please upload a real PNG, JPG, JPEG, or WEBP image.",
          ) &&
          storageCalls.length === 0 &&
          structureEvents.length === 6,
        "actual upload factory accepted incomplete, CRC-corrupt, header-only, invalid-SOS, no-scan, or unescaped-marker image bytes",
      );
    } catch (error) {
      fail(
        "UPLOAD_STRUCTURAL_IMAGE_VALIDATION",
        `actual upload structural validation threw: ${error?.name || "failure"}`,
      );
    }

    try {
      const calls = [];
      let objectCounter = 0;
      let auditAttempt = 0;
      const handler = uploadFactory({
        verifySession: authorizedSession,
        verifyCsrf: () => true,
        checkRateLimit: allowedRateLimit,
        storage: {
          async upload(objectName) {
            calls.push(`upload:${objectName}`);
            return { error: null };
          },
          async remove([objectName]) {
            calls.push(`remove:${objectName}`);
            return { error: null };
          },
          getPublicUrl(objectName) {
            calls.push(`public_url:${objectName}`);
            return { data: { publicUrl: `https://cdn.test/${objectName}` } };
          },
        },
        async writeAudit(input) {
          auditAttempt += 1;
          calls.push(`audit:${input.targetId}`);
          if (auditAttempt === 1) throw new Error("fabricated post-upload audit rejection");
        },
        createObjectName() {
          objectCounter += 1;
          return `admin/synthetic-${objectCounter}.png`;
        },
      });
      const captured = await captureConsole(async () => {
        const first = await handler.POST(uploadRequest(createPngBytes(), "first.png"));
        const second = await handler.POST(uploadRequest(createPngBytes(), "retry.png"));
        return [first, second];
      });
      const [firstBody, secondBody] = await Promise.all(captured.value.map(responseBody));
      expect(
        "UPLOAD_POST_STORAGE_CLEANUP_AND_RETRY",
        captured.value[0].status === 500 &&
          firstBody?.error === "Logo upload failed. Please try again." &&
          captured.value[1].status === 200 &&
          secondBody?.success === true &&
          secondBody?.logoUrl === "https://cdn.test/admin/synthetic-2.png" &&
          calls.join(",") ===
            "upload:admin/synthetic-1.png,public_url:admin/synthetic-1.png,audit:admin/synthetic-1.png,remove:admin/synthetic-1.png,upload:admin/synthetic-2.png,public_url:admin/synthetic-2.png,audit:admin/synthetic-2.png" &&
          captured.events.some(
            ([method, event]) =>
              method === "error" && event === "admin_logo_upload_post_upload_failure",
          ),
        "actual upload factory did not clean the failed object and retry with a fresh name",
      );
    } catch (error) {
      fail(
        "UPLOAD_POST_STORAGE_CLEANUP_AND_RETRY",
        `actual upload cleanup/retry execution threw: ${error?.name || "failure"}`,
      );
    }
  }
} finally {
  globalThis.fetch = originalFetch;
}

for (const domain of DOMAINS) {
  expect(
    domain,
    capabilityGuard.networkCalls === 0,
    "synthetic factory execution attempted a real network capability",
  );
}

for (const domain of DOMAINS) {
  if (failures.has(domain)) process.stderr.write(`${domain} ${failures.get(domain)}\n`);
}

if (failures.size > 0) {
  process.stderr.write(
    `RED_ADMIN_AUDIT_CATALOG_UPLOAD domains=${failures.size}/7 expected=7 no_missing_module_errors=true\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write("PASS_ADMIN_AUDIT_CATALOG_UPLOAD_SYNTHETIC domains=7/7\n");
}
