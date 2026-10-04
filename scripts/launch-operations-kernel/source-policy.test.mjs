import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, constants, mkdtempSync, openSync, readFileSync, rmSync, writeSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { CLI_MODES, dispatchCli } from "./cli.mjs";
import {
  validateActivationBridgeSources,
  validateLocalOnlySources,
  verifyRepositoryCandidateManifest,
} from "./manifest.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const MANIFEST_PATH = path.join(
  ROOT,
  "scripts/launch-operations-kernel/candidate-manifest.json",
);
const SOURCE_REVIEW_PATH = path.join(
  ROOT,
  "testing/static-test-safety-manifest.json",
);
const candidateDocument = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const sourceReviewDocument = JSON.parse(
  readFileSync(SOURCE_REVIEW_PATH, "utf8"),
);
const candidateSources = new Map(
  candidateDocument.members
    .filter((entry) => entry.path.endsWith(".mjs"))
    .map((entry) => [
      entry.path,
      readFileSync(path.join(ROOT, entry.path), "utf8"),
    ]),
);
const independentlyReviewedSourceSha256ByPath = new Map(
  Object.entries(
    sourceReviewDocument
      .launch_operations_kernel_reviewed_unresolved_source_sha256_by_path,
  ),
);
const independentlyReviewedSemanticSourceSha256ByPath = new Map(
  Object.entries(
    sourceReviewDocument
      .launch_operations_kernel_semantic_source_sha256_by_path,
  ),
);
const validateCandidateSources = (sources) => validateLocalOnlySources(
  sources,
  {
    reviewedSemanticSourceSha256ByPath:
      independentlyReviewedSemanticSourceSha256ByPath,
    reviewedSourceSha256ByPath: independentlyReviewedSourceSha256ByPath,
  },
);
const validateResealedCandidateSources = (sources, changedPaths) => {
  const reviewedSourceSha256ByPath = new Map(
    independentlyReviewedSourceSha256ByPath,
  );
  for (const relativePath of changedPaths) {
    reviewedSourceSha256ByPath.set(
      relativePath,
      createHash("sha256").update(sources.get(relativePath)).digest("hex"),
    );
  }
  return validateLocalOnlySources(sources, {
    reviewedSemanticSourceSha256ByPath:
      independentlyReviewedSemanticSourceSha256ByPath,
    reviewedSourceSha256ByPath,
  });
};
const validateExplicitSemanticResealedCandidateSources = (
  sources,
  changedPaths,
) => {
  const reviewedSemanticSourceSha256ByPath = new Map(
    independentlyReviewedSemanticSourceSha256ByPath,
  );
  const reviewedSourceSha256ByPath = new Map(
    independentlyReviewedSourceSha256ByPath,
  );
  for (const relativePath of changedPaths) {
    const digest = createHash("sha256")
      .update(sources.get(relativePath))
      .digest("hex");
    reviewedSemanticSourceSha256ByPath.set(relativePath, digest);
    reviewedSourceSha256ByPath.set(relativePath, digest);
  }
  return validateLocalOnlySources(sources, {
    reviewedSemanticSourceSha256ByPath,
    reviewedSourceSha256ByPath,
  });
};
const validateIndependentlyPinnedCandidateSources = (sources) =>
  validateLocalOnlySources(sources, {
    reviewedSemanticSourceSha256ByPath:
      independentlyReviewedSemanticSourceSha256ByPath,
    reviewedSourceSha256ByPath: independentlyReviewedSourceSha256ByPath,
  });
const failures = [];
let assertions = 0;

async function check(name, operation) {
  try {
    await operation();
    assertions += 1;
  } catch (error) {
    failures.push(`${name}:${error?.code ?? error?.message ?? "UNKNOWN"}`);
  }
}

