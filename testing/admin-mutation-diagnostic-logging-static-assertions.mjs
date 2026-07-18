#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const TEST_FILE = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(TEST_FILE), "..");

const UPLOAD_PATH = "app/api/admin/upload-logo/route.ts";
const DECISION_PATH =
  "app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts";
const DECISION_CONTRACT_PATH =
  "testing/discovery-candidate-decision-route-export-contract-static-assertions.mjs";
const CATALOG_CONTRACT_PATH =
  "testing/admin-catalog-route-error-boundary-static-assertions.mjs";
const RATE_LIMIT_PATH = "lib/admin-rate-limit.ts";
const VALIDATION_PATH =
  "lib/discovery/discovery-candidate-decision-validation.ts";

const BASELINE_HASHES = new Map([
  [UPLOAD_PATH, "98c642a9a8d19e1520d9ea1b88f55bb83e36b9fdba33ae1029f02d972723491e"],
  [DECISION_PATH, "2b90a0ce7c29d9a5db24cbbe52c631ac8f4e2f8075221948cd08b1456fcf8d1b"],
  [DECISION_CONTRACT_PATH, "e9f944e81e93c6bc7946b89dfc58b8845557fb18e6747f8955c173a632664c53"],
  [CATALOG_CONTRACT_PATH, "60fcd65247e262ebe99d4d1a4e36af1b287d8dba812e73c19f67b836185daddf"],
]);

const PROTECTED_HASHES = new Map([
  ["lib/admin-auth.ts", "b00a3c0f3b4728647e3fea202c2e3b57663a4e567888b828a765df4ba83181dc"],
  [RATE_LIMIT_PATH, "83005203a7aa47b7af6d77ff96519524a3f08341649257fe125d44c3ad3e670b"],
  ["lib/supabase-admin.ts", "fea8f1b29460bdf245321e6dec80091dc63dd119fa17bface6f6d4980749dbae"],
  ["lib/admin-audit-log.ts", "545ebc99f886918fc579b0b050cff12ad16ca283bbb3437e7505a27bd86bd6e3"],
  ["lib/discovery/discovery-candidate-decision-admin.ts", "6a72897846ae6276523726bc5f9fb99b7de6b7f9db386c5b3cf0655dd0905b96"],
  [VALIDATION_PATH, "922d9d3b70a6975c42725b7708f16ce9de2ea37c4a7111ad8c4919528ca17339"],
  ["lib/supabase/database.types.ts", "7173e35d74fa7f59ff3469c2d7e1c95984cfcf37c00b934b1b48ec0f39f1d72c"],
  ["supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql", "7b3cbb1234aa0e492f366baa5e340bda174b619ede1cfb48616658a0f631651f"],
  ["testing/discovery-candidate-decision-api-static-assertions.mjs", "71ea505fd0ddd061b926d1976ed8d0a5fa2729ef2d59ad4bb91d5ed8114c4f8a"],
  ["testing/admin-shell-supabase-read-hardening.test.mjs", "85e2207dd61820862c998c9cd4f2fc118cb24445184e0c44af79887867b4b9e1"],
  ["app/api/upload-logo/route.ts", "7398b4241f711a9e69c71168233980f358852c2a2e4e5e631fab4339634feabf"],
  ["components/admin/admin-dashboard-client.tsx", "86caa4376bde0084311595010c582b6c3aab83db98887121d8db2c59eb8aae2f"],
]);

const GOVERNANCE_HASHES = new Map([
  ["docs/discovery-phase-27fl-discovered-tool-duplicate-source-hardening-patch-planning-gate.md", "6fe6e3d7abb1a5586bc3699ca7bfa6b9712dd355f45e0710bd714b1d94a7ce12"],
  ["docs/discovery-phase-27fp-global-security-ledger-final-audit-reselection-gate.md", "704b24609649b43d54a8a1dbfa0449ea346518c00186bb5eba305b7a39641f9a"],
  ["docs/discovery-phase-27fq-audit-logs-focused-static-inspection-and-test-contract-planning-gate.md", "2e215686d2efcc7b7b744110af3bc69cb64f46c18512f9797b23c8ba9e7cb723"],
  ["docs/discovery-phase-27ft-audit-logs-source-hardening-patch-planning-gate.md", "96bbe26236b7d69a48b46143c5eedd6776edd765f8143eeb43c5e66e187d19ca"],
  ["docs/discovery-phase-27fx-global-security-ledger-final-closure-audit-gate.md", "5353221fcd406aae20c992d5cd254b11a09cb37ddcda06468573e4ce03b67e45"],
]);

const APP_ROUTER_EXPORTS = new Set([
  "GET",
  "HEAD",
  "OPTIONS",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "config",
  "generateStaticParams",
  "unstable_instant",
  "unstable_dynamicStaleTime",
  "revalidate",
  "dynamic",
  "dynamicParams",
  "fetchCache",
  "preferredRegion",
  "runtime",
  "maxDuration",
]);
const EXPECTED_RUNTIME_EXPORTS = new Set(["runtime", "dynamic", "POST"]);
const EXPECTED_DECISION_SEAMS = new Set([
  "verifyAdminSession",
  "verifyAdminCsrfRequest",
  "checkRateLimit",
  "getClient",
  "applyDecision",
]);

