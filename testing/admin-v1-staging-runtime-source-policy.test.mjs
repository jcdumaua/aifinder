import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import * as core from "./admin-v1-staging-runtime-core.mjs";

const CORE_PATH = "testing/admin-v1-staging-runtime-core.mjs";
const ORCHESTRATOR_PATH =
  "testing/admin-v1-staging-runtime-orchestrator.mjs";
const EVIDENCE_TEST_PATH =
  "testing/admin-v1-staging-runtime-evidence.test.mjs";
const STORAGE_CAS_FORWARD_PATH =
  "supabase/migrations/_drafts/20260813_storage_cleanup_cas_forward_candidate.sql";
const TOOL_VALIDATION_PATH = "lib/tool-validation.ts";
const ADMIN_TOOLS_HANDLER_PATH = "app/api/admin/tools/handler.ts";
const ADMIN_SUBMISSIONS_HANDLER_PATH =
  "app/api/admin/submissions/handler.ts";
const APPROVAL_RPC_PATH =
  "supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql";
const BASELINE = "f7143b756b062287ab89e525a53010a379b51098";
const BRANCH =
  "aifinder-phase-34ia-evidence-publication-runtime-validation-v3";
const DELTA11_BRANCH =
  "aifinder-phase-34ia-security-header-runtime-validation";
const MARKER_PATH =
  "testing/aifinder-phase-34fa-staging-runtime-preview-marker.txt";
const MARKER_SHA256 =
  "f8ad3e3d1d764c92d03bf44081e3b341d93680664645c257726a54940bfd4b2f";
const TARGET_SHA256 =
  "0000000000000000000000000000000000000000000000000000000000000000";
const CONFIRMED_DELTA09_REBOUND_TARGET_SHA256 =
  "47ed7f660868ccb3d7e22793917a043cc75b0ee987e568fb26bfa83212b908d4";
const EXPECTED_CANONICAL_ORCHESTRATOR_SHA256 =
  "7ca3653fffd48223d54dd54cf0fac52871d2f30e5385971007c40eefd7a200f9";
const EXPECTED_SUPABASE_PROJECT_REF_SHA256 =
  "30ea077ffbf9cc9243b35ad3d67348004d32d49078787b5b305b65495ecb2914";
const MARKER_LINES = Object.freeze([
  "AIFINDER_PHASE_34IA_VERIFIED_EVIDENCE_PUBLICATION_FINAL_RUNTIME_PREVIEW_V18",
  `baseline=${BASELINE}`,
  `branch=${BRANCH}`,
  "purpose=admin-v1-verified-evidence-publication-runtime-closure",
  "auth_overrides=ADMIN_PASSWORD,ADMIN_SESSION_SECRET",
  "pretarget_publication_qualification_requests=6",
  "official_runtime_requests=20",
  "preview_ordinal=eighth-final",
  "execution_surface=codex-cli-antigravity",
  "public_launch=NO_GO",
]);
const EXPECTED_EXPORTS = Object.freeze([
  "canonicalJson",
  "authorizeStorageCleanupDeleteClientRole",
  "authorizeStorageCleanupDeleteModel",
  "authorizeDelta14BranchOperation",
  "classifyDelta20RepositoryTransition",
  "transitionDelta20PublicationLifecycle",
  "validateDelta20ProjectionCorpus",
  "validateDelta20SensitiveStdinTransport",
  "validateDelta20VerifiedPublicationFinalAuthorization",
  "buildSubmittedToolInsertRows",
  "classifySubmittedFixtureMarkerRows",
  "deriveFixtureSetupTransition",
  "deriveDelta20VerifiedPublicationFinalTarget",
  "buildVercelDeploymentDeleteArgs",
  "classifyAuxiliaryResponseHeaderProjection",
  "classifyDelta13BranchEnvironmentSnapshot",
  "classifySecurityHeaderProjection",
  "classifyPreRuntimeReplacementDisposition",
  "classifyPreviewDeleteTransport",
  "deriveDelta09ReboundTarget",
  "deriveDelta11HeaderQualifiedTarget",
  "deriveDelta12ProtectedAccessTarget",
  "deriveDelta13AuthQualifiedTarget",
  "deriveDelta14BranchRegisteredAuthQualifiedTarget",
  "deriveDelta15FixtureQualifiedFinalTarget",
  "deriveDelta16AStoredCanonicalRouteDiscoveryQualifiedFinalTarget",
  "buildDelta17PersistedStateOracle",
  "deriveDelta17PoststateOracleQualifiedFinalTarget",
  "deriveDelta18DurableProjectionFinalTarget",
  "projectDelta18DurableApplicationObservation",
  "projectDelta17SanitizedApplicationAssertion",
  "projectDelta17SanitizedPostState",
  "validateDelta17PoststateOracleQualifiedAuthorization",
  "validateDelta17ProjectionStructure",
  "validateDelta17ProjectionSufficiency",
  "validateDelta17SanitizedApplicationAssertion",
  "validateDelta18DurableProjectionFinalAuthorization",
  "validateDelta18DurableProjectionJournal",
  "validateDelta18DurableProjectionSemantics",
  "validateDelta09ReboundAuthorization",
  "validateDelta11HeaderQualifiedAuthorization",
  "validateDelta12ProtectedAccessAuthorization",
  "validateDelta13AuthQualificationCycle",
  "validateDelta13AuthQualifiedAuthorization",
  "validateDelta13BranchEnvironmentTransition",
  "validateDelta14ActivationCommit",
  "validateDelta14BranchRegisteredAuthQualifiedAuthorization",
  "validateDelta15FixtureQualifiedFinalAuthorization",
  "validateDelta15FixtureQualificationEvidence",
  "validateDelta15QualificationCompletion",
  "validateDelta16AQualificationCompletion",
  "validateDelta16ARouteQualificationEvidence",
  "validateDelta16AStoredCanonicalRouteDiscoveryQualifiedAuthorization",
  "authorizeDelta15OfficialFixtureSetup",
  "validateDelta14RegistrationCommit",
  "removeExactCanonicalStateRoot",
  "projectHttpResponseHeaderBuffers",
  "projectDelta13ApplicationResponse",
  "projectProtectedAccessHandshake",
  "projectVercelOidcToken",
  "runProtectedAccessCredentialLifecycle",
  "classifyDeploymentIdentity",
  "createRuntimePlan",
  "validateCanonicalStateFile",
  "validateCanonicalTempRoot",
  "validateCleanupState",
  "validateDeploymentIdentity",
  "validateFixtureState",
  "validateGithubDeploymentAdvisory",
  "validateHeaderQualificationAttempt",
  "validatePredecessorRatification",
  "authorizeFixtureInsertion",
  "classifyRuntimeFailureMode",
  "classifyStorageCleanupDeleteOutcome",
  "createStorageCleanupCapabilityToken",
  "reconcileStorageCleanupGrantPreparation",
  "validateProtectedLocalRuntimeEnvironment",
  "validateRuntimeEnvironmentMetadata",
  "validateRuntimeResponse",
  "validateStorageCleanupGrantBinding",
  "validateExistingPreviewResumeState",
  "validateProjectBypassTransition",
  "validateProtectedAccessOperation",
  "validateProtectedAccessProbe",
  "withProtectedAccessCredential",
]);
const EXPECTED_IMPORTS = Object.freeze([
  "./admin-v1-staging-runtime-core.mjs",
  "./admin-v1-staging-readiness-core.mjs",
  "node:child_process",
  "node:crypto",
  "node:fs",
  "node:https",
  "node:os",
  "node:path",
]);
const EXPECTED_ENVIRONMENT_NAMES = Object.freeze([
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
]);
const EXPECTED_LOCAL_ENVIRONMENT_NAMES = Object.freeze([
  "ADMIN_PASSWORD",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
]);
const EXPECTED_AUDIT_ACTIONS = Object.freeze([
  "tool_added",
  "tool_updated",
  "tool_deleted",
  "submission_updated",
  "submission_rejected",
  "submission_approved",
  "logo_uploaded",
  "admin_logout",
]);
const EXPECTED_AUTHORIZED_REPOSITORY_PATHS = Object.freeze([
  "testing/admin-v1-staging-runtime-core.mjs",
  "testing/admin-v1-staging-runtime-orchestrator.mjs",
  "testing/admin-v1-staging-runtime-source-policy.test.mjs",
  "testing/admin-v1-staging-runtime-evidence.schema.json",
  "testing/admin-v1-staging-runtime-evidence.json",
  "testing/admin-v1-staging-runtime-evidence.test.mjs",
  "testing/admin-v1-launch-scope.test.mjs",
  "testing/admin-v1-staging-readiness-source-policy.test.mjs",
  "testing/admin-v1-staging-readiness-evidence.test.mjs",
  "testing/authenticated-live-route-partial-evidence.test.mjs",
  "testing/authenticated-live-route-synthetic-rejection-candidate-ledger.test.mjs",
  "testing/readiness-coverage-matrix.json",
  "testing/readiness-coverage-matrix.test.mjs",
  "testing/public-launch-blocker-registry.json",
  "testing/public-launch-blocker-registry.test.mjs",
  "testing/static-test-safety-manifest.json",
  "testing/static-test-safety-manifest.test.mjs",
  "testing/run-static-readiness.mjs",
]);
const EXPECTED_RETAINED_WORKTREE_MODIFIED_PATHS = Object.freeze([
  "testing/admin-v1-staging-runtime-core.mjs",
  "testing/admin-v1-staging-runtime-orchestrator.mjs",
  "testing/admin-v1-staging-runtime-source-policy.test.mjs",
  "testing/admin-v1-staging-runtime-evidence.json",
  "testing/admin-v1-launch-scope.test.mjs",
  "testing/admin-v1-staging-readiness-source-policy.test.mjs",
  "testing/admin-v1-staging-readiness-evidence.test.mjs",
  "testing/authenticated-live-route-partial-evidence.test.mjs",
  "testing/authenticated-live-route-synthetic-rejection-candidate-ledger.test.mjs",
  "testing/readiness-coverage-matrix.test.mjs",
  "testing/public-launch-blocker-registry.test.mjs",
  "testing/static-test-safety-manifest.json",
  "testing/static-test-safety-manifest.test.mjs",
  "testing/run-static-readiness.mjs",
]);
const EXPECTED_POST_TRANSITION_JSON_PATHS = Object.freeze([
  "testing/admin-v1-staging-runtime-evidence.json",
  "testing/readiness-coverage-matrix.json",
  "testing/public-launch-blocker-registry.json",
  "testing/static-test-safety-manifest.json",
]);

function absolute(relativePath) {
  const resolved = path.resolve(process.cwd(), relativePath);
  assert(resolved.startsWith(`${process.cwd()}${path.sep}`));
  return resolved;
}

function source(relativePath) {
  return new TextDecoder("utf-8", { fatal: true }).decode(
    readFileSync(absolute(relativePath)),
  );
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalReviewedBytes(relativePath, bytes) {
  let text;
  if (relativePath === "testing/static-test-safety-manifest.json") {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const fields = [
      /("testing_tree_digest": ")[a-f0-9]{64}(")/gu,
      /("phase_33fa_c1_execution_surface_digest": \{[\s\S]*?"sha256": ")[a-f0-9]{64}("\n  \})/gu,
      /("phase_c2_1_execution_surface_digest": \{[\s\S]*?"sha256": ")[a-f0-9]{64}("\n  \})/gu,
      /("phase_c2_2_execution_surface_digest": \{[\s\S]*?"sha256": ")[a-f0-9]{64}("\n  \})/gu,
      /("phase_33ka_v1_admin_execution_surface_digest": \{[\s\S]*?"sha256": ")[a-f0-9]{64}("\n  \})/gu,
      /("phase_33na_v1_staging_execution_surface_digest": \{[\s\S]*?"sha256": ")[a-f0-9]{64}("\n  \})/gu,
      /("phase_34fa_v1_runtime_execution_surface_digest": \{[\s\S]*?"sha256": ")[a-f0-9]{64}("\n  \})/gu,
    ];
    for (const pattern of fields) {
      assert.equal([...text.matchAll(pattern)].length, 1);
      text = text.replace(
        pattern,
        (_match, prefix, suffix) =>
          `${prefix}${"0".repeat(64)}${suffix}`,
      );
    }
    return Buffer.from(text, "utf8");
  }
  if (relativePath === ORCHESTRATOR_PATH) {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    for (const name of [
      "REVIEWED_PRELIVE_AGGREGATE_SHA256",
      "REVIEWED_STABLE_SURFACE_SHA256",
    ]) {
      const pattern = new RegExp(
        `(const ${name} =\\n  \")[a-f0-9]{64}(\";)`,
        "gu",
      );
      assert.equal([...text.matchAll(pattern)].length, 1);
      text = text.replace(
        pattern,
        (_match, prefix, suffix) =>
          `${prefix}${"0".repeat(64)}${suffix}`,
      );
    }
    return Buffer.from(text, "utf8");
  }
  return bytes;
}

function reviewedCandidateFacts(orchestratorSource) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const actualPaths = literalArrayFromDeclaration(
    facts.root,
    "AUTHORIZED_REPOSITORY_PATHS",
  );
  const actualPostTransitionPaths = literalArrayFromDeclaration(
    facts.root,
    "POST_TRANSITION_JSON_PATHS",
  );
  const retainedWorktreeModifiedPaths = literalArrayFromDeclaration(
    facts.root,
    "RETAINED_WORKTREE_MODIFIED_PATHS",
  );
  const pinned = orchestratorSource.match(
    /const REVIEWED_PRELIVE_AGGREGATE_SHA256 =\n  "([a-f0-9]{64})";/u,
  )?.[1];
  const stablePinned = orchestratorSource.match(
    /const REVIEWED_STABLE_SURFACE_SHA256 =\n  "([a-f0-9]{64})";/u,
  )?.[1];
  const rowForPath = (relativePath) => {
    const filePath = absolute(relativePath);
    const metadata = lstatSync(filePath);
    assert(metadata.isFile());
    assert(!metadata.isSymbolicLink());
    assert.equal(metadata.mode & 0o777, 0o644);
    assert.equal(realpathSync(filePath), filePath);
    const original = readFileSync(filePath);
    const canonical = canonicalReviewedBytes(relativePath, original);
    return [
      relativePath,
      sha256(canonical),
      String(canonical.byteLength),
      "0644",
    ].join("\0");
  };
  const rows = EXPECTED_AUTHORIZED_REPOSITORY_PATHS.map(rowForPath);
  const stableRows = EXPECTED_AUTHORIZED_REPOSITORY_PATHS.filter(
    (relativePath) =>
      !EXPECTED_POST_TRANSITION_JSON_PATHS.includes(relativePath),
  ).map(rowForPath);
  return {
    actual: sha256(rows.join("\n")),
    stableActual: sha256(stableRows.join("\n")),
    lifecycle: JSON.parse(
      source("testing/admin-v1-staging-runtime-evidence.json"),
    ).lifecycle,
    pathsExact: exactSet(actualPaths ?? [], EXPECTED_AUTHORIZED_REPOSITORY_PATHS),
    postTransitionPathsExact: exactSet(
      actualPostTransitionPaths ?? [],
      EXPECTED_POST_TRANSITION_JSON_PATHS,
    ),
    retainedWorktreeModifiedPathsExact: exactSet(
      retainedWorktreeModifiedPaths ?? [],
      EXPECTED_RETAINED_WORKTREE_MODIFIED_PATHS,
    ),
    pinned,
    stablePinned,
  };
}

function catches(operation) {
  try {
    operation();
    return false;
  } catch {
    return true;
  }
}

async function catchesAsync(operation) {
  try {
    await operation();
    return false;
  } catch {
    return true;
  }
}

function caughtCode(operation) {
  try {
    operation();
    return null;
  } catch (caught) {
    return caught?.code ?? null;
  }
}

function exactSet(actual, expected) {
  return (
    actual.length === expected.length &&
    [...actual]
      .sort()
      .every((value, index) => value === [...expected].sort()[index])
  );
}

function exactJsonMultiset(actual, expected) {
  return exactSet(
    actual.map((value) => JSON.stringify(value)),
    expected.map((value) => JSON.stringify(value)),
  );
}

let canonicalOrchestratorSource = null;
let canonicalOrchestratorFacts = null;
const namedFunctionDeclarations = new WeakMap();
const moduleVariableInitializers = new WeakMap();

function astFacts(relativePath, text = source(relativePath)) {
  if (
    relativePath === ORCHESTRATOR_PATH &&
    text === canonicalOrchestratorSource &&
    canonicalOrchestratorFacts !== null
  ) {
    return canonicalOrchestratorFacts;
  }
  const root = ts.createSourceFile(
    relativePath,
    text,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.JS,
  );
  const imports = [];
  const calls = [];
  const declarations = new Map();
  const functions = new Map();
  const visit = (node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node)) calls.push(node.getText(root));
    if (ts.isFunctionDeclaration(node) && node.name) {
      functions.set(node.name.text, node);
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      declarations.set(node.name.text, node.initializer?.getText(root) ?? "");
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  const moduleVariables = new Map();
  for (const statement of root.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer) {
        moduleVariables.set(declaration.name.text, declaration.initializer);
      }
    }
  }
  namedFunctionDeclarations.set(root, functions);
  moduleVariableInitializers.set(root, moduleVariables);
  const facts = { calls, declarations, imports: imports.sort(), root };
  if (
    relativePath === ORCHESTRATOR_PATH &&
    text === canonicalOrchestratorSource
  ) {
    canonicalOrchestratorFacts = facts;
  }
  return facts;
}

function literalArrayFromDeclaration(root, declarationName) {
  const cachedInitializer =
    moduleVariableInitializers.get(root)?.get(declarationName) ?? null;
  let result = null;
  if (cachedInitializer !== null) {
    let expression = cachedInitializer;
    if (
      ts.isCallExpression(expression) &&
      expression.expression.getText(root) === "Object.freeze" &&
      expression.arguments.length === 1
    ) {
      [expression] = expression.arguments;
    }
    if (
      ts.isArrayLiteralExpression(expression) &&
      expression.elements.every(
        (element) =>
          ts.isStringLiteral(element) ||
          ts.isNoSubstitutionTemplateLiteral(element),
      )
    ) {
      return expression.elements.map((element) => element.text);
    }
  }
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === declarationName &&
      node.initializer
    ) {
      let expression = node.initializer;
      if (
        ts.isCallExpression(expression) &&
        expression.expression.getText(root) === "Object.freeze" &&
        expression.arguments.length === 1
      ) {
        [expression] = expression.arguments;
      }
      if (
        ts.isArrayLiteralExpression(expression) &&
        expression.elements.every(
          (element) =>
            ts.isStringLiteral(element) ||
            ts.isNoSubstitutionTemplateLiteral(element),
        )
      ) {
        result = expression.elements.map((element) => element.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return result;
}

function namedFunctionText(root, functionName) {
  const cached = namedFunctionDeclarations.get(root)?.get(functionName);
  if (cached) return cached.getText(root);
  let result = null;
  const visit = (node) => {
    if (
      ts.isFunctionDeclaration(node) &&
      node.name?.text === functionName
    ) {
      result = node.getText(root);
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return result;
}

function namedFunctionNode(root, functionName) {
  const cached = namedFunctionDeclarations.get(root)?.get(functionName);
  if (cached) return cached;
  let result = null;
  const visit = (node) => {
    if (
      ts.isFunctionDeclaration(node) &&
      node.name?.text === functionName
    ) {
      result = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return result;
}

function functionCallTexts(root, functionName) {
  const declaration = namedFunctionNode(root, functionName);
  if (!declaration) return [];
  const calls = [];
  const visit = (node) => {
    if (ts.isCallExpression(node)) calls.push(node.getText(root));
    ts.forEachChild(node, visit);
  };
  visit(declaration);
  return calls;
}

function functionHasCall(root, functionName, expected) {
  return functionCallTexts(root, functionName).includes(expected);
}

function functionCallOrder(root, functionName, first, second) {
  const calls = functionCallTexts(root, functionName);
  const firstIndex = calls.indexOf(first);
  const secondIndex = calls.indexOf(second);
  return firstIndex >= 0 && secondIndex > firstIndex;
}

function mandatoryCallBefore(root, functionName, required, effect) {
  const declaration = namedFunctionNode(root, functionName);
  if (!declaration?.body) return false;
  const statements = [...declaration.body.statements];
  const requiredIndex = statements.findIndex(
    (statement) =>
      ts.isExpressionStatement(statement) &&
      ts.isCallExpression(statement.expression) &&
      statement.expression.getText(root) === required,
  );
  const effectIndex = statements.findIndex((statement) => {
    let found = false;
    const visit = (node) => {
      if (
        ts.isCallExpression(node) &&
        node.getText(root) === effect
      ) {
        found = true;
        return;
      }
      ts.forEachChild(node, visit);
    };
    visit(statement);
    return found;
  });
  return requiredIndex >= 0 && effectIndex > requiredIndex;
}

function topLevelVariableInitializerText(root, functionName, variableName) {
  const declaration = namedFunctionNode(root, functionName);
  if (!declaration?.body) return null;
  for (const statement of declaration.body.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const variable of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(variable.name) &&
        variable.name.text === variableName &&
        variable.initializer
      ) {
        return variable.initializer.getText(root);
      }
    }
  }
  return null;
}

function moduleVariableInitializerText(root, variableName) {
  const cached = moduleVariableInitializers.get(root)?.get(variableName);
  if (cached) return cached.getText(root);
  for (const statement of root.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const variable of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(variable.name) &&
        variable.name.text === variableName &&
        variable.initializer
      ) {
        return variable.initializer.getText(root);
      }
    }
  }
  return null;
}

function gitCommandFacts(root) {
  const facts = {
    commandVectors: [],
    effectCalls: [],
    forwardingCalls: 0,
    gitExecutableCalls: 0,
    pushVectors: [],
    valid: true,
  };
  const wrapperNames = new Set([
    "fetch",
    "httpsRequest",
    "runChild",
    "runGhChild",
    "runGit",
    "runGitChild",
    "runVercelChild",
    "runVercelControl",
    "spawnSync",
  ]);
  const effectCallNames = new Set([
    "runChild",
    "runGhChild",
    "httpsRequest",
    "runVercelChild",
    "runVercelControl",
  ]);
  const allowedRunChildExecutables = new Set([
    "CURL_EXECUTABLE",
    "GH_EXECUTABLE",
    "GIT_EXECUTABLE",
    "NODE_EXECUTABLE",
  ]);
  const allowedGitCommands = new Set([
    "add",
    "branch",
    "cat-file",
    "commit",
    "commit-tree",
    "config",
    "diff",
    "diff-index",
    "diff-tree",
    "hash-object",
    "ls-tree",
    "ls-remote",
    "merge-base",
    "push",
    "remote",
    "read-tree",
    "restore",
    "rev-parse",
    "rev-list",
    "show",
    "status",
    "update-index",
    "worktree",
    "write-tree",
  ]);
  const vector = (expression) => {
    if (!ts.isArrayLiteralExpression(expression)) return null;
    return expression.elements.map((element) =>
      ts.isStringLiteralLike(element) ? element.text : element.getText(root),
    );
  };
  const recordVector = (value) => {
    if (!value) return;
    const commandIndex = value[0] === "-C" ? 2 : 0;
    const command = value[commandIndex];
    if (
      (value[0] === "-C" && value.length < 3) ||
      !allowedGitCommands.has(command)
    ) {
      facts.valid = false;
      return;
    }
    facts.commandVectors.push(value);
    if (command === "push") facts.pushVectors.push(value);
  };
  const visit = (node, currentFunction = null) => {
    const functionName =
      ts.isFunctionDeclaration(node) && node.name
        ? node.name.text
        : currentFunction;
    if (
      ts.isIdentifier(node) &&
      wrapperNames.has(node.text) &&
      !(
        ts.isFunctionDeclaration(node.parent) &&
        node.parent.name === node
      ) &&
      !(
        ["httpsRequest", "spawnSync"].includes(node.text) &&
        ts.isImportSpecifier(node.parent) &&
        node.parent.name === node
      ) &&
      !(
        ts.isPropertyAssignment(node.parent) &&
        node.parent.name === node
      ) &&
      !(
        ts.isCallExpression(node.parent) &&
        node.parent.expression === node
      )
    ) {
      facts.valid = false;
    }
    if (
      (ts.isPropertyAccessExpression(node) &&
        node.name.text === "fetch") ||
      (ts.isElementAccessExpression(node) &&
        ts.isStringLiteralLike(node.argumentExpression) &&
        node.argumentExpression.text === "fetch")
    ) {
      facts.valid = false;
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const callee = node.expression.text;
      if (effectCallNames.has(callee)) {
        const effectArguments = node.arguments.map((argument) =>
          argument.getText(root).replace(/\s+/gu, " ").trim(),
        );
        if (callee === "httpsRequest") {
          if (
            node.arguments.length !== 2 ||
            !ts.isArrowFunction(node.arguments[1])
          ) {
            facts.valid = false;
          } else {
            effectArguments[1] = "<response-handler>";
          }
        }
        facts.effectCalls.push([
          functionName,
          callee,
          effectArguments,
        ]);
      }
      if (callee === "runGitChild") {
        const args = vector(node.arguments[0]);
        if (args) {
          recordVector(args);
        } else if (
          functionName === "runGit" &&
          node.getText(root) ===
            "runGitChild(args, { cwd: repositoryRoot })"
        ) {
          facts.forwardingCalls += 1;
        } else {
          facts.valid = false;
        }
      } else if (callee === "runGit") {
        const args = vector(node.arguments[1]);
        if (args) recordVector(args);
        else facts.valid = false;
      } else if (callee === "runChild") {
        const executable = node.arguments[0]?.getText(root) ?? "";
        if (!allowedRunChildExecutables.has(executable)) {
          facts.valid = false;
        }
        if (executable === "GIT_EXECUTABLE") {
          facts.gitExecutableCalls += 1;
          if (functionName !== "runGitChild") facts.valid = false;
        }
      }
    }
    ts.forEachChild(node, (child) => visit(child, functionName));
  };
  visit(root);
  return facts;
}

function replaceExactlyOnce(value, expected, replacement) {
  const pieces = value.split(expected);
  if (pieces.length !== 2) return null;
  return `${pieces[0]}${replacement}${pieces[1]}`;
}

function uncertainCreateContract(orchestratorSource) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const observerText =
    namedFunctionText(facts.root, "observeBranchPushResult") ?? "";
  const reconciliationText =
    namedFunctionText(facts.root, "reconcileTemporaryBranchCreate") ?? "";
  const createText =
    namedFunctionText(facts.root, "createPreviewTrigger") ?? "";
  return (
    observerText.includes('return "ZERO_EXACT"') &&
    observerText.includes('return "ZERO_UNCERTAIN"') &&
    observerText.includes('return "NONZERO_UNCERTAIN"') &&
    observerText.includes('return "SPAWN_ERROR"') &&
    observerText.includes("result.stdout.fill(0)") &&
    observerText.includes("result.stderr.fill(0)") &&
    reconciliationText.includes(
      "const clientExitClass = observeBranchPushResult(",
    ) &&
    reconciliationText.includes(
      "for (let readAttempt = 1; readAttempt <= 2; readAttempt += 1)",
    ) &&
    reconciliationText.includes('if (refState === "OURS")') &&
    reconciliationText.includes('state: "CREATE_CONFIRMED"') &&
    reconciliationText.includes('if (refState === "OTHER")') &&
    reconciliationText.includes('state: "CONFLICT_STOP"') &&
    reconciliationText.includes(
      'fail("TEMPORARY_BRANCH_CREATE_NOT_APPLIED")',
    ) &&
    reconciliationText.includes(
      'context.remoteBranchCreated = true;\n  context.branchRemoved = true;\n  fail("TEMPORARY_BRANCH_CREATE_NOT_APPLIED")',
    ) &&
    createText.includes('state: "CREATE_REQUESTED"') &&
    createText.includes(
      "reconcileTemporaryBranchCreate(context, push, commitSha, branchRef)",
    ) &&
    !createText.includes(
      "requireNewBranchPushResult(push, commitSha, branchRef)",
    )
  );
}

function uncertainCreateAssertions(orchestratorSource) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const reconciliationText =
    namedFunctionText(facts.root, "reconcileTemporaryBranchCreate") ?? "";
  const readBoundMutation = reconciliationText.replace(
    "for (let readAttempt = 1; readAttempt <= 2; readAttempt += 1)",
    "for (let readAttempt = 1; readAttempt <= 1; readAttempt += 1)",
  );
  const scopedReadBoundMutation =
    reconciliationText.length > 0 && readBoundMutation !== reconciliationText
      ? replaceExactlyOnce(
          orchestratorSource,
          reconciliationText,
          readBoundMutation,
        )
      : null;
  const scopedMutations = [
    [
      '    if (refState === "OURS") {\n      recordBranchTransaction(context, {\n        attempt: 1,',
      '    if (clientExitClass === "ZERO_EXACT" && refState === "OURS") {\n      recordBranchTransaction(context, {\n        attempt: 1,',
    ],
    [
      '    if (refState === "OTHER") {\n      recordBranchTransaction(context, {\n        attempt: 1,',
      '    if (false && refState === "OTHER") {\n      recordBranchTransaction(context, {\n        attempt: 1,',
    ],
    [
      'fail("TEMPORARY_BRANCH_CREATE_NOT_APPLIED")',
      'return { clientExitClass, refState: "ABSENT" }',
    ],
    [
      'context.remoteBranchCreated = true;\n  context.branchRemoved = true;\n  fail("TEMPORARY_BRANCH_CREATE_NOT_APPLIED")',
      'context.remoteBranchCreated = false;\n  context.branchRemoved = true;\n  fail("TEMPORARY_BRANCH_CREATE_NOT_APPLIED")',
    ],
  ].map(([expected, replacement]) => {
    const mutatedFunction = reconciliationText.replace(
      expected,
      replacement,
    );
    return mutatedFunction !== reconciliationText
      ? replaceExactlyOnce(
          orchestratorSource,
          reconciliationText,
          mutatedFunction,
        )
      : null;
  });
  const createRequestMutation = replaceExactlyOnce(
    orchestratorSource,
    '    state: "CREATE_REQUESTED",\n  });\n  context.remoteBranchCreated = true;',
    '    state: "CREATE_RESULT_OBSERVED",\n  });\n  context.remoteBranchCreated = true;',
  );
  const mutations = [
    scopedReadBoundMutation,
    ...scopedMutations,
    createRequestMutation,
  ];
  return [
    uncertainCreateContract(orchestratorSource) &&
      mutations.every(
        (mutation) =>
          mutation !== null && !uncertainCreateContract(mutation),
      ),
  ];
}

function uncertainDeleteContract(orchestratorSource) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const reconciliationText =
    namedFunctionText(facts.root, "reconcileTemporaryBranchDelete") ?? "";
  const finalAbsenceText =
    namedFunctionText(facts.root, "confirmFinalTemporaryBranchAbsence") ?? "";
  const deleteText =
    namedFunctionText(facts.root, "deleteTemporaryBranch") ?? "";
  return (
    deleteText.includes(
      "let deleteAttempt = context.branchDeleteAttempts + 1",
    ) &&
    deleteText.includes('"TEMPORARY_BRANCH_DELETE_RESUME_STATE"') &&
    deleteText.includes('if (resumeState !== "OURS")') &&
    deleteText.includes("context.branchDeleteAttempts = deleteAttempt") &&
    deleteText.includes('state: "DELETE_REQUESTED"') &&
    deleteText.includes(
      "`--force-with-lease=${branchRef}:${commitSha}`",
    ) &&
    deleteText.includes(
      "const transition = reconcileTemporaryBranchDelete(",
    ) &&
    deleteText.includes("context,\n      deletion,\n      deleteAttempt,") &&
    deleteText.includes('if (transition === "CONFIRMED")') &&
    deleteText.includes('if (transition !== "RETRY")') &&
    !deleteText.includes("context.branchDeleteAttempted") &&
    reconciliationText.includes(
      "const clientExitClass = observeBranchPushResult(",
    ) &&
    reconciliationText.includes('state: "DELETE_RESULT_OBSERVED"') &&
    reconciliationText.includes(
      "for (let absenceRead = 1; absenceRead <= 2; absenceRead += 1)",
    ) &&
    reconciliationText.includes("if (absenceRead === 1) continue") &&
    reconciliationText.includes(
      'if (refState === "OURS" && deleteAttempt === 1)',
    ) &&
    reconciliationText.includes('state: "DELETE_RETRY_REQUESTED"') &&
    reconciliationText.includes('if (refState === "OTHER")') &&
    reconciliationText.includes('state: "CONFLICT_STOP"') &&
    reconciliationText.includes(
      "return confirmFinalTemporaryBranchAbsence(",
    ) &&
    reconciliationText.includes("context,\n        deleteAttempt,\n        readState,") &&
    finalAbsenceText.includes(
      "for (let finalRead = 1; finalRead <= 2; finalRead += 1)",
    ) &&
    finalAbsenceText.includes('state: "DELETE_CONFIRMED"')
  );
}

function uncertainDeleteAssertions(orchestratorSource) {
  const mutations = [
    [
      "let deleteAttempt = context.branchDeleteAttempts + 1;",
      "let deleteAttempt = 1;",
    ],
    [
      'if (refState === "OURS" && deleteAttempt === 1)',
      'if (refState === "OURS")',
    ],
    [
      "for (let absenceRead = 1; absenceRead <= 2; absenceRead += 1)",
      "for (let absenceRead = 1; absenceRead <= 1; absenceRead += 1)",
    ],
    [
      "for (let finalRead = 1; finalRead <= 2; finalRead += 1)",
      "for (let finalRead = 1; finalRead <= 1; finalRead += 1)",
    ],
    [
      "`--force-with-lease=${branchRef}:${commitSha}`",
      '"--force-with-lease"',
    ],
    [
      'if (transition !== "RETRY")',
      'if (transition === "RETRY")',
    ],
  ].map(([expected, replacement]) =>
    replaceExactlyOnce(orchestratorSource, expected, replacement),
  );
  return [
    uncertainDeleteContract(orchestratorSource) &&
      mutations.every(
        (mutation) =>
          mutation !== null && !uncertainDeleteContract(mutation),
      ),
  ];
}

const EXPECTED_BRANCH_TRANSACTION_STATES = Object.freeze([
  "INITIAL_REF_ABSENT",
  "CREATE_REQUESTED",
  "CREATE_RESULT_OBSERVED",
  "CREATE_REF_ABSENT",
  "CREATE_REF_OURS",
  "CREATE_REF_OTHER",
  "CREATE_CONFIRMED",
  "DELETE_REQUESTED",
  "DELETE_RESULT_OBSERVED",
  "DELETE_REF_ABSENT",
  "DELETE_REF_OURS",
  "DELETE_REF_OTHER",
  "DELETE_RETRY_REQUESTED",
  "DELETE_CONFIRMED",
  "CONFLICT_STOP",
  "CLEANUP_FAILED",
]);

function branchTransactionStateMatrixContract(orchestratorSource) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const states = literalArrayFromDeclaration(
    facts.root,
    "BRANCH_TRANSACTION_STATES",
  );
  const transitionText =
    namedFunctionText(facts.root, "assertBranchTransactionTransition") ?? "";
  const journalText =
    namedFunctionText(facts.root, "recordBranchTransaction") ?? "";
  const selfTestText =
    namedFunctionText(
      facts.root,
      "runBranchTransactionStateMachineSelfTest",
    ) ?? "";
  return (
    JSON.stringify(states) ===
      JSON.stringify(EXPECTED_BRANCH_TRANSACTION_STATES) &&
    transitionText.includes(
      "BRANCH_TRANSACTION_TRANSITIONS[previousState]?.includes(nextState)",
    ) &&
    transitionText.includes('fail("BRANCH_TRANSACTION_TRANSITION")') &&
    journalText.includes("BRANCH_TRANSACTION_STATE_SET.has(entry.state)") &&
    journalText.includes(
      "assertBranchTransactionTransition(previousState, entry.state)",
    ) &&
    journalText.includes("context.branchTransactionJournal.push(") &&
    selfTestText.includes("EXPECTED_BRANCH_TRANSACTION_TRANSITIONS") &&
    selfTestText.includes('"CREATE_APPLIED_NONZERO"') &&
    selfTestText.includes('"CREATE_ABSENT_NONZERO"') &&
    selfTestText.includes('"CREATE_OTHER_CONFLICT"') &&
    selfTestText.includes('"DELETE_APPLIED_NONZERO"') &&
    selfTestText.includes('"DELETE_OURS_RETRY"') &&
    selfTestText.includes('"DELETE_OTHER_CONFLICT"') &&
    selfTestText.includes('"CONTRADICTORY_RESULT_REF"')
  );
}

function branchTransactionStateMatrixAssertions(orchestratorSource) {
  const mutations = [
    ['  "CREATE_RESULT_OBSERVED",\n', ""],
    [
      '  "DELETE_REF_OTHER",\n  "DELETE_RETRY_REQUESTED",\n  "DELETE_CONFIRMED",',
      '  "DELETE_REF_OTHER",\n  "DELETE_CONFIRMED",',
    ],
    [
      "BRANCH_TRANSACTION_TRANSITIONS[previousState]?.includes(nextState)",
      "true",
    ],
    [
      "assertBranchTransactionTransition(previousState, entry.state);\n  if (",
      "true;\n  if (",
    ],
    ['    "CREATE_APPLIED_NONZERO",\n', '    "CREATE_APPLIED_ZERO",\n'],
    ['    "DELETE_OURS_RETRY",\n', '    "DELETE_OURS_STOP",\n'],
    [
      '    "CONTRADICTORY_RESULT_REF",\n',
      '    "CONSISTENT_RESULT_REF",\n',
    ],
  ].map(([expected, replacement]) =>
    replaceExactlyOnce(orchestratorSource, expected, replacement),
  );
  return [
    branchTransactionStateMatrixContract(orchestratorSource) &&
      mutations.every(
        (mutation) =>
          mutation !== null &&
          !branchTransactionStateMatrixContract(mutation),
      ),
  ];
}

const EXPECTED_BRANCH_TRANSACTION_JOURNAL_KEYS = Object.freeze([
  "attempt",
  "client_exit_class",
  "exact_ref_state",
  "external_mutation_possible",
  "live_may_continue",
  "operation",
  "retry_permitted",
  "sequence",
  "state",
]);

function branchTransactionJournalAndBudgetContract(
  coreSource,
  orchestratorSource,
  evidenceTestSource,
) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const keys = literalArrayFromDeclaration(
    facts.root,
    "BRANCH_TRANSACTION_JOURNAL_KEYS",
  );
  const budgetText =
    namedFunctionText(facts.root, "GlobalBudgets") ??
    orchestratorSource.slice(
      orchestratorSource.indexOf("class GlobalBudgets"),
      orchestratorSource.indexOf("function canonicalJsonFile"),
    );
  const initialText =
    namedFunctionText(facts.root, "verifyInitialTemporaryBranchAbsence") ?? "";
  const journalText =
    namedFunctionText(facts.root, "recordBranchTransaction") ?? "";
  const selfTestText =
    namedFunctionText(
      facts.root,
      "runBranchTransactionStateMachineSelfTest",
    ) ?? "";
  const gitReadAuthorityText =
    namedFunctionText(facts.root, "delta18GitRemoteReadMaximum") ?? "";
  const gitReadAuthoritySelfTestText =
    namedFunctionText(
      facts.root,
      "runDelta18GitRemoteReadAuthoritySelfTest",
    ) ?? "";
  const registrationPushText =
    namedFunctionText(facts.root, "pushDelta14RegistrationBranch") ?? "";
  const registrationReconcileText =
    namedFunctionText(facts.root, "reconcileDelta14RegistrationPush") ?? "";
  const runSelfTestText = namedFunctionText(facts.root, "runSelfTest") ?? "";
  return (
    coreSource.includes("git_remote_reads_maximum: 42") &&
    budgetText.includes("temporaryBranchDeletePushes: 2") &&
    budgetText.includes(
      "gitRemoteReads: plan.budgets.git_remote_reads_maximum",
    ) &&
    budgetText.includes("delta18GitRemoteReadMaximum(plan)") &&
    gitReadAuthorityText.includes(
      "plan.budgets.environment_record_creates_maximum",
    ) &&
    gitReadAuthorityText.includes(
      "plan.budgets.branch_propagation_retries_maximum",
    ) &&
    gitReadAuthorityText.includes("registration_observation_refs: 4") &&
    gitReadAuthorityText.includes("qualification_branch_delete_retry: 2") &&
    gitReadAuthorityText.includes("official_final_absence: 2") &&
    gitReadAuthorityText.includes("maximum !== 42") &&
    gitReadAuthoritySelfTestText.includes("qualification: 34") &&
    gitReadAuthoritySelfTestText.includes("target_identification: 2") &&
    gitReadAuthoritySelfTestText.includes("official_execution: 4") &&
    gitReadAuthoritySelfTestText.includes("delete_retry_reserve: 2") &&
    gitReadAuthoritySelfTestText.includes(
      'budgets.take("gitRemoteReads", maximum)',
    ) &&
    registrationPushText.includes("reconcileDelta14RegistrationPush(") &&
    registrationReconcileText.includes("consecutiveAbsentObservations") &&
    registrationReconcileText.includes("consecutiveOwnedObservations") &&
    registrationReconcileText.includes(
      "consecutiveAbsentObservations === 2",
    ) &&
    registrationReconcileText.includes(
      "consecutiveOwnedObservations !== 2",
    ) &&
    registrationReconcileText.includes(
      'fail("DELTA18_REGISTRATION_RECONCILIATION_UNREADABLE")',
    ) &&
    orchestratorSource.includes(
      'CREATE_RESULT_OBSERVED: Object.freeze([\n    "CREATE_REF_ABSENT",\n    "CREATE_REF_OURS",\n    "CREATE_REF_OTHER",\n    "DELETE_REQUESTED",',
    ) &&
    orchestratorSource.includes(
      'CREATE_REF_ABSENT: Object.freeze([\n    "CREATE_REF_ABSENT",\n    "CREATE_REF_OURS",\n    "CREATE_REF_OTHER",\n    "DELETE_REQUESTED",',
    ) &&
    runSelfTestText.includes("runDelta18GitRemoteReadAuthoritySelfTest(plan)") &&
    initialText.includes(
      "for (let initialRead = 1; initialRead <= 2; initialRead += 1)",
    ) &&
    JSON.stringify(keys) ===
      JSON.stringify(EXPECTED_BRANCH_TRANSACTION_JOURNAL_KEYS) &&
    orchestratorSource.includes(
      "const BRANCH_TRANSACTION_JOURNAL_MAXIMUM = 32",
    ) &&
    journalText.includes("Object.keys(entry).sort()") &&
    journalText.includes("BRANCH_TRANSACTION_JOURNAL_KEYS") &&
    journalText.includes("context.branchTransactionJournal.length >=") &&
    journalText.includes("BRANCH_TRANSACTION_JOURNAL_MAXIMUM") &&
    !journalText.includes("stdout") &&
    !journalText.includes("stderr") &&
    !journalText.includes("raw_output") &&
    selfTestText.includes('"MISSING_SECOND_ABSENCE"') &&
    selfTestText.includes('"RETRY_WITHOUT_EXACT_OURS"') &&
    selfTestText.includes('"DELETE_RETRY_COUNT_OVERFLOW"') &&
    selfTestText.includes('"RAW_CHILD_OUTPUT_JOURNAL_REJECTED"') &&
    selfTestText.includes('"BRANCH_JOURNAL_OVERFLOW"') &&
    selfTestText.includes('"BRANCH_BUDGET_OVERFLOW"') &&
    selfTestText.includes('"REGISTRATION_UNCERTAIN_POSTREAD_CLEANUP"') &&
    selfTestText.includes("registrationSingleOwnedRejected") &&
    selfTestText.includes("registrationSingleAbsentRejected") &&
    evidenceTestSource.includes("journal.length < 12") &&
    evidenceTestSource.includes("journal.length > 18") &&
    evidenceTestSource.includes(
      "BRANCH_TRANSACTION_TRANSITIONS[previousState]?.includes(",
    ) &&
    evidenceTestSource.includes("branchJournalEntryMatches(entry") &&
    evidenceTestSource.includes(
      "branchTransactionJournalValidatorSelfTest()",
    ) &&
    evidenceTestSource.includes("length: 13") &&
    evidenceTestSource.includes("length: 17") &&
    evidenceTestSource.includes("length: 18") &&
    evidenceTestSource.includes('.exact_ref_state = "OTHER"')
  );
}

function branchTransactionJournalAndBudgetAssertions(
  coreSource,
  orchestratorSource,
  evidenceTestSource,
) {
  const mutations = [
    ["temporaryBranchDeletePushes: 2", "temporaryBranchDeletePushes: 3"],
    [
      "for (let initialRead = 1; initialRead <= 2; initialRead += 1)",
      "for (let initialRead = 1; initialRead <= 1; initialRead += 1)",
    ],
    [
      "const BRANCH_TRANSACTION_JOURNAL_MAXIMUM = 32",
      "const BRANCH_TRANSACTION_JOURNAL_MAXIMUM = 33",
    ],
    [
      "assertBranchTransactionTransition(previousState, entry.state);\n  if (\n    canonicalJson(Object.keys(entry).sort())",
      'assertBranchTransactionTransition(previousState, entry.state);\n  if (\n    canonicalJson([...Object.keys(entry), "raw_output"].sort())',
    ],
    [
      '    "MISSING_SECOND_ABSENCE",\n',
      '    "SECOND_ABSENCE_OPTIONAL",\n',
    ],
    [
      '    "RETRY_WITHOUT_EXACT_OURS",\n',
      '    "RETRY_WITHOUT_STATE",\n',
    ],
    [
      '    "DELETE_RETRY_COUNT_OVERFLOW",\n',
      '    "DELETE_RETRY_UNBOUNDED",\n',
    ],
    [
      '    "BRANCH_JOURNAL_OVERFLOW",\n',
      '    "BRANCH_JOURNAL_UNBOUNDED",\n',
    ],
    [
      '    "BRANCH_BUDGET_OVERFLOW",\n',
      '    "BRANCH_BUDGET_UNBOUNDED",\n',
    ],
    [
      "qualification_branch_delete_retry: 2",
      "qualification_branch_delete_retry: 1",
    ],
    [
      '  fail("DELTA18_REGISTRATION_RECONCILIATION_UNREADABLE");\n',
      "  return null;\n",
    ],
    [
      '    "REGISTRATION_UNCERTAIN_POSTREAD_CLEANUP",\n',
      '    "REGISTRATION_POSTREAD_REPLAY_ALLOWED",\n',
    ],
    [
      "if (consecutiveAbsentObservations === 2) {\n        context.remoteBranchCreated = false;",
      "if (consecutiveAbsentObservations === 1) {\n        context.remoteBranchCreated = false;",
    ],
    [
      "consecutiveOwnedObservations !== 2",
      "consecutiveOwnedObservations !== 1",
    ],
  ].map(([expected, replacement]) =>
    replaceExactlyOnce(orchestratorSource, expected, replacement),
  );
  const coreMutation = replaceExactlyOnce(
    coreSource,
    "git_remote_reads_maximum: 42",
    "git_remote_reads_maximum: 41",
  );
  const evidenceMutations = [
    ["journal.length > 18", "journal.length > 16"],
    [
      "BRANCH_TRANSACTION_TRANSITIONS[previousState]?.includes(",
      "new Set([entry.state]).has(",
    ],
    ['.exact_ref_state = "OTHER"', '.exact_ref_state = "OURS"'],
  ].map(([expected, replacement]) =>
    replaceExactlyOnce(evidenceTestSource, expected, replacement),
  );
  return [
    branchTransactionJournalAndBudgetContract(
      coreSource,
      orchestratorSource,
      evidenceTestSource,
    ) &&
      coreMutation !== null &&
      !branchTransactionJournalAndBudgetContract(
        coreMutation,
        orchestratorSource,
        evidenceTestSource,
      ) &&
      mutations.every(
        (mutation) =>
          mutation !== null &&
          !branchTransactionJournalAndBudgetContract(
            coreSource,
            mutation,
            evidenceTestSource,
          ),
      ) &&
      evidenceMutations.every(
        (mutation) =>
          mutation !== null &&
          !branchTransactionJournalAndBudgetContract(
            coreSource,
            orchestratorSource,
            mutation,
          ),
      )
  ];
}

function branchCasContract(orchestratorSource) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const gitCommands = gitCommandFacts(facts.root);
  const pushScopeInitializer =
    moduleVariableInitializerText(facts.root, "EXACT_PUSH_SCOPE_OPTIONS") ?? "";
  const expectedPushScopeInitializer = `Object.freeze([
  "--porcelain",
  "--atomic",
  "--no-all",
  "--no-mirror",
  "--no-tags",
  "--no-follow-tags",
  "--no-prune",
  "--recurse-submodules=no",
  "--no-set-upstream",
  "--no-verify",
  "--no-signed",
  "--no-push-option",
  "--no-progress",
  "--no-force-if-includes",
])`;
  const originParserText =
    namedFunctionText(facts.root, "exactOriginUrlLine") ?? "";
  const originIdentityText =
    namedFunctionText(facts.root, "verifyOriginRepositoryIdentity") ?? "";
  const normalizedOriginText =
    namedFunctionText(facts.root, "normalizedOriginRepository") ?? "";
  const remoteBranchText =
    namedFunctionText(facts.root, "remoteBranchOutput") ?? "";
  const parserText =
    namedFunctionText(facts.root, "isExactNewBranchPushOutput") ?? "";
  const observerText =
    namedFunctionText(facts.root, "observeBranchPushResult") ?? "";
  const createText =
    namedFunctionText(facts.root, "createPreviewTrigger") ?? "";
  const deleteText =
    namedFunctionText(facts.root, "deleteTemporaryBranch") ?? "";
  const repairText =
    namedFunctionText(facts.root, "fastForwardConditionalRepairBranch") ?? "";
  const registrationPushText =
    namedFunctionText(facts.root, "pushDelta14RegistrationBranch") ?? "";
  const activationPushText =
    namedFunctionText(facts.root, "fastForwardDelta14ActivationBranch") ?? "";
  const executeText = namedFunctionText(facts.root, "executeRuntime") ?? "";
  const selfTestText = namedFunctionText(facts.root, "runSelfTest") ?? "";
  const expectedPushVectors = [
    [
      "push",
      "...EXACT_PUSH_SCOPE_OPTIONS",
      "`--force-with-lease=${branchRef}:`",
      "pushUrl",
      "`${commitSha}:${branchRef}`",
    ],
    [
      "push",
      "...EXACT_PUSH_SCOPE_OPTIONS",
      "`--force-with-lease=${branchRef}:${priorCommitSha}`",
      "pushUrl",
      "`${repairCommitSha}:${branchRef}`",
    ],
    [
      "push",
      "...EXACT_PUSH_SCOPE_OPTIONS",
      "`--force-with-lease=${branchRef}:`",
      "pushUrl",
      "`${registrationCommitSha}:${branchRef}`",
    ],
    [
      "push",
      "...EXACT_PUSH_SCOPE_OPTIONS",
      "`--force-with-lease=${branchRef}:${registrationCommitSha}`",
      "context.pushUrl",
      "`${activationCommitSha}:${branchRef}`",
    ],
    [
      "push",
      "...EXACT_PUSH_SCOPE_OPTIONS",
      "`--force-with-lease=${branchRef}:${commitSha}`",
      "pushUrl",
      "`:${branchRef}`",
    ],
  ];
  return (
    pushScopeInitializer === expectedPushScopeInitializer &&
    gitCommands.valid &&
    gitCommands.pushVectors.length === 5 &&
    JSON.stringify(gitCommands.pushVectors) ===
      JSON.stringify(expectedPushVectors) &&
    normalizedOriginText.includes("accepted.has(remoteUrl)") &&
    !normalizedOriginText.includes("remoteUrl.trim()") &&
    originParserText.includes('output.includes("\\r")') &&
    originParserText.includes('output.endsWith("\\n")') &&
    originParserText.includes('output.slice(0, -1).split("\\n")') &&
    originParserText.includes("lines.length !== 1") &&
    originParserText.includes("lines[0].length === 0") &&
    originParserText.includes("lines[0] !== lines[0].trim()") &&
    originParserText.includes("normalizedOriginRepository(lines[0])") &&
    originIdentityText.includes(
      '["remote", "get-url", "--push", "--all", "origin"]',
    ) &&
    originIdentityText.includes("return pushUrl") &&
    remoteBranchText.includes(
      '["ls-remote", "--heads", pushUrl, `refs/heads/${plan.branch}`]',
    ) &&
    createText.includes(
      "const { repositoryRoot, pushUrl, tempRoot, plan, budgets } = context",
    ) &&
    createText.includes("...EXACT_PUSH_SCOPE_OPTIONS") &&
    deleteText.includes(
      "const { repositoryRoot, pushUrl, plan, budgets, commitSha } = context",
    ) &&
    deleteText.includes("...EXACT_PUSH_SCOPE_OPTIONS") &&
    repairText.includes("...EXACT_PUSH_SCOPE_OPTIONS") &&
    repairText.includes(
      "`--force-with-lease=${branchRef}:${priorCommitSha}`",
    ) &&
    repairText.includes("`${repairCommitSha}:${branchRef}`") &&
    registrationPushText.includes("...EXACT_PUSH_SCOPE_OPTIONS") &&
    registrationPushText.includes(
      "`--force-with-lease=${branchRef}:`",
    ) &&
    registrationPushText.includes(
      "`${registrationCommitSha}:${branchRef}`",
    ) &&
    !registrationPushText.includes('"--force"') &&
    activationPushText.includes("...EXACT_PUSH_SCOPE_OPTIONS") &&
    activationPushText.includes(
      "`--force-with-lease=${branchRef}:${registrationCommitSha}`",
    ) &&
    activationPushText.includes("`${activationCommitSha}:${branchRef}`") &&
    !activationPushText.includes('"--force"') &&
    executeText.includes(
      "const pushUrl = verifyRepositoryLivePreconditions(repositoryRoot, plan)",
    ) &&
    executeText.includes("repositoryRoot,\n    pushUrl,\n    plan,") &&
    executeText.includes("budgets,\n    repositoryRoot,\n    pushUrl,\n    plan,") &&
    selfTestText.includes("invalidOriginUrlOutputs") &&
    selfTestText.includes('fail("SELF_TEST_EXACT_PUSH_SCOPE")') &&
    selfTestText.includes("runBranchTransactionStateMachineSelfTest(plan)") &&
    parserText.includes('typeof output !== "string"') &&
    parserText.includes('output.includes("\\r")') &&
    parserText.includes('output.endsWith("\\n")') &&
    parserText.includes("lines.length !== 3") &&
    parserText.includes('/^To [!-~]+$/u.test(destination)') &&
    parserText.includes(
      'statusLine === `*\\t${commitSha}:${branchRef}\\t[new branch]`',
    ) &&
    parserText.includes('doneLine === "Done"') &&
    observerText.includes("result.stderr.byteLength !== 0") &&
    observerText.includes("isExactNewBranchPushOutput(output, commitSha, branchRef)") &&
    observerText.includes("result.stdout.fill(0)") &&
    observerText.includes("result.stderr.fill(0)") &&
    createText.includes(
      "reconcileTemporaryBranchCreate(context, push, commitSha, branchRef)",
    ) &&
    uncertainCreateContract(orchestratorSource) &&
    uncertainDeleteContract(orchestratorSource)
  );
}

function branchCasAssertions(orchestratorSource) {
  const mutations = [
    [
      "        `--force-with-lease=${branchRef}:`,\n        pushUrl,\n        `${commitSha}:${branchRef}`,",
      "        pushUrl,\n        `${commitSha}:${branchRef}`,",
    ],
    [
      "        `--force-with-lease=${branchRef}:`,\n        pushUrl,\n        `${commitSha}:${branchRef}`,",
      "        \"--force\",\n        pushUrl,\n        `${commitSha}:${branchRef}`,",
    ],
    [
      "        `--force-with-lease=${branchRef}:`,\n        pushUrl,\n        `${commitSha}:${branchRef}`,",
      "        \"--force-with-lease\",\n        pushUrl,\n        `${commitSha}:${branchRef}`,",
    ],
    [
      "        `--force-with-lease=${branchRef}:`,\n        pushUrl,\n        `${commitSha}:${branchRef}`,",
      "        `--force-with-lease=${branchRef}:${commitSha}`,\n        pushUrl,\n        `${commitSha}:${branchRef}`,",
    ],
    [
      "        `--force-with-lease=${branchRef}:`,\n        pushUrl,\n        `${commitSha}:${branchRef}`,",
      "        `--force-with-lease=refs/heads/unrelated:`,\n        pushUrl,\n        `${commitSha}:${branchRef}`,",
    ],
    ["`${commitSha}:${branchRef}`,", "`+${commitSha}:${branchRef}` ,"],
    [
      '`${commitSha}:${branchRef}`,',
      "`${commitSha}:${branchRef}`, `${commitSha}:refs/heads/unrelated`,",
    ],
    [
      "          `--force-with-lease=${branchRef}:${commitSha}`,\n          pushUrl,",
      "          pushUrl,",
    ],
    [
      "`--force-with-lease=${branchRef}:${commitSha}`,",
      '"--force-with-lease",',
    ],
    [
      "`--force-with-lease=${branchRef}:${commitSha}`,",
      "`--force-with-lease=${branchRef}:${plan.baseline}` ,",
    ],
    ["`:${branchRef}`,", "`+:${branchRef}` ,"],
    [
      "`--force-with-lease=${branchRef}:${priorCommitSha}`",
      '"--force-with-lease"',
    ],
    [
      "`${repairCommitSha}:${branchRef}`",
      "`+${repairCommitSha}:${branchRef}`",
    ],
    [
      "        pushUrl,\n        `${commitSha}:${branchRef}`,",
      '        "origin",\n        `${commitSha}:${branchRef}`,',
    ],
    [
      "          pushUrl,\n          `:${branchRef}`,",
      '          "origin",\n          `:${branchRef}`,',
    ],
    [
      '["ls-remote", "--heads", pushUrl, `refs/heads/${plan.branch}`]',
      '["ls-remote", "--heads", "origin", `refs/heads/${plan.branch}`]',
    ],
    [
      "            `--force-with-lease=${branchRef}:`,\n            pushUrl,\n            `${registrationCommitSha}:${branchRef}`,",
      "            pushUrl,\n            `${registrationCommitSha}:${branchRef}`,",
    ],
    [
      "            `--force-with-lease=${branchRef}:`,\n            pushUrl,\n            `${registrationCommitSha}:${branchRef}`,",
      '            "--force",\n            pushUrl,\n            `${registrationCommitSha}:${branchRef}`,',
    ],
    [
      "            `--force-with-lease=${branchRef}:`,\n            pushUrl,\n            `${registrationCommitSha}:${branchRef}`,",
      '            "--force-with-lease",\n            pushUrl,\n            `${registrationCommitSha}:${branchRef}`,',
    ],
    [
      "            `--force-with-lease=${branchRef}:`,\n            pushUrl,\n            `${registrationCommitSha}:${branchRef}`,",
      "            `--force-with-lease=${branchRef}:${registrationCommitSha}`,\n            pushUrl,\n            `${registrationCommitSha}:${branchRef}`,",
    ],
    [
      "            `--force-with-lease=${branchRef}:`,\n            pushUrl,\n            `${registrationCommitSha}:${branchRef}`,",
      "            `--force-with-lease=refs/heads/unrelated:`,\n            pushUrl,\n            `${registrationCommitSha}:${branchRef}`,",
    ],
    [
      "`${registrationCommitSha}:${branchRef}`,",
      "`+${registrationCommitSha}:${branchRef}` ,",
    ],
    [
      "        `--force-with-lease=${branchRef}:${registrationCommitSha}`,\n        context.pushUrl,\n        `${activationCommitSha}:${branchRef}`,",
      "        context.pushUrl,\n        `${activationCommitSha}:${branchRef}`,",
    ],
    [
      "        `--force-with-lease=${branchRef}:${registrationCommitSha}`,\n        context.pushUrl,\n        `${activationCommitSha}:${branchRef}`,",
      '        "--force",\n        context.pushUrl,\n        `${activationCommitSha}:${branchRef}`,',
    ],
    [
      "        `--force-with-lease=${branchRef}:${registrationCommitSha}`,\n        context.pushUrl,\n        `${activationCommitSha}:${branchRef}`,",
      '        "--force-with-lease",\n        context.pushUrl,\n        `${activationCommitSha}:${branchRef}`,',
    ],
    [
      "        `--force-with-lease=${branchRef}:${registrationCommitSha}`,\n        context.pushUrl,\n        `${activationCommitSha}:${branchRef}`,",
      "        `--force-with-lease=${branchRef}:${activationCommitSha}`,\n        context.pushUrl,\n        `${activationCommitSha}:${branchRef}`,",
    ],
    [
      "        `--force-with-lease=${branchRef}:${registrationCommitSha}`,\n        context.pushUrl,\n        `${activationCommitSha}:${branchRef}`,",
      "        `--force-with-lease=refs/heads/unrelated:${registrationCommitSha}`,\n        context.pushUrl,\n        `${activationCommitSha}:${branchRef}`,",
    ],
    [
      "`${activationCommitSha}:${branchRef}`,",
      "`+${activationCommitSha}:${branchRef}` ,",
    ],
  ].map(([expected, replacement]) =>
    replaceExactlyOnce(orchestratorSource, expected, replacement),
  );
  const optionMutations = [
    ['"--no-all",', '"--all",'],
    ['"--no-mirror",', '"--mirror",'],
    ['"--no-tags",', '"--tags",'],
    ['"--no-follow-tags",', '"--follow-tags",'],
    ['"--no-prune",', '"--prune",'],
    ['"--recurse-submodules=no",', '"--recurse-submodules=on-demand",'],
    ['"--no-set-upstream",', '"--set-upstream",'],
    ['"--no-verify",', '"--verify",'],
    ['"--no-signed",', '"--signed",'],
    ['"--no-push-option",', '"--push-option=unexpected",'],
    ['"--no-progress",', '"--progress",'],
    ['"--no-force-if-includes",', '"--force-if-includes",'],
  ].map(([expected, replacement]) => {
    const mutation = orchestratorSource.replace(expected, replacement);
    return mutation === orchestratorSource ? null : mutation;
  });
  const originMutations = [
    [
      '["remote", "get-url", "--push", "--all", "origin"]',
      '["remote", "get-url", "--push", "origin"]',
    ],
    [
      "    lines.length !== 1 ||\n    lines[0].length === 0 ||",
      "    lines.length < 1 ||\n    lines[0].length === 0 ||",
    ],
    ["lines[0].length === 0", "false"],
    ["lines[0] !== lines[0].trim()", "false"],
    ["normalizedOriginRepository(lines[0]);", "// origin validation removed"],
    ["accepted.has(remoteUrl)", "accepted.has(remoteUrl.trim())"],
    [
      '    fail("LIVE_ORIGIN_REPOSITORY");\n  }\n  return pushUrl;\n}\n\nfunction verifyRepositoryLivePreconditions',
      '    fail("LIVE_ORIGIN_REPOSITORY");\n  }\n  return fetchUrl;\n}\n\nfunction verifyRepositoryLivePreconditions',
    ],
    [
      "async function executeRuntime() {\n  verifyActualMarkerBytes();\n  assertExecutionAuthorization();\n  const plan = createRuntimePlan();\n  const repositoryRoot = process.cwd();\n  const budgets = new GlobalBudgets(plan);\n  budgets.take(\"targetConfirmations\");\n  validatePredecessorRatification(PREDECESSOR_RATIFICATION);\n  const pushUrl = verifyRepositoryLivePreconditions(repositoryRoot, plan);",
      'async function executeRuntime() {\n  verifyActualMarkerBytes();\n  assertExecutionAuthorization();\n  const plan = createRuntimePlan();\n  const repositoryRoot = process.cwd();\n  const budgets = new GlobalBudgets(plan);\n  budgets.take("targetConfirmations");\n  validatePredecessorRatification(PREDECESSOR_RATIFICATION);\n  const pushUrl = "https://github.com/jcdumaua/aifinder.git";',
    ],
  ].map(([expected, replacement]) =>
    replaceExactlyOnce(orchestratorSource, expected, replacement),
  );
  const parserMutations = [
    [
      'function isExactNewBranchPushOutput(output, commitSha, branchRef) {\n  if (\n    typeof output !== "string" ||',
      'function isExactNewBranchPushOutput(output, commitSha, branchRef) {\n  if (\n    false ||',
    ],
    [
      '    output.includes("\\r") ||\n    !output.endsWith("\\n")\n  ) {\n    return false;',
      '    output.includes("\\r") ||\n    false\n  ) {\n    return false;',
    ],
    ["lines.length !== 3", "false"],
    ['/^To [!-~]+$/u.test(destination)', "destination.startsWith(\"To \")"],
    [
      'statusLine === `*\\t${commitSha}:${branchRef}\\t[new branch]`',
      'statusLine.includes("[new branch]")',
    ],
    ['doneLine === "Done"', 'doneLine.startsWith("Done")'],
    [
      'function observeBranchPushResult(result, commitSha, branchRef) {\n  try {\n    if (result.spawn_error !== null) return "SPAWN_ERROR";\n    if (result.status !== 0) return "NONZERO_UNCERTAIN";\n    if (result.stderr.byteLength !== 0) return "ZERO_UNCERTAIN";',
      'function observeBranchPushResult(result, commitSha, branchRef) {\n  try {\n    if (result.spawn_error !== null) return "SPAWN_ERROR";\n    if (result.status !== 0) return "NONZERO_UNCERTAIN";\n    if (false) return "ZERO_UNCERTAIN";',
    ],
    [
      "reconcileTemporaryBranchCreate(context, push, commitSha, branchRef)",
      "reconcileTemporaryBranchCreate(context, push, branchRef)",
    ],
  ].map(([expected, replacement]) =>
    replaceExactlyOnce(orchestratorSource, expected, replacement),
  );
  const allMutations = [
    ...mutations,
    ...optionMutations,
    ...originMutations,
    ...parserMutations,
  ];
  return [
    branchCasContract(orchestratorSource) &&
      allMutations.every(
        (mutation) => mutation !== null && !branchCasContract(mutation),
      ),
  ];
}

function vercelPaginationContract(coreSource, orchestratorSource) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const authorityText = namedFunctionText(
    facts.root,
    "beginDeploymentInventoryTraversal",
  ) ?? "";
  const traversalText = namedFunctionText(
    facts.root,
    "collectDeploymentInventory",
  ) ?? "";
  const accessControlReserveText = namedFunctionText(
    facts.root,
    "remainingVercelAccessControlInvocations",
  ) ?? "";
  const aggregationText = namedFunctionText(
    facts.root,
    "aggregateDeploymentInventoryPages",
  ) ?? "";
  const pathText = namedFunctionText(
    facts.root,
    "deploymentInventoryPath",
  ) ?? "";
  const registrationTraversalText = namedFunctionText(
    facts.root,
    "collectDelta14RegistrationDeploymentInventory",
  ) ?? "";
  const registrationProofText = namedFunctionText(
    facts.root,
    "proveDelta14RegistrationZeroDeployment",
  ) ?? "";
  const deletePreviewText =
    namedFunctionText(facts.root, "deletePreview") ?? "";
  const identitySwitchSelfTestText =
    namedFunctionText(
      facts.root,
      "runPreviewCleanupIdentitySwitchSelfTest",
    ) ?? "";
  const resetPreviewCleanupStateText =
    namedFunctionText(facts.root, "resetPreviewCleanupState") ?? "";
  const cleanupResolutionText =
    namedFunctionText(facts.root, "validateCleanupResolution") ?? "";
  return (
    coreSource.includes("vercel_control_maximum: 353") &&
    orchestratorSource.includes("vercelInventoryTraversals: 30") &&
    orchestratorSource.includes("vercelInventoryPageRequests: 118") &&
    orchestratorSource.includes("vercelInventoryPagesPerTraversal: 3") &&
    orchestratorSource.includes(
      "delta14RegistrationInventoryPagesPerTraversal: 10",
    ) &&
    orchestratorSource.includes(
      "const DELTA14_REGISTRATION_INVENTORY_TRAVERSALS_MAXIMUM = 4",
    ) &&
    orchestratorSource.includes(
      "const DELTA14_REGISTRATION_INVENTORY_PAGES_MAXIMUM = 10",
    ) &&
    orchestratorSource.includes("vercelRestV13IdentityQueries: 7") &&
    orchestratorSource.includes("vercelCleanupIdentityQueries: 81") &&
    orchestratorSource.includes("vercelDirectDeleteAttempts: 40") &&
    orchestratorSource.includes("previewAbsenceChecks: 4") &&
    orchestratorSource.includes(
      "const PREVIEW_DELETE_ATTEMPTS_PER_IDENTITY_MAXIMUM = 20",
    ) &&
    deletePreviewText.includes(
      "attempt <= PREVIEW_DELETE_ATTEMPTS_PER_IDENTITY_MAXIMUM",
    ) &&
    deletePreviewText.includes(
      "attempt === PREVIEW_DELETE_ATTEMPTS_PER_IDENTITY_MAXIMUM",
    ) &&
    identitySwitchSelfTestText.includes("new GlobalBudgets(plan)") &&
    identitySwitchSelfTestText.includes(
      'budgets.remaining("vercelDirectDeleteAttempts") === 20',
    ) &&
    identitySwitchSelfTestText.includes(
      'budgets.remaining("vercelCleanupIdentityQueries") === 40',
    ) &&
    identitySwitchSelfTestText.includes(
      'budgets.remaining("previewAbsenceChecks") === 2',
    ) &&
    identitySwitchSelfTestText.includes(
      'budgets.remaining("previewAbsenceChecks") !== 0',
    ) &&
    identitySwitchSelfTestText.includes(
      "testContext.previewDeleteAttempts !== 0",
    ) &&
    resetPreviewCleanupStateText.includes(
      "const retainedDeleteAttempts = context.preservePreviewDeleteAttempts",
    ) &&
    resetPreviewCleanupStateText.includes(
      "previewDeleteAttempts: retainedDeleteAttempts",
    ) &&
    coreSource.includes(
      "const v13DeploymentIdentifiers = [deployment.id, deployment.uid].filter(",
    ) &&
    coreSource.includes(
      "!v13DeploymentIdentifiers.every(\n      (identifier) => identifier === deploymentId,",
    ) &&
    cleanupResolutionText.includes(
      "const cleanupV13DeploymentIdentifiers = [",
    ) &&
    cleanupResolutionText.includes(
      "!cleanupV13DeploymentIdentifiers.every(\n      (identifier) => identifier === deploymentId,",
    ) &&
    orchestratorSource.includes('uid: "dpl_ContradictoryV13Uid"') &&
    identitySwitchSelfTestText.includes(
      'fail("SELF_TEST_TWO_IDENTITY_CLEANUP_AUTHORITY")',
    ) &&
    orchestratorSource.includes(
      "discoveryUnresolved: Object.freeze({\n    reserveTraversals: 5,\n    reservePages: 15,\n  }),",
    ) &&
    [
      ["initialPreviewDiscovery", 17, 51],
      ["qualificationRetrySecond", 16, 48],
      ["qualificationRetryThird", 15, 45],
      ["qualificationRetryFourth", 4, 12],
      ["repairSourceAfterFirstIdentity", 16, 48],
      ["repairSourceAfterSecondIdentity", 15, 45],
      ["repairSourceAfterThirdIdentity", 14, 42],
      ["replacementAfterFirstDiscovery", 8, 24],
      ["replacementAfterSecondDiscovery", 7, 21],
      ["replacementAfterThirdDiscovery", 6, 18],
      ["supersededAfterFirstAbsenceFirst", 7, 21],
      ["supersededAfterFirstAbsenceSecond", 6, 18],
      ["supersededAfterSecondAbsenceFirst", 6, 18],
      ["supersededAfterSecondAbsenceSecond", 5, 15],
      ["supersededAfterThirdAbsenceFirst", 5, 15],
      ["supersededAfterThirdAbsenceSecond", 4, 12],
      ["delta17aReplacementQualification", 4, 12],
      ["targetIdentity", 3, 9],
      ["runtimeIdentity", 2, 6],
      ["cleanupInitial", 4, 12],
      ["cleanupDelayedFirst", 3, 9],
      ["cleanupDelayedSecond", 2, 6],
      ["previewAbsenceFirst", 1, 3],
      ["previewAbsenceSecond", 0, 0],
    ].every(([name, traversals, pages]) =>
      orchestratorSource.includes(
        `${name}: Object.freeze({\n    reserveTraversals: ${traversals},\n    reservePages: ${pages},\n  }),`,
      ),
    ) &&
    authorityText.includes(
      'budgets.remaining("vercelInventoryTraversals")',
    ) &&
    authorityText.includes("1 + authority.reserveTraversals") &&
    authorityText.includes(
      'budgets.remaining("vercelInventoryPageRequests")',
    ) &&
    authorityText.includes("maximumPages + authority.reservePages") &&
    authorityText.includes(
      'budgets.remaining("vercelControlInvocations")',
    ) &&
    authorityText.includes("VERCEL_NONINVENTORY_CONTROL_BUDGETS.reduce(") &&
    authorityText.includes(
      "(total, name) => total + budgets.remaining(name)",
    ) &&
    authorityText.includes(
      "remainingVercelAccessControlInvocations(budgets)",
    ) &&
    accessControlReserveText.includes(
      'budgets.remaining("projectOidcTokenGenerations")',
    ) &&
    accessControlReserveText.includes(
      '(1 + PROTECTED_ACCESS_REVOKE_ATTEMPTS_MAXIMUM) *\n      budgets.remaining("temporaryBypassCycles")',
    ) &&
    authorityText.includes('budgets.take("vercelInventoryTraversals")') &&
    traversalText.includes('budgets.take("vercelInventoryPageRequests")') &&
    registrationTraversalText.includes(
      "priorTraversals >=\n      DELTA14_REGISTRATION_INVENTORY_TRAVERSALS_MAXIMUM",
    ) &&
    registrationTraversalText.includes(
      "(DELTA14_REGISTRATION_INVENTORY_TRAVERSALS_MAXIMUM -\n          priorTraversals -\n          1) +\n        25",
    ) &&
    registrationTraversalText.includes(
      "(DELTA14_REGISTRATION_INVENTORY_TRAVERSALS_MAXIMUM -\n          priorTraversals -\n          1) * maximumPages +\n        75",
    ) &&
    registrationTraversalText.includes(
      'budgets.take("vercelInventoryTraversals")',
    ) &&
    registrationTraversalText.includes(
      'budgets.take("vercelInventoryPageRequests")',
    ) &&
    registrationTraversalText.includes(
      "context.registrationInventoryTraversals = priorTraversals + 1",
    ) &&
    registrationProofText.includes(
      "traversals > DELTA14_REGISTRATION_OBSERVATION_TRAVERSALS",
    ) &&
    registrationProofText.includes(
      "collectDelta14RegistrationDeploymentInventory(",
    ) &&
    registrationProofText.includes(
      "await delay(DELTA14_REGISTRATION_OBSERVATION_DELAY_MS)",
    ) &&
    orchestratorSource.includes('"discoveryUnresolved",') &&
    orchestratorSource.includes('"cleanupInitial",') &&
    orchestratorSource.includes('? "cleanupDelayedFirst"') &&
    orchestratorSource.includes(': "cleanupDelayedSecond",') &&
    orchestratorSource.includes('"previewAbsenceFirst",') &&
    orchestratorSource.includes('"previewAbsenceSecond",') &&
    orchestratorSource.includes("const delayedObservations = 2") &&
    pathText.includes(
      "projectId=${PROJECT_ID}&teamId=${TEAM_ID}&limit=100&since=${since}",
    ) &&
    pathText.includes("&until=${until}") &&
    aggregationText.includes("page.pagination.next === null") &&
    aggregationText.includes("next >= priorCursor") &&
    aggregationText.includes("VERCEL_INVENTORY_CURSOR_REPEATED") &&
    aggregationText.includes("VERCEL_INVENTORY_CURSOR_NOT_DECREASING") &&
    aggregationText.includes("VERCEL_INVENTORY_DUPLICATE_CONFLICT") &&
    (pathText.match(/\/v6\/deployments\?/gu) ?? []).length === 1 &&
    namedFunctionNode(facts.root, "verifyPreviewAbsent") !== null &&
    functionCallTexts(facts.root, "verifyPreviewAbsent").filter(
      (call) => call.startsWith("collectDeploymentInventory("),
    ).length === 2 &&
    functionCallTexts(facts.root, "resolveUniquePreview").filter(
      (call) => call.startsWith("collectDeploymentInventory("),
    ).length === 1 &&
    functionCallTexts(facts.root, "cleanupInventoryCandidate").filter(
      (call) => call.startsWith("collectDeploymentInventory("),
    ).length === 1
  );
}

function vercelPaginationAssertions(coreSource, orchestratorSource) {
  const mutations = [
    [coreSource.replace("!v13DeploymentIdentifiers.every(\n      (identifier) => identifier === deploymentId,\n    )", "false"), orchestratorSource],
    [coreSource, orchestratorSource.replace("!cleanupV13DeploymentIdentifiers.every(\n      (identifier) => identifier === deploymentId,\n    )", "false")],
    [coreSource.replace("vercel_control_maximum: 353", "vercel_control_maximum: 352"), orchestratorSource],
    [coreSource, orchestratorSource.replace("vercelInventoryTraversals: 30", "vercelInventoryTraversals: 29")],
    [coreSource, orchestratorSource.replace("vercelInventoryPageRequests: 118", "vercelInventoryPageRequests: 117")],
    [coreSource, orchestratorSource.replace("vercelInventoryPagesPerTraversal: 3", "vercelInventoryPagesPerTraversal: 4")],
    [coreSource, orchestratorSource.replace("delta14RegistrationInventoryPagesPerTraversal: 10", "delta14RegistrationInventoryPagesPerTraversal: 9")],
    [coreSource, orchestratorSource.replace("const DELTA14_REGISTRATION_INVENTORY_TRAVERSALS_MAXIMUM = 4", "const DELTA14_REGISTRATION_INVENTORY_TRAVERSALS_MAXIMUM = 5")],
    [coreSource, orchestratorSource.replace("const DELTA14_REGISTRATION_INVENTORY_PAGES_MAXIMUM = 10", "const DELTA14_REGISTRATION_INVENTORY_PAGES_MAXIMUM = 9")],
    [coreSource, orchestratorSource.replace("vercelRestV13IdentityQueries: 7", "vercelRestV13IdentityQueries: 6")],
    [coreSource, orchestratorSource.replace("vercelCleanupIdentityQueries: 81", "vercelCleanupIdentityQueries: 80")],
    [coreSource, orchestratorSource.replace("vercelDirectDeleteAttempts: 40", "vercelDirectDeleteAttempts: 39")],
    [coreSource, orchestratorSource.replace("previewAbsenceChecks: 4", "previewAbsenceChecks: 2")],
    [coreSource, orchestratorSource.replace("const PREVIEW_DELETE_ATTEMPTS_PER_IDENTITY_MAXIMUM = 20", "const PREVIEW_DELETE_ATTEMPTS_PER_IDENTITY_MAXIMUM = 19")],
    [coreSource, orchestratorSource.replace("const retainedDeleteAttempts = context.preservePreviewDeleteAttempts", "const retainedDeleteAttempts = false")],
    [coreSource, orchestratorSource.replace("&since=${since}", "")],
    [coreSource, orchestratorSource.replace("&until=${until}", "&until=0")],
    [coreSource, orchestratorSource.replace("page.pagination.next === null", "page.pagination.next == null")],
    [coreSource, orchestratorSource.replace("next >= priorCursor", "next > priorCursor")],
    [coreSource, orchestratorSource.replace('budgets.take("vercelInventoryPageRequests");', "")],
    [coreSource, orchestratorSource.replace(
      "initialPreviewDiscovery: Object.freeze({\n    reserveTraversals: 17,\n    reservePages: 51,",
      "initialPreviewDiscovery: Object.freeze({\n    reserveTraversals: 16,\n    reservePages: 51,",
    )],
    [coreSource, orchestratorSource.replace(
      "repairSourceAfterFirstIdentity: Object.freeze({\n    reserveTraversals: 16,\n    reservePages: 48,",
      "repairSourceAfterFirstIdentity: Object.freeze({\n    reserveTraversals: 15,\n    reservePages: 48,",
    )],
    [coreSource, orchestratorSource.replace(
      "replacementAfterFirstDiscovery: Object.freeze({\n    reserveTraversals: 8,\n    reservePages: 24,",
      "replacementAfterFirstDiscovery: Object.freeze({\n    reserveTraversals: 7,\n    reservePages: 24,",
    )],
    [coreSource, orchestratorSource.replace(
      "supersededAfterFirstAbsenceFirst: Object.freeze({\n    reserveTraversals: 7,\n    reservePages: 21,",
      "supersededAfterFirstAbsenceFirst: Object.freeze({\n    reserveTraversals: 6,\n    reservePages: 21,",
    )],
    [coreSource, orchestratorSource.replace(
      "delta17aReplacementQualification: Object.freeze({\n    reserveTraversals: 4,\n    reservePages: 12,",
      "delta17aReplacementQualification: Object.freeze({\n    reserveTraversals: 3,\n    reservePages: 9,",
    )],
    [coreSource, orchestratorSource.replace("maximumPages + authority.reservePages", "maximumPages")],
    [coreSource, orchestratorSource.replace("VERCEL_NONINVENTORY_CONTROL_BUDGETS.reduce(", "[].reduce(")],
    [coreSource, orchestratorSource.replace("      remainingVercelAccessControlInvocations(budgets)\n", "      0\n")],
    [coreSource, orchestratorSource.replace('(1 + PROTECTED_ACCESS_REVOKE_ATTEMPTS_MAXIMUM) *\n      budgets.remaining("temporaryBypassCycles")', '2 * budgets.remaining("temporaryBypassCycles")')],
    [coreSource, orchestratorSource.replace("const delayedObservations = 2", "const delayedObservations = 1")],
    [coreSource, orchestratorSource.replace(
      "          priorTraversals -\n          1) +\n        25",
      "          priorTraversals -\n          1) +\n        24",
    )],
    [coreSource, orchestratorSource.replace("        75\n", "        74\n")],
    [coreSource, orchestratorSource.replace("await delay(DELTA14_REGISTRATION_OBSERVATION_DELAY_MS)", "await delay(0)")],
  ];
  return [
    vercelPaginationContract(coreSource, orchestratorSource) &&
      mutations.every(
        ([candidateCore, candidateOrchestrator]) =>
          !vercelPaginationContract(candidateCore, candidateOrchestrator),
      ),
  ];
}

function ambiguousLogoCleanupContract(
  coreSource,
  orchestratorSource,
  storageCasForwardSource,
) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const runtimeText = namedFunctionText(facts.root, "runRuntimeSession") ?? "";
  const applicationText =
    namedFunctionText(facts.root, "runApplicationRequest") ?? "";
  const multipartText =
    namedFunctionText(facts.root, "multipartLogoBody") ?? "";
  const reconciliationText =
    namedFunctionText(facts.root, "reconcileLogoUpload") ?? "";
  const inventoryText =
    namedFunctionText(facts.root, "listCompleteLogoInventory") ?? "";
  const exactStorageInfoText =
    namedFunctionText(facts.root, "readExactStorageObjectInfo") ?? "";
  const versionText =
    namedFunctionText(facts.root, "logoContentVersionFingerprint") ?? "";
  const auditText =
    namedFunctionText(facts.root, "validatedLogoAuditPath") ?? "";
  const downloadText =
    namedFunctionText(facts.root, "logoObjectSha256") ?? "";
  const boundedDownloadText =
    namedFunctionText(facts.root, "boundedStorageDownloadBytes") ?? "";
  const priorStorageReadText =
    namedFunctionText(facts.root, "delta17AClassifyPriorStorage") ?? "";
  const absenceText =
    namedFunctionText(facts.root, "verifyLogoPayloadAbsent") ?? "";
  const absenceInventoryText =
    namedFunctionText(
      facts.root,
      "validateLogoPayloadAbsentInventory",
    ) ?? "";
  const admissionText =
    namedFunctionText(facts.root, "admitLogoLiveMutation") ?? "";
  const futureReserveText =
    namedFunctionText(facts.root, "logoFuturePhysicalRequestReserve") ?? "";
  const postAuditReserveText =
    namedFunctionText(
      facts.root,
      "logoFuturePhysicalRequestReserveAfterAuditObservation",
    ) ?? "";
  const auditObservationAdmissionText =
    namedFunctionText(facts.root, "admitLogoAuditObservation") ?? "";
  const mutationWindowText =
    namedFunctionText(facts.root, "awaitLogoUploadMutationWindowClosed") ?? "";
  const resetIdentityText =
    namedFunctionText(facts.root, "resetUnverifiedLogoCleanupIdentity") ?? "";
  const verifiedIdentityText =
    namedFunctionText(facts.root, "hasVerifiedLogoCleanupIdentity") ?? "";
  const inspectFixtureText =
    namedFunctionText(facts.root, "inspectFixtureState") ?? "";
  const cleanupFixturesText =
    namedFunctionText(facts.root, "cleanupFixtures") ?? "";
  const exactCleanupRowsText =
    namedFunctionText(facts.root, "cleanupDelta20ExactRows") ?? "";
  const exactReadText =
    namedFunctionText(facts.root, "delta20ReadExactCleanupRows") ?? "";
  const exactDeleteText =
    namedFunctionText(
      facts.root,
      "delta20AttemptExactCleanupRowDelete",
    ) ?? "";
  const exactCasLiteralText =
    namedFunctionText(facts.root, "delta17APostgrestCasLiteral") ?? "";
  const exactStorageObservationText =
    namedFunctionText(
      facts.root,
      "delta20ObserveExactCleanupStorage",
    ) ?? "";
  const exactStorageCleanupText =
    namedFunctionText(facts.root, "cleanupDelta20ExactStorage") ?? "";
  const exactFixtureCleanupText =
    namedFunctionText(facts.root, "cleanupDelta20ExactFixtures") ?? "";
  const exactCleanupSelfTestText =
    namedFunctionText(facts.root, "runDelta20ExactCleanupCasSelfTest") ?? "";
  const runtimeRecoveryCleanupText =
    namedFunctionText(
      facts.root,
      "cleanupDelta20RuntimeRecoveryExternalEffects",
    ) ?? "";
  const runtimePublicationPersistenceText =
    namedFunctionText(
      facts.root,
      "persistDelta20RuntimePublicationRecovery",
    ) ?? "";
  const runtimePublicationRepairText =
    namedFunctionText(
      facts.root,
      "repairDelta20RuntimePublicationFromRetainedJournal",
    ) ?? "";
  const officialRuntimeText =
    namedFunctionText(
      facts.root,
      "executeDelta18DurableProjectionFinalRuntime",
    ) ?? "";
  const recordStorageFailureText =
    namedFunctionText(facts.root, "recordStorageAbsenceFailure") ?? "";
  const emergencyDeleteText =
    namedFunctionText(facts.root, "performEmergencyCleanupDelete") ?? "";
  const emergencyStorageAbsenceText =
    namedFunctionText(facts.root, "verifyEmergencyStorageAbsence") ?? "";
  const payloadIdentityText =
    namedFunctionText(facts.root, "logoPayloadIdentityIsNonmatch") ?? "";
  const behaviorSelfTestText =
    namedFunctionText(facts.root, "runLogoRecoveryBehaviorSelfTest") ?? "";
  const emergencyText =
    namedFunctionText(facts.root, "emergencyDataCleanup") ?? "";
  const evidenceText = namedFunctionText(facts.root, "runtimeEvidence") ?? "";
  const directBoundaryText =
    namedFunctionText(facts.root, "createCountedSupabase") ?? "";
  return (
    coreSource.includes("direct_data_success_requests: 14") &&
    coreSource.includes("direct_data_maximum: 26") &&
    coreSource.includes("cleanup_storage_list_reserve: 4") &&
    coreSource.includes("cleanup_storage_download_reserve: 3") &&
    orchestratorSource.includes("const DIRECT_DATA_MAXIMUM = 26") &&
    orchestratorSource.includes("cleanupStorageListReserve: 4") &&
    orchestratorSource.includes("direct_data_success_requests: 14") &&
    orchestratorSource.includes(
      "const LOGO_LIVE_RECONCILIATION_MAXIMUM_PAGES = 2",
    ) &&
    orchestratorSource.includes(
      "const LOGO_LIVE_PREINVENTORY_MAXIMUM_NAMES =\n  LOGO_INVENTORY_PAGE_SIZE * LOGO_LIVE_RECONCILIATION_MAXIMUM_PAGES -\n  1 -\n  LOGO_RECONCILIATION_MAXIMUM_CANDIDATES",
    ) &&
    orchestratorSource.includes("plan.budgets.cleanup_storage_list_reserve") &&
    orchestratorSource.includes("plan.budgets.cleanup_storage_download_reserve") &&
    namedFunctionNode(facts.root, "createSyntheticLogoPayload") !== null &&
    namedFunctionNode(facts.root, "validateSyntheticLogoPng") !== null &&
    namedFunctionNode(facts.root, "listCompleteLogoInventory") !== null &&
    namedFunctionNode(facts.root, "queryLogoUploadAudit") !== null &&
    namedFunctionNode(facts.root, "reconcileLogoUpload") !== null &&
    namedFunctionNode(facts.root, "verifyLogoPayloadAbsent") !== null &&
    namedFunctionNode(facts.root, "logoContentVersionFingerprint") !== null &&
    namedFunctionNode(facts.root, "logoPayloadIdentityIsNonmatch") !== null &&
    namedFunctionNode(facts.root, "admitLogoLiveMutation") !== null &&
    namedFunctionNode(facts.root, "logoFuturePhysicalRequestReserve") !== null &&
    namedFunctionNode(
      facts.root,
      "logoFuturePhysicalRequestReserveAfterAuditObservation",
    ) !== null &&
    namedFunctionNode(facts.root, "cacheLogoAuditObservation") !== null &&
    namedFunctionNode(facts.root, "consumeLogoAuditObservation") !== null &&
    namedFunctionNode(facts.root, "admitLogoAuditObservation") !== null &&
    namedFunctionNode(facts.root, "awaitLogoUploadMutationWindowClosed") !== null &&
    namedFunctionNode(facts.root, "verifyEmergencyStorageAbsence") !== null &&
    namedFunctionNode(facts.root, "runLogoRecoveryBehaviorSelfTest") !== null &&
    namedFunctionNode(facts.root, "multipartLogoBody") !== null &&
    multipartText.includes('filename="synthetic-1x1.png"') &&
    multipartText.includes("Content-Type: image/png") &&
    multipartText.includes("Buffer.concat([prefix, uploadInput, suffix])") &&
    runtimeText.includes(
      "uploadInput: spec.ordinal === 15 ? logoPayload.bytes : uploadInput",
    ) &&
    runtimeText.includes("runtimeState.logoResponsePath = logoObjectPath") &&
    runtimeText.includes('runtimeState.logoReconciliationState = "RESPONSE_HINT_ONLY"') &&
    !runtimeText.includes("runtimeState.logoObjectPath = logoObjectPath") &&
    runtimeText.includes("admitLogoLiveMutation({") &&
    runtimeText.includes("budgets: dataBudgets,") &&
    runtimeText.indexOf(
      "admitLogoLiveMutation({",
    ) < runtimeText.indexOf("runtimeState.uploadAttempted = true") &&
    applicationText.includes(
      "multipart = multipartLogoBody(uploadInput, spec.ordinal)",
    ) &&
    applicationText.includes("requestBodyBytes = multipart.body_bytes") &&
    runtimeText.includes("logoPayload.bytes.fill(0)") &&
    !runtimeText.includes('path.join(tempRoot, "synthetic-1x1.png")') &&
    !runtimeText.includes("writeExclusiveFile(pngPath") &&
    reconciliationText.includes(
      "const observedRows = consumeLogoAuditObservation(runtime)",
    ) &&
    reconciliationText.indexOf("queryLogoUploadAudit(") >= 0 &&
    reconciliationText.indexOf("listCompleteLogoInventory(") >
      reconciliationText.indexOf("queryLogoUploadAudit(") &&
    reconciliationText.includes("UPLOAD_NOT_PERSISTED") &&
    reconciliationText.includes("LOGO_RECONCILIATION_DELTA_LIMIT") &&
    reconciliationText.includes("LOGO_RECONCILIATION_MULTIPLE_MATCHES") &&
    reconciliationText.includes(
      "delta.size > LOGO_RECONCILIATION_MAXIMUM_CANDIDATES",
    ) &&
    reconciliationText.indexOf(
      "delta.size > LOGO_RECONCILIATION_MAXIMUM_CANDIDATES",
    ) < reconciliationText.indexOf("const canonicalDelta") &&
    reconciliationText.includes("validatedLogoAuditPath(rows, runtime, true)") &&
    reconciliationText.indexOf("resetUnverifiedLogoCleanupIdentity(runtime)") >= 0 &&
    reconciliationText.indexOf("resetUnverifiedLogoCleanupIdentity(runtime)") <
      reconciliationText.indexOf("queryLogoUploadAudit(") &&
    reconciliationText.includes("runtime.logoNonmatchingVersions") &&
    reconciliationText.includes("runtime.logoNonmatchingPayloadIdentities") &&
    reconciliationText.includes(
      "maximumPages: LOGO_LIVE_RECONCILIATION_MAXIMUM_PAGES",
    ) &&
    inventoryText.includes("if (reserveName) budgets.take(reserveName);") &&
    inventoryText.indexOf("if (reserveName) budgets.take(reserveName);") <
      inventoryText.indexOf("for (let page = 0;") &&
    inventoryText.includes("recordDirectSuccess = true") &&
    inventoryText.includes("typeof recordDirectSuccess !== \"boolean\"") &&
    inventoryText.includes("if (recordDirectSuccess) direct.success();") &&
    inventoryText.includes("limit: LOGO_INVENTORY_PAGE_SIZE") &&
    inventoryText.includes("offset: page * LOGO_INVENTORY_PAGE_SIZE") &&
    inventoryText.includes(
      "return { names, versions, pageRequests }",
    ) &&
    !inventoryText.includes("row.version") &&
    exactStorageInfoText.includes(
      "direct.storageCleanup.readExactObjectInfo({",
    ) &&
    exactStorageInfoText.includes(
      "info.bucketId !== LOGO_STORAGE_BUCKET",
    ) &&
    exactStorageInfoText.includes("info.name !== storagePath") &&
    exactStorageInfoText.includes("expectedVersion: info.version") &&
    inventoryText.includes("logoContentVersionFingerprint(row, code)") &&
    admissionText.includes(
      "inventory.pageRequests > LOGO_LIVE_RECONCILIATION_MAXIMUM_PAGES",
    ) &&
    admissionText.includes(
      "inventory.names.size > LOGO_LIVE_PREINVENTORY_MAXIMUM_NAMES",
    ) &&
    admissionText.includes(
      "inventory.names.size + LOGO_RECONCILIATION_MAXIMUM_CANDIDATES",
    ) &&
    admissionText.includes(
      'budgets.remaining("directDataMaximum") < requiredAfterUpload',
    ) &&
    futureReserveText.includes(
      "const ambiguousIdentityInventoryPageRequests =\n    LOGO_LIVE_RECONCILIATION_MAXIMUM_PAGES * 4",
    ) &&
    futureReserveText.includes(
      "const falseSuccessInventoryPageRequests =\n    LOGO_LIVE_RECONCILIATION_MAXIMUM_PAGES * 3",
    ) &&
    futureReserveText.includes(
      "downloadRequests = LOGO_RECONCILIATION_MAXIMUM_CANDIDATES",
    ) &&
    futureReserveText.includes(
      "poststateObservationDatabaseRequests = 2",
    ) &&
    futureReserveText.includes(
      "Math.max(ambiguousIdentityTotal, falseSuccessTotal)",
    ) &&
    futureReserveText.includes("ambiguousIdentityTotal !== 23") &&
    futureReserveText.includes("falseSuccessTotal !== 18") &&
    futureReserveText.includes("total !== 23") &&
    postAuditReserveText.includes(
      "logoFuturePhysicalRequestReserve(plan) - 1",
    ) &&
    postAuditReserveText.includes("total !== 22") &&
    auditObservationAdmissionText.includes(
      'budgets.remaining("directDataMaximum") < required',
    ) &&
    mutationWindowText.includes("Date.parse(runtime?.uploadWindowEnd") &&
    mutationWindowText.includes(
      "closesAt - startedAt > LOGO_UPLOAD_WINDOW_SKEW_MS",
    ) &&
    mutationWindowText.includes("await wait(remaining)") &&
    mutationWindowText.includes("current >= closesAt") &&
    versionText.includes("id: row.id") &&
    versionText.includes("version: row.version") &&
    versionText.includes("updated_at: row.updated_at") &&
    versionText.includes("eTag: metadata.eTag") &&
    versionText.includes("size: metadata.size") &&
    versionText.includes("lastModified: metadata.lastModified") &&
    versionText.includes("contentLength: metadata.contentLength") &&
    auditText.includes("validPaths.length !== 1") &&
    auditText.includes("const authoritativePaths = rows.flatMap") &&
    auditText.includes("rows.length !== 1") &&
    auditText.includes(
      "runtime.logoResponsePath !== authoritativePaths[0]",
    ) &&
    auditText.includes("if (allowNoValid) {") &&
    auditText.includes("return null;") &&
    auditText.indexOf("if (allowNoValid)") <
      auditText.indexOf('"LOGO_AUDIT_AMBIGUOUS"') &&
    auditText.includes("authoritativePaths.length > 1") &&
    auditText.includes('"LOGO_AUDIT_IDENTITY"') &&
    auditText.includes("row?.target_name === objectPath") &&
    auditText.includes("runtime.logoResponsePath === objectPath") &&
    !auditText.includes("row?.target_name === LOGO_FILENAME") &&
    downloadText.includes("bytes.fill(0)") &&
    downloadText.includes("boundedStorageDownloadBytes(") &&
    priorStorageReadText.includes("boundedStorageDownloadBytes(") &&
    boundedDownloadText.includes("typeof downloadOperation.asStream") &&
    boundedDownloadText.includes("body.size > LOGO_MAXIMUM_DOWNLOAD_BYTES") &&
    boundedDownloadText.indexOf(
      "body.size > LOGO_MAXIMUM_DOWNLOAD_BYTES",
    ) < boundedDownloadText.indexOf("await body.arrayBuffer()") &&
    boundedDownloadText.includes("await reader.cancel()") &&
    boundedDownloadText.includes("part.fill(0)") &&
    boundedDownloadText.includes("view.fill(0)") &&
    resetIdentityText.includes("runtime.logoObjectPath = null") &&
    resetIdentityText.includes('runtime.logoReconciliationState = "IDENTITY_UNVERIFIED"') &&
    verifiedIdentityText.includes('new Set(["AUDIT_IDENTIFIED", "PAYLOAD_IDENTIFIED"])') &&
    inspectFixtureText.includes("runtime.logoObjectPath = logoAuditPath") &&
    inspectFixtureText.includes('runtime.logoReconciliationState = "AUDIT_IDENTIFIED"') &&
    inspectFixtureText.includes(
      "auditResult?.error ? [] : auditResult?.data ?? []",
    ) &&
    inspectFixtureText.includes(
      "cacheLogoAuditObservation(\n    runtime,\n    auditResult?.error ? [] : auditResult?.data ?? [],",
    ) &&
    inspectFixtureText.includes(
      "admitLogoAuditObservation({ runtime, plan, budgets })",
    ) &&
    inspectFixtureText.indexOf(
      "cacheLogoAuditObservation(\n    runtime,\n    auditResult?.error ? [] : auditResult?.data ?? [],",
    ) < inspectFixtureText.lastIndexOf(
      "admitLogoAuditObservation({ runtime, plan, budgets })",
    ) &&
    inspectFixtureText.indexOf('.from("admin_audit_logs")') >= 0 &&
    inspectFixtureText.indexOf('.from("admin_audit_logs")') <
      inspectFixtureText.indexOf('.from("tools")') &&
    inspectFixtureText.indexOf('.from("admin_audit_logs")') <
      inspectFixtureText.indexOf('.from("submitted_tools")') &&
    absenceText.includes("validateLogoPayloadAbsentInventory({") &&
    absenceInventoryText.includes("protectedPreinventoryPreserved") &&
    absenceInventoryText.includes("preLogoInventory.size === preLogoVersions.size") &&
    absenceInventoryText.includes("finalInventory.names.has(name)") &&
    absenceInventoryText.includes(
      "finalInventory.versions.get(name) === preLogoVersions.get(name)",
    ) &&
    absenceInventoryText.includes("preservedDeltaVersionsMatch") &&
    absenceInventoryText.includes("nonmatching.size === nonmatchingVersions.size") &&
    absenceInventoryText.includes(
      "finalInventory.versions.get(name) === nonmatchingVersions.get(name)",
    ) &&
    reconciliationText.includes(
      "[...nonmatching].map((name) => [name, postInventory.versions.get(name)])",
    ) &&
    reconciliationText.includes(
      "objectPath,\n      emergencyCleanupBudgets(context),",
    ) &&
    payloadIdentityText.includes("Number.isInteger(identity?.bytes)") &&
    payloadIdentityText.includes("/^[a-f0-9]{64}$/u.test") &&
    payloadIdentityText.includes("identity.bytes !== runtime.logoPayloadBytes") &&
    payloadIdentityText.includes("identity.sha256 !== runtime.logoPayloadSha256") &&
    emergencyText.includes(
      "maximumPages: LOGO_LIVE_RECONCILIATION_MAXIMUM_PAGES",
    ) &&
    emergencyText.includes("recordDirectSuccess: false") &&
    cleanupFixturesText.includes(
      "maximumPages: LOGO_LIVE_RECONCILIATION_MAXIMUM_PAGES",
    ) &&
    !cleanupFixturesText.includes("recordDirectSuccess: false") &&
    cleanupFixturesText.includes("protectedLocator.exact_cleanup") &&
    cleanupFixturesText.includes("cleanupDelta20ExactFixtures({") &&
    cleanupFixturesText.includes("DELTA20_EXACT_CLEANUP_REQUIRED") &&
    exactReadText.includes(".select(contract.columns)") &&
    exactReadText.includes("delta17ARevalidateExactRows(records, rows, table)") &&
    exactDeleteText.includes("delta17ACasRowProjection(record.row, table)") &&
    exactDeleteText.includes(".or(filter)") &&
    exactDeleteText.includes(".select(contract.columns)") &&
    exactDeleteText.includes("response_succeeded: false") &&
    exactCasLiteralText.includes("Array.isArray(value)") &&
    exactCasLiteralText.includes("DELTA17A_PRIOR_CAS_ARRAY_LITERAL") &&
    exactCasLiteralText.includes("JSON.stringify(JSON.parse(canonicalJson(value)))") &&
    exactCleanupSelfTestText.includes(
      "SELF_TEST_DELTA20_EXACT_CLEANUP_CAS_LITERALS",
    ) &&
    exactCleanupRowsText.includes("_AMBIGUOUS_READBACK") &&
    exactCleanupRowsText.includes("_RETRY_READBACK") &&
    exactCleanupRowsText.includes('budgets.take("cleanupRetryReserve")') &&
    exactStorageObservationText.includes("listCompleteLogoInventory({") &&
    exactStorageObservationText.includes("readExactStorageObjectInfo({") &&
    exactStorageObservationText.includes("logoObjectSha256(") &&
    exactStorageObservationText.includes(
      "identity.bytes !== storageRecord.bytes",
    ) &&
    exactStorageObservationText.includes(
      "identity.sha256 !== storageRecord.sha256",
    ) &&
    exactStorageCleanupText.includes("createStorageCleanupCapabilityToken(randomBytes)") &&
    exactStorageCleanupText.includes("direct.storageCleanup.prepareGrant(") &&
    exactStorageCleanupText.includes(
      "reconcileStorageCleanupGrantPreparation({",
    ) &&
    exactStorageCleanupText.includes("direct.storageCleanup.deleteExactObject(") &&
    exactStorageCleanupText.includes("direct.storageCleanup.revokeGrant({") &&
    exactStorageCleanupText.includes("persistGrantRecord(storageRecord)") &&
    exactStorageCleanupText.includes('delete_response: "NOT_OBSERVED"') &&
    exactStorageCleanupText.includes("grantBinding.expected_version") &&
    exactStorageCleanupText.includes("token_hash: capability.token_hash") &&
    exactStorageCleanupText.includes("classifyStorageCleanupDeleteOutcome(") &&
    exactStorageCleanupText.includes("allowOwnershipConflict: true") &&
    exactStorageCleanupText.includes("ownership-conflict:${observedVersion") &&
    !exactStorageCleanupText.includes("direct.client.storage") &&
    !exactStorageCleanupText.includes("service_role") &&
    directBoundaryText.includes(
      'requestUrl.pathname.startsWith("/storage/v1/object/")',
    ) &&
    directBoundaryText.includes(
      'if (storageDeleteRequest) {\n        fail("STORAGE_CLEANUP_DELETE_CLIENT_ROLE");',
    ) &&
    directBoundaryText.includes(
      'requestUrl.pathname === "/storage/v1/object/tool-logos"',
    ) &&
    directBoundaryText.includes("const exactStorageInfo =") &&
    directBoundaryText.includes("exactStorageInfo;") &&
    directBoundaryText.includes(".info(storagePath)") &&
    orchestratorSource.includes(
      "const STORAGE_CLEANUP_REQUESTS_MAXIMUM = 12",
    ) &&
    inspectFixtureText.includes(
      'code: "DELTA20_POSTSTATE_STORAGE_INFO"',
    ) &&
    inspectFixtureText.includes("readExactStorageObjectInfo({") &&
    exactStorageCleanupText.includes('budgets.take("cleanupRetryReserve")') &&
    exactFixtureCleanupText.includes("cleanupDelta20ExactRows({") &&
    exactFixtureCleanupText.includes("cleanupDelta20ExactStorage({") &&
    exactFixtureCleanupText.includes("rememberCleanupFailure(failures, caught)") &&
    runtimeRecoveryCleanupText.includes("readDelta17CleanupLocators({") &&
    runtimeRecoveryCleanupText.includes(
      "DELTA20_RUNTIME_RECOVERY_EXACT_CLEANUP_BINDING",
    ) &&
    runtimeRecoveryCleanupText.includes("cleanupDelta20ExactFixtures({") &&
    !runtimeRecoveryCleanupText.includes(
      '.delete().in("normalized_domain"',
    ) &&
    runtimePublicationPersistenceText.includes(
      "pending_locator_sha256: pendingLocatorSha256",
    ) &&
    runtimePublicationPersistenceText.includes(
      "prior.external_cleanup_verified === false",
    ) &&
    runtimePublicationPersistenceText.includes(
      "prior.locator_sha256 !== locatorSha256",
    ) &&
    runtimePublicationPersistenceText.includes(
      "externalCleanupVerified || pendingLocatorSha256 !== locatorSha256",
    ) &&
    officialRuntimeText.includes(
      '"DELTA20_RUNTIME_FINAL_STORAGE_CAS_LOCATOR"',
    ) &&
    officialRuntimeText.includes(
      "pendingLocatorSha256: pendingRecovery.pending_locator_sha256",
    ) &&
    officialRuntimeText.includes(
      "runtimePendingPublication.locator_sha256 !==\n              recovery.pending_locator_sha256",
    ) &&
    runtimePublicationRepairText.includes(
      "const pendingPublicationReceiptPresent = existsSync(path.join(",
    ) &&
    runtimePublicationRepairText.includes(
      "const cleanupPublicationReceiptPresent = existsSync(path.join(",
    ) &&
    runtimePublicationRepairText.includes(
      "const finalLocatorSha256 = delta20Mode0600FileSha256(",
    ) &&
    runtimePublicationRepairText.includes(
      "pendingLocatorSha256: recovery.pending_locator_sha256",
    ) &&
    runtimePublicationRepairText.includes(
      "const pendingPublication = pendingPublicationReceiptPresent",
    ) &&
    runtimePublicationRepairText.includes(
      "const cleanupPublication = cleanupPublicationReceiptPresent",
    ) &&
    orchestratorSource.includes(
      '"pending_evidence",\n    "pending_evidence_sha256",\n    "pending_locator_sha256",',
    ) &&
    orchestratorSource.includes("pending_locator_sha256: digestA,") &&
    officialRuntimeText.includes("context.delta20ExactCleanupRequired = true") &&
    officialRuntimeText.includes("Delta17APriorReconciliationBudgets") &&
    exactCleanupSelfTestText.includes(
      "SELF_TEST_DELTA20_EXACT_CLEANUP_REPLACEMENT_PRESERVED",
    ) &&
    exactCleanupSelfTestText.includes(
      "SELF_TEST_STORAGE_CAS_REPLACEMENT_VERSION_PRESERVED",
    ) &&
    exactCleanupSelfTestText.includes(
      "SELF_TEST_STORAGE_CAS_LOST_DELETE_REPLACEMENT_PRESERVED",
    ) &&
    exactCleanupSelfTestText.includes(
      "SELF_TEST_STORAGE_CAS_SAME_VERSION_CONTENT_REPLACEMENT_PRESERVED",
    ) &&
    exactCleanupSelfTestText.includes(
      "SELF_TEST_STORAGE_CAS_SERVICE_ROLE_DELETE_REJECTED",
    ) &&
    exactCleanupSelfTestText.includes(
      "SELF_TEST_STORAGE_CAS_RECOVERED_ABSENCE_AMBIGUOUS",
    ) &&
    (storageCasForwardSource.match(/policy\.polcmd IN \('d', '\*'\)/gu) ?? [])
      .length === 2 &&
    storageCasForwardSource.includes("policy.polcmd IN ('r', '*')") &&
    storageCasForwardSource.includes(
      'CREATE POLICY "AiFinder exact-version cleanup visibility"',
    ) &&
    storageCasForwardSource.includes(
      'CREATE POLICY "AiFinder exact-version cleanup restriction"',
    ) &&
    storageCasForwardSource.includes(
      "AS RESTRICTIVE\nFOR DELETE\nTO anon\nUSING (",
    ) &&
    storageCasForwardSource.includes(
      "(bucket_id <> 'tool-logos'::text)\n  OR aifinder_storage_private.authorize_cleanup_delete(bucket_id, name, version)",
    ) &&
    storageCasForwardSource.includes(
      'ALTER POLICY "Deny direct public logo deletes"\nON storage.objects\nTO authenticated',
    ) &&
    storageCasForwardSource.includes(
      "ARRAY[v_anon_oid, v_authenticated_oid]::oid[]",
    ) &&
    storageCasForwardSource.includes("FOR SELECT\nTO anon\nUSING (") &&
    storageCasForwardSource.includes("has_schema_privilege(") &&
    storageCasForwardSource.includes("'storage.objects',\n    'SELECT'") &&
    storageCasForwardSource.includes("AND NOT (\n      CASE") &&
    storageCasForwardSource.includes("'command=' || policy.polcmd::text") &&
    emergencyText.includes("context.delta20ExactCleanupRequired === true") &&
    emergencyText.includes("cleanupDelta20ExactFixtures({") &&
    emergencyText.includes("reconcileDelta17APriorResidue({") &&
    emergencyText.indexOf("context.delta20ExactCleanupRequired === true") <
      emergencyText.indexOf("await awaitLogoUploadMutationWindowClosed(") &&
    emergencyText.includes("await awaitLogoUploadMutationWindowClosed(") &&
    emergencyText.indexOf("await awaitLogoUploadMutationWindowClosed(") <
      emergencyText.indexOf("hasVerifiedLogoCleanupIdentity(runtime)") &&
    emergencyText.indexOf("await awaitLogoUploadMutationWindowClosed(") <
      emergencyText.indexOf("await reconcileLogoUpload(context, runtime)") &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_AUDIT_FIRST") &&
    behaviorSelfTestText.includes(
      "SELF_TEST_LOGO_POST_UPLOAD_AUDIT_RESERVE",
    ) &&
    behaviorSelfTestText.includes(
      "SELF_TEST_LOGO_AUDIT_OBSERVATION_REUSE",
    ) &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_NO_AUDIT_NO_DELTA") &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_ONE_MATCH") &&
    behaviorSelfTestText.includes(
      "SELF_TEST_LOGO_DUPLICATE_AUDIT_FALLBACK",
    ) &&
    behaviorSelfTestText.includes(
      "SELF_TEST_LOGO_DISTINCT_AUDIT_FALLBACK",
    ) &&
    behaviorSelfTestText.includes(
      "SELF_TEST_LOGO_HINTED_DISTINCT_AUDIT_FALLBACK",
    ) &&
    behaviorSelfTestText.includes(
      "SELF_TEST_LOGO_WRONG_SINGLE_HINT_FALLBACK",
    ) &&
    behaviorSelfTestText.includes(
      "SELF_TEST_LOGO_VALID_INVALID_AUDIT_FALLBACK",
    ) &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_UNRELATED_PRESERVED") &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_MULTIPLE_MATCHES") &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_COMPLETE_DELTA_LIMIT") &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_INCOMPLETE_PAGINATION") &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_DOWNLOAD_FAILURE") &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_DELETE_OR_ABSENCE_REQUIRED") &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_VERSION_CHANGED") &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_DOWNLOAD_BUFFER_ZEROING") &&
    behaviorSelfTestText.includes(
      "SELF_TEST_LOGO_OVERSIZE_PREMATERIALIZATION",
    ) &&
    behaviorSelfTestText.includes(
      "SELF_TEST_LOGO_STREAM_OVERFLOW_CANCEL_ZERO",
    ) &&
    emergencyText.includes("await reconcileLogoUpload(") &&
    emergencyText.indexOf("await reconcileLogoUpload(") <
      emergencyText.indexOf('"audits",') &&
    cleanupFixturesText.includes("recordStorageAbsenceFailure(progress)") &&
    recordStorageFailureText.includes('progress.residue.add("storage")') &&
    emergencyText.includes("hasVerifiedLogoCleanupIdentity(runtime)") &&
    emergencyText.includes("performEmergencyCleanupDelete({") &&
    emergencyText.includes("await verifyEmergencyStorageAbsence({") &&
    emergencyStorageAbsenceText.includes(
      "for (let attempt = 1; attempt <= 2; attempt += 1)",
    ) &&
    emergencyStorageAbsenceText.includes(
      "recordStorageAbsenceFailure(progress)",
    ) &&
    emergencyStorageAbsenceText.includes(
      "await performEmergencyCleanupDelete({",
    ) &&
    emergencyStorageAbsenceText.includes(
      "operation: storageDeleteOperation",
    ) &&
    emergencyStorageAbsenceText.includes(
      'progress.verified.add("storage")',
    ) &&
    emergencyDeleteText.includes("retryingExactDelete") &&
    emergencyDeleteText.includes("!retryingExactDelete") &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_NONCANONICAL_VERSION_CHANGED") &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_PROTECTED_VERSION_CHANGED") &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_FALSE_SUCCESS_DELETE_RETRY") &&
    behaviorSelfTestText.includes(
      "SELF_TEST_LOGO_FALSE_SUCCESS_ABSENCE_PROOF",
    ) &&
    behaviorSelfTestText.includes(
      "SELF_TEST_LOGO_FALSE_SUCCESS_INTEGRATED_ABSENCE_PROOF",
    ) &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_EXACT_100_LIVE_ADMISSION") &&
    behaviorSelfTestText.includes(
      "SELF_TEST_LOGO_SELECTED_EMERGENCY_CLEANUP_BUDGET",
    ) &&
    behaviorSelfTestText.includes(
      "SELF_TEST_LOGO_SEMANTIC_INVALID_AUDIT_FULL_PATH",
    ) &&
    behaviorSelfTestText.includes(
      "SELF_TEST_LOGO_EMERGENCY_SECOND_ABSENCE_PROOF",
    ) &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_CAPACITY_ADMISSION") &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_UNSAFE_LIVE_ADMISSION") &&
    behaviorSelfTestText.includes("SELF_TEST_LOGO_MUTATION_WINDOW_CLOSURE") &&
    behaviorSelfTestText.includes(
      "SELF_TEST_LOGO_MUTATION_WINDOW_EARLY_OBSERVATION",
    ) &&
    evidenceText.includes("logo_payload_sha256") &&
    evidenceText.includes("logo_payload_bytes") &&
    !evidenceText.includes("logo_preinventory_sha256") &&
    orchestratorSource.includes(
      "logo_preinventory_sha256=${context.runtime.logoPreinventorySha256}",
    )
  );
}

function ambiguousLogoCleanupAssertions(
  coreSource,
  orchestratorSource,
  storageCasForwardSource,
) {
  const mutations = [
    [coreSource.replace("direct_data_success_requests: 14", "direct_data_success_requests: 13"), orchestratorSource],
    [coreSource.replace("direct_data_maximum: 26", "direct_data_maximum: 25"), orchestratorSource],
    [coreSource.replace("cleanup_storage_list_reserve: 4", "cleanup_storage_list_reserve: 3"), orchestratorSource],
    [coreSource.replace("cleanup_storage_download_reserve: 3", "cleanup_storage_download_reserve: 2"), orchestratorSource],
    [coreSource, orchestratorSource.replace("uploadInput: spec.ordinal === 15 ? logoPayload.bytes : uploadInput", "uploadInput: undefined")],
    [coreSource, orchestratorSource.replace("runtimeState.logoResponsePath = logoObjectPath", "runtimeState.logoObjectPath = logoObjectPath")],
    [coreSource, orchestratorSource.replace("logoPayload.bytes.fill(0)", "void logoPayload.bytes")],
    [coreSource, orchestratorSource.replace("queryLogoUploadAudit(", "queryLogoUploadAuditRemoved(")],
    [coreSource, orchestratorSource.replace("LOGO_RECONCILIATION_DELTA_LIMIT", "LOGO_RECONCILIATION_DELTA_UNBOUNDED")],
    [coreSource, orchestratorSource.replace("const ambiguousIdentityInventoryPageRequests =\n    LOGO_LIVE_RECONCILIATION_MAXIMUM_PAGES * 4", "const ambiguousIdentityInventoryPageRequests =\n    LOGO_LIVE_RECONCILIATION_MAXIMUM_PAGES * 3")],
    [coreSource, orchestratorSource.replace("poststateObservationDatabaseRequests = 2", "poststateObservationDatabaseRequests = 0")],
    [coreSource, orchestratorSource.replaceAll("logo_payload_sha256", "logo_payload_raw")],
    [coreSource, orchestratorSource.replace("if (reserveName) budgets.take(reserveName);", "if (false && reserveName) budgets.take(reserveName);")],
    [coreSource, orchestratorSource.replace("maximumPages: LOGO_LIVE_RECONCILIATION_MAXIMUM_PAGES,\n    reserveName: \"cleanupStorageListReserve\",\n    code: \"LOGO_RECONCILIATION_INVENTORY\"", "maximumPages: 1,\n    reserveName: \"cleanupStorageListReserve\",\n    code: \"LOGO_RECONCILIATION_INVENTORY\"")],
    [coreSource, orchestratorSource.replace("delta.size > LOGO_RECONCILIATION_MAXIMUM_CANDIDATES", "canonicalDelta.length > LOGO_RECONCILIATION_MAXIMUM_CANDIDATES")],
    [coreSource, orchestratorSource.replace("logoContentVersionFingerprint(row, code)", "sha256(row.name)")],
    [coreSource, orchestratorSource.replace("eTag: metadata.eTag ?? null", "eTag: null")],
    [coreSource, orchestratorSource.replace("validatedLogoAuditPath(rows, runtime, true)", "validatedLogoAuditPath(rows, runtime)")],
    [coreSource, orchestratorSource.replace("if (allowNoValid) {", "if (false && allowNoValid) {")],
    [coreSource, orchestratorSource.replace("rows.length !== 1", "false")],
    [coreSource, orchestratorSource.replace("runtime.logoResponsePath !== authoritativePaths[0]", "false")],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_LOGO_DUPLICATE_AUDIT_FALLBACK", "SELF_TEST_LOGO_DUPLICATE_AUDIT_REJECTED")],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_LOGO_DISTINCT_AUDIT_FALLBACK", "SELF_TEST_LOGO_DISTINCT_AUDIT_REJECTED")],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_LOGO_HINTED_DISTINCT_AUDIT_FALLBACK", "SELF_TEST_LOGO_HINTED_DISTINCT_AUDIT_REJECTED")],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_LOGO_WRONG_SINGLE_HINT_FALLBACK", "SELF_TEST_LOGO_WRONG_SINGLE_HINT_REJECTED")],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_LOGO_VALID_INVALID_AUDIT_FALLBACK", "SELF_TEST_LOGO_VALID_INVALID_AUDIT_REJECTED")],
    [coreSource, orchestratorSource.replace("row?.target_name === objectPath", "row?.target_name === LOGO_FILENAME")],
    [coreSource, orchestratorSource.replace("resetUnverifiedLogoCleanupIdentity(runtime);", "void runtime;")],
    [coreSource, orchestratorSource.replace("[...nonmatching].map((name) => [name, postInventory.versions.get(name)])", "[]")],
    [coreSource, orchestratorSource.replace("finalInventory.versions.get(name) === preLogoVersions.get(name)", "finalInventory.versions.get(name) !== preLogoVersions.get(name)")],
    [coreSource, orchestratorSource.replace("finalInventory.versions.get(name) === nonmatchingVersions.get(name)", "finalInventory.versions.get(name) !== nonmatchingVersions.get(name)")],
    [coreSource, orchestratorSource.replace('progress.residue.add("storage")', 'void progress.residue')],
    [coreSource, orchestratorSource.replace("!retryingExactDelete,", "true,")],
    [coreSource, orchestratorSource.replace("if (recordDirectSuccess) direct.success();", "direct.success();")],
    [coreSource, orchestratorSource.replace("recordDirectSuccess: false,\n              maximumPages: LOGO_LIVE_RECONCILIATION_MAXIMUM_PAGES,\n              code: \"EMERGENCY_VERIFY_STORAGE\"", "recordDirectSuccess: true,\n              maximumPages: LOGO_LIVE_RECONCILIATION_MAXIMUM_PAGES,\n              code: \"EMERGENCY_VERIFY_STORAGE\"")],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_LOGO_FALSE_SUCCESS_ABSENCE_PROOF", "SELF_TEST_LOGO_FALSE_SUCCESS_ABSENCE_UNPROVED")],
    [coreSource, orchestratorSource.replace("identity.sha256 !== runtime.logoPayloadSha256", "identity.sha256 === runtime.logoPayloadSha256")],
    [coreSource, orchestratorSource.replace("body.size > LOGO_MAXIMUM_DOWNLOAD_BYTES", "false")],
    [coreSource, orchestratorSource.replace("await reader.cancel();", "void reader;")],
    [coreSource, orchestratorSource.replace("const bytes = await boundedStorageDownloadBytes(\n    downloadOperation,", "const bytes = Buffer.from(await (await downloadOperation).data.arrayBuffer());\n  void (")],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_LOGO_OVERSIZE_PREMATERIALIZATION", "SELF_TEST_LOGO_OVERSIZE_MATERIALIZED")],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_LOGO_STREAM_OVERFLOW_CANCEL_ZERO", "SELF_TEST_LOGO_STREAM_OVERFLOW_UNBOUNDED")],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_LOGO_VERSION_CHANGED", "SELF_TEST_LOGO_VERSION_UNCHECKED")],
    [coreSource, orchestratorSource.replace("const LOGO_LIVE_RECONCILIATION_MAXIMUM_PAGES = 2", "const LOGO_LIVE_RECONCILIATION_MAXIMUM_PAGES = 3")],
    [coreSource, orchestratorSource.replace("return { names, versions, pageRequests }", "return { names, objectVersions, versions, pageRequests }")],
    [coreSource, orchestratorSource.replace("const exactStorageInfo =", "const exactStorageInfoRemoved =")],
    [coreSource, orchestratorSource.replace(".info(storagePath)", ".list(storagePath)")],
    [coreSource, orchestratorSource.replaceAll("info.version", "info.id")],
    [coreSource, orchestratorSource.replace('code: "DELTA20_POSTSTATE_STORAGE_INFO"', 'code: "DELTA20_POSTSTATE_STORAGE_LIST"')],
    [coreSource, orchestratorSource.replace("const STORAGE_CLEANUP_REQUESTS_MAXIMUM = 12", "const STORAGE_CLEANUP_REQUESTS_MAXIMUM = 11")],
    [coreSource, orchestratorSource.replace("admitLogoLiveMutation({", "void ({")],
    [coreSource, orchestratorSource.replace("inventory.pageRequests > LOGO_LIVE_RECONCILIATION_MAXIMUM_PAGES", "false")],
    [coreSource, orchestratorSource.replace("ambiguousIdentityTotal !== 23", "ambiguousIdentityTotal !== 21")],
    [coreSource, orchestratorSource.replace("falseSuccessTotal !== 18", "falseSuccessTotal !== 16")],
    [coreSource, orchestratorSource.replace("total !== 23", "total !== 21")],
    [coreSource, orchestratorSource.replace("total !== 22", "total !== 20")],
    [coreSource, orchestratorSource.replace("objectPath,\n      emergencyCleanupBudgets(context),", "objectPath,\n      context.budgets,")],
    [coreSource, orchestratorSource.replace("const observedRows = consumeLogoAuditObservation(runtime)", "const observedRows = null")],
    [coreSource, orchestratorSource.replace("auditResult?.error ? [] : auditResult?.data ?? []", "auditResult?.data ?? []")],
    [coreSource, orchestratorSource.replace("cacheLogoAuditObservation(\n    runtime,\n    auditResult?.error ? [] : auditResult?.data ?? [],", "cacheLogoAuditObservationRemoved(\n    runtime,\n    auditResult?.error ? [] : auditResult?.data ?? [],")],
    [coreSource, orchestratorSource.replace("await awaitLogoUploadMutationWindowClosed(", "await Promise.resolve(")],
    [coreSource, orchestratorSource.replaceAll("await wait(remaining);", "void remaining;")],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_LOGO_EXACT_100_LIVE_ADMISSION", "SELF_TEST_LOGO_EXACT_100_REJECTED")],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_LOGO_MUTATION_WINDOW_CLOSURE", "SELF_TEST_LOGO_MUTATION_WINDOW_OPEN")],
    [coreSource, orchestratorSource.replaceAll("logo_preinventory_sha256=${context.runtime.logoPreinventorySha256}", "logo_preinventory_sha256=omitted")],
    [coreSource, orchestratorSource.replace("await verifyEmergencyStorageAbsence({", "await verifyEmergencyStorageAbsenceRemoved({")],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_LOGO_EMERGENCY_SECOND_ABSENCE_PROOF", "SELF_TEST_LOGO_EMERGENCY_SECOND_ABSENCE_UNPROVED")],
    [coreSource, orchestratorSource.replace("createStorageCleanupCapabilityToken(randomBytes)", "createStorageCleanupCapabilityToken(Buffer.alloc(32))")],
    [coreSource, orchestratorSource.replaceAll("direct.storageCleanup.prepareGrant(", "direct.storageCleanup.prepareBroadGrant(")],
    [coreSource, orchestratorSource.replaceAll("reconcileStorageCleanupGrantPreparation({", "void ({")],
    [coreSource, orchestratorSource.replaceAll("direct.storageCleanup.deleteExactObject(", "direct.client.storage.deleteExactObject(")],
    [coreSource, orchestratorSource.replaceAll("direct.storageCleanup.revokeGrant({", "direct.storageCleanup.revokeAllGrants({")],
    [coreSource, orchestratorSource.replaceAll("persistGrantRecord(storageRecord)", "void storageRecord")],
    [coreSource, orchestratorSource.replaceAll('delete_response: "NOT_OBSERVED"', 'delete_response: "LOST"')],
    [coreSource, orchestratorSource.replaceAll("grantBinding.expected_version", "storageRecord.expected_version")],
    [coreSource, orchestratorSource.replaceAll("token_hash: capability.token_hash", "token_hash: rawToken")],
    [coreSource, orchestratorSource.replaceAll("allowOwnershipConflict: true", "allowOwnershipConflict: false")],
    [coreSource, orchestratorSource.replaceAll("ownership-conflict:${observedVersion", "${observedVersion")],
    [coreSource, orchestratorSource.replaceAll('requestUrl.pathname.startsWith("/storage/v1/object/")', 'requestUrl.pathname === "/storage/v1/object/tool-logos"')],
    [coreSource, orchestratorSource.replaceAll('if (storageDeleteRequest) {\n        fail("STORAGE_CLEANUP_DELETE_CLIENT_ROLE");', 'if (false) {\n        fail("STORAGE_CLEANUP_DELETE_CLIENT_ROLE");')],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_STORAGE_CAS_REPLACEMENT_VERSION_PRESERVED", "SELF_TEST_STORAGE_CAS_REPLACEMENT_VERSION_DELETED")],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_STORAGE_CAS_LOST_DELETE_REPLACEMENT_PRESERVED", "SELF_TEST_STORAGE_CAS_LOST_DELETE_REPLACEMENT_DELETED")],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_STORAGE_CAS_SAME_VERSION_CONTENT_REPLACEMENT_PRESERVED", "SELF_TEST_STORAGE_CAS_SAME_VERSION_CONTENT_REPLACEMENT_DELETED")],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_STORAGE_CAS_SERVICE_ROLE_DELETE_REJECTED", "SELF_TEST_STORAGE_CAS_SERVICE_ROLE_DELETE_ALLOWED")],
    [coreSource, orchestratorSource.replaceAll("SELF_TEST_STORAGE_CAS_RECOVERED_ABSENCE_AMBIGUOUS", "SELF_TEST_STORAGE_CAS_RECOVERED_ABSENCE_AUTHORIZED")],
    [coreSource, orchestratorSource, storageCasForwardSource.replace("policy.polcmd IN ('d', '*')", "policy.polcmd = 'd'")],
    [coreSource, orchestratorSource, storageCasForwardSource.replace("policy.polcmd IN ('r', '*')", "policy.polcmd = 'r'")],
    [coreSource, orchestratorSource, storageCasForwardSource.replace('CREATE POLICY "AiFinder exact-version cleanup visibility"', 'CREATE POLICY "AiFinder broad cleanup visibility"')],
    [coreSource, orchestratorSource, storageCasForwardSource.replace('CREATE POLICY "AiFinder exact-version cleanup restriction"', 'CREATE POLICY "AiFinder broad cleanup restriction"')],
    [coreSource, orchestratorSource, storageCasForwardSource.replace("AS RESTRICTIVE\nFOR DELETE\nTO anon\nUSING (", "AS PERMISSIVE\nFOR DELETE\nTO anon\nUSING (")],
    [coreSource, orchestratorSource, storageCasForwardSource.replace("(bucket_id <> 'tool-logos'::text)\n  OR aifinder_storage_private.authorize_cleanup_delete(bucket_id, name, version)", "aifinder_storage_private.authorize_cleanup_delete(bucket_id, name, version)")],
    [coreSource, orchestratorSource, storageCasForwardSource.replace('ALTER POLICY "Deny direct public logo deletes"\nON storage.objects\nTO authenticated', 'ALTER POLICY "Deny direct public logo deletes"\nON storage.objects\nTO anon, authenticated')],
    [coreSource, orchestratorSource, storageCasForwardSource.replace("ARRAY[v_anon_oid, v_authenticated_oid]::oid[]", "ARRAY[v_anon_oid]::oid[]")],
    [coreSource, orchestratorSource, storageCasForwardSource.replace("FOR SELECT\nTO anon\nUSING (", "FOR UPDATE\nTO anon\nUSING (")],
    [coreSource, orchestratorSource, storageCasForwardSource.replace("has_schema_privilege(", "has_schema_privilege_removed(")],
    [coreSource, orchestratorSource, storageCasForwardSource.replace("'storage.objects',\n    'SELECT'", "'storage.objects',\n    'INSERT'")],
    [coreSource, orchestratorSource, storageCasForwardSource.replace("AND NOT (\n      CASE", "AND NOT CASE")],
    [coreSource, orchestratorSource, storageCasForwardSource.replace("'command=' || policy.polcmd::text", "'command=' || policy.polcmd")],
    [coreSource, orchestratorSource.replace("prior.external_cleanup_verified === false", "prior.external_cleanup_verified === true")],
    [coreSource, orchestratorSource.replace("pending_locator_sha256: pendingLocatorSha256", "pending_locator_sha256: locatorSha256")],
    [coreSource, orchestratorSource.replace('"DELTA20_RUNTIME_FINAL_STORAGE_CAS_LOCATOR"', '"DELTA20_RUNTIME_PENDING_RECOVERY_LOCATOR"')],
    [coreSource, orchestratorSource.replace("pendingLocatorSha256: pendingRecovery.pending_locator_sha256", "pendingLocatorSha256: finalLocatorSha256")],
    [coreSource, orchestratorSource.replace("const pendingPublication = pendingPublicationReceiptPresent", "const pendingPublication = retained.publicationComplete")],
    [coreSource, orchestratorSource.replace("const cleanupPublication = cleanupPublicationReceiptPresent", "const cleanupPublication = retained.publicationComplete")],
    [coreSource, orchestratorSource.replace('"pending_evidence",\n    "pending_evidence_sha256",\n    "pending_locator_sha256",', '"pending_locator_sha256",\n    "pending_evidence",\n    "pending_evidence_sha256",')],
    [coreSource, orchestratorSource.replace("pending_locator_sha256: digestA,", "pending_locator_sha256: digestB,")],
  ];
  const base = ambiguousLogoCleanupContract(
    coreSource,
    orchestratorSource,
    storageCasForwardSource,
  );
  const mutationResults = mutations.map(
    ([
      candidateCore,
      candidateOrchestrator,
      candidateStorageCasForward = storageCasForwardSource,
    ]) =>
      ambiguousLogoCleanupContract(
        candidateCore,
        candidateOrchestrator,
        candidateStorageCasForward,
      ),
  );
  return [base && mutationResults.every((result) => !result)];
}

function everyBoundCatchRecordsFailure(root, functionName) {
  const declaration = namedFunctionNode(root, functionName);
  if (!declaration) return false;
  let boundCatchCount = 0;
  let valid = true;
  const visit = (node) => {
    if (
      ts.isCatchClause(node) &&
      node.variableDeclaration?.name &&
      ts.isIdentifier(node.variableDeclaration.name)
    ) {
      boundCatchCount += 1;
      const variableName = node.variableDeclaration.name.text;
      const directFailureRecords = node.block.statements.filter(
        (statement) =>
          ts.isExpressionStatement(statement) &&
          ts.isCallExpression(statement.expression) &&
          statement.expression.getText(root) ===
            `rememberCleanupFailure(failures, ${variableName})`,
      );
      if (
        directFailureRecords.length !== 1 ||
        node.block.statements.some(
          (statement) =>
            ts.isThrowStatement(statement) || ts.isReturnStatement(statement),
        )
      ) {
        valid = false;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(declaration);
  return valid && boundCatchCount > 0;
}

function markerFacts(orchestratorSource) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const lines = literalArrayFromDeclaration(facts.root, "MARKER_LINES");
  const bytesInitializer = facts.declarations.get("MARKER_BYTES") ?? "";
  const writeCalls = facts.calls.filter((call) =>
    call.startsWith("writeFileSync("),
  );
  return {
    bytesInitializer,
    lines,
    writeCalls,
    exactLines:
      Array.isArray(lines) &&
      JSON.stringify(lines) === JSON.stringify(MARKER_LINES),
    exactConstruction:
      bytesInitializer ===
      'Buffer.from(`${MARKER_LINES.join("\\n")}\\n`, "utf8")',
    exactWrite:
      writeCalls.length === 1 &&
      writeCalls[0] === "writeFileSync(markerAbsolutePath, MARKER_BYTES, { flag: \"wx\", mode: 0o644 })",
  };
}

function validPredecessor() {
  return {
    phase_33na_passed: false,
    phase_33na_final_dependency_evidence_ratified: true,
    phase_33qa_unique_preview_trigger_validated: true,
    phase_33ra_residual_preview_cleanup_passed: true,
    phase_33sa_rolled_back_schema_incompatibility: true,
    phase_33ta_failed_cleanup_resolver_exhaustion: true,
    phase_33ua_residual_cleanup_passed: true,
    phase_33va_marker_mismatch_rolled_back: true,
    phase_34ba_phase_compiler_implemented: true,
    phase_p01_compiler_proof_passed: true,
    phase_34ea_bounded_inspection_contract_implemented: true,
    phase_compiler_generation_exception_reviewed: true,
    phase_compiler_policy_lane: "PASS_3_OF_3",
  };
}

function validDeploymentIdentity(overrides = {}) {
  const deployment = {
    id: "dpl_Synthetic34IA",
    ownerId: "team_9POJYxNnjIBbrQ19My8M5yG3",
    url: "synthetic-34ia.vercel.app",
    readyState: "READY",
    target: null,
    project: { id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R", name: "aifinder" },
    gitSource: {
      sha: "f".repeat(40),
      ref: BRANCH,
      repo: "jcdumaua/aifinder",
    },
    alias: [],
  };
  const inventory = [{
    id: deployment.id,
    uid: deployment.id,
    url: deployment.url,
    readyState: "READY",
    target: null,
    meta: {
      githubCommitSha: "f".repeat(40),
      githubCommitRef: BRANCH,
      githubCommitRepo: "aifinder",
      githubCommitOrg: "jcdumaua",
    },
  }];
  return {
    inventory,
    deployment,
    expected_commit: "f".repeat(40),
    expected_ref: BRANCH,
    expected_repository: "jcdumaua/aifinder",
    expected_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
    expected_project_name: "aifinder",
    expected_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
    github_deployment_advisory: {
      available: true,
      matching_records: 1,
      records_observed: 1,
    },
    ...overrides,
  };
}

function validDeploymentWithoutV13Git() {
  const fixture = validDeploymentIdentity();
  delete fixture.deployment.gitSource;
  return fixture;
}

function validDeploymentAliasVariants() {
  const omitted = validDeploymentIdentity();
  delete omitted.deployment.alias;
  const automatic = validDeploymentIdentity();
  const automaticAlias = "synthetic-automatic-branch-alias.invalid";
  automatic.inventory[0].alias = [automaticAlias];
  automatic.inventory[0].meta.branchAlias = automaticAlias;
  automatic.deployment.alias = [automaticAlias];
  automatic.deployment.meta = { branchAlias: automaticAlias };
  const topLevelProject = validDeploymentIdentity();
  topLevelProject.deployment.projectId =
    "prj_BPaQVKdElriAhxabhoTkg8LysQ5R";
  topLevelProject.deployment.name = "aifinder";
  delete topLevelProject.deployment.project;
  return [omitted, automatic, topLevelProject];
}

function automaticBranchAliasFixture(aliases = [], branchAlias = null) {
  const fixture = validDeploymentIdentity();
  fixture.deployment.alias = [...aliases];
  fixture.deployment.meta = {
    branchAlias,
    githubCommitSha: "f".repeat(40),
    githubCommitRef: BRANCH,
    githubCommitRepo: "aifinder",
    githubCommitOrg: "jcdumaua",
  };
  return fixture;
}

function validExistingPreviewResumeState() {
  const deploymentIdentity = automaticBranchAliasFixture(
    ["synthetic-automatic-branch-alias.invalid"],
    "synthetic-automatic-branch-alias.invalid",
  );
  return {
    deployment_identity: deploymentIdentity,
    expected_deployment_id: deploymentIdentity.deployment.id,
    runtime_sessions: 0,
    application_requests: 0,
    data_requests: 0,
    data_writes: 0,
    target_confirmation_count: 1,
    temporary_remote_branch_states: ["ABSENT", "ABSENT"],
    preview_count: 1,
  };
}

function canonicalTempPathFixture(overrides = {}) {
  const lexicalBase = "/var/folders/synthetic/T";
  const canonicalBase = "/private/var/folders/synthetic/T";
  const rootName =
    overrides.rootName ?? "aifinder-34ia-resume-Ab12Cd";
  const lexicalRoot = `${lexicalBase}/${rootName}`;
  const canonicalRoot = `${canonicalBase}/${rootName}`;
  const stateName = "deployment-state.json";
  const canonicalState = `${canonicalRoot}/${stateName}`;
  const canonicalizedState =
    overrides.canonicalizedState ?? canonicalState;
  const effectiveUid = 501;
  const operations = [];
  let rootPresent = true;
  const entries = [...(overrides.entries ?? [stateName])];
  let statePresent =
    overrides.statePresent ?? entries.includes(stateName);
  const metadata = (kind, options = {}) => ({
    dev: options.dev ?? 7,
    ino: options.ino ?? (kind === "directory" ? 11 : 12),
    mode:
      options.mode ??
      (kind === "directory" ? 0o40700 : 0o100600),
    nlink: options.nlink ?? 1,
    uid: options.uid ?? effectiveUid,
    isDirectory: () => kind === "directory",
    isFile: () => kind === "file",
    isSymbolicLink: () => options.symlink === true,
  });
  const rootMetadata = metadata(
    overrides.rootKind ?? "directory",
    {
      mode: overrides.rootMode,
      uid: overrides.rootUid,
      symlink: overrides.rootSymlink,
    },
  );
  const stateMetadata = metadata(
    overrides.stateKind ?? "file",
    {
      mode: overrides.stateMode,
      nlink: overrides.stateNlink,
      uid: overrides.stateUid,
      symlink: overrides.stateSymlink,
    },
  );
  const canonicalizedRoot =
    overrides.canonicalizedRoot ?? canonicalRoot;
  const io = {
    fsyncDirectory(directory) {
      operations.push(["fsyncDirectory", directory]);
    },
    isAbsent(candidate) {
      if (candidate === canonicalState) return !statePresent;
      if (candidate === canonicalRoot) return !rootPresent;
      return true;
    },
    lstat(candidate) {
      if (
        rootPresent &&
        [lexicalRoot, canonicalRoot, canonicalizedRoot].includes(candidate)
      ) {
        return rootMetadata;
      }
      if (statePresent && candidate === canonicalState) {
        return stateMetadata;
      }
      const error = new Error("ENOENT");
      error.code = "ENOENT";
      throw error;
    },
    readdir(candidate) {
      if (candidate !== canonicalRoot || !rootPresent) {
        throw new Error("READDIR_OUTSIDE_ROOT");
      }
      return [...entries];
    },
    realpathNative(candidate) {
      if (candidate === lexicalBase || candidate === canonicalBase) {
        return canonicalBase;
      }
      if (candidate === lexicalRoot || candidate === canonicalRoot) {
        return canonicalizedRoot;
      }
      if (candidate === canonicalState) return canonicalizedState;
      return candidate;
    },
    rmdir(candidate) {
      operations.push(["rmdir", candidate]);
      if (candidate !== canonicalRoot || entries.length !== 0) {
        throw new Error("RMDIR_SCOPE");
      }
      rootPresent = false;
    },
    unlink(candidate) {
      operations.push(["unlink", candidate]);
      if (candidate !== canonicalState || !statePresent) {
        throw new Error("UNLINK_SCOPE");
      }
      statePresent = false;
      const index = entries.indexOf(stateName);
      if (index !== -1) entries.splice(index, 1);
    },
  };
  return {
    canonicalBase,
    canonicalRoot,
    canonicalState,
    effectiveUid,
    io,
    lexicalBase,
    lexicalRoot,
    operations,
    rootName,
    stateName,
  };
}

function delta15CanonicalTempRootAssertions() {
  if (typeof core.validateCanonicalTempRoot !== "function") {
    return [false];
  }
  const fixture = canonicalTempPathFixture({
    rootName: "aifinder-34ia-delta15-Ab12Cd",
  });
  return [
    !catches(() =>
      core.validateCanonicalTempRoot(
        {
          effective_uid: fixture.effectiveUid,
          expected_root_prefix: "aifinder-34ia-delta15-",
          lexical_temp_root: fixture.lexicalRoot,
          lexical_tmp_base: fixture.lexicalBase,
        },
        fixture.io,
      ),
    ),
  ];
}

function delta05CanonicalTempPathAssertions(coreSource, orchestratorSource) {
  if (
    typeof core.validateCanonicalTempRoot !== "function" ||
    typeof core.validateCanonicalStateFile !== "function" ||
    typeof core.removeExactCanonicalStateRoot !== "function"
  ) {
    return Array(16).fill(false);
  }
  const rootInput = (fixture, lexicalTempRoot = fixture.lexicalRoot) => ({
    effective_uid: fixture.effectiveUid,
    expected_root_prefix: "aifinder-34ia-resume-",
    lexical_temp_root: lexicalTempRoot,
    lexical_tmp_base: fixture.lexicalBase,
  });
  const stateInput = (fixture, expectedBasename = fixture.stateName) => ({
    canonical_temp_root: fixture.canonicalRoot,
    effective_uid: fixture.effectiveUid,
    expected_state_basename: expectedBasename,
  });
  const cleanupInput = (fixture) => ({
    ...rootInput(fixture),
    expected_state_basename: fixture.stateName,
  });
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const emptyRootContract = (candidate) => {
    const candidateFacts = astFacts(CORE_PATH, candidate);
    const removalText =
      namedFunctionText(
        candidateFacts.root,
        "removeExactCanonicalStateRoot",
      ) ?? "";
    return (
      removalText.includes("if (entries.length === 0) {") &&
      removalText.includes("operations.isAbsent(expectedStatePath)") &&
      removalText.includes(
        "operations.fsyncDirectory(root.canonical_temp_root)",
      ) &&
      removalText.includes(
        "operations.rmdir(revalidatedEmptyRoot.canonical_temp_root)",
      ) &&
      removalText.includes(
        "operations.fsyncDirectory(revalidatedEmptyRoot.canonical_tmp_base)",
      )
    );
  };
  const emptyRootMutation = coreSource.replace(
    "  if (entries.length === 0) {",
    "  if (entries.length < 0) {",
  );
  const createRootText =
    namedFunctionText(facts.root, "createCanonicalTempRoot") ?? "";
  const createMarkerText =
    namedFunctionText(facts.root, "createResumeAttemptMarker") ?? "";
  const operationsText =
    namedFunctionText(facts.root, "canonicalTempOperations") ?? "";
  const persistStateText =
    namedFunctionText(facts.root, "persistDeploymentState") ?? "";
  const removeRootText =
    namedFunctionText(facts.root, "removeExternalTempRoot") ?? "";
  const exclusiveWriteText =
    namedFunctionText(facts.root, "openExclusiveMode0600") ?? "";
  const resumeText =
    namedFunctionText(facts.root, "resumeExistingPreviewRuntime") ?? "";
  const invocationText =
    namedFunctionText(facts.root, "parseReplacementResumeInvocation") ??
    "";
  const harnessContract =
    createRootText.includes("validateCanonicalTempRoot(") &&
    createRootText.includes("lexicalTempRoot") &&
    operationsText.includes("realpathNative: realpathSync.native") &&
    persistStateText.includes("validateCanonicalStateFile(") &&
    !persistStateText.includes("realpathSync(statePath) !== statePath") &&
    removeRootText.includes("removeExactCanonicalStateRoot(") &&
    exclusiveWriteText.includes("fsConstants.O_CREAT") &&
    exclusiveWriteText.includes("fsConstants.O_EXCL") &&
    exclusiveWriteText.includes("fsConstants.O_NOFOLLOW") &&
    exclusiveWriteText.includes("fsyncSync(descriptor)") &&
    resumeText.includes('createCanonicalTempRoot(\n      "aifinder-34ia-resume-"') &&
    resumeText.includes(
      "createResumeAttemptMarker(\n      tempRoot,\n      resumeAttemptBinding(",
    ) &&
    resumeText.includes("replacementInvocation") &&
    resumeText.indexOf("createResumeAttemptMarker(") <
    resumeText.indexOf("prepareRuntimeEnvironment(") &&
    !orchestratorSource.includes("rmSync(") &&
    !orchestratorSource.includes("recursive: true") &&
    !orchestratorSource.includes("rm -rf");
  const tempRootDirectoryEntryDurable =
    createRootText.includes(
      "fsyncExactDirectory(identity.canonical_tmp_base)",
    ) &&
    createRootText.indexOf("validateCanonicalTempRoot(") <
      createRootText.indexOf(
        "fsyncExactDirectory(identity.canonical_tmp_base)",
      ) &&
    createRootText.indexOf(
      "fsyncExactDirectory(identity.canonical_tmp_base)",
    ) < createRootText.lastIndexOf("return identity");
  const resumeMarkerDirectoryEntryDurable =
    createMarkerText.includes("fsyncSync(markerDescriptor)") &&
    createMarkerText.includes("closeSync(markerDescriptor)") &&
    createMarkerText.includes(
      "fsyncExactDirectory(path.dirname(markerPath))",
    ) &&
    createMarkerText.indexOf("fsyncSync(markerDescriptor)") <
      createMarkerText.indexOf("closeSync(markerDescriptor)") &&
    createMarkerText.indexOf("closeSync(markerDescriptor)") <
      createMarkerText.indexOf(
        "fsyncExactDirectory(path.dirname(markerPath))",
      ) &&
    createMarkerText.indexOf(
      "fsyncExactDirectory(path.dirname(markerPath))",
    ) < createMarkerText.indexOf("return Object.freeze");

  const lexical = canonicalTempPathFixture();
  const lexicalRoot = core.validateCanonicalTempRoot(
    rootInput(lexical),
    lexical.io,
  );
  const lexicalState = core.validateCanonicalStateFile(
    stateInput(lexical),
    lexical.io,
  );
  const canonical = canonicalTempPathFixture();
  const canonicalRoot = core.validateCanonicalTempRoot(
    rootInput(canonical, canonical.canonicalRoot),
    canonical.io,
  );

  const finalSymlink = canonicalTempPathFixture({ rootSymlink: true });
  const outsideState = canonicalTempPathFixture({
    canonicalizedState:
      "/private/var/folders/synthetic/outside/deployment-state.json",
  });
  const outsideRoot = canonicalTempPathFixture({
    canonicalizedRoot:
      "/private/var/folders/synthetic-other/T/aifinder-34ia-resume-Ab12Cd",
  });
  const nestedRoot = canonicalTempPathFixture({
    canonicalizedRoot:
      "/private/var/folders/synthetic/T/nested/aifinder-34ia-resume-Ab12Cd",
  });
  const nonRegular = canonicalTempPathFixture({ stateKind: "directory" });
  const wrongStateMode = canonicalTempPathFixture({ stateMode: 0o100644 });
  const hardLinked = canonicalTempPathFixture({ stateNlink: 2 });
  const wrongStateOwner = canonicalTempPathFixture({ stateUid: 777 });
  const wrongRootMode = canonicalTempPathFixture({ rootMode: 0o40755 });
  const wrongRootOwner = canonicalTempPathFixture({ rootUid: 777 });
  const extraEntry = canonicalTempPathFixture({
    entries: ["deployment-state.json", "unexpected-entry"],
  });
  const cleanup = canonicalTempPathFixture();
  const cleanupResult = core.removeExactCanonicalStateRoot(
    cleanupInput(cleanup),
    cleanup.io,
  );
  const emptyRoot = canonicalTempPathFixture({
    entries: [],
    statePresent: false,
  });
  let emptyRootCleanupResult = null;
  let emptyRootCleanupRejected = false;
  try {
    emptyRootCleanupResult = core.removeExactCanonicalStateRoot(
      cleanupInput(emptyRoot),
      emptyRoot.io,
    );
  } catch {
    emptyRootCleanupRejected = true;
  }
  const exactOperations = [
    ["unlink", cleanup.canonicalState],
    ["fsyncDirectory", cleanup.canonicalRoot],
    ["rmdir", cleanup.canonicalRoot],
    ["fsyncDirectory", cleanup.canonicalBase],
  ];

  return [
    lexicalRoot?.canonical_temp_root === lexical.canonicalRoot &&
      lexicalState?.canonical_state_path === lexical.canonicalState,
    canonicalRoot?.canonical_temp_root === canonical.canonicalRoot,
    catches(() =>
      core.validateCanonicalTempRoot(rootInput(finalSymlink), finalSymlink.io),
    ),
    catches(() =>
      core.validateCanonicalStateFile(
        stateInput(outsideState),
        outsideState.io,
      ),
    ),
    catches(() =>
      core.validateCanonicalTempRoot(
        rootInput(outsideRoot),
        outsideRoot.io,
      ),
    ),
    catches(() =>
      core.validateCanonicalTempRoot(
        rootInput(nestedRoot),
        nestedRoot.io,
      ),
    ),
    catches(() =>
      core.validateCanonicalStateFile(stateInput(nonRegular), nonRegular.io),
    ),
    catches(() =>
      core.validateCanonicalStateFile(
        stateInput(wrongStateMode),
        wrongStateMode.io,
      ),
    ),
    catches(() =>
      core.validateCanonicalStateFile(stateInput(hardLinked), hardLinked.io),
    ),
    catches(() =>
      core.validateCanonicalStateFile(
        stateInput(wrongStateOwner),
        wrongStateOwner.io,
      ),
    ),
    catches(() =>
      core.validateCanonicalTempRoot(
        rootInput(wrongRootMode),
        wrongRootMode.io,
      ),
    ),
    catches(() =>
      core.validateCanonicalTempRoot(
        rootInput(wrongRootOwner),
        wrongRootOwner.io,
      ),
    ),
    catches(() =>
      core.removeExactCanonicalStateRoot(
        cleanupInput(extraEntry),
        extraEntry.io,
      ),
    ) && extraEntry.operations.length === 0,
    cleanupResult?.removed === true,
    core.canonicalJson(cleanup.operations) ===
      core.canonicalJson(exactOperations),
    cleanup.operations.every(
      ([operation, target]) =>
        ["unlink", "fsyncDirectory", "rmdir"].includes(operation) &&
        [
          cleanup.canonicalState,
          cleanup.canonicalRoot,
          cleanup.canonicalBase,
        ].includes(target),
    ) && harnessContract,
    tempRootDirectoryEntryDurable,
    resumeMarkerDirectoryEntryDurable,
    emptyRootCleanupRejected === false &&
      emptyRootCleanupResult?.removed === true &&
      core.canonicalJson(emptyRoot.operations) ===
        core.canonicalJson([
          ["fsyncDirectory", emptyRoot.canonicalRoot],
          ["rmdir", emptyRoot.canonicalRoot],
          ["fsyncDirectory", emptyRoot.canonicalBase],
        ]) &&
      emptyRootContract(coreSource) &&
      emptyRootMutation !== coreSource &&
      !emptyRootContract(emptyRootMutation),
  ];
}

function validDelta09MetadataReadiness() {
  return {
    names: [...EXPECTED_ENVIRONMENT_NAMES],
    optional_alias_name: "SUPABASE_URL",
    observations: EXPECTED_ENVIRONMENT_NAMES.map((name) => ({
      name,
      target: "PREVIEW",
      branch_scope: "GLOBAL",
      type: "SENSITIVE",
      decrypted: false,
    })),
    metadata_requests: 2,
    decrypt_true_requests: 0,
    environment_value_reads: 0,
    environment_pulls: 0,
    raw_values_persisted: 0,
    secret_hashes_persisted: 0,
  };
}

function validDelta09LocalReadiness() {
  return {
    names: [...EXPECTED_LOCAL_ENVIRONMENT_NAMES],
    present: Object.fromEntries(
      EXPECTED_LOCAL_ENVIRONMENT_NAMES.map((name) => [name, true]),
    ),
    nonempty: Object.fromEntries(
      EXPECTED_LOCAL_ENVIRONMENT_NAMES.map((name) => [name, true]),
    ),
    url_structurally_safe: true,
    staging_origin_matches: true,
    anon_key_publishable_capable: true,
    service_role_server_secret_capable: true,
    other_local_env_names_read: 0,
    values_printed: 0,
    values_logged: 0,
    values_hashed: 0,
    values_persisted: 0,
    exact_lengths_reported: 0,
    substrings_or_fingerprints_reported: 0,
  };
}

function productionEnvironmentContractPasses() {
  const login = source("app/api/admin/login/route.ts");
  const admin = source("lib/supabase-admin.ts");
  const browser = source("lib/supabase.ts");
  const productionFiles = [];
  const visit = (relativePath) => {
    const absolutePath = absolute(relativePath);
    const metadata = lstatSync(absolutePath);
    if (metadata.isSymbolicLink()) return false;
    if (metadata.isDirectory()) {
      for (const entry of readdirSync(absolutePath)) {
        if (!visit(path.join(relativePath, entry))) return false;
      }
      return true;
    }
    if (/\.(?:[cm]?[jt]sx?)$/u.test(relativePath)) {
      productionFiles.push(source(relativePath));
    }
    return true;
  };
  if (!["app", "lib", "components"].every(visit)) return false;
  for (const candidate of ["proxy.ts", "next.config.ts", "next.config.mjs", "next.config.js"]) {
    try {
      const metadata = lstatSync(absolute(candidate));
      if (metadata.isFile() && !metadata.isSymbolicLink()) {
        productionFiles.push(source(candidate));
      }
    } catch (caught) {
      if (caught?.code !== "ENOENT") throw caught;
    }
  }
  return (
    login.includes("const expectedPassword = process.env.ADMIN_PASSWORD;") &&
    login.includes("const sessionSecret = process.env.ADMIN_SESSION_SECRET;") &&
    login.includes("if (!expectedPassword || !sessionSecret)") &&
    login.includes("signSession(payload, sessionSecret)") &&
    admin.includes("process.env.NEXT_PUBLIC_SUPABASE_URL") &&
    admin.includes("process.env.SUPABASE_SERVICE_ROLE_KEY") &&
    browser.includes("process.env.NEXT_PUBLIC_SUPABASE_URL") &&
    browser.includes("process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
    !productionFiles.some((text) => /process\.env\.SUPABASE_URL\b/u.test(text))
  );
}

function delta09EnvironmentContractAssertions(coreSource, orchestratorSource) {
  if (
    typeof core.validateRuntimeEnvironmentMetadata !== "function" ||
    typeof core.validateProtectedLocalRuntimeEnvironment !== "function" ||
    typeof core.authorizeFixtureInsertion !== "function" ||
    typeof core.classifyRuntimeFailureMode !== "function"
  ) {
    return Array(18).fill(false);
  }
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const plan = core.createRuntimePlan();
  const metadata = validDelta09MetadataReadiness();
  const metadataReady = core.validateRuntimeEnvironmentMetadata(metadata);
  const optionalAlias = validDelta09MetadataReadiness();
  optionalAlias.observations.push({
    name: "SUPABASE_URL",
    target: "PREVIEW",
    branch_scope: "GLOBAL",
    type: "SENSITIVE",
    decrypted: false,
  });
  const optionalAliasReady =
    core.validateRuntimeEnvironmentMetadata(optionalAlias);
  const exactOverride = validDelta09MetadataReadiness();
  exactOverride.observations.push({
    name: "ADMIN_PASSWORD",
    target: "PREVIEW",
    branch_scope: "EXACT",
    type: "SECRET",
    decrypted: false,
  });
  const exactOverrideReady =
    core.validateRuntimeEnvironmentMetadata(exactOverride);
  const exactConflict = structuredClone(exactOverride);
  exactConflict.observations.push({
    name: "ADMIN_PASSWORD",
    target: "PREVIEW",
    branch_scope: "EXACT",
    type: "ENCRYPTED",
    decrypted: false,
  });
  const exactDuplicate = structuredClone(exactOverride);
  exactDuplicate.observations.push({
    name: "ADMIN_PASSWORD",
    target: "PREVIEW",
    branch_scope: "EXACT",
    type: "SECRET",
    decrypted: false,
  });
  const exactDuplicateReady =
    core.validateRuntimeEnvironmentMetadata(exactDuplicate);
  const otherBranchOnly = validDelta09MetadataReadiness();
  otherBranchOnly.observations = otherBranchOnly.observations.map(
    (observation) =>
      observation.name === "ADMIN_SESSION_SECRET"
        ? { ...observation, branch_scope: "OTHER" }
        : observation,
  );
  const local = validDelta09LocalReadiness();
  const localReady = core.validateProtectedLocalRuntimeEnvironment(local);
  const prepareText =
    namedFunctionText(facts.root, "prepareRuntimeEnvironment") ?? "";
  const metadataText =
    namedFunctionText(facts.root, "environmentMetadataObservations") ?? "";
  const resumeText =
    namedFunctionText(facts.root, "resumeExistingPreviewRuntime") ?? "";
  const runtimeText = namedFunctionText(facts.root, "runRuntimeSession") ?? "";
  const directText = namedFunctionText(facts.root, "createCountedSupabase") ?? "";
  const requestText = namedFunctionText(facts.root, "runApplicationRequest") ?? "";
  const loginResponse = validRuntimeResponse({
    ordinal: 2,
    method: "POST",
    path: "/api/admin/login",
    status: 200,
    body_contract: "SESSION_COOKIE_CREATED",
    admin_password_matches_deployment: true,
    session_cookie_httponly: true,
    session_cookie_secure: true,
    session_cookie_samesite: "Strict",
    session_cookie_bounded_lifetime: true,
  });
  const sessionResponse = validRuntimeResponse({
    ordinal: 3,
    method: "GET",
    path: "/api/admin/session",
    status: 200,
    body_contract: "AUTHENTICATED_SESSION",
    session_secret_signature_verified: true,
  });
  const missingRequired = EXPECTED_ENVIRONMENT_NAMES.every((name) => {
    const fixture = validDelta09MetadataReadiness();
    fixture.observations = fixture.observations.filter(
      (observation) => observation.name !== name,
    );
    return catches(() => core.validateRuntimeEnvironmentMetadata(fixture));
  });
  const invalidLocalName = validDelta09LocalReadiness();
  invalidLocalName.names = [...invalidLocalName.names, "ADMIN_SESSION_SECRET"];
  const beforeGate = {
    runtime_sessions: 1,
    application_requests: 4,
    last_completed_application_request: 4,
    fixture_writes: 0,
    cleanup_only: false,
  };
  const atGate = {
    ...beforeGate,
    application_requests: 5,
    last_completed_application_request: 5,
  };
  const guard = core.authorizeFixtureInsertion(atGate);
  return [
    exactSet(plan.environment_names, EXPECTED_ENVIRONMENT_NAMES) &&
      !plan.environment_names.includes("SUPABASE_URL"),
    metadataReady?.optional_alias_state === "ABSENT" &&
      metadataReady?.names_present === 5 &&
      optionalAliasReady?.optional_alias_state === "EFFECTIVE" &&
      exactOverrideReady?.names_present === 5 &&
      catches(() => core.validateRuntimeEnvironmentMetadata(exactConflict)) &&
      exactDuplicateReady?.exact_duplicate_observations === 1 &&
      catches(() =>
        core.validateRuntimeEnvironmentMetadata(otherBranchOnly),
      ),
    missingRequired,
    metadataReady?.sensitive_nonreadable_names === 5 &&
      metadataReady?.environment_value_reads === 0,
    !orchestratorSource.includes('"env", "pull"') &&
      !orchestratorSource.includes("prepareEnvironmentParity") &&
      !orchestratorSource.includes("preview_environment_parity"),
    prepareText.includes("decrypt=false") &&
      !prepareText.includes("decrypt=true") &&
      !prepareText.includes(".value") &&
      !metadataText.includes(".value") &&
      !orchestratorSource.includes("environment_value_reads: 1"),
    localReady?.names_present === 4 &&
      catches(() =>
        core.validateProtectedLocalRuntimeEnvironment(invalidLocalName),
      ),
    productionEnvironmentContractPasses() &&
      prepareText.includes("verifyProductionEnvironmentContract("),
    prepareText.includes("validateRuntimeEnvironmentMetadata(") &&
      !prepareText.includes("environment.ADMIN_SESSION_SECRET"),
    catches(() =>
      core.validateProtectedLocalRuntimeEnvironment({
        ...validDelta09LocalReadiness(),
        staging_origin_matches: false,
      }),
    ) &&
      resumeText.indexOf("prepareRuntimeEnvironment(") <
        resumeText.indexOf("createCountedSupabase("),
    directText.includes("requestUrl.origin !== confirmedOrigin") &&
      directText.includes("environment.NEXT_PUBLIC_SUPABASE_URL"),
    !catches(() => core.validateRuntimeResponse(loginResponse)) &&
      catches(() =>
        core.validateRuntimeResponse({
          ...loginResponse,
          admin_password_matches_deployment: false,
        }),
      ),
    !catches(() => core.validateRuntimeResponse(sessionResponse)) &&
      catches(() =>
        core.validateRuntimeResponse({
          ...sessionResponse,
          session_secret_signature_verified: false,
        }),
      ),
    guard?.authorized_after_request === 5 &&
      runtimeText.indexOf("authorizeFixtureInsertion(") <
        runtimeText.indexOf("setupOfficialFixturesBeforeRequestSix(") &&
      runtimeText.indexOf("setupOfficialFixturesBeforeRequestSix(") >
        runtimeText.indexOf("validateRuntimeResponse(response.record)"),
    runtimeText.includes("fixtures.EDIT.id") &&
      runtimeText.includes("fixtures.REJECT.id") &&
      runtimeText.includes("fixtures.APPROVE.id") &&
      runtimeText.includes("fixtureIds:") &&
      orchestratorSource.includes(
        'fail("DELTA16A_APPLICATION_FIXTURE_BINDING")',
      ),
    catches(() => core.authorizeFixtureInsertion(beforeGate)) &&
      runtimeText.indexOf("authorizeFixtureInsertion(") <
        runtimeText.indexOf("syntheticFixtures("),
    core.classifyRuntimeFailureMode({
      fixture_writes: 0,
      synthetic_effects: 0,
    }) === "NO_SYNTHETIC_EFFECTS" &&
      core.classifyRuntimeFailureMode({
        fixture_writes: 1,
        synthetic_effects: 1,
      }) === "CLEANUP_ONLY" &&
      resumeText.includes("classifyRuntimeFailureMode("),
    requestText.includes("projectHttpResponseHeaderBuffers(") &&
      requestText.includes("response.raw_header_bytes") &&
      !requestText.includes("headers: projectedHeaders"),
  ];
}

function delta09PreRuntimeReplacementAssertions(orchestratorSource) {
  if (
    typeof core.classifyPreRuntimeReplacementDisposition !== "function"
  ) {
    return Array(5).fill(false);
  }
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const cleanupText =
    namedFunctionText(facts.root, "cleanupPreRuntimeReplacementAttempt") ??
    "";
  const resumeText =
    namedFunctionText(facts.root, "resumeExistingPreviewRuntime") ?? "";
  const runtimeText = namedFunctionText(facts.root, "runRuntimeSession") ?? "";
  const invocationText =
    namedFunctionText(facts.root, "parseReplacementResumeInvocation") ?? "";
  const zero = {
    replacement_invocation: 1,
    maximum_replacement_invocations: 5,
    runtime_sessions: 0,
    application_requests: 0,
    fixture_writes: 0,
    data_writes: 0,
  };
  return [
    core.classifyPreRuntimeReplacementDisposition(zero) ===
      "RETRY_WITH_FRESH_ROOT",
    core.classifyPreRuntimeReplacementDisposition({
      ...zero,
      replacement_invocation: 5,
    }) === "PRE_RUNTIME_REPLACEMENTS_EXHAUSTED",
    [
      { runtime_sessions: 1 },
      { application_requests: 1 },
      { fixture_writes: 1 },
      { data_writes: 1 },
    ].every(
      (mutation) =>
        core.classifyPreRuntimeReplacementDisposition({
          ...zero,
          ...mutation,
        }) === "RUNTIME_AUTHORITY_CONSUMED",
    ),
    cleanupText.includes("removeResumeAttemptMarker(") &&
      cleanupText.includes("scrubExternalTempSecrets(context)") &&
      cleanupText.includes("removeExternalTempRoot(") &&
      cleanupText.includes("context.tempRootRemoved = true") &&
      !cleanupText.includes("deleteAndVerifyPreview(") &&
      !cleanupText.includes("rollbackLiveContext(") &&
      invocationText.includes("maximumReplacementInvocations = 5") &&
      invocationText.includes("replacementInvocation") &&
      resumeText.includes("classifyPreRuntimeReplacementDisposition(") &&
      resumeText.includes("resumeAttemptBinding(") &&
      resumeText.includes("replacementInvocation") &&
      resumeText.includes("cleanupPreRuntimeReplacementAttempt(context)"),
    runtimeText.indexOf("const cookieJar = new Map()") >= 0 &&
      runtimeText.indexOf("const cookieJar = new Map()") <
        runtimeText.indexOf('budgets.take("runtimeSessions")') &&
      runtimeText.indexOf('budgets.take("runtimeSessions")') <
        runtimeText.indexOf("fixtureState.markRuntimeStarted()") &&
      runtimeText.indexOf("fixtureState.markRuntimeStarted()") <
        runtimeText.indexOf("runApplicationRequest({") &&
      resumeText.includes("markRuntimeStarted()") &&
      !resumeText.includes("context.runtimeActivityStarted = true;\n    context.runtimeState"),
  ];
}

function delta09ReboundAuthorizationAssertions(orchestratorSource) {
  if (typeof core.deriveDelta09ReboundTarget !== "function") {
    return Array(10).fill(false);
  }
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const manifestText =
    namedFunctionText(facts.root, "currentCandidateManifestSha256") ?? "";
  const deriveText =
    namedFunctionText(facts.root, "deriveDelta09ReboundAuthorization") ?? "";
  const assertText =
    namedFunctionText(facts.root, "assertDelta09ReboundAuthorization") ?? "";
  const resumeText =
    namedFunctionText(facts.root, "resumeExistingPreviewRuntime") ?? "";
  const runtimeEvidenceText =
    namedFunctionText(facts.root, "runtimeEvidence") ?? "";
  const consumedAuthorizationText =
    namedFunctionText(facts.root, "validateConsumedRuntimeAuthorization") ?? "";
  const consumedAuthorizationCalls = functionCallTexts(
    facts.root,
    "validateConsumedRuntimeAuthorization",
  );
  const resumeCalls = functionCallTexts(
    facts.root,
    "resumeExistingPreviewRuntime",
  );
  const fixture = {
    team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
    project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
    preview_id: "dpl_8DFSeAmw3qx6ETsYx9LWcHz5w9wK",
    git_branch: BRANCH,
    git_commit: "d604b66bf1bf43050395520ce0b63ee0ae6e4140",
    baseline: BASELINE,
    required_five_name_contract: EXPECTED_ENVIRONMENT_NAMES.join(","),
    optional_supabase_url_alias_contract:
      "SUPABASE_URL=OPTIONAL_COMPATIBILITY_ALIAS_NOT_CREATED",
    canonical_orchestrator_sha256: "1".repeat(64),
    reviewed_pre_aggregate_sha256: "2".repeat(64),
    reviewed_stable_surface_sha256: "3".repeat(64),
    manifest_runtime_surface_sha256: "4".repeat(64),
    testing_tree_sha256: "5".repeat(64),
    exact_18_path_manifest_sha256: "6".repeat(64),
  };
  const expected = sha256(
    [
      "AIFINDER_PHASE_34IA_DELTA09_REBOUND_V1",
      fixture.team_id,
      fixture.project_id,
      fixture.preview_id,
      fixture.git_branch,
      fixture.git_commit,
      fixture.baseline,
      fixture.required_five_name_contract,
      fixture.optional_supabase_url_alias_contract,
      fixture.canonical_orchestrator_sha256,
      fixture.reviewed_pre_aggregate_sha256,
      fixture.reviewed_stable_surface_sha256,
      fixture.manifest_runtime_surface_sha256,
      fixture.testing_tree_sha256,
      fixture.exact_18_path_manifest_sha256,
    ].join("|"),
  );
  const resumeAuthorizationIndex = resumeText.indexOf(
    "assertDelta09ReboundAuthorization(",
  );
  return [
    core.deriveDelta09ReboundTarget(fixture) === expected,
    catches(() =>
      core.deriveDelta09ReboundTarget({
        ...fixture,
        required_five_name_contract: "ADMIN_PASSWORD",
      }),
    ),
    manifestText.includes("AUTHORIZED_REPOSITORY_PATHS") &&
      manifestText.includes("PRELIVE_UNTRACKED_CREATE_PATHS") &&
      manifestText.includes("PRELIVE_MODIFIED_PATHS") &&
      manifestText.includes("git_blob") &&
      manifestText.includes("sha256") &&
      manifestText.includes("lf"),
    deriveText.includes("canonicalReviewedBytes(") &&
      deriveText.includes("REVIEWED_PRELIVE_AGGREGATE_SHA256") &&
      deriveText.includes("REVIEWED_STABLE_SURFACE_SHA256") &&
      deriveText.includes("phase_34fa_v1_runtime_execution_surface_digest") &&
      deriveText.includes("testing_tree_digest") &&
      deriveText.includes("currentCandidateManifestSha256("),
    assertText.includes("AIFINDER_PHASE_34IA_RUNTIME_AUTHORIZATION") &&
      assertText.includes("validateDelta09ReboundAuthorization(") &&
      assertText.includes("CONFIRMED_DELTA09_REBOUND_TARGET_SHA256") &&
      !assertText.includes("EXECUTION_AUTHORIZATION"),
    resumeAuthorizationIndex >= 0 &&
      resumeAuthorizationIndex < resumeText.indexOf("acquireResumeExecutionLock(") &&
      resumeText.includes("resumeAttemptBinding(") &&
      resumeText.includes("reboundTargetSha256") &&
      resumeText.includes("deploymentTargetSha256: reboundTargetSha256"),
    orchestratorSource.includes(
      'else if (mode === "--execute") fail("DELTA09_NEW_PREVIEW_FORBIDDEN");',
    ) && !orchestratorSource.includes("else await executeRuntime();"),
    runtimeEvidenceText.includes("confirmation_count: 2") &&
      consumedAuthorizationText.includes("confirmation_count !== 1"),
    typeof core.validateDelta09ReboundAuthorization === "function" &&
      core.validateDelta09ReboundAuthorization({
        authorization:
          "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_REBOUND_TARGET_" +
          CONFIRMED_DELTA09_REBOUND_TARGET_SHA256,
        rebound_target_sha256: CONFIRMED_DELTA09_REBOUND_TARGET_SHA256,
      }) === CONFIRMED_DELTA09_REBOUND_TARGET_SHA256 &&
      catches(() =>
        core.validateDelta09ReboundAuthorization({
          authorization:
            "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_REBOUND_TARGET_" +
            "0".repeat(64),
          rebound_target_sha256: CONFIRMED_DELTA09_REBOUND_TARGET_SHA256,
        }),
      ) &&
      catches(() =>
        core.validateDelta09ReboundAuthorization({
          authorization:
            "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_REBOUND_TARGET_" +
            CONFIRMED_DELTA09_REBOUND_TARGET_SHA256,
          rebound_target_sha256: "invalid",
        }),
      ),
    assertText.includes("CONFIRMED_DELTA09_REBOUND_TARGET_SHA256") &&
      assertText.includes("validateDelta09ReboundAuthorization(") &&
      consumedAuthorizationText.includes("reboundTargetSha256") &&
      consumedAuthorizationText.includes(
        "validateDelta09ReboundAuthorization(",
      ) &&
      !consumedAuthorizationText.includes(
        "SECOND_TARGET_CONFIRMATION_FORBIDDEN",
      ) &&
      consumedAuthorizationCalls.some(
        (call) =>
          call.startsWith("validateDelta09ReboundAuthorization(") &&
          call.includes("rebound_target_sha256: reboundTargetSha256"),
      ) &&
      resumeCalls.some(
        (call) =>
          call.startsWith("validateConsumedRuntimeAuthorization(") &&
          call.includes("repositoryRoot") &&
          call.includes("reboundTargetSha256"),
      ),
  ];
}

function delta04AutomaticAliasAndResumeAssertions(orchestratorSource) {
  if (
    typeof core.classifyDeploymentIdentity !== "function" ||
    typeof core.validateExistingPreviewResumeState !== "function"
  ) {
    return Array(12).fill(false);
  }
  const classify = (fixture) => core.classifyDeploymentIdentity(fixture);
  const emptyAliases = automaticBranchAliasFixture([], null);
  const automaticAlias = automaticBranchAliasFixture(
    ["synthetic-automatic-branch-alias.invalid"],
    "synthetic-automatic-branch-alias.invalid",
  );
  const patternOnlyAliases = [
    "aifinder-git-aifinder-phase-34ia-stag-synthetic.vercel.app",
    "synthetic.vercel.app",
    "aifinder-aifinder-phase-34ia-stag-synthetic.vercel.app",
    automaticAlias.deployment.url,
  ].map((alias) =>
    automaticBranchAliasFixture(
      [alias],
      "different-automatic-branch-alias.invalid",
    ),
  );
  const production = automaticBranchAliasFixture(
    ["synthetic-automatic-branch-alias.invalid"],
    "synthetic-automatic-branch-alias.invalid",
  );
  production.inventory[0].target = "production";
  production.deployment.target = "production";
  const controllingMismatch = automaticBranchAliasFixture(
    ["synthetic-automatic-branch-alias.invalid"],
    "synthetic-automatic-branch-alias.invalid",
  );
  controllingMismatch.deployment.ownerId = "team_mismatch";
  const additionalAlias = automaticBranchAliasFixture(
    [
      "synthetic-automatic-branch-alias.invalid",
      "synthetic-additional-alias.invalid",
    ],
    "synthetic-automatic-branch-alias.invalid",
  );
  const mismatchedAlias = automaticBranchAliasFixture(
    ["synthetic-unreviewed-alias.invalid"],
    "synthetic-automatic-branch-alias.invalid",
  );
  const malformedAlias = automaticBranchAliasFixture([], null);
  malformedAlias.deployment.alias = "synthetic-malformed-alias.invalid";
  const productionWithAlias = structuredClone(production);
  const mismatchWithAlias = structuredClone(controllingMismatch);
  const resume = validExistingPreviewResumeState();
  const resumed = core.validateExistingPreviewResumeState(resume);
  const resumeMutations = [
    { runtime_sessions: 1 },
    { application_requests: 1 },
    { data_requests: 1 },
    { data_writes: 1 },
    { target_confirmation_count: 2 },
    { temporary_remote_branch_states: ["ABSENT", "OURS"] },
    { preview_count: 2 },
    { expected_deployment_id: "dpl_Mismatch" },
  ];
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const resumeText =
    namedFunctionText(facts.root, "resumeExistingPreviewRuntime") ?? "";
  const resolveText =
    namedFunctionText(facts.root, "resolveExactExistingPreview") ?? "";
  const branchText =
    namedFunctionText(facts.root, "verifyResumedTemporaryBranchAbsence") ?? "";
  const removeText =
    namedFunctionText(facts.root, "removeExistingPreviewByDedicatedCli") ?? "";
  const cleanupIdentityText =
    namedFunctionText(facts.root, "validateCleanupResolution") ?? "";
  const resumeLockAcquireText =
    namedFunctionText(facts.root, "acquireResumeExecutionLock") ?? "";
  const resumeLockReleaseText =
    namedFunctionText(facts.root, "releaseResumeExecutionLock") ?? "";
  const resumeSelfTestText =
    namedFunctionText(facts.root, "runExistingPreviewResumeSelfTest") ?? "";
  const attemptMarkerCreateText =
    namedFunctionText(facts.root, "createResumeAttemptMarker") ?? "";
  const attemptMarkerRemoveText =
    namedFunctionText(facts.root, "removeResumeAttemptMarker") ?? "";
  const consumedAuthorizationText =
    namedFunctionText(facts.root, "validateConsumedRuntimeAuthorization") ??
    "";
  const resumeOrchestratorContract =
    orchestratorSource.includes('"--resume-existing-preview"') &&
    namedFunctionNode(facts.root, "runExistingPreviewResumeSelfTest") !== null &&
    resumeText.includes("resolveExactExistingPreview(") &&
    resumeText.includes("verifyResumedTemporaryBranchAbsence(") &&
    resumeText.includes("validateExistingPreviewResumeState(") &&
    resumeText.includes("prepareRuntimeEnvironment(") &&
    resumeText.includes("runRuntimeSession(") &&
    resumeText.includes("deleteAndVerifyPreview(") &&
    !resumeText.includes("createPreviewTrigger(") &&
    !resumeText.includes("resolveUniquePreview(") &&
    !resumeText.includes("consumeRuntimeAuthorization(") &&
    !resumeText.includes("assertExecutionAuthorization(") &&
    resolveText.includes("EXISTING_PREVIEW_DEPLOYMENT_ID") &&
    resolveText.includes("EXISTING_PREVIEW_COMMIT_SHA") &&
    branchText.includes("readExactTemporaryBranchState(") &&
    branchText.includes("PREVIEW_RESUME_BRANCH_ABSENCE_FIRST") &&
    branchText.includes("PREVIEW_RESUME_BRANCH_ABSENCE_SECOND") &&
    removeText.includes('"remove"') &&
    removeText.includes("EXISTING_PREVIEW_DEPLOYMENT_ID") &&
    removeText.includes("DELTA12_RETAINED_PREVIEW_ID") &&
    removeText.includes("context.deploymentId") &&
    !removeText.includes("context.deploymentHostname") &&
    !removeText.includes('"api"') &&
    !removeText.includes('"DELETE"') &&
    cleanupIdentityText.indexOf("requirePreviewSafeAliases(") >
      cleanupIdentityText.indexOf("deploymentGitIdentityFacts(") &&
    resumeLockAcquireText.includes("fsConstants.O_CREAT") &&
    resumeLockAcquireText.includes("fsConstants.O_EXCL") &&
    resumeLockAcquireText.includes("fsConstants.O_NOFOLLOW") &&
    resumeLockAcquireText.includes("fchmodSync(lockDescriptor, 0o600)") &&
    resumeLockReleaseText.includes("unlinkSync(lockPath)") &&
    resumeLockReleaseText.includes("if (lockAbsent) {") &&
    resumeLockReleaseText.includes(
      "descriptorIdentity.nlink !== (lockAbsent ? 0 : 1)",
    ) &&
    resumeLockReleaseText.includes("fsyncExactDirectory(lockRoot)") &&
    resumeLockReleaseText.includes("closeSync(lockDescriptor)") &&
    resumeLockReleaseText.includes("realpathSync(lockPath) !== lockPath") &&
    resumeText.includes("acquireResumeExecutionLock(") &&
    resumeText.includes("releaseResumeExecutionLock(") &&
    resumeText.indexOf("acquireResumeExecutionLock(") <
      resumeText.indexOf("resolveExactExistingPreview(") &&
    resumeSelfTestText.includes(
      "SELF_TEST_RESUME_EXECUTION_LOCK_CONCURRENCY",
    ) &&
    resumeSelfTestText.includes(
      "SELF_TEST_RESUME_ATTEMPT_MARKER_SEQUENTIAL",
    ) &&
    attemptMarkerCreateText.includes("fsConstants.O_CREAT") &&
    attemptMarkerCreateText.includes("fsConstants.O_EXCL") &&
    attemptMarkerCreateText.includes("fsConstants.O_NOFOLLOW") &&
    attemptMarkerCreateText.includes("fchmodSync(markerDescriptor, 0o600)") &&
    attemptMarkerRemoveText.includes("unlinkSync(markerPath)") &&
    attemptMarkerRemoveText.includes("if (pathIsAbsent(markerPath)) {") &&
    attemptMarkerRemoveText.includes("fsyncExactDirectory(markerRoot)") &&
    attemptMarkerRemoveText.includes(
      "canonicalTempRootIdentity(markerRoot)",
    ) &&
    consumedAuthorizationText.includes("assertResumeAttemptMarkerAbsent(") &&
    resumeText.includes("createResumeAttemptMarker(") &&
    resumeText.includes("removeResumeAttemptMarker(") &&
    resumeText.indexOf("createResumeAttemptMarker(") <
      resumeText.indexOf("runRuntimeSession(") &&
    resumeText.indexOf("writeRuntimeEvidenceAfterCleanup(") <
      resumeText.indexOf("removeResumeAttemptMarker(") &&
    resumeText.indexOf("removeResumeAttemptMarker(") <
      resumeText.lastIndexOf("releaseResumeExecutionLock(");
  return [
    classify(emptyAliases) === "EXACT_NONPRODUCTION_PREVIEW_IDENTITY",
    classify(automaticAlias) === "EXACT_NONPRODUCTION_PREVIEW_IDENTITY",
    !catches(() => core.validateDeploymentIdentity(automaticAlias)),
    patternOnlyAliases.every(
      (fixture) =>
        classify(fixture) === "UNREVIEWED_ADDITIONAL_DEPLOYMENT_ALIAS",
    ),
    classify(production) === "PRODUCTION_TARGET_FORBIDDEN",
    classify(controllingMismatch) === "CONTROLLING_IDENTITY_MISMATCH",
    classify(additionalAlias) === "UNREVIEWED_ADDITIONAL_DEPLOYMENT_ALIAS" &&
      classify(mismatchedAlias) === "UNREVIEWED_ADDITIONAL_DEPLOYMENT_ALIAS" &&
      caughtCode(() => core.validateDeploymentIdentity(additionalAlias)) ===
        "UNREVIEWED_ADDITIONAL_DEPLOYMENT_ALIAS",
    classify(malformedAlias) === "MALFORMED_ALIAS_METADATA",
    classify(productionWithAlias) === "PRODUCTION_TARGET_FORBIDDEN",
    classify(mismatchWithAlias) === "CONTROLLING_IDENTITY_MISMATCH",
    resumed?.state === "PREVIEW_BOUND_READY_BRANCH_CLEANED_PRE_RUNTIME" &&
      resumeMutations.every((mutation) =>
        catches(() =>
          core.validateExistingPreviewResumeState({ ...resume, ...mutation }),
        ),
      ),
    resumeOrchestratorContract,
  ];
}

function deploymentInventoryIdVariants() {
  return [
    ["both", (record) => record],
    ["id", (record) => { delete record.uid; }],
    ["uid", (record) => { delete record.id; }],
    ["neither", (record) => { delete record.id; delete record.uid; }],
  ].map(([_name, mutate]) => {
    const fixture = validDeploymentIdentity();
    mutate(fixture.inventory[0]);
    return fixture;
  });
}

function validRuntimeResponse(overrides = {}) {
  return {
    ordinal: 1,
    method: "GET",
    path: "/api/admin/tools",
    status: 401,
    security_header_projection: {
      status_class: "EXPECTED_401",
      application_body_shape: "EXACT_JSON_OBJECT",
      application_response_identity: "ADMIN_TOOLS_UNAUTHENTICATED",
      cache_control_no_store: true,
      x_content_type_options_nosniff: true,
      x_frame_options_deny: true,
      referrer_policy_strict_origin_when_cross_origin: true,
      x_dns_prefetch_control_off: true,
      cross_origin_opener_policy_same_origin: true,
      permissions_camera_disabled: true,
      permissions_microphone_disabled: true,
      permissions_geolocation_disabled: true,
      permissions_payment_disabled: true,
      permissions_usb_disabled: true,
      permissions_magnetometer_disabled: true,
      permissions_gyroscope_disabled: true,
      permissions_accelerometer_disabled: true,
      csp_frame_ancestors_none: true,
      csp_base_uri_self: true,
      csp_form_action_self: true,
      csp_object_src_none: true,
      hsts_present: true,
      hsts_max_age_class: "ONE_TO_TWO_YEARS",
      hsts_include_subdomains: true,
      hsts_preload: true,
      x_robots_tag_noindex_advisory: true,
      disposition: "PASS_EXACT_APPLICATION_HEADER_CONTRACT",
    },
    body_contract: "UNAUTHENTICATED_DENIAL",
    raw_body_persisted: false,
    raw_headers_persisted: false,
    raw_url_persisted: false,
    ...overrides,
  };
}

function validFixtureState() {
  return {
    route_created_tools: 1,
    approved_submission_tools: 1,
    submitted_tool_fixtures: 3,
    audit_actions: [...EXPECTED_AUDIT_ACTIONS],
    logo_objects: 1,
    direct_rpc_executions: 0,
    route_rpc_executions: 1,
    edit_submission_state: "pending",
    reject_submission_state: "rejected",
    approve_submission_state: "approved",
    route_created_tool_archived: true,
  };
}

function validCleanupState() {
  return {
    synthetic_tools_remaining: 0,
    synthetic_submissions_remaining: 0,
    synthetic_audit_rows_remaining: 0,
    synthetic_storage_objects_remaining: 0,
    preview_deployments_remaining: 0,
    temporary_branches_remaining: 0,
    temporary_worktrees_remaining: 0,
    temporary_secret_files_remaining: 0,
  };
}

function baseAssertions(coreSource, orchestratorSource) {
  const plan = core.createRuntimePlan();
  const reviewedCandidate = reviewedCandidateFacts(orchestratorSource);
  const orchestratorFacts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const selfTestText =
    namedFunctionText(orchestratorFacts.root, "runSelfTest") ?? "";
  const implementedRequests = plan.requests.filter(
    ({ contract }) =>
      contract !== "METHOD_GATE_ALLOW_HEADER" &&
      contract !== "DEFERRED_ROUTE_FAIL_CLOSED" &&
      contract !== "EXTENSION_SUFFIX_FAIL_CLOSED",
  );
  const pairs = new Set(
    implementedRequests.map(
      ({ method, path: requestPath }) => `${method} ${requestPath}`,
    ),
  );
  const routes = new Set(
    implementedRequests.map(({ path: requestPath }) => requestPath),
  );
  const statuses = plan.requests.map(({ status }) => status);
  const canonical = core.canonicalJson({ z: 1, a: { d: 2, b: 3 } });
  return [
    exactSet(Object.keys(core), EXPECTED_EXPORTS),
    Object.isFrozen(plan) && Object.isFrozen(plan.requests),
    plan.schema_version === 1 && plan.phase === "34IA-34IZ",
    plan.baseline === BASELINE,
    plan.branch === BRANCH,
    plan.marker_path === MARKER_PATH,
    plan.target_sha256 === TARGET_SHA256,
    plan.project.team_id === "team_9POJYxNnjIBbrQ19My8M5yG3",
    plan.project.team_slug === "ai-finder-s-projects",
    plan.project.project_id === "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
    plan.project.project_name === "aifinder",
    plan.project.repository === "jcdumaua/aifinder",
    plan.requests.length === 20,
    plan.requests.every((request, index) => request.ordinal === index + 1),
    routes.size === 7,
    pairs.size === 13,
    statuses.filter((status) => status === 401).length === 2,
    statuses.filter((status) => status === 403).length === 1,
    statuses.filter((status) => status === 404).length === 2,
    statuses.filter((status) => status === 405).length === 1,
    exactSet(plan.environment_names, EXPECTED_ENVIRONMENT_NAMES),
    exactSet(plan.audit_actions, EXPECTED_AUDIT_ACTIONS),
    plan.marker.bytes === 475 && plan.marker.lf === 10,
    plan.marker.sha256 === MARKER_SHA256 && plan.marker.trailing_lf === true,
    plan.budgets.runtime_sessions === 1,
    plan.budgets.application_requests === 20,
    plan.budgets.runtime_retries === 0,
    plan.budgets.direct_data_success_requests === 14,
    plan.budgets.direct_data_maximum === 26,
    plan.budgets.cleanup_retry_reserve === 2 &&
      plan.budgets.cleanup_storage_list_reserve === 4 &&
      plan.budgets.cleanup_storage_download_reserve === 3,
    plan.budgets.preview_deployments === 1 &&
      plan.budgets.qualification_get_requests === 4,
      plan.budgets.vercel_control_maximum === 353 &&
      plan.budgets.github_reads_maximum === 6 &&
      plan.budgets.git_remote_reads_maximum === 42,
    canonical === '{\n  "a": {\n    "b": 3,\n    "d": 2\n  },\n  "z": 1\n}\n',
    !coreSource.includes("process.env") &&
      orchestratorSource.includes('const MODES = Object.freeze([\n  "--self-test",\n  "--self-test-delta20-publication",\n  "--repair-delta20-qualification-publication",\n  "--repair-delta20-runtime-publication",\n  "--qualify-poststate-preview",\n  "--identify-poststate-oracle-qualified-target",\n  "--execute-poststate-oracle-qualified-preview",\n]);') &&
      orchestratorSource.includes('const GIT_EXECUTABLE = "/usr/bin/git"') &&
      orchestratorSource.includes('"core.hooksPath=/dev/null"') &&
      orchestratorSource.includes(
        "verifyReviewedCandidate(repositoryRoot, status, plan)",
      ) &&
      orchestratorSource.includes("categoricalErrorCode(error)") &&
      orchestratorSource.includes("evidence_sha256=${evidenceSha256}") &&
      orchestratorSource.includes(
        "reviewed_stable_surface_sha256=${REVIEWED_STABLE_SURFACE_SHA256}",
      ) &&
      !orchestratorSource.includes("...process.env") &&
      reviewedCandidate.pathsExact &&
      reviewedCandidate.postTransitionPathsExact &&
      reviewedCandidate.retainedWorktreeModifiedPathsExact &&
      selfTestText.indexOf("verifyStaticManifestSemantics(process.cwd())") >=
        0 &&
      selfTestText.indexOf("verifyStaticManifestSemantics(process.cwd())") <
        selfTestText.indexOf("verifyReviewedCandidate(") &&
      selfTestText.indexOf("verifyReviewedCandidate(") >= 0 &&
      selfTestText.indexOf("verifyReviewedCandidate(") <
        selfTestText.indexOf("runDelta13EnvironmentStdinLifecycleSelfTest()") &&
      reviewedCandidate.pinned !== "0".repeat(64) &&
      reviewedCandidate.stablePinned !== "0".repeat(64) &&
      reviewedCandidate.stableActual === reviewedCandidate.stablePinned &&
      (reviewedCandidate.lifecycle === "PRE_RUNTIME"
        ? reviewedCandidate.actual === reviewedCandidate.pinned
        : [
            "QUALIFICATION_COMPLETE_CLEANUP_PENDING",
            "QUALIFICATION_COMPLETE_CLEANUP_COMPLETE",
            "RUNTIME_EXECUTION_COMPLETE_CLEANUP_PENDING",
            "RUNTIME_COMPLETE",
          ].includes(reviewedCandidate.lifecycle) &&
          reviewedCandidate.actual !== reviewedCandidate.pinned),
  ];
}

function markerRuntimeAssertions(orchestratorSource) {
  const marker = markerFacts(orchestratorSource);
  const root = astFacts(ORCHESTRATOR_PATH, orchestratorSource).root;
  const runtimeEvidenceText =
    namedFunctionText(root, "runtimeEvidence") ?? "";
  const runtimeEvidenceMarkerBinding =
    runtimeEvidenceText.includes("marker_bytes: plan.marker.bytes") &&
    runtimeEvidenceText.includes("marker_lf: plan.marker.lf") &&
    runtimeEvidenceText.includes("marker_sha256: plan.marker.sha256") &&
    !runtimeEvidenceText.includes("marker_lf: 6");
  const actualBytes = Buffer.from(`${MARKER_LINES.join("\n")}\n`, "utf8");
  const conflictingV13Uid = validDeploymentIdentity();
  conflictingV13Uid.deployment.uid = "dpl_ContradictoryV13Uid";
  return [
    marker.exactLines && runtimeEvidenceMarkerBinding,
    marker.exactConstruction,
    marker.exactWrite,
    marker.exactLines &&
      actualBytes.byteLength === 475 &&
      actualBytes.toString("utf8").split("\n").length - 1 === 10,
    marker.exactConstruction && sha256(actualBytes) === MARKER_SHA256,
    mandatoryCallBefore(
      root,
      "executeRuntime",
      "verifyActualMarkerBytes()",
      "createPreviewTrigger(context)",
    ) &&
      mandatoryCallBefore(
        root,
        "writeVerifiedMarker",
        "verifyActualMarkerBytes()",
        "writeFileSync(markerAbsolutePath, MARKER_BYTES, { flag: \"wx\", mode: 0o644 })",
      ) &&
      namedFunctionNode(root, "runSelfTest") !== null,
    namedFunctionNode(root, "identifyRuntimeTarget") !== null &&
      functionCallTexts(root, "identifyRuntimeTarget").some((call) =>
        call.startsWith("process.stdout.write("),
      ),
    namedFunctionNode(root, "executeRuntime") !== null &&
      mandatoryCallBefore(
        root,
        "executeRuntime",
        "assertExecutionAuthorization()",
        "consumeRuntimeAuthorization(repositoryRoot)",
      ),
    !catches(() => core.validatePredecessorRatification(validPredecessor())),
    deploymentInventoryIdVariants().every(
      (fixture) => !catches(() => core.validateDeploymentIdentity(fixture)),
    ) &&
      catches(() => core.validateDeploymentIdentity(conflictingV13Uid)) &&
      catches(() =>
        core.validateDeploymentIdentity(validDeploymentWithoutV13Git()),
      ) &&
      validDeploymentAliasVariants().every(
        (fixture) => !catches(() => core.validateDeploymentIdentity(fixture)),
      ),
    !catches(() => core.validateRuntimeResponse(validRuntimeResponse())),
  ];
}

function cleanupBudgetAssertions(orchestratorSource) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const canonicalOrchestrator = canonicalReviewedBytes(
    ORCHESTRATOR_PATH,
    Buffer.from(orchestratorSource, "utf8"),
  );
  const canonicalOrchestratorMatches =
    sha256(canonicalOrchestrator) ===
    EXPECTED_CANONICAL_ORCHESTRATOR_SHA256;
  canonicalOrchestrator.fill(0);
  const cleanupCalls = functionCallTexts(
    facts.root,
    "cleanupPrecommitWorktree",
  );
  const runChildCalls = functionCallTexts(facts.root, "runChild");
  const previewAbsenceCalls = functionCallTexts(
    facts.root,
    "verifyPreviewAbsent",
  );
  const applicationRequestCalls = functionCallTexts(
    facts.root,
    "runApplicationRequest",
  );
  const applicationRequestText =
    namedFunctionText(facts.root, "runApplicationRequest") ?? "";
  const evidenceWriterCalls = functionCallTexts(
    facts.root,
    "rewriteBoundRegularFile",
  );
  const createPushInitializer = topLevelVariableInitializerText(
    facts.root,
    "createPreviewTrigger",
    "push",
  );
  const deletePushInitializer = topLevelVariableInitializerText(
    facts.root,
    "deleteTemporaryBranch",
    "deletion",
  );
  const createPreviewText = namedFunctionText(
    facts.root,
    "createPreviewTrigger",
  ) ?? "";
  const deleteAndVerifyText = namedFunctionText(
    facts.root,
    "deleteAndVerifyPreview",
  ) ?? "";
  const cleanupResolvedExternalStateText = namedFunctionText(
    facts.root,
    "cleanupResolvedExternalState",
  ) ?? "";
  const deletePreviewText = namedFunctionText(
    facts.root,
    "deletePreview",
  ) ?? "";
  const exactPreviewCleanupStateText = namedFunctionText(
    facts.root,
    "exactPreviewCleanupState",
  ) ?? "";
  const gitCommands = gitCommandFacts(facts.root);
  const expectedEffectCalls = [
    [
      "runGitChild",
      "runChild",
      [
        "GIT_EXECUTABLE",
        '[ "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", "-c", "commit.gpgsign=false", "-c", "tag.gpgsign=false", ...args, ]',
        '{ ...options, family: "git" }',
      ],
    ],
    [
      "runGhChild",
      "runChild",
      ["GH_EXECUTABLE", "args", '{ ...options, family: "gh", }'],
    ],
    [
      "runVercelChild",
      "runChild",
      [
        "NODE_EXECUTABLE",
        "[VERCEL_CLI_PATH, ...args]",
        '{ ...options, family: "vercel", }',
      ],
    ],
    [
      "runDelta20EvidencePublicationChecks",
      "runChild",
      [
        "NODE_EXECUTABLE",
        '[testPath, "--schema-only"]',
        "{ cwd: repositoryRoot, }",
      ],
    ],
    [
      "runDelta20EvidencePublicationChecks",
      "runChild",
      [
        "NODE_EXECUTABLE",
        '[testPath, "--publication-only"]',
        "{ cwd: repositoryRoot, }",
      ],
    ],
    [
      "runDelta20EvidencePublicationChecks",
      "runChild",
      [
        "NODE_EXECUTABLE",
        "[testPath, reviewMode]",
        "{ cwd: repositoryRoot, }",
      ],
    ],
    [
      "runDelta20EvidencePublicationChecks",
      "runChild",
      [
        "NODE_EXECUTABLE",
        "[ path.join(repositoryRoot, repositoryPath), ]",
        "{ cwd: repositoryRoot }",
      ],
    ],
    ["verifyLocalExecutables", "runVercelChild", ['["--version"]']],
    [
      "verifyLocalExecutables",
      "runChild",
      ["CURL_EXECUTABLE", '["--version"]'],
    ],
    ["verifyLocalExecutables", "runGhChild", ['["--version"]']],
    [
      "verifyStaticManifestSemantics",
      "runChild",
      [
        "NODE_EXECUTABLE",
        '["testing/static-test-safety-manifest.test.mjs"]',
        "{ cwd: repositoryRoot }",
      ],
    ],
    [
      "runVercelControl",
      "runVercelChild",
      ["[...args, `--scope=${TEAM_SLUG}`]", "options"],
    ],
    [
      "verifyVercelProject",
      "runVercelControl",
      [
        '["api", `/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}`]',
        "budgets",
        '"vercelProjectQueries"',
        '"VERCEL_PROJECT"',
      ],
    ],
    [
      "collectDeploymentInventory",
      "runVercelControl",
      [
        '["api", deploymentInventoryPath(since, until)]',
        "budgets",
        "null",
        "code",
      ],
    ],
    [
      "collectDelta14RegistrationDeploymentInventory",
      "runVercelControl",
      [
        '[ "api", deploymentInventoryPath(context.inventorySince, until), ]',
        "budgets",
        "null",
        "code",
      ],
    ],
    [
      "bindUnexpectedDelta14RegistrationDeployment",
      "runVercelControl",
      [
        '[ "api", `/v13/deployments/${identity.id}?teamId=${TEAM_ID}&withGitRepoInfo=true`, ]',
        "context.budgets",
        '"vercelRestV13IdentityQueries"',
        '"DELTA14_REGISTRATION_UNEXPECTED_EXACT_ID"',
      ],
    ],
    [
      "resolveUniquePreview",
      "runVercelControl",
      [
        '[ "api", `/v13/deployments/${encodeURIComponent(hostname)}?teamId=${TEAM_ID}&withGitRepoInfo=true`, ]',
        "budgets",
        '"vercelRestV13IdentityQueries"',
        '"VERCEL_REST_V13"',
      ],
    ],
    [
      "githubAdvisoryCorroboration",
      "runGhChild",
      [
        '[ "api", `repos/${REPOSITORY}/commits/${commitSha}/status`, "-H", "X-GitHub-Api-Version: 2022-11-28", ]',
      ],
    ],
    [
      "githubAdvisoryCorroboration",
      "runGhChild",
      [
        '[ "api", `repos/${REPOSITORY}/deployments?sha=${commitSha}&ref=${encodeURIComponent(plan.branch)}&environment=Preview&per_page=100`, "-H", "X-GitHub-Api-Version: 2022-11-28", ]',
      ],
    ],
    [
      "resolveExactExistingPreview",
      "runVercelControl",
      [
        '[ "api", `/v13/deployments/${EXISTING_PREVIEW_DEPLOYMENT_ID}?teamId=${TEAM_ID}&withGitRepoInfo=true`, ]',
        "budgets",
        '"vercelRestV13IdentityQueries"',
        '"EXISTING_PREVIEW_EXACT_ID"',
      ],
    ],
    [
      "resolveExactHeaderQualifiedPreview",
      "runVercelControl",
      [
        '[ "api", `/v13/deployments/${state.deployment_id}?teamId=${TEAM_ID}&withGitRepoInfo=true`, ]',
        "budgets",
        '"vercelRestV13IdentityQueries"',
        '"DELTA11_PREVIEW_EXACT_ID"',
      ],
    ],
    [
      "readEnvironmentMetadata",
      "runVercelControl",
      [
        '["api", pathname]',
        "budgets",
        '"environmentMetadataRequests"',
        "code",
      ],
    ],
    [
      "captureDelta13EnvironmentSnapshot",
      "runVercelControl",
      [
        '["api", pathname]',
        "budgets",
        '"delta13EnvironmentMetadataRequests"',
        '`${code}_${name}`',
      ],
    ],
    [
      "createDelta13EnvironmentRecord",
      "runVercelControl",
      [
        '[ "api", `/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`, "-X", "POST", "--input", "-", ]',
        "budgets",
        '"environmentRecordCreateRequests"',
        '`DELTA13_ENVIRONMENT_CREATE_${name}_${attempt}`',
        '{ allowBoundedVercelApiInput: true, input: requestBytes, }',
      ],
    ],
    [
      "deleteDelta13EnvironmentRecord",
      "runVercelControl",
      [
        '[ "api", `/v10/projects/${PROJECT_ID}/env/${encodeURIComponent(id)}?teamId=${TEAM_ID}`, "-X", "DELETE", "--dangerously-skip-permissions", ]',
        "budgets",
        '"environmentRecordDeleteRequests"',
        '`DELTA13_ENVIRONMENT_DELETE_${name}_${attempt}`',
      ],
    ],
    [
      "captureProjectBypassMetadata",
      "runVercelChild",
      [
        '[ "api", `/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}&decrypt=false`, "--raw", `--scope=${TEAM_SLUG}`, ]',
      ],
    ],
    [
      "runProtectionBypassMutation",
      "runVercelChild",
      [
        '[ "api", `/v1/projects/${PROJECT_ID}/protection-bypass?teamId=${TEAM_ID}`, "-X", "PATCH", "--input", "-", "--raw", `--scope=${TEAM_SLUG}`, ]',
        '{ allowBoundedVercelApiInput: true, input: requestBytes, }',
      ],
    ],
    [
      "generateProjectOidcCredential",
      "runVercelChild",
      [
        '[ "project", "token", PROJECT_ID, "--json", `--scope=${TEAM_SLUG}`, ]',
      ],
    ],
    [
      "runExactProtectedPreviewRequest",
      "httpsRequest",
      [
        '{ hostname, method, path: requestPath, port: 443, protocol: "https:", headers: requestHeaders, servername: hostname, }',
        "<response-handler>",
      ],
    ],
    [
      "inspectSanitizedLogs",
      "runVercelControl",
      [
        '["inspect", deploymentId, "--logs"]',
        "budgets",
        '"vercelBuildLogQueries"',
        '"VERCEL_BUILD_LOGS"',
      ],
    ],
    [
      "inspectSanitizedLogs",
      "runVercelControl",
      [
        '["logs", deploymentId, "--json", "--since=1h", "--limit=100"]',
        "budgets",
        '"vercelRuntimeLogQueries"',
        '"VERCEL_RUNTIME_LOGS"',
      ],
    ],
    [
      "exactPreviewCleanupState",
      "runVercelControl",
      [
        '[ "api", `/v13/deployments/${deploymentId}?teamId=${TEAM_ID}&withGitRepoInfo=true`, ]',
        "budgets",
        '"vercelCleanupIdentityQueries"',
        "code",
      ],
    ],
    [
      "removeExistingPreviewByDedicatedCli",
      "runVercelControl",
      [
        '["remove", context.deploymentId, "--yes"]',
        "context.budgets",
        '"vercelDirectDeleteAttempts"',
        '"VERCEL_PREVIEW_REMOVE"',
      ],
    ],
    [
      "deletePreview",
      "runVercelControl",
      [
        "buildVercelDeploymentDeleteArgs({ deployment_id: deploymentId, team_id: TEAM_ID, })",
        "budgets",
        '"vercelDirectDeleteAttempts"',
        '`VERCEL_PREVIEW_DELETE_${attempt}`',
      ],
    ],
    [
      "resolveCleanupCandidate",
      "runVercelControl",
      [
        '[ "api", `/v13/deployments/${encodeURIComponent(hostname)}?teamId=${TEAM_ID}&withGitRepoInfo=true`, ]',
        "context.budgets",
        '"vercelCleanupIdentityQueries"',
        '"CLEANUP_IDENTITY_V13"',
      ],
    ],
  ];
  const expectedGitCommandVectors = [
    ["-C", "worktreePath", "status", "--porcelain=v2", "--untracked-files=all"],
    ["worktree", "list", "--porcelain"],
    ["-C", "worktreePath", "restore", "--staged", "--", "plan.marker_path"],
    ["worktree", "remove", "worktreePath"],
    ["worktree", "prune", "--dry-run", "--verbose", "--expire", "now"],
    ["worktree", "prune", "--verbose", "--expire", "now"],
    ["status", "--porcelain", "--untracked-files=all"],
    ["status", "--porcelain", "--untracked-files=all"],
    ["rev-parse", "--verify", "`${plan.baseline}:${repositoryPath}`"],
    ["rev-parse", "--verify", "`${plan.baseline}:${repositoryPath}`"],
    ["remote", "get-url", "origin"],
    ["remote", "get-url", "--push", "--all", "origin"],
    ["branch", "--show-current"],
    ["rev-parse", "HEAD"],
    ["rev-parse", "HEAD^"],
    ["show", "-s", "--format=%T", "HEAD"],
    ["show", "-s", "--format=%s", "HEAD"],
    ["rev-list", "--left-right", "--count", "HEAD...origin/main"],
    ["config", "user.name"],
    ["config", "user.email"],
    ["diff", "--cached", "--name-only"],
    ["status", "--porcelain", "--untracked-files=all"],
    ["diff", "--name-only", "--", "testing/phase-compiler"],
    ["ls-remote", "--heads", "pushUrl", "`refs/heads/${plan.branch}`"],
    ["worktree", "add", "--quiet", "--detach", "worktreePath", "plan.baseline"],
    ["-C", "worktreePath", "add", "--", "plan.marker_path"],
    ["-C", "worktreePath", "commit", "-m", "TEMPORARY_COMMIT_SUBJECT"],
    ["-C", "worktreePath", "rev-parse", "HEAD"],
    ["-C", "worktreePath", "rev-parse", "HEAD"],
    ["-C", "worktreePath", "rev-parse", "HEAD^"],
    ["-C", "worktreePath", "show", "-s", "--format=%s", "HEAD"],
    ["-C", "worktreePath", "show", "-s", "--format=%an <%ae>", "HEAD"],
    [
      "-C",
      "worktreePath",
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      "HEAD",
    ],
    [
      "push",
      "...EXACT_PUSH_SCOPE_OPTIONS",
      "`--force-with-lease=${branchRef}:`",
      "pushUrl",
      "`${commitSha}:${branchRef}`",
    ],
    ["read-tree", "priorCommitSha"],
    ["add", "--", "...modifiedPaths"],
    ["write-tree"],
    [
      "commit-tree",
      "treeSha",
      "-p",
      "priorCommitSha",
      "-m",
      "CONDITIONAL_REPAIR_COMMIT_SUBJECT",
    ],
    [
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      "repairCommitSha",
    ],
    ["rev-parse", "`${repairCommitSha}^`"],
    ["show", "-s", "--format=%s", "repairCommitSha"],
    ["show", "-s", "--format=%an <%ae>", "repairCommitSha"],
    [
      "push",
      "...EXACT_PUSH_SCOPE_OPTIONS",
      "`--force-with-lease=${branchRef}:${priorCommitSha}`",
      "pushUrl",
      "`${repairCommitSha}:${branchRef}`",
    ],
    ["diff-index", "--cached", "--quiet", "plan.baseline", "--"],
    ["diff", "--cached", "--name-only"],
    ["hash-object", "-w", "--stdin"],
    ["cat-file", "-e", "`${commitSha}:${repositoryPath}`"],
    ["read-tree", "plan.baseline"],
    [
      "update-index",
      "--add",
      "--cacheinfo",
      "100644",
      "vercelBlob",
      "vercel.json",
    ],
    ["write-tree"],
    [
      "commit-tree",
      "treeSha",
      "-p",
      "plan.baseline",
      "-m",
      "DELTA14_REGISTRATION_COMMIT_SUBJECT",
    ],
    ["diff-tree", "--no-commit-id", "--name-only", "-r", "commitSha"],
    ["cat-file", "blob", "`${commitSha}:vercel.json`"],
    ["rev-parse", "`${commitSha}^`"],
    ["show", "-s", "--format=%s", "commitSha"],
    ["ls-tree", "commitSha", "--", "vercel.json"],
    ["read-tree", "registrationCommitSha"],
    ["update-index", "--force-remove", "vercel.json"],
    [
      "update-index",
      "--add",
      "--cacheinfo",
      "100644",
      "markerBlob",
      "plan.marker_path",
    ],
    ["hash-object", "-w", "--", "entry.path"],
    [
      "update-index",
      "--add",
      "--cacheinfo",
      "100644",
      "blobSha",
      "entry.path",
    ],
    ["write-tree"],
    [
      "commit-tree",
      "treeSha",
      "-p",
      "registrationCommitSha",
      "-m",
      "TEMPORARY_COMMIT_SUBJECT",
    ],
    ["rev-parse", "`${activationCommitSha}:${entry.path}`"],
    ["diff", "--name-only", "plan.baseline", "activationCommitSha"],
    ["rev-parse", "`${activationCommitSha}^`"],
    ["show", "-s", "--format=%s", "activationCommitSha"],
    ["rev-parse", "--verify", "`${activationCommitSha}^`"],
    ["rev-parse", "--verify", "`${registrationCommitSha}^`"],
    [
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      "registrationCommitSha",
    ],
    ["cat-file", "blob", "`${registrationCommitSha}:vercel.json`"],
    ["show", "-s", "--format=%s", "registrationCommitSha"],
    ["cat-file", "blob", "`${activationCommitSha}:${plan.marker_path}`"],
    ["show", "-s", "--format=%s", "activationCommitSha"],
    ["rev-parse", "`${activationCommitSha}:${entry.path}`"],
    ["diff", "--name-only", "plan.baseline", "activationCommitSha"],
    [
      "push",
      "...EXACT_PUSH_SCOPE_OPTIONS",
      "`--force-with-lease=${branchRef}:`",
      "pushUrl",
      "`${registrationCommitSha}:${branchRef}`",
    ],
    [
      "merge-base",
      "--is-ancestor",
      "registrationCommitSha",
      "activationCommitSha",
    ],
    [
      "push",
      "...EXACT_PUSH_SCOPE_OPTIONS",
      "`--force-with-lease=${branchRef}:${registrationCommitSha}`",
      "context.pushUrl",
      "`${activationCommitSha}:${branchRef}`",
    ],
    [
      "push",
      "...EXACT_PUSH_SCOPE_OPTIONS",
      "`--force-with-lease=${branchRef}:${commitSha}`",
      "pushUrl",
      "`:${branchRef}`",
    ],
    ["worktree", "remove", "worktreePath"],
    ["status", "--porcelain", "--untracked-files=all"],
  ];
  const expectedPushVectors = [
    [
      "push",
      "...EXACT_PUSH_SCOPE_OPTIONS",
      "`--force-with-lease=${branchRef}:`",
      "pushUrl",
      "`${commitSha}:${branchRef}`",
    ],
    [
      "push",
      "...EXACT_PUSH_SCOPE_OPTIONS",
      "`--force-with-lease=${branchRef}:${priorCommitSha}`",
      "pushUrl",
      "`${repairCommitSha}:${branchRef}`",
    ],
    [
      "push",
      "...EXACT_PUSH_SCOPE_OPTIONS",
      "`--force-with-lease=${branchRef}:`",
      "pushUrl",
      "`${registrationCommitSha}:${branchRef}`",
    ],
    [
      "push",
      "...EXACT_PUSH_SCOPE_OPTIONS",
      "`--force-with-lease=${branchRef}:${registrationCommitSha}`",
      "context.pushUrl",
      "`${activationCommitSha}:${branchRef}`",
    ],
    [
      "push",
      "...EXACT_PUSH_SCOPE_OPTIONS",
      "`--force-with-lease=${branchRef}:${commitSha}`",
      "pushUrl",
      "`:${branchRef}`",
    ],
  ];
  return [
    !catches(() =>
      core.validateRuntimeEnvironmentMetadata(
        validDelta09MetadataReadiness(),
      ),
    ) &&
      !catches(() =>
        core.validateProtectedLocalRuntimeEnvironment(
          validDelta09LocalReadiness(),
        ),
      ),
    !catches(() => core.validateFixtureState(validFixtureState())),
    !catches(() => core.validateCleanupState(validCleanupState())),
    canonicalOrchestratorMatches && exactSet(facts.imports, EXPECTED_IMPORTS),
    namedFunctionNode(facts.root, "cleanupPrecommitWorktree") !== null,
    cleanupCalls.some(
      (call) =>
        call.startsWith("runGitChild(") &&
        call.includes('"restore", "--staged", "--", plan.marker_path'),
    ) && cleanupCalls.includes("unlinkSync(markerAbsolutePath)"),
    cleanupCalls.some(
      (call) =>
        call.startsWith("runGitChild(") &&
        call.includes('"worktree", "remove", worktreePath'),
    ),
    cleanupCalls.filter(
      (call) =>
        call.startsWith("runGitChild(") &&
        call.includes('"worktree", "prune"'),
    ).length === 2 &&
      cleanupCalls.includes("registeredWorktreeRecords(repositoryRoot)") &&
      cleanupCalls.includes(
        "deriveWorktreeCleanupTransition({\n      markerState: \"ABSENT\",\n      worktreePresent: false,\n      registered: exactRecords.length === 1,\n      exactStaleRecords: exactRecords.length,\n      otherStaleRecords: prunableRecords.length - exactRecords.length,\n      tempRemovalBeforeDeregister: false,\n    })",
      ),
    runChildCalls.some(
      (call) =>
        call.startsWith("spawnSync(") &&
        call.includes("timeout: options.timeout ?? CHILD_TIMEOUT_MS") &&
        call.includes('stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"]') &&
        call.includes("input"),
    ) &&
      facts.calls.filter((call) => call.startsWith("spawnSync(")).length === 1 &&
      facts.declarations.has("ALLOWED_CHILD_EXECUTABLES"),
    namedFunctionNode(facts.root, "sanitizeChildResult") !== null &&
      mandatoryCallBefore(
        facts.root,
        "executeRuntime",
        "verifyStaticManifestSemantics(repositoryRoot)",
        "consumeRuntimeAuthorization(repositoryRoot)",
      ) &&
      functionCallOrder(
        facts.root,
        "executeRuntime",
        "consumeRuntimeAuthorization(repositoryRoot)",
        "verifyInitialTemporaryBranchAbsence({\n      repositoryRoot,\n      pushUrl,\n      plan,\n      budgets,\n    })",
      ) &&
      functionCallTexts(facts.root, "consumeRuntimeAuthorization").some(
        (call) =>
          call.startsWith("openSync(") &&
          call.includes("fsConstants.O_CREAT") &&
          call.includes("fsConstants.O_EXCL") &&
          call.includes("fsConstants.O_NOFOLLOW"),
      ) &&
      createPreviewText.indexOf("context.remoteBranchCreated = true") >= 0 &&
      createPreviewText.indexOf("context.remoteBranchCreated = true") <
        createPreviewText.indexOf("push = runGitChild(") &&
      !functionCallTexts(facts.root, "createPreviewTrigger").some((call) =>
        call.startsWith("remoteBranchOutput("),
      ) &&
      uncertainCreateContract(orchestratorSource) &&
      uncertainDeleteContract(orchestratorSource) &&
      gitCommands.valid &&
      gitCommands.forwardingCalls === 1 &&
      gitCommands.gitExecutableCalls === 1 &&
      exactJsonMultiset(gitCommands.effectCalls, expectedEffectCalls) &&
      exactJsonMultiset(
        gitCommands.commandVectors,
        expectedGitCommandVectors,
      ) &&
      gitCommands.pushVectors.length === 5 &&
      JSON.stringify(gitCommands.pushVectors) ===
        JSON.stringify(expectedPushVectors) &&
      deleteAndVerifyText.includes(
        "dependencies.verifyPreviewAbsent ?? verifyPreviewAbsent",
      ) &&
      deleteAndVerifyText.indexOf(
        "await verifyOperation(context, authorityNames);",
      ) >= 0 &&
      deleteAndVerifyText.indexOf("context.previewDeletionFailureCode = null;") >
        deleteAndVerifyText.indexOf(
          "await verifyOperation(context, authorityNames);",
        ) &&
      deleteAndVerifyText.indexOf("deletion.failureCode = null;") >
        deleteAndVerifyText.indexOf(
          "await verifyOperation(context, authorityNames);",
        ) &&
      facts.calls.filter((call) => call.startsWith("fetch(")).length === 1 &&
      facts.calls
        .filter((call) => call.startsWith("fetch("))[0]
        .includes("signal: AbortSignal.any(signals)") &&
      facts.calls.filter((call) =>
        call.startsWith("AbortSignal.timeout("),
      ).length === 1 &&
      !facts.calls.some((call) => call.startsWith("AbortSignal.abort(")) &&
      namedFunctionNode(facts.root, "waitForOwnerConfirmation") === null &&
      !orchestratorSource.includes("OWNER_PREVIEW_DELETE_REQUIRED") &&
      deletePreviewText.includes(
        "attempt <= PREVIEW_DELETE_ATTEMPTS_PER_IDENTITY_MAXIMUM",
      ) &&
      deletePreviewText.includes("exactPreviewCleanupState(") &&
      deletePreviewText.indexOf("VERCEL_PREVIEW_DELETE_PRESTATE_") <
        deletePreviewText.indexOf("runVercelControl(") &&
      deletePreviewText.indexOf("runVercelControl(") <
        deletePreviewText.indexOf("VERCEL_PREVIEW_DELETE_POSTSTATE_") &&
      deletePreviewText.includes("deriveDeletePostStateOutcome(") &&
      exactPreviewCleanupStateText.includes("validateCleanupResolution(") &&
      exactPreviewCleanupStateText.includes(
        '"vercelCleanupIdentityQueries"',
      ) &&
      cleanupResolvedExternalStateText.includes(
        "await verifyPreviewAbsent(context);",
      ) &&
      previewAbsenceCalls.some((call) =>
        call.startsWith("inventoryGitMatches("),
      ) &&
      applicationRequestCalls.some((call) =>
        call.startsWith("withProtectedAccessCredential("),
      ) &&
      applicationRequestCalls.some((call) =>
        call.startsWith("runExactProtectedPreviewRequest("),
      ) &&
      !applicationRequestCalls.some((call) =>
        call.startsWith("runVercelChild("),
      ) &&
      applicationRequestText.includes('name: "x-csrf-token"') &&
      applicationRequestText.includes("value: csrfToken") &&
      !applicationRequestText.includes("csrfHeaderPath"),
    orchestratorSource.includes("class GlobalBudgets") &&
      orchestratorSource.includes("DIRECT_DATA_MAXIMUM"),
    orchestratorSource.includes("direct_data_success_requests: 14") &&
      orchestratorSource.includes("direct_data_maximum: 26"),
    orchestratorSource.includes("mode: 0o600") &&
      orchestratorSource.includes("deployment-state.json") &&
      orchestratorSource.includes("DEPLOYMENT_STATE_READBACK"),
    orchestratorSource.includes("REST_V13_DELETE_BY_ID") &&
      orchestratorSource.includes('state !== "DELETED"') &&
      orchestratorSource.includes("CLEANUP_DEPLOYMENT_STATES") &&
      orchestratorSource.includes("VERCEL_INVENTORY_PAGE_LIMIT") &&
      orchestratorSource.includes("VERCEL_INVENTORY_CURSOR_REPEATED") &&
      orchestratorSource.includes("VERCEL_INVENTORY_DUPLICATE_CONFLICT") &&
      orchestratorSource.includes("VERCEL_INVENTORY_AUTHORITY") &&
      orchestratorSource.includes("_TRAVERSAL_AUTHORITY") &&
      orchestratorSource.includes("_PAGE_AUTHORITY") &&
      orchestratorSource.includes("_CONTROL_AUTHORITY") &&
      orchestratorSource.includes("SELF_TEST_INVENTORY_AUTHORITY_RESERVES") &&
      everyBoundCatchRecordsFailure(
        facts.root,
        "emergencyDataCleanup",
      ) &&
      everyBoundCatchRecordsFailure(
        facts.root,
        "cleanupResolvedExternalState",
      ) &&
      everyBoundCatchRecordsFailure(facts.root, "rollbackLiveContext") &&
      orchestratorSource.includes("SELF_TEST_CLEANUP_BUILDING_IDENTITY"),
    functionHasCall(
      facts.root,
      "writeRuntimeEvidenceAfterCleanup",
      "validateCleanupState(cleanup)",
    ) &&
      evidenceWriterCalls.includes("ftruncateSync(descriptor, 0)") &&
      evidenceWriterCalls.some((call) => call.startsWith("readSync(")) &&
      evidenceWriterCalls.some(
        (call) =>
          call.startsWith("openSync(") &&
          call.includes("fsConstants.O_NOFOLLOW"),
      ),
  ];
}

function mutationResults(orchestratorSource) {
  const markerMutations = [
    orchestratorSource.replace("public_launch=NO_GO", "public_launch=GO"),
    orchestratorSource.replace(
      "qualification_requests=6",
      "qualification_requests=5",
    ),
    orchestratorSource.replace('MARKER_LINES.join("\\n")', 'MARKER_LINES.join("\\r\\n")'),
    orchestratorSource.replace('}\\n`, "utf8")', '}`, "utf8")'),
    orchestratorSource.replace('}\\n`, "utf8")', '}\\n\\n`, "utf8")'),
    orchestratorSource.replace(
      "const MARKER_LINES = Object.freeze([",
      "const MARKER_LINES = Object.freeze([\n  \"EXTRA\",",
    ),
    orchestratorSource.replace("writeFileSync(markerAbsolutePath, MARKER_BYTES", "writeFileSync(markerAbsolutePath, Buffer.from(MARKER_LINES.join(\"\\n\"))"),
    orchestratorSource.replace("writeFileSync(markerAbsolutePath", "writeFileSync(duplicateMarkerPath"),
  ];
  const results = markerMutations.map((candidate) => {
    const facts = markerFacts(candidate);
    return !(facts.exactLines && facts.exactConstruction && facts.exactWrite);
  });
  const runtimeEvidenceMarkerMutation = orchestratorSource.replace(
    "marker_lf: plan.marker.lf",
    "marker_lf: 6",
  );
  const runtimeEvidenceMutationText =
    namedFunctionText(
      astFacts(ORCHESTRATOR_PATH, runtimeEvidenceMarkerMutation).root,
      "runtimeEvidence",
    ) ?? "";
  results[0] =
    results[0] &&
    runtimeEvidenceMutationText.includes("marker_lf: 6") &&
    !runtimeEvidenceMutationText.includes("marker_lf: plan.marker.lf");
  const predecessor = validPredecessor();
  for (const key of Object.keys(predecessor).slice(0, 1)) {
    const fixture = structuredClone(predecessor);
    fixture[key] = typeof fixture[key] === "boolean" ? !fixture[key] : "FAIL";
    results.push(catches(() => core.validatePredecessorRatification(fixture)));
  }
  const deploymentMutations = [
    (fixture) => fixture.inventory.push(structuredClone(fixture.inventory[0])),
    (fixture) => { fixture.inventory[0].url = "other.vercel.app"; },
    (fixture) => { delete fixture.deployment.id; },
    (fixture) => { fixture.deployment.target = "production"; },
    (fixture) => { fixture.inventory[0].production = true; },
    (fixture) => { delete fixture.inventory[0].target; },
    (fixture) => { fixture.deployment.projectId = "prj_wrong"; fixture.deployment.name = "aifinder"; },
    (fixture) => { fixture.deployment.ownerId = "team_wrong"; },
    (fixture) => { fixture.deployment.gitSource.sha = "0".repeat(40); },
    (fixture) => { fixture.inventory[0].meta.githubCommitRef = "main"; },
    (fixture) => { fixture.github_deployment_advisory.available = false; },
    (fixture) => { fixture.deployment.alias = ["custom.example.com"]; },
    (fixture) => { fixture.github_deployment_advisory.records_observed = "1"; },
    (fixture) => { delete fixture.deployment.project; },
  ];
  for (const mutate of deploymentMutations) {
    const fixture = validDeploymentIdentity();
    mutate(fixture);
    results.push(catches(() => core.validateDeploymentIdentity(fixture)));
  }
  const runtimeMutations = [
    { status: 200 },
    { method: "POST" },
    { path: "/api/admin/session" },
    {
      security_header_projection: {
        ...validRuntimeResponse().security_header_projection,
        cache_control_no_store: false,
      },
    },
    { headers: { "cache-control": "no-store" } },
    { raw_body_persisted: true },
  ];
  for (const mutation of runtimeMutations) {
    results.push(catches(() => core.validateRuntimeResponse(validRuntimeResponse(mutation))));
  }
  const metadata = validDelta09MetadataReadiness();
  const metadataMutations = [
    { raw_values_persisted: 1 },
    { decrypt_true_requests: 1 },
    { names: metadata.names.slice(1) },
    {
      observations: metadata.observations.filter(
        (observation) => observation.name !== "ADMIN_PASSWORD",
      ),
    },
  ];
  for (const mutation of metadataMutations) {
    results.push(
      catches(() =>
        core.validateRuntimeEnvironmentMetadata({
          ...metadata,
          ...mutation,
        }),
      ),
    );
  }
  const fixtureMutations = [
    { route_created_tools: 2 },
    { direct_rpc_executions: 1 },
  ];
  for (const mutation of fixtureMutations) {
    results.push(catches(() => core.validateFixtureState({ ...validFixtureState(), ...mutation })));
  }
  const sourceMutations = [
    orchestratorSource.replace(
      "async function executeRuntime() {\n  verifyActualMarkerBytes();",
      "async function executeRuntime() {\n  if (false) verifyActualMarkerBytes();",
    ),
    orchestratorSource.replace(
      "  consumeRuntimeAuthorization(repositoryRoot);",
      "  // authorization consumption removed",
    ),
    orchestratorSource.replace(
      "fsConstants.O_RDWR | fsConstants.O_NOFOLLOW",
      "fsConstants.O_RDWR",
    ),
    orchestratorSource.replace(
      '    push = runGitChild(\n      [\n        "push",\n        ...EXACT_PUSH_SCOPE_OPTIONS,',
      '    const hiddenPushArgs = ["-c", "alias.hidden=push", "hidden", "--porcelain", "--atomic", "origin", `${commitSha}:${branchRef}`, ":refs/heads/unrelated"];\n    runGitChild(hiddenPushArgs);\n    runGhChild(["api", `repos/${REPOSITORY}/git/refs`, "--method", "POST"]);\n    const hiddenSpawn = spawnSync;\n    hiddenSpawn(GH_EXECUTABLE, ["api", `repos/${REPOSITORY}/git/refs`, "--method", "POST"]);\n    const hiddenFetch = fetch;\n    hiddenFetch(`https://api.vercel.com/v13/deployments/${commitSha}`, { method: "DELETE" });\n    push = runGitChild(\n      [\n        "push",\n        ...EXACT_PUSH_SCOPE_OPTIONS,',
    ),
    orchestratorSource.replace(
      "AbortSignal.timeout(Math.min(DIRECT_REQUEST_TIMEOUT_MS, remaining))",
      "false ? AbortSignal.timeout(Math.min(DIRECT_REQUEST_TIMEOUT_MS, remaining)) : AbortSignal.abort()",
    ),
    orchestratorSource.replace(
      "    } catch (caught) {\n      rememberCleanupFailure(failures, caught);\n    }",
      "    } catch (caught) {\n      if (false) rememberCleanupFailure(failures, caught);\n      throw caught;\n    }",
    ),
  ];
  for (const candidate of sourceMutations) {
    const candidateResults = [
      ...markerRuntimeAssertions(candidate),
      ...cleanupBudgetAssertions(candidate),
    ];
    results.push(candidateResults.some((result) => result === false));
  }
  return results;
}

const DELTA11_HEADER_CLASSIFICATION_KEYS = Object.freeze([
  "status_class",
  "application_body_shape",
  "application_response_identity",
  "cache_control_no_store",
  "x_content_type_options_nosniff",
  "x_frame_options_deny",
  "referrer_policy_strict_origin_when_cross_origin",
  "x_dns_prefetch_control_off",
  "cross_origin_opener_policy_same_origin",
  "permissions_camera_disabled",
  "permissions_microphone_disabled",
  "permissions_geolocation_disabled",
  "permissions_payment_disabled",
  "permissions_usb_disabled",
  "permissions_magnetometer_disabled",
  "permissions_gyroscope_disabled",
  "permissions_accelerometer_disabled",
  "csp_frame_ancestors_none",
  "csp_base_uri_self",
  "csp_form_action_self",
  "csp_object_src_none",
  "hsts_present",
  "hsts_max_age_class",
  "hsts_include_subdomains",
  "hsts_preload",
  "x_robots_tag_noindex_advisory",
  "disposition",
]);

const DELTA11_VALID_HEADER_FIELDS = Object.freeze([
  ["CaChE-CoNtRoL", "private, max-age=0"],
  ["cache-control", "no-cache, no-store, must-revalidate"],
  ["X-Content-Type-Options", "nosniff"],
  ["x-frame-options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["X-DNS-Prefetch-Control", "off"],
  ["Cross-Origin-Opener-Policy", "same-origin"],
  [
    "Permissions-Policy",
    "usb=(), camera = ( ), accelerometer=(), microphone=(), payment=(), geolocation=(), gyroscope=(), magnetometer=(), fullscreen=(self)",
  ],
  [
    "Content-Security-Policy",
    "default-src 'self'; object-src 'none'; form-action 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'",
  ],
  [
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  ],
  ["X-Robots-Tag", "noindex, nofollow"],
]);

function delta11HeaderCase({
  fields = DELTA11_VALID_HEADER_FIELDS,
  status = 401,
  body = '{"error":"Unauthorized"}',
} = {}) {
  const bodyBytes = Buffer.from(body, "utf8");
  const headerFields = fields.map(([name, value]) =>
    Object.freeze({ name, value: Buffer.from(value, "utf8") }),
  );
  const rawSentinels = fields
    .map(([, value]) => value)
    .filter((value) => /[,;=]/u.test(value));
  const result = core.classifySecurityHeaderProjection({
    status,
    application_body_bytes: bodyBytes,
    header_fields: headerFields,
  });
  return {
    erased:
      bodyBytes.every((byte) => byte === 0) &&
      headerFields.every((field) => field.value.every((byte) => byte === 0)),
    rawAbsent: rawSentinels.every(
      (sentinel) => !JSON.stringify(result).includes(sentinel),
    ),
    result,
  };
}

function delta11HeaderProjectionAssertions() {
  if (typeof core.classifySecurityHeaderProjection !== "function") {
    return Array(18).fill(false);
  }
  try {
    const valid = delta11HeaderCase();
    const vercelHsts = delta11HeaderCase({
      fields: DELTA11_VALID_HEADER_FIELDS.map(([name, value]) =>
        name.toLowerCase() === "strict-transport-security"
          ? [name, "max-age=63072000; preload; includeSubDomains"]
          : [name, value],
      ),
    });
    const missingRoute = delta11HeaderCase({
      fields: DELTA11_VALID_HEADER_FIELDS.filter(
        ([name]) => name.toLowerCase() !== "cache-control",
      ),
    });
    const contradictoryCache = delta11HeaderCase({
      fields: DELTA11_VALID_HEADER_FIELDS.map(([name, value]) =>
        name.toLowerCase() === "cache-control"
          ? [name, "public, max-age=3600, no-store"]
          : [name, value],
      ).slice(1),
    });
    const duplicateSingleton = delta11HeaderCase({
      fields: [
        ...DELTA11_VALID_HEADER_FIELDS,
        ["X-Frame-Options", "DENY"],
      ],
    });
    const malformedPermissions = delta11HeaderCase({
      fields: DELTA11_VALID_HEADER_FIELDS.map(([name, value]) =>
        name.toLowerCase() === "permissions-policy"
          ? [name, "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"]
          : [name, value],
      ),
    });
    const contradictoryCsp = delta11HeaderCase({
      fields: DELTA11_VALID_HEADER_FIELDS.map(([name, value]) =>
        name.toLowerCase() === "content-security-policy"
          ? [name, "frame-ancestors 'none' https://example.invalid; base-uri 'self'; form-action 'self'; object-src 'none'"]
          : [name, value],
      ),
    });
    const missingHsts = delta11HeaderCase({
      fields: DELTA11_VALID_HEADER_FIELDS.filter(
        ([name]) => name.toLowerCase() !== "strict-transport-security",
      ),
    });
    const malformedHsts = delta11HeaderCase({
      fields: DELTA11_VALID_HEADER_FIELDS.map(([name, value]) =>
        name.toLowerCase() === "strict-transport-security"
          ? [name, "max-age=invalid; includeSubDomains; preload"]
          : [name, value],
      ),
    });
    const interstitial = delta11HeaderCase({
      status: 403,
      body: "<html>deployment protection</html>",
    });
    const notFound = delta11HeaderCase({
      status: 404,
      body: '{"error":"Not found."}',
    });
    const redirect = delta11HeaderCase({
      status: 307,
      body: "",
    });
    const serverFailure = delta11HeaderCase({
      status: 500,
      body: '{"error":"Internal Server Error"}',
    });
    const duplicateHsts = delta11HeaderCase({
      fields: [
        ...DELTA11_VALID_HEADER_FIELDS,
        [
          "Strict-Transport-Security",
          "max-age=63072000; includeSubDomains; preload",
        ],
      ],
    });
    const requiredBooleans = [
      "cache_control_no_store",
      "x_content_type_options_nosniff",
      "x_frame_options_deny",
      "referrer_policy_strict_origin_when_cross_origin",
      "x_dns_prefetch_control_off",
      "cross_origin_opener_policy_same_origin",
      "permissions_camera_disabled",
      "permissions_microphone_disabled",
      "permissions_geolocation_disabled",
      "permissions_payment_disabled",
      "permissions_usb_disabled",
      "permissions_magnetometer_disabled",
      "permissions_gyroscope_disabled",
      "permissions_accelerometer_disabled",
      "csp_frame_ancestors_none",
      "csp_base_uri_self",
      "csp_form_action_self",
      "csp_object_src_none",
      "hsts_present",
      "hsts_include_subdomains",
      "hsts_preload",
    ];
    return [
      exactSet(Object.keys(valid.result), DELTA11_HEADER_CLASSIFICATION_KEYS),
      valid.result.status_class === "EXPECTED_401" &&
        valid.result.application_body_shape === "EXACT_JSON_OBJECT" &&
        valid.result.application_response_identity ===
          "ADMIN_TOOLS_UNAUTHENTICATED",
      requiredBooleans.every((name) => valid.result[name] === true),
      valid.result.hsts_max_age_class === "ONE_TO_TWO_YEARS" &&
        valid.result.x_robots_tag_noindex_advisory === true &&
        valid.result.disposition ===
          "PASS_EXACT_APPLICATION_HEADER_CONTRACT",
      vercelHsts.result.hsts_max_age_class === "AT_LEAST_TWO_YEARS" &&
        vercelHsts.result.disposition ===
          "PASS_EXACT_APPLICATION_HEADER_CONTRACT",
      valid.erased && valid.rawAbsent,
      missingRoute.erased &&
        missingRoute.result.cache_control_no_store === false &&
        missingRoute.result.disposition === "ROUTE_HEADER_DELIVERY_DEFECT",
      contradictoryCache.result.cache_control_no_store === false &&
        contradictoryCache.result.disposition ===
          "ROUTE_HEADER_DELIVERY_DEFECT",
      duplicateSingleton.result.x_frame_options_deny === false &&
        duplicateSingleton.result.disposition ===
          "PROXY_HEADER_DELIVERY_DEFECT",
      malformedPermissions.result.permissions_camera_disabled === false &&
        malformedPermissions.result.disposition ===
          "PROXY_HEADER_DELIVERY_DEFECT",
      contradictoryCsp.result.csp_frame_ancestors_none === false &&
        contradictoryCsp.result.disposition ===
          "PROXY_HEADER_DELIVERY_DEFECT",
      missingHsts.result.hsts_present === false &&
        missingHsts.result.hsts_max_age_class === "ABSENT" &&
        missingHsts.result.disposition === "HSTS_DELIVERY_DEFECT",
      malformedHsts.result.hsts_present === true &&
        malformedHsts.result.hsts_max_age_class === "LT_ONE_YEAR" &&
        malformedHsts.result.disposition === "HSTS_DELIVERY_DEFECT",
      duplicateHsts.result.hsts_present === true &&
        duplicateHsts.result.disposition === "HSTS_DELIVERY_DEFECT",
      interstitial.result.status_class === "HTTP_403" &&
        notFound.result.status_class === "HTTP_404" &&
        redirect.result.status_class === "HTTP_3XX" &&
        serverFailure.result.status_class === "HTTP_5XX" &&
        [interstitial, notFound, redirect, serverFailure].every(
          ({ result }) =>
            result.application_response_identity === "OTHER" &&
            result.disposition === "APPLICATION_RESPONSE_NOT_REACHED",
        ),
      [interstitial, notFound, redirect, serverFailure].every(
        ({ erased, rawAbsent }) => erased && rawAbsent,
      ),
      !JSON.stringify(valid.result).includes("headers") &&
        !JSON.stringify(valid.result).includes("Unauthorized") &&
        !JSON.stringify(valid.result).includes("max-age="),
      [
        valid,
        vercelHsts,
        missingRoute,
        contradictoryCache,
        duplicateSingleton,
        malformedPermissions,
        contradictoryCsp,
        missingHsts,
        malformedHsts,
        interstitial,
        notFound,
        redirect,
        serverFailure,
        duplicateHsts,
      ].every(({ result }) => Object.isFrozen(result)),
    ];
  } catch {
    return Array(18).fill(false);
  }
}

function delta11HeaderProjectionIntegrationAssertions() {
  if (
    typeof core.projectHttpResponseHeaderBuffers !== "function" ||
    typeof core.classifyAuxiliaryResponseHeaderProjection !== "function"
  ) {
    return Array(10).fill(false);
  }
  try {
    const rawHeaderBytes = Buffer.from(
      [
        "HTTP/1.1 103 Early Hints",
        "Cache-Control: public, max-age=3600",
        "X-Frame-Options: SAMEORIGIN",
        "",
        "HTTP/2 401",
        ...DELTA11_VALID_HEADER_FIELDS.map(
          ([name, value]) => `${name}: ${value}`,
        ),
        "Allow: GET, POST, PUT, DELETE",
        "Set-Cookie: aifinder_admin_session=opaque; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=14400",
        "Set-Cookie: aifinder_admin_csrf_token=opaque; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
        "X-Request-Id: must-not-be-projected",
        "",
        "",
      ].join("\r\n"),
      "utf8",
    );
    const projected = core.projectHttpResponseHeaderBuffers(rawHeaderBytes);
    const rawErased = rawHeaderBytes.every((byte) => byte === 0);
    const securityNames = projected.security_header_fields.map(
      (field) => field.name,
    );
    const auxiliaryBuffers = [
      ...projected.allow_values,
      ...projected.set_cookie_values,
    ];
    const auxiliary = core.classifyAuxiliaryResponseHeaderProjection({
      allow_values: projected.allow_values,
      set_cookie_values: projected.set_cookie_values,
    });
    const auxiliaryErased = auxiliaryBuffers.every((buffer) =>
      buffer.every((byte) => byte === 0),
    );
    const qualification = core.classifySecurityHeaderProjection({
      status: projected.status,
      application_body_bytes: Buffer.from('{"error":"Unauthorized"}', "utf8"),
      header_fields: projected.security_header_fields,
    });
    const malformedRaw = Buffer.from(
      "HTTP/2 401\r\nMalformed Header Without Colon\r\n\r\n",
      "utf8",
    );
    const malformedRejected = catches(() =>
      core.projectHttpResponseHeaderBuffers(malformedRaw),
    );
    const validatedRuntime = core.validateRuntimeResponse(
      validRuntimeResponse(),
    );
    const rawHeaderMapRejected = catches(() =>
      core.validateRuntimeResponse({
        ...validRuntimeResponse(),
        headers: { "cache-control": "no-store" },
      }),
    );
    return [
      rawErased,
      projected.status === 401 &&
        exactSet(Object.keys(projected), [
          "status",
          "security_header_fields",
          "allow_values",
          "set_cookie_values",
        ]),
      securityNames.length === DELTA11_VALID_HEADER_FIELDS.length &&
        securityNames.every((name) => name === name.toLowerCase()) &&
        !securityNames.includes("x-request-id"),
      auxiliary.allow_methods_exact === true &&
        auxiliary.session_cookie_name_present === true &&
        auxiliary.csrf_cookie_name_present === true &&
        auxiliary.http_only === true &&
        auxiliary.secure === true &&
        auxiliary.same_site_strict === true &&
        auxiliary.max_age_14400 === true &&
        auxiliary.max_age_zero === true,
      auxiliaryErased &&
        !JSON.stringify(auxiliary).includes("opaque") &&
        Object.isFrozen(auxiliary),
      qualification.disposition ===
        "PASS_EXACT_APPLICATION_HEADER_CONTRACT",
      projected.security_header_fields.every((field) =>
        field.value.every((byte) => byte === 0)),
      malformedRejected && malformedRaw.every((byte) => byte === 0),
      validatedRuntime?.validated === true && rawHeaderMapRejected,
      !JSON.stringify(qualification).includes("must-not-be-projected") &&
        !JSON.stringify(auxiliary).includes("must-not-be-projected"),
    ];
  } catch {
    return Array(10).fill(false);
  }
}

function delta11OrchestratorProjectionContract(orchestratorSource) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const requestText =
    namedFunctionText(facts.root, "runApplicationRequest") ?? "";
  return (
    orchestratorSource.includes("classifySecurityHeaderProjection,") &&
    orchestratorSource.includes("classifyAuxiliaryResponseHeaderProjection,") &&
    orchestratorSource.includes("projectHttpResponseHeaderBuffers,") &&
    namedFunctionText(facts.root, "parseResponseHeaders") === null &&
    namedFunctionText(facts.root, "applicationSecurityHeaders") === null &&
    requestText.includes(
      "const projectedHeaders = projectHttpResponseHeaderBuffers(",
    ) &&
    requestText.includes("response.raw_header_bytes") &&
    requestText.includes(
      "const securityProjection = classifySecurityHeaderProjection(",
    ) &&
    requestText.includes(
      "const headerSemantics = classifyAuxiliaryResponseHeaderProjection(",
    ) &&
    requestText.includes(
      "security_header_projection: securityProjection",
    ) &&
    requestText.includes(
      "return { headerSemantics, record, responseBytes, responseProjection, safeRecord }",
    ) &&
    !requestText.includes("headers: projectedHeaders") &&
    !orchestratorSource.includes("response.headers[") &&
    !orchestratorSource.includes('strictUtf8(buffer, "APPLICATION_HEADERS")')
  );
}

function delta11OrchestratorProjectionAssertions(orchestratorSource) {
  const mutations = [
    [
      "const projectedHeaders = projectHttpResponseHeaderBuffers(\n    response.raw_header_bytes,\n  );",
      "const projectedHeaders = { status, security_header_fields: [], allow_values: [], set_cookie_values: [] };",
    ],
    [
      "path: spec.path,\n      status,\n      security_header_projection: securityProjection",
      "path: spec.path,\n      status,\n      headers: projectedHeaders",
    ],
    [
      "return { headerSemantics, record, responseBytes, responseProjection, safeRecord }",
      "return { headers: projectedHeaders, record, responseBytes, safeRecord }",
    ],
  ].map(([expected, replacement]) =>
    replaceExactlyOnce(orchestratorSource, expected, replacement),
  );
  return [
    delta11OrchestratorProjectionContract(orchestratorSource),
    mutations.every(
      (mutation) =>
        mutation !== null &&
        !delta11OrchestratorProjectionContract(mutation),
    ),
  ];
}

function delta11QualificationLaneAssertions() {
  if (
    typeof core.validateHeaderQualificationAttempt !== "function" ||
    typeof core.deriveDelta11HeaderQualifiedTarget !== "function" ||
    typeof core.validateDelta11HeaderQualifiedAuthorization !== "function"
  ) {
    return Array(14).fill(false);
  }
  try {
    const passProjection = validRuntimeResponse().security_header_projection;
    const validAttempt = {
      attempt: 1,
      maximum_attempts: 4,
      method: "GET",
      path: "/api/admin/tools",
      credentials: false,
      cookies: false,
      request_body: false,
      database_requests: 0,
      data_writes: 0,
      deployment_identity_verified: true,
      security_header_projection: passProjection,
    };
    const validated = core.validateHeaderQualificationAttempt(validAttempt);
    const fourth = core.validateHeaderQualificationAttempt({
      ...validAttempt,
      attempt: 4,
    });
    const defect = core.validateHeaderQualificationAttempt({
      ...validAttempt,
      security_header_projection: {
        ...passProjection,
        cache_control_no_store: false,
        disposition: "ROUTE_HEADER_DELIVERY_DEFECT",
      },
    });
    const targetInput = {
      team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
      project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
      passing_preview_id: "dpl_SyntheticQualifiedPreview",
      temporary_branch:
        "aifinder-phase-34ia-security-header-runtime-validation",
      passing_commit_sha: "1".repeat(40),
      baseline: BASELINE,
      marker_sha256:
        "14422d8aa69015a577e93a273d405c42bcffd965e694c55ab1aa501f433ac353",
      header_contract_version: "DELTA11_SECURITY_HEADER_V1",
      complete_authorized_path_manifest_sha256: "2".repeat(64),
      canonical_orchestrator_sha256: "3".repeat(64),
      reviewed_pre_aggregate_sha256: "4".repeat(64),
      reviewed_stable_surface_sha256: "5".repeat(64),
      manifest_runtime_surface_sha256: "6".repeat(64),
      testing_tree_sha256: "7".repeat(64),
    };
    const target = core.deriveDelta11HeaderQualifiedTarget(targetInput);
    const expectedTarget = createHash("sha256")
      .update(
        [
          "AIFINDER_PHASE_34IA_DELTA11_HEADER_QUALIFIED_RUNTIME_V1",
          ...Object.values(targetInput),
        ].join("|"),
        "utf8",
      )
      .digest("hex");
    return [
      validated.disposition === "PASS_EXACT_APPLICATION_HEADER_CONTRACT" &&
        validated.attempt === 1 &&
        Object.isFrozen(validated),
      fourth.attempt === 4,
      defect.disposition === "ROUTE_HEADER_DELIVERY_DEFECT",
      catches(() =>
        core.validateHeaderQualificationAttempt({
          ...validAttempt,
          attempt: 5,
        }),
      ),
      catches(() =>
        core.validateHeaderQualificationAttempt({
          ...validAttempt,
          method: "POST",
        }),
      ),
      catches(() =>
        core.validateHeaderQualificationAttempt({
          ...validAttempt,
          cookies: true,
        }),
      ),
      catches(() =>
        core.validateHeaderQualificationAttempt({
          ...validAttempt,
          raw_headers: {},
        }),
      ),
      !JSON.stringify(validated).includes("header_fields") &&
        !JSON.stringify(validated).includes("raw"),
      target === expectedTarget && /^[a-f0-9]{64}$/u.test(target),
      core.deriveDelta11HeaderQualifiedTarget({
        ...targetInput,
        passing_preview_id: "dpl_OtherQualifiedPreview",
      }) !== target,
      catches(() => {
        const incomplete = { ...targetInput };
        delete incomplete.testing_tree_sha256;
        core.deriveDelta11HeaderQualifiedTarget(incomplete);
      }),
      core.validateDelta11HeaderQualifiedAuthorization({
        authorization:
          `AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_HEADER_QUALIFIED_TARGET_${target}`,
        target_sha256: target,
      }) === target,
      catches(() =>
        core.validateDelta11HeaderQualifiedAuthorization({
          authorization:
            `AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_HEADER_QUALIFIED_TARGET_${"8".repeat(64)}`,
          target_sha256: target,
        }),
      ),
      targetInput.temporary_branch === DELTA11_BRANCH,
    ];
  } catch {
    return Array(14).fill(false);
  }
}

function delta11PlanAndMarkerAssertions(coreSource, orchestratorSource) {
  const plan = core.createRuntimePlan();
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const markerLines = literalArrayFromDeclaration(facts.root, "MARKER_LINES");
  const modes = literalArrayFromDeclaration(facts.root, "MODES");
  const conditionalPaths = literalArrayFromDeclaration(
    facts.root,
    "CONDITIONAL_APPLICATION_PATHS",
  );
  return [
    plan.branch === BRANCH,
    plan.marker.bytes === 475 &&
      plan.marker.lf === 10 &&
      plan.marker.sha256 === MARKER_SHA256 &&
      plan.marker.trailing_lf === true,
    plan.budgets.preview_deployments === 1 &&
      plan.budgets.qualification_get_requests === 4 &&
      plan.budgets.auth_qualification_cycles === 1 &&
      plan.budgets.auth_qualification_requests === 6 &&
      plan.budgets.runtime_sessions === 1 &&
      plan.budgets.application_requests === 20,
    JSON.stringify(markerLines ?? []) === JSON.stringify(MARKER_LINES),
    JSON.stringify(modes ?? []) === JSON.stringify([
      "--self-test",
      "--self-test-delta20-publication",
      "--repair-delta20-qualification-publication",
      "--repair-delta20-runtime-publication",
      "--qualify-poststate-preview",
      "--identify-poststate-oracle-qualified-target",
      "--execute-poststate-oracle-qualified-preview",
    ]),
    JSON.stringify(conditionalPaths ?? []) === JSON.stringify([
      "app/api/admin/tools/route.ts",
      "app/api/admin/tools/handler.ts",
      "proxy.ts",
      "next.config.ts",
    ]),
    orchestratorSource.includes(
      'const TEMPORARY_COMMIT_SUBJECT =\n  "Trigger Admin V1 verified evidence publication preview v18";',
    ),
    namedFunctionText(
      facts.root,
      "runDelta15AuthFixtureQualificationCycle",
    ) !== null,
    namedFunctionText(facts.root, "qualifyDelta14AuthPreview") !== null,
    namedFunctionText(
      facts.root,
      "identifyDelta18DurableProjectionFinalTarget",
    ) !== null,
    namedFunctionText(
      facts.root,
      "executeDelta18DurableProjectionFinalRuntime",
    ) !== null,
    coreSource.includes(
      "deriveDelta20VerifiedPublicationFinalTarget",
    ) &&
      orchestratorSource.includes(
        "deriveDelta20VerifiedPublicationFinalTarget,",
      ),
    plan.budgets.vercel_control_maximum === 353 &&
      plan.budgets.git_remote_reads_maximum === 42,
    namedFunctionText(
      facts.root,
      "createDelta13EnvironmentRecords",
    ) !== null,
    namedFunctionText(
      facts.root,
      "deleteDelta13EnvironmentRecords",
    ) !== null,
    namedFunctionText(
      facts.root,
      "persistDelta18QualifiedState",
    ) !== null,
    namedFunctionText(
      facts.root,
      "captureDelta13EnvironmentSnapshot",
    ) !== null,
    orchestratorSource.includes("validateDelta13BranchEnvironmentTransition,") &&
      orchestratorSource.includes("validateDelta13AuthQualificationCycle,"),
    orchestratorSource.includes(
      "--force-with-lease=${branchRef}:${priorCommitSha}",
    ) &&
      orchestratorSource.includes("${repairCommitSha}:${branchRef}"),
    orchestratorSource.includes(
      'verifyReviewedCandidate(repositoryRoot, status, plan)',
    ) && !orchestratorSource.includes("--qualify-security-header-preview"),
  ];
}

function delta12RawApplicationHeaders(status = 401) {
  return Buffer.from(
    [
      `HTTP/1.1 ${status} ${status === 401 ? "Unauthorized" : "Temporary Redirect"}`,
      ...DELTA11_VALID_HEADER_FIELDS.map(
        ([name, value]) => `${name}: ${value}`,
      ),
      "",
      "",
    ].join("\r\n"),
    "utf8",
  );
}

function delta13ResponseProjectionAssertions() {
  if (typeof core.projectDelta13ApplicationResponse !== "function") {
    return Array(18).fill(false);
  }
  const securityHeaderCategories = validRuntimeResponse()
    .security_header_projection;
  const project = ({
    actualStatus,
    body,
    expectedStatus,
    method,
    ordinal,
    path: requestPath,
    setCookies = [],
  }) => {
    const bodyBytes = Buffer.from(body, "utf8");
    const cookieBytes = setCookies.map((value) => Buffer.from(value, "latin1"));
    const result = core.projectDelta13ApplicationResponse({
      request_ordinal: ordinal,
      method,
      path: requestPath,
      expected_status: expectedStatus,
      actual_status_integer: actualStatus,
      raw_body_bytes: bodyBytes,
      security_header_categories: securityHeaderCategories,
      set_cookie_values: cookieBytes,
    });
    return {
      buffersErased:
        bodyBytes.every((byte) => byte === 0) &&
        cookieBytes.every((buffer) => buffer.every((byte) => byte === 0)),
      result,
    };
  };
  try {
    const loginCases = [
      [200, '{"success":true,"message":"Admin login successful."}', "LOGIN_SUCCESS_200", "EXACT_LOGIN_SUCCESS_JSON"],
      [401, '{"error":"Invalid credentials."}', "INVALID_CREDENTIALS_401", "EXACT_INVALID_CREDENTIALS_JSON"],
      [415, '{"error":"Invalid login request."}', "MALFORMED_MEDIA_TYPE_415", "EXACT_MALFORMED_REQUEST_JSON"],
      [400, '{"error":"Invalid login request."}', "MALFORMED_REQUEST_400", "EXACT_MALFORMED_REQUEST_JSON"],
      [413, '{"error":"Invalid login request."}', "BODY_TOO_LARGE_413", "EXACT_MALFORMED_REQUEST_JSON"],
      [429, '{"error":"Too many login attempts. Please wait and try again."}', "RATE_LIMITED_429", "EXACT_RATE_LIMITED_JSON"],
      [500, '{"error":"Admin login is temporarily unavailable."}', "CONFIGURATION_UNAVAILABLE_500", "EXACT_CONFIGURATION_UNAVAILABLE_JSON"],
      [418, '{"error":"unexpected"}', "UNEXPECTED_STATUS", "OTHER_JSON"],
    ].map(([actualStatus, body, identity, bodyShape]) => ({
      ...project({
        actualStatus,
        body,
        expectedStatus: 200,
        method: "POST",
        ordinal: 2,
        path: "/api/admin/login",
        setCookies:
          actualStatus === 200
            ? [
                "aifinder_admin_session=opaque; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=14400",
              ]
            : [],
      }),
      bodyShape,
      identity,
    }));
    const sessionSuccess = project({
      actualStatus: 200,
      body: '{"authenticated":true,"role":"admin"}',
      expectedStatus: 200,
      method: "GET",
      ordinal: 3,
      path: "/api/admin/session",
    });
    const sessionDenied = project({
      actualStatus: 401,
      body: '{"authenticated":false,"message":"Unauthorized."}',
      expectedStatus: 200,
      method: "GET",
      ordinal: 3,
      path: "/api/admin/session",
    });
    const sessionUnexpected = project({
      actualStatus: 200,
      body: '{"authenticated":false}',
      expectedStatus: 200,
      method: "GET",
      ordinal: 3,
      path: "/api/admin/session",
    });
    const csrf = project({
      actualStatus: 200,
      body: `{"success":true,"csrfToken":"${"a".repeat(64)}"}`,
      expectedStatus: 200,
      method: "GET",
      ordinal: 4,
      path: "/api/admin/csrf",
      setCookies: [
        `aifinder_admin_csrf_token=${"b".repeat(64)}; Path=/; Secure; SameSite=Strict; Max-Age=14400`,
      ],
    });
    const missingCsrf = project({
      actualStatus: 403,
      body: '{"error":"Security token missing or expired. Please log in again."}',
      expectedStatus: 403,
      method: "POST",
      ordinal: 5,
      path: "/api/admin/tools",
    });
    const exactKeys = [
      "request_ordinal",
      "method",
      "path_class",
      "expected_status",
      "actual_status_integer",
      "status_match",
      "application_identity_class",
      "body_shape_class",
      "security_header_categories",
      "cookie_effect_categories",
    ];
    return [
      loginCases.every(
        ({ result, identity }) =>
          result.application_identity_class === identity,
      ),
      loginCases.every(
        ({ result, bodyShape }) => result.body_shape_class === bodyShape,
      ),
      loginCases[0].result.actual_status_integer === 200 &&
        loginCases[0].result.status_match === true &&
        loginCases.slice(1).every(({ result }) => result.status_match === false),
      loginCases[0].result.cookie_effect_categories.session_cookie ===
        "SET_SECURE_HTTPONLY_SAMESITE_STRICT_MAXAGE_14400" &&
        loginCases.slice(1).every(
          ({ result }) =>
            result.cookie_effect_categories.session_cookie === "ABSENT",
        ),
      sessionSuccess.result.application_identity_class ===
        "AUTHENTICATED_SESSION_200" &&
        sessionSuccess.result.body_shape_class ===
          "EXACT_AUTHENTICATED_SESSION_JSON",
      sessionDenied.result.application_identity_class ===
        "UNAUTHENTICATED_SESSION_401" &&
        sessionDenied.result.body_shape_class ===
          "EXACT_UNAUTHENTICATED_SESSION_JSON" &&
        sessionDenied.result.actual_status_integer === 401 &&
        sessionDenied.result.status_match === false,
      sessionUnexpected.result.application_identity_class ===
        "UNEXPECTED_STATUS" &&
        sessionUnexpected.result.body_shape_class === "OTHER_JSON",
      csrf.result.application_identity_class === "CSRF_ISSUED_200" &&
        csrf.result.body_shape_class === "EXACT_CSRF_SUCCESS_JSON" &&
        csrf.result.cookie_effect_categories.csrf_cookie ===
          "SET_SECURE_SAMESITE_STRICT_MAXAGE_14400",
      missingCsrf.result.application_identity_class ===
        "MISSING_CSRF_DENIAL_403" &&
        missingCsrf.result.body_shape_class ===
          "EXACT_MISSING_CSRF_DENIAL_JSON",
      [
        ...loginCases,
        { ...sessionSuccess },
        { ...sessionDenied },
        { ...sessionUnexpected },
        { ...csrf },
        { ...missingCsrf },
      ].every(({ buffersErased }) => buffersErased),
      exactSet(Object.keys(loginCases[0].result), exactKeys),
      loginCases.every(({ result }) =>
        Object.isFrozen(result) &&
        Object.isFrozen(result.security_header_categories) &&
        Object.isFrozen(result.cookie_effect_categories),
      ),
      loginCases.every(({ result }) =>
        !JSON.stringify(result).includes("opaque") &&
        !JSON.stringify(result).includes("Invalid credentials") &&
        !JSON.stringify(result).includes("temporarily unavailable"),
      ),
      loginCases[0].result.path_class === "ADMIN_LOGIN" &&
        sessionSuccess.result.path_class === "ADMIN_SESSION" &&
        csrf.result.path_class === "ADMIN_CSRF" &&
        missingCsrf.result.path_class === "ADMIN_TOOLS",
      catches(() =>
        core.projectDelta13ApplicationResponse({
          request_ordinal: 2,
          method: "POST",
          path: "/api/admin/login",
          expected_status: 401,
          actual_status_integer: 200,
          raw_body_bytes: Buffer.from("{}"),
          security_header_categories: securityHeaderCategories,
          set_cookie_values: [],
        }),
      ),
      catches(() =>
        core.projectDelta13ApplicationResponse({
          request_ordinal: 2,
          method: "GET",
          path: "/api/admin/login",
          expected_status: 200,
          actual_status_integer: 200,
          raw_body_bytes: Buffer.from("{}"),
          security_header_categories: securityHeaderCategories,
          set_cookie_values: [],
        }),
      ),
      catches(() =>
        core.projectDelta13ApplicationResponse({
          request_ordinal: 2,
          method: "POST",
          path: "/api/admin/login",
          expected_status: 200,
          actual_status_integer: 200,
          raw_body_bytes: Buffer.from("{}"),
          raw_headers: {},
          security_header_categories: securityHeaderCategories,
          set_cookie_values: [],
        }),
      ),
      !JSON.stringify(loginCases[0].result).includes("raw_") &&
        !JSON.stringify(loginCases[0].result).includes("/api/") &&
        !JSON.stringify(csrf.result).includes("csrfToken"),
    ];
  } catch {
    return Array(18).fill(false);
  }
}

function delta13OrchestratorProjectionContract(orchestratorSource) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const applicationRequest =
    namedFunctionText(facts.root, "runApplicationRequest") ?? "";
  const runtimeSession = namedFunctionText(facts.root, "runRuntimeSession") ?? "";
  const applyIndex = applicationRequest.indexOf("applyResponseCookies(");
  const projectIndex = applicationRequest.indexOf(
    "projectDelta13ApplicationResponse({",
  );
  const contractProjectionIndex = runtimeSession.indexOf(
    "projectDelta16AApplicationContractBeforeErasure({",
  );
  const projectionIndex = runtimeSession.indexOf(
    "runtimeState.lastResponseProjection = contractProjection;",
  );
  const validationIndex = runtimeSession.indexOf(
    "validateDelta16AApplicationContractProjection(",
  );
  return (
    orchestratorSource.includes("projectDelta13ApplicationResponse,") &&
    applyIndex !== -1 &&
    projectIndex > applyIndex &&
    applicationRequest.includes("raw_body_bytes: Buffer.from(responseBytes)") &&
    applicationRequest.includes(
      "set_cookie_values: projectedHeaders.set_cookie_values.map((value) => Buffer.from(value))",
    ) &&
    applicationRequest.includes(
      "return { headerSemantics, record, responseBytes, responseProjection, safeRecord }",
    ) &&
    contractProjectionIndex !== -1 &&
    projectionIndex > contractProjectionIndex &&
    validationIndex > projectionIndex &&
    runtimeSession.includes("response.responseBytes.fill(0)") &&
    orchestratorSource.includes(
      "function projectDelta16AApplicationContractBeforeErasure(",
    ) &&
    orchestratorSource.includes('"LOGIN_SUCCESS_200"') &&
    orchestratorSource.includes('"AUTHENTICATED_SESSION_200"')
  );
}

function delta13OrchestratorProjectionAssertions(orchestratorSource) {
  const mutations = [
    ["projectDelta13ApplicationResponse,", ""],
    [
      "runtimeState.lastResponseProjection = contractProjection;",
      "runtimeState.lastResponseProjection = response.responseProjection;",
    ],
    [
      "validateDelta16AApplicationContractProjection(contractProjection);\n    const applicationAssertion =",
      "validateRuntimeResponse(response.record);\n    const applicationAssertion =",
    ],
  ].map(([expected, replacement]) =>
    replaceExactlyOnce(orchestratorSource, expected, replacement),
  );
  return [
    delta13OrchestratorProjectionContract(orchestratorSource),
    mutations.every(
      (mutation) =>
        mutation !== null &&
        !delta13OrchestratorProjectionContract(mutation),
    ),
  ];
}

function delta13BranchEnvironmentAndQualificationAssertions() {
  const requiredFunctions = [
    "classifyDelta13BranchEnvironmentSnapshot",
    "validateDelta13BranchEnvironmentTransition",
    "validateDelta13AuthQualificationCycle",
    "deriveDelta13AuthQualifiedTarget",
    "validateDelta13AuthQualifiedAuthorization",
  ];
  if (requiredFunctions.some((name) => typeof core[name] !== "function")) {
    return Array(20).fill(false);
  }
  const branch = BRANCH;
  const names = ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"];
  const observation = (
    name,
    branchScope,
    recordId = null,
    commentClass = "UNRELATED",
  ) => ({
    name,
    target: "PREVIEW",
    branch_scope: branchScope,
    type: "SENSITIVE",
    decrypted: false,
    phase_owned_record_id: recordId,
    comment_class: commentClass,
  });
  const snapshotInput = (observations) => ({
    branch,
    names,
    observations,
    metadata_requests: 2,
    decrypt_true_requests: 0,
    environment_value_reads: 0,
    raw_values_persisted: 0,
    secret_hashes_persisted: 0,
  });
  const secureCategories = validRuntimeResponse().security_header_projection;
  const response = ({ ordinal, method, requestPath, expected, actual, body, cookies = [] }) =>
    core.projectDelta13ApplicationResponse({
      request_ordinal: ordinal,
      method,
      path: requestPath,
      expected_status: expected,
      actual_status_integer: actual,
      raw_body_bytes: Buffer.from(body, "utf8"),
      security_header_categories: secureCategories,
      set_cookie_values: cookies.map((value) => Buffer.from(value, "latin1")),
    });
  try {
    const before = core.classifyDelta13BranchEnvironmentSnapshot(
      snapshotInput([
        observation("ADMIN_PASSWORD", "GLOBAL"),
        observation("ADMIN_SESSION_SECRET", "GLOBAL"),
        observation("ADMIN_PASSWORD", "OTHER"),
      ]),
    );
    const after = core.classifyDelta13BranchEnvironmentSnapshot(
      snapshotInput([
        observation("ADMIN_PASSWORD", "GLOBAL"),
        observation("ADMIN_SESSION_SECRET", "GLOBAL"),
        observation("ADMIN_PASSWORD", "OTHER"),
        observation(
          "ADMIN_PASSWORD",
          "EXACT",
          "env_Delta13AdminPassword",
          "DELTA13_ADMIN_PASSWORD",
        ),
        observation(
          "ADMIN_SESSION_SECRET",
          "EXACT",
          "env_Delta13SessionSecret",
          "DELTA13_ADMIN_SESSION_SECRET",
        ),
      ]),
    );
    const transition = core.validateDelta13BranchEnvironmentTransition({
      before,
      after,
    });
    const requests = [
      response({ ordinal: 1, method: "GET", requestPath: "/api/admin/tools", expected: 401, actual: 401, body: '{"error":"Unauthorized"}' }),
      response({
        ordinal: 2,
        method: "POST",
        requestPath: "/api/admin/login",
        expected: 200,
        actual: 200,
        body: '{"success":true,"message":"Admin login successful."}',
        cookies: ["aifinder_admin_session=opaque; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=14400"],
      }),
      response({ ordinal: 3, method: "GET", requestPath: "/api/admin/session", expected: 200, actual: 200, body: '{"authenticated":true,"role":"admin"}' }),
      response({
        ordinal: 4,
        method: "GET",
        requestPath: "/api/admin/csrf",
        expected: 200,
        actual: 200,
        body: `{"success":true,"csrfToken":"${"c".repeat(64)}"}`,
        cookies: [`aifinder_admin_csrf_token=${"d".repeat(64)}; Path=/; Secure; SameSite=Strict; Max-Age=14400`],
      }),
      response({ ordinal: 5, method: "POST", requestPath: "/api/admin/tools", expected: 403, actual: 403, body: '{"error":"Security token missing or expired. Please log in again."}' }),
    ];
    const cycle = core.validateDelta13AuthQualificationCycle({
      cycle: 1,
      maximum_cycles: 4,
      requests,
      login_attempts: 1,
      fresh_cookie_jar: true,
      cookie_jar_destroyed: true,
      database_requests: 0,
      data_writes: 0,
      storage_requests: 0,
      fixture_insertions: 0,
    });
    const targetInput = {
      team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
      project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
      passing_preview_id: "dpl_Delta13QualifiedPreview",
      new_branch: branch,
      passing_commit: "1".repeat(40),
      baseline: BASELINE,
      marker_sha256:
        MARKER_SHA256,
      admin_password_env_record_id: "env_Delta13AdminPassword",
      admin_session_secret_env_record_id: "env_Delta13SessionSecret",
      access_mode: "SELF_PROJECT_OIDC",
      auth_qualification_evidence_sha256: "2".repeat(64),
      authorized_path_manifest_sha256: "3".repeat(64),
      canonical_orchestrator_sha256: "4".repeat(64),
      reviewed_pre_aggregate_sha256: "5".repeat(64),
      reviewed_stable_surface_sha256: "6".repeat(64),
      manifest_runtime_surface_sha256: "7".repeat(64),
      testing_tree_sha256: "8".repeat(64),
    };
    const target = core.deriveDelta13AuthQualifiedTarget(targetInput);
    const expectedTarget = createHash("sha256")
      .update(
        [
          "AIFINDER_PHASE_34IA_DELTA13_AUTH_QUALIFIED_RUNTIME_V1",
          ...Object.values(targetInput),
        ].join("|"),
        "utf8",
      )
      .digest("hex");
    return [
      before.records.ADMIN_PASSWORD.global_preview_record_count === 1 &&
        before.records.ADMIN_PASSWORD.exact_new_branch_record_count === 0 &&
        before.records.ADMIN_PASSWORD.other_branch_record_count === 1,
      before.records.ADMIN_SESSION_SECRET.global_preview_record_count === 1 &&
        before.records.ADMIN_SESSION_SECRET.exact_new_branch_record_count === 0,
      !JSON.stringify(before).includes("env_") &&
        before.environment_value_reads === 0 &&
        before.raw_values_persisted === 0,
      after.records.ADMIN_PASSWORD.exact_new_branch_record_count === 1 &&
        after.records.ADMIN_SESSION_SECRET.exact_new_branch_record_count === 1,
      after.records.ADMIN_PASSWORD.phase_owned_record_id ===
        "env_Delta13AdminPassword" &&
        after.records.ADMIN_SESSION_SECRET.phase_owned_record_id ===
          "env_Delta13SessionSecret",
      transition.ready === true &&
        transition.exact_branch_records === 2 &&
        transition.global_preview_metadata_unchanged === true,
      Object.isFrozen(before) && Object.isFrozen(after) && Object.isFrozen(transition),
      catches(() =>
        core.classifyDelta13BranchEnvironmentSnapshot(
          snapshotInput([
            observation(
              "ADMIN_PASSWORD",
              "EXACT",
              "env_Unexpected",
              "UNRELATED",
            ),
          ]),
        ),
      ),
      catches(() =>
        core.validateDelta13BranchEnvironmentTransition({
          before,
          after: core.classifyDelta13BranchEnvironmentSnapshot(
            snapshotInput([
              observation("ADMIN_PASSWORD", "GLOBAL"),
              observation("ADMIN_SESSION_SECRET", "GLOBAL"),
              observation(
                "ADMIN_PASSWORD",
                "EXACT",
                "env_Delta13AdminPassword",
                "DELTA13_ADMIN_PASSWORD",
              ),
              observation(
                "ADMIN_SESSION_SECRET",
                "EXACT",
                "env_Delta13SessionSecret",
                "DELTA13_ADMIN_SESSION_SECRET",
              ),
            ]),
          ),
        }),
      ),
      cycle.ready === true && cycle.requests === 5 && cycle.login_attempts === 1,
      cycle.application_identity_classes.join(",") ===
        "ADMIN_TOOLS_UNAUTHENTICATED_401,LOGIN_SUCCESS_200,AUTHENTICATED_SESSION_200,CSRF_ISSUED_200,MISSING_CSRF_DENIAL_403",
      cycle.statuses.join(",") === "401,200,200,200,403" &&
        cycle.database_requests === 0 && cycle.data_writes === 0,
      Object.isFrozen(cycle) && Object.isFrozen(cycle.statuses),
      catches(() =>
        core.validateDelta13AuthQualificationCycle({
          cycle: 1,
          maximum_cycles: 4,
          requests: requests.slice(0, 4),
          login_attempts: 1,
          fresh_cookie_jar: true,
          cookie_jar_destroyed: true,
          database_requests: 0,
          data_writes: 0,
          storage_requests: 0,
          fixture_insertions: 0,
        }),
      ),
      catches(() =>
        core.validateDelta13AuthQualificationCycle({
          cycle: 1,
          maximum_cycles: 4,
          requests,
          login_attempts: 1,
          fresh_cookie_jar: true,
          cookie_jar_destroyed: true,
          database_requests: 1,
          data_writes: 0,
          storage_requests: 0,
          fixture_insertions: 0,
        }),
      ),
      target === expectedTarget && /^[a-f0-9]{64}$/u.test(target),
      core.deriveDelta13AuthQualifiedTarget({
        ...targetInput,
        admin_password_env_record_id: "env_Other",
      }) !== target,
      core.validateDelta13AuthQualifiedAuthorization({
        authorization:
          `AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_AUTH_QUALIFIED_TARGET_${target}`,
        target_sha256: target,
      }) === target,
      catches(() =>
        core.validateDelta13AuthQualifiedAuthorization({
          authorization:
            `AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_AUTH_QUALIFIED_TARGET_${"9".repeat(64)}`,
          target_sha256: target,
        }),
      ),
      targetInput.new_branch === branch &&
        targetInput.marker_sha256 === MARKER_SHA256,
    ];
  } catch {
    return Array(20).fill(false);
  }
}

function delta13OrchestratorLifecycleContract(coreSource, orchestratorSource) {
  const plan = core.createRuntimePlan();
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const modes = literalArrayFromDeclaration(facts.root, "MODES");
  const markerLines = literalArrayFromDeclaration(facts.root, "MARKER_LINES");
  const requiredFunctions = [
    "captureDelta13EnvironmentSnapshot",
    "classifyDelta13EnvironmentMutationResult",
    "classifyDelta13EnvironmentDocument",
    "createDelta13EnvironmentRecords",
    "boundedSensitiveVercelApiStdinAuthorized",
    "buildDelta13EnvironmentCreateRequest",
    "createDelta18DurableEvidenceState",
    "deleteDelta13EnvironmentRecords",
    "delta18OfficialRuntimeAttemptBinding",
    "executeDelta18DurableProjectionFinalRuntime",
    "repairDelta20RuntimePublicationFromRetainedJournal",
    "generateDelta13SessionSecret",
    "identifyDelta18DurableProjectionFinalTarget",
    "qualifyDelta14AuthPreview",
    "readProtectedDelta13AdminPassword",
    "runDelta13EnvironmentStdinLifecycleSelfTest",
    "runDelta18IdentityQualificationSession",
  ];
  const createEnvironmentRecordText =
    namedFunctionText(facts.root, "createDelta13EnvironmentRecord") ?? "";
  const deleteEnvironmentRecordText =
    namedFunctionText(facts.root, "deleteDelta13EnvironmentRecord") ?? "";
  const environmentMutationClassifierText =
    namedFunctionText(
      facts.root,
      "classifyDelta13EnvironmentMutationResult",
    ) ?? "";
  const delta18StateValidatorText =
    namedFunctionText(facts.root, "validateDelta18QualifiedState") ?? "";
  const officialRuntimeText =
    namedFunctionText(
      facts.root,
      "executeDelta18DurableProjectionFinalRuntime",
    ) ?? "";
  const officialAttemptBindingText =
    namedFunctionText(
      facts.root,
      "delta18OfficialRuntimeAttemptBinding",
    ) ?? "";
  const durableAppendText =
    namedFunctionText(facts.root, "appendDelta18DurableProjection") ?? "";
  const atomicPersistenceText =
    namedFunctionText(facts.root, "atomicPersistMode0600Json") ?? "";
  const temporaryBypassText =
    namedFunctionText(
      facts.root,
      "runTemporaryAutomationBypassCycle",
    ) ?? "";
  const protectedCleanupText =
    namedFunctionText(
      facts.root,
      "protectedAccessCleanupComplete",
    ) ?? "";
  const boundedProtectedAttemptsText =
    namedFunctionText(
      facts.root,
      "runBoundedProtectedAccessAttempts",
    ) ?? "";
  const environmentStdinAuthorizationText =
    namedFunctionText(
      facts.root,
      "boundedSensitiveVercelApiStdinAuthorized",
    ) ?? "";
  const environmentRequestBuilderText =
    namedFunctionText(
      facts.root,
      "buildDelta13EnvironmentCreateRequest",
    ) ?? "";
  const environmentStdinLifecycleSelfTestText =
    namedFunctionText(
      facts.root,
      "runDelta13EnvironmentStdinLifecycleSelfTest",
    ) ?? "";
  const runChildText = namedFunctionText(facts.root, "runChild") ?? "";
  const predecessorPhaseMutation = officialAttemptBindingText.replace(
    "phase: state.phase,",
    'phase: "34IA-34IZ-DELTA17",',
  );
  return (
    plan.branch ===
      "aifinder-phase-34ia-evidence-publication-runtime-validation-v3" &&
    plan.marker.bytes === 475 &&
    plan.marker.lf === 10 &&
    plan.marker.sha256 ===
      "f8ad3e3d1d764c92d03bf44081e3b341d93680664645c257726a54940bfd4b2f" &&
    plan.budgets.auth_qualification_cycles === 1 &&
    plan.budgets.auth_qualification_requests === 6 &&
    plan.budgets.login_attempts === 1 &&
    plan.budgets.environment_record_creates_maximum === 8 &&
    plan.budgets.environment_record_deletes_maximum === 6 &&
    plan.budgets.vercel_control_maximum === 353 &&
    orchestratorSource.includes(
      "delta13EnvironmentMetadataRequests:\n        delta19EnvironmentMetadataRequestMaximum(plan)",
    ) &&
    core.canonicalJson(modes) ===
      core.canonicalJson([
        "--self-test",
        "--self-test-delta20-publication",
        "--repair-delta20-qualification-publication",
        "--repair-delta20-runtime-publication",
        "--qualify-poststate-preview",
        "--identify-poststate-oracle-qualified-target",
        "--execute-poststate-oracle-qualified-preview",
      ]) &&
    core.canonicalJson(markerLines) ===
      core.canonicalJson([
        "AIFINDER_PHASE_34IA_VERIFIED_EVIDENCE_PUBLICATION_FINAL_RUNTIME_PREVIEW_V18",
        `baseline=${BASELINE}`,
        "branch=aifinder-phase-34ia-evidence-publication-runtime-validation-v3",
        "purpose=admin-v1-verified-evidence-publication-runtime-closure",
        "auth_overrides=ADMIN_PASSWORD,ADMIN_SESSION_SECRET",
        "pretarget_publication_qualification_requests=6",
        "official_runtime_requests=20",
        "preview_ordinal=eighth-final",
        "execution_surface=codex-cli-antigravity",
        "public_launch=NO_GO",
      ]) &&
    requiredFunctions.every(
      (name) => namedFunctionText(facts.root, name) !== null,
    ) &&
    orchestratorSource.includes("classifyDelta13BranchEnvironmentSnapshot,") &&
    orchestratorSource.includes("deriveDelta20VerifiedPublicationFinalTarget,") &&
    orchestratorSource.includes("validateDelta18DurableProjectionJournal,") &&
    orchestratorSource.includes(
      "validateDelta20VerifiedPublicationFinalAuthorization,",
    ) &&
    orchestratorSource.includes(
      '"AiFinder Phase 34IA Delta 20 temporary ADMIN_PASSWORD branch override"',
    ) &&
    orchestratorSource.includes(
      '"AiFinder Phase 34IA Delta 20 temporary ADMIN_SESSION_SECRET branch override"',
    ) &&
    orchestratorSource.includes(
      '"Trigger Admin V1 verified evidence publication preview v18"',
    ) &&
    orchestratorSource.includes(
      '["TRANSIENT", "DEFINITIVE_NOT_FOUND_BRANCH"].includes(',
    ) &&
    createEnvironmentRecordText.includes(
      'failureClass.startsWith("DEFINITIVE_")',
    ) &&
    deleteEnvironmentRecordText.includes(
      '"--dangerously-skip-permissions"',
    ) &&
    [
      '"DEFINITIVE_BAD_REQUEST"',
      '"DEFINITIVE_CONFLICT"',
      '"DEFINITIVE_AUTH_FRESHNESS"',
      '"DEFINITIVE_NOT_FOUND"',
      '"DEFINITIVE_NOT_FOUND_BRANCH"',
      '"DEFINITIVE_NOT_FOUND_PROJECT"',
      '"DEFINITIVE_NOT_FOUND_TEAM"',
      '"DEFINITIVE_PERMISSION"',
      '"DEFINITIVE_OTHER"',
    ].every((value) =>
      environmentMutationClassifierText.includes(`return ${value};`),
    ) &&
    orchestratorSource.includes(
      'SELF_TEST_DELTA13_ENVIRONMENT_REQUEST_STDIN',
    ) &&
    !createEnvironmentRecordText.includes("parseChildJson(") &&
    createEnvironmentRecordText.includes("result.stdout.fill(0)") &&
    createEnvironmentRecordText.includes("result.stderr.fill(0)") &&
    delta18StateValidatorText.includes(
      '"official_runtime_attempt_started"',
    ) &&
    officialRuntimeText.includes(
      "retained.state.official_runtime_attempt_started !== false",
    ) &&
    officialRuntimeText.indexOf("persistDelta18QualifiedState(") !== -1 &&
    officialRuntimeText.indexOf("persistDelta18QualifiedState(") <
      officialRuntimeText.indexOf("createResumeAttemptMarker(") &&
    officialRuntimeText.includes(
      "official_runtime_attempt_started: true",
    ) &&
    officialRuntimeText.includes(
      "delta18OfficialRuntimeAttemptBinding({",
    ) &&
    officialAttemptBindingText.includes('state.phase !== "34IA-34IZ-DELTA20"') &&
    officialAttemptBindingText.includes("phase: state.phase,") &&
    predecessorPhaseMutation !== officialAttemptBindingText &&
    !predecessorPhaseMutation.includes("phase: state.phase,") &&
    officialRuntimeText.includes("context.deferTempRootRemoval = true") &&
    officialRuntimeText.includes(
      "rollbackFailures.push(...(await rollbackLiveContext(context)))",
    ) &&
    officialRuntimeText.includes(
      "context.dataCleaned &&\n        context.previewRemoved",
    ) &&
    atomicPersistenceText.includes("openExclusiveMode0600(nextPath, bytes)") &&
    atomicPersistenceText.includes("renameSync(nextPath, targetPath)") &&
    atomicPersistenceText.includes("fsyncExactDirectory(canonicalRoot)") &&
    durableAppendText.includes("persistDelta18IncrementalCleanupLocators(") &&
    orchestratorSource.includes(
      "const PROTECTED_ACCESS_REVOKE_ATTEMPTS_MAXIMUM = 3",
    ) &&
    orchestratorSource.includes(
      "const PROTECTED_ACCESS_RESTORE_ATTEMPTS_MAXIMUM = 2",
    ) &&
    temporaryBypassText.includes(
      "maximum: PROTECTED_ACCESS_REVOKE_ATTEMPTS_MAXIMUM",
    ) &&
    temporaryBypassText.includes(
      "maximum: PROTECTED_ACCESS_RESTORE_ATTEMPTS_MAXIMUM",
    ) &&
    boundedProtectedAttemptsText.includes(
      "attempt < maximum",
    ) &&
    boundedProtectedAttemptsText.includes(
      "attempts: maximum, succeeded: false",
    ) &&
    protectedCleanupText.includes("activeProtectedAccessArtifact === null") &&
    protectedCleanupText.includes(
      "protectedAccessCredentialActive === false",
    ) &&
    !orchestratorSource.includes(
      "activeDelta13EnvironmentRequestArtifact",
    ) &&
    !environmentRequestBuilderText.includes("writeExclusiveFile(") &&
    !environmentRequestBuilderText.includes("createCanonicalTempRoot(") &&
    environmentRequestBuilderText.includes("return requestBytes;") &&
    environmentStdinAuthorizationText.includes(
      "options.allowBoundedVercelApiInput === true",
    ) &&
    environmentStdinAuthorizationText.includes('"--input"') &&
    environmentStdinAuthorizationText.includes('"-"') &&
    environmentStdinAuthorizationText.includes(
      "input.byteLength <= 128 * 1024",
    ) &&
    runChildText.includes("boundedSensitiveVercelApiStdinAuthorized(") &&
    runChildText.includes("!boundedVercelApiInput") &&
    createEnvironmentRecordText.includes(
      "const requestBytes = buildDelta13EnvironmentCreateRequest(",
    ) &&
    createEnvironmentRecordText.includes(
      '"--input",\n          "-",',
    ) &&
    createEnvironmentRecordText.includes(
      "allowBoundedVercelApiInput: true",
    ) &&
    createEnvironmentRecordText.includes("input: requestBytes") &&
    createEnvironmentRecordText.includes("requestBytes.fill(0)") &&
    environmentStdinLifecycleSelfTestText.includes(
      "pathTransportRejected",
    ) &&
    environmentStdinLifecycleSelfTestText.includes(
      "environmentRequestRoots().length !== 0",
    ) &&
    environmentStdinLifecycleSelfTestText.includes(
      "requestBytes.some((byte) => byte !== 0)",
    ) &&
    orchestratorSource.includes(
      '"delta13EnvironmentMetadataRequests",\n  "environmentRecordCreateRequests",\n  "environmentRecordDeleteRequests",',
    ) &&
    orchestratorSource.includes("await qualifyDelta14AuthPreview();") &&
    orchestratorSource.includes(
      "identifyDelta18DurableProjectionFinalTarget();",
    ) &&
    orchestratorSource.includes(
      "await executeDelta18DurableProjectionFinalRuntime();",
    ) &&
    orchestratorSource.includes(
      'mode === "--execute-poststate-oracle-qualified-preview"',
    ) &&
    !orchestratorSource.includes("--qualify-security-header-preview")
  );
}

function delta13OrchestratorLifecycleAssertions(coreSource, orchestratorSource) {
  const mutations = [
    [
      '"Trigger Admin V1 verified evidence publication preview v18"',
      '"Trigger Admin V1 staging security-header preview v11"',
    ],
    ["deriveDelta20VerifiedPublicationFinalTarget,", ""],
    [
      "function classifyDelta13EnvironmentMutationResult(result, contract)",
      "function classifyDelta13EnvironmentMutationOutcome(result, contract)",
    ],
    ['return "DEFINITIVE_CONFLICT";', 'return "DEFINITIVE_OTHER";'],
    ['return "DEFINITIVE_NOT_FOUND_BRANCH";', 'return "DEFINITIVE_NOT_FOUND";'],
    ['"--dangerously-skip-permissions"', '"--no-color"'],
    [
      "const PROTECTED_ACCESS_REVOKE_ATTEMPTS_MAXIMUM = 3",
      "const PROTECTED_ACCESS_REVOKE_ATTEMPTS_MAXIMUM = 1",
    ],
    [
      "activeProtectedAccessArtifact === null",
      "activeProtectedAccessArtifact !== null",
    ],
    ["  return requestBytes;", "  return Buffer.alloc(0);"],
    [
      "options.allowBoundedVercelApiInput === true &&\n" +
        "    command === NODE_EXECUTABLE",
      "options.allowBoundedVercelApiInput === false &&\n" +
        "    command === NODE_EXECUTABLE",
    ],
    [
      '"POST",\n          "--input",\n          "-",\n        ],\n        budgets,',
      '"POST",\n          "--input",\n          "environment-request.json",\n        ],\n        budgets,',
    ],
    [
      "    } finally {\n" +
        "      requestBytes.fill(0);\n" +
        "      recordDelta20SensitiveTransport(",
      "    } finally {\n" +
        "      void requestBytes;\n" +
        "      recordDelta20SensitiveTransport(",
    ],
    [
      "function runDelta13EnvironmentStdinLifecycleSelfTest()",
      "function runDelta13EnvironmentStdinLifecycleSelfTestDisabled()",
    ],
    [
      "persistDelta18QualifiedState(retained.root, startedState, plan);",
      "void startedState;",
    ],
    [
      "    renameSync(nextPath, targetPath);\n    nextCreated = false;",
      "    void targetPath;\n    nextCreated = false;",
    ],
    [
      "await executeDelta18DurableProjectionFinalRuntime();",
      "await executeDelta15FixtureQualifiedFinalRuntime();",
    ],
  ].map(([expected, replacement]) =>
    replaceExactlyOnce(orchestratorSource, expected, replacement),
  );
  return [
    delta13OrchestratorLifecycleContract(coreSource, orchestratorSource),
    mutations.every(
      (mutation) =>
        mutation !== null &&
        !delta13OrchestratorLifecycleContract(coreSource, mutation),
    ),
  ];
}

function runtimeFixtureAndPreviewCleanupRepairAssertions(orchestratorSource) {
  const requiredCoreFunctions = [
    "buildSubmittedToolInsertRows",
    "buildVercelDeploymentDeleteArgs",
    "classifyPreviewDeleteTransport",
  ];
  if (
    requiredCoreFunctions.some(
      (name) => typeof core[name] !== "function",
    )
  ) {
    return Array(7).fill(false);
  }
  try {
    const fixtures = [
      {
        role: "EDIT",
        row: {
          name: "Edit fixture",
          website: "https://edit.example.invalid",
          normalized_domain: "edit.example.invalid",
        },
      },
      {
        role: "REJECT",
        row: {
          name: "Reject fixture",
          website: "https://reject.example.invalid",
          normalized_domain: "reject.example.invalid",
        },
      },
      {
        role: "APPROVE",
        row: {
          name: "Approve fixture",
          website: "https://approve.example.invalid",
          normalized_domain: "approve.example.invalid",
        },
      },
    ];
    const insertRows = core.buildSubmittedToolInsertRows(fixtures);
    const deleteArgs = core.buildVercelDeploymentDeleteArgs({
      deployment_id: "dpl_Dynamic123",
      team_id: "team_Exact123",
    });
    const transportInput = {
      delta12_retained_preview_id: "dpl_Delta12Legacy",
      delta17a_retained_preview_id: "dpl_Delta17ARetained",
      deployment_id: "dpl_Dynamic123",
      existing_preview_deployment_id: "dpl_ExistingLegacy",
      phase_owned_retained_preview_id: "dpl_PhaseOwnedRetained",
      resume_mode: true,
    };
    const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
    const seedFixturesText =
      namedFunctionText(facts.root, "seedFixtures") ?? "";
    const deletePreviewText =
      namedFunctionText(facts.root, "deletePreview") ?? "";
    return [
      core.canonicalJson(insertRows) ===
          core.canonicalJson([
            {
              name: "Edit fixture",
              website: "https://edit.example.invalid",
            },
            {
              name: "Reject fixture",
              website: "https://reject.example.invalid",
            },
            {
              name: "Approve fixture",
              website: "https://approve.example.invalid",
            },
          ]) &&
        fixtures[0].row.normalized_domain === "edit.example.invalid" &&
        Object.isFrozen(insertRows) &&
        insertRows.every(
          (row) =>
            Object.isFrozen(row) &&
            !Object.hasOwn(row, "normalized_domain"),
        ),
      catches(() =>
        core.buildSubmittedToolInsertRows([
          fixtures[0],
          fixtures[1],
          {
            role: "APPROVE",
            row: {
              name: "Missing generated identity",
              website: "https://missing.example.invalid",
            },
          },
        ]),
      ),
      core.canonicalJson(deleteArgs) ===
          core.canonicalJson([
            "api",
            "/v13/deployments/dpl_Dynamic123?teamId=team_Exact123",
            "--method",
            "DELETE",
            "--dangerously-skip-permissions",
          ]) &&
        Object.isFrozen(deleteArgs),
      catches(() =>
        core.buildVercelDeploymentDeleteArgs({
          deployment_id: "not-a-deployment",
          team_id: "team_Exact123",
        }),
      ),
      core.classifyPreviewDeleteTransport(transportInput) ===
          "REST_V13_DELETE_BY_ID" &&
        core.classifyPreviewDeleteTransport({
          ...transportInput,
          deployment_id: transportInput.existing_preview_deployment_id,
        }) === "VERCEL_CLI_REMOVE_EXACT_POSTSTATE" &&
        core.classifyPreviewDeleteTransport({
          ...transportInput,
          deployment_id: transportInput.delta12_retained_preview_id,
        }) === "VERCEL_CLI_REMOVE_EXACT_POSTSTATE" &&
        core.classifyPreviewDeleteTransport({
          ...transportInput,
          deployment_id: transportInput.delta17a_retained_preview_id,
        }) === "VERCEL_CLI_REMOVE_EXACT_POSTSTATE" &&
        core.classifyPreviewDeleteTransport({
          ...transportInput,
          deployment_id: transportInput.phase_owned_retained_preview_id,
        }) === "VERCEL_CLI_REMOVE_EXACT_POSTSTATE" &&
        core.classifyPreviewDeleteTransport({
          ...transportInput,
          deployment_id: transportInput.existing_preview_deployment_id,
          resume_mode: false,
        }) === "REST_V13_DELETE_BY_ID",
      seedFixturesText.includes("buildSubmittedToolInsertRows(fixtures)"),
      deletePreviewText.includes("classifyPreviewDeleteTransport({") &&
        deletePreviewText.includes("buildVercelDeploymentDeleteArgs({"),
    ];
  } catch {
    return Array(7).fill(false);
  }
}

function delta15AuthFixtureQualificationAssertions(
  coreSource,
  orchestratorSource,
) {
  const requiredCoreFunctions = [
    "authorizeDelta15OfficialFixtureSetup",
    "classifySubmittedFixtureMarkerRows",
    "deriveFixtureSetupTransition",
    "validateDelta16ARouteQualificationEvidence",
  ];
  if (
    requiredCoreFunctions.some(
      (name) => typeof core[name] !== "function",
    )
  ) {
    return Array(14).fill(false);
  }
  try {
    const fixtures = [
      {
        role: "EDIT",
        row: {
          category: "Productivity",
          description: "Qualification fixture",
          logo_url: null,
          name: "Qualification edit",
          normalized_domain: "qualification-edit.example.invalid",
          pricing: "Free",
          status: "pending",
          submitter_email: "phase34ia@example.invalid",
          submitter_name: "AiFinder Phase 34IA",
          website: "https://qualification-edit.example.invalid",
        },
      },
      {
        role: "REJECT",
        row: {
          category: "Productivity",
          description: "Qualification fixture",
          logo_url: null,
          name: "Qualification reject",
          normalized_domain: "qualification-reject.example.invalid",
          pricing: "Free",
          status: "pending",
          submitter_email: "phase34ia@example.invalid",
          submitter_name: "AiFinder Phase 34IA",
          website: "https://qualification-reject.example.invalid",
        },
      },
      {
        role: "APPROVE",
        row: {
          category: "Productivity",
          description: "Qualification fixture",
          logo_url: null,
          name: "Qualification approve",
          normalized_domain: "qualification-approve.example.invalid",
          pricing: "Free",
          status: "pending",
          submitter_email: "phase34ia@example.invalid",
          submitter_name: "AiFinder Phase 34IA",
          website: "https://qualification-approve.example.invalid",
        },
      },
    ];
    const insertRows = core.buildSubmittedToolInsertRows(fixtures);
    const exactRows = fixtures.map((fixture, index) => ({
      id: index + 101,
      name: fixture.row.name,
      normalized_domain: fixture.row.normalized_domain,
      status: "pending",
      website: fixture.row.website,
    }));
    const transitionInput = {
      application_requests_1_to_5_completed_once: true,
      attempt: 1,
      cleanup_verified: false,
      marker_state: "EMPTY",
      maximum_attempts: 6,
      mode: "QUALIFICATION",
      request_6_started: false,
      response_state: "REJECTED",
      route_mutation_started: false,
      unrelated_rows_deleted: 0,
      unrelated_rows_modified: 0,
    };
    const officialInput = {
      application_requests_completed: 5,
      fixture_insert_attempt: 2,
      fixture_insert_attempts_maximum: 3,
      repeated_application_requests_1_to_5: 0,
      request_6_started: false,
      route_mutation_started: false,
      runtime_sessions: 1,
    };
    const writableColumns = [
      "category",
      "description",
      "logo_url",
      "name",
      "pricing",
      "status",
      "submitter_email",
      "submitter_name",
      "website",
    ];
    const qualificationEvidence = {
      application_requests: 9,
      audit_rows_created: 1,
      audit_rows_remaining: 0,
      canonical_relationship: "APPLICATION_URL_TOSTRING_ROOT",
      exact_fixture_ids_bound: 3,
      exact_fixture_rows_created: 3,
      exact_fixture_rows_remaining: 0,
      fixture_binding: "3_OF_3_PENDING",
      input_and_stored_hashes_differ: true,
      logo_objects_created: 0,
      request8_has_terminal_slash: false,
      request8_input_sha256: "1".repeat(64),
      request8_is_invalid_tld: true,
      request9_expected_has_terminal_slash: true,
      request9_expected_stored_sha256: "2".repeat(64),
      request9_positive_tool_id: true,
      request9_unique_match_count: 1,
      route_mutations: 1,
      storage_requests: 0,
      tool_rows_created: 1,
      tool_rows_remaining: 0,
      unrelated_rows_deleted: 0,
      unrelated_rows_modified: 0,
    };
    const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
    const qualificationText =
      namedFunctionText(facts.root, "runDelta15AuthFixtureQualificationCycle") ?? "";
    const runtimeText =
      namedFunctionText(facts.root, "runRuntimeSession") ?? "";
    const officialSetupText =
      namedFunctionText(
        facts.root,
        "setupSubmittedFixturesBeforeRequestSix",
      ) ?? "";
    const qualificationCleanupText =
      namedFunctionText(facts.root, "cleanupDelta15QualificationFixtures") ?? "";
    const branchRegistrationText =
      namedFunctionText(facts.root, "createDelta14RegistrationCommit") ?? "";
    return [
      coreSource.includes(
        '"aifinder-phase-34ia-evidence-publication-runtime-validation-v3"',
      ) &&
        coreSource.includes(
          '"Register AiFinder evidence publication runtime branch without deployment"',
        ) &&
        orchestratorSource.includes(
          '"Trigger Admin V1 verified evidence publication preview v18"',
        ) &&
        branchRegistrationText.includes("GIT_INDEX_FILE"),
      insertRows.length === 3 &&
        insertRows.every((row) => !Object.hasOwn(row, "normalized_domain")),
      insertRows.every(
        (row) =>
          core.canonicalJson(Object.keys(row).sort()) ===
          core.canonicalJson(writableColumns),
      ) &&
        catches(() =>
          core.buildSubmittedToolInsertRows([
            {
              ...fixtures[0],
              row: { ...fixtures[0].row, created_at: "forbidden" },
            },
            fixtures[1],
            fixtures[2],
          ]),
        ),
      core.classifySubmittedFixtureMarkerRows({
        fixtures,
        rows: exactRows,
      }).state === "EXACT_THREE_PENDING",
      core.deriveFixtureSetupTransition(transitionInput) ===
        "RETRY_INSERT_AFTER_EMPTY_REJECTION" &&
        officialSetupText.includes(
          "fixtureMarkerReconciliationRequired(responseState)",
        ),
      core.deriveFixtureSetupTransition({
        ...transitionInput,
        marker_state: "EXACT_THREE_PENDING",
        response_state: "LOST",
      }) === "ADOPT_RECONCILED_EXACT_THREE",
      core.deriveFixtureSetupTransition({
        ...transitionInput,
        marker_state: "PARTIAL_PHASE_ROWS",
        response_state: "LOST",
      }) === "CLEAN_EXACT_MARKER_ROWS_BEFORE_RETRY",
      catches(() =>
        core.deriveFixtureSetupTransition({
          ...transitionInput,
          unrelated_rows_deleted: 1,
        }),
      ) &&
        qualificationCleanupText.includes("exactPhaseOwnedIds"),
      core.classifySubmittedFixtureMarkerRows({
        fixtures,
        rows: exactRows.map((row) => ({ ...row })),
      }).bound_ids.length === 3 &&
        qualificationText.includes("maximumOrdinal: 15") &&
        qualificationText.includes("route_created_tools: 1") &&
        runtimeText.includes("plan.requests.slice(0, maximumOrdinal)"),
      core.validateDelta16ARouteQualificationEvidence(
        qualificationEvidence,
      ).exact_fixture_rows_remaining === 0 &&
        qualificationCleanupText.includes("VERIFY_QUALIFICATION_FIXTURE_ABSENCE"),
      core.validateDelta16ARouteQualificationEvidence(
        qualificationEvidence,
      ).route_mutations === 1 &&
        qualificationEvidence.tool_rows_created === 1 &&
        qualificationEvidence.audit_rows_created === 1 &&
        qualificationEvidence.logo_objects_created === 0 &&
        qualificationEvidence.storage_requests === 0,
      core.authorizeDelta15OfficialFixtureSetup(officialInput)
        .fixture_insert_attempt === 2 &&
        officialSetupText.includes("application_requests_completed: 5"),
      catches(() =>
        core.authorizeDelta15OfficialFixtureSetup({
          ...officialInput,
          request_6_started: true,
        }),
      ) &&
        catches(() =>
          core.authorizeDelta15OfficialFixtureSetup({
            ...officialInput,
            route_mutation_started: true,
          }),
        ),
      runtimeText.includes("cookieJar.clear()") &&
        runtimeText.includes("logoPayload.bytes.fill(0)") &&
        qualificationText.includes("cleanupFixtures({") &&
        qualificationText.includes(
          "readDelta17SanitizedPoststateProjection({",
        ) &&
        qualificationText.includes("fixtureState.markCleaned()") &&
        qualificationCleanupText.includes("unrelated_rows_deleted: 0") &&
        orchestratorSource.includes("deleteDelta13EnvironmentRecords({") &&
        orchestratorSource.includes("deleteTemporaryBranch(context)"),
    ];
  } catch {
    return Array(14).fill(false);
  }
}

function delta15QualificationCleanupReserveAssertions(orchestratorSource) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const setupText =
    namedFunctionText(
      facts.root,
      "setupSubmittedFixturesBeforeRequestSix",
    ) ?? "";
  const cycleText =
    namedFunctionText(
      facts.root,
      "runDelta15AuthFixtureQualificationCycle",
    ) ?? "";
  const attemptText =
    namedFunctionText(
      facts.root,
      "performDelta13AuthQualificationAttempt",
    ) ?? "";
  const qualifyText =
    namedFunctionText(facts.root, "qualifyDelta14LegacyAuthPreview") ?? "";
  return [
    setupText.includes('remaining("directDataMaximum") < 5'),
    cycleText.includes("fixtureState.setRows(rows)") &&
      cycleText.includes("fixtureState.markCleaned()"),
    attemptText.includes("fixtureState,") &&
      attemptText.includes("fixtureState,") &&
      cycleText.includes("typeof fixtureState.setRows !== \"function\"") &&
      cycleText.includes("typeof fixtureState.markCleaned !== \"function\""),
    qualifyText.includes("context.direct = qualificationDirect") &&
      qualifyText.includes("cleanupDelta18QualificationLogoutAudit({") &&
      qualifyText.includes("context.dataCleaned = true") &&
      qualifyText.includes("context.direct = null"),
  ];
}

function delta15QualificationRecoveryAssertions(
  coreSource,
  orchestratorSource,
) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const qualifyText =
    namedFunctionText(facts.root, "qualifyDelta14LegacyAuthPreview") ?? "";
  const recoverText =
    namedFunctionText(facts.root, "recoverDelta15AuthQualification") ?? "";
  const targetText =
    namedFunctionText(
      facts.root,
      "identifyDelta15FixtureQualifiedFinalTarget",
    ) ?? "";
  const runtimeText =
    namedFunctionText(
      facts.root,
      "executeDelta15FixtureQualifiedFinalRuntime",
    ) ?? "";
  const previewOrdinalText =
    namedFunctionText(
      facts.root,
      "validateDelta15RecoveryPhasePreviewOrdinal",
    ) ?? "";
  const stateValidatorText =
    namedFunctionText(facts.root, "validateDelta13AuthState") ?? "";
  const inventoryBudgetText =
    namedFunctionText(
      facts.root,
      "delta13InventoryTraversalBudgetIsValid",
    ) ?? "";
  const recoveredCommitText =
    namedFunctionText(
      facts.root,
      "validateDelta15RecoveredCommitPair",
    ) ?? "";
  const recoveryValidatorText =
    namedFunctionText(
      facts.root,
      "validateDelta15QualificationRecovery",
    ) ?? "";
  const candidateDivergenceText =
    namedFunctionText(
      facts.root,
      "validateDelta15ActivationCandidateDivergence",
    ) ?? "";
  const targetDeriveText =
    namedFunctionText(
      facts.root,
      "deriveDelta16AStoredCanonicalRouteQualifiedFinalAuthorization",
    ) ?? "";
  const finderText =
    namedFunctionText(facts.root, "findDelta15QualificationRecoveryRoot") ??
    "";
  const scrubText =
    namedFunctionText(facts.root, "scrubExternalTempSecrets") ?? "";
  const completion = core.validateDelta15QualificationCompletion;
  let completionValid = false;
  let underMinimumRejected = false;
  if (typeof completion === "function") {
    try {
      const validated = completion({
        current_direct_requests: 3,
        prior_direct_requests: 3,
        qualification_cycles: 2,
        qualification_requests: 12,
        recovered: true,
      });
      completionValid =
        validated.current_direct_requests === 3 &&
        validated.total_direct_requests === 6 &&
        validated.qualification_cycles === 2 &&
        validated.qualification_requests === 12 &&
        validated.recovered === true &&
        Object.isFrozen(validated);
      underMinimumRejected = catches(() =>
        completion({
          current_direct_requests: 2,
          prior_direct_requests: 3,
          qualification_cycles: 2,
          qualification_requests: 12,
          recovered: true,
        }),
      );
    } catch {
      completionValid = false;
    }
  }
  return [
    completionValid,
    underMinimumRejected,
    coreSource.includes("export function validateDelta15QualificationCompletion"),
    finderText.includes("DEPLOYMENT_STATE_FILENAME") &&
      finderText.includes("DELTA13_AUTH_STATE_FILENAME") &&
      finderText.includes("DELTA15_QUALIFICATION_RECOVERY_ROOT_ENTRIES"),
    !qualifyText.includes("findDelta15QualificationRecoveryRoot(plan)") &&
      !qualifyText.includes("await recoverDelta15AuthQualification({") &&
      qualifyText.includes("createDelta14RegistrationCommit({") &&
      qualifyText.includes("performDelta18IdentityQualificationAttempt({"),
    recoverText.includes("resolveExactHeaderQualifiedPreview(") &&
      recoverText.includes("verifyDelta15TemporaryBranchAbsentTwice(") &&
      recoverText.includes("captureDelta13EnvironmentSnapshot(") &&
      recoverText.includes("performDelta13AuthQualificationAttempt({") &&
      recoverText.includes("acquireResumeExecutionLock()") &&
      recoverText.includes("releaseResumeExecutionLock(executionLock)") &&
      recoverText.includes(
        "budgets.used.authQualificationRequests > 6",
      ),
    !recoverText.includes("createDelta13EnvironmentRecords({") &&
      !recoverText.includes("pushDelta14RegistrationBranch(") &&
      !recoverText.includes("fastForwardDelta14ActivationBranch(") &&
      !recoverText.includes("createDelta14RegistrationCommit({") &&
      !recoverText.includes("createDelta14ActivationCommit({"),
    previewOrdinalText.includes('meta.githubCommitRef === plan.branch') &&
      previewOrdinalText.includes('meta.githubCommitRepo === "aifinder"') &&
      previewOrdinalText.includes('meta.githubCommitOrg === "jcdumaua"') &&
      previewOrdinalText.includes("phaseRecords.length !== 1") &&
      recoverText.includes(
        "validateDelta15RecoveryPhasePreviewOrdinal(",
      ) &&
      targetText.includes(
        "validateDelta15RecoveryPhasePreviewOrdinal(",
      ) &&
      runtimeText.includes(
        "validateDelta15RecoveryPhasePreviewOrdinal(",
      ),
    inventoryBudgetText.includes(
      "recovered ? traversals === (targetBound ? 2 : 1)",
    ) &&
      inventoryBudgetText.includes("traversals >= 2") &&
      stateValidatorText.includes(
        "delta13InventoryTraversalBudgetIsValid(",
      ),
    candidateDivergenceText.includes(
      'scope !== "AUTHORIZED_NONAPPLICATION_HARNESS_ONLY"',
    ) &&
      recoveredCommitText.includes("blobDriftPaths.push(entry.path)") &&
      !recoveredCommitText.includes(
        'fail("DELTA15_QUALIFICATION_RECOVERY_CANDIDATE_DRIFT")',
      ) &&
      recoverText.includes(
        "activation_candidate_divergence:",
      ) &&
      recoveryValidatorText.includes(
        "validateDelta15ActivationCandidateDivergence(",
      ) &&
      targetDeriveText.includes(
        "readDelta17SanitizedPoststateProjection({",
      ) &&
      targetDeriveText.includes(
        "branchEnvCleanupEvidenceSha256",
      ),
    stateValidatorText.includes("qualification_recovery") &&
      stateValidatorText.includes("schema_version === 6") &&
      orchestratorSource.includes("resumeState: EXISTING_PREVIEW_RESUME_STATE") &&
      scrubText.includes("entry === DELTA13_AUTH_STATE_FILENAME"),
  ];
}

function delta14BranchRegistrationOrderingAssertions(
  coreSource,
  orchestratorSource,
) {
  const requiredCoreFunctions = [
    "authorizeDelta14BranchOperation",
    "validateDelta14ActivationCommit",
    "validateDelta14RegistrationCommit",
  ];
  if (
    requiredCoreFunctions.some(
      (name) => typeof core[name] !== "function",
    )
  ) {
    return Array(14).fill(false);
  }
  try {
    const registrationCommit = "a".repeat(40);
    const activationCommit = "b".repeat(40);
    const registration = {
      baseline: BASELINE,
      branch: BRANCH,
      candidate_path_changes: 0,
      changed_paths: ["vercel.json"],
      commit_sha: registrationCommit,
      main_index_vercel_json_present: false,
      marker_present: false,
      parent_sha: BASELINE,
      subject: "Register AiFinder evidence publication runtime branch without deployment",
      vercel_json_bytes: 184,
      vercel_json_lf: 8,
      vercel_json_mode: "100644",
      vercel_json_sha256:
        "2a4aac1c038892c42f499100077a443bfc17b50187f5eb020dfd066f96a77f7c",
      working_tree_vercel_json_present: false,
    };
    const activation = {
      activation_commit_sha: activationCommit,
      authorized_candidate_manifest_sha256: "1".repeat(64),
      authorized_candidate_path_count: 18,
      branch: BRANCH,
      main_index_vercel_json_present: false,
      marker_sha256: MARKER_SHA256,
      parent_sha: registrationCommit,
      registration_commit_sha: registrationCommit,
      subject: "Trigger Admin V1 verified evidence publication preview v18",
      unauthorized_path_changes: 0,
      vercel_json_present: false,
      working_tree_vercel_json_present: false,
    };
    const operation = {
      activation_candidate_exact: true,
      activation_commit_sha: activationCommit,
      activation_marker_sha256: MARKER_SHA256,
      activation_parent_sha: registrationCommit,
      activation_push_type: "ORDINARY_FAST_FORWARD",
      activation_vercel_json_present: false,
      admin_password_exact_branch_records: 1,
      admin_session_secret_exact_branch_records: 1,
      final_staged_paths: [...EXPECTED_AUTHORIZED_REPOSITORY_PATHS],
      main_index_vercel_json_present: false,
      operation: "CREATE_ENVIRONMENT_RECORD",
      registration_commit_sha: registrationCommit,
      registration_unexpected_deployments: 0,
      registration_zero_deployment_proven: true,
      remote_branch_sha: registrationCommit,
      working_tree_vercel_json_present: false,
    };
    const registrationResult =
      core.validateDelta14RegistrationCommit(registration);
    const activationResult =
      core.validateDelta14ActivationCommit(activation);
    const environmentGate =
      core.authorizeDelta14BranchOperation(operation);
    const activationGate = core.authorizeDelta14BranchOperation({
      ...operation,
      operation: "PUSH_ACTIVATION",
    });
    const finalStageGate = core.authorizeDelta14BranchOperation({
      ...operation,
      operation: "FINAL_MAIN_STAGE",
    });
    const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
    const requiredOrchestratorFunctions = [
      "bindUnexpectedDelta14RegistrationDeployment",
      "classifyDelta14ActivationInventory",
      "createDelta13EnvironmentRecord",
      "createDelta14ActivationCommit",
      "createDelta14RegistrationCommit",
      "fastForwardDelta14ActivationBranch",
      "guardDelta14ActivationInventory",
      "proveDelta14RegistrationZeroDeployment",
      "pushDelta14RegistrationBranch",
      "qualifyDelta14LegacyAuthPreview",
      "reconcileDelta14RegistrationPush",
      "runDelta14ActivationInventoryGuardSelfTest",
      "buildDelta13EnvironmentCreateRequest",
    ];
    const requiredTexts = Object.fromEntries(
      requiredOrchestratorFunctions.map((name) => [
        name,
        namedFunctionText(facts.root, name) ?? "",
      ]),
    );
    const transactionText = Object.values(requiredTexts).join("\n");
    return [
      catches(() =>
        core.authorizeDelta14BranchOperation({
          ...operation,
          registration_zero_deployment_proven: false,
        }),
      ) &&
        catches(() =>
          core.authorizeDelta14BranchOperation({
            ...operation,
            remote_branch_sha: null,
          }),
        ),
      registrationResult.commit_sha === registrationCommit &&
        registrationResult.vercel_json_only === true,
      catches(() =>
        core.validateDelta14RegistrationCommit({
          ...registration,
          candidate_path_changes: 1,
        }),
      ) &&
        catches(() =>
          core.validateDelta14RegistrationCommit({
            ...registration,
            marker_present: true,
          }),
        ) &&
        catches(() =>
          core.validateDelta14RegistrationCommit({
            ...registration,
            parent_sha: "9".repeat(40),
          }),
        ),
      activationResult.activation_commit_sha === activationCommit &&
        activationResult.registration_commit_sha === registrationCommit,
      catches(() =>
        core.validateDelta14ActivationCommit({
          ...activation,
          vercel_json_present: true,
        }),
      ),
      catches(() =>
        core.validateDelta14ActivationCommit({
          ...activation,
          authorized_candidate_path_count: 17,
        }),
      ) &&
        catches(() =>
          core.validateDelta14ActivationCommit({
            ...activation,
            marker_sha256: "9".repeat(64),
          }),
        ),
      catches(() =>
        core.authorizeDelta14BranchOperation({
          ...operation,
          main_index_vercel_json_present: true,
        }),
      ) &&
        catches(() =>
          core.authorizeDelta14BranchOperation({
            ...operation,
            working_tree_vercel_json_present: true,
          }),
        ),
      environmentGate.operation === "CREATE_ENVIRONMENT_RECORD" &&
        environmentGate.authorized === true,
      activationGate.operation === "PUSH_ACTIVATION" &&
        catches(() =>
          core.authorizeDelta14BranchOperation({
            ...operation,
            operation: "PUSH_ACTIVATION",
            admin_session_secret_exact_branch_records: 0,
          }),
        ),
      catches(() =>
        core.authorizeDelta14BranchOperation({
          ...operation,
          registration_unexpected_deployments: 1,
        }),
      ) &&
        requiredTexts.bindUnexpectedDelta14RegistrationDeployment.includes(
          "validateCleanupResolution(",
        ) &&
        !requiredTexts.bindUnexpectedDelta14RegistrationDeployment.includes(
          "validateResolvedPreview(",
        ) &&
        transactionText.includes(
          "REGISTRATION_COMMIT_UNEXPECTEDLY_DEPLOYED",
        ) &&
        transactionText.includes("deleteTemporaryBranch"),
      activationGate.push_type === "ORDINARY_FAST_FORWARD" &&
        requiredTexts.qualifyDelta14LegacyAuthPreview.includes(
          "guardDelta14ActivationInventory",
        ) &&
        requiredTexts.qualifyDelta14LegacyAuthPreview.includes(
          "registration_cleanup_resolved:",
        ) &&
        requiredTexts.guardDelta14ActivationInventory.includes(
          "bindUnexpectedDelta14RegistrationDeployment",
        ) &&
        requiredTexts.guardDelta14ActivationInventory.includes(
          "deleteAndVerifyPreview",
        ) &&
        requiredTexts.guardDelta14ActivationInventory.includes(
          "resetPreviewCleanupState(context)",
        ) &&
        orchestratorSource.includes(
          "function resetPreviewCleanupState(context)",
        ) &&
        orchestratorSource.includes(
          "await runPreviewCleanupIdentitySwitchSelfTest(plan)",
        ) &&
        orchestratorSource.includes(
          "delete:dpl_Delta18RegistrationCleanup",
        ) &&
        orchestratorSource.includes(
          "delete:dpl_Delta18ActivationCleanup",
        ) &&
        requiredTexts.guardDelta14ActivationInventory.includes(
          "context.registrationCleanupResolved = false",
        ) &&
        requiredTexts.guardDelta14ActivationInventory.includes(
          "context.registrationCleanupResolved = true",
        ) &&
        requiredTexts.classifyDelta14ActivationInventory.includes(
          "DELTA14_PHASE_BRANCH_DEPLOYMENT_IDENTITY",
        ) &&
        requiredTexts.classifyDelta14ActivationInventory.includes(
          "DELTA14_REGISTRATION_POST_ACTIVATION_AMBIGUOUS",
        ) &&
        requiredTexts.runDelta14ActivationInventoryGuardSelfTest.includes(
          "wrongShaContext.registrationCleanupResolved !== false",
        ) &&
        requiredTexts.runDelta14ActivationInventoryGuardSelfTest.includes(
          "missingShaContext.registrationCleanupResolved !== false",
        ) &&
        requiredTexts.runDelta14ActivationInventoryGuardSelfTest.includes(
          "duplicateRegistrationContext.registrationCleanupResolved !== false",
        ) &&
        orchestratorSource.includes(
          "input.registration_cleanup_resolved",
        ) &&
        orchestratorSource.includes(
          "runDelta14ActivationInventoryGuardSelfTest(plan)",
        ) &&
        catches(() =>
          core.authorizeDelta14BranchOperation({
            ...operation,
            activation_push_type: "FORCE_WITH_LEASE",
            operation: "PUSH_ACTIVATION",
          }),
        ),
      finalStageGate.operation === "FINAL_MAIN_STAGE" &&
        finalStageGate.authorized_path_count === 18 &&
        core.createRuntimePlan().budgets.git_remote_reads_maximum === 42 &&
        catches(() =>
          core.authorizeDelta14BranchOperation({
            ...operation,
            final_staged_paths: [
              ...EXPECTED_AUTHORIZED_REPOSITORY_PATHS,
              "vercel.json",
            ],
            operation: "FINAL_MAIN_STAGE",
          }),
        ),
      transactionText.includes("deleteDelta13EnvironmentRecords") &&
        transactionText.includes("deleteTemporaryBranch") &&
        transactionText.includes("phase_owned_record_id"),
      requiredOrchestratorFunctions.every(
        (name) => requiredTexts[name].length > 0,
      ) &&
        transactionText.includes("GIT_INDEX_FILE") &&
        transactionText.includes("gitBranch: DELTA13_BRANCH") &&
        transactionText.includes('type: "sensitive"') &&
        requiredTexts.createDelta13EnvironmentRecord.includes(
          "DELTA14_ENVIRONMENT_CREATE_SUCCESS_UNRECONCILED",
        ) &&
        requiredTexts.createDelta13EnvironmentRecord.includes(
          "if (requestSucceeded)",
        ) &&
        !transactionText.includes("git add") &&
        !transactionText.includes("rm -rf") &&
        requiredTexts.pushDelta14RegistrationBranch.includes(
          "`--force-with-lease=${branchRef}:`",
        ) &&
        requiredTexts.pushDelta14RegistrationBranch.includes(
          "reconcileDelta14RegistrationPush(",
        ) &&
        requiredTexts.reconcileDelta14RegistrationPush.includes(
          "consecutiveAbsentObservations",
        ) &&
        requiredTexts.reconcileDelta14RegistrationPush.includes(
          'fail("DELTA18_REGISTRATION_RECONCILIATION_UNREADABLE")',
        ) &&
        orchestratorSource.includes(
          'CREATE_RESULT_OBSERVED: Object.freeze([\n    "CREATE_REF_ABSENT",\n    "CREATE_REF_OURS",\n    "CREATE_REF_OTHER",\n    "DELETE_REQUESTED",',
        ) &&
        orchestratorSource.includes(
          'CREATE_REF_ABSENT: Object.freeze([\n    "CREATE_REF_ABSENT",\n    "CREATE_REF_OURS",\n    "CREATE_REF_OTHER",\n    "DELETE_REQUESTED",',
        ) &&
        requiredTexts.fastForwardDelta14ActivationBranch.includes(
          "`--force-with-lease=${branchRef}:${registrationCommitSha}`",
        ) &&
        !transactionText.includes('"--force"'),
    ];
  } catch {
    return Array(14).fill(false);
  }
}

async function delta12ProtectedAccessAssertions() {
  const requiredFunctions = [
    "deriveDelta12ProtectedAccessTarget",
    "projectProtectedAccessHandshake",
    "projectVercelOidcToken",
    "runProtectedAccessCredentialLifecycle",
    "validateDelta12ProtectedAccessAuthorization",
    "validateProjectBypassTransition",
    "validateProtectedAccessOperation",
    "validateProtectedAccessProbe",
    "withProtectedAccessCredential",
  ];
  if (requiredFunctions.some((name) => typeof core[name] !== "function")) {
    return Array(14).fill(false);
  }
  try {
    const exactOrigin = "https://phase-owned-preview.example.invalid";
    const redirectHeaders = Buffer.from(
      [
        "HTTP/1.1 307 Temporary Redirect",
        "Location: https://vercel.com/sso-api?secret=must-be-erased",
        "Set-Cookie: protection=must-be-erased; Secure; HttpOnly",
        "",
        "",
      ].join("\r\n"),
      "utf8",
    );
    const redirectBody = Buffer.from(
      "<html>Vercel Authentication must-be-erased</html>",
      "utf8",
    );
    const redirect = core.projectProtectedAccessHandshake({
      raw_body_bytes: redirectBody,
      raw_header_bytes: redirectHeaders,
      status: 307,
    });
    const applicationHeaders = delta12RawApplicationHeaders();
    const applicationBody = Buffer.from('{"error":"Unauthorized"}', "utf8");
    const application = core.projectProtectedAccessHandshake({
      raw_body_bytes: applicationBody,
      raw_header_bytes: applicationHeaders,
      status: 401,
    });
    const validProbe = {
      admin_auth: false,
      cookies: false,
      csrf: false,
      data_credentials: false,
      database_requests: 0,
      expected_origin: exactOrigin,
      method: "GET",
      path: "/api/admin/tools",
      redirect_following: false,
      request_body: false,
      request_origin: exactOrigin,
      data_writes: 0,
    };
    const probe = core.validateProtectedAccessProbe(validProbe);

    const oidcCredential = Buffer.from("synthetic.oidc.credential", "ascii");
    let oidcObserved = null;
    let oidcHeaderAfter = null;
    const oidcResult = await core.withProtectedAccessCredential(
      {
        access_mode: "SELF_PROJECT_OIDC",
        credential_bytes: oidcCredential,
        expected_origin: exactOrigin,
        request_origin: exactOrigin,
      },
      async (headers) => {
        oidcObserved = Object.freeze({
          name: headers.header_name,
          value_matches: headers.header_value.equals(oidcCredential),
        });
        oidcHeaderAfter = headers.header_value;
        return "OIDC_SENT";
      },
    );
    let mismatchedOriginSent = false;
    const mismatchedOriginRejected = await catchesAsync(async () =>
      core.withProtectedAccessCredential(
        {
          access_mode: "SELF_PROJECT_OIDC",
          credential_bytes: Buffer.from("synthetic.oidc.credential", "ascii"),
          expected_origin: exactOrigin,
          request_origin: "https://other-preview.example.invalid",
        },
        async () => {
          mismatchedOriginSent = true;
        },
      ),
    );

    const bypassCredential = Buffer.from("B".repeat(32), "ascii");
    let bypassObserved = null;
    let bypassHeaderAfter = null;
    const bypassResult = await core.withProtectedAccessCredential(
      {
        access_mode: "TEMPORARY_AUTOMATION_BYPASS",
        credential_bytes: bypassCredential,
        expected_origin: exactOrigin,
        request_origin: exactOrigin,
      },
      async (headers) => {
        bypassObserved = Object.freeze({
          name: headers.header_name,
          value_matches: headers.header_value.equals(bypassCredential),
        });
        bypassHeaderAfter = headers.header_value;
        return "BYPASS_SENT";
      },
    );

    const nowSeconds = 1_800_000_000;
    const oidcPayload = {
      aud: "https://vercel.com/ai-finder-s-projects",
      environment: "development",
      exp: nowSeconds + 3_600,
      iss: "https://oidc.vercel.com/ai-finder-s-projects",
      nbf: nowSeconds - 10,
      owner: "ai-finder-s-projects",
      owner_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
      project: "aifinder",
      project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
    };
    const oidcTokenBytes = Buffer.from(
      [
        Buffer.from('{"alg":"RS256","typ":"JWT"}', "utf8").toString(
          "base64url",
        ),
        Buffer.from(JSON.stringify(oidcPayload), "utf8").toString(
          "base64url",
        ),
        Buffer.from("synthetic-signature", "ascii").toString("base64url"),
      ].join("."),
      "ascii",
    );
    const oidcProjection = core.projectVercelOidcToken({
      expected_project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
      expected_project_name: "aifinder",
      expected_team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
      expected_team_slug: "ai-finder-s-projects",
      now_seconds: nowSeconds,
      token_bytes: oidcTokenBytes,
    });

    const bypassTransition = core.validateProjectBypassTransition({
      environment_designated_record_present_after: true,
      environment_designated_record_present_before: true,
      generated_exact_secret_recognized: true,
      post_generation_bypass_count_delta: "PLUS_ONE",
      post_revoke_bypass_record_count: "ONE",
      pre_bypass_record_count: "ONE",
      temporary_secret_no_longer_bypasses: true,
      trusted_sources_self_entry_present_after: true,
      trusted_sources_self_entry_present_before: true,
    });

    async function lifecycleCase(kind) {
      const credential = Buffer.from("C".repeat(32), "ascii");
      const events = [];
      let signalHandler = null;
      let caughtCode = null;
      let result = null;
      try {
        result = await core.runProtectedAccessCredentialLifecycle(
          {
            access_mode: "TEMPORARY_AUTOMATION_BYPASS",
            credential_bytes: credential,
          },
          {
            activate: async (activeCredential) => {
              events.push(`activate:${activeCredential.byteLength}`);
              if (kind === "ACTIVATE_ERROR") {
                throw Object.assign(new Error("synthetic activation error"), {
                  code: "SYNTHETIC_ACTIVATION_ERROR",
                });
              }
              return "ACTIVE";
            },
            install_signal_handlers: (handler) => {
              signalHandler = handler;
              events.push("signals:installed");
              return () => events.push("signals:removed");
            },
            revoke: async (activeCredential, reason) => {
              events.push(
                `revoke:${reason}:${activeCredential.equals(Buffer.from("C".repeat(32), "ascii"))}`,
              );
            },
            use: async () => {
              events.push("use");
              if (kind === "USE_ERROR") {
                throw Object.assign(new Error("synthetic use error"), {
                  code: "SYNTHETIC_USE_ERROR",
                });
              }
              if (kind === "SIGNAL") await signalHandler("SIGTERM");
              return "USED";
            },
            verify_restored: async () => {
              events.push("restored");
              return true;
            },
          },
        );
      } catch (caught) {
        caughtCode = caught?.code ?? caught?.message ?? "OTHER";
      }
      return Object.freeze({
        caughtCode,
        credentialErased: credential.every((byte) => byte === 0),
        events: Object.freeze(events),
        result,
      });
    }
    const lifecycleCases = await Promise.all([
      lifecycleCase("SUCCESS"),
      lifecycleCase("USE_ERROR"),
      lifecycleCase("SIGNAL"),
      lifecycleCase("ACTIVATE_ERROR"),
    ]);

    const guardedOperations = ["BRANCH_PUSH", "PREVIEW_BUILD"].map(
      (operation) =>
        catches(() =>
          core.validateProtectedAccessOperation({
            credential_active: true,
            operation,
            protected_access_target_confirmed: false,
          }),
        ),
    );
    const runtimeBeforeTargetRejected = catches(() =>
      core.validateProtectedAccessOperation({
        credential_active: false,
        operation: "OFFICIAL_RUNTIME_START",
        protected_access_target_confirmed: false,
      }),
    );
    const runtimeAfterTarget = core.validateProtectedAccessOperation({
      credential_active: false,
      operation: "OFFICIAL_RUNTIME_START",
      protected_access_target_confirmed: true,
    });

    const targetInput = {
      access_mode: "SELF_PROJECT_OIDC",
      authorized_path_manifest_sha256: "1".repeat(64),
      baseline: BASELINE,
      canonical_orchestrator_sha256: "2".repeat(64),
      credential_lifecycle_contract: "DELTA12_OIDC_EPHEMERAL_V1",
      header_contract_version: "DELTA11_SECURITY_HEADER_V1",
      manifest_runtime_surface_sha256: "3".repeat(64),
      passing_commit: "4".repeat(40),
      passing_preview_id: "dpl_SyntheticProtectedAccessPreview",
      project_id: "prj_BPaQVKdElriAhxabhoTkg8LysQ5R",
      reviewed_pre_aggregate_sha256: "5".repeat(64),
      reviewed_stable_surface_sha256: "6".repeat(64),
      team_id: "team_9POJYxNnjIBbrQ19My8M5yG3",
      temporary_branch: DELTA11_BRANCH,
      testing_tree_sha256: "7".repeat(64),
    };
    const target = core.deriveDelta12ProtectedAccessTarget(targetInput);
    const expectedTarget = createHash("sha256")
      .update(
        [
          "AIFINDER_PHASE_34IA_DELTA12_PROTECTED_ACCESS_RUNTIME_V1",
          targetInput.team_id,
          targetInput.project_id,
          targetInput.passing_preview_id,
          targetInput.temporary_branch,
          targetInput.passing_commit,
          targetInput.baseline,
          targetInput.access_mode,
          targetInput.credential_lifecycle_contract,
          targetInput.header_contract_version,
          targetInput.authorized_path_manifest_sha256,
          targetInput.canonical_orchestrator_sha256,
          targetInput.reviewed_pre_aggregate_sha256,
          targetInput.reviewed_stable_surface_sha256,
          targetInput.manifest_runtime_surface_sha256,
          targetInput.testing_tree_sha256,
        ].join("|"),
        "utf8",
      )
      .digest("hex");

    return [
      redirect.access_disposition === "PROTECTION_LAYER_NOT_APPLICATION",
      application.access_disposition ===
        "APPLICATION_UNAUTHENTICATED_DENIAL" &&
        application.security_header_projection.disposition ===
          "PASS_EXACT_APPLICATION_HEADER_CONTRACT",
      oidcResult === "OIDC_SENT" &&
        oidcObserved?.name === "x-vercel-trusted-oidc-idp-token" &&
        oidcObserved.value_matches === true &&
        oidcHeaderAfter.every((byte) => byte === 0) &&
        mismatchedOriginRejected &&
        mismatchedOriginSent === false,
      bypassResult === "BYPASS_SENT" &&
        bypassObserved?.name === "x-vercel-protection-bypass" &&
        bypassObserved.value_matches === true &&
        bypassHeaderAfter.every((byte) => byte === 0),
      probe.redirect_following === false &&
        catches(() =>
          core.validateProtectedAccessProbe({
            ...validProbe,
            redirect_following: true,
          }),
        ),
      redirect.application_reached === false &&
        redirect.counts_as_application_request === false &&
        redirect.counts_as_runtime_session === false,
      [
        ["cookies", true],
        ["admin_auth", true],
        ["csrf", true],
        ["request_body", true],
        ["data_credentials", true],
        ["database_requests", 1],
        ["data_writes", 1],
      ].every(([name, value]) =>
        catches(() =>
          core.validateProtectedAccessProbe({
            ...validProbe,
            [name]: value,
          }),
        ),
      ),
      redirectHeaders.every((byte) => byte === 0) &&
        redirectBody.every((byte) => byte === 0) &&
        applicationHeaders.every((byte) => byte === 0) &&
        applicationBody.every((byte) => byte === 0) &&
        !JSON.stringify([redirect, application]).includes("must-be-erased") &&
        !JSON.stringify([redirect, application]).includes(
          "https://vercel.com/sso-api",
        ) &&
        !JSON.stringify([redirect, application]).includes(
          "protection=must-be-erased",
        ),
      oidcProjection.signature_shape === "JWT_THREE_SEGMENTS" &&
        oidcProjection.issuer_present === true &&
        oidcProjection.audience_matches_team === true &&
        oidcProjection.owner_matches_team === true &&
        oidcProjection.project_matches_exact === true &&
        oidcProjection.environment === "DEVELOPMENT" &&
        oidcProjection.expiration_bucket === "GT30M" &&
        oidcProjection.not_before_valid === true &&
        oidcTokenBytes.every((byte) => byte === 0) &&
        !JSON.stringify(oidcProjection).includes("oidc.vercel.com"),
      bypassTransition.project_bypass_record_count_restored === true &&
        bypassTransition.no_generated_secret_active === true &&
        bypassTransition.pre_bypass_record_count === "ONE",
      lifecycleCases.every(
        (entry) =>
          entry.credentialErased &&
          entry.events.filter((event) => event.startsWith("revoke:")).length ===
            1 &&
          entry.events.filter((event) => event === "restored").length === 1,
      ) &&
        lifecycleCases[0].result === "USED" &&
        lifecycleCases[1].caughtCode === "SYNTHETIC_USE_ERROR" &&
        lifecycleCases[2].caughtCode === "PROTECTED_ACCESS_SIGNAL" &&
        lifecycleCases[3].caughtCode === "SYNTHETIC_ACTIVATION_ERROR",
      guardedOperations.every(Boolean) &&
        core.validateProtectedAccessOperation({
          credential_active: false,
          operation: "BRANCH_PUSH",
          protected_access_target_confirmed: false,
        }).allowed === true,
      lifecycleCases.every((entry) =>
        entry.events
          .filter((event) => event.startsWith("revoke:"))
          .every((event) => event.endsWith(":true")),
      ) &&
        bypassTransition.existing_records_preserved === true,
      runtimeBeforeTargetRejected &&
        runtimeAfterTarget.allowed === true &&
        target === expectedTarget &&
        core.validateDelta12ProtectedAccessAuthorization({
          authorization:
            `AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_PROTECTED_ACCESS_TARGET_${target}`,
          target_sha256: target,
        }) === target,
    ];
  } catch {
    return Array(14).fill(false);
  }
}

function delta12OrchestratorAccessContract(orchestratorSource) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const qualificationRequest =
    namedFunctionText(facts.root, "runHeaderQualificationRequest") ?? "";
  const applicationRequest =
    namedFunctionText(facts.root, "runApplicationRequest") ?? "";
  const bypassRequest =
    namedFunctionText(facts.root, "protectionBypassRequestBytes") ?? "";
  const bypassMutation =
    namedFunctionText(facts.root, "runProtectionBypassMutation") ?? "";
  const officialRuntime =
    namedFunctionText(facts.root, "runOfficialProtectedRuntime") ?? "";
  const headerQualifiedRuntime =
    namedFunctionText(
      facts.root,
      "executeDelta18DurableProjectionFinalRuntime",
    ) ?? "";
  const dedicatedPreviewRemove =
    namedFunctionText(facts.root, "removeExistingPreviewByDedicatedCli") ??
    "";
  const runtimeSession =
    namedFunctionText(facts.root, "runRuntimeSession") ?? "";
  const budgetedProtectedGet =
    namedFunctionText(facts.root, "runBudgetedProtectedAccessGet") ?? "";
  const oidcAttempt =
    namedFunctionText(facts.root, "runOidcProtectedAccessAttempt") ?? "";
  const temporaryBypassCycle =
    namedFunctionText(facts.root, "runTemporaryAutomationBypassCycle") ?? "";
  const qualificationAttempt =
    namedFunctionText(facts.root, "performHeaderQualificationAttempt") ?? "";
  const requiredFunctions = [
    "captureProjectBypassMetadata",
    "deriveDelta12ProtectedAccessAuthorization",
    "generateProjectOidcCredential",
    "installProtectedAccessSignalHandlers",
    "migrateDelta11HeaderQualificationState",
    "boundedSensitiveVercelApiStdinAuthorized",
    "protectionBypassRequestBytes",
    "randomAlphanumericSecret32",
    "runExactProtectedPreviewRequest",
    "runBudgetedProtectedAccessGet",
    "runOfficialProtectedRuntime",
    "runProtectedAccessHandshake",
    "runProtectionBypassMutation",
    "runTemporaryAutomationBypassCycle",
  ];
  return (
    orchestratorSource.includes(
      'import { request as httpsRequest } from "node:https";',
    ) &&
    orchestratorSource.includes("randomBytes,") &&
    requiredFunctions.every(
      (name) => namedFunctionText(facts.root, name) !== null,
    ) &&
    qualificationRequest.includes("runProtectedAccessHandshake") &&
    qualificationRequest.includes("await") &&
    !qualificationRequest.includes("runVercelChild") &&
    !qualificationRequest.includes('"curl"') &&
    applicationRequest.includes("runExactProtectedPreviewRequest") &&
    applicationRequest.includes("withProtectedAccessCredential") &&
    applicationRequest.includes("await") &&
    !applicationRequest.includes("runVercelChild") &&
    !applicationRequest.includes('"curl"') &&
    bypassRequest.includes("PROTECTED_ACCESS_NOTE") &&
    bypassRequest.includes("secretBytes") &&
    bypassRequest.includes('"regenerate":false') &&
    bypassMutation.includes(
      "`/v1/projects/${PROJECT_ID}/protection-bypass?teamId=${TEAM_ID}`",
    ) &&
    bypassMutation.includes('"-X",\n        "PATCH"') &&
    bypassMutation.includes('"--input",\n        "-",\n        "--raw"') &&
    bypassMutation.includes("allowBoundedVercelApiInput: true") &&
    bypassMutation.includes("input: requestBytes") &&
    bypassMutation.includes("requestBytes.fill(0)") &&
    bypassMutation.includes("raw_credential_material_persisted: 0") &&
    bypassMutation.includes("stdin_only: true") &&
    bypassMutation.includes("timingSafeEqual(candidateBytes, secretBytes)") &&
    !bypassMutation.includes('secretBytes.toString("ascii")') &&
    officialRuntime.includes('accessMode !== "SELF_PROJECT_OIDC"') &&
    officialRuntime.includes('expiration_bucket !== "GT30M"') &&
    officialRuntime.includes("generateProjectOidcCredential(budgets)") &&
    !officialRuntime.includes("runTemporaryAutomationBypassCycle({") &&
    officialRuntime.includes(
      "if (signalName === null) signalName = receivedSignal",
    ) &&
    officialRuntime.includes(
      'if (signalName !== null) fail("PROTECTED_ACCESS_SIGNAL")',
    ) &&
    officialRuntime.includes("generated.credentialBytes.fill(0)") &&
    headerQualifiedRuntime.includes("resumeMode: true") &&
    headerQualifiedRuntime.includes("runOfficialProtectedRuntime({") &&
    headerQualifiedRuntime.includes("assertDelta13EnvironmentRestored(") &&
    dedicatedPreviewRemove.includes("DELTA12_RETAINED_PREVIEW_ID") &&
    dedicatedPreviewRemove.includes(
      '["remove", context.deploymentId, "--yes"]',
    ) &&
    !dedicatedPreviewRemove.includes("context.deploymentHostname") &&
    runtimeSession.includes(
      "projectDelta16AApplicationContractBeforeErasure({",
    ) &&
    runtimeSession.includes(
      "validateDelta16AApplicationContractProjection(",
    ) &&
    budgetedProtectedGet.includes(
      'budgets.take("qualificationGetRequests")',
    ) &&
    budgetedProtectedGet.includes(
      'budgets.take("protectionAccessHandshakeGets")',
    ) &&
    budgetedProtectedGet.includes("catch") &&
    oidcAttempt.includes("runBudgetedProtectedAccessGet") &&
    temporaryBypassCycle.includes("runBudgetedProtectedAccessGet") &&
    temporaryBypassCycle.includes(
      "raw_credential_material_persisted: 0",
    ) &&
    temporaryBypassCycle.includes(
      "generation.raw_credential_material_persisted !== 0 ||",
    ) &&
    temporaryBypassCycle.includes('transport: "STDIN"') &&
    temporaryBypassCycle.includes("body_file_created: false") &&
    temporaryBypassCycle.includes("filesystem_body_path: null") &&
    !orchestratorSource.includes("writeProtectionBypassRequestFile") &&
    !orchestratorSource.includes("PROTECTED_ACCESS_TEMP_ROOT_PREFIX") &&
    !orchestratorSource.includes("PROTECTED_ACCESS_REQUEST_FILENAME") &&
    qualificationAttempt.includes("runBudgetedProtectedAccessGet") &&
    !orchestratorSource.includes("x-vercel-set-bypass-cookie") &&
    !orchestratorSource.includes("VERCEL_AUTOMATION_BYPASS_SECRET") &&
    orchestratorSource.includes(
      "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_VERIFIED_PUBLICATION_FINAL_TARGET_",
    ) &&
    orchestratorSource.includes("deriveDelta20VerifiedPublicationFinalTarget,") &&
    orchestratorSource.includes(
      "validateDelta20VerifiedPublicationFinalAuthorization,",
    )
  );
}

function delta12OrchestratorAccessAssertions(orchestratorSource) {
  const mutations = [
    [
      "const handshake = await runProtectedAccessHandshake(",
      "const handshake = await runHeaderQualificationRequest(",
    ],
    [
      "const response = await withProtectedAccessCredential(",
      "const response = await runExactProtectedPreviewRequest(",
    ],
    [
      'import { request as httpsRequest } from "node:https";',
      "",
    ],
    [
      "phaseOwnedRetainedPreviewId: retained.state.deployment_id,\n    previewRemoved: false,\n    resumeMode: true,",
      "phaseOwnedRetainedPreviewId: retained.state.deployment_id,\n    previewRemoved: false,\n    resumeMode: false,",
    ],
    [
      '["remove", context.deploymentId, "--yes"]',
      '["remove", context.deploymentHostname, "--yes"]',
    ],
    [
      "validateDelta16AApplicationContractProjection(contractProjection);\n    const applicationAssertion =",
      "validateRuntimeResponse(response.record);\n    const applicationAssertion =",
    ],
    [
      '"--input",\n        "-",\n        "--raw",',
      '"--input",\n        "protection-bypass-request.json",\n        "--raw",',
    ],
    [
      "generation.raw_credential_material_persisted !== 0 ||",
      "generation.raw_credential_material_persisted === 0 ||",
    ],
    [
      'accessMode !== "SELF_PROJECT_OIDC" ||',
      'accessMode === "SELF_PROJECT_OIDC" ||',
    ],
  ].map(([expected, replacement]) =>
    replaceExactlyOnce(orchestratorSource, expected, replacement),
  );
  return [
    delta12OrchestratorAccessContract(orchestratorSource),
    mutations.every(
      (mutation) =>
        mutation !== null &&
        !delta12OrchestratorAccessContract(mutation),
    ),
  ];
}

function delta16AStoredCanonicalSourceAssertions({
  handlerSource,
  orchestratorSource,
  toolValidationSource,
}) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const identityText =
    namedFunctionText(
      facts.root,
      "createDelta16ARouteWebsiteIdentity",
    ) ?? "";
  const bodyText =
    namedFunctionText(facts.root, "createDelta16ARouteToolBody") ?? "";
  const matcherText =
    namedFunctionText(facts.root, "matchDelta16ARouteCreatedTool") ?? "";
  const qualificationText =
    namedFunctionText(
      facts.root,
      "runDelta15AuthFixtureQualificationCycle",
    ) ?? "";
  const runtimeText =
    namedFunctionText(facts.root, "runRuntimeSession") ?? "";
  const projectionText =
    namedFunctionText(
      facts.root,
      "projectDelta16AApplicationContractBeforeErasure",
    ) ?? "";
  const postStart = handlerSource.indexOf("  async function POST(request: Request)");
  const postEnd = handlerSource.indexOf("\n  async function PUT(request: Request)");
  const postText =
    postStart >= 0 && postEnd > postStart
      ? handlerSource.slice(postStart, postEnd)
      : "";
  const contract = (validation, handler, orchestrator) => {
    const localFacts = astFacts(ORCHESTRATOR_PATH, orchestrator);
    const localIdentity =
      namedFunctionText(
        localFacts.root,
        "createDelta16ARouteWebsiteIdentity",
      ) ?? "";
    const localBody =
      namedFunctionText(localFacts.root, "createDelta16ARouteToolBody") ?? "";
    const localMatcher =
      namedFunctionText(
        localFacts.root,
        "matchDelta16ARouteCreatedTool",
      ) ?? "";
    const localPostStart = handler.indexOf(
      "  async function POST(request: Request)",
    );
    const localPostEnd = handler.indexOf(
      "\n  async function PUT(request: Request)",
    );
    const localPost =
      localPostStart >= 0 && localPostEnd > localPostStart
        ? handler.slice(localPostStart, localPostEnd)
        : "";
    return (
      validation.includes("return url.toString();") &&
      !validation.includes("return rawValue;") &&
      handler.includes(
        'const website = validateHttpsUrl(body.website, "Website URL");',
      ) &&
      localPost.includes("website: cleanBody.website,") &&
      !localPost.includes("website: body.website,") &&
      localIdentity.includes(
        "routeWebsiteSafetyParsed.toString()",
      ) &&
      localIdentity.includes(
        "routeWebsiteStoredCanonical !== `${routeWebsiteRequestLexical}/`",
      ) &&
      localBody.includes(
        "website: verifiedIdentity.routeWebsiteRequestLexical",
      ) &&
      localMatcher.includes(
        "row.website === routeWebsiteStoredCanonical",
      ) &&
      !localMatcher.includes(
        "row.website === routeWebsiteRequestLexical",
      ) &&
      orchestrator.includes("preview_creations=5")
    );
  };
  const validationMutation = toolValidationSource.replace(
    "return url.toString();",
    "return rawValue;",
  );
  const handlerMutation = handlerSource.replace(
    "website: cleanBody.website,",
    "website: body.website,",
  );
  const bodyMutation = orchestratorSource.replace(
    "website: verifiedIdentity.routeWebsiteRequestLexical,",
    "website: verifiedIdentity.routeWebsiteStoredCanonical,",
  );
  const matcherMutation = orchestratorSource.replace(
    "row.website === routeWebsiteStoredCanonical &&",
    "row.website === routeWebsiteRequestLexical &&",
  );
  return [
    contract(toolValidationSource, handlerSource, orchestratorSource),
    toolValidationSource.includes("return url.toString();"),
    postText.includes("website: cleanBody.website,"),
    identityText.includes("routeWebsiteRequestLexical.endsWith(\"/\")"),
    identityText.includes("routeWebsiteSafetyParsed.toString()"),
    bodyText.includes("website: verifiedIdentity.routeWebsiteRequestLexical"),
    matcherText.includes("row.website === routeWebsiteStoredCanonical"),
    qualificationText.includes("maximumOrdinal: 15") &&
      qualificationText.includes("runRuntimeSession({"),
    runtimeText.includes("routeWebsiteIdentity.routeWebsiteRequestLexical") &&
      runtimeText.includes("routeWebsiteIdentity.routeWebsiteStoredCanonical"),
    projectionText.includes(
      "row.website === contractContext.routeWebsiteStoredCanonical",
    ),
    !contract(validationMutation, handlerSource, orchestratorSource),
    !contract(toolValidationSource, handlerMutation, orchestratorSource),
    !contract(toolValidationSource, handlerSource, bodyMutation),
    !contract(toolValidationSource, handlerSource, matcherMutation),
  ];
}

function delta17Request20SecurityHeaderRegressionAssertion() {
  const sessionDenialBytes = Buffer.from(
    '{"authenticated":false,"message":"Unauthorized."}',
    "utf8",
  );
  const responseBodyBytes = Buffer.from(sessionDenialBytes);
  const headerFields = DELTA11_VALID_HEADER_FIELDS.map(([name, value]) => ({
    name,
    value: Buffer.from(value, "latin1"),
  }));
  try {
    const securityHeaderCategories = core.classifySecurityHeaderProjection({
      status: 401,
      application_body_bytes: sessionDenialBytes,
      header_fields: headerFields,
    });
    const responseProjection = core.projectDelta13ApplicationResponse({
      request_ordinal: 20,
      method: "GET",
      path: "/api/admin/session",
      expected_status: 401,
      actual_status_integer: 401,
      raw_body_bytes: responseBodyBytes,
      security_header_categories: securityHeaderCategories,
      set_cookie_values: [],
    });
    const assertion = core.projectDelta17SanitizedApplicationAssertion({
      contract_projection: {
        actual_status_integer: 401,
        allow_methods_exact: null,
        body_contract: "POST_LOGOUT_DENIAL",
        csrf_cookie_contract_pass: null,
        csrf_cookie_matches_body: null,
        csrf_token_format: null,
        expected_status: 401,
        fixture_binding_count: null,
        fixture_binding_exact: null,
        identity_contract_pass: null,
        logo_object_path: null,
        logo_origin_match: null,
        logo_path_valid: null,
        logout_cookie_contract_pass: null,
        method: "GET",
        ordinal: 20,
        path: "/api/admin/session",
        post_logout_denial_contract_pass: true,
        raw_body_persisted: false,
        raw_cookies_persisted: false,
        raw_headers_persisted: false,
        response_path_echo_absent: null,
        route_created_tool_id: null,
        route_positive_tool_id: null,
        route_unique_match_count: null,
        schema_version: 1,
        session_cookie_contract_pass: null,
        status_match: true,
      },
      response_projection: responseProjection,
    });
    const runtimeRecord = {
      ordinal: 20,
      method: "GET",
      path: "/api/admin/session",
      status: 401,
      security_header_projection: securityHeaderCategories,
      body_contract: "POST_LOGOUT_DENIAL",
      raw_body_persisted: false,
      raw_headers_persisted: false,
      raw_url_persisted: false,
    };
    const runtimeValidation = core.validateRuntimeResponse(runtimeRecord);
    const rejectsToolsIdentity = catches(() =>
      core.validateRuntimeResponse({
        ...runtimeRecord,
        security_header_projection: {
          ...securityHeaderCategories,
          application_response_identity: "ADMIN_TOOLS_UNAUTHENTICATED",
        },
      }),
    );
    const rejectsOtherIdentity = catches(() =>
      core.validateRuntimeResponse({
        ...runtimeRecord,
        security_header_projection: {
          ...securityHeaderCategories,
          application_response_identity: "OTHER",
        },
      }),
    );
    return (
      securityHeaderCategories.application_body_shape ===
        "EXACT_JSON_OBJECT" &&
      securityHeaderCategories.application_response_identity ===
        "ADMIN_SESSION_UNAUTHENTICATED" &&
      securityHeaderCategories.disposition ===
        "PASS_EXACT_APPLICATION_HEADER_CONTRACT" &&
      runtimeValidation.validated === true &&
      runtimeValidation.ordinal === 20 &&
      rejectsToolsIdentity &&
      rejectsOtherIdentity &&
      assertion.ordinal === 20 &&
      assertion.response_facts.post_logout_denial_contract_pass === true &&
      assertion.security_header_categories.application_response_identity ===
        "ADMIN_SESSION_UNAUTHENTICATED"
    );
  } catch {
    return false;
  } finally {
    sessionDenialBytes.fill(0);
    responseBodyBytes.fill(0);
    for (const field of headerFields) field.value.fill(0);
  }
}

function delta19ReplacementQualificationBehaviorAssertions(
  orchestratorSource,
  evidenceTestSource,
) {
  const plan = core.createRuntimePlan();
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const predecessorValidator =
    namedFunctionText(
      facts.root,
      "validateDelta19PredecessorQualificationMarker",
    ) ?? "";
  const tombstoneValidator =
    namedFunctionText(
      facts.root,
      "validateDelta19QualificationConsumptionTombstone",
    ) ?? "";
  const replacementValidator =
    namedFunctionText(
      facts.root,
      "validateDelta19ReplacementQualificationMarker",
    ) ?? "";
  const rotation =
    namedFunctionText(
      facts.root,
      "acquireDelta19ReplacementQualificationGuard",
    ) ?? "";
  const release =
    namedFunctionText(
      facts.root,
      "releaseDelta19ReplacementQualificationGuard",
    ) ?? "";
  const removal =
    namedFunctionText(
      facts.root,
      "removeDelta19QualificationArtifacts",
    ) ?? "";
  const selfTest =
    namedFunctionText(
      facts.root,
      "runDelta19QualificationRotationSelfTest",
    ) ?? "";
  const qualification =
    namedFunctionText(facts.root, "qualifyDelta14LegacyAuthPreview") ?? "";
  const preMutationInventory =
    namedFunctionText(
      facts.root,
      "verifyDelta19PreMutationExternalAbsence",
    ) ?? "";
  const environmentBudget =
    namedFunctionText(
      facts.root,
      "delta19EnvironmentMetadataRequestMaximum",
    ) ?? "";
  const environmentBudgetSelfTest =
    namedFunctionText(
      facts.root,
      "runDelta19EnvironmentMetadataBudgetSelfTest",
    ) ?? "";
  const environmentFailureGate =
    namedFunctionText(
      facts.root,
      "delta19EnvironmentFailureReconciliationRequired",
    ) ?? "";
  const logoutMutationWindow =
    namedFunctionText(
      facts.root,
      "awaitDelta18QualificationLogoutMutationWindowClosed",
    ) ?? "";
  const logoutValidatedConfirmation =
    namedFunctionText(
      facts.root,
      "confirmDelta18QualificationLogoutMutationWindowAfterValidation",
    ) ?? "";
  const qualificationSession =
    namedFunctionText(
      facts.root,
      "runDelta18IdentityQualificationSession",
    ) ?? "";
  const logoutCleanup =
    namedFunctionText(
      facts.root,
      "cleanupDelta18QualificationLogoutAudit",
    ) ?? "";
  const logoutMutationWindowSelfTest =
    namedFunctionText(
      facts.root,
      "runDelta18QualificationLogoutMutationWindowSelfTest",
    ) ?? "";
  const qualificationFailureTerminal =
    namedFunctionText(
      facts.root,
      "delta18QualificationFailureTerminalCode",
    ) ?? "";
  const logoutMutationWindowContract = (candidate) => {
    const candidateFacts = astFacts(ORCHESTRATOR_PATH, candidate);
    const candidateProtectedRequest =
      namedFunctionText(
        candidateFacts.root,
        "runExactProtectedPreviewRequest",
      ) ?? "";
    const candidateTotalDeadline =
      namedFunctionText(
        candidateFacts.root,
        "armProtectedPreviewTotalDeadline",
      ) ?? "";
    const candidateWindow =
      namedFunctionText(
        candidateFacts.root,
        "awaitDelta18QualificationLogoutMutationWindowClosed",
      ) ?? "";
    const candidateSession =
      namedFunctionText(
        candidateFacts.root,
        "runDelta18IdentityQualificationSession",
      ) ?? "";
    const candidateApplicationRequest =
      namedFunctionText(
        candidateFacts.root,
        "runApplicationRequest",
      ) ?? "";
    const candidateCleanup =
      namedFunctionText(
        candidateFacts.root,
        "cleanupDelta18QualificationLogoutAudit",
      ) ?? "";
    const candidateConfirmation =
      namedFunctionText(
        candidateFacts.root,
        "confirmDelta18QualificationLogoutMutationWindowAfterValidation",
      ) ?? "";
    return (
      candidate.includes(
        "const DELTA18_QUALIFICATION_LOGOUT_MUTATION_TAIL_MS = 60_000;",
      ) &&
      candidate.includes(
        "DIRECT_REQUEST_TIMEOUT_MS +\n  DELTA18_QUALIFICATION_LOGOUT_MUTATION_TAIL_MS",
      ) &&
      candidateTotalDeadline.includes("const totalDeadline = setTimer(") &&
      candidateTotalDeadline.includes("deadlineAt = null") &&
      candidateTotalDeadline.includes("deadlineAt - observedNow") &&
      candidateTotalDeadline.includes(
        '"PROTECTED_PREVIEW_HTTP_TOTAL_DEADLINE"',
      ) &&
      candidateTotalDeadline.includes("clearTimer(totalDeadline)") &&
      candidateProtectedRequest.includes(
        "clearTotalDeadline = armProtectedPreviewTotalDeadline(\n        request,\n        { deadlineAt: totalDeadlineAt },",
      ) &&
      candidateProtectedRequest.includes("clearTotalDeadline();") &&
      candidateApplicationRequest.includes("requestTotalDeadlineAt = null") &&
      candidateApplicationRequest.includes(
        "totalDeadlineAt: requestTotalDeadlineAt",
      ) &&
      candidateWindow.includes("logoutMutationWindowEnd") &&
      candidateWindow.includes("logoutMutationConfirmedClosed") &&
      candidateWindow.includes("return false;") &&
      !candidateWindow.includes(
        "confirmDelta18QualificationLogoutMutationWindowClosed(",
      ) &&
      candidateSession.includes(
        "persistDelta18QualificationLogoutMutationWindow(durableEvidence)",
      ) &&
      candidateSession.indexOf(
        "persistDelta18QualificationLogoutMutationWindow(durableEvidence)",
      ) < candidateSession.indexOf("await runApplicationRequest({") &&
      candidateSession.includes(
        "requestTotalDeadlineAt:\n          contractOrdinal === 19",
      ) &&
      candidateSession.includes(
        "Date.parse(durableEvidence.logoutMutationWindowEnd) -\n              DELTA18_QUALIFICATION_LOGOUT_MUTATION_TAIL_MS",
      ) &&
      candidateConfirmation.includes("validationComplete !== true") &&
      candidateConfirmation.indexOf("validationComplete !== true") <
        candidateConfirmation.indexOf(
          "return confirmDelta18QualificationLogoutMutationWindowClosed(",
        ) &&
      candidateSession.includes(
        "confirmDelta18QualificationLogoutMutationWindowAfterValidation({",
      ) &&
      candidateSession.includes("validateRuntimeResponse(response.record)") &&
      candidateSession.indexOf("validateRuntimeResponse(response.record)") <
        candidateSession.indexOf(
          "confirmDelta18QualificationLogoutMutationWindowAfterValidation({",
        ) &&
      candidateSession.indexOf(
        "confirmDelta18QualificationLogoutMutationWindowAfterValidation({",
      ) < candidateSession.indexOf("assertions.push(assertion)") &&
      candidateCleanup.includes(
        "await awaitDelta18QualificationLogoutMutationWindowClosed(",
      ) &&
      candidateCleanup.indexOf(
        "await awaitDelta18QualificationLogoutMutationWindowClosed(",
      ) < candidateCleanup.indexOf(
        'code: "DELTA18_QUALIFICATION_LOGOUT_AUDIT_PRECLEANUP"',
      ) &&
      candidateCleanup.includes(
        'code: "DELTA18_QUALIFICATION_LOGOUT_AUDIT_ABSENCE_FIRST"',
      ) &&
      candidateCleanup.includes(
        'code: "DELTA18_QUALIFICATION_LOGOUT_AUDIT_ABSENCE_SECOND"',
      ) &&
      candidateCleanup.includes("const mutationConfirmedClosed =") &&
      candidateCleanup.includes(
        'fail("DELTA18_QUALIFICATION_LOGOUT_MUTATION_UNRESOLVED")',
      ) &&
      candidateCleanup.indexOf(
        'code: "DELTA18_QUALIFICATION_LOGOUT_AUDIT_ABSENCE_SECOND"',
      ) <
        candidateCleanup.indexOf(
          'fail("DELTA18_QUALIFICATION_LOGOUT_MUTATION_UNRESOLVED")',
        )
    );
  };
  const qualificationGuardReleaseContract = (candidate) => {
    const candidateFacts = astFacts(ORCHESTRATOR_PATH, candidate);
    const candidateRelease =
      namedFunctionText(
        candidateFacts.root,
        "releaseDelta19ReplacementQualificationGuard",
      ) ?? "";
    const candidateSelfTest =
      namedFunctionText(
        candidateFacts.root,
        "runDelta19QualificationRotationSelfTest",
      ) ?? "";
    return (
      candidateRelease.includes(
        "const expectedPaths = delta19QualificationGuardPaths(lockRoot)",
      ) &&
      candidateRelease.includes(
        "descriptorIdentity.nlink !== (lockAbsent ? 0 : 1)",
      ) &&
      candidateRelease.includes(
        "validateDelta19ReplacementQualificationMarker({",
      ) &&
      candidateRelease.includes(
        "validateDelta19QualificationConsumptionTombstone({",
      ) &&
      candidateRelease.includes(
        "if (lockAbsent) {\n    fsyncExactDirectory(lockRoot);\n    closeSync(guard.lock_descriptor);",
      ) &&
      candidateSelfTest.includes("unlinkSync(guard.lock_path)") &&
      candidateSelfTest.includes("partialGuardReleaseRecovered")
    );
  };
  const qualificationGuardReleaseMutation = orchestratorSource.replace(
    "  if (lockAbsent) {\n    fsyncExactDirectory(lockRoot);\n    closeSync(guard.lock_descriptor);",
    '  if (lockAbsent) fail("DELTA19_QUALIFICATION_GUARD_RELEASE_IDENTITY");\n  {',
  );
  const logoutWindowWaitMutation = orchestratorSource.replace(
    "  await awaitDelta18QualificationLogoutMutationWindowClosed(\n    durableEvidence,",
    "  void durableEvidence; await Promise.resolve(",
  );
  const logoutSecondAbsenceMutation = orchestratorSource.replace(
    'code: "DELTA18_QUALIFICATION_LOGOUT_AUDIT_ABSENCE_SECOND"',
    'code: "DELTA18_QUALIFICATION_LOGOUT_AUDIT_ABSENCE_FIRST"',
  );
  const logoutPrematureConfirmMutation = orchestratorSource.replace(
    "      validateRuntimeResponse(response.record);\n" +
      "      if (contractOrdinal === 19) {\n" +
      "        confirmDelta18QualificationLogoutMutationWindowAfterValidation({",
    "      if (contractOrdinal === 19) {\n" +
      "        confirmDelta18QualificationLogoutMutationWindowAfterValidation({",
  );
  const logoutDispatchOnlyWindowMutation = orchestratorSource.replace(
    "  DIRECT_REQUEST_TIMEOUT_MS +\n" +
      "  DELTA18_QUALIFICATION_LOGOUT_MUTATION_TAIL_MS;",
    "  DELTA18_QUALIFICATION_LOGOUT_MUTATION_TAIL_MS;",
  );
  const logoutTotalDeadlineMutation = orchestratorSource.replace(
    "      clearTotalDeadline = armProtectedPreviewTotalDeadline(\n" +
      "        request,\n" +
      "        { deadlineAt: totalDeadlineAt },\n" +
      "      );",
    "      clearTotalDeadline = () => false;",
  );
  const logoutDeadlineBindingMutation = orchestratorSource.replace(
    "        requestTotalDeadlineAt:\n" +
      "          contractOrdinal === 19",
    "        requestTotalDeadlineAt:\n" +
      "          contractOrdinal === -1",
  );
  const logoutUnresolvedMutation = orchestratorSource.replace(
    '    fail("DELTA18_QUALIFICATION_LOGOUT_MUTATION_UNRESOLVED");',
    "    void mutationConfirmedClosed;",
  );
  const logoutTerminalCategoryMutation = orchestratorSource.replace(
    '    "DELTA18_QUALIFICATION_LOGOUT_MUTATION_UNRESOLVED";',
    "      `ROLLBACK_FAILED_AFTER_${originalCode}`;",
  );
  const target =
    namedFunctionText(
      facts.root,
      "identifyDelta18DurableProjectionFinalTarget",
    ) ?? "";
  const official =
    namedFunctionText(
      facts.root,
      "executeDelta18DurableProjectionFinalRuntime",
    ) ?? "";
  const runtimeEvidenceText =
    namedFunctionText(facts.root, "runtimeEvidence") ?? "";
  const runtimeEvidenceDraftValidator =
    namedFunctionText(
      facts.root,
      "validateDelta18RuntimeEvidenceDraft",
    ) ?? "";
  const delta19PreviewEvidenceContract = (candidate) => {
    const candidateFacts = astFacts(ORCHESTRATOR_PATH, candidate);
    const candidateOfficial =
      namedFunctionText(
        candidateFacts.root,
        "executeDelta18DurableProjectionFinalRuntime",
      ) ?? "";
    const candidateRuntimeEvidence =
      namedFunctionText(candidateFacts.root, "runtimeEvidence") ?? "";
    const candidateDraftValidator =
      namedFunctionText(
        candidateFacts.root,
        "validateDelta18RuntimeEvidenceDraft",
      ) ?? "";
    return (
      candidateOfficial.includes("previewDeploymentsCreated: 7") &&
      candidateRuntimeEvidence.includes("[3, 4, 5, 6, 7]") &&
      candidateRuntimeEvidence.includes("[5, 6, 7]") &&
      candidateRuntimeEvidence.includes(
        "[6, 7].includes(previewDeploymentsCreated)",
      ) &&
      candidateDraftValidator.includes(
        "readback.preview?.deployments_created !== 7",
      )
    );
  };
  const delta19PreviewEvidenceWriterMutation = orchestratorSource.replace(
    "      previewDeploymentsCreated: 7,",
    "      previewDeploymentsCreated: 6,",
  );
  const delta19PreviewEvidenceValidatorMutation = orchestratorSource.replace(
    "readback.preview?.deployments_created !== 7",
    "readback.preview?.deployments_created !== 6",
  );
  const delta19DeleteContractEvidenceNeedle =
    'evidence.preview.delete_contract ===\n' +
    '            (evidence.preview.deployments_created === 7\n' +
    '              ? "VERCEL_CLI_REMOVE_EXACT_POSTSTATE_PASS"\n' +
    '              : "REST_V13_DELETE_BY_ID_POSTSTATE_PASS")';
  const delta19DeleteContractEvidenceContract = (candidate) => {
    const candidateFacts = astFacts(EVIDENCE_TEST_PATH, candidate);
    const candidateLiveAssertions =
      namedFunctionText(candidateFacts.root, "liveAssertions") ?? "";
    return candidateLiveAssertions.includes(
      delta19DeleteContractEvidenceNeedle,
    );
  };
  const delta19DeleteContractEvidenceMutation = evidenceTestSource.replace(
    delta19DeleteContractEvidenceNeedle,
    delta19DeleteContractEvidenceNeedle.replace("=== 7", "=== 6"),
  );
  const delta19OfficialDurableRecoveryContract = (candidate) => {
    const candidateFacts = astFacts(ORCHESTRATOR_PATH, candidate);
    const candidateRuntimeSession =
      namedFunctionText(candidateFacts.root, "runRuntimeSession") ?? "";
    const candidateOfficial =
      namedFunctionText(
        candidateFacts.root,
        "executeDelta18DurableProjectionFinalRuntime",
      ) ?? "";
    const candidateRootGate =
      namedFunctionText(
        candidateFacts.root,
        "delta18OfficialFailureMayRemoveDurableRoot",
      ) ?? "";
    const candidateArtifactRemoval =
      namedFunctionText(
        candidateFacts.root,
        "removeDelta19QualificationArtifacts",
      ) ?? "";
    const candidateAbsentRootReconciliation =
      namedFunctionText(
        candidateFacts.root,
        "reconcileAbsentDelta18TempRoot",
      ) ?? "";
    const candidateSelfTest =
      namedFunctionText(candidateFacts.root, "runSelfTest") ?? "";
    const candidateRotationSelfTest =
      namedFunctionText(
        candidateFacts.root,
        "runDelta19QualificationRotationSelfTest",
      ) ?? "";
    const candidateResumeSelfTest =
      namedFunctionText(
        candidateFacts.root,
        "runExistingPreviewResumeSelfTest",
      ) ?? "";
    const evidenceWriteIndex = candidateOfficial.indexOf(
      "const evidenceSha256 = writeRuntimeEvidenceAfterCleanup(",
    );
    const evidenceCommitIndex = candidateOfficial.indexOf(
      "runtimeEvidenceWritten = true;",
    );
    const evidenceHashGuardIndex = candidateOfficial.indexOf(
      "if (evidenceSha256 !== validatedDraft.sha256) {",
    );
    const markerRemovalIndex = candidateOfficial.indexOf(
      "removeResumeAttemptMarker(executionMarker);",
    );
    const artifactRemovalIndex = candidateOfficial.indexOf(
      "removeDelta19QualificationArtifacts({",
    );
    const rootRemovalIndex = candidateOfficial.indexOf(
      "removeExternalTempRoot(retained.root, retained.deploymentStatePath);",
    );
    return (
      candidateRuntimeSession.includes(
        "durableProjectionJournalSha256:\n      runtimeState.durableProjectionJournalSha256",
      ) &&
      candidateRuntimeSession.includes(
        "durableProjectionValidatedRequests:\n      runtimeState.durableProjectionValidatedRequests",
      ) &&
      candidateRuntimeSession.includes(
        "durableProjectionComplete:\n      runtimeState.durableProjectionComplete",
      ) &&
      candidateRootGate.includes(
        "return externalCleanupComplete && runtimeEvidenceWritten;",
      ) &&
      candidateOfficial.includes(
        "delta18OfficialFailureMayRemoveDurableRoot({\n          externalCleanupComplete,\n          runtimeEvidenceWritten,\n        })",
      ) &&
      evidenceWriteIndex >= 0 &&
      evidenceHashGuardIndex > evidenceWriteIndex &&
      evidenceCommitIndex > evidenceWriteIndex &&
      evidenceCommitIndex > evidenceHashGuardIndex &&
      candidateOfficial.includes(
        'fail("DELTA18_RUNTIME_EVIDENCE_WRITE_DRIFT")',
      ) &&
      artifactRemovalIndex > evidenceCommitIndex &&
      markerRemovalIndex > artifactRemovalIndex &&
      rootRemovalIndex > markerRemovalIndex &&
      candidateOfficial.includes("if (!context.tempRootRemoved) {") &&
      candidateOfficial.includes("if (existsSync(retained.root)) {") &&
      candidateOfficial.includes(
        "reconcileAbsentDelta18TempRoot(\n                retained.root,",
      ) &&
      candidateAbsentRootReconciliation.includes(
        "operations.fsyncDirectory(canonicalTmpBase)",
      ) &&
      candidateAbsentRootReconciliation.includes(
        "/^aifinder-34ia-delta19-[A-Za-z0-9]{6}$/u",
      ) &&
      candidateArtifactRemoval.includes(
        "if (!replacementExists && !tombstoneExists) {",
      ) &&
      candidateArtifactRemoval.includes("fsyncExactDirectory(lockRoot)") &&
      candidateArtifactRemoval.includes("if (replacementExists) {") &&
      candidateArtifactRemoval.includes("if (tombstoneExists) {") &&
      candidateSelfTest.includes(
        "SELF_TEST_DELTA18_OFFICIAL_DURABLE_RECOVERY",
      ) &&
      candidateRotationSelfTest.includes("partialTombstoneRemoved") &&
      candidateRotationSelfTest.includes("partialReplacementRemoved") &&
      candidateRotationSelfTest.includes("idempotentAbsent") &&
      candidateResumeSelfTest.includes(
        "SELF_TEST_RESUME_EXECUTION_LOCK_PARTIAL_RELEASE",
      ) &&
      candidateResumeSelfTest.includes(
        "SELF_TEST_RESUME_ATTEMPT_MARKER_PARTIAL_REMOVE",
      ) &&
      candidateResumeSelfTest.includes("SELF_TEST_ABSENT_ROOT_PARENT_FSYNC")
    );
  };
  const delta19OfficialDurableResultMutation = orchestratorSource.replace(
    "    durableProjectionJournalSha256:\n      runtimeState.durableProjectionJournalSha256,",
    "    durableProjectionJournalSha256: null,",
  );
  const delta19OfficialDurableRootGateMutation = orchestratorSource.replace(
    "  return externalCleanupComplete && runtimeEvidenceWritten;",
    "  return externalCleanupComplete;",
  );
  const delta19OfficialDurableSuccessOrderMutation =
    orchestratorSource.replace(
      "    runtimeEvidenceWritten = true;",
      "    void runtimeEvidenceWritten;",
    );
  const delta19OfficialEvidenceHashGuardMutation =
    orchestratorSource.replace(
      "    if (evidenceSha256 !== validatedDraft.sha256) {\n" +
        '      fail("DELTA18_RUNTIME_EVIDENCE_WRITE_DRIFT");\n' +
        "    }",
      "    void evidenceSha256; void validatedDraft.sha256;",
    );
  const delta19OfficialArtifactOrderMutation = orchestratorSource.replace(
    "    removeDelta19QualificationArtifacts({\n      binding: qualificationAttemptBinding,\n    });\n    qualificationAttemptMarkerRemoved = true;\n    removeResumeAttemptMarker(executionMarker);",
    "    removeResumeAttemptMarker(executionMarker);\n    removeDelta19QualificationArtifacts({\n      binding: qualificationAttemptBinding,\n    });\n    qualificationAttemptMarkerRemoved = true;",
  );
  const delta19OfficialArtifactIdempotenceMutation =
    orchestratorSource.replace(
      "  if (!replacementExists && !tombstoneExists) {\n    fsyncExactDirectory(lockRoot);\n    return;\n  }",
      '  if (!replacementExists && !tombstoneExists) fail("DELTA19_QUALIFICATION_ARTIFACT_RESIDUE");',
    );
  const delta19OfficialMarkerIdempotenceMutation =
    orchestratorSource.replace(
      "  if (pathIsAbsent(markerPath)) {\n    fsyncExactDirectory(markerRoot);\n    return;\n  }",
      '  if (pathIsAbsent(markerPath)) fail("RESUME_ATTEMPT_MARKER_REMOVE_IDENTITY");',
    );
  const delta19OfficialLockIdempotenceMutation = orchestratorSource.replace(
    "  if (lockAbsent) {\n    fsyncExactDirectory(lockRoot);\n    closeSync(lockDescriptor);",
    '  if (pathIsAbsent(lockPath)) fail("RESUME_EXECUTION_LOCK_RELEASE_IDENTITY");\n  {',
  );
  const delta19OfficialRootParentFsyncMutation =
    orchestratorSource.replace(
      "  operations.fsyncDirectory(canonicalTmpBase);",
      "  void canonicalTmpBase;",
    );
  const rotationContract = (candidate) => {
    const candidateFacts = astFacts(ORCHESTRATOR_PATH, candidate);
    const candidateRotation =
      namedFunctionText(
        candidateFacts.root,
        "acquireDelta19ReplacementQualificationGuard",
      ) ?? "";
    return (
      candidateRotation.includes("fsyncExactDirectory(lockRoot)") &&
      candidateRotation.includes("openExclusiveMode0600(") &&
      candidateRotation.includes(
        "validateDelta19QualificationConsumptionTombstone({",
      ) &&
      candidateRotation.includes(
        "validateDelta19ReplacementQualificationMarker({",
      ) &&
      candidateRotation.includes(
        "validateDelta19ReplacementQualificationMarker({\n        binding,\n        lockRoot,\n      });\n      unlinkSync(paths.predecessor_path)",
      )
    );
  };
  const rotationMutation = orchestratorSource.replace(
    "      validateDelta19ReplacementQualificationMarker({\n        binding,\n        lockRoot,\n      });\n      unlinkSync(paths.predecessor_path);",
    "      unlinkSync(paths.predecessor_path);",
  );
  const qualificationMutation = orchestratorSource.replace(
    "    qualificationGuard = acquireDelta19ReplacementQualificationGuard({",
    "    qualificationGuard = null; void ({",
  );
  return [
    plan.branch ===
      "aifinder-phase-34ia-durable-evidence-runtime-validation-v2",
    plan.marker?.bytes === 414 &&
      plan.marker?.lf === 9 &&
      plan.marker?.sha256 ===
        "23734f9af08aeea68986664836ada07e4fc22e3aa40a19d0b6444b5c88365ef2",
    orchestratorSource.includes(
      "AIFINDER_PHASE_34IA_DURABLE_PROJECTION_REPLACEMENT_QUALIFICATION_PREVIEW_V17",
    ) &&
      orchestratorSource.includes(
        '"preview_ordinal=seventh-final"',
      ),
    orchestratorSource.includes(
      '"aifinder-phase-34ia-durable-evidence-runtime-validation-v2": false',
    ) &&
      orchestratorSource.includes(
        '"8e088d7ebe95413bce7a7acb7524218fae058538ee36d1addc240baae57cf038"',
      ),
    predecessorValidator.includes(
      "DELTA18_SPENT_QUALIFICATION_MARKER_SHA256",
    ) &&
      predecessorValidator.includes("document.qualification_attempt !== 1") &&
      predecessorValidator.includes(
        'document.phase !== "34IA-34IZ-DELTA18"',
      ) &&
      predecessorValidator.includes("DELTA18_AUTHORITY_SHA256") &&
      predecessorValidator.includes("DELTA18_NORMALIZED_BLOCKER_SHA256"),
    tombstoneValidator.includes("predecessor_authority_sha256") &&
      tombstoneValidator.includes("DELTA18_AUTHORITY_SHA256") &&
      tombstoneValidator.includes("prior_attempt_ordinal !== 1") &&
      tombstoneValidator.includes("consumed_category") &&
      tombstoneValidator.includes(
        '"QUALIFICATION_TWO_APPLICATION_REQUESTS_ISSUED"',
      ) &&
      tombstoneValidator.includes("replacement_authority_binding"),
    replacementValidator.includes(
      'replacement_authority_sha256 !== DELTA19_AUTHORITY_SHA256',
    ) &&
      replacementValidator.includes("qualification_attempt !== 2") &&
      replacementValidator.includes('phase !== "34IA-34IZ-DELTA19"'),
    rotationContract(orchestratorSource),
    release.includes("const lockAbsent = pathIsAbsent(guard.lock_path)") &&
      qualificationGuardReleaseContract(orchestratorSource) &&
      qualificationGuardReleaseMutation !== orchestratorSource &&
      !qualificationGuardReleaseContract(
        qualificationGuardReleaseMutation,
      ),
    removal.includes("unlinkSync(replacementPath)") &&
      removal.includes("unlinkSync(tombstonePath)") &&
      removal.includes("fsyncExactDirectory(lockRoot)"),
      selfTest.includes("SELF_TEST_DELTA19_QUALIFICATION_ROTATION") &&
      selfTest.includes("DELTA19_QUALIFICATION_ALREADY_CONSUMED") &&
      selfTest.includes("QUALIFICATION_TWO_APPLICATION_REQUESTS_ISSUED") &&
      selfTest.includes("partialGuardReleaseRecovered") &&
      selfTest.includes('"aifinder-34ia-delta19-selftest-"'),
    qualification.includes(
      "acquireDelta19ReplacementQualificationGuard({",
    ) &&
      qualification.indexOf(
        "acquireDelta19ReplacementQualificationGuard({",
      ) < qualification.indexOf("pushDelta14RegistrationBranch("),
    target.includes("validateDelta19ReplacementQualificationMarker({") &&
      target.includes(
        "validateDelta19QualificationConsumptionTombstone({",
      ),
    official.includes("validateDelta19ReplacementQualificationMarker({") &&
      official.includes(
        "validateDelta19QualificationConsumptionTombstone({",
      ) &&
      runtimeEvidenceText.includes("[3, 4, 5, 6, 7]") &&
      runtimeEvidenceDraftValidator.includes(
        "readback.preview?.deployments_created !== 7",
      ) &&
      delta19PreviewEvidenceContract(orchestratorSource) &&
      delta19PreviewEvidenceWriterMutation !== orchestratorSource &&
      !delta19PreviewEvidenceContract(delta19PreviewEvidenceWriterMutation) &&
      delta19PreviewEvidenceValidatorMutation !== orchestratorSource &&
      !delta19PreviewEvidenceContract(
        delta19PreviewEvidenceValidatorMutation,
      ) &&
      delta19DeleteContractEvidenceContract(evidenceTestSource) &&
      delta19DeleteContractEvidenceMutation !== evidenceTestSource &&
      !delta19DeleteContractEvidenceContract(
        delta19DeleteContractEvidenceMutation,
      ) &&
      delta19OfficialDurableRecoveryContract(orchestratorSource) &&
      delta19OfficialDurableResultMutation !== orchestratorSource &&
      !delta19OfficialDurableRecoveryContract(
        delta19OfficialDurableResultMutation,
      ) &&
      delta19OfficialDurableRootGateMutation !== orchestratorSource &&
      !delta19OfficialDurableRecoveryContract(
        delta19OfficialDurableRootGateMutation,
      ) &&
      delta19OfficialDurableSuccessOrderMutation !== orchestratorSource &&
      !delta19OfficialDurableRecoveryContract(
        delta19OfficialDurableSuccessOrderMutation,
      ) &&
      delta19OfficialEvidenceHashGuardMutation !== orchestratorSource &&
      !delta19OfficialDurableRecoveryContract(
        delta19OfficialEvidenceHashGuardMutation,
      ) &&
      delta19OfficialArtifactOrderMutation !== orchestratorSource &&
      !delta19OfficialDurableRecoveryContract(
        delta19OfficialArtifactOrderMutation,
      ) &&
      delta19OfficialArtifactIdempotenceMutation !== orchestratorSource &&
      !delta19OfficialDurableRecoveryContract(
        delta19OfficialArtifactIdempotenceMutation,
      ) &&
      delta19OfficialMarkerIdempotenceMutation !== orchestratorSource &&
      !(
        (
        namedFunctionText(
          astFacts(
            ORCHESTRATOR_PATH,
            delta19OfficialMarkerIdempotenceMutation,
          ).root,
          "removeResumeAttemptMarker",
        ) ?? ""
        ).includes("if (pathIsAbsent(markerPath)) {")
      ) &&
      delta19OfficialLockIdempotenceMutation !== orchestratorSource &&
      !(
        namedFunctionText(
          astFacts(
            ORCHESTRATOR_PATH,
            delta19OfficialLockIdempotenceMutation,
          ).root,
          "releaseResumeExecutionLock",
        ) ?? ""
      ).includes("if (lockAbsent) {") &&
      delta19OfficialRootParentFsyncMutation !== orchestratorSource &&
      !delta19OfficialDurableRecoveryContract(
        delta19OfficialRootParentFsyncMutation,
      ),
    rotationMutation !== orchestratorSource &&
      !rotationContract(rotationMutation),
    qualificationMutation !== orchestratorSource &&
      !(
        namedFunctionText(
          astFacts(ORCHESTRATOR_PATH, qualificationMutation).root,
          "qualifyDelta14LegacyAuthPreview",
        ) ?? ""
      ).includes("acquireDelta19ReplacementQualificationGuard({"),
    preMutationInventory.includes("collectDeploymentInventory(") &&
      preMutationInventory.includes('"delta19PreMutation"') &&
      preMutationInventory.includes("meta.githubCommitRef === plan.branch") &&
      qualification.includes(
        "verifyDelta19PreMutationExternalAbsence(context)",
      ) &&
      qualification.indexOf(
        "verifyDelta19PreMutationExternalAbsence(context)",
      ) <
        qualification.indexOf(
          "acquireDelta19ReplacementQualificationGuard({",
        ) &&
      plan.budgets.vercel_control_maximum === 353 &&
      environmentBudget.includes(
        "plan.budgets.environment_record_creates_maximum",
      ) &&
      environmentBudget.includes(
        "plan.budgets.branch_propagation_retries_maximum",
      ) &&
      environmentBudget.includes(
        "plan.budgets.environment_record_deletes_maximum * 2",
      ) &&
      environmentBudget.includes("maximum !== 64") &&
      environmentBudgetSelfTest.includes(
        'budgets.used.delta13EnvironmentMetadataRequests !== 64',
      ) &&
      environmentBudgetSelfTest.includes(
        'budgets.remaining("delta13EnvironmentMetadataRequests") !== 0',
      ) &&
      environmentFailureGate.includes(
        "environmentBefore !== null && !environmentCleaned",
      ) &&
      qualification.includes(
        "delta19EnvironmentFailureReconciliationRequired(\n        environmentBefore,\n        environmentCleaned,\n      )",
      ) &&
      orchestratorSource.includes("vercelInventoryTraversals: 30") &&
      orchestratorSource.includes("vercelInventoryPageRequests: 118") &&
      logoutMutationWindow.includes("DELTA18_QUALIFICATION_LOGOUT_WINDOW") &&
      logoutValidatedConfirmation.includes("validationComplete !== true") &&
      qualificationSession.includes(
        "persistDelta18QualificationLogoutMutationWindow(durableEvidence)",
      ) &&
      logoutCleanup.includes(
        "DELTA18_QUALIFICATION_LOGOUT_AUDIT_ABSENCE_SECOND",
      ) &&
      logoutMutationWindowSelfTest.includes(
        "SELF_TEST_DELTA18_QUALIFICATION_LOGOUT_UNRESOLVED",
      ) &&
      logoutMutationWindowSelfTest.includes(
        "completedErrorResponseRejected",
      ) &&
      logoutMutationWindowSelfTest.includes("delayedAuditCommitted") &&
      qualificationFailureTerminal.includes(
        '"DELTA18_QUALIFICATION_LOGOUT_MUTATION_UNRESOLVED"',
      ) &&
      qualificationFailureTerminal.includes(
        "rollbackFailures.length === 1",
      ) &&
      qualificationFailureTerminal.includes("dataCleaned === false") &&
      qualificationFailureTerminal.includes("guardReleased === false") &&
      qualificationFailureTerminal.includes("tempRootRemoved === false") &&
      qualification.includes(
        "const terminalCode = delta18QualificationFailureTerminalCode({",
      ) &&
      qualification.includes("fail(terminalCode)") &&
      qualification.indexOf(
        "const terminalCode = delta18QualificationFailureTerminalCode({",
      ) > qualification.indexOf("const cleanupComplete =") &&
      logoutMutationWindowContract(orchestratorSource) &&
      logoutWindowWaitMutation !== orchestratorSource &&
      !logoutMutationWindowContract(logoutWindowWaitMutation) &&
      logoutSecondAbsenceMutation !== orchestratorSource &&
      !logoutMutationWindowContract(logoutSecondAbsenceMutation) &&
      logoutPrematureConfirmMutation !== orchestratorSource &&
      !logoutMutationWindowContract(logoutPrematureConfirmMutation) &&
      logoutDispatchOnlyWindowMutation !== orchestratorSource &&
      !logoutMutationWindowContract(logoutDispatchOnlyWindowMutation) &&
      logoutTotalDeadlineMutation !== orchestratorSource &&
      !logoutMutationWindowContract(logoutTotalDeadlineMutation) &&
      logoutDeadlineBindingMutation !== orchestratorSource &&
      !logoutMutationWindowContract(logoutDeadlineBindingMutation) &&
      logoutUnresolvedMutation !== orchestratorSource &&
      !logoutMutationWindowContract(logoutUnresolvedMutation) &&
      logoutTerminalCategoryMutation !== orchestratorSource &&
      !(
        namedFunctionText(
          astFacts(ORCHESTRATOR_PATH, logoutTerminalCategoryMutation).root,
          "delta18QualificationFailureTerminalCode",
        ) ?? ""
      ).includes('"DELTA18_QUALIFICATION_LOGOUT_MUTATION_UNRESOLVED"'),
  ];
}

function delta18DurableProjectionBehaviorAssertions(orchestratorSource) {
  const required = [
    "projectDelta18DurableApplicationObservation",
    "validateDelta18DurableProjectionJournal",
    "validateDelta18DurableProjectionSemantics",
  ];
  if (required.some((name) => typeof core[name] !== "function")) {
    return Array(44).fill(false);
  }
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const cleanupGateText =
    namedFunctionText(
      facts.root,
      "deriveDelta18QualificationFailureCleanupGate",
    ) ?? "";
  const qualificationText =
    namedFunctionText(facts.root, "qualifyDelta14LegacyAuthPreview") ?? "";
  const cleanupGateSelfTestText =
    namedFunctionText(
      facts.root,
      "runDelta18QualificationFailureCleanupGateSelfTest",
    ) ?? "";
  const qualificationFailureEvidenceText =
    namedFunctionText(
      facts.root,
      "delta18QualificationFailureEvidence",
    ) ?? "";
  const acquireQualificationGuardText =
    namedFunctionText(
      facts.root,
      "acquireDelta19ReplacementQualificationGuard",
    ) ?? "";
  const validateQualificationAttemptText =
    namedFunctionText(
      facts.root,
      "validateDelta19ReplacementQualificationMarker",
    ) ?? "";
  const removeQualificationAttemptText =
    namedFunctionText(
      facts.root,
      "removeDelta19QualificationArtifacts",
    ) ?? "";
  const qualificationGuardSelfTestText =
    namedFunctionText(
      facts.root,
      "runDelta19QualificationRotationSelfTest",
    ) ?? "";
  const targetText =
    namedFunctionText(
      facts.root,
      "identifyDelta18DurableProjectionFinalTarget",
    ) ?? "";
  const officialText =
    namedFunctionText(
      facts.root,
      "executeDelta18DurableProjectionFinalRuntime",
    ) ?? "";
  const activationPushText =
    namedFunctionText(
      facts.root,
      "fastForwardDelta14ActivationBranch",
    ) ?? "";
  const activationTransitionValidatorText =
    namedFunctionText(
      facts.root,
      "validateDelta14ActivationTransition",
    ) ?? "";
  const activationTransitionPersistText =
    namedFunctionText(
      facts.root,
      "persistDelta14ActivationTransition",
    ) ?? "";
  const activationReconciliationText =
    namedFunctionText(
      facts.root,
      "reconcileDelta14UncertainActivation",
    ) ?? "";
  const externalCleanupText =
    namedFunctionText(
      facts.root,
      "cleanupResolvedExternalState",
    ) ?? "";
  const activationUncertaintySelfTestText =
    namedFunctionText(
      facts.root,
      "runDelta14ActivationUncertaintySelfTest",
    ) ?? "";
  const runSelfTestText =
    namedFunctionText(facts.root, "runSelfTest") ?? "";
  const runtimeContractBindingText =
    namedFunctionText(
      facts.root,
      "bindRuntimeResponseContractEvidence",
    ) ?? "";
  const identityQualificationSessionText =
    namedFunctionText(
      facts.root,
      "runDelta18IdentityQualificationSession",
    ) ?? "";
  const runtimeSessionText =
    namedFunctionText(facts.root, "runRuntimeSession") ?? "";
  const runtimeContractBindingSelfTestText =
    namedFunctionText(
      facts.root,
      "runDelta18RuntimeContractBindingSelfTest",
    ) ?? "";
  const runtimeContractBindingContract = (candidate) => {
    const candidateFacts = astFacts(ORCHESTRATOR_PATH, candidate);
    const binding =
      namedFunctionText(
        candidateFacts.root,
        "bindRuntimeResponseContractEvidence",
      ) ?? "";
    const identitySession =
      namedFunctionText(
        candidateFacts.root,
        "runDelta18IdentityQualificationSession",
      ) ?? "";
    const officialSession =
      namedFunctionText(candidateFacts.root, "runRuntimeSession") ?? "";
    const selfTest =
      namedFunctionText(
        candidateFacts.root,
        "runDelta18RuntimeContractBindingSelfTest",
      ) ?? "";
    return (
      binding.includes('spec.contract === "SESSION_COOKIE_CREATED"') &&
      binding.includes("contractProjection.session_cookie_contract_pass") &&
      binding.includes('session_cookie_samesite: "Strict"') &&
      binding.includes('spec.contract === "AUTHENTICATED_SESSION"') &&
      binding.includes("record.session_secret_signature_verified = true") &&
      binding.includes('spec.contract === "CSRF_COOKIE_AND_TOKEN"') &&
      binding.includes("contractProjection.csrf_cookie_matches_body") &&
      binding.includes("contractProjection.csrf_token_format") &&
      identitySession.includes("bindRuntimeResponseContractEvidence({") &&
      identitySession.indexOf("bindRuntimeResponseContractEvidence({") <
        identitySession.indexOf("validateRuntimeResponse(response.record)") &&
      officialSession.includes("bindRuntimeResponseContractEvidence({") &&
      officialSession.indexOf("bindRuntimeResponseContractEvidence({") <
        officialSession.indexOf("validateRuntimeResponse(response.record)") &&
      selfTest.includes("SELF_TEST_DELTA18_RUNTIME_CONTRACT_BINDING") &&
      selfTest.includes("SELF_TEST_DELTA18_RUNTIME_CONTRACT_BINDING_NEGATIVE")
    );
  };
  const runtimeContractBindingMutation = orchestratorSource.replace(
    "        bindRuntimeResponseContractEvidence({\n          adminPasswordMatchesDeployment:\n            contractOrdinal === 2 ? true : null,\n          contractProjection,\n          record: response.record,\n          spec,\n        });",
    "        void contractProjection;",
  );
  const activationUncertaintyContract = (candidate) => {
    const candidateFacts = astFacts(ORCHESTRATOR_PATH, candidate);
    const push =
      namedFunctionText(
        candidateFacts.root,
        "fastForwardDelta14ActivationBranch",
      ) ?? "";
    const reconcile =
      namedFunctionText(
        candidateFacts.root,
        "reconcileDelta14UncertainActivation",
      ) ?? "";
    const cleanup =
      namedFunctionText(
        candidateFacts.root,
        "cleanupResolvedExternalState",
      ) ?? "";
    return (
      push.includes("persistDelta14ActivationTransition({") &&
      push.indexOf("persistDelta14ActivationTransition({") <
        push.indexOf(
          'context.budgets.take("temporaryBranchCreatePushes")',
        ) &&
      push.includes("context.activationPushUncertain = true") &&
      reconcile.includes("readDelta14ActivationTransition(") &&
      reconcile.includes(
        'if (state === "ACTIVATION") {\n    context.commitSha = transition.activation_commit_sha',
      ) &&
      reconcile.includes(
        '} else if (state === "REGISTRATION") {\n    context.commitSha = transition.registration_commit_sha',
      ) &&
      reconcile.includes("const maximumObservations = 3") &&
      reconcile.includes("let consecutiveAbsentObservations = 0") &&
      reconcile.includes('if (observedState === "ABSENT")') &&
      reconcile.includes("consecutiveAbsentObservations += 1") &&
      reconcile.includes("consecutiveAbsentObservations === 2") &&
      reconcile.includes("consecutiveAbsentObservations = 0") &&
      cleanup.includes("reconcileDelta14UncertainActivation(context)") &&
      cleanup.indexOf("reconcileDelta14UncertainActivation(context)") <
        cleanup.indexOf("cleanupInventoryCandidate(")
    );
  };
  const activationUncertaintyMutations = [
    [
      "  persistDelta14ActivationTransition({\n    activationCommitSha,\n    context,\n    registrationCommitSha,\n  });\n  context.activationPushUncertain = true;",
      "  void ({ activationCommitSha, context, registrationCommitSha });\n  context.activationPushUncertain = true;",
    ],
    [
      '  if (state === "ACTIVATION") {\n    context.commitSha = transition.activation_commit_sha;',
      '  if (state === "ACTIVATION") {\n    context.commitSha = transition.registration_commit_sha;',
    ],
    [
      "context.commitSha = transition.registration_commit_sha",
      "context.commitSha = transition.activation_commit_sha",
    ],
    [
      "      reconcileDelta14UncertainActivation(context);",
      "      void context;",
    ],
    [
      '      if (consecutiveAbsentObservations === 2) {\n        state = "ABSENT";',
      '      if (consecutiveAbsentObservations === 1) {\n        state = "ABSENT";',
    ],
  ].map(([expected, replacement]) =>
    replaceExactlyOnce(orchestratorSource, expected, replacement),
  );
  const cleanupGateContract = (candidate) =>
    candidate.includes("input.data_cleaned") &&
    candidate.includes("input.environment_cleaned") &&
    candidate.includes("input.protected_access_clean") &&
    candidate.includes("input.registration_cleanup_resolved") &&
    candidate.includes("input.rollback_failures === 0") &&
    candidate.includes("input.temp_root_removed") &&
    candidate.includes("remove_root:");
  const protectedAccessMutation = cleanupGateText.replace(
    "input.protected_access_clean",
    "true",
  );
  const dataCleanupMutation = cleanupGateText.replace(
    "input.data_cleaned",
    "true",
  );
  const registrationCleanupMutation = cleanupGateText.replace(
    "input.registration_cleanup_resolved",
    "true",
  );
  const zeroRequestTelemetryMutation = qualificationFailureEvidenceText.replace(
    "data_requests: totalRequests",
    "data_requests: 0",
  );
  const zeroWriteTelemetryMutation = qualificationFailureEvidenceText.replace(
    "cleanupComplete || totalRequests === 0",
    "cleanupComplete",
  );
  const qualificationCountSnapshotMutation = qualificationText.replace(
    "qualificationDirectRequests = qualificationDirectCounts.directTotal",
    "void qualificationDirectCounts.directTotal",
  );
  const qualificationCatchWiringMutation = qualificationText.replaceAll(
    "retainedDirectRequests: qualificationDirectRequests",
    "retainedDirectRequests: 0",
  );
  const plan = core.createRuntimePlan();
  const identityClasses = new Map([
    [1, "ADMIN_TOOLS_UNAUTHENTICATED_401"],
    [2, "LOGIN_SUCCESS_200"],
    [3, "AUTHENTICATED_SESSION_200"],
    [4, "CSRF_ISSUED_200"],
    [5, "MISSING_CSRF_DENIAL_403"],
  ]);
  const bodyShapeClasses = new Map([
    [1, "EXACT_UNAUTHENTICATED_TOOLS_JSON"],
    [2, "EXACT_LOGIN_SUCCESS_JSON"],
    [3, "EXACT_AUTHENTICATED_SESSION_JSON"],
    [4, "EXACT_CSRF_SUCCESS_JSON"],
    [5, "EXACT_MISSING_CSRF_DENIAL_JSON"],
  ]);
  const pathClasses = new Map([
    ["/api/admin/tools", "ADMIN_TOOLS"],
    ["/api/admin/login", "ADMIN_LOGIN"],
    ["/api/admin/session", "ADMIN_SESSION"],
    ["/api/admin/csrf", "ADMIN_CSRF"],
    ["/api/admin/submissions", "ADMIN_SUBMISSIONS"],
    ["/api/admin/upload-logo", "ADMIN_UPLOAD_LOGO"],
    ["/api/admin/logout", "ADMIN_LOGOUT"],
    ["/api/admin/discovery/sources", "ADMIN_DISCOVERY_SOURCES"],
    ["/api/admin/unknown.map", "ADMIN_UNKNOWN_EXTENSION"],
  ]);
  const securityHeaderCategories = (request) => ({
    status_class:
      request.status === 401
        ? "EXPECTED_401"
        : request.status === 403
          ? "HTTP_403"
          : request.status === 404
            ? "HTTP_404"
            : request.status >= 400
              ? "HTTP_OTHER_4XX"
              : "OTHER",
    application_body_shape: [1, 20].includes(request.ordinal)
      ? "EXACT_JSON_OBJECT"
      : "OTHER",
    application_response_identity:
      request.ordinal === 1
        ? "ADMIN_TOOLS_UNAUTHENTICATED"
        : request.ordinal === 20
          ? "ADMIN_SESSION_UNAUTHENTICATED"
          : "OTHER",
    cache_control_no_store: true,
    x_content_type_options_nosniff: true,
    x_frame_options_deny: true,
    referrer_policy_strict_origin_when_cross_origin: true,
    x_dns_prefetch_control_off: true,
    cross_origin_opener_policy_same_origin: true,
    permissions_camera_disabled: true,
    permissions_microphone_disabled: true,
    permissions_geolocation_disabled: true,
    permissions_payment_disabled: true,
    permissions_usb_disabled: true,
    permissions_magnetometer_disabled: true,
    permissions_gyroscope_disabled: true,
    permissions_accelerometer_disabled: true,
    csp_frame_ancestors_none: true,
    csp_base_uri_self: true,
    csp_form_action_self: true,
    csp_object_src_none: true,
    hsts_present: true,
    hsts_max_age_class: "AT_LEAST_TWO_YEARS",
    hsts_include_subdomains: true,
    hsts_preload: true,
    x_robots_tag_noindex_advisory: true,
    disposition: [1, 20].includes(request.ordinal)
      ? "PASS_EXACT_APPLICATION_HEADER_CONTRACT"
      : "APPLICATION_RESPONSE_NOT_REACHED",
  });
  const makeObservation = (sequenceOrdinal, contractOrdinal) => {
    const request = plan.requests[contractOrdinal - 1];
    return core.projectDelta18DurableApplicationObservation({
      sequence_ordinal: sequenceOrdinal,
      contract_projection: {
        actual_status_integer: request.status,
        allow_methods_exact: request.ordinal === 16 ? true : null,
        body_contract: request.contract,
        csrf_cookie_contract_pass: request.ordinal === 4 ? true : null,
        csrf_cookie_matches_body: request.ordinal === 4 ? true : null,
        csrf_token_format: request.ordinal === 4 ? true : null,
        expected_status: request.status,
        fixture_binding_count: request.ordinal === 6 ? 3 : null,
        fixture_binding_exact: request.ordinal === 6 ? true : null,
        identity_contract_pass: request.ordinal <= 5 ? true : null,
        logo_object_path:
          request.ordinal === 15
            ? "admin/00000000-0000-4000-8000-000000000018.png"
            : null,
        logo_origin_match: request.ordinal === 15 ? true : null,
        logo_path_valid: request.ordinal === 15 ? true : null,
        logout_cookie_contract_pass: request.ordinal === 19 ? true : null,
        method: request.method,
        ordinal: request.ordinal,
        path: request.path,
        post_logout_denial_contract_pass:
          request.ordinal === 20 ? true : null,
        raw_body_persisted: false,
        raw_cookies_persisted: false,
        raw_headers_persisted: false,
        response_path_echo_absent:
          [17, 18].includes(request.ordinal) ? true : null,
        route_created_tool_id: request.ordinal === 9 ? 18 : null,
        route_positive_tool_id: request.ordinal === 9 ? true : null,
        route_unique_match_count: request.ordinal === 9 ? 1 : null,
        schema_version: 1,
        session_cookie_contract_pass: request.ordinal === 2 ? true : null,
        status_match: true,
      },
      response_projection: {
        actual_status_integer: request.status,
        application_identity_class:
          identityClasses.get(request.ordinal) ?? "OTHER_APPLICATION_RESPONSE",
        body_shape_class:
          bodyShapeClasses.get(request.ordinal) ?? "JSON_VALUE",
        cookie_effect_categories: {
          csrf_cookie:
            request.ordinal === 4
              ? "SET_SECURE_SAMESITE_STRICT_MAXAGE_14400"
              : request.ordinal === 19
                ? "CLEARED_MAXAGE_ZERO"
                : "ABSENT",
          session_cookie:
            request.ordinal === 2
              ? "SET_SECURE_HTTPONLY_SAMESITE_STRICT_MAXAGE_14400"
              : request.ordinal === 19
                ? "CLEARED_MAXAGE_ZERO"
                : "ABSENT",
        },
        expected_status: request.status,
        method: request.method,
        path_class: pathClasses.get(request.path),
        request_ordinal: request.ordinal,
        security_header_categories: securityHeaderCategories(request),
        status_match: true,
      },
    });
  };
  const journal = (kind, entries, complete = false) => ({
    schema_version: 1,
    phase: "34IA-34IZ-DELTA18",
    journal_kind: kind,
    expected_request_count: kind === "QUALIFICATION" ? 6 : 20,
    completed_request_count: entries.length,
    entries,
    projection_complete: complete,
    raw_body_persisted: false,
    raw_cookies_persisted: false,
    raw_headers_persisted: false,
    raw_secrets_persisted: false,
    raw_urls_persisted: false,
  });
  try {
    const request1 = makeObservation(1, 1);
    const request20 = makeObservation(20, 20);
    const qualificationMap = [1, 2, 3, 4, 19, 20];
    const qualification = qualificationMap.map((ordinal, index) =>
      makeObservation(index + 1, ordinal),
    );
    const official = plan.requests.map((request) =>
      makeObservation(request.ordinal, request.ordinal),
    );
    const qualificationPrefix = journal(
      "QUALIFICATION",
      qualification.slice(0, 3),
    );
    const qualificationComplete = journal(
      "QUALIFICATION",
      qualification,
      true,
    );
    const officialComplete = journal("OFFICIAL", official, true);
    const request1WrongIdentity = {
      ...request1,
      assertion: {
        ...request1.assertion,
        security_header_categories: {
          ...request1.assertion.security_header_categories,
          application_response_identity: "ADMIN_SESSION_UNAUTHENTICATED",
        },
      },
    };
    const request20WrongIdentity = {
      ...request20,
      assertion: {
        ...request20.assertion,
        security_header_categories: {
          ...request20.assertion.security_header_categories,
          application_response_identity: "ADMIN_TOOLS_UNAUTHENTICATED",
        },
      },
    };
    const serialized = JSON.stringify(officialComplete);
    return [
      required.every((name) => typeof core[name] === "function"),
      request1.sequence_ordinal === 1 && request1.contract_ordinal === 1,
      request20.sequence_ordinal === 20 && request20.contract_ordinal === 20,
      request1.assertion.security_header_categories
        .application_response_identity === "ADMIN_TOOLS_UNAUTHENTICATED",
      request20.assertion.security_header_categories
        .application_response_identity === "ADMIN_SESSION_UNAUTHENTICATED",
      core.validateDelta17SanitizedApplicationAssertion(request1.assertion)
        .ordinal === 1,
      core.validateDelta17SanitizedApplicationAssertion(request20.assertion)
        .ordinal === 20,
      catches(() =>
        core.validateDelta17SanitizedApplicationAssertion(
          request1WrongIdentity.assertion,
        ),
      ),
      catches(() =>
        core.validateDelta17SanitizedApplicationAssertion(
          request20WrongIdentity.assertion,
        ),
      ),
      core.validateDelta18DurableProjectionJournal(qualificationPrefix)
        .completed_request_count === 3,
      core.validateDelta18DurableProjectionJournal(qualificationComplete)
        .projection_complete === true,
      core.validateDelta18DurableProjectionSemantics(qualificationComplete)
        .validated_request_count === 6,
      core.validateDelta18DurableProjectionJournal(officialComplete)
        .completed_request_count === 20,
      core.validateDelta18DurableProjectionSemantics(officialComplete)
        .validated_request_count === 20,
      officialComplete.entries.every(
        (entry, index) => entry.sequence_ordinal === index + 1,
      ),
      new Set(officialComplete.entries.map((entry) => entry.contract_ordinal))
        .size === 20,
      !serialized.includes("https://"),
      !serialized.includes("csrf_token_value"),
      !serialized.includes("set-cookie"),
      !serialized.includes("ADMIN_PASSWORD"),
      catches(() =>
        core.validateDelta18DurableProjectionJournal({
          ...officialComplete,
          entries: [official[0], official[0], ...official.slice(2)],
        }),
      ),
      catches(() =>
        core.validateDelta18DurableProjectionJournal({
          ...officialComplete,
          entries: [official[0], ...official.slice(2)],
          completed_request_count: 19,
        }),
      ),
      catches(() =>
        core.validateDelta18DurableProjectionJournal({
          ...qualificationComplete,
          entries: [...qualification].reverse(),
        }),
      ),
      catches(() =>
        core.validateDelta18DurableProjectionJournal({
          ...qualificationPrefix,
          projection_complete: true,
        }),
      ),
      catches(() =>
        core.validateDelta18DurableProjectionJournal({
          ...officialComplete,
          projection_complete: false,
        }),
      ),
      catches(() =>
        core.validateDelta18DurableProjectionJournal({
          ...officialComplete,
          raw_body_persisted: true,
        }),
      ),
      catches(() =>
        core.validateDelta18DurableProjectionJournal({
          ...officialComplete,
          raw_body: "forbidden",
        }),
      ),
      catches(() =>
        core.validateDelta18DurableProjectionSemantics({
          ...qualificationComplete,
          entries: [
            ...qualificationComplete.entries.slice(0, 5),
            { ...qualificationComplete.entries[5], contract_ordinal: 1 },
          ],
        }),
      ),
      cleanupGateContract(cleanupGateText),
      protectedAccessMutation !== cleanupGateText &&
        !cleanupGateContract(protectedAccessMutation),
      dataCleanupMutation !== cleanupGateText &&
        !cleanupGateContract(dataCleanupMutation) &&
        registrationCleanupMutation !== cleanupGateText &&
        !cleanupGateContract(registrationCleanupMutation),
      qualificationFailureEvidenceText.includes(
        "const liveCount = direct?.counts().directTotal ?? null",
      ) &&
        qualificationFailureEvidenceText.includes(
          "const totalRequests = liveCount ?? retainedDirectRequests",
        ) &&
        qualificationFailureEvidenceText.includes(
          "data_requests: totalRequests",
        ) &&
        qualificationFailureEvidenceText.includes(
          "cleanupComplete || totalRequests === 0",
        ) &&
        qualificationFailureEvidenceText.includes(
          ': "possible_or_occurred"',
        ) &&
        cleanupGateSelfTestText.includes("zeroRequestFailureEvidence") &&
        cleanupGateSelfTestText.includes(
          "SELF_TEST_DELTA18_QUALIFICATION_FAILURE_CLEAN_TELEMETRY",
        ) &&
        cleanupGateSelfTestText.includes(
          "SELF_TEST_DELTA18_QUALIFICATION_FAILURE_DIRTY_TELEMETRY",
        ) &&
        zeroRequestTelemetryMutation !== qualificationFailureEvidenceText &&
        !zeroRequestTelemetryMutation.includes("data_requests: totalRequests") &&
        zeroWriteTelemetryMutation !== qualificationFailureEvidenceText &&
        !zeroWriteTelemetryMutation.includes(
          "cleanupComplete || totalRequests === 0",
        ) &&
        qualificationText.includes(
          "qualificationDirectRequests = qualificationDirectCounts.directTotal",
        ) &&
        qualificationText.includes(
          "qualificationFailureDataEvidence.data_writes === \"0\"",
        ) &&
        qualificationText.includes("priorReconciliationDirect === null") &&
        qualificationText.indexOf(
          "qualificationDirectRequests = qualificationDirectCounts.directTotal",
        ) < qualificationText.lastIndexOf("qualificationDirect = null") &&
        qualificationText.includes("direct: qualificationDirect") &&
        qualificationText.includes(
          "retainedDirectRequests: qualificationDirectRequests",
        ) &&
        qualificationCountSnapshotMutation !== qualificationText &&
        !qualificationCountSnapshotMutation.includes(
          "qualificationDirectRequests = qualificationDirectCounts.directTotal",
        ) &&
        qualificationCatchWiringMutation !== qualificationText &&
        !qualificationCatchWiringMutation.includes(
          "retainedDirectRequests: qualificationDirectRequests",
        ),
      qualificationText.includes("context.deferTempRootRemoval = true") &&
        qualificationText.indexOf("context.deferTempRootRemoval = true") <
          qualificationText.indexOf("await rollbackLiveContext(context)") &&
        qualificationText.includes(
          "deriveDelta18QualificationFailureCleanupGate(",
        ) &&
        qualificationText.includes("protectedAccessCleanupComplete()") &&
        cleanupGateSelfTestText.includes("activeCredential.remove_root") &&
        cleanupGateSelfTestText.includes("retainedArtifact.remove_root") &&
        cleanupGateSelfTestText.includes("unresolvedAudit.remove_root") &&
        cleanupGateSelfTestText.includes("cleanBeforeRoot.remove_root") &&
        qualificationText.includes("!protectedAccessCleanupComplete()") &&
        !qualificationText.includes(
          "if (protectedAccessCredentialActive) {",
        ),
      acquireQualificationGuardText.includes("fsConstants.O_EXCL") &&
        acquireQualificationGuardText.includes("fsyncExactDirectory(") &&
        acquireQualificationGuardText.includes(
          "DELTA19_QUALIFICATION_ALREADY_CONSUMED",
        ),
      validateQualificationAttemptText.includes("readRegularFile(") &&
        validateQualificationAttemptText.includes("canonicalJson(") &&
        validateQualificationAttemptText.includes(
          "DELTA19_REPLACEMENT_QUALIFICATION_MARKER_BINDING",
        ),
      removeQualificationAttemptText.includes("unlinkSync(") &&
        removeQualificationAttemptText.includes("fsyncExactDirectory(") &&
        !removeQualificationAttemptText.includes("recursive"),
      qualificationText.includes(
        "delta20ExecutionLock = acquireDelta20ExecutionLock(tempRoot)",
      ) &&
        qualificationText.indexOf(
          "delta20ExecutionLock = acquireDelta20ExecutionLock(tempRoot)",
        ) <
          qualificationText.indexOf("pushDelta14RegistrationBranch(") &&
        qualificationText.includes(
          "releaseDelta20ExecutionLock(delta20ExecutionLock)",
        ) &&
        !qualificationText.includes(
          "retireDelta20RetainedAuthorizationArtifacts(",
        ),
      targetText.includes(
        'expectedActiveState: "QUALIFICATION_ATTEMPT_STARTED"',
      ) &&
        targetText.includes(
          "deriveDelta18DurableProjectionFinalAuthorization(",
        ) &&
        officialText.includes(
          'expectedActiveState: "QUALIFICATION_ATTEMPT_STARTED"',
        ) &&
        officialText.includes(
          "retireDelta20RetainedAuthorizationArtifacts({",
        ) &&
        officialText.indexOf(
          "retireDelta20RetainedAuthorizationArtifacts({",
        ) > officialText.indexOf("retireDelta20DurableEvidence({") &&
        officialText.includes("runtimeEvidenceWritten = true") &&
        officialText.indexOf(
          "retireDelta20RetainedAuthorizationArtifacts({",
        ) > officialText.indexOf("runtimeEvidenceWritten = true"),
      qualificationGuardSelfTestText.includes("sequentialRejected") &&
        qualificationGuardSelfTestText.includes(
          "tombstonePreservesConsumption",
        ) &&
        qualificationGuardSelfTestText.includes(
          "removeDelta19QualificationArtifacts({",
        ),
      activationTransitionValidatorText.includes(
        'value.phase !== "34IA-34IZ-DELTA20"',
      ) &&
        activationTransitionValidatorText.includes(
          "value.registration_commit_sha === value.activation_commit_sha",
        ) &&
        activationTransitionValidatorText.includes(
          "value.marker_sha256 !== plan.marker.sha256",
        ),
      activationTransitionPersistText.includes(
        "atomicPersistMode0600Json({",
      ) &&
        activationTransitionPersistText.includes(
          "DELTA18_BRANCH_TRANSITION_FILENAME",
        ),
      activationPushText.includes(
        "context.activationCommitSha = activationCommitSha",
      ) &&
        activationPushText.includes(
          "context.activationPushUncertain = true",
        ) &&
        activationPushText.includes(
          "persistDelta14ActivationTransition({",
        ) &&
        activationPushText.indexOf("persistDelta14ActivationTransition({") <
          activationPushText.indexOf(
            'context.budgets.take("temporaryBranchCreatePushes")',
          ),
      activationReconciliationText.includes(
        "readDelta14ActivationTransition(",
      ) &&
        activationReconciliationText.includes('state === "ACTIVATION"') &&
        activationReconciliationText.includes('state === "REGISTRATION"') &&
        activationReconciliationText.includes('state === "ABSENT"') &&
        activationReconciliationText.includes('state === "OTHER"') &&
        externalCleanupText.includes(
          "reconcileDelta14UncertainActivation(context)",
        ),
      activationUncertaintyContract(orchestratorSource) &&
        activationUncertaintyMutations.every(
          (mutation) =>
            mutation !== null && !activationUncertaintyContract(mutation),
        ) &&
      activationUncertaintySelfTestText.includes(
          '["MALFORMED", "ABSENT", "ACTIVATION"]',
        ) &&
        activationUncertaintySelfTestText.includes(
          '["MALFORMED", "ABSENT", "ABSENT"]',
        ) &&
      activationUncertaintySelfTestText.includes(
          "appliedAfterFailedRead.commitSha !== activationCommitSha",
        ) &&
        runSelfTestText.includes(
          "runDelta14ActivationUncertaintySelfTest(plan)",
        ) &&
        runtimeContractBindingContract(orchestratorSource) &&
        runtimeContractBindingText.length > 0 &&
        identityQualificationSessionText.length > 0 &&
        runtimeSessionText.length > 0 &&
        runtimeContractBindingSelfTestText.length > 0 &&
        runtimeContractBindingMutation !== orchestratorSource &&
        !runtimeContractBindingContract(runtimeContractBindingMutation),
    ];
  } catch {
    return Array(44).fill(false);
  }
}

function delta20VerifiedEvidencePublicationBehaviorAssertions() {
  const required = [
    "classifyDelta20RepositoryTransition",
    "transitionDelta20PublicationLifecycle",
    "validateDelta20ProjectionCorpus",
  "validateDelta20SensitiveStdinTransport",
  "validateDelta20VerifiedPublicationFinalAuthorization",
  ];
  if (required.some((name) => typeof core[name] !== "function")) {
    return Array(41).fill(false);
  }
  try {
    const plan = core.createRuntimePlan();
    const digestA = "a".repeat(64);
    const digestB = "b".repeat(64);
    const evidencePaths = [
      "testing/admin-v1-staging-runtime-evidence.json",
      "testing/readiness-coverage-matrix.json",
      "testing/public-launch-blocker-registry.json",
      "testing/static-test-safety-manifest.json",
    ];
    const authorizedTransition =
      core.classifyDelta20RepositoryTransition({
        authorized_evidence_paths: evidencePaths,
        changed_paths: evidencePaths,
        evidence_after_sha256: digestB,
        evidence_before_sha256: digestA,
        immutable_after_sha256: digestA,
        immutable_before_sha256: digestA,
      });
    const noDrift = core.classifyDelta20RepositoryTransition({
      authorized_evidence_paths: evidencePaths,
      changed_paths: [],
      evidence_after_sha256: digestA,
      evidence_before_sha256: digestA,
      immutable_after_sha256: digestA,
      immutable_before_sha256: digestA,
    });
    const transition = (currentState, event, kind = "RUNTIME") =>
      core.transitionDelta20PublicationLifecycle({
        current_state: currentState,
        event,
        kind,
      });
    const frozen = transition(
      "PROJECTION_MUTABLE",
      "FREEZE_PROJECTION",
    );
    const cleanupPendingPublished = transition(
      frozen.state,
      "PUBLISH_CLEANUP_PENDING",
    );
    const validatorFailure = transition(
      cleanupPendingPublished.state,
      "PUBLICATION_VALIDATION_FAILED",
    );
    const cleanupPendingVerified = transition(
      cleanupPendingPublished.state,
      "VERIFY_CLEANUP_PENDING",
    );
    const externalCleanupComplete = transition(
      cleanupPendingVerified.state,
      "CLEAN_EXTERNAL_EFFECTS",
    );
    const runtimeCompletePublished = transition(
      externalCleanupComplete.state,
      "PUBLISH_COMPLETE",
    );
    const runtimeCompleteVerified = transition(
      runtimeCompletePublished.state,
      "VERIFY_COMPLETE",
    );
    const retirementReceiptPersisted = transition(
      runtimeCompleteVerified.state,
      "PERSIST_RETIREMENT_RECEIPT",
    );
    const durableStateRetired = transition(
      retirementReceiptPersisted.state,
      "RETIRE_DURABLE_STATE",
    );
    const createTransport =
      core.validateDelta20SensitiveStdinTransport({
        argv_contains_secret: false,
        body_byte_count: 512,
        body_file_created: false,
        body_json_keys: [
          "comment",
          "gitBranch",
          "key",
          "target",
          "type",
          "value",
        ],
        buffer_zeroed: true,
        clipboard_contains_secret: false,
        filename_contains_secret: false,
        filesystem_body_path: null,
        hash_contains_secret: false,
        log_contains_secret: false,
        operation: "CREATE",
        stdin_byte_count: 512,
        stdin_json_shape_verified: true,
        transport: "STDIN",
      });
    const deleteTransport =
      core.validateDelta20SensitiveStdinTransport({
        argv_contains_secret: false,
        body_byte_count: 0,
        body_file_created: false,
        body_json_keys: [],
        buffer_zeroed: true,
        clipboard_contains_secret: false,
        filename_contains_secret: false,
        filesystem_body_path: null,
        hash_contains_secret: false,
        log_contains_secret: false,
        operation: "DELETE_RECONCILIATION",
        stdin_byte_count: 0,
        stdin_json_shape_verified: true,
        transport: "NO_BODY",
      });
    const corpus = {
      entries: Array.from({ length: 20 }, (_unused, index) => ({
        contract_ordinal: index + 1,
        projection_source: "SANITIZED_DURABLE_PROJECTION",
        sequence_ordinal: index + 1,
        validator_re_evaluable: true,
      })),
      expected_request_count: 20,
      journal_kind: "OFFICIAL",
      projection_complete: true,
      raw_material_persisted: false,
    };
    const corpusResult = core.validateDelta20ProjectionCorpus(corpus);
    return [
      required.every((name) => typeof core[name] === "function"),
      plan.branch ===
        "aifinder-phase-34ia-evidence-publication-runtime-validation-v3",
      plan.marker.bytes === 475,
      plan.marker.lf === 10,
      plan.marker.sha256 ===
        "f8ad3e3d1d764c92d03bf44081e3b341d93680664645c257726a54940bfd4b2f",
      plan.marker.trailing_lf === true,
      plan.marker_path ===
        "testing/aifinder-phase-34fa-staging-runtime-preview-marker.txt",
      authorizedTransition.disposition ===
        "AUTHORIZED_EVIDENCE_PUBLICATION",
      authorizedTransition.preserve_journal === true,
      authorizedTransition.preserve_cleanup_locators === true,
      noDrift.disposition === "NO_DRIFT",
      catches(() =>
        core.classifyDelta20RepositoryTransition({
          authorized_evidence_paths: evidencePaths,
          changed_paths: ["app/page.tsx"],
          evidence_after_sha256: digestB,
          evidence_before_sha256: digestA,
          immutable_after_sha256: digestA,
          immutable_before_sha256: digestA,
        }),
      ),
      catches(() =>
        core.classifyDelta20RepositoryTransition({
          authorized_evidence_paths: evidencePaths,
          changed_paths: evidencePaths,
          evidence_after_sha256: digestB,
          evidence_before_sha256: digestA,
          immutable_after_sha256: digestB,
          immutable_before_sha256: digestA,
        }),
      ),
      frozen.state === "PROJECTION_FROZEN",
      frozen.journal_retained === true,
      cleanupPendingPublished.state === "CLEANUP_PENDING_PUBLISHED",
      cleanupPendingPublished.teardown_allowed === false,
      validatorFailure.state === "CLEANUP_PENDING_PUBLISHED",
      validatorFailure.repair_required === true,
      validatorFailure.journal_retained === true,
      validatorFailure.cleanup_locators_retained === true,
      cleanupPendingVerified.state === "CLEANUP_PENDING_VERIFIED",
      externalCleanupComplete.state === "EXTERNAL_CLEANUP_COMPLETE",
      runtimeCompletePublished.state === "COMPLETE_PUBLISHED",
      runtimeCompleteVerified.state === "COMPLETE_VERIFIED",
      retirementReceiptPersisted.state ===
        "RETIREMENT_RECEIPT_PERSISTED",
      retirementReceiptPersisted.teardown_allowed === false,
      durableStateRetired.state === "DURABLE_STATE_RETIRED",
      durableStateRetired.teardown_allowed === true,
      durableStateRetired.journal_retained === false,
      catches(() =>
        transition("PROJECTION_FROZEN", "CLEAN_EXTERNAL_EFFECTS"),
      ),
      catches(() =>
        transition("CLEANUP_PENDING_VERIFIED", "RETIRE_DURABLE_STATE"),
      ),
      createTransport.stdin_only === true,
      createTransport.sanitized === true,
      deleteTransport.bodyless === true,
      catches(() =>
        core.validateDelta20SensitiveStdinTransport({
          ...createTransport.input,
          body_file_created: true,
          filesystem_body_path: "environment-request.json",
        }),
      ),
      catches(() =>
        core.validateDelta20SensitiveStdinTransport({
          ...createTransport.input,
          argv_contains_secret: true,
        }),
      ),
      corpusResult.validated_request_count === 20,
      corpusResult.re_evaluable_request_count === 20,
      catches(() =>
        core.validateDelta20ProjectionCorpus({
          ...corpus,
          entries: [corpus.entries[0], ...corpus.entries.slice(0, 19)],
        }),
      ),
      catches(() =>
        core.validateDelta20ProjectionCorpus({
          ...corpus,
          projection_complete: false,
        }),
      ),
    ];
  } catch {
    return Array(41).fill(false);
  }
}

function delta20VerifiedPublicationIntegrationAssertions(orchestratorSource) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const selfTest =
    namedFunctionText(
      facts.root,
      "runDelta20VerifiedPublicationSelfTest",
    ) ?? "";
  const cleanup =
    namedFunctionText(
      facts.root,
      "cleanupDelta20PublicationSelfTestRoot",
    ) ?? "";
  const atomicReconciliation =
    namedFunctionText(facts.root, "reconcileAtomicMode0600Json") ?? "";
  const publication =
    namedFunctionText(facts.root, "publishDelta20RepositoryEvidence") ?? "";
  const publicationReevaluation =
    namedFunctionText(
      facts.root,
      "publishDelta20RepositoryEvidenceWithLocalReevaluation",
    ) ?? "";
  const runtimeRootTeardown =
    namedFunctionText(facts.root, "removeDelta20CompletedRuntimeRoot") ?? "";
  const retainedAuthorization =
    namedFunctionText(
      facts.root,
      "validateDelta20RetainedAuthorizationArtifacts",
    ) ?? "";
  const activeInitializationLockRecoveryContract = (candidateSource) => {
    const candidateFacts = astFacts(ORCHESTRATOR_PATH, candidateSource);
    const staleAuthorization =
      namedFunctionText(
        candidateFacts.root,
        "validateDelta20StaleExecutionLockAuthorization",
      ) ?? "";
    const staleRoot =
      namedFunctionText(
        candidateFacts.root,
        "delta20ValidateStaleExecutionLockRoot",
      ) ?? "";
    const acquireLock =
      namedFunctionText(
        candidateFacts.root,
        "acquireDelta20ExecutionLock",
      ) ?? "";
    const qualificationRepair =
      namedFunctionText(
        candidateFacts.root,
        "repairDelta20QualificationPublicationFromRetainedJournal",
      ) ?? "";
    const interruptedQualificationRepair =
      namedFunctionText(
        candidateFacts.root,
        "repairDelta20InterruptedQualificationExecution",
      ) ?? "";
    const candidateSelfTest =
      namedFunctionText(
        candidateFacts.root,
        "runDelta20VerifiedPublicationSelfTest",
      ) ?? "";
    return (
      staleAuthorization.includes(
        'new Set(["ACTIVE", "QUALIFICATION_ATTEMPT_STARTED"])',
      ) &&
      staleAuthorization.includes("expectedActiveState,") &&
      staleAuthorization.includes(
        'expectedActiveState === "QUALIFICATION_ATTEMPT_STARTED"',
      ) &&
      staleAuthorization.includes("? value.recovery_root_basename") &&
      staleAuthorization.includes(": null,") &&
      staleRoot.includes(
        'expectedActiveState = "QUALIFICATION_ATTEMPT_STARTED"',
      ) &&
      staleRoot.includes(
        "validateDelta20StaleExecutionLockAuthorization({",
      ) &&
      acquireLock.includes(
        'expectedActiveState = "QUALIFICATION_ATTEMPT_STARTED"',
      ) &&
      acquireLock.includes(
        "delta20ValidateStaleExecutionLockRoot(\n          lockRoot,\n          existing,\n          expectedActiveState,",
      ) &&
      acquireLock.includes(
        "return acquireDelta20ExecutionLock(\n        canonicalRecoveryRoot,\n        lockRoot,\n        expectedActiveState,",
      ) &&
      qualificationRepair.includes(
        'const bootstrapLock = acquireDelta20ExecutionLock(\n      retained.root,\n      realpathSync.native(tmpdir()),\n      "ACTIVE",',
      ) &&
      interruptedQualificationRepair.includes(
        'const lock = acquireDelta20ExecutionLock(\n      retained.root,\n      realpathSync.native(tmpdir()),\n      "ACTIVE",',
      ) &&
      candidateSelfTest.includes(
        "validateDelta20StaleExecutionLockAuthorization({",
      ) &&
      candidateSelfTest.includes('expectedActiveState: "ACTIVE"') &&
      candidateSelfTest.includes(
        "activeInitializationLockRecoveryPassed",
      )
    );
  };
  const bootstrapActiveStateMutation = orchestratorSource.replace(
    'const bootstrapLock = acquireDelta20ExecutionLock(\n      retained.root,\n      realpathSync.native(tmpdir()),\n      "ACTIVE",',
    'const bootstrapLock = acquireDelta20ExecutionLock(\n      retained.root,\n      realpathSync.native(tmpdir()),\n      "QUALIFICATION_ATTEMPT_STARTED",',
  );
  const interruptedActiveStateMutation = orchestratorSource.replace(
    'const lock = acquireDelta20ExecutionLock(\n      retained.root,\n      realpathSync.native(tmpdir()),\n      "ACTIVE",',
    'const lock = acquireDelta20ExecutionLock(\n      retained.root,\n      realpathSync.native(tmpdir()),\n      "QUALIFICATION_ATTEMPT_STARTED",',
  );
  return [
    selfTest.includes("validateDelta20RuntimePublicationRecovery(") &&
      selfTest.includes("publicationRecoveryPassed") &&
      selfTest.includes("executionRecoveryPassed") &&
      selfTest.includes("createDelta20RuntimeExecutionRecoveryController({"),
    selfTest.includes(
      "publishDelta20RepositoryEvidenceWithLocalReevaluation(",
    ) &&
      selfTest.includes("reevaluationAttempts === 2") &&
      publicationReevaluation.includes("input.locatorSha256") &&
      publicationReevaluation.includes(
        "DELTA20_PUBLICATION_REEVALUATION_LOCATOR_DRIFT",
      ),
    selfTest.includes("validateDelta20ProjectionCorpus({") &&
      selfTest.includes("expected_request_count: 20"),
    selfTest.includes("validateDelta20SensitiveStdinTransport({") &&
      selfTest.includes('operation: "CREATE"') &&
      selfTest.includes('operation: "DELETE_RECONCILIATION"'),
    selfTest.includes("validatorFailureRetentionPassed") &&
      selfTest.includes("failedValidation.journal_retained === true") &&
      selfTest.includes(
        "failedValidation.cleanup_locators_retained === true",
      ) &&
      publication.includes("DELTA20_PUBLICATION_AFTER_WRITE_BINDING") &&
      publication.includes("DELTA20_PUBLICATION_AFTER_VALIDATION_BINDING") &&
      publication.includes("DELTA20_PUBLICATION_PRE_RECEIPT_BINDING") &&
      publication.includes("plannedAfterFiles: transactionValue.after_files"),
    selfTest.includes("PERSIST_RETIREMENT_RECEIPT") &&
      selfTest.includes("RETIRE_DURABLE_STATE") &&
      selfTest.includes("teardownOrderPassed") &&
      selfTest.includes("runtimeRootTeardownPassed") &&
      runtimeRootTeardown.includes("activeFile: nextFile") &&
      runtimeRootTeardown.includes("removedFiles: progress.removed_files"),
    cleanup.includes("SELF_TEST_DELTA20_PUBLICATION_UNEXPECTED_ARTIFACT") &&
      cleanup.includes("SELF_TEST_DELTA20_PUBLICATION_ROOT_RESIDUE") &&
      atomicReconciliation.includes("renameSync(nextPath, targetPath)") &&
      atomicReconciliation.includes("fsyncExactDirectory(canonicalRoot)"),
    orchestratorSource.includes(
      'mode === "--self-test-delta20-publication"',
    ) && orchestratorSource.includes(
      "PASS_ADMIN_V1_DELTA20_VERIFIED_PUBLICATION_SELF_TEST",
    ) &&
      selfTest.includes("activeAuthorizationTransitionPassed") &&
      selfTest.includes("historicalCandidateRebindingPassed") &&
      selfTest.includes("currentQualificationCandidateSha256") &&
      retainedAuthorization.includes("canonicalJson(replacement)") &&
      !retainedAuthorization.includes(
        "replacement.candidate_manifest_sha256 !==",
      ) &&
      selfTest.includes("atomicRecoveryPassed") &&
      activeInitializationLockRecoveryContract(orchestratorSource) &&
      bootstrapActiveStateMutation !== orchestratorSource &&
      !activeInitializationLockRecoveryContract(
        bootstrapActiveStateMutation,
      ) &&
      interruptedActiveStateMutation !== orchestratorSource &&
      !activeInitializationLockRecoveryContract(
        interruptedActiveStateMutation,
      ),
  ];
}

function delta17PersistedStateOracleBehaviorAssertions() {
  const required = [
    "buildDelta17PersistedStateOracle",
    "deriveDelta17PoststateOracleQualifiedFinalTarget",
    "projectDelta17SanitizedApplicationAssertion",
    "projectDelta17SanitizedPostState",
    "validateDelta17PoststateOracleQualifiedAuthorization",
    "validateDelta17ProjectionSufficiency",
  ];
  if (required.some((name) => typeof core[name] !== "function")) {
    return Array(41).fill(false);
  }
  try {
    const plan = core.createRuntimePlan();
    const runMarker = "00000000-0000-4000-8000-000000000017";
    const routeDomain = `route-${runMarker}.invalid`;
    const editDomain = `edit-updated-${runMarker}.invalid`;
    const approveDomain = `approve-${runMarker}.invalid`;
    const routeWebsiteLexical = `https://${routeDomain}`;
    const editWebsiteLexical = `https://${editDomain}`;
    const editFixtureWebsiteRaw = `https://edit-${runMarker}.invalid`;
    const rejectFixtureWebsiteRaw = `https://reject-${runMarker}.invalid`;
    const approveWebsiteRaw = `https://${approveDomain}`;
    const sourceBindings = {
      approval_rpc_logo_url: "COPY_SUBMISSION_LOGO_URL",
      approval_rpc_submission_status: "SET_APPROVED",
      approval_rpc_tool_status: "INSERT_APPROVED",
      approval_rpc_website: "COPY_SUBMISSION_WEBSITE",
      submission_logo_url: "VALIDATE_OPTIONAL_LOGO_URL_TO_STRING_OR_NULL",
      submission_website: "VALIDATE_HTTPS_URL_TO_STRING",
      tool_logo_url: "VALIDATE_OPTIONAL_LOGO_URL_TO_STRING_OR_NULL",
      tool_website: "VALIDATE_HTTPS_URL_TO_STRING",
    };
    const oracle = core.buildDelta17PersistedStateOracle({
      approve_submission_logo_url_raw: null,
      approve_submission_website_raw: approveWebsiteRaw,
      edit_fixture_website_raw: editFixtureWebsiteRaw,
      edit_submission_logo_url_lexical: null,
      edit_submission_website_lexical: editWebsiteLexical,
      reject_fixture_website_raw: rejectFixtureWebsiteRaw,
      route_tool_logo_url_lexical: null,
      route_tool_website_lexical: routeWebsiteLexical,
      source_bindings: sourceBindings,
    });
    const routeToolId = 101;
    const approvedToolId = 102;
    const fixtureIds = { EDIT: 201, REJECT: 202, APPROVE: 203 };
    const routeName = "34IA ROUTE 00000000 UPDATED";
    const editName = "34IA EDIT 00000000 UPDATED";
    const rejectName = "34IA REJECT 00000000";
    const approveName = "34IA APPROVE 00000000";
    const logoPath = "admin/00000000-0000-4000-8000-000000000017.png";
    const securityHeaderCategories = (request) => ({
      status_class:
        request.status === 401
          ? "EXPECTED_401"
          : request.status === 403
            ? "HTTP_403"
            : request.status === 404
              ? "HTTP_404"
              : request.status >= 400
                ? "HTTP_OTHER_4XX"
                : "OTHER",
      application_body_shape:
        [1, 20].includes(request.ordinal) ? "EXACT_JSON_OBJECT" : "OTHER",
      application_response_identity:
        request.ordinal === 1
          ? "ADMIN_TOOLS_UNAUTHENTICATED"
          : request.ordinal === 20
            ? "ADMIN_SESSION_UNAUTHENTICATED"
            : "OTHER",
      cache_control_no_store: true,
      x_content_type_options_nosniff: true,
      x_frame_options_deny: true,
      referrer_policy_strict_origin_when_cross_origin: true,
      x_dns_prefetch_control_off: true,
      cross_origin_opener_policy_same_origin: true,
      permissions_camera_disabled: true,
      permissions_microphone_disabled: true,
      permissions_geolocation_disabled: true,
      permissions_payment_disabled: true,
      permissions_usb_disabled: true,
      permissions_magnetometer_disabled: true,
      permissions_gyroscope_disabled: true,
      permissions_accelerometer_disabled: true,
      csp_frame_ancestors_none: true,
      csp_base_uri_self: true,
      csp_form_action_self: true,
      csp_object_src_none: true,
      hsts_present: true,
      hsts_max_age_class: "AT_LEAST_TWO_YEARS",
      hsts_include_subdomains: true,
      hsts_preload: true,
      x_robots_tag_noindex_advisory: true,
      disposition: [1, 20].includes(request.ordinal)
        ? "PASS_EXACT_APPLICATION_HEADER_CONTRACT"
        : "APPLICATION_RESPONSE_NOT_REACHED",
    });
    const identityClasses = new Map([
      [1, "ADMIN_TOOLS_UNAUTHENTICATED_401"],
      [2, "LOGIN_SUCCESS_200"],
      [3, "AUTHENTICATED_SESSION_200"],
      [4, "CSRF_ISSUED_200"],
      [5, "MISSING_CSRF_DENIAL_403"],
    ]);
    const bodyShapeClasses = new Map([
      [1, "EXACT_UNAUTHENTICATED_TOOLS_JSON"],
      [2, "EXACT_LOGIN_SUCCESS_JSON"],
      [3, "EXACT_AUTHENTICATED_SESSION_JSON"],
      [4, "EXACT_CSRF_SUCCESS_JSON"],
      [5, "EXACT_MISSING_CSRF_DENIAL_JSON"],
    ]);
    const pathClasses = new Map([
      ["/api/admin/tools", "ADMIN_TOOLS"],
      ["/api/admin/login", "ADMIN_LOGIN"],
      ["/api/admin/session", "ADMIN_SESSION"],
      ["/api/admin/csrf", "ADMIN_CSRF"],
      ["/api/admin/submissions", "ADMIN_SUBMISSIONS"],
      ["/api/admin/upload-logo", "ADMIN_UPLOAD_LOGO"],
      ["/api/admin/logout", "ADMIN_LOGOUT"],
      ["/api/admin/discovery/sources", "ADMIN_DISCOVERY_SOURCES"],
      ["/api/admin/unknown.map", "ADMIN_UNKNOWN_EXTENSION"],
    ]);
    const applicationContracts = plan.requests.map((request) =>
      core.projectDelta17SanitizedApplicationAssertion({
        contract_projection: {
          actual_status_integer: request.status,
          allow_methods_exact: request.ordinal === 16 ? true : null,
          body_contract: request.contract,
          csrf_cookie_contract_pass: request.ordinal === 4 ? true : null,
          csrf_cookie_matches_body: request.ordinal === 4 ? true : null,
          csrf_token_format: request.ordinal === 4 ? true : null,
          expected_status: request.status,
          fixture_binding_count: request.ordinal === 6 ? 3 : null,
          fixture_binding_exact: request.ordinal === 6 ? true : null,
          identity_contract_pass:
            request.ordinal <= 5 ? true : null,
          logo_object_path: request.ordinal === 15 ? logoPath : null,
          logo_origin_match: request.ordinal === 15 ? true : null,
          logo_path_valid: request.ordinal === 15 ? true : null,
          logout_cookie_contract_pass: request.ordinal === 19 ? true : null,
          method: request.method,
          ordinal: request.ordinal,
          path: request.path,
          post_logout_denial_contract_pass:
            request.ordinal === 20 ? true : null,
          raw_body_persisted: false,
          raw_cookies_persisted: false,
          raw_headers_persisted: false,
          response_path_echo_absent:
            [17, 18].includes(request.ordinal) ? true : null,
          route_created_tool_id: request.ordinal === 9 ? routeToolId : null,
          route_positive_tool_id: request.ordinal === 9 ? true : null,
          route_unique_match_count: request.ordinal === 9 ? 1 : null,
          schema_version: 1,
          session_cookie_contract_pass: request.ordinal === 2 ? true : null,
          status_match: true,
        },
        response_projection: {
          actual_status_integer: request.status,
          application_identity_class:
            identityClasses.get(request.ordinal) ??
            "OTHER_APPLICATION_RESPONSE",
          body_shape_class:
            bodyShapeClasses.get(request.ordinal) ?? "JSON_VALUE",
          cookie_effect_categories: {
            csrf_cookie:
              request.ordinal === 4
                ? "SET_SECURE_SAMESITE_STRICT_MAXAGE_14400"
                : request.ordinal === 19
                  ? "CLEARED_MAXAGE_ZERO"
                  : "ABSENT",
            session_cookie:
              request.ordinal === 2
                ? "SET_SECURE_HTTPONLY_SAMESITE_STRICT_MAXAGE_14400"
                : request.ordinal === 19
                  ? "CLEARED_MAXAGE_ZERO"
                  : "ABSENT",
          },
          expected_status: request.status,
          method: request.method,
          path_class: pathClasses.get(request.path),
          request_ordinal: request.ordinal,
          security_header_categories: securityHeaderCategories(request),
          status_match: true,
        },
      }),
    );
    const expected = {
      approved_tool: {
        category: "Productivity",
        id: approvedToolId,
        logo_url: null,
        name: approveName,
        normalized_domain: approveDomain,
        pricing: "Free",
        status: "approved",
        website: approveWebsiteRaw,
      },
      audit_actions: [...plan.audit_actions],
      route_tool: {
        category: "Productivity",
        deleted: true,
        id: routeToolId,
        logo_url: null,
        name: routeName,
        normalized_domain: routeDomain,
        pricing: "Free",
        status: "archived",
        website: `${routeWebsiteLexical}/`,
      },
      storage_path: logoPath,
      submissions: {
        APPROVE: {
          id: fixtureIds.APPROVE,
          logo_url: null,
          name: approveName,
          status: "approved",
          website: approveWebsiteRaw,
        },
        EDIT: {
          id: fixtureIds.EDIT,
          logo_url: null,
          name: editName,
          status: "pending",
          website: `${editWebsiteLexical}/`,
        },
        REJECT: {
          id: fixtureIds.REJECT,
          logo_url: null,
          name: rejectName,
          status: "rejected",
          website: rejectFixtureWebsiteRaw,
        },
      },
    };
    const observed = {
      audits: plan.audit_actions.map((action, index) => ({
        action,
        target_id:
          action.startsWith("submission_")
            ? String(
                [fixtureIds.EDIT, fixtureIds.REJECT, fixtureIds.APPROVE][
                  index - 3
                ],
              )
            : ["tool_updated", "tool_deleted"].includes(action)
              ? String(routeToolId)
              : action === "logo_uploaded"
                ? logoPath
                : null,
        target_name: action === "logo_uploaded" ? logoPath : null,
      })),
      storage_objects: [{ path: logoPath, present: true }],
      submissions: Object.values(expected.submissions).map((row) => ({
        ...row,
      })),
      tools: [
        { ...expected.route_tool, deleted_at: "2026-08-11T00:00:00.000Z" },
        { ...expected.approved_tool, deleted_at: null },
      ],
    };
    const projection = core.projectDelta17SanitizedPostState({
      application_contracts: applicationContracts,
      expected,
      expected_request_count: 20,
      observed,
      oracle,
    });
    const validation = core.validateDelta17ProjectionSufficiency({
      expected_request_count: 20,
      projection,
    });
    const editProjection = projection.entities.find(
      (entity) => entity.synthetic_entity_role === "EDIT_SUBMISSION",
    );
    const serializedProjection = JSON.stringify(projection);
    const target = core.deriveDelta17PoststateOracleQualifiedFinalTarget({
      activation_commit_sha: "b".repeat(40),
      authorized_path_manifest_sha256: "1".repeat(64),
      baseline: "f7143b756b062287ab89e525a53010a379b51098",
      branch_env_cleanup_evidence_sha256: "2".repeat(64),
      marker_sha256:
        "e3cf39bdf96075f0ecb8b8ffba3d176613dab93b4a1f368c8c09a5b27ee2a957",
      mutating_qualification_evidence_sha256: "3".repeat(64),
      passing_preview_id: "dpl_Delta17SelfTest",
      persisted_state_oracle_sha256: oracle.contract_sha256,
      projection_sufficiency_matrix_sha256:
        validation.projection_sufficiency_matrix_sha256,
      qualification_cleanup_evidence_sha256: "4".repeat(64),
      registration_commit_sha: "a".repeat(40),
      testing_tree_sha256: "5".repeat(64),
    });
    const authorization =
      "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_POSTSTATE_ORACLE_QUALIFIED_FINAL_TARGET_" +
      target;
    const identities = oracle.expectations;
    return [
      required.every((name) => typeof core[name] === "function"),
      JSON.stringify(oracle.identity_classes) === JSON.stringify([
        "REQUEST_LEXICAL",
        "APPLICATION_VALIDATED_CANONICAL",
        "DIRECT_FIXTURE_RAW",
        "RPC_PERSISTED_SOURCE_BOUND",
        "STATUS_TRANSITION",
        "RUNTIME_PROJECTION_REQUIRED",
      ]),
      identities.request8_website.identity_class ===
        "APPLICATION_VALIDATED_CANONICAL",
      identities.request10_website.identity_class ===
        "APPLICATION_VALIDATED_CANONICAL",
      identities.request10_logo_url.identity_class ===
        "APPLICATION_VALIDATED_CANONICAL",
      identities.request12_website.identity_class ===
        "APPLICATION_VALIDATED_CANONICAL",
      identities.request13_status.identity_class === "STATUS_TRANSITION",
      identities.request14_submission_status.identity_class ===
        "STATUS_TRANSITION",
      identities.request14_approved_tool_website.identity_class ===
        "RPC_PERSISTED_SOURCE_BOUND",
      identities.request15_storage_identity.identity_class ===
        "RUNTIME_PROJECTION_REQUIRED",
      oracle.cleanup_selectors.every(
        (selector) => selector.selector_class === "EXACT_PHASE_OWNED_ID_OR_MARKER",
      ),
      !editWebsiteLexical.endsWith("/"),
      identities.request12_website.stored_expected.endsWith("/"),
      identities.request12_website.stored_expected ===
        new URL(editWebsiteLexical).toString(),
      identities.request12_website.stored_expected !== editWebsiteLexical,
      identities.request12_website.request_body_value === editWebsiteLexical,
      projection.projection_sufficiency === "COMPLETE",
      projection.assertions.length === 20,
      projection.assertions.every((entry) => entry.decidable === true),
      projection.entities.length === 7,
      editProjection?.website_hash ===
        sha256(`${editWebsiteLexical}/`),
      editProjection?.website_identity_class ===
        "APPLICATION_VALIDATED_CANONICAL",
      !serializedProjection.includes("https://") &&
        !serializedProjection.includes(routeDomain) &&
        !serializedProjection.includes(editDomain) &&
        !serializedProjection.includes(approveDomain) &&
        !serializedProjection.includes(logoPath),
      validation.decidable_assertions === 20,
      /^[a-f0-9]{64}$/u.test(
        validation.projection_sufficiency_matrix_sha256,
      ),
      catches(() =>
        core.validateDelta17ProjectionSufficiency({
          expected_request_count: 20,
          projection: core.projectDelta17SanitizedPostState({
            application_contracts: applicationContracts,
            expected,
            expected_request_count: 20,
            observed: {
              ...observed,
              submissions: observed.submissions.map((row) =>
                row.id === fixtureIds.EDIT
                  ? { ...row, website: editWebsiteLexical }
                  : row,
              ),
            },
            oracle,
          }),
        }),
      ),
      catches(() =>
        core.validateDelta17ProjectionSufficiency({
          expected_request_count: 20,
          projection: core.projectDelta17SanitizedPostState({
            application_contracts: applicationContracts,
            expected,
            expected_request_count: 20,
            observed: { ...observed, storage_objects: [] },
            oracle,
          }),
        }),
      ),
      catches(() =>
        core.projectDelta17SanitizedPostState({
          application_contracts: applicationContracts.slice(0, 19),
          expected,
          expected_request_count: 20,
          observed,
          oracle,
        }),
      ),
      catches(() =>
        core.validateDelta17ProjectionSufficiency({
          expected_request_count: 20,
          projection: {
            ...projection,
            raw_website: editWebsiteLexical,
          },
        }),
      ),
      /^[a-f0-9]{64}$/u.test(target),
      core.validateDelta17PoststateOracleQualifiedAuthorization({
        authorization,
        target_sha256: target,
      }) === target,
      catches(() =>
        core.validateDelta17PoststateOracleQualifiedAuthorization({
          authorization: authorization.replace("POSTSTATE", "PRESTATE"),
          target_sha256: target,
        }),
      ),
      projection.assertions[1]?.response_facts?.session_cookie_contract_pass ===
        true &&
        projection.assertions[1]?.security_header_categories
          ?.cache_control_no_store === true,
      projection.assertions[19]?.response_facts
        ?.post_logout_denial_contract_pass === true,
      delta17Request20SecurityHeaderRegressionAssertion(),
      !serializedProjection.includes("logo_object_path") &&
        !serializedProjection.includes("route_created_tool_id"),
      catches(() =>
        core.validateDelta17ProjectionSufficiency({
          expected_request_count: 20,
          projection: {
            ...projection,
            assertions: projection.assertions.map((assertion) =>
              assertion.ordinal === 2
                ? {
                    ...assertion,
                    response_facts: {
                      ...assertion.response_facts,
                      session_cookie_contract_pass: false,
                    },
                  }
                : assertion,
            ),
          },
        }),
      ),
      catches(() =>
        core.validateDelta17ProjectionSufficiency({
          expected_request_count: 20,
          projection: {
            ...projection,
            entities: projection.entities.map((entity) =>
              entity.synthetic_entity_role === "ROUTE_TOOL"
                ? { ...entity, status_enum: "active" }
                : entity,
            ),
          },
        }),
      ),
      catches(() =>
        core.validateDelta17ProjectionSufficiency({
          expected_request_count: 20,
          projection: {
            ...projection,
            entities: projection.entities.map((entity) =>
              entity.synthetic_entity_role === "APPROVED_TOOL"
                ? { ...entity, website_identity_class: "DIRECT_FIXTURE_RAW" }
                : entity,
            ),
          },
        }),
      ),
      catches(() =>
        core.validateDelta17ProjectionSufficiency({
          expected_request_count: 20,
          projection: {
            ...projection,
            entities: projection.entities.map((entity) =>
              entity.synthetic_entity_role === "AUDIT_SET"
                ? { ...entity, match_count: 7 }
                : entity,
            ),
          },
        }),
      ),
      catches(() =>
        core.validateDelta17ProjectionSufficiency({
          expected_request_count: 20,
          projection: {
            ...projection,
            entities: projection.entities.map((entity) =>
              entity.synthetic_entity_role === "STORAGE_OBJECT"
                ? { ...entity, storage_presence: false }
                : entity,
            ),
          },
        }),
      ),
    ];
  } catch {
    return Array(40).fill(false);
  }
}

function delta17OrchestratorIntegrationAssertions({
  approvalRpcSource,
  orchestratorSource,
  submissionsHandlerSource,
  toolValidationSource,
  toolsHandlerSource,
}) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const sourceBindingText =
    namedFunctionText(
      facts.root,
      "verifyDelta17PersistedStateSourceBindings",
    ) ?? "";
  const projectionBuilderText =
    namedFunctionText(
      facts.root,
      "buildDelta17ObservedPoststateProjection",
    ) ?? "";
  const inspectionText =
    namedFunctionText(facts.root, "inspectFixtureState") ?? "";
  const qualificationText =
    namedFunctionText(
      facts.root,
      "runDelta15AuthFixtureQualificationCycle",
    ) ?? "";
  const runtimeText =
    namedFunctionText(facts.root, "runRuntimeSession") ?? "";
  const qualifyPreviewText =
    namedFunctionText(facts.root, "qualifyDelta14AuthPreview") ?? "";
  const legacyQualificationText =
    namedFunctionText(facts.root, "qualifyDelta14LegacyAuthPreview") ?? "";
  const qualificationFinalizationText =
    namedFunctionText(facts.root, "finalizeDelta20QualificationState") ?? "";
  const replacementQualificationText =
    namedFunctionText(
      facts.root,
      "qualifyDelta17ARetainedPreview",
    ) ?? "";
  const reconciliationText =
    namedFunctionText(
      facts.root,
      "reconcileDelta17APriorResidue",
    ) ?? "";
  const priorDatabaseSelectorText =
    namedFunctionText(
      facts.root,
      "delta17AReadPriorDatabaseResidue",
    ) ?? "";
  const priorAuditClassifierText =
    namedFunctionText(
      facts.root,
      "classifyDelta17APriorAuditRow",
    ) ?? "";
  const priorStorageClassifierText =
    namedFunctionText(
      facts.root,
      "delta17AClassifyPriorStorage",
    ) ?? "";
  const priorStoragePayloadText =
    namedFunctionText(
      facts.root,
      "classifyDelta17APriorStoragePayload",
    ) ?? "";
  const cleanupLocatorValidatorText =
    namedFunctionText(
      facts.root,
      "validateDelta17CleanupLocators",
    ) ?? "";
  const priorResidueSelfTestText =
    namedFunctionText(
      facts.root,
      "runDelta17APriorResidueClassifierSelfTest",
    ) ?? "";
  const qualificationTrafficText =
    namedFunctionText(
      facts.root,
      "delta17AQualificationTrafficStarted",
    ) ?? "";
  const failedQualificationCleanupText =
    namedFunctionText(
      facts.root,
      "cleanupDelta17AFailedQualification",
    ) ?? "";
  const failedQualificationCleanupSelfTestText =
    namedFunctionText(
      facts.root,
      "runDelta17AFailedQualificationCleanupSelfTest",
    ) ?? "";
  const cleanupProgressBindingText =
    namedFunctionText(
      facts.root,
      "bindDelta17QualificationCleanupProgress",
    ) ?? "";
  const cleanupFixturesText =
    namedFunctionText(facts.root, "cleanupFixtures") ?? "";
  const cleanupDispositionText =
    namedFunctionText(
      facts.root,
      "delta17CleanupCategoryDisposition",
    ) ?? "";
  const retainedRootText =
    namedFunctionText(
      facts.root,
      "findDelta17ARetainedQualificationRoot",
    ) ?? "";
  const samePreviewStateText =
    namedFunctionText(
      facts.root,
      "validateDelta17ASamePreviewStateFacts",
    ) ?? "";
  const qualificationAttemptBindingText =
    namedFunctionText(
      facts.root,
      "delta17AQualificationAttemptBinding",
    ) ?? "";
  const targetText =
    namedFunctionText(
      facts.root,
      "deriveDelta18DurableProjectionFinalAuthorization",
    ) ?? "";
  const identifyText =
    namedFunctionText(
      facts.root,
      "identifyDelta18DurableProjectionFinalTarget",
    ) ?? "";
  const executeText =
    namedFunctionText(
      facts.root,
      "executeDelta18DurableProjectionFinalRuntime",
    ) ?? "";
  const runtimePendingText =
    namedFunctionText(
      facts.root,
      "publishDelta20RuntimePendingBeforeCredentialCleanup",
    ) ?? "";
  const persistenceText =
    namedFunctionText(
      facts.root,
      "persistDelta17SanitizedPoststateProjection",
    ) ?? "";
  const readbackText =
    namedFunctionText(
      facts.root,
      "readDelta17SanitizedPoststateProjection",
    ) ?? "";
  const removalText =
    namedFunctionText(
      facts.root,
      "removeDelta17SanitizedPoststateProjection",
    ) ?? "";
  const contract = (candidate) =>
    candidate.includes(
      "AIFINDER_PHASE_34IA_VERIFIED_EVIDENCE_PUBLICATION_FINAL_RUNTIME_PREVIEW_V18",
    ) &&
    candidate.includes(
      'const DELTA13_BRANCH =\n  "aifinder-phase-34ia-evidence-publication-runtime-validation-v3";',
    ) &&
    candidate.includes(
      '"pretarget_publication_qualification_requests=6"',
    ) &&
    candidate.includes("preview_ordinal=eighth-final") &&
    candidate.includes(
      '"--qualify-poststate-preview"',
    ) &&
    candidate.includes(
      '"--repair-delta20-qualification-publication"',
    ) &&
    candidate.includes(
      '"--repair-delta20-runtime-publication"',
    ) &&
    candidate.includes(
      '"--identify-poststate-oracle-qualified-target"',
    ) &&
    candidate.includes(
      '"--execute-poststate-oracle-qualified-preview"',
    );
  const markerMutation = orchestratorSource.replace(
    '"pretarget_publication_qualification_requests=6"',
    '"pretarget_publication_qualification_requests=9"',
  );
  const persistMutation = inspectionText.replace(
    "persistDelta17PoststateBundle({",
    "void ({",
  );
  const dispatcherMutation = qualifyPreviewText.replace(
    "await qualifyDelta14LegacyAuthPreview();",
    "await qualifyDelta17ARetainedPreview({});",
  );
  const priorStorageContract = (candidate) =>
    candidate.includes(
      "const expectedMarker = storageBindings.get(storagePath) ?? null",
    ) &&
    candidate.includes(".download(candidate.storagePath)") &&
    candidate.includes("expectedMarker: candidate.expectedMarker") &&
    candidate.includes(
      'classification.classification === "OWNERSHIP_AMBIGUITY"',
    ) &&
    candidate.includes("exactRecords.set(candidate.storagePath") &&
    candidate.includes("sha256: sha256(bytes)") &&
    candidate.includes("exact_records: Object.freeze(") &&
    !candidate.includes("exactPaths.add(storagePath)");
  const storageNameTrustMutation = priorStorageClassifierText.replace(
    "const expectedMarker = storageBindings.get(storagePath) ?? null;",
    "exactPaths.add(storagePath);\n    const expectedMarker = storageBindings.get(storagePath) ?? null;",
  );
  const cleanupLocatorContract = (candidate) =>
    candidate.includes(
      '!DELTA17A_STORAGE_PATH.test(value.storage_path ?? "")',
    ) &&
    !candidate.includes(
      "value.storage_path !== `admin/${value.run_marker}.png`",
    );
  const cleanupLocatorIdentityMutation = cleanupLocatorValidatorText.replace(
    '!DELTA17A_STORAGE_PATH.test(value.storage_path ?? "")',
    "value.storage_path !== `admin/${value.run_marker}.png`",
  );
  const priorDatabaseSelectorContract = (candidate) =>
    candidate.includes(
      '"normalized_domain.like.route-%.invalid,normalized_domain.like.approve-%.invalid,name.like.34IA%"',
    ) &&
    candidate.includes(
      '"normalized_domain.like.edit-%.invalid,normalized_domain.like.reject-%.invalid,normalized_domain.like.approve-%.invalid,name.like.34IA%"',
    ) &&
    !candidate.includes('.like("name", "34IA %")') &&
    !candidate.includes(
      '.eq("submitter_name", "AiFinder Phase 34IA")',
    );
  const priorDatabaseNarrowingMutation =
    priorDatabaseSelectorText.replaceAll(",name.like.34IA%", "");
  const cleanupProgressContract = (candidate) =>
    candidate.includes("delta17CleanupCategoryDisposition(") &&
    candidate.includes(
      'if (["SKIP", "VERIFY"].includes(disposition)) continue',
    ) &&
    candidate.includes('budgets.take("cleanupRetryReserve")');
  const cleanupReplayMutation = cleanupFixturesText.replace(
    'if (["SKIP", "VERIFY"].includes(disposition)) continue',
    "if (false) continue",
  );
  const unverifiedCleanupMutation = failedQualificationCleanupText.replace(
    "if (!verifiedLogoIdentity) {",
    "if (false) {",
  );
  return [
    toolValidationSource.includes("return url.toString();") &&
      !toolValidationSource.includes("return rawValue;"),
    toolsHandlerSource.includes("website: cleanBody.website,") &&
      toolsHandlerSource.includes("logo_url: cleanBody.logo_url,"),
    submissionsHandlerSource.includes("website: cleanBody.website,") &&
      submissionsHandlerSource.includes("logo_url: cleanBody.logo_url,"),
    approvalRpcSource.includes("    submission.website,") &&
      approvalRpcSource.includes("    submission.logo_url,") &&
      approvalRpcSource.includes("set status = 'approved'"),
    sourceBindingText.includes(ADMIN_TOOLS_HANDLER_PATH) &&
      sourceBindingText.includes(ADMIN_SUBMISSIONS_HANDLER_PATH) &&
      sourceBindingText.includes(APPROVAL_RPC_PATH) &&
      sourceBindingText.includes("return url.toString();"),
    projectionBuilderText.includes("buildDelta17PersistedStateOracle({") &&
      projectionBuilderText.includes("projectDelta17SanitizedPostState({"),
    persistenceText.includes("openExclusiveMode0600(") &&
      persistenceText.includes("fsyncExactDirectory(") &&
      persistenceText.includes("validateDelta17ProjectionStructure({") &&
      !persistenceText.includes("validateDelta17ProjectionSufficiency({"),
    readbackText.includes("validateDelta17ProjectionSufficiency({") &&
      readbackText.includes("sha256(bytes)"),
    removalText.includes("unlinkSync(") &&
      removalText.includes("fsyncExactDirectory(") &&
      !removalText.includes("recursive"),
    inspectionText.includes("buildDelta17ObservedPoststateProjection({") &&
      inspectionText.includes("runtime.poststateApplicationAssertions") &&
      inspectionText.includes("persistDelta17PoststateBundle({") &&
      inspectionText.indexOf("persistDelta17PoststateBundle({") <
        inspectionText.indexOf(
          "readDelta17SanitizedPoststateProjection({",
        ),
    runtimeText.includes("plan.requests.slice(0, maximumOrdinal)") &&
      runtimeText.includes("poststateApplicationAssertions.push(") &&
      runtimeText.includes("projectDelta17SanitizedApplicationAssertion({") &&
      runtimeText.includes(
        "poststateApplicationAssertions: Object.freeze([",
      ) &&
      qualificationText.includes("maximumOrdinal: 15") &&
      qualificationText.includes("expectedRequestCount: 15") &&
      qualificationText.includes("cleanupFixtures({"),
    qualifyPreviewText.includes("await qualifyDelta14LegacyAuthPreview();") &&
      legacyQualificationText.includes("createDelta14RegistrationCommit({") &&
      legacyQualificationText.includes("pushDelta14RegistrationBranch(") &&
      legacyQualificationText.includes("createDelta13EnvironmentRecords({") &&
      legacyQualificationText.includes("createDelta14ActivationCommit({") &&
      legacyQualificationText.includes("fastForwardDelta14ActivationBranch({") &&
      legacyQualificationText.includes("resolveUniquePreview(") &&
      legacyQualificationText.includes(
        "await performDelta18IdentityQualificationAttempt({",
      ) &&
      legacyQualificationText.includes(
        "await cleanupDelta18QualificationLogoutAudit({",
      ) &&
      qualificationFinalizationText.includes("persistDelta18QualifiedState(") &&
      qualificationFinalizationText.includes(
        "deleteDelta13EnvironmentRecords({",
      ) &&
      qualificationFinalizationText.includes(
        "deleteTemporaryBranch(context)",
      ) &&
      dispatcherMutation !== qualifyPreviewText &&
      !dispatcherMutation.includes("await qualifyDelta14LegacyAuthPreview();"),
    targetText.includes("deriveDelta20VerifiedPublicationFinalTarget({") &&
      targetText.includes("qualification_projection_sha256") &&
      targetText.includes("qualification_publication_receipt_sha256") &&
      targetText.includes("branchEnvCleanupEvidenceSha256"),
    identifyText.includes(
      "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_VERIFIED_PUBLICATION_FINAL_TARGET_",
    ) &&
      identifyText.includes("findDelta18QualifiedStateRoot(plan)") &&
      identifyText.includes("persistDelta18QualifiedState("),
    executeText.includes(
      "validateDelta20VerifiedPublicationFinalAuthorization({",
    ) &&
      runtimePendingText.includes(
        "freezeDelta18DurableProjection(durableEvidence)",
      ) &&
      runtimePendingText.includes("expectedRequestCount: 20") &&
      runtimePendingText.includes('kind: "OFFICIAL"') &&
      executeText.indexOf("validateDelta18RuntimeEvidenceDraft(") <
        executeText.indexOf("removeDelta20CompletedRuntimeRoot(") &&
      executeText.includes("request_replays=0"),
    contract(orchestratorSource),
    !contract(markerMutation),
    persistMutation !== inspectionText &&
      !persistMutation.includes(
        "persistDelta17PoststateBundle({",
      ) &&
      reconciliationText.includes(
        "budgets.used.exactSelectorReads > 24",
      ) &&
      reconciliationText.includes(
        "budgets.used.exactPhaseOwnedDeleteRequests > 12",
      ) &&
      reconciliationText.includes(
        "budgets.used.storageListOrRemoveRequests > 6",
      ) &&
      reconciliationText.includes(
        "budgets.used.absenceVerificationRequests > 12",
      ) &&
      reconciliationText.includes("ownership_ambiguity: 0") &&
      priorAuditClassifierText.includes("DELTA17A_STORAGE_PATH.test") &&
      priorAuditClassifierText.includes(
        'row.action === "logo_uploaded" ? storagePath : null',
      ) &&
      priorStoragePayloadText.includes("extractSyntheticLogoRunMarker(bytes)") &&
      priorStoragePayloadText.includes(
        '"OWNERSHIP_AMBIGUITY"',
      ) &&
      priorStorageContract(priorStorageClassifierText) &&
      storageNameTrustMutation !== priorStorageClassifierText &&
      !priorStorageContract(storageNameTrustMutation) &&
      cleanupLocatorContract(cleanupLocatorValidatorText) &&
      cleanupLocatorIdentityMutation !== cleanupLocatorValidatorText &&
      !cleanupLocatorContract(cleanupLocatorIdentityMutation) &&
      priorResidueSelfTestText.includes(
        'const storageObjectMarker = "11111111-1111-4111-8111-111111111111"',
      ) &&
      priorResidueSelfTestText.includes(
        "conflictingAuditBindingRejected",
      ) &&
      priorDatabaseSelectorContract(priorDatabaseSelectorText) &&
      priorDatabaseNarrowingMutation !== priorDatabaseSelectorText &&
      !priorDatabaseSelectorContract(priorDatabaseNarrowingMutation),
  ];
}

function delta20RetainedLineageAndLivePublicationAssertions(
  coreSource,
  orchestratorSource,
) {
  const facts = astFacts(ORCHESTRATOR_PATH, orchestratorSource);
  const qualification =
    namedFunctionText(facts.root, "qualifyDelta14LegacyAuthPreview") ?? "";
  const qualificationFinalization =
    namedFunctionText(
      facts.root,
      "finalizeDelta20QualificationState",
    ) ?? "";
  const qualificationRecovery =
    namedFunctionText(
      facts.root,
      "repairDelta20QualificationPublicationFromRetainedJournal",
    ) ?? "";
  const target =
    namedFunctionText(
      facts.root,
      "deriveDelta18DurableProjectionFinalAuthorization",
    ) ?? "";
  const identify =
    namedFunctionText(
      facts.root,
      "identifyDelta18DurableProjectionFinalTarget",
    ) ?? "";
  const official =
    namedFunctionText(
      facts.root,
      "executeDelta18DurableProjectionFinalRuntime",
    ) ?? "";
  const runtimeRecovery =
    namedFunctionText(
      facts.root,
      "repairDelta20RuntimePublicationFromRetainedJournal",
    ) ?? "";
  const runtimePending =
    namedFunctionText(
      facts.root,
      "publishDelta20RuntimePendingBeforeCredentialCleanup",
    ) ?? "";
  const runtimeExternalCleanup =
    namedFunctionText(
      facts.root,
      "cleanupDelta20OfficialExternalEffectsBeforeCredentialRevocation",
    ) ?? "";
  const qualificationAttempt =
    namedFunctionText(
      facts.root,
      "performDelta18IdentityQualificationAttempt",
    ) ?? "";
  const createEnvironmentRecord =
    namedFunctionText(facts.root, "createDelta13EnvironmentRecord") ?? "";
  const deleteEnvironmentRecord =
    namedFunctionText(facts.root, "deleteDelta13EnvironmentRecord") ?? "";
  const sensitiveTransportDigest =
    namedFunctionText(
      facts.root,
      "delta20StdinSecretTransportEvidenceSha256",
    ) ?? "";
  const retained =
    namedFunctionText(
      facts.root,
      "validateDelta20RetainedAuthorizationArtifacts",
    ) ?? "";
  const retireRetained =
    namedFunctionText(
      facts.root,
      "retireDelta20RetainedAuthorizationArtifacts",
    ) ?? "";
  const retirementProgress =
    namedFunctionText(
      facts.root,
      "verifyDelta20RetirementFilesystemProgress",
    ) ?? "";
  const qualificationRecoveryRoot =
    namedFunctionText(
      facts.root,
      "findDelta20QualificationPublicationRecoveryRoot",
    ) ?? "";
  const runtimeRecoveryRoot =
    namedFunctionText(
      facts.root,
      "findDelta20RuntimePublicationRecoveryRoot",
    ) ?? "";
  const publish =
    namedFunctionText(facts.root, "publishDelta20RepositoryEvidence") ?? "";
  const publicationGuard =
    namedFunctionText(
      facts.root,
      "verifyDelta20PublicationRepositoryGuard",
    ) ?? "";
  const publicationChecks =
    namedFunctionText(facts.root, "runDelta20EvidencePublicationChecks") ?? "";
  const priorAudit =
    namedFunctionText(facts.root, "classifyDelta17APriorAuditRow") ?? "";
  const priorReconcile =
    namedFunctionText(facts.root, "reconcileDelta17APriorResidue") ?? "";
  const firstQualificationPublication = qualification.indexOf(
    "qualificationPublication =\n              publishDelta20RepositoryEvidenceWithLocalReevaluation({",
  );
  const qualificationCleanup = qualification.indexOf(
    "await cleanupDelta18QualificationLogoutAudit({",
  );
  const secondQualificationPublication = qualification.indexOf(
    "qualificationCleanupPublication =\n            publishDelta20RepositoryEvidenceWithLocalReevaluation({",
  );
  const qualificationRetirement = qualification.indexOf(
    "qualificationRetirement = persistDelta20RetirementReceipt({",
  );
  const qualificationJournalRetirement = qualification.indexOf(
    "retireDelta20DurableEvidence({",
  );
  const qualificationFinalizer = qualification.indexOf(
    "finalizeDelta20QualificationState({",
  );
  const environmentCleanup = qualificationFinalization.indexOf(
    "environmentCleanup = deleteDelta13EnvironmentRecords({",
  );
  const officialFreeze = runtimePending.indexOf(
    "const frozenOfficial = freezeDelta18DurableProjection(durableEvidence);",
  );
  const officialPending = runtimePending.indexOf(
    "const publication =\n    publishDelta20RepositoryEvidenceWithLocalReevaluation({",
  );
  const officialPendingInvocation = official.indexOf(
    "await publishDelta20RuntimePendingBeforeCredentialCleanup({",
  );
  const officialExternalCleanup = official.indexOf(
    "await cleanupDelta20OfficialExternalEffectsBeforeCredentialRevocation({",
  );
  const officialComplete = official.indexOf(
    "runtimeCleanupPublication =\n      publishDelta20RepositoryEvidenceWithLocalReevaluation({",
  );
  const officialRetirement = official.indexOf(
    "runtimeRetirement = persistDelta20RetirementReceipt({",
  );
  const officialJournalRetirement = official.indexOf(
    "retireDelta20DurableEvidence({",
  );
  const officialArtifactRetirement = official.indexOf(
    "retireDelta20RetainedAuthorizationArtifacts({",
  );
  return [
    core.createRuntimePlan().branch === BRANCH &&
      core.createRuntimePlan().marker.sha256 === MARKER_SHA256 &&
      core.createRuntimePlan().marker.bytes === 475 &&
      core.createRuntimePlan().marker.lf === 10,
    orchestratorSource.includes("preview_ordinal=eighth-final") &&
      orchestratorSource.includes(
        '"Register AiFinder evidence publication runtime branch without deployment"',
      ) &&
      orchestratorSource.includes(
        '"Trigger Admin V1 verified evidence publication preview v18"',
      ),
    retained.includes("paths.lineage_receipt_path") &&
      retained.includes("paths.active_lock_path") &&
      retained.includes("paths.authorization_lock_path") &&
      retained.includes("paths.replacement_marker_path") &&
      retained.includes("paths.tombstone_path") &&
      orchestratorSource.includes("DELTA20_LINEAGE_RECEIPT_FILENAME") &&
      orchestratorSource.includes("DELTA20_ACTIVE_AUTHORIZATION_LOCK_FILENAME"),
    qualification.includes("startDelta20QualificationAttempt({") &&
      qualification.indexOf("startDelta20QualificationAttempt({") <
        qualification.indexOf("verifyInitialTemporaryBranchAbsence(context)"),
    qualification.includes("reconcileDelta17APriorResidue({") &&
      qualification.indexOf("reconcileDelta17APriorResidue({") <
        qualification.indexOf("createDelta14RegistrationCommit({"),
    orchestratorSource.includes("directDataMaximum: 54") &&
      orchestratorSource.includes("exactSelectorReads: 24") &&
      orchestratorSource.includes("exactPhaseOwnedDeleteRequests: 12") &&
      orchestratorSource.includes("storageListOrRemoveRequests: 6") &&
      orchestratorSource.includes("absenceVerificationRequests: 12"),
    orchestratorSource.includes(
      "^AiFinder-Phase-34IA-Delta18-(Qualification-)?",
    ) &&
      priorAudit.includes('"admin_logout"') &&
      priorAudit.includes("row.target_id === null") &&
      priorAudit.includes("row.target_name === null"),
    priorReconcile.includes("delta17AReadPriorDatabaseResidue({") &&
      priorReconcile.includes("delta17AReconcileExactRowDelete({") &&
      priorReconcile.includes("delta17AReconcileExactStorageDelete({") &&
      priorReconcile.includes("zero_residue: true") &&
      priorReconcile.includes("ownership_ambiguity: 0"),
    publish.includes("classifyDelta20RepositoryTransition({") &&
      publish.includes("runDelta20EvidencePublicationChecks(") &&
      publish.includes("buildDelta20RuntimeCompleteMatrix(") &&
      publish.includes("buildDelta20RuntimeCompleteRegistry(") &&
    publish.includes("buildDelta20PublicationManifest(") &&
    publish.includes("DELTA20_REPOSITORY_PUBLICATION_ROLLBACK") &&
    publish.includes("DELTA20_PUBLICATION_JOURNAL_POSTRECEIPT") &&
    publish.includes("DELTA20_PUBLICATION_LOCATORS_POSTRECEIPT") &&
      publish.includes("persistDelta20PublicationTransaction(") &&
      publish.includes("reconcileDelta20PublicationTransaction({") &&
      publicationGuard.includes("delta20TestingTreeDigest(") &&
      publicationGuard.includes("DELTA20_EVIDENCE_PUBLICATION_PATHS") &&
      createEnvironmentRecord.includes("const requestByteCount =") &&
      createEnvironmentRecord.includes("const requestBodyKeys =") &&
      createEnvironmentRecord.includes("requestBytes.fill(0)") &&
      createEnvironmentRecord.includes(
        "buffer_zeroed: requestBytes.every((byte) => byte === 0)",
      ) &&
      deleteEnvironmentRecord.includes(
        'operation: "DELETE_RECONCILIATION"',
      ) &&
      deleteEnvironmentRecord.includes('transport: "NO_BODY"') &&
      sensitiveTransportDigest.includes(
        'for (const operation of ["CREATE", "DELETE_RECONCILIATION"])',
      ),
    publicationChecks.includes('"--review-projection-safety"') &&
      publicationChecks.includes('"--review-lifecycle-cleanup"') &&
      publicationChecks.includes('"--review-governance-scope"') &&
      publicationChecks.includes("critical=0 important=0 minor=0") &&
      publicationChecks.includes(
        "DELTA20_PUBLICATION_INDEPENDENT_REVIEW_OUTPUT",
      ),
    firstQualificationPublication >= 0 &&
      qualificationCleanup > firstQualificationPublication &&
      secondQualificationPublication > qualificationCleanup &&
      qualificationRetirement > secondQualificationPublication &&
      qualificationJournalRetirement > qualificationRetirement &&
      qualificationFinalizer > qualificationJournalRetirement &&
      environmentCleanup >= 0 &&
      qualificationFinalization.includes(
        "createDelta20QualificationFinalizationController({",
      ) &&
      qualificationFinalization.includes(
        "finalization.environmentMutationIntent({ name })",
      ) &&
      qualificationFinalization.includes(
        "finalization.branchMutationIntent()",
      ) &&
      qualificationFinalization.indexOf("persistDelta18QualifiedState(") <
        qualificationFinalization.indexOf(
          "removeDelta20QualificationFinalizationProgress(",
        ) &&
      qualificationRecovery.includes(
        "persistDelta20QualificationPublicationRecovery({",
      ) &&
      qualificationRecovery.includes("runOfficialProtectedRuntime({") &&
      qualificationRecovery.includes("retained.publicationComplete") &&
      !qualificationRecovery.includes("runRuntimeSession({") &&
      qualificationAttempt.includes("runOfficialProtectedRuntime({") &&
      qualificationAttempt.includes('accessMode: "SELF_PROJECT_OIDC"') &&
      qualificationAttempt.includes("await onProjectionComplete(qualified)") &&
      qualificationAttempt.indexOf("await onProjectionComplete(qualified)") <
        qualificationAttempt.indexOf("return qualified;"),
    qualificationFinalization.includes('phase: "34IA-34IZ-DELTA20"') &&
      qualificationFinalization.includes("phase_preview_creations_total: 8") &&
      qualificationFinalization.includes('preview_ordinal: "EIGHTH_FINAL"') &&
      qualificationFinalization.includes(
        "qualification_publication_receipt_sha256",
      ),
    target.includes("deriveDelta20VerifiedPublicationFinalTarget({") &&
      target.includes("prior_residue_reconciliation_evidence_sha256") &&
      target.includes("qualification_publication_receipt_sha256") &&
      target.includes("qualification_cleanup_receipt_sha256") &&
      target.includes("stdin_secret_transport_evidence_sha256"),
    identify.includes(
      'expectedActiveState: "QUALIFICATION_ATTEMPT_STARTED"',
    ) &&
      identify.includes(
        "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_VERIFIED_PUBLICATION_FINAL_TARGET_",
      ),
    official.includes("validateDelta20VerifiedPublicationFinalAuthorization({") &&
      official.includes("acquireDelta20ExecutionLock(retained.root)") &&
      !official.includes("acquireResumeExecutionLock()"),
    runtimePending.includes("protectedAccessCredentialActive !== true") &&
      runtimePending.includes(
        "DELTA20_RUNTIME_PENDING_PUBLICATION_CREDENTIAL_ORDER",
      ) &&
      officialFreeze >= 0 &&
      officialPending > officialFreeze &&
      officialPendingInvocation >= 0 &&
      officialExternalCleanup > officialPendingInvocation &&
      officialComplete > officialExternalCleanup &&
      runtimeExternalCleanup.includes(
        "protectedAccessCredentialActive !== true",
      ) &&
      runtimeExternalCleanup.includes(
        "DELTA20_RUNTIME_EXTERNAL_CLEANUP_CREDENTIAL_ORDER",
      ) &&
      runtimeExternalCleanup.indexOf("await cleanupFixtures({") <
        runtimeExternalCleanup.indexOf("await deleteAndVerifyPreview(context)") &&
      runtimeExternalCleanup.indexOf("await deleteAndVerifyPreview(context)") <
        runtimeExternalCleanup.indexOf('event: "CLEAN_EXTERNAL_EFFECTS"') &&
      official.includes("protectedFailureCleanupAttempted = true") &&
      official.includes("await rollbackLiveContext(context)") &&
      runtimeRecovery.includes("runOfficialProtectedRuntime({") &&
      runtimeRecovery.includes(
        "cleanupDelta20RuntimeRecoveryExternalEffects({",
      ) &&
      runtimeRecovery.includes("retained.publicationComplete") &&
      !runtimeRecovery.includes("runRuntimeSession({") &&
      officialRetirement > officialComplete &&
      officialJournalRetirement > officialRetirement &&
      officialArtifactRetirement > officialJournalRetirement,
    retireRetained.includes("expectedPaths.authorization_lock_path") &&
      retireRetained.includes("expectedPaths.replacement_marker_path") &&
      retireRetained.includes("expectedPaths.tombstone_path") &&
      retireRetained.includes("expectedPaths.lineage_receipt_path") &&
      retireRetained.includes("expectedPaths.active_lock_path") &&
      retireRetained.includes("retired_artifacts: 5") &&
      retirementProgress.includes("const nextRole =") &&
      retirementProgress.includes(
        "DELTA20_RETIREMENT_PROGRESS_RETIRED_RESIDUE",
      ) &&
      qualificationRecoveryRoot.includes(
        "publicationComplete: retirementReceipt !== null",
      ) &&
      runtimeRecoveryRoot.includes(
        "publicationComplete: retirementReceipt !== null",
      ) &&
      orchestratorSource.includes("retirementInterruptionPassed"),
    coreSource.includes(
      "AIFINDER_PHASE_34IA_DELTA20_VERIFIED_EVIDENCE_PUBLICATION_FINAL_RUNTIME_V1",
    ) &&
      coreSource.includes(
        "AUTHORIZE_ADMIN_V1_STAGING_RUNTIME_VERIFIED_PUBLICATION_FINAL_TARGET_",
      ) &&
      coreSource.includes(
        '"efb3bf384da9b9f03c3ea97ca1f311a86ac17fcc6fac120d138796f557c732d7"',
      ),
  ];
}

try {
  const coreSource = source(CORE_PATH);
  const orchestratorSource = source(ORCHESTRATOR_PATH);
  canonicalOrchestratorSource = orchestratorSource;
  const evidenceTestSource = source(EVIDENCE_TEST_PATH);
  const toolValidationSource = source(TOOL_VALIDATION_PATH);
  const handlerSource = source(ADMIN_TOOLS_HANDLER_PATH);
  const submissionsHandlerSource = source(ADMIN_SUBMISSIONS_HANDLER_PATH);
  const approvalRpcSource = source(APPROVAL_RPC_PATH);
  const storageCasForwardSource = source(STORAGE_CAS_FORWARD_PATH);
  const controlledRedMode = process.argv[2] ?? "";
  const controlledRedModes = new Set([
    "",
    "--controlled-red-delta09-environment",
    "--controlled-red-delta11-header-projection",
    "--controlled-red-delta11-projection-integration",
    "--controlled-red-delta11-orchestrator-projection",
    "--controlled-red-delta11-qualification-lane",
    "--controlled-red-delta11-plan-and-marker",
    "--controlled-red-delta12-protected-access",
    "--controlled-red-delta12-orchestrator-access",
    "--controlled-red-delta13-response-projection",
    "--controlled-red-delta13-projection-integration",
    "--controlled-red-delta13-environment-and-qualification",
    "--controlled-red-delta13-orchestrator-lifecycle",
    "--controlled-red-runtime-fixture-preview-cleanup-repair",
    "--controlled-red-delta15-auth-fixture-qualification",
    "--controlled-red-delta15-canonical-temp-root",
    "--controlled-red-delta15-qualification-cleanup-reserve",
    "--controlled-red-delta15-qualification-recovery",
    "--controlled-red-delta14-branch-registration-ordering",
    "--controlled-red-delta16a-stored-canonical",
    "--controlled-red-delta17-poststate-oracle",
    "--controlled-red-delta17-orchestrator-integration",
    "--controlled-red-delta18-durable-projection",
    "--controlled-red-delta20-retained-lineage-and-live-publication",
    "--controlled-red-delta20-verified-publication",
    "--controlled-red-delta20-publication-integration",
    "--controlled-red-canonical-temp-path",
    "--controlled-red-uncertain-create",
    "--controlled-red-uncertain-delete",
    "--controlled-red-state-matrix",
    "--controlled-red-journal-and-budget",
  ]);
  if (!controlledRedModes.has(controlledRedMode)) {
    throw new Error("CONTROLLED_RED_MODE");
  }
  const delta20VerifiedPublicationResults =
    delta20VerifiedEvidencePublicationBehaviorAssertions();
  assert.equal(delta20VerifiedPublicationResults.length, 41);
  const delta20VerifiedPublicationFailures =
    delta20VerifiedPublicationResults.filter((result) => !result).length;
  if (delta20VerifiedPublicationFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA20_VERIFIED_PUBLICATION assertions=41 failures=${delta20VerifiedPublicationFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode ===
    "--controlled-red-delta20-verified-publication"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA20_VERIFIED_PUBLICATION assertions=41 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta20PublicationIntegrationResults =
    delta20VerifiedPublicationIntegrationAssertions(orchestratorSource);
  assert.equal(delta20PublicationIntegrationResults.length, 8);
  const delta20PublicationIntegrationFailures =
    delta20PublicationIntegrationResults.filter((result) => !result).length;
  if (delta20PublicationIntegrationFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA20_PUBLICATION_INTEGRATION assertions=8 failures=${delta20PublicationIntegrationFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode ===
    "--controlled-red-delta20-publication-integration"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA20_PUBLICATION_INTEGRATION assertions=8 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta20RetainedLineageResults =
    delta20RetainedLineageAndLivePublicationAssertions(
      coreSource,
      orchestratorSource,
    );
  assert.equal(delta20RetainedLineageResults.length, 18);
  const delta20RetainedLineageFailures =
    delta20RetainedLineageResults.filter(
      (result) => !result,
    ).length;
  if (delta20RetainedLineageFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA20_RETAINED_LINEAGE_AND_LIVE_PUBLICATION assertions=18 failures=${delta20RetainedLineageFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode ===
    "--controlled-red-delta20-retained-lineage-and-live-publication"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA20_RETAINED_LINEAGE_AND_LIVE_PUBLICATION assertions=18 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta18DurableProjectionResults =
    delta18DurableProjectionBehaviorAssertions(orchestratorSource);
  assert.equal(delta18DurableProjectionResults.length, 44);
  const delta18DurableProjectionFailures =
    delta18DurableProjectionResults.filter((result) => !result).length;
  if (delta18DurableProjectionFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA18_DURABLE_PROJECTION assertions=44 failures=${delta18DurableProjectionFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode === "--controlled-red-delta18-durable-projection"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA18_DURABLE_PROJECTION assertions=44 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta17OracleResults =
    delta17PersistedStateOracleBehaviorAssertions();
  assert.equal(delta17OracleResults.length, 41);
  const delta17OracleFailures = delta17OracleResults.filter(
    (result) => !result,
  ).length;
  if (delta17OracleFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA17_POSTSTATE_ORACLE assertions=41 failures=${delta17OracleFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode === "--controlled-red-delta17-poststate-oracle"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA17_POSTSTATE_ORACLE assertions=41 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta17IntegrationResults =
    delta17OrchestratorIntegrationAssertions({
      approvalRpcSource,
      orchestratorSource,
      submissionsHandlerSource,
      toolValidationSource,
      toolsHandlerSource: handlerSource,
    });
  assert.equal(delta17IntegrationResults.length, 18);
  const delta17IntegrationFailures = delta17IntegrationResults.filter(
    (result) => !result,
  ).length;
  if (delta17IntegrationFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA17_ORCHESTRATOR_INTEGRATION assertions=18 failures=${delta17IntegrationFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode ===
    "--controlled-red-delta17-orchestrator-integration"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA17_ORCHESTRATOR_INTEGRATION assertions=18 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta16ASourceResults =
    delta16AStoredCanonicalSourceAssertions({
      handlerSource,
      orchestratorSource,
      toolValidationSource,
    });
  assert.equal(delta16ASourceResults.length, 14);
  const delta16ASourceFailures = delta16ASourceResults.filter(
    (result) => !result,
  ).length;
  if (delta16ASourceFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA16A_STORED_CANONICAL_SOURCE assertions=14 failures=${delta16ASourceFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode === "--controlled-red-delta16a-stored-canonical"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA16A_STORED_CANONICAL_SOURCE assertions=14 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta15FixtureResults =
    delta15AuthFixtureQualificationAssertions(coreSource, orchestratorSource);
  assert.equal(delta15FixtureResults.length, 14);
  const delta15FixtureFailures = delta15FixtureResults.filter(
    (result) => !result,
  ).length;
  if (delta15FixtureFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_15_AUTH_FIXTURE_QUALIFICATION assertions=14 failures=${delta15FixtureFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode ===
    "--controlled-red-delta15-auth-fixture-qualification"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_15_AUTH_FIXTURE_QUALIFICATION assertions=14 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta15CanonicalTempRootResults =
    delta15CanonicalTempRootAssertions();
  assert.equal(delta15CanonicalTempRootResults.length, 1);
  const delta15CanonicalTempRootFailures =
    delta15CanonicalTempRootResults.filter((result) => !result).length;
  if (delta15CanonicalTempRootFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_15_CANONICAL_TEMP_ROOT assertions=1 failures=${delta15CanonicalTempRootFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode === "--controlled-red-delta15-canonical-temp-root"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_15_CANONICAL_TEMP_ROOT assertions=1 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta15QualificationCleanupReserveResults =
    delta15QualificationCleanupReserveAssertions(orchestratorSource);
  assert.equal(delta15QualificationCleanupReserveResults.length, 4);
  const delta15QualificationCleanupReserveFailures =
    delta15QualificationCleanupReserveResults.filter((result) => !result)
      .length;
  if (delta15QualificationCleanupReserveFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_15_QUALIFICATION_CLEANUP_RESERVE assertions=4 failures=${delta15QualificationCleanupReserveFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode ===
    "--controlled-red-delta15-qualification-cleanup-reserve"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_15_QUALIFICATION_CLEANUP_RESERVE assertions=4 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta15QualificationRecoveryResults =
    delta15QualificationRecoveryAssertions(coreSource, orchestratorSource);
  assert.equal(delta15QualificationRecoveryResults.length, 11);
  const delta15QualificationRecoveryFailures =
    delta15QualificationRecoveryResults.filter((result) => !result).length;
  if (delta15QualificationRecoveryFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_15_QUALIFICATION_RECOVERY assertions=11 failures=${delta15QualificationRecoveryFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode ===
    "--controlled-red-delta15-qualification-recovery"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_15_QUALIFICATION_RECOVERY assertions=11 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const runtimeRepairResults =
    runtimeFixtureAndPreviewCleanupRepairAssertions(orchestratorSource);
  assert.equal(runtimeRepairResults.length, 7);
  const runtimeRepairFailures = runtimeRepairResults.filter(
    (result) => !result,
  ).length;
  if (runtimeRepairFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_RUNTIME_FIXTURE_PREVIEW_CLEANUP_REPAIR assertions=7 failures=${runtimeRepairFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode ===
    "--controlled-red-runtime-fixture-preview-cleanup-repair"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_RUNTIME_FIXTURE_PREVIEW_CLEANUP_REPAIR assertions=7 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta14OrderingResults =
    delta14BranchRegistrationOrderingAssertions(
      coreSource,
      orchestratorSource,
    );
  assert.equal(delta14OrderingResults.length, 14);
  const delta14OrderingFailures = delta14OrderingResults.filter(
    (result) => !result,
  ).length;
  if (delta14OrderingFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_14_BRANCH_REGISTRATION_ORDERING assertions=14 failures=${delta14OrderingFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode ===
    "--controlled-red-delta14-branch-registration-ordering"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_14_BRANCH_REGISTRATION_ORDERING assertions=14 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta13ResponseProjectionResults =
    delta13ResponseProjectionAssertions();
  assert.equal(delta13ResponseProjectionResults.length, 18);
  const delta13ResponseProjectionFailures =
    delta13ResponseProjectionResults.filter((result) => !result).length;
  if (delta13ResponseProjectionFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_13_RESPONSE_PROJECTION assertions=18 failures=${delta13ResponseProjectionFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode === "--controlled-red-delta13-response-projection"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_13_RESPONSE_PROJECTION assertions=18 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta13OrchestratorProjectionResults =
    delta13OrchestratorProjectionAssertions(orchestratorSource);
  assert.equal(delta13OrchestratorProjectionResults.length, 2);
  const delta13OrchestratorProjectionFailures =
    delta13OrchestratorProjectionResults.filter((result) => !result).length;
  if (delta13OrchestratorProjectionFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_13_PROJECTION_INTEGRATION assertions=2 failures=${delta13OrchestratorProjectionFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode === "--controlled-red-delta13-projection-integration"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_13_PROJECTION_INTEGRATION assertions=2 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta13EnvironmentResults =
    delta13BranchEnvironmentAndQualificationAssertions();
  assert.equal(delta13EnvironmentResults.length, 20);
  const delta13EnvironmentFailures =
    delta13EnvironmentResults.filter((result) => !result).length;
  if (delta13EnvironmentFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_13_ENVIRONMENT_AND_QUALIFICATION assertions=20 failures=${delta13EnvironmentFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode ===
    "--controlled-red-delta13-environment-and-qualification"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_13_ENVIRONMENT_AND_QUALIFICATION assertions=20 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta13LifecycleResults = delta13OrchestratorLifecycleAssertions(
    coreSource,
    orchestratorSource,
  );
  assert.equal(delta13LifecycleResults.length, 2);
  const delta13LifecycleFailures =
    delta13LifecycleResults.filter((result) => !result).length;
  if (delta13LifecycleFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_13_ORCHESTRATOR_LIFECYCLE assertions=2 failures=${delta13LifecycleFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode === "--controlled-red-delta13-orchestrator-lifecycle"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_13_ORCHESTRATOR_LIFECYCLE assertions=2 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta11HeaderResults = delta11HeaderProjectionAssertions();
  assert.equal(delta11HeaderResults.length, 18);
  const delta11HeaderFailures = delta11HeaderResults.filter(
    (result) => !result,
  ).length;
  if (delta11HeaderFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_11_HEADER_PROJECTION assertions=18 failures=${delta11HeaderFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (controlledRedMode === "--controlled-red-delta11-header-projection") {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_11_HEADER_PROJECTION assertions=18 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta11IntegrationResults =
    delta11HeaderProjectionIntegrationAssertions();
  assert.equal(delta11IntegrationResults.length, 10);
  const delta11IntegrationFailures = delta11IntegrationResults.filter(
    (result) => !result,
  ).length;
  if (delta11IntegrationFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_11_PROJECTION_INTEGRATION assertions=10 failures=${delta11IntegrationFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode === "--controlled-red-delta11-projection-integration"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_11_PROJECTION_INTEGRATION assertions=10 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta11OrchestratorResults =
    delta11OrchestratorProjectionAssertions(orchestratorSource);
  assert.equal(delta11OrchestratorResults.length, 2);
  const delta11OrchestratorFailures = delta11OrchestratorResults.filter(
    (result) => !result,
  ).length;
  if (delta11OrchestratorFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_11_ORCHESTRATOR_PROJECTION assertions=2 failures=${delta11OrchestratorFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode === "--controlled-red-delta11-orchestrator-projection"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_11_ORCHESTRATOR_PROJECTION assertions=2 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta11QualificationResults = delta11QualificationLaneAssertions();
  assert.equal(delta11QualificationResults.length, 14);
  const delta11QualificationFailures = delta11QualificationResults.filter(
    (result) => !result,
  ).length;
  if (delta11QualificationFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_11_QUALIFICATION_LANE assertions=14 failures=${delta11QualificationFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (controlledRedMode === "--controlled-red-delta11-qualification-lane") {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_11_QUALIFICATION_LANE assertions=14 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta11PlanResults = delta11PlanAndMarkerAssertions(
    coreSource,
    orchestratorSource,
  );
  assert.equal(delta11PlanResults.length, 20);
  const delta11PlanFailures = delta11PlanResults.filter(
    (result) => !result,
  ).length;
  if (delta11PlanFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_11_PLAN_AND_MARKER assertions=20 failures=${delta11PlanFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (controlledRedMode === "--controlled-red-delta11-plan-and-marker") {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_11_PLAN_AND_MARKER assertions=20 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta12ProtectedAccessResults =
    await delta12ProtectedAccessAssertions();
  assert.equal(delta12ProtectedAccessResults.length, 14);
  const delta12ProtectedAccessFailures =
    delta12ProtectedAccessResults.filter((result) => !result).length;
  if (delta12ProtectedAccessFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_12_PROTECTED_ACCESS assertions=14 failures=${delta12ProtectedAccessFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (controlledRedMode === "--controlled-red-delta12-protected-access") {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_12_PROTECTED_ACCESS assertions=14 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta12OrchestratorAccessResults =
    delta12OrchestratorAccessAssertions(orchestratorSource);
  assert.equal(delta12OrchestratorAccessResults.length, 2);
  const delta12OrchestratorAccessFailures =
    delta12OrchestratorAccessResults.filter((result) => !result).length;
  if (delta12OrchestratorAccessFailures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_12_ORCHESTRATOR_ACCESS assertions=2 failures=${delta12OrchestratorAccessFailures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (
    controlledRedMode === "--controlled-red-delta12-orchestrator-access"
  ) {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_12_ORCHESTRATOR_ACCESS assertions=2 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta09Results = delta09EnvironmentContractAssertions(
    coreSource,
    orchestratorSource,
  );
  assert.equal(delta09Results.length, 18);
  const delta09Failures = delta09Results.filter((result) => !result).length;
  if (delta09Failures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_09_RUNTIME_ENVIRONMENT_CONTRACT assertions=18 failures=${delta09Failures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (controlledRedMode === "--controlled-red-delta09-environment") {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_09_RUNTIME_ENVIRONMENT_CONTRACT assertions=18 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const delta05Results =
    delta05CanonicalTempPathAssertions(coreSource, orchestratorSource);
  assert.equal(delta05Results.length, 19);
  const delta05Failures = delta05Results.filter((result) => !result).length;
  if (delta05Failures !== 0) {
    process.stdout.write(
      `EXPECTED_FAIL_ADMIN_V1_DELTA_05_CANONICAL_TEMP_PATH assertions=19 failures=${delta05Failures} internal_failures=0\n`,
    );
    process.exit(1);
  }
  if (controlledRedMode === "--controlled-red-canonical-temp-path") {
    process.stdout.write(
      "PASS_ADMIN_V1_DELTA_05_CANONICAL_TEMP_PATH assertions=19 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const uncertainCreateResults = uncertainCreateAssertions(orchestratorSource);
  assert.equal(uncertainCreateResults.length, 1);
  if (
    !uncertainCreateResults[0] &&
    ["", "--controlled-red-uncertain-create"].includes(controlledRedMode)
  ) {
    process.stdout.write(
      "EXPECTED_FAIL_ADMIN_V1_BRANCH_TRANSACTION_UNCERTAIN_CREATE assertions=1 failures=1 internal_failures=0\n",
    );
    process.exit(1);
  }
  if (controlledRedMode === "--controlled-red-uncertain-create") {
    process.stdout.write(
      "PASS_ADMIN_V1_BRANCH_TRANSACTION_UNCERTAIN_CREATE assertions=1 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const uncertainDeleteResults = uncertainDeleteAssertions(orchestratorSource);
  assert.equal(uncertainDeleteResults.length, 1);
  if (
    !uncertainDeleteResults[0] &&
    ["", "--controlled-red-uncertain-delete"].includes(controlledRedMode)
  ) {
    process.stdout.write(
      "EXPECTED_FAIL_ADMIN_V1_BRANCH_TRANSACTION_UNCERTAIN_DELETE assertions=1 failures=1 internal_failures=0\n",
    );
    process.exit(1);
  }
  if (controlledRedMode === "--controlled-red-uncertain-delete") {
    process.stdout.write(
      "PASS_ADMIN_V1_BRANCH_TRANSACTION_UNCERTAIN_DELETE assertions=1 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const stateMatrixResults =
    branchTransactionStateMatrixAssertions(orchestratorSource);
  assert.equal(stateMatrixResults.length, 1);
  if (
    !stateMatrixResults[0] &&
    ["", "--controlled-red-state-matrix"].includes(controlledRedMode)
  ) {
    process.stdout.write(
      "EXPECTED_FAIL_ADMIN_V1_BRANCH_TRANSACTION_STATE_MATRIX assertions=1 failures=1 internal_failures=0\n",
    );
    process.exit(1);
  }
  if (controlledRedMode === "--controlled-red-state-matrix") {
    process.stdout.write(
      "PASS_ADMIN_V1_BRANCH_TRANSACTION_STATE_MATRIX assertions=1 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const journalAndBudgetResults = branchTransactionJournalAndBudgetAssertions(
    coreSource,
    orchestratorSource,
    evidenceTestSource,
  );
  assert.equal(journalAndBudgetResults.length, 1);
  if (
    !journalAndBudgetResults[0] &&
    ["", "--controlled-red-journal-and-budget"].includes(controlledRedMode)
  ) {
    process.stdout.write(
      "EXPECTED_FAIL_ADMIN_V1_BRANCH_TRANSACTION_JOURNAL_AND_BUDGET assertions=1 failures=1 internal_failures=0\n",
    );
    process.exit(1);
  }
  if (controlledRedMode === "--controlled-red-journal-and-budget") {
    process.stdout.write(
      "PASS_ADMIN_V1_BRANCH_TRANSACTION_JOURNAL_AND_BUDGET assertions=1 failures=0 internal_failures=0\n",
    );
    process.exit(0);
  }
  const branchCasResults = branchCasAssertions(orchestratorSource);
  assert.equal(branchCasResults.length, 1);
  if (!branchCasResults[0]) {
    process.stdout.write(
      "EXPECTED_FAIL_ADMIN_V1_RUNTIME_RECOVERY_BRANCH_CAS assertions=1 failures=1 internal_failures=0\n",
    );
    process.exit(1);
  }
  const vercelPaginationResults = vercelPaginationAssertions(
    coreSource,
    orchestratorSource,
  );
  assert.equal(vercelPaginationResults.length, 1);
  if (!vercelPaginationResults[0]) {
    process.stdout.write(
      "EXPECTED_FAIL_ADMIN_V1_RUNTIME_RECOVERY_VERCEL_PAGINATION assertions=1 failures=1 internal_failures=0\n",
    );
    process.exit(1);
  }
  const ambiguousLogoCleanupResults = ambiguousLogoCleanupAssertions(
    coreSource,
    orchestratorSource,
    storageCasForwardSource,
  );
  assert.equal(ambiguousLogoCleanupResults.length, 1);
  if (!ambiguousLogoCleanupResults[0]) {
    process.stdout.write(
      "EXPECTED_FAIL_ADMIN_V1_RUNTIME_RECOVERY_AMBIGUOUS_LOGO_CLEANUP assertions=1 failures=1 internal_failures=0\n",
    );
    process.exit(1);
  }
  const baseResults = baseAssertions(coreSource, orchestratorSource);
  const markerResults = markerRuntimeAssertions(orchestratorSource);
  const cleanupResults = cleanupBudgetAssertions(orchestratorSource);
  const results = [...baseResults, ...markerResults, ...cleanupResults];
  assert.equal(results.length, 60);
  const pass = results.filter(Boolean).length;
  const fail = results.length - pass;
  if (pass === 34 && fail === 26) {
    process.stdout.write(
      "EXPECTED_FAIL_ADMIN_V1_STAGING_RUNTIME_SOURCE_POLICY stage=ACTUAL_MARKER_BYTES_PREWORKTREE_REST_V13_RUNTIME_CONTRACT assertions=60 pass=34 fail=26 internal_failures=0\n",
    );
    process.exit(1);
  }
  if (pass === 45 && fail === 15) {
    process.stdout.write(
      "EXPECTED_FAIL_ADMIN_V1_STAGING_RUNTIME_SOURCE_POLICY stage=DIRTY_PRECOMMIT_WORKTREE_CLEANUP_GLOBAL_BUDGET_SANITIZATION assertions=60 pass=45 fail=15 internal_failures=0\n",
    );
    process.exit(1);
  }
  if (fail !== 0) {
    const failedIndices = results.flatMap((result, index) =>
      result ? [] : [index],
    );
    const reviewDiagnostic = reviewedCandidateFacts(orchestratorSource);
    process.stdout.write(
      `FAIL_ADMIN_V1_STAGING_RUNTIME_SOURCE_POLICY assertions=60 pass=${pass} fail=${fail} failed_indices=${failedIndices.join(",")} reviewed_actual=${reviewDiagnostic.actual} reviewed_stable_actual=${reviewDiagnostic.stableActual} internal_failures=0\n`,
    );
    process.exit(1);
  }
  const mutations = mutationResults(orchestratorSource);
  assert.equal(mutations.length, 41);
  assert(mutations.every(Boolean));
  process.stdout.write(
    "PASS_ADMIN_V1_STAGING_RUNTIME_SOURCE_POLICY assertions=60 mutations=41 branch_transaction_gates=4 branch_transaction_mutations=70 branch_transaction_states=16 branch_transaction_cases=14 branch_delete_pushes_maximum=2 git_remote_reads_maximum=42 sanitized_branch_journal=true runtime_routes=7 runtime_methods=13 application_requests=20 runtime_sessions=1 retries=0 pretarget_qualification_requests=6 durable_projection_requests=20 poststate_oracle=COMPLETE runtime_environment_metadata=5_of_5 local_environment_names=4 environment_pulls=0 direct_data_success_requests=14 direct_data_maximum=26 cleanup_storage_list_reserve=4 cleanup_storage_download_reserve=3 preview_deployments=8 qualification_get_requests_maximum=4 metadata_reprobes=0 cleanup_required=true owner_cleanup_fallback=0 raw_child_output_persisted=0 failures=0 internal_failures=0\n",
  );
} catch (caught) {
  const diagnostic =
    caught instanceof Error && /^[A-Z0-9_ -]{1,160}$/u.test(caught.message)
      ? caught.message.replaceAll(" ", "_")
      : "UNCLASSIFIED";
  process.stdout.write(
    `FAIL_ADMIN_V1_STAGING_RUNTIME_SOURCE_POLICY assertions=60 pass=0 fail=60 diagnostic=${diagnostic} internal_failures=1\n`,
  );
  process.exit(1);
}
