#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEST_FILE = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(TEST_FILE), "..");

const ROUTE_PATH = "app/api/admin/discovery/runs/manual/route.ts";
const CATALOG_PATH =
  "testing/admin-catalog-route-error-boundary-static-assertions.mjs";
const HARNESS_PATH =
  "testing/admin-discovery-manual-trigger-diagnostic-logging-static-assertions.mjs";

const MANUAL_SMOKE_PATH = "scripts/smoke-discovery-manual-metadata-fetch.mjs";
const METADATA_SMOKE_PATH = "scripts/smoke-discovery-metadata-fetch.mjs";
const PREFLIGHT_SMOKE_PATH = "scripts/smoke-discovery-preflight-validator.mjs";
const ADMIN_SHELL_PATH = "testing/admin-shell-supabase-read-hardening.test.mjs";

const BASELINE_HEAD = "6c219157357b8cc1d3a6203beca71d54083bdb60";
const BASELINE_ROUTE_HASH =
  "59da56b2a68351e702ae80d83ced37175b755ba16734bb4e478d5f172b3c6586";

const EXPECTED_EVENTS = new Map([
  ["discovery_manual_crawler_trigger_unauthorized", "warn"],
  ["discovery_manual_crawler_source_load_failed", "error"],
  ["discovery_manual_crawler_active_runs_load_failed", "error"],
  ["discovery_manual_crawler_run_create_failed", "error"],
  ["discovery_manual_crawler_trigger_audit_failed", "error"],
]);

const SMOKE_HASHES = new Map([
  [MANUAL_SMOKE_PATH, "ada7c2732696af8d7c6cfc86d1093d39ada06a6f6b44e9fce9a9bccacb707960"],
  [METADATA_SMOKE_PATH, "9e0365a2c7bed9b0f64ca3c41236f9df8ec70b08de7de2475b35177aadd0b212"],
  [PREFLIGHT_SMOKE_PATH, "72107eb1911e447a6286b399eea80da1f2391432233a27bc889067b75e1cbf1f"],
]);

const PROTECTED_HASHES = new Map([
  ["lib/admin-auth.ts", "b00a3c0f3b4728647e3fea202c2e3b57663a4e567888b828a765df4ba83181dc"],
  ["lib/admin-rate-limit.ts", "83005203a7aa47b7af6d77ff96519524a3f08341649257fe125d44c3ad3e670b"],
  ["lib/supabase-admin.ts", "fea8f1b29460bdf245321e6dec80091dc63dd119fa17bface6f6d4980749dbae"],
  ["lib/discovery-manual-crawler.ts", "54dff282eeddca853a983fd0697754ccc2951588b4cf5db071dbb4975173c044"],
  [ADMIN_SHELL_PATH, "85e2207dd61820862c998c9cd4f2fc118cb24445184e0c44af79887867b4b9e1"],
  ["app/api/admin/discovery/runs/manual/claim/route.ts", "6c80d03cf87c8a42a5166b89c96eecb525fcb4f5e76317de8084ad91a68050fe"],
  ["app/api/admin/discovery/intake/route.ts", "296a24846a1fa73b07935d01a4526492ebefbcb98fb2d597e6db226642031167"],
  ["app/api/admin/discovery/runs/route.ts", "62b84b6e7dee14d51383c403f3ce7e48815f92e81730cf283baa74620547a0ee"],
  ["app/api/admin/discovery/discovered-tools/route.ts", "aedd49386666d12cdda85608d20d850de48c9614570c4965b2fb612f2cd48010"],
  ["testing/admin-discovery-read-route-diagnostic-logging-static-assertions.mjs", "b3a4eaf7ae7e12ac6be8aa53642adbb1174c399356d014cad4b05d3e95de5b6d"],
  ["app/api/admin/discovery/sources/route.ts", "5b38d852ec929680282a72f312a6e0af4a6ffecd47cf00e02f4e1724ae6f3dff"],
  ["app/api/admin/discovery/sources/[id]/route.ts", "b405327e796331aec0714f8f34f637d55d2cf7d626f26dc7ed322608cbd5e293"],
  ["app/api/admin/discovery/discovered-tools/[id]/route.ts", "93b6cf77fbe2a87839c8f10854e8002ba4bb2cc759b41a4b4977b77ea84db7fc"],
  ["app/api/admin/discovery/discovered-tools/bulk-status/route.ts", "f1c9254f35c48a44f96b08c136dc418a724aa60cd3dcec9b8051b25cf17c9f6d"],
  ["testing/admin-discovery-source-status-mutation-diagnostic-logging-static-assertions.mjs", "45dd79aee8f5cbf6bc3ca09760288bcb659f09bd65e572c748ef0ccd5c116008"],
]);

