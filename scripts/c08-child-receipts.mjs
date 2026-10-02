// Pure C08 receipt and fixture-policy validation. No I/O or process effects.
export const RECEIPT_LIMITS = Object.freeze({ row: 768, frame: 114688, rows: 138, stream: 33554432, record: 4096, report: 8192 });
const encoder = new TextEncoder();
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const obj = (o) => o !== null && typeof o === "object" && !Array.isArray(o);
const integer = Number.isSafeInteger;
const keys = (o, names) => obj(o) && Object.keys(o).sort().join("\0") === [...names].sort().join("\0");
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const signals = ["SIGTERM", "SIGKILL", "SIGABRT", "SIGSEGV", "SIGINT", "SIGPIPE", "UNKNOWN"];
const codes = ["EACCES", "EPERM", "ENOENT", "ENOBUFS", "ETIMEDOUT", "EIO", "OTHER"];
const captures = ["API_RETURN_ONLY", "PARTIAL", "TRUNCATED", "OVERFLOW", "SHUTDOWN_UNCONFIRMED", "UNKNOWN"];
const reasons = ["RESULT_INVALID", "STATUS_INVALID", "STATUS_NONZERO", "SIGNAL_MISSING", "SIGNAL_PRESENT", "PID_INVALID", "API_THROWN", "API_ERROR", "STREAM_INVALID", "ENCODING_UNCERTAIN", "CAPTURE_OVERFLOW", "CAPTURE_INVALID", "CAPTURE_PARTIAL", "CAPTURE_TRUNCATED", "CAPTURE_SHUTDOWN_UNCONFIRMED", "STDERR_NONEMPTY", "BLOB_INVALID"];
const ROW = ["o", "op", "role", "plan", "status", "signal", "pid", "out", "err", "error", "capture", "diag", "reasons", "clean", "lifecycle", "origin"];
const ENV = ["v", "binding", "origin", "plan", "plan_kind", "rows", "attempted", "expected", "acknowledged", "complete", "failure", "precall", "native", "ready"];
function wellFormed(s) {
  if (typeof s !== "string") return false;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) { const d = s.charCodeAt(++i); if (!(d >= 0xdc00 && d <= 0xdfff)) return false; }
    else if (c >= 0xdc00 && c <= 0xdfff) return false;
  }
  return true;
}
export function encodedBytes(s) {
  if (!wellFormed(s)) throw new Error("ENCODING_UNCERTAIN");
  return encoder.encode(s).length;
}
// Parse the encoded representation directly: JSON.parse alone loses duplicate keys
// and the distinction between integer and exponent/fraction tokens.
export function parseReceiptJSON(wire, cap = RECEIPT_LIMITS.frame) {
  let text;
  if (typeof wire === "string") text = wire;
  else if (wire instanceof Uint8Array) {
    if (wire.byteLength > cap) throw new Error("WIRE_CAP");
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(wire);
  }
  else throw new Error("WIRE_TYPE");
  if (encodedBytes(text) > cap) throw new Error("WIRE_CAP");
  let i = 0;
  const fail = () => { throw new Error("WIRE_INVALID"); };
  const space = () => { while (/[\t\n\r ]/.test(text[i] || "\0")) i++; };
  function string() {
    const start = i++;
    while (i < text.length) {
      const c = text[i++];
      if (c === '"') {
        let s; try { s = JSON.parse(text.slice(start, i)); } catch { fail(); }
        if (!wellFormed(s)) fail();
        return s;
      }
      if (c === "\\") i++;
      else if (c.charCodeAt(0) < 32) fail();
    }
    fail();
  }
  function value(depth = 0) {
    if (depth > 24) fail();
    space();
    if (text[i] === '"') return string();
    if (text[i] === "{") {
      i++; space(); const out = Object.create(null); const seen = new Set();
      if (text[i] === "}") { i++; return out; }
      while (i < text.length) {
        space(); if (text[i] !== '"') fail();
        const k = string(); if (seen.has(k)) fail(); seen.add(k);
        space(); if (text[i++] !== ":") fail();
        out[k] = value(depth + 1); space();
        if (text[i] === "}") { i++; return out; }
        if (text[i++] !== ",") fail();
      }
      fail();
    }
    if (text[i] === "[") {
      i++; space(); const out = [];
      if (text[i] === "]") { i++; return out; }
      while (i < text.length) {
        out.push(value(depth + 1)); space();
        if (text[i] === "]") { i++; return out; }
        if (text[i++] !== ",") fail();
      }
      fail();
    }
    for (const [literal, result] of [["true", true], ["false", false], ["null", null]]) {
      if (text.slice(i, i + literal.length) === literal) { i += literal.length; return result; }
    }
    const match = /^-?(?:0|[1-9][0-9]*)/.exec(text.slice(i));
    if (!match) fail();
    i += match[0].length;
    if (/[.eE0-9]/.test(text[i] || " ")) fail();
    const n = Number(match[0]); if (!integer(n) || Object.is(n, -0)) fail();
    return n;
  }
  const result = value(); space(); if (i !== text.length) fail(); return result;
}
export function validateTrustedPlan(plan, expectedPlan) {
  if (!keys(plan, ["id", "kind", "slots"]) || !keys(expectedPlan, ["id", "kind", "slots"])) return false;
  if (typeof plan.id !== "string" || !/^[A-Za-z0-9_.:-]{1,128}$/.test(plan.id) || !Array.isArray(plan.slots) || !plan.slots.length || plan.slots.length > 138) return false;
  let n;
  if (plan.kind === "UNIT_SINGLE") { if (plan.slots.length !== 1) return false; n = 1; }
  else if (["UNIT_PAIRED", "C08_TWO_PASS"].includes(plan.kind)) {
    if (plan.slots.length % 2) return false; n = plan.slots.length / 2;
    if (plan.kind === "C08_TWO_PASS" ? n !== 69 : n < 1 || n >= 69) return false;
  } else return false;
  const operands = new Set();
  for (let j = 0; j < plan.slots.length; j++) {
    const slot = plan.slots[j];
    if (!keys(slot, ["ordinal", "role", "operand"]) || !integer(slot.ordinal) || slot.ordinal !== j + 1 ||
        slot.role !== `P${j < n ? 1 : 2}_${String(j % n).padStart(2, "0")}` ||
        typeof slot.operand !== "string" || !slot.operand || slot.operand.length > 512 || !wellFormed(slot.operand)) return false;
    if (j < n) { if (operands.has(slot.operand)) return false; operands.add(slot.operand); }
    else if (slot.operand !== plan.slots[j - n].operand) return false;
  }
  return plan.id === expectedPlan.id && plan.kind === expectedPlan.kind &&
    Array.isArray(expectedPlan.slots) && expectedPlan.slots.length === plan.slots.length &&
    plan.slots.every((s, j) => keys(expectedPlan.slots[j], ["ordinal", "role", "operand"]) &&
      ["ordinal", "role", "operand"].every((k) => s[k] === expectedPlan.slots[j][k]));
}
function stream(s) {
  if (!Array.isArray(s) || s.length !== 4) return false;
  const [kind, n, state, basis] = s;
  if (["ABSENT", "NULL", "WRONG_TYPE"].includes(kind)) return n === null && state === "UNKNOWN" && basis === "UNKNOWN";
  if (kind !== "TEXT") return false;
  if (n === null) return state === "WITHHELD" && basis === "UNENCODABLE";
  return integer(n) && n >= 0 && n <= RECEIPT_LIMITS.stream && basis === "TEXT_REENCODED_UTF8" && state === (n === 0 ? "EMPTY" : "WITHHELD");
}
function rowValid(row, slot, plan, origin) {
  if (!keys(row, ROW) || row.o !== slot.ordinal || !integer(row.o) || row.role !== slot.role || row.plan !== plan ||
      row.op !== "HASH_OBJECT" || typeof row.clean !== "boolean" || row.origin !== origin || row.lifecycle !== "UNPROVEN") return false;
  if (row.status !== null && !integer(row.status)) return false;
  if (row.signal !== null && !signals.includes(row.signal)) return false;
  if (!Array.isArray(row.pid) || row.pid.length !== 2 || row.pid[1] !== origin ||
      (row.pid[0] !== null && (!integer(row.pid[0]) || row.pid[0] <= 0))) return false;
  if (row.error !== null && !codes.includes(row.error)) return false;
  if (!captures.includes(row.capture) || !["NONE", "WITHHELD", "PUBLIC_PERMISSION_WARNING"].includes(row.diag)) return false;
  const rs = row.reasons;
  if (!Array.isArray(rs) || rs.some((r) => !reasons.includes(r)) || new Set(rs).size !== rs.length || !stream(row.out) || !stream(row.err)) return false;
  if (encodedBytes(JSON.stringify(row)) > RECEIPT_LIMITS.row) return false;
  const [out, err] = [row.out, row.err];
  if (row.clean) return row.status === 0 && row.signal === null && row.pid[0] !== null && row.error === null && !rs.length &&
    row.capture === "API_RETURN_ONLY" && row.diag === "NONE" && same(err, ["TEXT", 0, "EMPTY", "TEXT_REENCODED_UTF8"]) &&
    out[0] === "TEXT" && integer(out[1]) && out[1] >= 40 && out[1] <= RECEIPT_LIMITS.stream && out[2] === "WITHHELD" && out[3] === "TEXT_REENCODED_UTF8";
  if (!rs.length) return false;
  const has = (r) => rs.includes(r);
  if (has("STATUS_INVALID") !== (row.status === null) || has("STATUS_NONZERO") !== (row.status !== null && row.status !== 0) ||
      has("PID_INVALID") !== (row.pid[0] === null)) return false;
  if (row.signal === null ? has("SIGNAL_MISSING") || has("SIGNAL_PRESENT") :
      row.signal === "UNKNOWN" ? !(has("SIGNAL_MISSING") || has("SIGNAL_PRESENT")) : !has("SIGNAL_PRESENT")) return false;
  if ((row.error !== null) !== (has("API_ERROR") || has("API_THROWN")) || (has("API_ERROR") && has("API_THROWN"))) return false;
  if (has("STREAM_INVALID") !== (out[0] !== "TEXT" || err[0] !== "TEXT")) return false;
  if ((out[3] === "UNENCODABLE" || err[3] === "UNENCODABLE") && !has("ENCODING_UNCERTAIN")) return false;
  if (has("STDERR_NONEMPTY") !== (err[0] === "TEXT" && err[2] === "WITHHELD")) return false;
  if (err[0] === "TEXT" && err[1] === 0 ? row.diag !== "NONE" : row.diag === "NONE") return false;
  if (row.diag === "PUBLIC_PERMISSION_WARNING" && !(err[0] === "TEXT" && integer(err[1]) && err[1] > 0)) return false;
  for (const reason of ["CAPTURE_INVALID", "CAPTURE_PARTIAL", "CAPTURE_TRUNCATED", "CAPTURE_SHUTDOWN_UNCONFIRMED"]) {
    const required = reason === "CAPTURE_INVALID" ? row.capture === "UNKNOWN" : row.capture === reason.slice(8);
    if (has(reason) !== required) return false;
  }
  if (has("CAPTURE_OVERFLOW") !== (row.capture === "OVERFLOW")) return false;
  if (has("SIGNAL_MISSING") && has("SIGNAL_PRESENT")) return false;
  if (has("RESULT_INVALID") && !(row.status === null && row.signal === "UNKNOWN" && row.pid[0] === null && out[0] === "ABSENT" && err[0] === "ABSENT")) return false;
  if ((out[0] !== "TEXT" || out[1] === null || out[1] < 40) && !has("BLOB_INVALID")) return false;
  return true;
}
export function validateReceiptEnvelope(env, trustedPlan, trustedBindings) {
  try {
    if (!obj(trustedBindings) || !validateTrustedPlan(trustedPlan, trustedBindings.expectedPlan) || !keys(env, ENV)) return false;
    const origin = trustedBindings.origin;
    if (!["SYNTHETIC", "NATIVE_API"].includes(origin) || env.origin !== origin || env.v !== 2 || !integer(env.v)) return false;
    if (!obj(trustedBindings.binding) || !Object.keys(trustedBindings.binding).length ||
        !keys(env.binding, Object.keys(trustedBindings.binding)) ||
        Object.entries(trustedBindings.binding).some(([k, v]) => typeof v !== "string" || !v || env.binding[k] !== v)) return false;
    if (env.plan !== trustedPlan.id || env.plan_kind !== trustedPlan.kind || env.ready !== false || env.native !== (origin === "NATIVE_API") || typeof env.complete !== "boolean") return false;
    for (const k of ["attempted", "expected", "acknowledged"]) if (!integer(env[k]) || env[k] < 0 || env[k] > 138) return false;
    if (env.expected !== trustedPlan.slots.length || !Array.isArray(env.rows) || env.attempted !== env.rows.length ||
        env.attempted > env.expected || env.acknowledged > env.attempted) return false;
    for (let i = 0; i < env.rows.length; i++) {
      if (!rowValid(env.rows[i], trustedPlan.slots[i], trustedPlan.id, origin) ||
          (i < env.rows.length - 1 && !env.rows[i].clean)) return false;
    }
    if (encodedBytes(JSON.stringify(env)) > RECEIPT_LIMITS.frame) return false;
    const bad = env.rows.length > 0 && !env.rows.at(-1).clean;
    if (env.complete) return !bad && env.failure === null && env.precall === null && env.attempted === env.expected && env.acknowledged === env.attempted;
    if (env.failure === "BINDING_FAILED") {
      const p = env.precall;
      return keys(p, ["kind", "ordinal", "reason"]) && p.kind === "PRECALL_REJECTED" && integer(p.ordinal) && p.ordinal === env.attempted + 1 &&
        ["PLAN_EXHAUSTED", "ROLE_MISMATCH", "OPERAND_TYPE", "OPERAND_MISMATCH"].includes(p.reason) &&
        (p.reason === "PLAN_EXHAUSTED" ? env.attempted === env.expected : env.attempted < env.expected) &&
        !bad && env.acknowledged === env.attempted;
    }
    if (env.precall !== null) return false;
    if (env.failure === "RESULT_REJECTED") return bad && env.acknowledged === env.attempted;
    if (env.failure === "SINK_FAILED") return env.attempted > 0 && env.acknowledged === env.attempted - 1;
    return env.failure === "INCOMPLETE" && !bad && env.attempted < env.expected && env.acknowledged === env.attempted;
  } catch { return false; }
}
export function consumeReceiptWire(wire, trustedPlan, trustedBindings) {
  try {
    const envelope = parseReceiptJSON(wire);
    const valid = validateReceiptEnvelope(envelope, trustedPlan, trustedBindings);
    return Object.freeze({ valid, complete: valid && envelope.complete, native: valid && envelope.native,
      independentLifecycle: "UNPROVEN", executionReady: false });
  } catch { return Object.freeze({ valid: false, complete: false, native: false, independentLifecycle: "UNPROVEN", executionReady: false }); }
}
export const RECEIPT_PREFIX = "C08_CHILD_RECEIPTS_V2 ";
export function consumeC08Output(output, trustedPlan, trustedBindings, terminalPattern) {
  if (typeof output !== "string" || !(terminalPattern instanceof RegExp)) return false;
  const framed = output.split("\n");
  if (framed.length !== 3 || framed[2] !== "") return false;
  const lines = framed.slice(0, 2);
  const frames = lines.filter((s) => s.startsWith(RECEIPT_PREFIX));
  if (frames.length !== 1 || lines.length !== 2 || lines[0] !== frames[0] || !terminalPattern.test(lines[1])) return false;
  return consumeReceiptWire(frames[0].slice(RECEIPT_PREFIX.length), trustedPlan, trustedBindings).complete;
}
// Preflight the final encoded batch, including text-content wrappers and LF.
// No record is emitted until the entire batch is admitted.
export function reportBounded(records, sink) {
  if (!Array.isArray(records) || typeof sink !== "function") throw new Error("REPORT_TYPE");
  const text = records.map((r) => JSON.stringify(r) + "\n");
  const content = text.map((t) => ({ type: "text", text: t }));
  if (content.some((c) => encodedBytes(JSON.stringify(c)) + 1 > RECEIPT_LIMITS.record) ||
      encodedBytes(JSON.stringify({ content })) + 1 > RECEIPT_LIMITS.report) throw new Error("REPORT_BUDGET");
  for (const line of text) sink(line);
}
export function selectFixturePolicy(selector, expectedRecord, independentRecord) {
  if (!["historical-overlay", "current-overlay"].includes(selector)) throw new Error("FIXTURE_SELECTOR");
  if (!keys(expectedRecord, ["lane", "members", "identity"]) || !keys(independentRecord, ["lane", "members", "identity"]) ||
      expectedRecord.lane !== selector || independentRecord.lane !== selector || !same(expectedRecord, independentRecord)) throw new Error("FIXTURE_BINDING");
  const n = selector === "historical-overlay" ? 36 : 40;
  if (!Array.isArray(expectedRecord.members) || expectedRecord.members.length !== n ||
      new Set(expectedRecord.members).size !== n || expectedRecord.members.some((x) => typeof x !== "string" || !x) ||
      typeof expectedRecord.identity !== "string" || !/^[0-9a-f]{64}$/.test(expectedRecord.identity)) throw new Error("FIXTURE_RECORD");
  if (selector === "historical-overlay" && expectedRecord.identity !== "6bb9c0ff732447dc168fed4c5bc5767b19db703a355a3bdb11fffa4c4104fbe8") throw new Error("HISTORICAL_IDENTITY");
  return Object.freeze({ lane: selector, expectedIdentity: expectedRecord.identity, members: Object.freeze([...expectedRecord.members]),
    historicalCoverage: "UNVERIFIED/NOT_RUN", currentCoverage: "NOT_RUN", broaderGate: false });
}
export function fixtureCoverageGate(requiredLane, result) {
  return obj(result) && result.effectfulVerified === true && result.lane === requiredLane &&
    result.coverage === "PASS" && result.independentlyBound === true;
}