function fail(id, reason) {
  process.stderr.write(`${id} fails because ${reason}\n`);
  process.exit(1);
}

function check(id, condition, reason) {
  if (!condition) fail(id, reason);
}

function compact(value) {
  return value.replace(/\s+/g, "");
}

function ordered(...positions) {
  return positions.every(
    (position, index) =>
      position >= 0 && (index === 0 || positions[index - 1] < position),
  );
}

function setsEqual(actual, expected) {
  return (
    actual.size === expected.size &&
    [...actual].every((value) => expected.has(value))
  );
}

function hashText(text) {
  return createHash("sha256").update(text).digest("hex");
}

function sha256(relativePath) {
  return createHash("sha256")
    .update(readFileSync(path.join(REPO_ROOT, relativePath)))
    .digest("hex");
}

function parseFile(relativePath, scriptKind = ts.ScriptKind.TS) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  const text = readFileSync(absolutePath, "utf8");
  return {
    absolutePath,
    relativePath,
    text,
    sourceFile: ts.createSourceFile(
      absolutePath,
      text,
      ts.ScriptTarget.Latest,
      true,
      scriptKind,
    ),
  };
}

function walk(root, visitor) {
  function visit(node) {
    visitor(node);
    ts.forEachChild(node, visit);
  }
  visit(root);
}

function collect(root, predicate) {
  const matches = [];
  walk(root, (node) => {
    if (predicate(node)) matches.push(node);
  });
  return matches;
}

function hasModifier(node, kind) {
  return Boolean(node.modifiers?.some((modifier) => modifier.kind === kind));
}

function isExported(node) {
  return hasModifier(node, ts.SyntaxKind.ExportKeyword);
}

function nodeText(node, record) {
  return node.getText(record.sourceFile);
}

function stringLiteral(node) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
    ? node.text
    : null;
}

function nameText(name) {
  if (!name) return "";
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return name.getText().replace(/^['"]|['"]$/g, "");
}

function propertyMap(objectLiteral) {
  const properties = new Map();
  for (const property of objectLiteral.properties) {
    if (ts.isPropertyAssignment(property)) {
      properties.set(nameText(property.name), property.initializer);
    } else if (ts.isShorthandPropertyAssignment(property)) {
      properties.set(property.name.text, property.name);
    } else if (ts.isSpreadAssignment(property)) {
      properties.set(`...${property.expression.getText()}`, property.expression);
    }
  }
  return properties;
}

function callName(call) {
  if (ts.isIdentifier(call.expression)) return call.expression.text;
  if (ts.isPropertyAccessExpression(call.expression)) {
    return call.expression.name.text;
  }
  return call.expression.getText();
}

function callsNamed(root, name) {
  return collect(
    root,
    (node) => ts.isCallExpression(node) && callName(node) === name,
  );
}

function topLevelVariable(record, variableName) {
  for (const statement of record.sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === variableName
      ) {
        return { statement, declaration };
      }
    }
  }
  return null;
}

function topLevelFunction(record, functionName) {
  return (
    record.sourceFile.statements.find(
      (statement) =>
        ts.isFunctionDeclaration(statement) &&
        statement.name?.text === functionName,
    ) ?? null
  );
}

function topLevelTypeAlias(record, typeName) {
  return (
    record.sourceFile.statements.find(
      (statement) =>
        ts.isTypeAliasDeclaration(statement) && statement.name.text === typeName,
    ) ?? null
  );
}

function topLevelRuntimeExports(record) {
  const exports = new Set();
  for (const statement of record.sourceFile.statements) {
    if (ts.isVariableStatement(statement) && isExported(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) exports.add(declaration.name.text);
      }
    } else if (
      ts.isFunctionDeclaration(statement) &&
      isExported(statement) &&
      statement.name
    ) {
      exports.add(statement.name.text);
    } else if (ts.isExportAssignment(statement)) {
      exports.add("default");
    } else if (
      ts.isExportDeclaration(statement) &&
      !statement.isTypeOnly &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        if (!element.isTypeOnly) exports.add(element.name.text);
      }
    }
  }
  return exports;
}

function importDetails(record) {
  const modules = [];
  const names = new Set();
  for (const statement of record.sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    modules.push(statement.moduleSpecifier.text);
    const clause = statement.importClause;
    if (!clause) continue;
    if (clause.name) names.add(clause.name.text);
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) {
        names.add(element.name.text);
      }
    }
  }
  return { modules, names };
}

function serverOnlyIsFirst(record) {
  const statement = record.sourceFile.statements[0];
  return Boolean(
    statement &&
      ts.isImportDeclaration(statement) &&
      !statement.importClause &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === "server-only",
  );
}