const GOVERNANCE_HASHES = new Map([
  ["docs/discovery-phase-27fl-discovered-tool-duplicate-source-hardening-patch-planning-gate.md", "6fe6e3d7abb1a5586bc3699ca7bfa6b9712dd355f45e0710bd714b1d94a7ce12"],
  ["docs/discovery-phase-27fp-global-security-ledger-final-audit-reselection-gate.md", "704b24609649b43d54a8a1dbfa0449ea346518c00186bb5eba305b7a39641f9a"],
  ["docs/discovery-phase-27fq-audit-logs-focused-static-inspection-and-test-contract-planning-gate.md", "2e215686d2efcc7b7b744110af3bc69cb64f46c18512f9797b23c8ba9e7cb723"],
  ["docs/discovery-phase-27ft-audit-logs-source-hardening-patch-planning-gate.md", "96bbe26236b7d69a48b46143c5eedd6776edd765f8143eeb43c5e66e187d19ca"],
  ["docs/discovery-phase-27fx-global-security-ledger-final-closure-audit-gate.md", "5353221fcd406aae20c992d5cd254b11a09cb37ddcda06468573e4ce03b67e45"],
]);

function fail(id, reason) {
  process.stderr.write(`${id} fails because ${reason}\n`);
  process.exit(1);
}

function check(id, condition, reason) {
  if (!condition) fail(id, reason);
}

// A01 deliberately reads only the manual-trigger route. No other repository
// path is read until the required first-statement boundary passes.
const routeAbsolutePath = path.join(REPO_ROOT, ROUTE_PATH);
const routeText = readFileSync(routeAbsolutePath, "utf8");
check(
  "A01",
  routeText.startsWith('import "server-only";\n'),
  `${ROUTE_PATH} does not begin with import "server-only";.`,
);

const require = createRequire(import.meta.url);
const ts = require("typescript");

function parseText(relativePath, text, scriptKind = ts.ScriptKind.TS) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
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