export const C08_TERMINAL = /^PASS_READINESS_COVERAGE_MATRIX entries=69 public=[0-9]+ admin=[0-9]+ current_governance=(?:PRE_RUNTIME|POST_RUNTIME) v1_admin_staging_dependency_ready=[0-9]+ v1_admin_runtime_validated=[0-9]+ v1_admin_deferred=[0-9]+ launch_blocking=[0-9]+ unblocked=[0-9]+ gaps=[0-9]+ public_launch=NO_GO failures=0 internal_failures=0$/;
export function validateParserContract(contract, observed) {
  return keys(contract, ["path", "bytes", "sha256", "protocol", "schema", "row_cap", "frame_cap", "max_rows"]) &&
    contract.path === "scripts/c08-child-receipts.mjs" && integer(contract.bytes) && contract.bytes > 0 &&
    typeof contract.sha256 === "string" && /^[0-9a-f]{64}$/.test(contract.sha256) &&
    contract.protocol === "C08_CHILD_RECEIPTS_V2" && contract.schema === 2 &&
    contract.row_cap === 768 && contract.frame_cap === 114688 && contract.max_rows === 138 &&
    keys(observed, ["bytes", "sha256"]) && observed.bytes === contract.bytes && observed.sha256 === contract.sha256;
}
export function c08TrustedContext(matrix, contract, source) {
  if (!matrix || !Array.isArray(matrix.entries) || matrix.entries.length !== 69 ||
      !keys(source, ["producer", "caller", "matrix", "parser"]) ||
      ![source.producer, source.caller, source.matrix].every((v) => typeof v === "string" && /^[0-9a-f]{64}$/.test(v)) ||
      !validateParserContract(contract, source.parser)) throw new Error("C08_CONTEXT_BINDING");
  const operands = matrix.entries.map((e) => e.path);
  if (new Set(operands).size !== 69 || operands.some((p, i) => typeof p !== "string" || !p || (i && operands[i - 1] >= p))) throw new Error("C08_CONTEXT_PLAN");
  const plan = { id: "C08_TWO_PASS_V2", kind: "C08_TWO_PASS", slots: [1, 2].flatMap((pass) => operands.map((operand, i) => ({
    ordinal: (pass - 1) * 69 + i + 1, role: `P${pass}_${String(i).padStart(2, "0")}`, operand,
  }))) };
  const trustedBindings = { origin: "NATIVE_API", expectedPlan: JSON.parse(JSON.stringify(plan)), binding: {
    proposal: "9253d1f56fe2d9cd694bf37b12dc4c51cc1b51144aab2aea90d7ec2def2d0b26",
    model: "5b1a7a1e9f7d99ea5615f5b0872bfc7e50bb07ea06360150af4f5534c3788503",
    fixture: "db0269dde24cdeb870b991ceda9f17eecd4accdcba2adb5e55e5fcbed17bb548",
    producer: source.producer, caller: source.caller, matrix: source.matrix, parser: source.parser.sha256,
  } };
  if (!validateTrustedPlan(plan, trustedBindings.expectedPlan)) throw new Error("C08_CONTEXT_PLAN");
  return { plan, trustedBindings };
}
export function c08ResultPass(result, context, preservation) {
  return obj(result) && obj(context) && preservation === true &&
    result.exitCode === 0 && result.signal === null && result.stderr === "" &&
    result.overflow === false && result.timedOut === false && result.spawnError === false &&
    consumeC08Output(result.stdout, context.plan, context.trustedBindings, C08_TERMINAL);
}