function consoleCalls(record, root = record.sourceFile) {
  return collect(root, (node) =>
    Boolean(
      ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.expression.getText(record.sourceFile) === "console",
    ),
  );
}

function typePropertyNames(typeAlias) {
  if (!typeAlias || !ts.isTypeLiteralNode(typeAlias.type)) return new Set();
  return new Set(
    typeAlias.type.members
      .filter(ts.isPropertySignature)
      .map((member) => nameText(member.name)),
  );
}

function checkIds(record) {
  return new Set(
    collect(
      record.sourceFile,
      (node) => ts.isCallExpression(node) && callName(node) === "check",
    )
      .map((call) => stringLiteral(call.arguments[0]))
      .filter(Boolean),
  );
}

function expectedIds(count) {
  return new Set(
    Array.from(
      { length: count },
      (_, index) => `A${String(index + 1).padStart(2, "0")}`,
    ),
  );
}

// A01 deliberately reads only the upload route. No other repository source is
// read until the server-only boundary has passed.
const upload = parseFile(UPLOAD_PATH);
check(
  "A01",
  serverOnlyIsFirst(upload) &&
    !upload.text.includes('"use client"') &&
    !upload.text.includes("'use client'"),
  `${UPLOAD_PATH} does not begin with import "server-only".`,
);

const uploadExports = topLevelRuntimeExports(upload);
const uploadRuntime = topLevelVariable(upload, "runtime");
const uploadDynamic = topLevelVariable(upload, "dynamic");
check(
  "A02",
  setsEqual(uploadExports, EXPECTED_RUNTIME_EXPORTS) &&
    [...uploadExports].every((name) => APP_ROUTER_EXPORTS.has(name)) &&
    stringLiteral(uploadRuntime?.declaration.initializer) === "nodejs" &&
    stringLiteral(uploadDynamic?.declaration.initializer) === "force-dynamic",
  "the upload App Router export surface or runtime values changed.",
);