function parseFile(relativePath, scriptKind = ts.ScriptKind.TS) {
  return parseText(
    relativePath,
    readFileSync(path.join(REPO_ROOT, relativePath), "utf8"),
    scriptKind,
  );
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

function compact(value) {
  return value.replace(/\s+/g, "");
}

function setsEqual(actual, expected) {
  return (
    actual.size === expected.size &&
    [...actual].every((value) => expected.has(value))
  );
}

function stringLiteral(node) {
  return node &&
    (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : null;
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

function topLevelFunction(record, name) {
  return (
    record.sourceFile.statements.find(
      (statement) =>
        ts.isFunctionDeclaration(statement) && statement.name?.text === name,
    ) ?? null
  );
}

function variableDeclaration(root, name) {
  return (
    collect(
      root,
      (node) =>
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === name,
    )[0] ?? null
  );
}

function exportedNames(record) {
  const names = new Set();
  for (const statement of record.sourceFile.statements) {
    const exported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (!exported) continue;
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      }
    } else if (ts.isFunctionDeclaration(statement) && statement.name) {
      names.add(statement.name.text);
    }
  }
  return names;
}

function importDetails(record) {
  const modules = [];
  const names = new Set();
  for (const statement of record.sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const moduleName = stringLiteral(statement.moduleSpecifier);
    if (moduleName === null) continue;
    modules.push(moduleName);
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

function initializerString(record, variableName) {
  return stringLiteral(variableDeclaration(record.sourceFile, variableName)?.initializer);
}

function consoleSignatures(record) {
  return collect(record.sourceFile, (node) =>
    Boolean(
      ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.expression.getText(record.sourceFile) === "console",
    ),
  ).map((call) => ({
    method: call.expression.name.text,
    args: [...call.arguments],
  }));
}

function sha256(relativePath) {
  return createHash("sha256")
    .update(readFileSync(path.join(REPO_ROOT, relativePath)))
    .digest("hex");
}

function hashText(text) {
  return createHash("sha256").update(text).digest("hex");
}

function execGit(args) {
  return execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function gitSucceeds(args) {
  try {
    execGit(args);
    return true;
  } catch {
    return false;
  }
}

function checkIds(record) {
  return new Set(
    callsNamed(record.sourceFile, "check")
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

function mode(relativePath) {
  return statSync(path.join(REPO_ROOT, relativePath)).mode & 0o777;
}

function gitMode(relativePath) {
  const output = execGit(["ls-files", "-s", "--", relativePath]).trim();
  return output ? output.split(/\s+/)[0] : null;
}

function reconstructBaselineRoute(text) {
  let reconstructed = text.replace(/^import "server-only";\n\n/, "");
  const replacements = new Map([
    [
      'console.warn("discovery_manual_crawler_trigger_unauthorized");',
      'console.warn("Unauthorized manual crawler trigger request.", {\n      errors: adminSession.errors,\n    });',
    ],
    [
      'console.error("discovery_manual_crawler_source_load_failed");',
      'console.error("Failed to validate manual crawler source.", {\n      message: sourceError.message,\n    });',
    ],
    [
      'console.error("discovery_manual_crawler_active_runs_load_failed");',
      'console.error("Failed to check active manual crawler runs.", {\n      message: activeRunError.message,\n    });',
    ],
    [
      'console.error("discovery_manual_crawler_run_create_failed");',
      'console.error("Failed to create manual crawler run trigger.", {\n      message: insertRunError.message,\n    });',
    ],
    [
      'console.error("discovery_manual_crawler_trigger_audit_failed");',
      'console.error("Failed to audit manual crawler run trigger.", {\n      message: auditError.message,\n      runId: discoveryRunRecord.id,\n    });',
    ],
  ]);
  for (const [replacement, baseline] of replacements) {
    reconstructed = reconstructed.replace(replacement, baseline);
  }
  return reconstructed;
}

const route = parseText(ROUTE_PATH, routeText);
const routeCompact = compact(route.text);
const imports = importDetails(route);
check(
  "A02",
  JSON.stringify(imports.modules) ===
    JSON.stringify([
      "server-only",
      "next/server",
      "../../../../../../lib/admin-auth",
      "../../../../../../lib/admin-rate-limit",
      "../../../../../../lib/discovery-manual-crawler",
      "../../../../../../lib/supabase-admin",
    ]) &&
    setsEqual(
      imports.names,
      new Set([
        "NextResponse",
        "verifyAdminCsrfRequest",
        "verifyAdminSession",
        "ADMIN_RATE_LIMIT_ACTIONS",
        "checkAdminRateLimit",
        "getAdminRateLimitResponseData",
        "createManualCrawlerRunStats",
        "validateManualCrawlerRequest",
        "validateManualCrawlerSource",
        "ManualCrawlerSource",
        "supabaseAdmin",
      ]),
    ),
  "the import module order or imported symbol ceiling changed.",
);

const post = topLevelFunction(route, "POST");
check(
  "A03",
  setsEqual(exportedNames(route), new Set(["runtime", "dynamic", "POST"])) &&
    initializerString(route, "runtime") === "nodejs" &&
    initializerString(route, "dynamic") === "force-dynamic" &&
    post?.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
    post?.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) &&
    post.parameters.length === 1 &&
    post.parameters[0].name.getText(route.sourceFile) === "request" &&
    post.parameters[0].type?.getText(route.sourceFile) === "Request",
  "the export, runtime, dynamic, or POST(request: Request) contract changed.",
);

check(
  "A04",
  routeCompact.includes(
    'constMAX_BODY_SIZE_BYTES=24*1024;functionjsonResponse(data:object,status=200){returnNextResponse.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff",},});}',
  ) &&
    routeCompact.includes('request.headers.get("content-type")||""') &&
    routeCompact.includes('!contentType.includes("application/json")') &&
    routeCompact.includes('thrownewError("Invalidrequestformat.")') &&
    routeCompact.includes("contentLength>MAX_BODY_SIZE_BYTES") &&
    routeCompact.includes('thrownewError("Requestistoolarge.")') &&
    routeCompact.includes("awaitrequest.json().catch(()=>null)") &&
    routeCompact.includes('thrownewError("Invalidrequestbody.")'),
  "the bounded JSON parser or no-store JSON response helper changed.",
);

const orderedMarkers = [
  "verifyAdminSession(request)",
  "verifyAdminCsrfRequest(request)",
  "checkAdminRateLimit({",
  "await readJsonBody(request)",
  "validateManualCrawlerRequest(body)",
  '.from("discovery_sources")',
  "validateManualCrawlerSource(source as ManualCrawlerSource)",
  '.from("discovery_runs")',
  "createManualCrawlerRunStats({",
  '.from("discovery_runs")',
  '.from("discovery_audit_events")',
  "return jsonResponse(",
];
let markerOffset = -1;
const orderPreserved = orderedMarkers.every((marker) => {
  markerOffset = route.text.indexOf(marker, markerOffset + 1);
  return markerOffset >= 0;
});
check(
  "A05",
  orderPreserved,
  "the auth, CSRF, rate-limit, validation, query, mutation, audit, or response order changed.",
);

check(
  "A06",
  route.text.includes(
    'if (!adminSession.isAdmin || !adminSession.actor) {\n    console.warn("discovery_manual_crawler_trigger_unauthorized");\n\n    return jsonResponse({ error: "Unauthorized" }, 401);\n  }',
  ),
  "the unauthorized trigger event or 401 response contract changed.",
);

check(
  "A07",
  routeCompact.includes(
    'if(!verifyAdminCsrfRequest(request)){returnjsonResponse({error:"Securitytokenmissingorexpired.Pleaseloginagain."},403);}',
  ),
  "the CSRF guard or 403 response contract changed.",
);

check(
  "A08",
  routeCompact.includes(
    "constrateLimit=checkAdminRateLimit({request,action:ADMIN_RATE_LIMIT_ACTIONS.discoveryManualCrawlerRun,actor:adminSession.actor,});",
  ) &&
    routeCompact.includes(
      "if(!rateLimit.allowed){returnjsonResponse(getAdminRateLimitResponseData(rateLimit),rateLimit.status);}",
    ),
  "the manual-crawler rate-limit action or response contract changed.",
);

check(
  "A09",
  routeCompact.includes("body=awaitreadJsonBody(request)") &&
    routeCompact.includes(
      '{error:errorinstanceofError?error.message:"Invalidrequestbody."},400',
    ),
  "the request-body parsing or 400 response contract changed.",
);

check(
  "A10",
  routeCompact.includes("manualCrawlerRequest=validateManualCrawlerRequest(body)") &&
    routeCompact.includes(
      '{error:errorinstanceofError?error.message:"Invalidmanualcrawlerrequest."},400',
    ),
  "the manual-crawler request validation contract changed.",
);

check(
  "A11",
  routeCompact.includes(
    'awaitsupabaseAdmin.from("discovery_sources").select("id,name,slug,source_type,config,is_active").eq("id",manualCrawlerRequest.sourceId).maybeSingle()',
  ) &&
    route.text.includes(
      'console.error("discovery_manual_crawler_source_load_failed");',
    ) &&
    routeCompact.includes(
      'returnjsonResponse({error:"Failedtovalidatediscoverysource."},500)',
    ),
  "the source lookup, source-load event, or 500 response changed.",
);

check(
  "A12",
  routeCompact.includes(
    'if(!source){returnjsonResponse({error:"Discoverysourcenotfound."},400);}',
  ) &&
    routeCompact.includes(
      "validateManualCrawlerSource(sourceasManualCrawlerSource)",
    ) &&
    routeCompact.includes(
      '{error:errorinstanceofError?error.message:"Invaliddiscoverysource."},400',
    ),
  "the source existence or source validation contract changed.",
);

check(
  "A13",
  routeCompact.includes(
    'awaitsupabaseAdmin.from("discovery_runs").select("id,status,created_at").eq("source_id",source.id).in("status",["pending","running"]).order("created_at",{ascending:false}).limit(1)',
  ) &&
    route.text.includes(
      'console.error("discovery_manual_crawler_active_runs_load_failed");',
    ) &&
    routeCompact.includes(
      'returnjsonResponse({error:"Failedtocheckactivediscoveryruns."},500)',
    ),
  "the active-run lookup, load-failure event, or 500 response changed.",
);

check(
  "A14",
  routeCompact.includes(
    'if(activeRuns&&activeRuns.length>0){returnjsonResponse({error:"Adiscoveryrunisalreadypendingorrunningforthissource.",data:{existingRun:activeRuns[0],},},409);}',
  ),
  "the pending/running conflict response contract changed.",
);

check(
  "A15",
  routeCompact.includes(
    "construnStats=createManualCrawlerRunStats({source:sourceasManualCrawlerSource,request:manualCrawlerRequest,});",
  ),
  "the manual-crawler run-stat construction contract changed.",
);

check(
  "A16",
  routeCompact.includes(
    '.from("discovery_runs").insert({source_id:source.id,status:"pending",stats:runStats,error_log:null,started_at:null,finished_at:null,}).select(["id","source_id","status","stats","error_log","started_at","finished_at","created_at","updated_at",].join(",")).single()',
  ),
  "the pending discovery-run insertion or selected response projection changed.",
);

check(
  "A17",
  route.text.includes(
    'if (insertRunError) {\n    console.error("discovery_manual_crawler_run_create_failed");\n\n    return jsonResponse({ error: "Failed to create discovery run." }, 500);\n  }',
  ),
  "the run-create failure event or 500 response contract changed.",
);

check(
  "A18",
  routeCompact.includes(
    "constdiscoveryRunRecord=discoveryRunasunknownas{id:string;source_id:string|null;status:string;stats:Record<string,unknown>;error_log:string|null;started_at:string|null;finished_at:string|null;created_at:string;updated_at:string;};",
  ),
  "the returned discovery-run record shape changed.",
);

check(
  "A19",
  routeCompact.includes(
    '.from("discovery_audit_events").insert({discovered_tool_id:null,action:"flag",actor_id:adminSession.actor.id,actor_label:adminSession.actor.label,message:"Manualcrawlerruntriggercreatedwithexecutiondisabled.",metadata:{event_type:"manual_crawler_run_trigger_created",source_id:source.id,source_slug:source.slug,run_id:discoveryRunRecord.id,requested_url_count:manualCrawlerRequest.urls.length,execution_enabled:false,execution_status:"awaiting_approved_async_executor",no_fetch_performed:true,no_candidates_inserted:true,no_public_tools_inserted:true,},})',
  ),
  "the manual-trigger audit insertion or safety metadata changed.",
);

check(
  "A20",
  route.text.includes(
    'if (auditError) {\n    console.error("discovery_manual_crawler_trigger_audit_failed");\n  }',
  ) &&
    routeCompact.endsWith(
      'returnjsonResponse({data:{run:discoveryRunRecord,execution:{enabled:false,status:"awaiting_approved_async_executor",message:"Manualcrawlerrunwascreated.Fetch/extractexecutionremainsdisableduntiltheasyncexecutorisseparatelyapproved.",},},},201);}',
    ),
  "the non-fatal audit failure or disabled-executor 201 response changed.",
);

const consoleCalls = consoleSignatures(route);
check(
  "A21",
  consoleCalls.length === EXPECTED_EVENTS.size &&
    consoleCalls.every((signature, index) => {
      const [event, severity] = [...EXPECTED_EVENTS][index];
      return (
        signature.method === severity &&
        signature.args.length === 1 &&
        stringLiteral(signature.args[0]) === event
      );
    }),
  "the exact five-event severity, order, literal, or one-argument logging contract changed.",
);

check(
  "A22",
  consoleCalls.every(
    (signature) =>
      signature.args.length === 1 && stringLiteral(signature.args[0]) !== null,
  ) &&
    !route.text.includes("adminSession.errors") &&
    !route.text.includes("sourceError.message") &&
    !route.text.includes("activeRunError.message") &&
    !route.text.includes("insertRunError.message") &&
    !route.text.includes("auditError.message") &&
    !route.text.includes("runId: discoveryRunRecord.id"),
  "a console call exposes dynamic error, actor, run, request, or database detail.",
);

check(
  "A23",
  hashText(reconstructBaselineRoute(route.text)) === BASELINE_ROUTE_HASH,
  "the route contains a statement change outside the server-only import and five approved log replacements.",
);

const methodCounts = new Map(
  ["from", "select", "eq", "maybeSingle", "in", "order", "limit", "insert", "single", "update", "delete", "upsert", "rpc"].map(
    (name) => [name, callsNamed(route.sourceFile, name).length],
  ),
);
check(
  "A24",
  JSON.stringify(Object.fromEntries(methodCounts)) ===
    JSON.stringify({
      from: 4,
      select: 3,
      eq: 2,
      maybeSingle: 1,
      in: 1,
      order: 1,
      limit: 1,
      insert: 2,
      single: 1,
      update: 0,
      delete: 0,
      upsert: 0,
      rpc: 0,
    }) &&
    JSON.stringify(
      callsNamed(route.sourceFile, "from").map((call) => stringLiteral(call.arguments[0])),
    ) ===
      JSON.stringify([
        "discovery_sources",
        "discovery_runs",
        "discovery_runs",
        "discovery_audit_events",
      ]),
  "the Supabase table or method inventory changed.",
);

const manualSmoke = parseFile(MANUAL_SMOKE_PATH, ts.ScriptKind.JS);
const metadataSmoke = parseFile(METADATA_SMOKE_PATH, ts.ScriptKind.JS);
const preflightSmoke = parseFile(PREFLIGHT_SMOKE_PATH, ts.ScriptKind.JS);
check(
  "A25",
  [...SMOKE_HASHES].every(
    ([relativePath, expectedHash]) => sha256(relativePath) === expectedHash,
  ) &&
    mode(MANUAL_SMOKE_PATH) === 0o644 &&
    mode(METADATA_SMOKE_PATH) === 0o644 &&
    mode(PREFLIGHT_SMOKE_PATH) === 0o755 &&
    [manualSmoke, metadataSmoke, preflightSmoke].every(
      (record) =>
        record.text.includes("/api/admin/discovery/runs/manual") &&
        compact(record.text).includes('method:"POST"') &&
        record.text.includes("source_id") &&
        record.text.includes("urls") &&
        record.text.includes("pending"),
    ),
  "a manual-trigger smoke caller hash, mode, endpoint, request, or pending-run contract changed.",
);

const adminShell = parseFile(ADMIN_SHELL_PATH, ts.ScriptKind.JS);
check(
  "A26",
  [...PROTECTED_HASHES].every(
    ([relativePath, expectedHash]) => sha256(relativePath) === expectedHash,
  ) &&
    [...PROTECTED_HASHES.keys()].every(
      (relativePath) => gitMode(relativePath) === "100644",
    ) &&
    adminShell.text.includes("/api/admin/discovery/runs/manual") &&
    adminShell.text.includes("A2 privileged client boundary static assertions passed") &&
    adminShell.text.includes("admin shell Supabase read hardening static assertions passed"),
  "a protected dependency, adjacent route, prior diagnostic harness, or admin-shell contract changed.",
);

const catalog = parseFile(CATALOG_PATH, ts.ScriptKind.JS);
const harnessText = readFileSync(TEST_FILE, "utf8");
const expectedHarnessHash = hashText(harnessText);
const expectedRouteHash = hashText(route.text);
const catalogCheckIds = callsNamed(catalog.sourceFile, "check").map((call) =>
  stringLiteral(call.arguments[0]),
);
const expectedCatalogCheckIds = Array.from(
  { length: 24 },
  (_, index) => `A${String(index + 1).padStart(2, "0")}`,
);
const finalCatalogIdentityLines = [
  `  [PHASE_27GN_ROUTE_PATH, "${expectedRouteHash}"],`,
  `  [PHASE_27GN_HARNESS_PATH, "${expectedHarnessHash}"],`,
];
const catalogConstants =
  'const PHASE_27GN_ROUTE_PATH = "app/api/admin/discovery/runs/manual/route.ts";\nconst PHASE_27GN_HARNESS_PATH =\n  "testing/admin-discovery-manual-trigger-diagnostic-logging-static-assertions.mjs";\nconst PHASE_27GN_SUCCESS_MARKER =\n  "PASS: admin discovery manual-trigger diagnostic logging static assertions (28 assertions)";\n\n';
const catalogHarnessParse =
  "const phase27gnHarness = parseFile(PHASE_27GN_HARNESS_PATH, ts.ScriptKind.JS);\n";
const catalogMarkerCheck =
  "    phase27gnHarness.text.includes(PHASE_27GN_SUCCESS_MARKER) &&\n";
const normalizedCatalog = catalog.text
  .replace(catalogConstants, "\n")
  .replace(`${finalCatalogIdentityLines.join("\n")}\n`, "")
  .replace(catalogHarnessParse, "")
  .replace(catalogMarkerCheck, "");
check(
  "A27",
  catalogCheckIds.length === 24 &&
    catalogCheckIds.every((id) => id !== null) &&
    expectedCatalogCheckIds.every(
      (expectedId) =>
        catalogCheckIds.filter((actualId) => actualId === expectedId).length === 1,
    ) &&
    catalogCheckIds.every((id) => expectedCatalogCheckIds.includes(id)) &&
    catalog.text.includes(
      "PASS: admin catalog route error boundary static assertions (24 assertions)",
    ) &&
    finalCatalogIdentityLines.every((line) => catalog.text.includes(line)) &&
    catalog.text.includes(catalogConstants.trimEnd()) &&
    catalog.text.includes(catalogHarnessParse.trimEnd()) &&
    catalog.text.includes(catalogMarkerCheck.trim()) &&
    hashText(normalizedCatalog) ===
      "9c83ad786fc6518af61ba14fca2f265272b5641e7896219e095d0f1314c36412",
  "the catalog lost its 24-assertion identity or exact Phase 27GN route/harness integration.",
);

const expectedStatus = new Set([
  ` M ${ROUTE_PATH}`,
  ` M ${CATALOG_PATH}`,
  "?? docs/discovery-phase-27fl-discovered-tool-duplicate-source-hardening-patch-planning-gate.md",
  "?? docs/discovery-phase-27fp-global-security-ledger-final-audit-reselection-gate.md",
  "?? docs/discovery-phase-27fq-audit-logs-focused-static-inspection-and-test-contract-planning-gate.md",
  "?? docs/discovery-phase-27ft-audit-logs-source-hardening-patch-planning-gate.md",
  "?? docs/discovery-phase-27fx-global-security-ledger-final-closure-audit-gate.md",
  `?? ${HARNESS_PATH}`,
]);
const actualStatus = new Set(
  execGit(["status", "--porcelain=v1", "--untracked-files=all"])
    .trimEnd()
    .split("\n")
    .filter(Boolean),
);
check(
  "A28",
  execGit(["rev-parse", "--show-toplevel"]).trim() === REPO_ROOT &&
    execGit(["branch", "--show-current"]).trim() === "main" &&
    execGit(["rev-parse", "HEAD"]).trim() === BASELINE_HEAD &&
    execGit(["rev-parse", "refs/heads/main"]).trim() === BASELINE_HEAD &&
    execGit(["rev-parse", "refs/remotes/origin/main"]).trim() === BASELINE_HEAD &&
    gitSucceeds(["diff", "--cached", "--quiet"]) &&
    setsEqual(actualStatus, expectedStatus) &&
    new Set(execGit(["diff", "--name-only"]).trim().split("\n")).size === 2 &&
    execGit(["diff", "--name-only"]).trim().split("\n").includes(ROUTE_PATH) &&
    execGit(["diff", "--name-only"]).trim().split("\n").includes(CATALOG_PATH) &&
    [...GOVERNANCE_HASHES].every(
      ([relativePath, expectedHash]) => sha256(relativePath) === expectedHash,
    ) &&
    mode(ROUTE_PATH) === 0o644 &&
    mode(CATALOG_PATH) === 0o644 &&
    mode(HARNESS_PATH) === 0o644 &&
    [route.text, catalog.text, harnessText].every(
      (text) => !text.includes("\r") && text.endsWith("\n"),
    ) &&
    !route.text.includes("process" + ".env") &&
    !route.text.includes("Deno" + ".env") &&
    !route.text.includes("SUPABASE_SERVICE_ROLE_KEY"),
  "the final branch, HEAD, index, exact scope, governance identity, mode, LF, or secret boundary changed.",
);

process.stdout.write(
  "PASS: admin discovery manual-trigger diagnostic logging static assertions (28 assertions)\n",
);