export function parseFixtureArguments(argv) {
  if (!Array.isArray(argv)) throw new Error("FIXTURE_SELECTION_INVALID");
  const options = new Map();
  for (const arg of argv) {
    const match = typeof arg === "string" && /^--(fixture-domain|fixture-input-record)=(.+)$/.exec(arg);
    if (!match || options.has(match[1])) throw new Error("FIXTURE_SELECTION_INVALID");
    options.set(match[1], match[2]);
  }
  if (options.size !== 2 || !["historical-overlay", "current-overlay"].includes(options.get("fixture-domain")))
    throw new Error("FIXTURE_SELECTION_REQUIRED");
  const recordPath = options.get("fixture-input-record");
  if (!recordPath.startsWith("/") || recordPath.includes("\0") ||
      recordPath.slice(1).split("/").some((s) => !s || s === "." || s === ".."))
    throw new Error("FIXTURE_RECORD_PATH");
  return Object.freeze({ domain: options.get("fixture-domain"), recordPath });
}


export function reverseExactSourceDeltas(source, deltas, expectedIdentity, normalizeAndHash) {
  if (typeof source !== "string" || encodedBytes(source) > 2097152 || !Array.isArray(deltas) || !deltas.length ||
      deltas.length > 32 || typeof expectedIdentity !== "string" || !/^[0-9a-f]{64}$/.test(expectedIdentity) ||
      typeof normalizeAndHash !== "function") throw new Error("REVERSAL_CONTRACT");
  let current = source;
  for (const delta of [...deltas].reverse()) {
    if (!keys(delta, ["before", "after"]) || typeof delta.before !== "string" || typeof delta.after !== "string" ||
        !delta.before || !delta.after || delta.before === delta.after || current.split(delta.after).length !== 2)
      throw new Error("REVERSAL_CARDINALITY");
    current = current.replace(delta.after, delta.before);
  }
  if (normalizeAndHash(current) !== expectedIdentity) throw new Error("REVERSAL_IDENTITY");
  return current;
}