const uploadImports = importDetails(upload);
check(
  "A03",
  JSON.stringify(uploadImports.modules) ===
    JSON.stringify([
      "server-only",
      "crypto",
      "next/server",
      "../../../../lib/admin-audit-log",
      "../../../../lib/admin-auth",
      "../../../../lib/supabase-admin",
    ]) &&
    setsEqual(
      uploadImports.names,
      new Set([
        "randomUUID",
        "NextResponse",
        "createAdminAuditLog",
        "isAuthorizedAdminRequest",
        "verifyAdminCsrfRequest",
        "supabaseAdmin",
      ]),
    ) &&
    !/(process\.env|createClient|service.?role|\.rpc\s*\()/i.test(upload.text),
  "the upload import graph or privileged dependency ceiling changed.",
);

const uploadPost = topLevelFunction(upload, "POST");
const uploadSecurity = topLevelFunction(upload, "requireAdminSecurity");
const uploadPostText = uploadPost ? nodeText(uploadPost, upload) : "";
const uploadSecurityText = uploadSecurity ? nodeText(uploadSecurity, upload) : "";
check(
  "A04",
  Boolean(uploadPost && uploadSecurity) &&
    ordered(
      uploadSecurityText.indexOf("checkRateLimit(clientIp)"),
      uploadSecurityText.indexOf("isAuthorizedAdminRequest(request)"),
      uploadSecurityText.indexOf("verifyAdminCsrfRequest(request)"),
    ) &&
    ordered(
      uploadPostText.indexOf("requireAdminSecurity(request)"),
      uploadPostText.indexOf('request.headers.get("content-type")'),
      uploadPostText.indexOf('request.headers.get("content-length")'),
      uploadPostText.indexOf("await request.formData()"),
      uploadPostText.indexOf('.getAll("file")'),
      uploadPostText.indexOf("file.size > MAX_FILE_SIZE_BYTES"),
      uploadPostText.indexOf("ALLOWED_IMAGE_TYPES.includes(file.type)"),
      uploadPostText.indexOf("await file.arrayBuffer()"),
      uploadPostText.indexOf("looksLikeSvgOrHtml(bytes)"),
      uploadPostText.indexOf("hasValidImageSignature(bytes, file.type)"),
      uploadPostText.indexOf("randomUUID()"),
      uploadPostText.indexOf(".upload(fileName, safeFile"),
      uploadPostText.indexOf(".getPublicUrl(fileName)"),
      uploadPostText.indexOf("await createAdminAuditLog"),
      uploadPostText.indexOf("success: true"),
    ),
  "the upload security, validation, storage, audit, or response ordering changed.",
);

const uploadJsonResponse = topLevelFunction(upload, "jsonResponse");
const uploadRateLimit = topLevelFunction(upload, "checkRateLimit");
const uploadIp = topLevelFunction(upload, "getClientIp");
check(
  "A05",
  upload.text.includes("const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;") &&
    upload.text.includes("const RATE_LIMIT_MAX_UPLOADS = 20;") &&
    Boolean(uploadRateLimit && uploadIp && uploadJsonResponse) &&
    [
      'request.headers.get("x-forwarded-for")',
      'request.headers.get("x-real-ip")',
      'forwardedFor.split(",")[0].trim()',
      'return realIp || "unknown"',
      "current.count >= RATE_LIMIT_MAX_UPLOADS",
      "current.count += 1",
      "resetAt: now + RATE_LIMIT_WINDOW_MS",
      "Too many logo uploads. Please wait before uploading another logo.",
      '"Cache-Control": "no-store"',
      '"X-Content-Type-Options": "nosniff"',
    ].every((marker) => upload.text.includes(marker)) &&
    compact(uploadSecurityText).includes(",429)"),
  "the 20-per-hour upload rate-limit envelope, IP derivation, or 429 response changed.",
);

const uploadValidationMarkers = [
  'contentType.includes("multipart/form-data")',
  "const MAX_REQUEST_SIZE_BYTES = 3 * 1024 * 1024;",
  "const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;",
  '.getAll("file")',
  "uploadedFiles.length !== 1",
  '"image/png"',
  '"image/jpeg"',
  '"image/webp"',
  "looksLikeSvgOrHtml(bytes)",
  "hasValidImageSignature(bytes, file.type)",
  '"Invalid upload format."',
  '"Upload is too large. Logo file must be under 2MB."',
  '"Please upload one logo file only."',
  '"No file uploaded."',
  '"Logo file must be under 2MB."',
  '"Only PNG, JPG, JPEG, and WEBP logo files are allowed."',
  '"Invalid logo file. SVG, HTML, script, and embedded code are not allowed."',
  '"Invalid image file. Please upload a real PNG, JPG, JPEG, or WEBP image."',
  '"Unsupported logo file type."',
];
check(
  "A06",
  uploadValidationMarkers.every((marker) => upload.text.includes(marker)) &&
    callsNamed(uploadPost, "formData").length === 1 &&
    callsNamed(uploadPost, "getAll").length === 1 &&
    callsNamed(uploadPost, "arrayBuffer").length === 1 &&
    [415, 413, 400].every((status) => uploadPostText.includes(String(status))),
  "the upload request, file-count, size, MIME, signature, active-content, or validation-response envelope changed.",
);

const uploadCalls = collect(uploadPost, ts.isCallExpression);
const storageUploadCalls = uploadCalls.filter((call) => callName(call) === "upload");
const publicUrlCalls = uploadCalls.filter(
  (call) => callName(call) === "getPublicUrl",
);
const bucketCalls = uploadCalls.filter(
  (call) =>
    callName(call) === "from" && stringLiteral(call.arguments[0]) === "tool-logos",
);
const storageOptions = storageUploadCalls[0]?.arguments[2];
const storageProperties =
  storageOptions && ts.isObjectLiteralExpression(storageOptions)
    ? propertyMap(storageOptions)
    : new Map();
check(
  "A07",
  callsNamed(uploadPost, "randomUUID").length === 1 &&
    uploadPostText.includes('const fileName = `admin/${randomUUID()}.${fileExtension}`') &&
    upload.text.includes('if (mimeType === "image/png") return "png"') &&
    upload.text.includes('if (mimeType === "image/jpeg") return "jpg"') &&
    upload.text.includes('if (mimeType === "image/webp") return "webp"') &&
    storageUploadCalls.length === 1 &&
    publicUrlCalls.length === 1 &&
    bucketCalls.length === 2 &&
    compact(nodeText(storageUploadCalls[0], upload)).startsWith(
      'supabaseAdmin.storage.from("tool-logos").upload(fileName,safeFile,',
    ) &&
    stringLiteral(storageProperties.get("cacheControl")) === "3600" &&
    storageProperties.get("contentType")?.getText(upload.sourceFile) === "file.type" &&
    storageProperties.get("upsert")?.kind === ts.SyntaxKind.FalseKeyword &&
    !uploadCalls.some((call) =>
      ["delete", "remove", "rpc"].includes(callName(call)),
    ) &&
    !/(\.from\s*\(\s*["'](?!tool-logos)|process\.env|createClient)/.test(
      uploadPostText,
    ),
  "the UUID filename, tool-logos storage calls, upload options, or privileged call ceilings changed.",
);

const auditCalls = callsNamed(uploadPost, "createAdminAuditLog");
const auditArgument = auditCalls[0]?.arguments[0];
const auditProperties =
  auditArgument && ts.isObjectLiteralExpression(auditArgument)
    ? propertyMap(auditArgument)
    : new Map();
const auditDetails = auditProperties.get("details");
const auditDetailProperties =
  auditDetails && ts.isObjectLiteralExpression(auditDetails)
    ? propertyMap(auditDetails)
    : new Map();
check(
  "A08",
  auditCalls.length === 1 &&
    uploadPostText.indexOf(".upload(fileName, safeFile") <
      uploadPostText.indexOf(".getPublicUrl(fileName)") &&
    uploadPostText.indexOf(".getPublicUrl(fileName)") <
      uploadPostText.indexOf("await createAdminAuditLog") &&
    setsEqual(
      new Set(auditProperties.keys()),
      new Set(["request", "action", "targetType", "targetId", "targetName", "details"]),
    ) &&
    auditProperties.get("request")?.getText(upload.sourceFile) === "request" &&
    stringLiteral(auditProperties.get("action")) === "logo_uploaded" &&
    stringLiteral(auditProperties.get("targetType")) === "storage_object" &&
    auditProperties.get("targetId")?.getText(upload.sourceFile) === "fileName" &&
    auditProperties.get("targetName")?.getText(upload.sourceFile) === "fileName" &&
    setsEqual(
      new Set(auditDetailProperties.keys()),
      new Set(["bucket", "contentType", "sizeBytes", "publicUrl"]),
    ) &&
    stringLiteral(auditDetailProperties.get("bucket")) === "tool-logos" &&
    auditDetailProperties.get("contentType")?.getText(upload.sourceFile) === "file.type" &&
    auditDetailProperties.get("sizeBytes")?.getText(upload.sourceFile) === "file.size" &&
    auditDetailProperties.get("publicUrl")?.getText(upload.sourceFile) === "data.publicUrl",
  "the post-storage upload audit boundary, action, target, detail keys, or order changed.",
);

const uploadSuccessCalls = callsNamed(uploadPost, "jsonResponse").filter((call) => {
  const argument = call.arguments[0];
  return (
    argument &&
    ts.isObjectLiteralExpression(argument) &&
    propertyMap(argument).has("success")
  );
});
const uploadSuccessProperties =
  uploadSuccessCalls[0] &&
  ts.isObjectLiteralExpression(uploadSuccessCalls[0].arguments[0])
    ? propertyMap(uploadSuccessCalls[0].arguments[0])
    : new Map();
check(
  "A09",
  Boolean(uploadJsonResponse) &&
    compact(nodeText(uploadJsonResponse, upload)).includes(
      'NextResponse.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff",},})',
    ) &&
    uploadSuccessCalls.length === 1 &&
    setsEqual(new Set(uploadSuccessProperties.keys()), new Set(["success", "logoUrl"])) &&
    uploadSuccessProperties.get("success")?.kind === ts.SyntaxKind.TrueKeyword &&
    uploadSuccessProperties.get("logoUrl")?.getText(upload.sourceFile) === "data.publicUrl" &&
    [
      "Unable to upload logo. Please try again later.",
      "Logo upload failed. Please try again.",
    ].every((message) => upload.text.includes(message)) &&
    !uploadPostText.includes("NextResponse.json("),
  "the centralized protected upload responses, fixed failures, statuses, headers, or success shape changed.",
);

const uploadConsole = consoleCalls(upload);
check(
  "A10",
  uploadConsole.length === 2 &&
    uploadConsole[0].expression.name.text === "error" &&
    uploadConsole[0].arguments.length === 1 &&
    stringLiteral(uploadConsole[0].arguments[0]) ===
      "admin_logo_upload_storage_failed" &&
    uploadConsole[1].expression.name.text === "error" &&
    uploadConsole[1].arguments.length === 1 &&
    stringLiteral(uploadConsole[1].arguments[0]) ===
      "admin_logo_upload_unexpected_failure" &&
    !/(console\.[^(]+\([^)]*(error\.|stack|cause|details|hint|code|fileName|fileBuffer|bytes|publicUrl|adminSession|credential|secret))/is.test(
      upload.text,
    ),
  "the upload console boundary is not exactly two one-literal categorical error events.",
);

const decision = parseFile(DECISION_PATH);
const decisionExports = topLevelRuntimeExports(decision);
const decisionRuntime = topLevelVariable(decision, "runtime");
const decisionDynamic = topLevelVariable(decision, "dynamic");
const decisionImports = importDetails(decision);
check(
  "A11",
  serverOnlyIsFirst(decision) &&
    !decision.text.includes('"use client"') &&
    !decision.text.includes("'use client'") &&
    setsEqual(decisionExports, EXPECTED_RUNTIME_EXPORTS) &&
    stringLiteral(decisionRuntime?.declaration.initializer) === "nodejs" &&
    stringLiteral(decisionDynamic?.declaration.initializer) === "force-dynamic" &&
    JSON.stringify(decisionImports.modules) ===
      JSON.stringify([
        "server-only",
        "next/server",
        "../../../../../../../lib/admin-auth",
        "../../../../../../../lib/admin-rate-limit",
        "../../../../../../../lib/discovery/discovery-candidate-decision-admin",
        "../../../../../../../lib/discovery/discovery-candidate-decision-validation",
      ]),
  "the decision server-only boundary, App Router surface, runtime values, or import set changed.",
);

const dependencyType = topLevelTypeAlias(
  decision,
  "CandidateDecisionRouteDependencies",
);
const dependencyMembers =
  dependencyType && ts.isTypeLiteralNode(dependencyType.type)
    ? dependencyType.type.members.filter(ts.isPropertySignature)
    : [];
const decisionFactory = topLevelFunction(decision, "createCandidateDecisionHandler");
const decisionReturn = decisionFactory?.body?.statements.find(ts.isReturnStatement);
const decisionHandler =
  decisionReturn?.expression && ts.isFunctionExpression(decisionReturn.expression)
    ? decisionReturn.expression
    : null;
const decisionHandlerText = decisionHandler ? nodeText(decisionHandler, decision) : "";
check(
  "A12",
  setsEqual(typePropertyNames(dependencyType), EXPECTED_DECISION_SEAMS) &&
    dependencyMembers.length === 5 &&
    dependencyMembers.every((member) => Boolean(member.questionToken)) &&
    Boolean(decisionHandler) &&
    [
      "dependencies.verifyAdminSession || verifyAdminSession",
      "dependencies.verifyAdminCsrfRequest || verifyAdminCsrfRequest",
      "dependencies.checkRateLimit",
      "dependencies.getClient",
      "dependencies.applyDecision || applyDiscoveryCandidateDecision",
    ].every((marker) => decisionHandlerText.includes(marker)),
  "the decision route does not retain exactly its five approved dependency seams.",
);

const decisionPositions = [
  decisionHandlerText.indexOf("const adminSession"),
  decisionHandlerText.indexOf("const csrfVerifier"),
  decisionHandlerText.indexOf("const rateLimitInput"),
  decisionHandlerText.indexOf("body = await readJsonBody(request)"),
  decisionHandlerText.indexOf("const { id } = await context.params"),
  decisionHandlerText.indexOf("parseDiscoveryCandidateDecisionRequest"),
  decisionHandlerText.indexOf("const client ="),
  decisionHandlerText.indexOf("const result = await applyDecision"),
  decisionHandlerText.indexOf("return jsonResponse({"),
];
check(
  "A13",
  ordered(...decisionPositions) &&
    callsNamed(decisionHandler, "readJsonBody").length === 1 &&
    callsNamed(decisionHandler, "parseDiscoveryCandidateDecisionRequest").length === 1 &&
    callsNamed(decisionHandler, "applyDecision").length === 1 &&
    collect(decisionHandler, ts.isCatchClause).length === 2 &&
    collect(decisionHandler, ts.isThrowStatement).length === 0,
  "the decision authentication-to-response ordering, early-return boundaries, or call ceilings changed.",
);

const rateLimit = parseFile(RATE_LIMIT_PATH);
const validation = parseFile(VALIDATION_PATH);
check(
  "A14",
  decision.text.includes("const MAX_BODY_SIZE_BYTES = 8 * 1024;") &&
    decisionHandlerText.includes(
      "action: ADMIN_RATE_LIMIT_ACTIONS.discoveryCandidateDecisionMutation",
    ) &&
    decisionHandlerText.includes("actor: adminSession.actor") &&
    sha256(RATE_LIMIT_PATH) === PROTECTED_HASHES.get(RATE_LIMIT_PATH) &&
    rateLimit.text.includes("const ADMIN_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;") &&
    rateLimit.text.includes(
      "[ADMIN_RATE_LIMIT_ACTIONS.discoveryCandidateDecisionMutation]: {\n    limit: 60,\n    windowMs: ADMIN_RATE_LIMIT_WINDOW_MS,\n  }",
    ) &&
    [
      'request.headers.get("x-forwarded-for")',
      'request.headers.get("x-real-ip")',
      'request.headers.get("cf-connecting-ip")',
      "return `actor:${actorLabel.toLowerCase()}`",
      "return `ip:${getFallbackIp(request).toLowerCase()}`",
    ].every((marker) => rateLimit.text.includes(marker)) &&
    sha256(VALIDATION_PATH) === PROTECTED_HASHES.get(VALIDATION_PATH) &&
    [
      '"invalid_candidate_id"',
      '"unsupported_request_field"',
      '"client_admin_identity_not_allowed"',
      '"ambiguous_request_field"',
      '"invalid_action"',
      '"invalid_reason"',
      '"invalid_notes"',
      '"invalid_duplicate_target"',
      '"duplicate_tool_target_not_supported"',
      '"invalid_request_correlation_id"',
    ].every((marker) => validation.text.includes(marker)) &&
    decisionHandlerText.includes("actorLabel: getAdminActorLabel(adminSession.actor)"),
  "the decision 8 KiB body, 60-per-10-minute policy, actor/IP fallback, validation, or actor derivation changed.",
);

const validationStatus = topLevelVariable(decision, "VALIDATION_ERROR_STATUS");
const mutationStatus = topLevelVariable(decision, "MUTATION_ERROR_STATUS");
check(
  "A15",
  Boolean(validationStatus && mutationStatus) &&
    [
      '"unauthorized", "Unauthorized.", 401',
      '"forbidden",',
      '"invalid_request_body",',
      "error instanceof DiscoveryCandidateDecisionValidationError",
      "error instanceof DiscoveryCandidateDecisionMutationError",
      "VALIDATION_ERROR_STATUS[error.code]",
      "MUTATION_ERROR_STATUS[error.code]",
      '"candidate_decision_rpc_failed",',
      '"Candidate decision could not be applied.",',
      '"Cache-Control": "no-store"',
      '"X-Content-Type-Options": "nosniff"',
    ].every((marker) => decision.text.includes(marker)) &&
    !/errorResponse\([^)]*(stack|cause|details|hint|code\s*:)/is.test(
      decisionHandlerText,
    ),
  "the decision typed public error taxonomy, fixed unexpected response, statuses, headers, or success shape changed.",
);

const decisionConsole = consoleCalls(decision);
check(
  "A16",
  decisionConsole.length === 2 &&
    decisionConsole[0].expression.name.text === "warn" &&
    decisionConsole[0].arguments.length === 1 &&
    stringLiteral(decisionConsole[0].arguments[0]) ===
      "candidate_decision_unauthorized" &&
    decisionConsole[1].expression.name.text === "error" &&
    decisionConsole[1].arguments.length === 1 &&
    stringLiteral(decisionConsole[1].arguments[0]) ===
      "candidate_decision_unexpected_failure" &&
    decisionConsole.every(
      (call) =>
        call.arguments.length === 1 &&
        stringLiteral(call.arguments[0]) !== null,
    ),
  "the decision console boundary is not exactly one fixed unauthorized warning and one fixed unexpected-failure error.",
);

const decisionCalls = collect(decision.sourceFile, ts.isCallExpression);
check(
  "A17",
  !decisionImports.modules.some((moduleName) =>
    /(supabase|database|storage|audit-log|environment)/i.test(moduleName),
  ) &&
    !/(process\.env|createClient|service.?role|\.from\s*\(|\.rpc\s*\(|\.storage\b|createAdminAuditLog)/i.test(
      decision.text,
    ) &&
    decisionCalls.filter((call) => callName(call) === "applyDecision").length === 1 &&
    !decision.text.includes("publish"),
  "the decision route added direct privileged access, another mutation, audit construction, or publishing behavior.",
);

const OLD_DECISION_A08 = `      compact(unauthorizedText).includes(
        'console.warn("Unauthorizedcandidatedecisionmutationrequest.",{errors:adminSession.errors,})',
      ) &&`;
const NEW_DECISION_A08 = `      compact(unauthorizedText).includes(
        'console.warn("candidate_decision_unauthorized")',
      ) &&`;
const OLD_DECISION_A08_REASON =
  '  "the unauthorized predicate, two-argument warning, diagnostic object, or fixed 401 response changed.",';
const NEW_DECISION_A08_REASON =
  '  "the unauthorized predicate, fixed one-literal warning, or fixed 401 response changed.",';
const OLD_DECISION_A21 = `  consoleSignatures.length === 2 &&
    consoleSignatures[0].method === "warn" &&
    consoleSignatures[0].args.length === 2 &&
    stringLiteral(consoleSignatures[0].args[0]) ===
      "Unauthorized candidate decision mutation request." &&
    ts.isObjectLiteralExpression(consoleSignatures[0].args[1]) &&
    compact(consoleSignatures[0].args[1].getText(route.sourceFile)) ===
      "{errors:adminSession.errors,}" &&
    consoleSignatures[1].method === "error" &&
    consoleSignatures[1].args.length === 2 &&
    stringLiteral(consoleSignatures[1].args[0]) ===
      "Candidate decision mutation failed." &&
    ts.isObjectLiteralExpression(consoleSignatures[1].args[1]) &&
    compact(consoleSignatures[1].args[1].getText(route.sourceFile)) ===
      '{message:errorinstanceofError?error.message:"unknown",}' &&`;
const NEW_DECISION_A21 = `  consoleSignatures.length === 2 &&
    consoleSignatures[0].method === "warn" &&
    consoleSignatures[0].args.length === 1 &&
    stringLiteral(consoleSignatures[0].args[0]) ===
      "candidate_decision_unauthorized" &&
    consoleSignatures[1].method === "error" &&
    consoleSignatures[1].args.length === 1 &&
    stringLiteral(consoleSignatures[1].args[0]) ===
      "candidate_decision_unexpected_failure" &&`;
const OLD_DECISION_A21_REASON =
  '  "the exact two existing console calls changed or logging/audit expanded.",';
const NEW_DECISION_A21_REASON =
  '  "the exact two fixed one-literal console calls changed or logging/audit expanded.",';

const decisionContract = parseFile(DECISION_CONTRACT_PATH, ts.ScriptKind.JS);
const normalizedDecisionContract = decisionContract.text
  .replace(NEW_DECISION_A08, OLD_DECISION_A08)
  .replace(NEW_DECISION_A08_REASON, OLD_DECISION_A08_REASON)
  .replace(NEW_DECISION_A21, OLD_DECISION_A21)
  .replace(NEW_DECISION_A21_REASON, OLD_DECISION_A21_REASON);
check(
  "A18",
  setsEqual(checkIds(decisionContract), expectedIds(25)) &&
    decisionContract.text.includes(
      "PASS: candidate decision route export contract static assertions (25 assertions)",
    ) &&
    decisionContract.text.includes(NEW_DECISION_A08) &&
    decisionContract.text.includes(NEW_DECISION_A08_REASON) &&
    decisionContract.text.includes(NEW_DECISION_A21) &&
    decisionContract.text.includes(NEW_DECISION_A21_REASON) &&
    hashText(normalizedDecisionContract) ===
      BASELINE_HASHES.get(DECISION_CONTRACT_PATH),
  "the 25-assertion decision export contract changed outside its approved logging assertions or lost its marker.",
);

const catalogContract = parseFile(CATALOG_CONTRACT_PATH, ts.ScriptKind.JS);
const finalDecisionHash = sha256(DECISION_PATH);
const finalDecisionContractHash = sha256(DECISION_CONTRACT_PATH);
const finalHarnessHash = sha256(
  "testing/admin-mutation-diagnostic-logging-static-assertions.mjs",
);
const baselineDecisionLine =
  `  ["${DECISION_PATH}", "${BASELINE_HASHES.get(DECISION_PATH)}"],`;
const finalDecisionLine =
  `  ["${DECISION_PATH}", "${finalDecisionHash}"],`;
const baselineDecisionContractLine =
  `  ["${DECISION_CONTRACT_PATH}", "${BASELINE_HASHES.get(DECISION_CONTRACT_PATH)}"],`;
const finalDecisionContractLine =
  `  ["${DECISION_CONTRACT_PATH}", "${finalDecisionContractHash}"],`;
const finalHarnessLine =
  `  ["testing/admin-mutation-diagnostic-logging-static-assertions.mjs", "${finalHarnessHash}"],\n`;
const normalizedCatalogContract = catalogContract.text
  .replace(finalDecisionLine, baselineDecisionLine)
  .replace(finalDecisionContractLine, baselineDecisionContractLine)
  .replace(finalHarnessLine, "");
check(
  "A19",
  setsEqual(checkIds(catalogContract), expectedIds(24)) &&
    catalogContract.text.includes(
      "PASS: admin catalog route error boundary static assertions (24 assertions)",
    ) &&
    catalogContract.text.includes(finalDecisionLine) &&
    catalogContract.text.includes(finalDecisionContractLine) &&
    catalogContract.text.includes(finalHarnessLine.trim()) &&
    hashText(normalizedCatalogContract) ===
      BASELINE_HASHES.get(CATALOG_CONTRACT_PATH),
  "the 24-assertion catalog contract changed outside the three approved Phase 27GH protected identities or lost an invariant.",
);

const normalizedUpload = upload.text
  .replace('import "server-only";\n\n', "")
  .replace(
    'console.error("admin_logo_upload_storage_failed");',
    'console.error("Admin logo upload error:", error.message);',
  )
  .replace(
    'console.error("admin_logo_upload_unexpected_failure");',
    'console.error("Admin logo upload route error:", error);',
  );
const normalizedDecision = decision.text
  .replace(
    '      console.warn("candidate_decision_unauthorized");',
    '      console.warn("Unauthorized candidate decision mutation request.", {\n        errors: adminSession.errors,\n      });',
  )
  .replace(
    '      console.error("candidate_decision_unexpected_failure");',
    '      console.error("Candidate decision mutation failed.", {\n        message: error instanceof Error ? error.message : "unknown",\n      });',
  );
const protectedIdentitiesPass = [...PROTECTED_HASHES].every(
  ([relativePath, expectedHash]) => sha256(relativePath) === expectedHash,
);
const governanceIdentitiesPass = [...GOVERNANCE_HASHES].every(
  ([relativePath, expectedHash]) => sha256(relativePath) === expectedHash,
);
const harnessText = readFileSync(TEST_FILE, "utf8");
check(
  "A20",
  hashText(normalizedUpload) === BASELINE_HASHES.get(UPLOAD_PATH) &&
    hashText(normalizedDecision) === BASELINE_HASHES.get(DECISION_PATH) &&
    hashText(normalizedDecisionContract) ===
      BASELINE_HASHES.get(DECISION_CONTRACT_PATH) &&
    hashText(normalizedCatalogContract) ===
      BASELINE_HASHES.get(CATALOG_CONTRACT_PATH) &&
    protectedIdentitiesPass &&
    governanceIdentitiesPass &&
    [upload.text, decision.text, decisionContract.text, catalogContract.text, harnessText].every(
      (text) => !text.includes("\r"),
    ),
  "the exact five-file normalized scope, a protected identity, a governance identity, or LF-only content changed.",
);

process.stdout.write(
  "PASS: admin mutation diagnostic logging static assertions (20 assertions)\n",
);
