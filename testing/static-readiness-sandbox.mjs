import childProcess from "node:child_process";
import dgram from "node:dgram";
import dns from "node:dns";
import dnsPromises from "node:dns/promises";
import fs from "node:fs";
import http from "node:http";
import http2 from "node:http2";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import { syncBuiltinESMExports } from "node:module";

function denial(family) {
  return function denyStaticReadinessCapability() {
    const error = new Error(`STATIC_READINESS_SANDBOX_DENIED_${family}`);
    error.code = `STATIC_READINESS_SANDBOX_DENIED_${family}`;
    throw error;
  };
}

const denyGlobalNetwork = denial("GLOBAL_NETWORK");
const denyModuleNetwork = denial("MODULE_NETWORK");
const denyChildProcess = denial("CHILD_PROCESS");
const denyFilesystemMutation = denial("FILESYSTEM_MUTATION");
const originalOpen = fs.open.bind(fs);
const originalOpenSync = fs.openSync.bind(fs);
const originalPromisesOpen = fs.promises.open.bind(fs.promises);

function isReadOnlyOpenFlag(flags) {
  return (
    flags === 0 ||
    flags === "r" ||
    flags === "rs" ||
    flags === "sr"
  );
}

globalThis.fetch = denyGlobalNetwork;
globalThis.WebSocket = class DeniedWebSocket {
  constructor() {
    denyGlobalNetwork();
  }
};
globalThis.EventSource = class DeniedEventSource {
  constructor() {
    denyGlobalNetwork();
  }
};

for (const [moduleObject, methods] of [
  [http, ["request", "get", "createServer"]],
  [https, ["request", "get", "createServer"]],
  [net, ["connect", "createConnection", "createServer"]],
  [tls, ["connect", "createServer"]],
  [
    dns,
    [
      "lookup",
      "lookupService",
      "resolve",
      "resolve4",
      "resolve6",
      "resolveAny",
      "resolveCaa",
      "resolveCname",
      "resolveMx",
      "resolveNaptr",
      "resolveNs",
      "resolvePtr",
      "resolveSoa",
      "resolveSrv",
      "resolveTxt",
      "reverse",
    ],
  ],
  [
    dnsPromises,
    [
      "lookup",
      "lookupService",
      "resolve",
      "resolve4",
      "resolve6",
      "resolveAny",
      "resolveCaa",
      "resolveCname",
      "resolveMx",
      "resolveNaptr",
      "resolveNs",
      "resolvePtr",
      "resolveSoa",
      "resolveSrv",
      "resolveTxt",
      "reverse",
    ],
  ],
  [dgram, ["createSocket"]],
  [http2, ["connect", "createServer", "createSecureServer"]],
]) {
  for (const method of methods) {
    if (typeof moduleObject[method] === "function") {
      moduleObject[method] = denyModuleNetwork;
    }
  }
}

for (const [prototypeObject, methods] of [
  [http.Agent?.prototype, ["createConnection"]],
  [https.Agent?.prototype, ["createConnection"]],
  [net.Socket?.prototype, ["connect"]],
  [net.Server?.prototype, ["listen"]],
  [tls.TLSSocket?.prototype, ["connect"]],
  [dgram.Socket?.prototype, ["bind", "connect", "send"]],
  [
    dns.Resolver?.prototype,
    [
      "resolve",
      "resolve4",
      "resolve6",
      "resolveAny",
      "resolveCaa",
      "resolveCname",
      "resolveMx",
      "resolveNaptr",
      "resolveNs",
      "resolvePtr",
      "resolveSoa",
      "resolveSrv",
      "resolveTxt",
      "reverse",
    ],
  ],
  [
    dnsPromises.Resolver?.prototype,
    [
      "resolve",
      "resolve4",
      "resolve6",
      "resolveAny",
      "resolveCaa",
      "resolveCname",
      "resolveMx",
      "resolveNaptr",
      "resolveNs",
      "resolvePtr",
      "resolveSoa",
      "resolveSrv",
      "resolveTxt",
      "reverse",
    ],
  ],
]) {
  if (!prototypeObject) continue;
  for (const method of methods) {
    if (typeof prototypeObject[method] === "function") {
      prototypeObject[method] = denyModuleNetwork;
    }
  }
}

for (const method of [
  "spawn",
  "spawnSync",
  "exec",
  "execSync",
  "execFile",
  "execFileSync",
  "fork",
]) {
  childProcess[method] = denyChildProcess;
}

for (const method of [
  "writeFile",
  "writeFileSync",
  "write",
  "writeSync",
  "writev",
  "writevSync",
  "appendFile",
  "appendFileSync",
  "copyFile",
  "copyFileSync",
  "cp",
  "cpSync",
  "rename",
  "renameSync",
  "rm",
  "rmSync",
  "rmdir",
  "rmdirSync",
  "unlink",
  "unlinkSync",
  "chmod",
  "chmodSync",
  "chown",
  "chownSync",
  "truncate",
  "truncateSync",
  "ftruncate",
  "ftruncateSync",
  "symlink",
  "symlinkSync",
  "link",
  "linkSync",
  "mkdir",
  "mkdirSync",
  "mkdtemp",
  "mkdtempSync",
  "fchmod",
  "fchmodSync",
  "fchown",
  "fchownSync",
  "lchmod",
  "lchmodSync",
  "lchown",
  "lchownSync",
  "utimes",
  "utimesSync",
  "futimes",
  "futimesSync",
  "lutimes",
  "lutimesSync",
  "createWriteStream",
]) {
  fs[method] = denyFilesystemMutation;
}

for (const method of [
  "writeFile",
  "write",
  "writev",
  "appendFile",
  "copyFile",
  "cp",
  "rename",
  "rm",
  "rmdir",
  "unlink",
  "chmod",
  "chown",
  "truncate",
  "ftruncate",
  "symlink",
  "link",
  "mkdir",
  "mkdtemp",
  "fchmod",
  "fchown",
  "lchmod",
  "lchown",
  "utimes",
  "futimes",
  "lutimes",
]) {
  if (typeof fs.promises[method] === "function") {
    fs.promises[method] = denyFilesystemMutation;
  }
}

fs.open = function guardedOpen(path, flags, ...rest) {
  if (!isReadOnlyOpenFlag(flags)) return denyFilesystemMutation();
  return originalOpen(path, flags, ...rest);
};
fs.openSync = function guardedOpenSync(path, flags, ...rest) {
  if (!isReadOnlyOpenFlag(flags)) return denyFilesystemMutation();
  return originalOpenSync(path, flags, ...rest);
};
fs.promises.open = async function guardedPromisesOpen(path, flags, ...rest) {
  if (!isReadOnlyOpenFlag(flags)) return denyFilesystemMutation();
  const handle = await originalPromisesOpen(path, flags, ...rest);
  for (const method of [
    "write",
    "writeFile",
    "writev",
    "truncate",
    "chmod",
    "chown",
    "utimes",
    "createWriteStream",
  ]) {
    if (typeof handle[method] === "function") {
      handle[method] = denyFilesystemMutation;
    }
  }
  return handle;
};

syncBuiltinESMExports();