await check("reviewed deterministic-grant crypto imports pass at the exact runtime and live-platform paths", async () => {
  assert.equal(validateTransportSources(candidateSources).verified, true);
});
await check("unreviewed crypto import in kernel remains forbidden after explicit source reseal", async () => {
  const relativePath = "scripts/launch-operations-kernel/kernel.mjs";
  const sources = new Map(candidateSources);
  sources.set(relativePath,
    'import { createHash } from "node:crypto";\n' + sources.get(relativePath));
  assert.throws(
    () => validateTransportSources(sources),
    (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
  );
});

// BEGIN A20R4_TRANSPORT_POLICY_TESTS
const transportRunnerPath =
  "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs";
const transportBegin = "// BEGIN A20_FIXED_FD_BROKER_CLIENT";
const transportEnd = "// END A20_FIXED_FD_BROKER_CLIENT";
const transportCurrentRunner = candidateSources.get(transportRunnerPath);
const transportBeginOffset = transportCurrentRunner.indexOf(transportBegin);
const transportEndOffset = transportCurrentRunner.indexOf(transportEnd) +
  transportEnd.length;
const transportReviewedRegion = transportCurrentRunner.slice(
  transportBeginOffset,
  transportEndOffset,
);
// Removing the separately attested import only in this classifier fixture
// isolates the existing exact-region exemption.
const transportIsolatedRunner = transportCurrentRunner.replace(
  'import * as brokerNativeFs from "node:fs";\n',
  "",
);
function validateTransportSources(sources) {
  const semantic = new Map(independentlyReviewedSemanticSourceSha256ByPath);
  const unresolved = new Map(independentlyReviewedSourceSha256ByPath);
  for (const bindings of [semantic, unresolved]) {
    for (const relativePath of bindings.keys()) {
      bindings.set(relativePath, createHash("sha256")
        .update(sources.get(relativePath)).digest("hex"));
    }
  }
  return validateLocalOnlySources(sources, {
    reviewedSemanticSourceSha256ByPath: semantic,
    reviewedSourceSha256ByPath: unresolved,
  });
}
function validateTransportRunner(source) {
  const sources = new Map(candidateSources);
  sources.set(transportRunnerPath, source);
  return validateTransportSources(sources);
}
await check("A20R4 current integrated runner must pass exact region attestation", async () => {
  assert.equal(validateTransportRunner(transportCurrentRunner).verified, true);
});
await check("A20R4 exact transport region passes with unrelated import capability isolated", async () => {
  assert.equal(Buffer.byteLength(transportReviewedRegion, "utf8"), 10641);
  assert.equal(createHash("sha256").update(transportReviewedRegion).digest("hex"),
    "936839731b7fc4c57cd1ac7fdc7135da378c5eee814528e64092c73c19f49147");
  assert.equal(validateTransportRunner(transportIsolatedRunner).verified, true);
});
for (const [name, mutate] of [
  ["missing BEGIN", (source) => source.replace(transportBegin, "// absent BEGIN")],
  ["missing END", (source) => source.replace(transportEnd, "// absent END")],
  ["duplicate BEGIN", (source) => source.replace(transportBegin, `${transportBegin}\n${transportBegin}`)],
  ["duplicate END", (source) => source.replace(transportEnd, `${transportEnd}\n${transportEnd}`)],
  ["reversed markers", (source) => source.replace(transportBegin, "// A20R4_TEMP_MARKER")
    .replace(transportEnd, transportBegin).replace("// A20R4_TEMP_MARKER", transportEnd)],
  ["altered FD number", (source) => source.replace('REQUEST_FD !== "3"', 'REQUEST_FD !== "5"')],
  ["altered broker control name", (source) => source.replace(
    "const mode = env.AIFINDER_GIT_BROKER_MODE;", "const mode = env.AIFINDER_OTHER_MODE;")],
  ["altered framed-write body", (source) => source.replace(
    "fs.writeSync(fd, bytes, offset, bytes.length - offset, null)",
    "fs.writeSync(5, bytes, offset, bytes.length - offset, null)")],
  ["environment outside region", (source) => source + "\nconst outsideEnv = process.env.AIFINDER_GIT_BROKER_MODE;\n"],
  ["writeSync outside region", (source) => source + "\nwriteSync(3, Buffer.from('outside'));\n"],
  ["hrtime outside region", (source) => source + "\nconst outsideTime = process.hrtime.bigint();\n"],
  ["native binding outside region", (source) => source + '\nprocess.binding("pipe_wrap");\n'],
  ["changed native binding", (source) => source.replace('process.binding("pipe_wrap")', 'process.binding("tcp_wrap")')],
  ["native open outside region", (source) => source + "\nhandle.open(5);\n"],
  ["network remains prohibited", (source) => source + "\nfetch('https://example.invalid');\n"],
  ["runtime construction remains prohibited", (source) => source + "\nnew Function('return 1');\n"],
  ["broad Git remains prohibited", (source) => source + '\nconst outsideGit = ["add", "."];\n'],
  ["elevated mode remains prohibited", (source) => source + '\nconst outsideMode = "--production";\n'],
  ["external filesystem namespace import remains prohibited", (source) =>
    'import * as outsideFs from "node:fs";\n' + source],
]) {
  await check(`A20R4 ${name} rejects`, async () => {
    const mutated = mutate(transportIsolatedRunner);
    assert.notEqual(mutated, transportIsolatedRunner);
    assert.throws(() => validateTransportRunner(mutated),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  });
}
for (const offset of [0, transportBegin.length, Math.floor(transportReviewedRegion.length / 2),
  transportReviewedRegion.length - transportEnd.length - 1, transportReviewedRegion.length - 1]) {
  await check(`A20R4 one-byte region alteration at ${offset} rejects`, async () => {
    const replacement = transportReviewedRegion.charAt(offset) === "x" ? "y" : "x";
    const mutatedRegion = transportReviewedRegion.slice(0, offset) + replacement +
      transportReviewedRegion.slice(offset + 1);
    const mutated = transportIsolatedRunner.replace(transportReviewedRegion, mutatedRegion);
    assert.notEqual(mutated, transportIsolatedRunner);
    assert.throws(() => validateTransportRunner(mutated),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  });
}
await check("A20R4 copied exact region in another path receives no exemption", async () => {
  assert.throws(() => validateLocalOnlySources(new Map([
    ["scripts/copied-transport.mjs", transportReviewedRegion],
  ])), (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY");
});
// END A20R4_TRANSPORT_POLICY_TESTS

// BEGIN A20R5_IMPORT_ATTESTATION_TESTS
const transportExactImport = 'import * as brokerNativeFs from "node:fs";';
await check("A20R5 actual runner passes exact brokerNativeFs import attestation", async () => {
  assert.equal(validateTransportRunner(transportCurrentRunner).verified, true);
});
for (const [name, mutate] of [
  ["renamed namespace binding", (source) => source.replace(transportExactImport,
    'import * as renamedFs from "node:fs";')],
  ["alternate module specifier", (source) => source.replace(transportExactImport,
    'import * as brokerNativeFs from "fs";')],
  ["duplicate exact namespace declaration", (source) => transportExactImport + "\n" + source],
  ["second unrelated filesystem namespace", (source) =>
    'import * as outsideFs from "node:fs";\n' + source],
  ["external binding use", (source) => source + "\nvoid brokerNativeFs;\n"],
  ["external binding assignment", (source) => source + "\nbrokerNativeFs = {};\n"],
  ["external destructuring", (source) => source + "\nconst { readSync: escapedRead } = brokerNativeFs;\n"],
  ["external alias escape", (source) => source + "\nconst escapedFs = brokerNativeFs;\n"],
  ["external shadow rebinding", (source) => source +
    "\nfunction outsideBinding(brokerNativeFs) { return brokerNativeFs; }\n"],
  ["named mutation import remains forbidden", (source) =>
    'import { writeFileSync as outsideWrite } from "node:fs";\n' + source],
  ["combined default and namespace import", (source) => source.replace(transportExactImport,
    'import defaultFs, * as brokerNativeFs from "node:fs";')],
  ["changed frozen region SHA", (source) => source.replace(
    '"A20_GIT_GRANT_V1"', '"A20_GIT_GRANT_V2"')],
  ["changed frozen region length", (source) => source.replace(transportBegin, transportBegin + " ")],
  ["missing BEGIN marker", (source) => source.replace(transportBegin, "// absent BEGIN")],
  ["missing END marker", (source) => source.replace(transportEnd, "// absent END")],
  ["duplicate BEGIN marker", (source) => source.replace(transportBegin, `${transportBegin}\n${transportBegin}`)],
  ["duplicate END marker", (source) => source.replace(transportEnd, `${transportEnd}\n${transportEnd}`)],
  ["reversed region markers", (source) => source.replace(transportBegin, "// A20R5_TEMP_MARKER")
    .replace(transportEnd, transportBegin).replace("// A20R5_TEMP_MARKER", transportEnd)],
  ["external writeSync", (source) => source + "\nwriteSync(3, Buffer.from('outside'));\n"],
  ["external environment", (source) => source + "\nconst outsideEnv = process.env.AIFINDER_GIT_BROKER_MODE;\n"],
  ["external hrtime", (source) => source + "\nconst outsideTime = process.hrtime.bigint();\n"],
  ["network remains forbidden", (source) => source + "\nfetch('https://example.invalid');\n"],
  ["runtime construction remains forbidden", (source) => source + "\nnew Function('return 1');\n"],
  ["external re-export escape", (source) => source + "\nexport { brokerNativeFs };\n"],
]) {
  await check(`A20R5 ${name} rejects`, async () => {
    const mutated = mutate(transportCurrentRunner);
    assert.notEqual(mutated, transportCurrentRunner);
    assert.throws(() => validateTransportRunner(mutated),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  });
}
await check("A20R5 copied exact import and region in another path receives no attestation", async () => {
  assert.throws(() => validateLocalOnlySources(new Map([
    ["scripts/copied-native-fs.mjs", transportExactImport + "\n" + transportReviewedRegion],
  ])), (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY");
});
// END A20R5_IMPORT_ATTESTATION_TESTS

// BEGIN PR4_CR2_BOUNDED_TRANSPORT_TESTS
// Hard admission before evaluating any extracted source in this test contract.
assert.equal(Buffer.byteLength(transportReviewedRegion), 10641);
assert.equal(createHash("sha256").update(transportReviewedRegion).digest("hex"), "936839731b7fc4c57cd1ac7fdc7135da378c5eee814528e64092c73c19f49147");
await check("CR2 both client copies have identical inclusive reviewed bytes", async () => {
  const utility = readFileSync(path.join(ROOT, "testing/static-governance-utils.mjs"), "utf8");
  assert.equal(utility.slice(utility.indexOf(transportBegin), utility.indexOf(transportEnd) + transportEnd.length), transportReviewedRegion);
});
const transportForTest = await import("data:text/javascript;base64," + Buffer.from(
  'import * as brokerNativeFs from "node:fs";\n' + transportReviewedRegion,
).toString("base64"));
const transportEnv = { AIFINDER_GIT_BROKER_MODE: "1", AIFINDER_GIT_BROKER_REQUEST_FD: "3", AIFINDER_GIT_BROKER_RESPONSE_FD: "4" };
const transportContext = { git_dir: null, object_directory: null, repository_root: "/synthetic", work_tree_root: null };
function transportFrame(body) {
  const text = typeof body === "string" ? body : JSON.stringify(body, Object.keys(body).sort());
  const bytes = Buffer.from(text); const header = Buffer.alloc(4); header.writeUInt32BE(bytes.length);
  return Buffer.concat([header, bytes]);
}
const transportGrant = transportFrame('{"id":1,"schema":"A20_GIT_GRANT_V1"}');
const transportReply = transportFrame('{"classification":"PASS","family":"TEST","git_pid":123,"id":1,"overflow":false,"schema":"A20_GIT_RESPONSE_V1","signal":null,"status":0,"stderr_base64":"","stdout_base64":"b2s=","timeout":false}');
function transportFixture({ bytes = Buffer.concat([transportGrant, transportReply]), readErrors = [], writeErrors = [], readStall = false, writeStall = false, stallAfter = Infinity, writeStallAfter = Infinity, drift = false } = {}) {
  let offset = 0, tick = 0, stats = 0, reads = 0, written = 0; const writes = []; const admitted = [];
  const retry = (code) => Object.assign(new Error(code), { code });
  const fs = {
    fstatSync(fd) { stats++; return { isFIFO: () => true, dev: 1, ino: drift && stats > 2 ? 99 : fd, mode: 0o10600 }; },
    readSync(fd, target, at, length) {
      reads++;
      assert.equal(fd, 4); assert.deepEqual(admitted, [3, 4]);
      if (readErrors.length) throw retry(readErrors.shift());
      if (readStall || offset >= stallAfter) throw retry("EAGAIN");
      const count = Math.min(length, 3, bytes.length - offset);
      bytes.copy(target, at, offset, offset + count); offset += count; return count;
    },
    writeSync(fd, bytes, at, length) {
      assert.equal(fd, 3); assert.deepEqual(admitted, [3, 4]);
      if (writeErrors.length) throw retry(writeErrors.shift());
      if (writeStall || written >= writeStallAfter) throw retry("EWOULDBLOCK");
      const count = Math.min(length, 2); writes.push(Buffer.from(bytes.subarray(at, at + count))); written += count; return count;
    },
  };
  return { fs, writes, options: { env: transportEnv, fs, now: () => tick, pause: () => { tick += 5000; }, nonblocking: (fd) => admitted.push(fd) }, tick: () => tick, reads: () => reads, offset: () => offset };
}
await check("CR2 partial frames with EAGAIN EWOULDBLOCK EINTR preserve request and result", async () => {
  const fixture = transportFixture({ readErrors: ["EAGAIN", "EINTR"], writeErrors: ["EWOULDBLOCK", "EINTR"] });
  const result = transportForTest.brokerRequest("TEST", {}, transportContext, fixture.options);
  assert.equal(result.stdout.toString(), "ok"); assert.equal(result.status, 0);
  const sent = Buffer.concat(fixture.writes); assert.equal(sent.readUInt32BE(0), sent.length - 4);
  assert.deepEqual(JSON.parse(sent.subarray(4).toString()), { schema: "A20_GIT_REQUEST_V1", id: 1, family: "TEST", params: {}, context: transportContext });
});
for (const [name, options] of [
  ["stalled grant", { readStall: true }],
  ["backpressured request", { writeStall: true }],
  ["partial response then stall", { stallAfter: transportGrant.length + 6 }],
  ["partial request then backpressure", { writeStallAfter: 4 }],
  ["continuous EINTR", { readErrors: ["EINTR", "EINTR", "EINTR", "EINTR", "EINTR"] }],
  ["fatal read error", { readErrors: ["EIO"] }],
  ["EOF", { bytes: Buffer.alloc(0) }],
  ["partial EOF", { bytes: transportGrant.subarray(0, 6) }],
  ["overflow", { bytes: Buffer.from([0, 128, 0, 1]) }],
  ["malformed", { bytes: transportFrame("{broken}") }],
  ["replayed result", { bytes: Buffer.concat([transportGrant, transportReply.subarray(0, 4), Buffer.from(transportReply.subarray(4).toString().replace('"id":1', '"id":2'))]) }],
  ["descriptor identity drift", { drift: true }],
]) {
  await check(`CR2 ${name} fails closed and poisons transport`, async () => {
    const fixture = transportFixture(options);
    assert.throws(() => transportForTest.brokerRequest("TEST", {}, transportContext, fixture.options), (error) => error.code === "A20_GIT_BROKER_CLIENT_FAILED");
    const written = fixture.writes.length;
    const reads = fixture.reads();
    assert.throws(() => transportForTest.brokerRequest("TEST", {}, transportContext, fixture.options), (error) => error.code === "A20_GIT_BROKER_CLIENT_FAILED");
    assert.equal(fixture.writes.length, written);
    assert.equal(fixture.reads(), reads);
    if (["stalled grant", "backpressured request", "partial response then stall", "partial request then backpressure", "continuous EINTR"].includes(name)) assert.equal(fixture.tick(), 25000);
  });
}
await check("CR2 grant request response share one deadline including final check", async () => {
  const fixture = transportFixture({ readErrors: ["EINTR", "EINTR"], writeErrors: ["EINTR", "EINTR", "EINTR"] });
  assert.throws(() => transportForTest.brokerRequest("TEST", {}, transportContext, fixture.options), (error) => error.code === "A20_GIT_BROKER_CLIENT_FAILED");
  assert.equal(fixture.tick(), 25000);
});
await check("CR2 expiry after final response bytes is rejected", async () => {
  const fixture = transportFixture();
  fixture.options.now = () => fixture.offset() === transportGrant.length + transportReply.length ? 25000 : 0;
  assert.throws(() => transportForTest.brokerRequest("TEST", {}, transportContext, fixture.options), (error) => error.code === "A20_GIT_BROKER_CLIENT_FAILED");
});
await check("CR2 failed descriptor setup forbids all frame I/O", async () => {
  const fixture = transportFixture(); fixture.options.nonblocking = () => { throw new Error("UNAVAILABLE"); };
  assert.throws(() => transportForTest.brokerRequest("TEST", {}, transportContext, fixture.options), (error) => error.code === "A20_GIT_BROKER_CLIENT_FAILED");
  assert.equal(fixture.reads(), 0); assert.equal(fixture.writes.length, 0);
});
async function nativeTransportDeadline(caseName) {
  const root = mkdtempSync(path.join(tmpdir(), "aifinder-cr2-fifo-")); const fds = [];
  const request = path.join(root, "request"), response = path.join(root, "response");
  try {
    const created = spawnSync("/usr/bin/mkfifo", [request, response], { env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C" }, timeout: 2000, killSignal: "SIGKILL", encoding: "utf8" });
    assert.equal(created.status, 0); assert.equal(created.stderr, "");
    const requestAnchor = openSync(request, constants.O_RDWR | constants.O_NONBLOCK); fds.push(requestAnchor);
    const responseAnchor = openSync(response, constants.O_RDWR | constants.O_NONBLOCK); fds.push(responseAnchor);
    const requestFd = openSync(request, constants.O_WRONLY); fds.push(requestFd);
    const responseFd = openSync(response, constants.O_RDONLY); fds.push(responseFd);
    if (caseName === "full-request") {
      let full = false;
      for (let count = 0; count < 16384; count++) {
        try { writeSync(requestAnchor, Buffer.alloc(4096)); }
        catch (error) { assert(["EAGAIN", "EWOULDBLOCK"].includes(error.code)); full = true; break; }
      }
      assert.equal(full, true);
    }
    if (caseName !== "stall-grant") writeSync(responseAnchor, transportGrant);
    const code = 'import * as brokerNativeFs from "node:fs";\n' + transportReviewedRegion + `\n
const started = process.hrtime.bigint();
const now = () => Number((process.hrtime.bigint() - started) / 10000n);
try { brokerDescriptors(${JSON.stringify(transportEnv)}); if (global.gc) global.gc(); brokerRequest("TEST", {}, ${JSON.stringify(transportContext)}, { env: ${JSON.stringify(transportEnv)}, now }); process.exit(2); }
catch (error) { if (error.code !== "A20_GIT_BROKER_CLIENT_FAILED") process.exit(3); process.stdout.write("BOUNDED_FAILURE\\n"); process.exit(0); }`;
    const child = spawn(process.execPath, ["--expose-gc", "--input-type=module", "-e", code], { env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C" }, stdio: ["ignore", "pipe", "pipe", requestFd, responseFd], detached: true });
    let out = "", err = "", outer = false; child.stdout.on("data", (bytes) => { out += bytes; }); child.stderr.on("data", (bytes) => { err += bytes; });
    const exit = await new Promise((resolve, reject) => {
      let reap;
      const timer = setTimeout(() => { outer = true; if (child.exitCode === null && child.signalCode === null) { try { process.kill(-child.pid, "SIGKILL"); } catch (error) { reject(error); } } reap = setTimeout(() => reject(new Error("CR2_REAP_UNCONFIRMED")), 2000); }, 2000);
      child.once("error", (error) => { clearTimeout(timer); clearTimeout(reap); reject(error); });
      child.once("close", (status, signal) => { clearTimeout(timer); clearTimeout(reap); resolve({ status, signal }); });
    });
    assert.throws(() => process.kill(child.pid, 0), (error) => error.code === "ESRCH");
    assert.throws(() => process.kill(-child.pid, 0), (error) => error.code === "ESRCH");
    assert.equal(outer, false); assert.deepEqual(exit, { status: 0, signal: null }); assert.equal(err, ""); assert.equal(out, "BOUNDED_FAILURE\n");
  } finally { for (const fd of fds) closeSync(fd); rmSync(root, { recursive: true, force: true }); }
}
for (const caseName of ["stall-grant", "stall-response", "full-request"]) {
  await check(`CR2 native ${caseName} deadline returns before owned outer reap deadline`, async () => {
    assert(["darwin", "linux"].includes(process.platform));
    await nativeTransportDeadline(caseName);
  });
}
// END PR4_CR2_BOUNDED_TRANSPORT_TESTS

// BEGIN PR4_CR2_TEST_POLICY_NEGATIVES
const transportPolicyTestPath = "scripts/launch-operations-kernel/source-policy.test.mjs";
const transportPolicyTestSource = candidateSources.get(transportPolicyTestPath);
const transportPolicyTestBegin = ["// BEGIN", "PR4_CR2_BOUNDED_TRANSPORT_TESTS"].join(" ");
const transportPolicyTestEnd = ["// END", "PR4_CR2_BOUNDED_TRANSPORT_TESTS"].join(" ");
for (const [name, mutate] of [
  ["missing test BEGIN", (source) => source.replace(transportPolicyTestBegin, "// absent test BEGIN")],
  ["missing test END", (source) => source.replace(transportPolicyTestEnd, "// absent test END")],
  ["duplicate test BEGIN", (source) => source.replace(transportPolicyTestBegin, transportPolicyTestBegin + "\n" + transportPolicyTestBegin)],
  ["duplicate test END", (source) => source.replace(transportPolicyTestEnd, transportPolicyTestEnd + "\n" + transportPolicyTestEnd)],
  ["changed hard client admission", (source) => source.replace('assert.equal(Buffer.byteLength(transportReviewedRegion), 10641);', 'assert.equal(Buffer.byteLength(transportReviewedRegion), 1);')],
  ["changed child executable", (source) => source.replace('spawn(process.execPath, ["--expose-gc"', 'spawn("/bin/sh", ["--expose-gc"')],
  ["changed outer deadline", (source) => source.replace('}, 2000);\n      child.once("error"', '}, 200000);\n      child.once("error"')],
  ["filesystem operation outside test", (source) => source + '\nwriteSync(3, Buffer.from("outside"));\n'],
  ["child operation outside test", (source) => source + '\nspawn("/bin/sh", []);\n'],
  ["computed import outside test", (source) => source + '\nawait import("data:text/javascript," + "export const escaped = true");\n'],
  ["extra process import", (source) => source.replace('import { spawn, spawnSync } from "node:child_process";', 'import { spawn, spawnSync, exec } from "node:child_process";')],
]) {
  await check(`CR2 reviewed test policy ${name} rejects`, async () => {
    const mutated = mutate(transportPolicyTestSource); assert.notEqual(mutated, transportPolicyTestSource);
    const sources = new Map(candidateSources); sources.set(transportPolicyTestPath, mutated);
    assert.throws(() => validateTransportSources(sources), (error) => error.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  });
}
await check("CR2 copied native test region in another path receives no capability", async () => {
  const begin = transportPolicyTestSource.indexOf(transportPolicyTestBegin), end = transportPolicyTestSource.indexOf(transportPolicyTestEnd) + transportPolicyTestEnd.length;
  assert.throws(() => validateLocalOnlySources(new Map([["scripts/copied-native-tests.mjs", transportPolicyTestSource.slice(begin, end)]])), (error) => error.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY");
});
// END PR4_CR2_TEST_POLICY_NEGATIVES

await check("safe source accepted", async () => {
  const result = validateLocalOnlySources(
    new Map([
      [
        "scripts/read-only.mjs",
        'export const read = () => "local-only";\n',
      ],
    ]),
  );
  assert.deepEqual(result, {
    verified: true,
    source_count: 1,
    forbidden_capabilities: 0,
    legacy_imports: 0,
    live_routes: 0,
    live_entrypoints: 0,
    live_capability_files: 0,
    credential_access_files: 0,
    checkpoint_writer_files: 0,
  });
});

await check("quoted and commented mutation vocabulary is not executable", async () => {
  const result = validateLocalOnlySources(
    new Map([
      [
        "scripts/policy-vocabulary.mjs",
        [
          'export const quoted = \'mkdtempSync("/tmp/example")\';',
          '// openSync("x", "w");',
          '/* writeFileSync("x", "y"); */',
          "",
        ].join("\n"),
      ],
    ]),
  );
  assert.equal(result.verified, true);
  assert.equal(result.forbidden_capabilities, 0);
});

await check("regular-expression vocabulary is not executable", async () => {
  const result = validateLocalOnlySources(
    new Map([["scripts/regex-vocabulary.mjs", String.raw`export const marker = /writeFileSync\(/u;
`]]),
  );
  assert.equal(result.verified, true);
});

await check("live candidate identity attestation does not load the local parser dependency", async () => {
  const manifestSource = readFileSync(
    path.join(ROOT, "scripts/launch-operations-kernel/manifest.mjs"),
    "utf8",
  );
  const runnerSource = readFileSync(
    path.join(
      ROOT,
      "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs",
    ),
    "utf8",
  );
  assert.equal(manifestSource.includes('import ts from "typescript";'), false);
  assert.equal(manifestSource.includes('createRequire(import.meta.url)'), true);
  assert.equal(
    runnerSource.match(/sourcePolicyMode: "ATTESTED_BY_REVIEWED_IDENTITY"/gu)
      ?.length,
    2,
  );
});

await check("exact concrete live capability surfaces are isolated", async () => {
  const relativePaths = [
    "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs",
    "scripts/launch-operations-kernel/nonproduction-qualification-adapters.mjs",
    "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.mjs",
    "scripts/launch-operations-kernel/nonproduction-qualification-checkpoint-store.mjs",
  ];
  const sources = candidateSources;
  assert.deepEqual(validateCandidateSources(sources), {
    verified: true,
    source_count: 50,
    forbidden_capabilities: 0,
    legacy_imports: 0,
    live_routes: 4,
    live_entrypoints: 4,
    live_capability_files: 13,
    credential_access_files: 3,
    checkpoint_writer_files: 3,
  });
  assert.equal(
    sources.get(relativePaths[0]).includes(
      '["rev-list", "--parents", "-n", "1", commit]',
    ),
    true,
  );
  assert.equal(
    sources.get(relativePaths[0]).includes(
      "authorizationFromSupervisorTrust(supervisorTrust, nowEpochMs)",
    ),
    true,
  );
  assert.equal(
    sources.get(relativePaths[0]).includes("readConcreteAuthorizationRecord"),
    false,
  );
  assert.equal(
    sources.get(relativePaths[0]).includes(
      "supervisorTrust = dependencies.supervisor_trust",
    ),
    true,
  );
  assert.equal(
    sources.get(relativePaths[1]).includes("binding.row_ids.length === 1"),
    true,
  );
  assert.equal(
    sources.get(relativePaths[2]).includes("async resolveBinding(resource)"),
    true,
  );
  assert.equal(
    sources.get(relativePaths[2]).includes(
      "terminalInventory(body, collectionName)",
    ),
    true,
  );
  assert.equal(
    sources.get(relativePaths[2]).includes(
      "body.pagination.count !== body[collectionName].length",
    ),
    true,
  );
  assert.equal(
    sources.get(relativePaths[2]).includes(
      "`--force-with-lease=${expectedRef}:`",
    ),
    true,
  );
  assert.equal(
    sources.get(relativePaths[2]).includes(
      "`--force-with-lease=${expectedRef}:${commit_sha}`",
    ),
    true,
  );
  assert.equal(
    sources.get(relativePaths[1]).includes("CONCRETE_CREDENTIAL_TARGET_MISMATCH"),
    true,
  );
  assert.equal(
    sources.get(relativePaths[3]).includes("fsyncSync(directoryDescriptor);"),
    true,
  );
  assert.equal(
    sources.get(relativePaths[3]).includes('spawn("/usr/bin/lockf"'),
    true,
  );
});

await check("actual activation bridge source accepted", async () => {
  const source = readFileSync(
    path.join(ROOT, "scripts/launch-operations-kernel/activation-bridge.mjs"),
    "utf8",
  );
  assert.deepEqual(
    validateActivationBridgeSources(
      new Map([["scripts/launch-operations-kernel/activation-bridge.mjs", source]]),
      {
        reviewedSourceSha256ByPath:
          independentlyReviewedSourceSha256ByPath,
      },
    ),
    {
      verified: true,
      source_count: 1,
      forbidden_capabilities: 0,
      legacy_calls: 0,
      pattern_mutation_authority: 0,
      elevated_authority: 0,
      freeze_bypasses: 0,
    },
  );
});

await check("activation bridge keeps checkpoint CAS and canonical evidence guards", async () => {
  const activationSource = readFileSync(
    path.join(ROOT, "scripts/launch-operations-kernel/activation-bridge.mjs"),
    "utf8",
  );
  const kernelSource = readFileSync(
    path.join(ROOT, "scripts/launch-operations-kernel/kernel.mjs"),
    "utf8",
  );
  for (const required of [
    "84a37bd0d303ef9afc30613aa5c2c737af082dd813dc617313395b7ffecaede3",
    "commitDurableCheckpoint",
    "validateRecoveryState",
    "validateTerminalState",
    "safeExactReceipt",
    "EVIDENCE_DIVERGENCE",
    "checkpoint_identity_sha256",
    "readCheckpointHead",
    "recovery_operation_state",
    "qualification_operation_slots",
    "recordQualificationOperationReceipt",
    "reservation_proof_sha256",
    "verified_present_resources",
    "retain_preview_on_success !== true",
    "QUALIFICATION_BUDGET_MISMATCH",
    "QUALIFICATION_FAILURE_PROJECTION",
    "ATTEMPT_BEGIN_STATE_UNKNOWN",
    "CLEANUP_CHECKPOINT_STATE_UNKNOWN",
    "allowUnknownCheckpoint",
    "checkpointBestEffortDisposition",
    "failure_cleanup_safe",
    "deriveRecoveryCapabilitySha256",
    "RECOVERY_HEAD_UNKNOWN",
    "TERMINAL_CHECKPOINT_STATE_UNKNOWN",
  ]) {
    assert.equal(activationSource.includes(required), true, required);
  }
  for (const required of [
    "BEGIN_ATTEMPT",
    "CAS_CHECKPOINT",
    "predecessor_checkpoint_identity_sha256",
    "creation_receipt_sha256",
    "CHECKPOINT_COMMITTED",
    "CHECKPOINT_PRESENT",
    "CHECKPOINT_STATE_UNKNOWN",
    "deriveRecoveryOperationBindingSha256",
    "deriveQualificationReservationProofSha256",
    "deriveQualificationReservationRootSha256",
    "qualificationReservationExecutionPaths",
    "validateQualificationReservationProofChain",
    "LAUNCH_OPERATIONS_EXACT_RECOVERY_CAPABILITY",
    "RECOVERY_FAILURE_PROJECTION",
    "recovery_grant",
    "validateGrantedRecoveryJournal",
    "validReservationBudgetAccounting",
    "validQualificationSlotUsageSemantics",
    "qualification_slot_usage",
    "qualification_operation_slots",
    "validateQualificationCreationLedgerClosure",
    "validateTerminalQualifiedOperationLedgerClosure",
    "validateTerminalLocalFailureOperationLedgerClosure",
    "validateRecoveryAuthorizationProvenance",
    "validateTerminalRecoveryLedgerClosure",
    "validateSemanticTransitionHistory",
    "COMPACT_EVIDENCE_LIFECYCLES",
    "QUALIFYING>FAILED_CLOSED",
    "entry.review_sha256 !== expectedReview",
    "VERIFIED_REVIEWED_RECOVERY_AUTHORITY",
    "authorization.review_sha256 !== durableGrant.review_sha256",
    "finalProvenance.to !== state.lifecycle_state",
    "ATTEMPT_ALREADY_EXISTS",
    "RESULT_APPLIED",
    "exactReconciliationReceipt",
    "exactStatusSensitiveInspectionReceipt",
    "validateQualificationCompensationChronology",
    "validateActivationSemanticParity",
    "ACTIVATION_CURRENT_RETAINED_STATE_ATTESTATION_SHA256",
    "SAFE_EMPTY_RETAINED_STATE_ATTESTATION_SHA256",
    "validActivationRunId",
    "abortedSuccessPath",
    "completedSuccessDeletes",
    "validate_receipt",
    "rememberFailure",
    "validate_candidate",
    "validate_candidate: validateTerminalState",
  ]) {
    assert.equal(kernelSource.includes(required), true, required);
  }
  assert.equal(kernelSource.includes("ensureRecoveryAnchor"), false);
});

for (const [name, source] of [
  [
    "child process mutation rejected",
    'import { spawn } from "node:' + "child" + "_" + 'process";\nspawn("true");\n',
  ],
  [
    "filesystem mutation rejected",
    'import { ' + "write" + 'FileSync } from "node:fs";\n' + "write" + 'FileSync("x", "y");\n',
  ],
  [
    "hard-link mutation rejected",
    'import { linkSync } from "node:fs";\nlinkSync("x", "y");\n',
  ],
  [
    "write-capable open mutation rejected",
    'import { openSync } from "node:fs";\nopenSync("x", "w");\n',
  ],
  [
    "copy mutation rejected",
    'import { copyFileSync as duplicate } from "node:fs";\nduplicate("x", "y");\n',
  ],
  [
    "async hard-link alias mutation rejected",
    'import { link as attach } from "node:fs";\nattach("x", "y", () => {});\n',
  ],
  [
    "filesystem namespace mutation authority rejected",
    'import * as localFs from "node:fs";\nlocalFs.renameSync("x", "y");\n',
  ],
  [
    "template expression filesystem mutation authority rejected",
    'export const value = `${(await import("node:fs")).openSync("x", "w")}`;\n',
  ],
  [
    "regular expression comment marker cannot hide network authority",
    'const marker = /[/*]/u;\nawait ' + "fet" + 'ch("https://example.com");\n',
  ],
  [
    "control-flow regular expression cannot hide network authority",
    'if (true) /[/*]/u.test("/");\nawait ' + "fet" + 'ch("https://example.com");\n',
  ],
  [
    "post-block regular expression cannot hide network authority",
    'if (true) {}\n/[/*]/u.test("/");\nawait ' + "fet" + 'ch("https://example.com");\n',
  ],
  [
    "object-literal division cannot hide network authority",
    'export const result = { value: 1 } / ' + "fet" + 'ch("https://example.com") / 2;\n',
  ],
  [
    "for-await regular expression cannot hide network authority",
    'const values = [];\nfor await (const value of values) /[/*]/u.test(value);\nawait ' +
      "fet" + 'ch("https://example.com");\n',
  ],
  [
    "regular expression brace cannot hide template mutation authority",
    'export const value = `${/[}]/u.test("}") ? (await import("node:fs")).openSync("x", "w") : 0}`;\n',
  ],
  ["network mutation rejected", 'await ' + "fet" + 'ch("https://example.com");\n'],
  [
    "computed global network mutation rejected",
    'await globalThis["fet' + 'ch"]("https://example.com");\n',
  ],
  [
    "constant-computed global network authority rejected",
    'const request = globalThis["fet" + "ch"];\nawait request("https://example.com");\n',
  ],
  [
    "multi-hop constant-computed global network authority rejected",
    'const first = globalThis;\nconst second = first;\nconst request = second["fet" + "ch"];\nawait request("https://example.com");\n',
  ],
  [
    "constant-computed process environment authority rejected",
    'export const value = process["e" + "nv"].SECRET;\n',
  ],
  [
    "process builtin-module filesystem authority rejected",
    'const module = process.getBuiltinModule("node:fs");\nconst write = module["write" + "FileSync"];\nwrite("/tmp/source-policy-bypass", "x");\n',
  ],
  [
    "aliased process builtin-module filesystem authority rejected",
    'const runtime = process;\nconst module = runtime.getBuiltinModule("node:fs");\nconst write = module["write" + "FileSync"];\nwrite("/tmp/source-policy-bypass", "x");\n',
  ],
  [
    "constructor-derived runtime code authority rejected",
    'const build = (async () => {}).constructor;\nawait build(\'return globalThis["fet" + "ch"]("https://example.com")\')();\n',
  ],
  [
    "constant-computed constructor runtime code authority rejected",
    'const build = (async () => {})["con" + "structor"];\nawait build(\'return globalThis["fet" + "ch"]("https://example.com")\')();\n',
  ],
  [
    "constant-computed global Function authority rejected",
    'const build = globalThis["Fun" + "ction"];\nawait build(\'return globalThis["fet" + "ch"]("https://example.com")\')();\n',
  ],
  [
    "bound-key runtime constructor authority rejected",
    'const key = "constructor";\nconst build = (async () => {})[key];\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "multi-hop bound-key runtime constructor authority rejected",
    'const first = "con";\nconst second = "structor";\nconst key = first + second;\nconst build = (async () => {})[key];\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "mutable bound-key runtime constructor authority rejected",
    'let key = "constructor";\nconst build = (async () => {})[key];\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "array-joined runtime constructor authority rejected",
    'const parts = ["con", "structor"];\nconst key = parts.join("");\nconst build = (async () => {})[key];\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "from-char-code runtime constructor authority rejected",
    'const key = String.fromCharCode(99, 111, 110, 115, 116, 114, 117, 99, 116, 111, 114);\nconst build = (async () => {})[key];\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "function-returned runtime constructor authority rejected",
    'const key = () => "constructor";\nconst build = (async () => {})[key()];\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "reverse-joined runtime constructor authority rejected",
    'const key = ["rotcurtsnoc"].map((value) => [...value].reverse().join("")).join("");\nconst build = (async () => {})[key];\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "descriptor-enumerated runtime constructor authority rejected",
    'const key = Object.getOwnPropertyNames(async () => {}).find((name) => name.endsWith("structor"));\nconst build = (async () => {})[key];\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "stored runtime constructor authority rejected",
    'const bag = { key: ["con", "structor"].join("") };\nconst key = bag.key;\nconst build = (async () => {})[key];\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "object-binding runtime constructor authority rejected",
    'const { constructor: build } = async () => {};\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "computed object-binding runtime constructor authority rejected",
    'const key = "con" + "structor";\nconst { [key]: build } = async () => {};\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "post-declaration runtime constructor authority rejected",
    'let key;\nkey = "constructor";\nconst build = (async () => {})[key];\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "assignment-binding runtime constructor authority rejected",
    'let build;\n({ constructor: build } = async () => {});\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "shorthand assignment runtime constructor authority rejected",
    'let constructor;\n({ constructor } = async () => {});\nawait constructor(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "nested assignment runtime constructor authority rejected",
    'let build;\n({ nested: { constructor: build } } = { nested: async () => {} });\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "defaulted shorthand assignment runtime constructor authority rejected",
    'let constructor;\n({ constructor = null } = async () => {});\nawait constructor(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "nested computed assignment runtime constructor authority rejected",
    'const key = "constructor";\nlet build;\n({ nested: { [key]: build } } = { nested: async () => {} });\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "mixed array object assignment runtime constructor authority rejected",
    'let build;\n([{ constructor: build }] = [async () => {}]);\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "node process default alias authority rejected",
    'import proc from "node:process";\nproc.kill(proc.pid, "SIGKILL");\n',
  ],
  [
    "node process named signal alias authority rejected",
    'import { kill as signal } from "node:process";\nsignal(12345, "SIGKILL");\n',
  ],
  [
    "node process bound signal alias authority rejected",
    'import { kill as signal } from "node:process";\nconst invoke = signal.bind(null, 12345, "SIGKILL");\ninvoke();\n',
  ],
  [
    "node process namespace environment authority rejected",
    'import * as proc from "node:process";\nexport const leaked = proc.env.SECRET;\n',
  ],
  [
    "dynamic node process authority rejected",
    'const proc = await import("node:process");\nproc.getBuiltinModule("node:fs").writeFileSync("/tmp/source-policy-bypass", "x");\n',
  ],
  [
    "reflective runtime constructor authority rejected",
    'const build = Reflect.get(async () => {}, "constructor");\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "property-descriptor runtime constructor authority rejected",
    'const build = Object.getOwnPropertyDescriptor(async () => {}, "constructor").value;\nawait build(\'return fetch("https://example.com")\')();\n',
  ],
  [
    "bare WebSocket network authority rejected",
    'const channel = new WebSocket("wss://example.com");\nchannel.send("x");\n',
  ],
  [
    "aliased EventSource network authority rejected",
    'const Stream = EventSource;\nexport const stream = new Stream("https://example.com");\n',
  ],
  [
    "bare XMLHttpRequest network authority rejected",
    'export const request = new XMLHttpRequest();\n',
  ],
  [
    "destructive process signal authority rejected",
    'process.kill(12345, "SIGKILL");\n',
  ],
  [
    "nonliteral process signal authority rejected",
    'export const signal = (pid, name) => process.kill(pid, name);\n',
  ],
  [
    "ordinary signal-zero process authority rejected",
    'export const probe = (pid) => process.kill(pid, 0);\n',
  ],
  [
    "ordinary exit-code process authority rejected",
    'process.exitCode = 1;\n',
  ],
  [
    "computed filesystem namespace mutation rejected",
    'import * as localFs from "node:fs/promises";\nawait localFs["write' + 'File"]("x", "y");\n',
  ],
  [
    "computed dynamic filesystem mutation rejected",
    'const localFs = await import("node:fs");\nconst mutate = localFs["write" + "FileSync"];\nmutate("x", "y");\n',
  ],
  [
    "destructured dynamic filesystem mutation rejected",
    'const { writeFileSync: mutate } = await import("node:fs");\nmutate("x", "y");\n',
  ],
  [
    "multi-hop dynamic filesystem mutation rejected",
    'const localFs = await import("node:fs");\nconst first = localFs;\nconst second = first;\nsecond.writeFileSync("x", "y");\n',
  ],
  [
    "optional dynamic filesystem mutation rejected",
    'const localFs = await import("node:fs");\nlocalFs?.writeFileSync("x", "y");\n',
  ],
  [
    "computed require filesystem mutation rejected",
    'const localFs = require("node:fs");\nconst mutate = localFs["write" + "FileSync"];\nmutate("x", "y");\n',
  ],
  [
    "filesystem promises facade mutation rejected",
    'import { promises as localFs } from "node:fs";\nawait localFs["write' + 'File"]("x", "y");\n',
  ],
  [
    "unreviewed package capability rejected",
    'import client from "axios";\nawait client.get("https://example.com");\n',
  ],
  [
    "runtime source construction rejected",
    '(0, eval)("globalThis.fetch(\\"https://example.com\\")");\n',
  ],
  ["environment mutation rejected", "export const value = " + "process" + ".env.SECRET;\n"],
  [
    "legacy route mutation rejected",
    'import "../../testing/' + "admin-v1-staging-runtime-" + 'orchestrator.mjs";\n',
  ],
]) {
  await check(name, async () => {
    assert.throws(
      () => validateLocalOnlySources(new Map([["scripts/mutant.mjs", source]])),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  });
}

await check("reviewed unresolved member fingerprint cannot be semantically repurposed", async () => {
  const canonicalPath = "scripts/launch-operations-kernel/canonical.mjs";
  const original = candidateSources.get(canonicalPath);
  const mutated = original
    .replace(
      ".map((key) => {",
      '.map((key) => {\n        value = async () => {};\n        key = ["con", "structor"].join("");',
    )
    .replace(
      "return `${JSON.stringify(key)}:${canonicalValue(value[key])}`;",
      'return `${JSON.stringify(key)}:${value[key](\'return fetch("https://example.com")\')()}`;',
    );
  assert.notEqual(mutated, original);
  const sources = new Map(candidateSources);
  sources.set(canonicalPath, mutated);
  assert.throws(
    () => validateIndependentlyPinnedCandidateSources(sources),
    (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
  );
});

await check("reviewed computed member complete source context cannot drift", async () => {
  const canonicalPath = "scripts/launch-operations-kernel/canonical.mjs";
  const original = candidateSources.get(canonicalPath);
  const sources = new Map(candidateSources);
  sources.set(canonicalPath, `${original}// source-policy context drift\n`);
  assert.throws(
    () => validateCandidateSources(sources),
    (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
  );
});

for (const [name, snippet] of [
  [
    "independently pinned unresolved member array round trip rejected",
    'const stored = [value[key]];\n        const build = stored[0];\n        build(\'return fetch("https://example.com")\')();',
  ],
  [
    "independently pinned unresolved member object destructuring round trip rejected",
    'const stored = { entry: value[key] };\n        const { entry: build } = stored;\n        build(\'return fetch("https://example.com")\')();',
  ],
  [
    "independently pinned unresolved member wrapper return rejected",
    'const carry = (entry) => entry;\n        const build = carry(value[key]);\n        build(\'return fetch("https://example.com")\')();',
  ],
  [
    "independently pinned unresolved member callback round trip rejected",
    'const build = [value[key]].map((entry) => entry).at(0);\n        build(\'return fetch("https://example.com")\')();',
  ],
  [
    "independently pinned unresolved member property store round trip rejected",
    'const stored = {};\n        stored.entry = value[key];\n        const build = stored.entry;\n        build(\'return fetch("https://example.com")\')();',
  ],
  [
    "independently pinned unresolved member parameter store round trip rejected",
    'let build;\n        const store = (entry) => { build = entry; };\n        store(value[key]);\n        build(\'return fetch("https://example.com")\')();',
  ],
]) {
  await check(name, async () => {
    const canonicalPath = "scripts/launch-operations-kernel/canonical.mjs";
    const original = candidateSources.get(canonicalPath);
    const mutated = original.replace(
      ".map((key) => {",
      `.map((key) => {\n        ${snippet}`,
    );
    assert.notEqual(mutated, original);
    const sources = new Map(candidateSources);
    sources.set(canonicalPath, mutated);
    assert.throws(
      () => validateIndependentlyPinnedCandidateSources(sources),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  });
}

for (const [name, addPreGateChildProcessCall] of [
  [
    "independent source pin remains mandatory after the last unresolved member is removed",
    false,
  ],
  [
    "independent source pin cannot be evicted before an added child process call",
    true,
  ],
]) {
  await check(name, async () => {
    const runnerPath =
      "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs";
    const original = candidateSources.get(runnerPath);
    let mutated = original.replaceAll(
      "authorization.compatibility_support_sha256[supportPath]",
      "Object.entries(authorization.compatibility_support_sha256)" +
        ".find((entry) => entry[0] === supportPath)?.[1]",
    );
    if (addPreGateChildProcessCall) {
      mutated = mutated.replace(
        "export async function verifyConcretePreEffectAuthorization({",
        [
          'spawnSync("/usr/bin/true", [], { stdio: "ignore" });',
          "export async function verifyConcretePreEffectAuthorization({",
        ].join("\n"),
      );
    }
    assert.notEqual(mutated, original);
    assert.equal(mutated.includes("[supportPath]"), false);
    const sources = new Map(candidateSources);
    sources.set(runnerPath, mutated);
    assert.throws(
      () => validateIndependentlyPinnedCandidateSources(sources),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  });
}

await check("independent source pin set rejects a missing reviewed path", async () => {
  const reviewedSourceSha256ByPath = new Map(
    independentlyReviewedSourceSha256ByPath,
  );
  assert.equal(reviewedSourceSha256ByPath.delete(
    "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs",
  ), true);
  assert.throws(
    () => validateLocalOnlySources(candidateSources, {
      reviewedSemanticSourceSha256ByPath:
        independentlyReviewedSemanticSourceSha256ByPath,
      reviewedSourceSha256ByPath,
    }),
    (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
  );
});

await check("independent source pin set rejects an extra reviewed path", async () => {
  const reviewedSourceSha256ByPath = new Map(
    independentlyReviewedSourceSha256ByPath,
  );
  const extraPath = "scripts/launch-operations-kernel/cli.mjs";
  reviewedSourceSha256ByPath.set(
    extraPath,
    createHash("sha256").update(candidateSources.get(extraPath)).digest("hex"),
  );
  assert.throws(
    () => validateLocalOnlySources(candidateSources, {
      reviewedSemanticSourceSha256ByPath:
        independentlyReviewedSemanticSourceSha256ByPath,
      reviewedSourceSha256ByPath,
    }),
    (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
  );
});

await check("concrete source policy requires the independent semantic pin set", async () => {
  assert.throws(
    () => validateLocalOnlySources(candidateSources, {
      reviewedSourceSha256ByPath: independentlyReviewedSourceSha256ByPath,
    }),
    (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
  );
});

await check("independent semantic pin set rejects a missing reviewed path", async () => {
  const reviewedSemanticSourceSha256ByPath = new Map(
    independentlyReviewedSemanticSourceSha256ByPath,
  );
  assert.equal(reviewedSemanticSourceSha256ByPath.delete(
    "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs",
  ), true);
  assert.throws(
    () => validateLocalOnlySources(candidateSources, {
      reviewedSemanticSourceSha256ByPath,
      reviewedSourceSha256ByPath: independentlyReviewedSourceSha256ByPath,
    }),
    (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
  );
});

await check("independent semantic pin set rejects an extra reviewed path", async () => {
  const reviewedSemanticSourceSha256ByPath = new Map(
    independentlyReviewedSemanticSourceSha256ByPath,
  );
  const extraPath = "scripts/launch-operations-kernel/activation-e2e.test.mjs";
  reviewedSemanticSourceSha256ByPath.set(
    extraPath,
    createHash("sha256").update(candidateSources.get(extraPath)).digest("hex"),
  );
  assert.throws(
    () => validateLocalOnlySources(candidateSources, {
      reviewedSemanticSourceSha256ByPath,
      reviewedSourceSha256ByPath: independentlyReviewedSourceSha256ByPath,
    }),
    (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
  );
});

const privilegedRunnerTestPath =
  "scripts/launch-operations-kernel/nonproduction-qualification-runner.test.mjs";
const privilegedRunnerTestSource = candidateSources.get(privilegedRunnerTestPath);
for (const [name, mutate] of [
  [
    "privileged runner test cannot select canonical dependencies",
    (source) => source.replace(
      "    async verifyCandidate() {\n      calls.candidate_verifications += 1;",
      "    async verifyCandidate() {\n      return createConcreteRunnerDependencies().verifyCandidate();\n      calls.candidate_verifications += 1;",
    ),
  ],
  [
    "privileged runner test cannot import the live supervisor",
    (source) => `${source}\nvoid import(\"../launch-operations-supervisor/nonproduction-qualification-supervisor.mjs\");\n`,
  ],
  [
    "privileged runner test cannot import concrete credential providers",
    (source) => `${source}\nvoid import(\"./nonproduction-qualification-adapters.mjs\");\n`,
  ],
  [
    "privileged runner test cannot bypass synthetic-only counters",
    (source) => source.replace(
      "    network: 0,\n    mutations: 0,",
      "    network: 1,\n    mutations: 0,",
    ),
  ],
  [
    "privileged runner test cannot invoke live mode from self-test",
    (source) => source.replace(
      'dispatchConcreteQualificationRunner(["--self-test"], test.dependencies)',
      'dispatchConcreteQualificationRunner(["--qualify-nonproduction", "--authorization", AUTHORIZATION_PATH], test.dependencies)',
    ),
  ],
]) {
  await check(name, async () => {
    const mutated = mutate(privilegedRunnerTestSource);
    assert.notEqual(mutated, privilegedRunnerTestSource);
    const sources = new Map(candidateSources);
    sources.set(privilegedRunnerTestPath, mutated);
    assert.throws(
      () => validateResealedCandidateSources(sources, [privilegedRunnerTestPath]),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  });
}

for (const [name, relativePath, mutate] of [
  [
    "ordinary reseal cannot refresh a live bootstrap semantic anchor",
    "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs",
    (source) => source.replace(
      "async function main() {",
      'async function main() {\n  void "semantic-anchor-sentinel";',
    ),
  ],
  [
    "ordinary reseal cannot refresh a manifest helper semantic anchor",
    "scripts/launch-operations-kernel/manifest.mjs",
    (source) => source.replace(
      "function exactArray(left, right) {\n  return (",
      "function exactArray(left, right) {\n  return Boolean(",
    ),
  ],
  [
    "ordinary reseal cannot refresh an imported canonical primitive anchor",
    "scripts/launch-operations-kernel/canonical.mjs",
    (source) => `${source}void "semantic-anchor-sentinel";\n`,
  ],
  [
    "protected runner declaration cannot be replaced after attestation",
    "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs",
    (source) => `${source}\nverifyConcreteCandidate = async () => ({ verified: true });\n`,
  ],
  [
    "protected manifest declaration cannot be replaced after attestation",
    "scripts/launch-operations-kernel/manifest.mjs",
    (source) => `${source}\nsourceCapabilities = () => ({ other_forbidden_module: false });\n`,
  ],
]) {
  await check(name, async () => {
    const original = candidateSources.get(relativePath);
    const mutated = mutate(original);
    assert.notEqual(mutated, original);
    const sources = new Map(candidateSources);
    sources.set(relativePath, mutated);
    assert.throws(
      () => validateResealedCandidateSources(sources, [relativePath]),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  });
}

await check("reviewed dependency loader alias cannot acquire a forbidden builtin", async () => {
  const manifestPath = "scripts/launch-operations-kernel/manifest.mjs";
  const original = candidateSources.get(manifestPath);
  const mutated = original.replace(
    "let typescriptDependency = null;",
    'export const leaked = requireDependency("node:process").env.SOURCE_POLICY_TEST;\nlet typescriptDependency = null;',
  );
  assert.notEqual(mutated, original);
  const sources = new Map(candidateSources);
  sources.set(manifestPath, mutated);
  assert.throws(
    () => validateResealedCandidateSources(sources, [manifestPath]),
    (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
  );
});

await check("reviewed dependency loader secondary alias remains classified", async () => {
  const manifestPath = "scripts/launch-operations-kernel/manifest.mjs";
  const original = candidateSources.get(manifestPath);
  const mutated = original.replace(
    "let typescriptDependency = null;",
    'const secondaryLoader = requireDependency;\nexport const leaked = secondaryLoader("node:process").env.SOURCE_POLICY_TEST;\nlet typescriptDependency = null;',
  );
  assert.notEqual(mutated, original);
  const sources = new Map(candidateSources);
  sources.set(manifestPath, mutated);
  assert.throws(
    () => validateResealedCandidateSources(sources, [manifestPath]),
    (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
  );
});

await check("reviewed dependency loader computed specifier remains classified", async () => {
  const manifestPath = "scripts/launch-operations-kernel/manifest.mjs";
  const original = candidateSources.get(manifestPath);
  const mutated = original.replace(
    "let typescriptDependency = null;",
    'const builtinName = ["node", "process"].join(":");\nexport const leaked = requireDependency(builtinName);\nlet typescriptDependency = null;',
  );
  assert.notEqual(mutated, original);
  const sources = new Map(candidateSources);
  sources.set(manifestPath, mutated);
  assert.throws(
    () => validateResealedCandidateSources(sources, [manifestPath]),
    (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
  );
});

for (const [name, snippet] of [
  [
    "reviewed createRequire factory alias cannot acquire a forbidden builtin",
    'const alternateFactory = createRequire;\nconst alternateLoader = alternateFactory(import.meta.url);\nexport const leaked = alternateLoader("node:process").env.SOURCE_POLICY_TEST;',
  ],
  [
    "reviewed createRequire immediate result cannot acquire a forbidden builtin",
    'export const leaked = createRequire(import.meta.url)("node:process").env.SOURCE_POLICY_TEST;',
  ],
  [
    "reviewed dynamic node module acquisition cannot acquire a forbidden builtin",
    'const moduleTools = await import("node:module");\nconst alternateLoader = moduleTools.createRequire(import.meta.url);\nexport const leaked = alternateLoader("node:process").env.SOURCE_POLICY_TEST;',
  ],
  [
    "reviewed createRequire factory container cannot acquire a forbidden builtin",
    'const factoryBox = { make: createRequire };\nconst alternateLoader = factoryBox.make(import.meta.url);\nexport const leaked = alternateLoader("node:process").env.SOURCE_POLICY_TEST;',
  ],
  [
    "reviewed createRequire factory wrapper cannot acquire a forbidden builtin",
    'const passFactory = (value) => value;\nconst alternateLoader = passFactory(createRequire)(import.meta.url);\nexport const leaked = alternateLoader("node:process").env.SOURCE_POLICY_TEST;',
  ],
  [
    "reviewed createRequire loader container cannot acquire a forbidden builtin",
    'const loaderBox = { loader: createRequire(import.meta.url) };\nconst { loader: alternateLoader } = loaderBox;\nexport const leaked = alternateLoader("node:process").env.SOURCE_POLICY_TEST;',
  ],
  [
    "reviewed bound createRequire factory cannot acquire a forbidden builtin",
    'const alternateFactory = createRequire.bind(null);\nconst alternateLoader = alternateFactory(import.meta.url);\nexport const leaked = alternateLoader("node:process").env.SOURCE_POLICY_TEST;',
  ],
]) {
  await check(name, async () => {
    const manifestPath = "scripts/launch-operations-kernel/manifest.mjs";
    const original = candidateSources.get(manifestPath);
    const mutated = original.replace(
      "let typescriptDependency = null;",
      `${snippet}\nlet typescriptDependency = null;`,
    );
    assert.notEqual(mutated, original);
    const sources = new Map(candidateSources);
    sources.set(manifestPath, mutated);
    assert.throws(
      () => validateResealedCandidateSources(sources, [manifestPath]),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  });
}

for (const [name, mutate] of [
  [
    "reviewed loader declaration cannot be exported",
    (source) => source.replace(
      "const requireDependency = createRequire(import.meta.url);",
      "export const requireDependency = createRequire(import.meta.url);",
    ),
  ],
  [
    "reviewed TypeScript loader function cannot be exported",
    (source) => source.replace(
      "function loadTypescriptDependency() {",
      "export function loadTypescriptDependency() {",
    ),
  ],
  [
    "reviewed loader cannot escape through an export list",
    (source) => source.replace(
      "let typescriptDependency = null;",
      "export { requireDependency };\nlet typescriptDependency = null;",
    ),
  ],
  [
    "reviewed TypeScript loader cannot escape through an exported wrapper",
    (source) => source.replace(
      "export class ManifestError extends Error {",
      [
        "export function exportedLoaderWrapper() {",
        "  return loadTypescriptDependency;",
        "}",
        "",
        "export class ManifestError extends Error {",
      ].join("\n"),
    ),
  ],
]) {
  await check(name, async () => {
    const manifestPath = "scripts/launch-operations-kernel/manifest.mjs";
    const original = candidateSources.get(manifestPath);
    const mutated = mutate(original);
    assert.notEqual(mutated, original);
    const sources = new Map(candidateSources);
    sources.set(manifestPath, mutated);
    assert.throws(
      () => validateResealedCandidateSources(sources, [manifestPath]),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  });
}

await check("reviewed loader export cannot cross a local import alias", async () => {
  const manifestPath = "scripts/launch-operations-kernel/manifest.mjs";
  const consumerPath = "scripts/launch-operations-kernel/canonical.mjs";
  const originalManifest = candidateSources.get(manifestPath);
  const originalConsumer = candidateSources.get(consumerPath);
  const mutatedManifest = originalManifest.replace(
    "const requireDependency = createRequire(import.meta.url);",
    "export const requireDependency = createRequire(import.meta.url);",
  );
  const mutatedConsumer = [
    'import { requireDependency as acquireDependency } from "./manifest.mjs";',
    'export const escapedProcess = acquireDependency("node:process").env;',
    originalConsumer,
  ].join("\n");
  assert.notEqual(mutatedManifest, originalManifest);
  assert.notEqual(mutatedConsumer, originalConsumer);
  const sources = new Map(candidateSources);
  sources.set(manifestPath, mutatedManifest);
  sources.set(consumerPath, mutatedConsumer);
  assert.throws(
    () => validateResealedCandidateSources(
      sources,
      [manifestPath, consumerPath],
    ),
    (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
  );
});

for (const [name, mutate] of [
  [
    "reviewed manifest rejects a side effect TypeScript import",
    (source) => `import "typescript";\n${source}`,
  ],
  [
    "reviewed manifest rejects a default TypeScript import",
    (source) => `import alternateTypescript from "typescript";\n${source}`,
  ],
  [
    "reviewed manifest rejects a named TypeScript import",
    (source) => `import { createSourceFile as alternateParser } from "typescript";\n${source}`,
  ],
  [
    "reviewed manifest rejects a namespace TypeScript import",
    (source) => `import * as alternateTypescript from "typescript";\n${source}`,
  ],
  [
    "reviewed manifest rejects a TypeScript re-export",
    (source) => `export * from "typescript";\n${source}`,
  ],
  [
    "reviewed manifest rejects a dynamic TypeScript import",
    (source) => `const alternateTypescript = await import("typescript");\n${source}`,
  ],
  [
    "reviewed manifest rejects a dynamic TypeScript import with options",
    (source) => `const alternateTypescript = await import("typescript", { with: { type: "json" } });\n${source}`,
  ],
  [
    "reviewed manifest rejects a second direct TypeScript loader call",
    (source) => source.replace(
      "let typescriptDependency = null;",
      'const alternateTypescript = requireDependency("typescript");\nlet typescriptDependency = null;',
    ),
  ],
]) {
  await check(name, async () => {
    const manifestPath = "scripts/launch-operations-kernel/manifest.mjs";
    const original = candidateSources.get(manifestPath);
    const mutated = mutate(original);
    assert.notEqual(mutated, original);
    const sources = new Map(candidateSources);
    sources.set(manifestPath, mutated);
    assert.throws(
      () => validateResealedCandidateSources(sources, [manifestPath]),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  });
}

for (const [name, mutate] of [
  [
    "reviewed loader result cannot escape through an existing export property",
    (source) => source.replace(
      "    typescriptDependency = loaded;",
      "    (readStrictJsonFile.parser = loaded, typescriptDependency = readStrictJsonFile.parser);",
    ),
  ],
  [
    "reviewed parser package binding cannot escape through an existing export",
    (source) => source.replace(
      "  const ts = loadTypescriptDependency();",
      "  const ts = loadTypescriptDependency();\n  readStrictJsonFile.parser = ts;",
    ),
  ],
  [
    "reviewed parser result cannot carry the package binding",
    (source) => source.replace(
      "    moduleSpecifiers,\n    network,",
      "    moduleSpecifiers: Object.assign(moduleSpecifiers, { parser: ts }),\n    network,",
    ),
  ],
  [
    "reviewed parser package exposes only approved syntax members",
    (source) => source.replace(
      "  const ts = loadTypescriptDependency();",
      "  const ts = loadTypescriptDependency();\n  void ts.sys;",
    ),
  ],
  [
    "reviewed parser AST cannot escape through module state",
    (source) => source
      .replace(
        "function sourceSyntaxFacts(relativePath, source) {",
        "let parserSyntaxEscape = null;\n\nfunction sourceSyntaxFacts(relativePath, source) {",
      )
      .replace(
        "  if (sourceFile.parseDiagnostics.some(",
        "  parserSyntaxEscape = sourceFile;\n  if (sourceFile.parseDiagnostics.some(",
      ),
  ],
  [
    "reviewed parser AST cannot occupy a returned boolean fact",
    (source) => source.replace(
      "  visit(sourceFile);",
      "  visit(sourceFile);\n  environment = sourceFile.statements[0];",
    ),
  ],
  [
    "reviewed parser cannot be reached through an existing export",
    (source) => source.replace(
      "export function readStrictJsonFile(filePath) {",
      [
        "export function readStrictJsonFile(filePath) {",
        '  if (filePath === "__SOURCE_POLICY_TEST__") {',
        '    return sourceSyntaxFacts("source-policy-test.mjs", "export const value = true;");',
        "  }",
      ].join("\n"),
    ),
  ],
]) {
  await check(name, async () => {
    const manifestPath = "scripts/launch-operations-kernel/manifest.mjs";
    const original = candidateSources.get(manifestPath);
    const mutated = mutate(original);
    assert.notEqual(mutated, original);
    const sources = new Map(candidateSources);
    sources.set(manifestPath, mutated);
    assert.throws(
      () => validateResealedCandidateSources(sources, [manifestPath]),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  });
}

for (const [name, mutate] of [
  [
    "reviewed parser confinement failure cannot be downgraded before return",
    (source) => source
      .replace(
        "  const moduleLoaderPolicyViolation =\n",
        "  let moduleLoaderPolicyViolation =\n",
      )
      .replace(
        "  return {\n    environment,",
        "  moduleLoaderPolicyViolation = false;\n  return {\n    environment,",
      ),
  ],
  [
    "reviewed source capability consumer cannot ignore network fact",
    (source) => source.replace(
      "    network: syntax.network,",
      "    network: false,",
    ),
  ],
  [
    "reviewed source capability consumer cannot ignore environment fact",
    (source) => source.replace(
      "    environment: syntax.environment,",
      "    environment: false,",
    ),
  ],
  [
    "reviewed source capability consumer cannot ignore filesystem fact",
    (source) => source.replace(
      "    filesystem_mutation: syntax.filesystemMutation || filesystemModule,",
      "    filesystem_mutation: filesystemModule,",
    ),
  ],
  [
    "reviewed source capability consumer cannot ignore runtime construction",
    (source) => source.replace(
      "      syntax.runtimeCodeConstruction ||\n      unresolvedMemberContextMismatch,",
      "      unresolvedMemberContextMismatch,",
    ),
  ],
  [
    "reviewed source capability consumer cannot ignore module loader violation",
    (source) => source.replace(
      "      syntax.moduleLoaderPolicyViolation ||\n      syntax.runtimeCodeConstruction ||",
      "      syntax.runtimeCodeConstruction ||",
    ),
  ],
  [
    "reviewed source capability consumer cannot ignore unresolved context",
    (source) => source.replace(
      "      syntax.runtimeCodeConstruction ||\n      unresolvedMemberContextMismatch,",
      "      syntax.runtimeCodeConstruction ||\n      false,",
    ),
  ],
  [
    "reviewed local import consumer cannot drop module specifiers",
    (source) => source.replace(
      "  for (const entry of syntax.moduleSpecifiers) {",
      "  for (const entry of []) {",
    ),
  ],
  [
    "reviewed syntax facts must be obtained unconditionally",
    (source) => source.replace(
      "  const syntax = sourceSyntaxFacts(relativePath, source);\n  const targets = new Set();",
      [
        "  const syntax = relativePath.length > 0",
        "    ? sourceSyntaxFacts(relativePath, source)",
        "    : null;",
        "  const targets = new Set();",
      ].join("\n"),
    ),
  ],
  [
    "reviewed parser rejects a wrapped outer callee",
    (source) => source
      .replace(
        "function sourceSyntaxFacts(relativePath, source) {",
        [
          "const parserOuterSentinel = (value) => value;",
          "",
          "function sourceSyntaxFacts(relativePath, source) {",
        ].join("\n"),
      )
      .replace(
        "  if (sourceFile.parseDiagnostics.some(",
        "  (parserOuterSentinel)(sourceFile.statements[0]);\n  if (sourceFile.parseDiagnostics.some(",
      ),
  ],
  [
    "reviewed parser rejects lexical shadow authorization of an outer callee",
    (source) => source
      .replace(
        "function sourceSyntaxFacts(relativePath, source) {",
        [
          "const parserOuterSentinel = (value) => value;",
          "",
          "function sourceSyntaxFacts(relativePath, source) {",
        ].join("\n"),
      )
      .replace(
        "  const ts = loadTypescriptDependency();",
        [
          "  const ts = loadTypescriptDependency();",
          "  {",
          "    function parserOuterSentinel(value) { return value; }",
          "    void parserOuterSentinel;",
          "  }",
          "  parserOuterSentinel(sourceFile.statements[0]);",
        ].join("\n"),
      ),
  ],
]) {
  await check(name, async () => {
    const manifestPath = "scripts/launch-operations-kernel/manifest.mjs";
    const original = candidateSources.get(manifestPath);
    const mutated = mutate(original);
    assert.notEqual(mutated, original);
    const sources = new Map(candidateSources);
    sources.set(manifestPath, mutated);
    assert.throws(
      () => validateResealedCandidateSources(sources, [manifestPath]),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  });
}

await check("concrete runner identity verification remains attested", async () => {
  const runnerPath =
    "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs";
  const original = candidateSources.get(runnerPath);
  const mutated = original.replace(
    'sourcePolicyMode: "ATTESTED_BY_REVIEWED_IDENTITY",',
    'sourcePolicyMode: "VALIDATE",',
  );
  assert.notEqual(mutated, original);
  const sources = new Map(candidateSources);
  sources.set(runnerPath, mutated);
  assert.throws(
    () => validateResealedCandidateSources(sources, [runnerPath]),
    (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
  );
});

for (const [name, acquisition] of [
  [
    "concrete runner rejects a dot-segment manifest static import",
    'import * as alternateManifestReview from "././manifest.mjs";\nvoid alternateManifestReview;',
  ],
  [
    "concrete runner rejects a parent-canceling manifest re-export",
    'export * from "./review-only/../manifest.mjs";',
  ],
  [
    "concrete runner rejects a dot-segment manifest dynamic import",
    'void import("././manifest.mjs");',
  ],
  [
    "concrete runner rejects a dot-segment manifest dynamic import with options",
    'void import("./review-only/../manifest.mjs", {});',
  ],
]) {
  await check(name, async () => {
    const runnerPath =
      "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs";
    const original = candidateSources.get(runnerPath);
    const mutated = [acquisition, original].join("\n");
    assert.notEqual(mutated, original);
    const sources = new Map(candidateSources);
    sources.set(runnerPath, mutated);
    assert.throws(
      () => validateExplicitSemanticResealedCandidateSources(
        sources,
        [runnerPath],
      ),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  });
}

for (const [name, mutate] of [
  [
    "concrete runner rejects an alternate manifest module acquisition",
    (source) => [
      'import * as alternateManifestReview from "./manifest.mjs?alternate";',
      "void alternateManifestReview;",
      source,
    ].join("\n"),
  ],
  [
    "concrete runner identity verification failures must propagate",
    (source) => source.replace(
      [
        "  const verification = verifyRepositoryCandidateManifest({",
        "    repositoryRoot,",
        "    manifestPath,",
        '    sourcePolicyMode: "ATTESTED_BY_REVIEWED_IDENTITY",',
        "  });",
        "  const identities = deriveIdentityReport({",
        "    repositoryRoot,",
        "    manifestPath,",
        '    sourcePolicyMode: "ATTESTED_BY_REVIEWED_IDENTITY",',
        "  });",
      ].join("\n"),
      [
        "  let verification;",
        "  let identities;",
        "  try {",
        "    verification = verifyRepositoryCandidateManifest({",
        "      repositoryRoot,",
        "      manifestPath,",
        '      sourcePolicyMode: "ATTESTED_BY_REVIEWED_IDENTITY",',
        "    });",
        "    identities = deriveIdentityReport({",
        "      repositoryRoot,",
        "      manifestPath,",
        '      sourcePolicyMode: "ATTESTED_BY_REVIEWED_IDENTITY",',
        "    });",
        "  } catch {",
        "    verification = { verified: true };",
        '    identities = { manifest_sha256: "0".repeat(64) };',
        "  }",
      ].join("\n"),
    ),
  ],
  [
    "concrete runner candidate report cannot override verified identity",
    (source) => source.replace(
      "    ...verification,\n    manifest_sha256:",
      "    ...verification,\n    verified: true,\n    manifest_sha256:",
    ),
  ],
]) {
  await check(name, async () => {
    const runnerPath =
      "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs";
    const original = candidateSources.get(runnerPath);
    const mutated = mutate(original);
    assert.notEqual(mutated, original);
    const sources = new Map(candidateSources);
    sources.set(runnerPath, mutated);
    assert.throws(
      () => validateResealedCandidateSources(sources, [runnerPath]),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  });
}

await check("attested verifier branch cannot invoke source validation", async () => {
  const manifestPath = "scripts/launch-operations-kernel/manifest.mjs";
  const original = candidateSources.get(manifestPath);
  const mutated = original.replace(
    '  if (sourcePolicyMode === "VALIDATE") {',
    '  if (["VALIDATE", "ATTESTED_BY_REVIEWED_IDENTITY"].includes(sourcePolicyMode)) {',
  );
  assert.notEqual(mutated, original);
  const sources = new Map(candidateSources);
  sources.set(manifestPath, mutated);
  assert.throws(
    () => validateResealedCandidateSources(sources, [manifestPath]),
    (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
  );
});

for (const [name, source] of [
  [
    "node builtin family subpath rejected",
    'import { resolve as lookup } from "node:dns/promises";\nexport const resolveName = lookup;\n',
  ],
  [
    "unreviewed inspector builtin rejected",
    'import inspector from "node:inspector";\nexport const client = inspector;\n',
  ],
  [
    "unreviewed runtime builtin rejected",
    'import { WASI as Runtime } from "node:wasi";\nexport const runtime = Runtime;\n',
  ],
  [
    "unknown future node builtin rejected",
    'import futureCapability from "node:future-capability";\nexport const value = futureCapability;\n',
  ],
]) {
  await check(name, async () => {
    assert.throws(
      () => validateLocalOnlySources(new Map([["scripts/mutant.mjs", source]])),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  });
}

const concreteSources = Object.fromEntries([
  "runner",
  "adapters",
  "live-platform",
  "checkpoint-store",
].map((name) => [
  name,
  readFileSync(
    path.join(
      ROOT,
      `scripts/launch-operations-kernel/nonproduction-qualification-${name}.mjs`,
    ),
    "utf8",
  ),
]));

await check("exact legacy signal-zero liveness probe remains reviewed", async () => {
  assert.equal(
    validateCandidateSources(candidateSources).verified,
    true,
  );
});

for (const [name, mutate] of [
  [
    "legacy nonzero process signal rejected",
    (source) => source.replace("process.kill(pid, 0)", "process.kill(pid, 9)"),
  ],
  [
    "legacy computed process signal rejected",
    (source) => source.replace(
      "process.kill(pid, 0)",
      'process["kill"](pid, 0)',
    ),
  ],
]) {
  await check(name, async () => {
    const source = mutate(readFileSync(
      path.join(ROOT, "scripts/launch-operations-kernel/legacy-classifier.mjs"),
      "utf8",
    ));
    const sources = new Map(candidateSources);
    sources.set(
      "scripts/launch-operations-kernel/legacy-classifier.mjs",
      source,
    );
    assert.throws(
      () => validateCandidateSources(sources),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  });
}

for (const [name, mutate] of [
  [
    "second live entrypoint rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/second-runner.mjs",
      concreteSources.runner,
    ),
  ],
  [
    "thin delegated live entrypoint rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/delegated-runner.mjs",
      [
        'import { dispatchConcreteQualificationRunner } from "./nonproduction-qualification-runner.mjs";',
        "await dispatchConcreteQualificationRunner(process.argv.slice(2));",
        "",
      ].join("\n"),
    ),
  ],
  [
    "privileged runner re-export rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/reexported-runner.mjs",
      'export { dispatchConcreteQualificationRunner } from "./nonproduction-qualification-runner.mjs";\n',
    ),
  ],
  [
    "dynamic privileged runner alias rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/dynamic-runner.mjs",
      'await import("./nonproduction-qualification-runner.mjs?delegated");\n',
    ),
  ],
  [
    "whitespace-free privileged runner import rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/minified-runner.mjs",
      [
        'import{dispatchConcreteQualificationRunner}from"./nonproduction-qualification-runner.mjs";',
        "await dispatchConcreteQualificationRunner(process.argv.slice(2));",
        "",
      ].join("\n"),
    ),
  ],
  [
    "privileged namespace re-export rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/namespace-runner.mjs",
      'export * as live from "./nonproduction-qualification-runner.mjs";\n',
    ),
  ],
  [
    "dynamic privileged import options rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/options-runner.mjs",
      'await import("./nonproduction-qualification-runner.mjs", { with: { type: "javascript" } });\n',
    ),
  ],
  [
    "percent-encoded privileged runner import rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/encoded-runner.mjs",
      [
        'import { dispatchConcreteQualificationRunner } from "./nonproduction%2Dqualification%2Drunner.mjs";',
        "await dispatchConcreteQualificationRunner(process.argv.slice(2));",
        "",
      ].join("\n"),
    ),
  ],
  [
    "percent-encoded letter privileged re-export rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/encoded-reexport.mjs",
      'export { dispatchConcreteQualificationRunner } from "./nonproduction-qualification-%72unner.mjs";\n',
    ),
  ],
  [
    "percent-encoded privileged dynamic import options rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/encoded-dynamic-runner.mjs",
      'await import("./nonproduction%2dqualification%2drunner.mjs?delegated", { with: { type: "javascript" } });\n',
    ),
  ],
  [
    "uppercase privileged runner import rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/uppercase-runner.mjs",
      [
        'import { createConcreteRunnerDependencies, dispatchConcreteQualificationRunner } from "./NONPRODUCTION-QUALIFICATION-RUNNER.mjs";',
        'await dispatchConcreteQualificationRunner(["--qualify-nonproduction", "--authorization", "/absolute/operator-authorization.json"], createConcreteRunnerDependencies());',
        "",
      ].join("\n"),
    ),
  ],
  [
    "mixed-case privileged adapter re-export rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/case-adapter.mjs",
      'export * from "./Nonproduction-Qualification-Adapters.mjs";\n',
    ),
  ],
  [
    "uppercase privileged platform dynamic import rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/case-platform.mjs",
      'await import("./NONPRODUCTION-QUALIFICATION-LIVE-PLATFORM.mjs?delegated", { with: { type: "javascript" } });\n',
    ),
  ],
  [
    "uppercase privileged checkpoint re-export rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/case-checkpoint.mjs",
      'export * from "./NONPRODUCTION-QUALIFICATION-CHECKPOINT-STORE.mjs";\n',
    ),
  ],
  [
    "backslash privileged runner import rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/backslash-runner.mjs",
      'export * from "./x\\\\../nonproduction-qualification-runner.mjs";\n',
    ),
  ],
  [
    "mixed-separator privileged adapter import rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/backslash-adapter.mjs",
      'await import("./nested\\\\../nonproduction-qualification-adapters.mjs?delegated");\n',
    ),
  ],
  [
    "backslash privileged platform import options rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/backslash-platform.mjs",
      'await import(`./nested\\\\../nonproduction-qualification-live-platform.mjs`, { with: { type: "javascript" } });\n',
    ),
  ],
  [
    "unresolved relative import rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/unresolved-relative.mjs",
      'export * from "./not-a-candidate-member.mjs";\n',
    ),
  ],
  [
    "outside-root relative import rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/outside-relative.mjs",
      'export * from "../../outside-candidate.mjs";\n',
    ),
  ],
  [
    "case-variant approved importer cannot hide transitive privilege",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/case-transitive.mjs",
      'export * from "./NONPRODUCTION-QUALIFICATION-RUNNER.TEST.MJS";\n',
    ),
  ],
  [
    "runtime-key helper imported before runner gate rejected",
    (sources) => {
      sources.set(
        "scripts/launch-operations-kernel/runtime-key-helper.mjs",
        'const key = ["con", "structor"].join("");\nexport const build = (async () => {})[key];\n',
      );
      sources.set(
        "scripts/launch-operations-kernel/runtime-key-wrapper.mjs",
        'import { build } from "./runtime-key-helper.mjs";\nawait build(\'return fetch("https://example.com")\')();\n',
      );
    },
  ],
  [
    "malformed percent escape import rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/malformed-encoded-runner.mjs",
      'await import("./nonproduction%ZZqualification-runner.mjs");\n',
    ),
  ],
  [
    "percent-encoded separator import rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/encoded-separator-runner.mjs",
      'await import("./nested%2Fnonproduction-qualification-runner.mjs");\n',
    ),
  ],
  [
    "percent-encoded dot traversal import rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/encoded-dot-runner.mjs",
      'await import("./%2e%2e/launch-operations-kernel/nonproduction-qualification-runner.mjs");\n',
    ),
  ],
  [
    "computed privileged dynamic import rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/computed-runner.mjs",
      'await import("./nonproduction-qualification-" + "runner.mjs");\n',
    ),
  ],
  [
    "privileged platform delegation outside the reviewed graph rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/delegated-platform.mjs",
      [
        'import { createConcreteLivePlatform } from "./nonproduction-qualification-live-platform.mjs";',
        "export const delegate = createConcreteLivePlatform;",
        "",
      ].join("\n"),
    ),
  ],
  [
    "transitive delegation through an approved test importer rejected",
    (sources) => {
      sources.set(
        "scripts/launch-operations-kernel/nonproduction-qualification-runner.test.mjs",
        readFileSync(
          path.join(
            ROOT,
            "scripts/launch-operations-kernel/nonproduction-qualification-runner.test.mjs",
          ),
          "utf8",
        ),
      );
      sources.set(
        "scripts/launch-operations-kernel/delegated-via-test.mjs",
        'import "./nonproduction-qualification-runner.test.mjs";\n',
      );
    },
  ],
  [
    "ambient credential lookup outside loader rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs",
      `${concreteSources.runner}\nexport const leaked = ${["process", ".", "env"].join("")}.SECRET;\n`,
    ),
  ],
  [
    "ambient credential lookup inside adapter rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/nonproduction-qualification-adapters.mjs",
      `${concreteSources.adapters}\nexport const leaked = ${["process", ".", "env"].join("")}.SECRET;\n`,
    ),
  ],
  [
    "credential loader write-open authority rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/nonproduction-qualification-credential-loader.mjs",
      sources.get(
        "scripts/launch-operations-kernel/nonproduction-qualification-credential-loader.mjs",
      ).replace("constants.O_RDONLY", "constants.O_WRONLY"),
    ),
  ],
  [
    "network primitive outside platform rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/nonproduction-qualification-adapters.mjs",
      `${concreteSources.adapters}\nexport const widened = () => ${"fet" + "ch"}(\"https://example.com\");\n`,
    ),
  ],
  [
    "filesystem mutation outside checkpoint store rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.mjs",
      `${concreteSources["live-platform"]}\n${"write" + "FileSync"}(\"x\", \"y\");\n`,
    ),
  ],
  [
    "hard-link mutation outside checkpoint store rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.mjs",
      `${concreteSources["live-platform"]}\nlinkSync("x", "y");\n`,
    ),
  ],
  [
    "write-open mutation outside checkpoint store rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.mjs",
      `${concreteSources["live-platform"]}\nopenSync("x", "w");\n`,
    ),
  ],
  [
    "child process outside runner and platform rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/nonproduction-qualification-checkpoint-store.mjs",
      `${concreteSources["checkpoint-store"]}\nimport { spawnSync } from \"node:${"child" + "_" + "process"}\";\n`,
    ),
  ],
  [
    "elevated live mode rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs",
      concreteSources.runner.replace(
        "--qualify-nonproduction",
        "--official-runtime",
      ),
    ),
  ],
  [
    "legacy runtime import on live surface rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.mjs",
      `${concreteSources["live-platform"]}\nimport \"../../testing/${"admin-v1-staging-runtime-" + "orchestrator.mjs"}\";\n`,
    ),
  ],
  [
    "broad Git staging capability rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.mjs",
      `${concreteSources["live-platform"]}\nexport const forbiddenGit = [\"add\", \"-A\"];\n`,
    ),
  ],
  [
    "missing Git create lease rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.mjs",
      concreteSources["live-platform"].replace(
        "`--force-with-lease=${expectedRef}:`",
        '"--porcelain"',
      ),
    ),
  ],
  [
    "wrong Git delete lease rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.mjs",
      concreteSources["live-platform"].replace(
        "`--force-with-lease=${expectedRef}:${commit_sha}`",
        '"--force-with-lease=refs/heads/unrelated:deadbeef"',
      ),
    ),
  ],
  [
    "mutable Git remote alias rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.mjs",
      concreteSources["live-platform"].replace(
        "`https://github.com/${authorization.repository.remote_repository}.git`",
        '"origin"',
      ),
    ),
  ],
  [
    "Supabase target guard removal rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/nonproduction-qualification-adapters.mjs",
      concreteSources.adapters.replace(
        "CONCRETE_CREDENTIAL_TARGET_MISMATCH",
        "CONCRETE_CREDENTIAL_MISSING",
      ),
    ),
  ],
  [
    "second checkpoint child process rejected",
    (sources) => sources.set(
      "scripts/launch-operations-kernel/nonproduction-qualification-checkpoint-store.mjs",
      `${concreteSources["checkpoint-store"]}\nspawn("/usr/bin/true", []);\n`,
    ),
  ],
]) {
  await check(name, async () => {
    const sources = new Map(candidateSources);
    mutate(sources);
    assert.throws(
      () => validateCandidateSources(sources),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  });
}

for (const [name, source] of [
  ["legacy qualification call rejected", "export const run = () => qualifyLegacy();\n"],
  [
    "pattern-only cleanup authority rejected",
    "export const run = (pattern) => cleanupByPattern(pattern);\n",
  ],
  [
    "Official authority rejected",
    'export const authority = { authorization_class: "OFFICIAL_RUNTIME" };\n',
  ],
  [
    "Production authority rejected",
    'export const authority = { operation_class: "PRODUCTION" };\n',
  ],
  [
    "public authority rejected",
    'export const authority = { operation_class: "PUBLIC" };\n',
  ],
  [
    "silent freeze bypass rejected",
    "export const skipLegacyFreezeClosure = () => true;\n",
  ],
  [
    "credential surface rejected",
    "export const value = " + "process" + ".env.ADMIN_SECRET;\n",
  ],
]) {
  await check(name, async () => {
    assert.throws(
      () =>
        validateActivationBridgeSources(
          new Map([["scripts/launch-operations-kernel/mutant.mjs", source]]),
        ),
      (error) => error?.code === "ACTIVATION_SOURCE_POLICY",
    );
  });
}

await check("actual candidate source policy", async () => {
  const result = verifyRepositoryCandidateManifest({
    repositoryRoot: ROOT,
    manifestPath: MANIFEST_PATH,
  });
  assert.equal(result.source_policy_verified, true);
  assert.equal(result.legacy_imports, 0);
  assert.equal(result.live_routes, 4);
  assert.equal(result.live_entrypoints, 4);
});

await check("legacy and live CLI modes denied", async () => {
  const output = [];
  let classifierCalls = 0;
  const result = await dispatchCli(["recover-legacy"], {
    repositoryRoot: ROOT,
    writeOutput(value) {
      output.push(value);
    },
    loadLegacySnapshot() {
      classifierCalls += 1;
      throw new Error("must not run");
    },
  });
  assert.equal(result.exit_code, 1);
  assert.equal(result.code, "KERNEL_CLI_MODE_DENIED");
  assert.equal(classifierCalls, 0);
  assert.deepEqual(output, []);
  assert.deepEqual(CLI_MODES, [
    "classify-current-legacy",
    "derive-identities",
    "static-readiness",
    "verify-candidate",
  ]);
});

await check("CF18 expiry and read-only authorization guards survive explicit resealing", async () => {
  const prefix = "scripts/launch-operations-kernel/admin-v1-official-first-environment-";
  for (const [suffix, before, after] of [
    ["runtime.mjs", "if (now >= expires)", "if (now > expires)"],
    ["runtime.mjs", "now_epoch_ms : Date.now()", "now_epoch_ms : 0"],
    ["runtime.mjs", "sensitive = await load_sensitive();\n      guard();", "sensitive = await load_sensitive();"],
    ["runtime.mjs", 'state.stage = "AUTHORIZATION_SPENT";\n    await journal.publish(publicState(state));\n    guard();',
      'state.stage = "AUTHORIZATION_SPENT";\n    await journal.publish(publicState(state));'],
    ["live-platform.mjs", "guard();\n      let response;", "let response;"],
    ["live-platform.mjs", "guard();\n      let response;", "guard();\n      await Promise.resolve();\n      let response;"],
    ["supervisor.mjs", "await dependencies.prepare_provider_auth(authorization);\n          guard();",
      "await dependencies.prepare_provider_auth(authorization);"],
    ["keychain-supervisor-launcher.mjs", "guard();\n    spendInvocation(parsed, dependencies);",
      "spendInvocation(parsed, dependencies);"],
    ["keychain-supervisor-launcher.mjs", "guard();\n    const child = spawnProcess(",
      "const child = spawnProcess("],
    ["keychain-supervisor-launcher.mjs", "constants.O_RDONLY | constants.O_NOFOLLOW",
      "constants.O_WRONLY | constants.O_NOFOLLOW"],
  ]) {
    const relativePath = prefix + suffix;
    const sources = new Map(candidateSources);
    const original = sources.get(relativePath);
    assert.equal(original.split(before).length, 2);
    sources.set(relativePath, original.replace(before, after));
    assert.throws(
      () => validateExplicitSemanticResealedCandidateSources(sources, [relativePath]),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  }
});

await check("v2 receipt descriptor attestation confines exact reflection to its reviewed runner function", async () => {
  const runnerPath = "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs";
  const runner = candidateSources.get(runnerPath);
  const start = runner.indexOf("function exactOfficialRetentionReceipt(receipt, authorization) {");
  const finish = runner.indexOf("\n}\n\nexport function classifyAdminV1OfficialPriorJournal", start) + 2;
  const region = runner.slice(start, finish);
  assert(start >= 0 && finish > start);
  assert.equal(createHash("sha256").update(region).digest("hex"), "3924dc9e8ad16b1fc58cd3107bf67cb707f6be88733c3e909868fb92f368be37");
  const copiedPath = "scripts/launch-operations-kernel/receipt-descriptor-fixture.mjs";
  assert.throws(() => validateLocalOnlySources(new Map([[copiedPath, region]])),
    (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  for (const mutated of [runner + "\nconst extraReceiptReflection = Object.getOwnPropertyDescriptors({});\n",
    runner.replace('receipt.phase === "COMPLETE"', 'receipt.phase === "COMMITTED"')]) {
    assert.notEqual(mutated, runner);
    const sources = new Map(candidateSources);sources.set(runnerPath, mutated);
    assert.throws(() => validateExplicitSemanticResealedCandidateSources(sources, [runnerPath]),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  }
});

await check("v2 preflight descriptor attestation confines exact observation reflection", async () => {
  const platformPath = "scripts/launch-operations-kernel/admin-v1-official-live-platform.mjs";
  const platform = candidateSources.get(platformPath);
  const start = platform.indexOf("    const observationValid = isolated");
  const finish = platform.indexOf("\n    if (\n      !observationValid ||", start);
  const region = platform.slice(start, finish);
  assert(start >= 0 && finish > start);
  assert.equal(createHash("sha256").update(region).digest("hex"), "4dfcfcd6b4ec03caf05016115068faf5771eec116a5d6651c0fd8e1ad3604026");
  const copiedPath = "scripts/launch-operations-kernel/preflight-descriptor-fixture.mjs";
  assert.throws(() => validateLocalOnlySources(new Map([[copiedPath, region]])),
    (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  for (const mutated of [platform + "\nconst extraObservationReflection = Object.getOwnPropertyDescriptors({});\n",
    platform.replace("observation.bundle_run_id === authorization.run_id", "observation.bundle_run_id !== authorization.run_id")]) {
    assert.notEqual(mutated, platform);
    const sources = new Map(candidateSources);sources.set(platformPath, mutated);
    assert.throws(() => validateExplicitSemanticResealedCandidateSources(sources, [platformPath]),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  }
});

if (failures.length > 0) {
  console.log(
    `FAIL_LAUNCH_OPERATIONS_SOURCE_POLICY assertions=${assertions} mutations=169 failures=${failures.length} failed=${failures.join(",")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `PASS_LAUNCH_OPERATIONS_SOURCE_POLICY assertions=${assertions} mutations=169 network=0 live_routes=4 legacy_imports=0 failures=0 internal_failures=0`,
  );
}
