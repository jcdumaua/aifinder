import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  statSync,
} from "node:fs";
import { inflateSync } from "node:zlib";
import ts from "typescript";

const CANONICAL_ORIGIN = "https://aifinder.to";
const OLD_ORIGIN = "https://aifinder-eight.vercel.app";
const SECURITY_CONTACT = "mailto:security@aifinder.to";
const SECURITY_CANONICAL = "https://aifinder.to/.well-known/security.txt";
const SECURITY_EXPIRES = "2027-07-21T23:59:59Z";
const RENEWAL_OWNER = "James Carlo Dumaua";
const RENEWAL_DUE = "2027-06-21T00:00:00Z";
const CURRENT_BASELINE = "03afce244d6d1a16b013fbd2ad2d1e1ff86203fa";
const HISTORICAL_VERCEL_COMMIT = "31a684294fa9f5d0c375a3457f601e78faf07833";
const IMPLEMENTATION_TOKEN =
  "APPROVE_PHASE_29AU_29BF_EXACT_13_PATH_PRODUCTION_PERIMETER_CANONICAL_SEO_PWA_SECURITY_DISCLOSURE_FIGMA_ICON_AND_GOVERNANCE_ERRATUM_IMPLEMENT_REVIEW_NO_STAGE_NO_COMMIT_NO_PUSH";
const FINALIZATION_TOKEN =
  "APPROVE_PHASE_29BG_29BN_EXACT_13_PATH_PRODUCTION_PERIMETER_REPAIR_FINAL_REVIEW_COMMIT_PUSH_AND_BOUNDED_POST_DEPLOY_READ_ONLY_VERIFICATION";
const FINALIZATION_SUBJECT = "Harden production perimeter metadata and governance";
const FINALIZATION_BLOCK_BEGIN =
  "AIFINDER_PHASE_29BG_29BN_STABLE_FINALIZATION_BINDING_BEGIN";
const FINALIZATION_BLOCK_END =
  "AIFINDER_PHASE_29BG_29BN_STABLE_FINALIZATION_BINDING_END";
const AUDIT_CCR_SHA256 =
  "0c79f09bfa19c6908d70c1fbc081560b5bd34bf74669d47e50c5b2f4015ad0a6";
const AUDIT_LEDGER_SHA256 =
  "c003049db73d60d8c15006792f1f56b2d3dcd560a07ab23e3e60814b3b4cf6f7";
const PROXY_SHA256 =
  "d032aaff869000464d7b320191e1ed9f5c9d7c519e8a058c4673750a6a8117bb";

const paths = {
  config: "next.config.ts",
  layout: "app/layout.tsx",
  robots: "app/robots.ts",
  sitemap: "app/sitemap.ts",
  manifest: "app/manifest.ts",
  architecture:
    "docs/discovery-phase-27ot-27pe-authorization-trust-architecture-and-static-assurance-gate.md",
  activation:
    "scripts/_drafts/discovery-phase-27nm-27ol-live-preflight-activation-identity-manifest.json",
  icon192: "public/icon-192x192.png",
  icon512: "public/icon-512x512.png",
  iconMaskable: "public/icon-maskable-512x512.png",
  security: "public/.well-known/security.txt",
  assertions: "testing/production-perimeter-static-assertions.mjs",
  gate: "docs/discovery-phase-29aa-29at-production-perimeter-audit-and-repair-gate.md",
  proxy: "proxy.ts",
};

const text = (path) => readFileSync(path, "utf8");
const bytes = (path) => readFileSync(path);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const count = (source, needle) => source.split(needle).length - 1;
const mode = (path) => statSync(path).mode & 0o777;

const results = [];
function check(id, assertion) {
  try {
    const value = assertion();
    if (value === false) throw new Error("condition was false");
    results.push({ id, status: "PASS" });
  } catch (error) {
    results.push({ id, status: "FAIL", reason: error?.message || "assertion failed" });
  }
}

function equal(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function includes(source, expected, label) {
  if (!source.includes(expected)) throw new Error(`${label}: missing required value`);
}

function excludes(source, rejected, label) {
  if (source.includes(rejected)) throw new Error(`${label}: stale or prohibited value remains`);
}

function regularMode0644(path) {
  const info = lstatSync(path);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error("not a regular non-symlink file");
  equal(mode(path), 0o644, "filesystem mode");
}

function parseJsonRejectingDuplicateKeys(source) {
  let offset = 0;

  function fail(message) {
    throw new Error(`${message} at byte ${offset}`);
  }

  function skipWhitespace() {
    while (/\s/.test(source[offset] || "")) offset += 1;
  }

  function parseString() {
    if (source[offset] !== '"') fail("expected JSON string");
    const start = offset;
    offset += 1;
    while (offset < source.length) {
      const character = source[offset];
      if (character === "\\") {
        offset += 2;
        continue;
      }
      if (character === '"') {
        offset += 1;
        return JSON.parse(source.slice(start, offset));
      }
      if (character.charCodeAt(0) < 0x20) fail("control character in JSON string");
      offset += 1;
    }
    fail("unterminated JSON string");
  }

  function parseValue() {
    skipWhitespace();
    const character = source[offset];
    if (character === "{") return parseObject();
    if (character === "[") return parseArray();
    if (character === '"') return parseString();
    for (const literal of ["true", "false", "null"]) {
      if (source.startsWith(literal, offset)) {
        offset += literal.length;
        return JSON.parse(literal);
      }
    }
    const numberMatch = source
      .slice(offset)
      .match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (!numberMatch) fail("invalid JSON value");
    offset += numberMatch[0].length;
    return JSON.parse(numberMatch[0]);
  }

  function parseObject() {
    const value = {};
    const keys = new Set();
    offset += 1;
    skipWhitespace();
    if (source[offset] === "}") {
      offset += 1;
      return value;
    }
    while (offset < source.length) {
      skipWhitespace();
      const key = parseString();
      if (keys.has(key)) throw new Error(`duplicate JSON key: ${key}`);
      keys.add(key);
      skipWhitespace();
      if (source[offset] !== ":") fail("expected colon after JSON key");
      offset += 1;
      value[key] = parseValue();
      skipWhitespace();
      if (source[offset] === "}") {
        offset += 1;
        return value;
      }
      if (source[offset] !== ",") fail("expected comma in JSON object");
      offset += 1;
    }
    fail("unterminated JSON object");
  }

  function parseArray() {
    const value = [];
    offset += 1;
    skipWhitespace();
    if (source[offset] === "]") {
      offset += 1;
      return value;
    }
    while (offset < source.length) {
      value.push(parseValue());
      skipWhitespace();
      if (source[offset] === "]") {
        offset += 1;
        return value;
      }
      if (source[offset] !== ",") fail("expected comma in JSON array");
      offset += 1;
    }
    fail("unterminated JSON array");
  }

  parseValue();
  skipWhitespace();
  if (offset !== source.length) fail("trailing JSON input");
  return JSON.parse(source);
}

function parseExactBindingBlock(source, beginMarker, endMarker) {
  equal(count(source, beginMarker), 1, `${beginMarker} count`);
  equal(count(source, endMarker), 1, `${endMarker} count`);
  const blockPattern = new RegExp(
    `^${beginMarker}\\n([\\s\\S]*?)\\n${endMarker}$`,
    "m",
  );
  const match = source.match(blockPattern);
  if (!match) throw new Error("exact binding block is missing or malformed");
  const bindings = {};
  for (const line of match[1].split("\n")) {
    const bindingMatch = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!bindingMatch) throw new Error("malformed binding line");
    const [, key, value] = bindingMatch;
    if (Object.hasOwn(bindings, key)) throw new Error(`duplicate binding key: ${key}`);
    bindings[key] = value;
  }
  return bindings;
}

function parseTypeScript(path, scriptKind = ts.ScriptKind.TS) {
  return ts.createSourceFile(
    path,
    text(path),
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
}

function findVariableInitializer(sourceFile, variableName) {
  const matches = [];
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName
    ) {
      matches.push(node.initializer);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  equal(matches.length, 1, `${variableName} declaration count`);
  if (!matches[0]) throw new Error(`${variableName} has no initializer`);
  return matches[0];
}

function literalString(node, label) {
  if (!ts.isStringLiteralLike(node)) throw new Error(`${label} is not a string literal`);
  return node.text;
}

function objectPropertyMap(object, label) {
  if (!ts.isObjectLiteralExpression(object)) throw new Error(`${label} is not an object literal`);
  const properties = new Map();
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) {
      throw new Error(`${label} contains a non-property assignment`);
    }
    const key = property.name.getText().replace(/^['"]|['"]$/g, "");
    if (properties.has(key)) throw new Error(`${label} contains duplicate property ${key}`);
    properties.set(key, property.initializer);
  }
  return properties;
}

function findReturnedObject(sourceFile, functionName) {
  let functionNode;
  function visit(node) {
    if (
      ts.isFunctionDeclaration(node) &&
      node.name?.text === functionName
    ) functionNode = node;
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (!functionNode?.body) throw new Error(`missing function ${functionName}`);
  const returns = functionNode.body.statements.filter(ts.isReturnStatement);
  equal(returns.length, 1, `${functionName} return count`);
  if (!returns[0].expression || !ts.isObjectLiteralExpression(returns[0].expression)) {
    throw new Error(`${functionName} does not return an object literal`);
  }
  return returns[0].expression;
}

function unwrapParentheses(node) {
  let current = node;
  while (ts.isParenthesizedExpression(current)) current = current.expression;
  return current;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function readPng(path) {
  const data = bytes(path);
  equal(data.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "PNG signature");
  let offset = 8;
  let width;
  let height;
  let bitDepth;
  let colorType;
  let interlace;
  const idat = [];
  while (offset < data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.subarray(offset + 4, offset + 8).toString("ascii");
    const chunk = data.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      bitDepth = chunk[8];
      colorType = chunk[9];
      interlace = chunk[12];
    } else if (type === "IDAT") {
      idat.push(chunk);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }
  equal(bitDepth, 8, "PNG bit depth");
  equal(colorType, 6, "PNG color type");
  equal(interlace, 0, "PNG interlace method");
  const raw = inflateSync(Buffer.concat(idat));
  const bytesPerPixel = 4;
  const rowBytes = width * bytesPerPixel;
  equal(raw.length, (rowBytes + 1) * height, "inflated PNG length");
  const reconstructed = Buffer.alloc(rowBytes * height);
  let inputOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[inputOffset];
    inputOffset += 1;
    for (let x = 0; x < rowBytes; x += 1) {
      const encoded = raw[inputOffset + x];
      const outputIndex = y * rowBytes + x;
      const left = x >= bytesPerPixel ? reconstructed[outputIndex - bytesPerPixel] : 0;
      const up = y > 0 ? reconstructed[outputIndex - rowBytes] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel
        ? reconstructed[outputIndex - rowBytes - bytesPerPixel]
        : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = Math.floor((left + up) / 2);
      else if (filter === 4) predictor = paeth(left, up, upLeft);
      else if (filter !== 0) throw new Error(`unsupported PNG filter ${filter}`);
      reconstructed[outputIndex] = (encoded + predictor) & 0xff;
    }
    inputOffset += rowBytes;
  }
  let allOpaque = true;
  for (let index = 3; index < reconstructed.length; index += 4) {
    if (reconstructed[index] !== 255) {
      allOpaque = false;
      break;
    }
  }
  return { width, height, allOpaque };
}

const layout = text(paths.layout);
const robots = text(paths.robots);
const sitemap = text(paths.sitemap);
const manifestSource = text(paths.manifest);
const config = text(paths.config);
const architecture = text(paths.architecture);
let activation;

const layoutAst = parseTypeScript(paths.layout, ts.ScriptKind.TSX);
const robotsAst = parseTypeScript(paths.robots);
const sitemapAst = parseTypeScript(paths.sitemap);
const manifestAst = parseTypeScript(paths.manifest);
const configAst = parseTypeScript(paths.config);

for (const [label, source, sourceFile] of [
  ["layout", layout, layoutAst],
  ["robots", robots, robotsAst],
  ["sitemap", sitemap, sitemapAst],
]) {
  check(`CANONICAL.${label}.ASSIGNED`, () =>
    equal(
      literalString(findVariableInitializer(sourceFile, "siteUrl"), `${label} siteUrl`),
      CANONICAL_ORIGIN,
      `${label} siteUrl`,
    ),
  );
  check(`CANONICAL.${label}.OLD_ORIGIN_ABSENT`, () => excludes(source, OLD_ORIGIN, label));
}

const manifestProperties = objectPropertyMap(
  findReturnedObject(manifestAst, "manifest"),
  "manifest return value",
);
for (const [key, expected] of [
  ["id", "/"],
  ["start_url", "/"],
  ["scope", "/"],
  ["display", "standalone"],
  ["theme_color", "#f8fafc"],
  ["background_color", "#f8fafc"],
]) {
  check(`MANIFEST.${key.toUpperCase()}`, () =>
    equal(literalString(manifestProperties.get(key), `manifest ${key}`), expected, `manifest ${key}`),
  );
}

check("MANIFEST.EXACT_ICON_OBJECTS", () => {
  const icons = manifestProperties.get("icons");
  if (!ts.isArrayLiteralExpression(icons)) throw new Error("manifest icons is not an array literal");
  const actual = icons.elements.map((icon, index) => {
    const properties = objectPropertyMap(icon, `manifest icon ${index}`);
    equal(
      [...properties.keys()].sort().join(","),
      "purpose,sizes,src,type",
      `manifest icon ${index} property set`,
    );
    return {
      src: literalString(properties.get("src"), `manifest icon ${index} src`),
      sizes: literalString(properties.get("sizes"), `manifest icon ${index} sizes`),
      type: literalString(properties.get("type"), `manifest icon ${index} type`),
      purpose: literalString(properties.get("purpose"), `manifest icon ${index} purpose`),
    };
  });
  const expected = [
    { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icon-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ];
  equal(JSON.stringify(actual), JSON.stringify(expected), "manifest icon objects");
});

for (const [label, path, dimension, expectedSha256, expectedBytes] of [
  ["192_ANY", paths.icon192, 192, "1a14d909232fc280b8f606ad551ed04df84bece78724070203adb365c750c2e7", 1717],
  ["512_ANY", paths.icon512, 512, "f2d4c7c432cbddc5197812c798b9af9309075a8911c2daed64797cbc7de9bef2", 5049],
  ["512_MASKABLE", paths.iconMaskable, 512, "f2d4c7c432cbddc5197812c798b9af9309075a8911c2daed64797cbc7de9bef2", 5049],
]) {
  check(`PNG.${label}.FILE`, () => regularMode0644(path));
  check(`PNG.${label}.IDENTITY`, () => {
    equal(sha256(bytes(path)), expectedSha256, "PNG SHA-256");
    equal(bytes(path).length, expectedBytes, "PNG byte count");
  });
  check(`PNG.${label}.STRUCTURE`, () => {
    const png = readPng(path);
    equal(png.width, dimension, "PNG width");
    equal(png.height, dimension, "PNG height");
  });
  check(`PNG.${label}.OPAQUE`, () => equal(readPng(path).allOpaque, true, "opaque full bleed"));
}

check("SECURITY.FILE", () => regularMode0644(paths.security));
check("SECURITY.EXACT_CONTENT", () => {
  const expected = [
    `Contact: ${SECURITY_CONTACT}`,
    `Expires: ${SECURITY_EXPIRES}`,
    `Canonical: ${SECURITY_CANONICAL}`,
    "Preferred-Languages: en",
    "",
  ].join("\n");
  equal(text(paths.security), expected, "security.txt bytes");
});
check("SECURITY.ASCII_BOUNDED", () => {
  const security = bytes(paths.security);
  if (security.length > 4096) throw new Error("security.txt exceeds 4096 bytes");
  if ([...security].some((value) => value > 0x7f)) throw new Error("security.txt is not ASCII");
});

check("SITEMAP.DYNAMIC_ONLY", () => {
  includes(sitemap, 'export const dynamic = "force-dynamic";', "dynamic strategy");
  if (/\brevalidate\b/.test(sitemap)) throw new Error("revalidate conflicts with force-dynamic");
});
check("SITEMAP.CANONICAL_SLUG_FILTER", () => {
  includes(
    sitemap,
    "const canonicalToolSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;",
    "canonical slug predicate",
  );
  includes(sitemap, ".filter(hasCanonicalToolSlug)", "canonical slug filter binding");
  includes(
    sitemap,
    'typeof tool.slug === "string" && canonicalToolSlugPattern.test(tool.slug)',
    "canonical slug predicate use",
  );
});
check("SITEMAP.PERSISTED_DATE_CONSTRUCTION", () => {
  const dateConstructions = [];
  function visit(node) {
    if (ts.isNewExpression(node) && node.expression.getText() === "Date") {
      dateConstructions.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(sitemapAst);
  equal(dateConstructions.length, 1, "Date construction count");
  equal(dateConstructions[0].arguments?.length, 1, "Date argument count");
  equal(dateConstructions[0].arguments[0].getText(), "value", "Date persisted input");
  excludes(sitemap, "Date.now", "request-time clock");
});
check("SITEMAP.PERSISTED_TIMESTAMPS_ONLY", () => {
  includes(sitemap, 'from("public_safe_tools")', "public-safe source");
  includes(sitemap, '.order("created_at", { ascending: false })', "public-safe ordering");
  equal(count(sitemap, "lastModified"), 1, "lastModified occurrence count");
  includes(
    sitemap,
    "const persistedDate = getPersistedDate(tool.updated_at, tool.created_at);",
    "persisted timestamp sources",
  );
  includes(
    sitemap,
    "...(persistedDate ? { lastModified: persistedDate } : {}),",
    "conditional lastModified binding",
  );
});
check("SITEMAP.NO_PRIVATE_URLS", () => {
  for (const rejected of ["/admin", "/api/", "/admin-login"]) excludes(sitemap, rejected, "private URL");
});

const expectedStaticPaths = [
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/icon-maskable-512x512.png",
  "/.well-known/security.txt",
];
const expectedBaseHeaders = [
  ["X-Frame-Options", "DENY"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["X-DNS-Prefetch-Control", "off"],
  ["Cross-Origin-Opener-Policy", "same-origin"],
  [
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  ],
  [
    "Content-Security-Policy",
    "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  ],
];
const expectedHsts = [
  "Strict-Transport-Security",
  "max-age=31536000; includeSubDomains; preload",
];

function headerTuple(node, label) {
  const properties = objectPropertyMap(node, label);
  equal([...properties.keys()].sort().join(","), "key,value", `${label} property set`);
  return [
    literalString(properties.get("key"), `${label} key`),
    literalString(properties.get("value"), `${label} value`),
  ];
}

check("HEADERS.EXACT_RULE_GRAPH", () => {
  const pathInitializer = findVariableInitializer(configAst, "staticPerimeterPaths");
  if (!ts.isArrayLiteralExpression(pathInitializer)) throw new Error("static paths is not an array");
  const actualPaths = pathInitializer.elements.map((node, index) =>
    literalString(node, `static path ${index}`),
  );
  equal(JSON.stringify(actualPaths), JSON.stringify(expectedStaticPaths), "exact static path set");
  excludes(config, "/manifest.webmanifest", "manifest header rule");

  const headerInitializer = findVariableInitializer(configAst, "staticPerimeterHeaders");
  if (!ts.isArrayLiteralExpression(headerInitializer)) throw new Error("static headers is not an array");
  const baseHeaders = [];
  const spreads = [];
  for (const [index, element] of headerInitializer.elements.entries()) {
    if (ts.isObjectLiteralExpression(element)) {
      baseHeaders.push(headerTuple(element, `base header ${index}`));
    } else if (ts.isSpreadElement(element)) {
      spreads.push(unwrapParentheses(element.expression));
    } else {
      throw new Error(`unexpected static header element ${index}`);
    }
  }
  equal(JSON.stringify(baseHeaders), JSON.stringify(expectedBaseHeaders), "exact base headers");
  equal(spreads.length, 1, "production header spread count");
  const conditional = spreads[0];
  if (!ts.isConditionalExpression(conditional)) throw new Error("HSTS spread is not conditional");
  equal(
    conditional.condition.getText(),
    'process.env.NODE_ENV === "production"',
    "HSTS production condition",
  );
  const productionHeaders = unwrapParentheses(conditional.whenTrue);
  const nonProductionHeaders = unwrapParentheses(conditional.whenFalse);
  if (!ts.isArrayLiteralExpression(productionHeaders) || !ts.isArrayLiteralExpression(nonProductionHeaders)) {
    throw new Error("HSTS branches are not array literals");
  }
  equal(productionHeaders.elements.length, 1, "production-only header count");
  equal(
    JSON.stringify(headerTuple(productionHeaders.elements[0], "production HSTS")),
    JSON.stringify(expectedHsts),
    "production HSTS",
  );
  equal(nonProductionHeaders.elements.length, 0, "non-production HSTS count");

  const nextConfig = findVariableInitializer(configAst, "nextConfig");
  if (!ts.isObjectLiteralExpression(nextConfig)) throw new Error("nextConfig is not an object");
  const headerMethods = nextConfig.properties.filter(
    (property) => ts.isMethodDeclaration(property) && property.name.getText() === "headers",
  );
  equal(headerMethods.length, 1, "nextConfig headers method count");
  const method = headerMethods[0];
  const returns = method.body.statements.filter(ts.isReturnStatement);
  equal(returns.length, 1, "headers method return count");
  const call = returns[0].expression;
  if (
    !ts.isCallExpression(call) ||
    !ts.isPropertyAccessExpression(call.expression) ||
    call.expression.expression.getText() !== "staticPerimeterPaths" ||
    call.expression.name.text !== "map" ||
    call.arguments.length !== 1 ||
    !ts.isArrowFunction(call.arguments[0])
  ) throw new Error("headers method does not map the exact static path array");
  const mapper = call.arguments[0];
  equal(mapper.parameters.length, 1, "header mapper parameter count");
  equal(mapper.parameters[0].name.getText(), "source", "header mapper parameter");
  const mappedObject = unwrapParentheses(mapper.body);
  if (!ts.isObjectLiteralExpression(mappedObject)) throw new Error("header mapper does not return an object");
  equal(mappedObject.properties.length, 2, "header rule property count");
  if (!ts.isShorthandPropertyAssignment(mappedObject.properties[0]) || mappedObject.properties[0].name.text !== "source") {
    throw new Error("header rule source is not bound to mapped source");
  }
  const mappedHeaders = mappedObject.properties[1];
  if (
    !ts.isPropertyAssignment(mappedHeaders) ||
    mappedHeaders.name.getText() !== "headers" ||
    mappedHeaders.initializer.getText() !== "staticPerimeterHeaders"
  ) throw new Error("header rule does not bind the exact header array");
});
check("HEADERS.PROXY_UNCHANGED", () => equal(sha256(bytes(paths.proxy)), PROXY_SHA256, "proxy identity"));

check("GOVERNANCE.ACTIVATION_JSON_UNIQUE_KEYS", () => {
  activation = parseJsonRejectingDuplicateKeys(text(paths.activation));
});
check("GOVERNANCE.ACCESS_VS_RETENTION", () => {
  includes(architecture, "transiently exposed", "transient access correction");
  includes(architecture, "Clear-text values were not persisted", "non-retention correction");
  excludes(
    architecture,
    "No logs, source, environment values, aliases, domains, actor identifiers, settings, or secrets were accessed or retained.",
    "inaccurate access/non-retention statement",
  );
});
check("GOVERNANCE.ARCHITECTURE_IDENTITY", () => {
  const entry = activation.artifacts[paths.architecture];
  const mirrored =
    activation.governance_finalization.final_nonself_path_identities[paths.architecture];
  equal(entry.sha256, sha256(bytes(paths.architecture)), "architecture SHA-256");
  equal(entry.bytes, bytes(paths.architecture).length, "architecture byte count");
  equal(mirrored.sha256, sha256(bytes(paths.architecture)), "mirrored architecture SHA-256");
  equal(mirrored.bytes, bytes(paths.architecture).length, "mirrored architecture byte count");
});
check("GOVERNANCE.HISTORICAL_VERCEL_COMMIT", () =>
  equal(activation.vercel_status.bound_git_commit, HISTORICAL_VERCEL_COMMIT, "bound Git commit"),
);
check("GOVERNANCE.HISTORICAL_VERCEL_STAGE", () =>
  equal(activation.vercel_status.observation_stage, "PRE_PUSH_BASELINE_OBSERVATION", "observation stage"),
);
check("GOVERNANCE.HISTORICAL_VERCEL_SCOPE", () =>
  equal(
    activation.vercel_status.observation_scope,
    "HISTORICAL_PARENT_BOUND_NOT_CURRENT_DEPLOYMENT",
    "observation scope",
  ),
);
check("GOVERNANCE.OPERATIONAL_FLAGS_FALSE", () => {
  const expectedKeys = [
    "assertion_issuance_authorized",
    "deployment_authorized",
    "live_execution_authorized",
    "migration_execution_authorized",
    "mutation_authorized",
    "operational_reactivation_authorized",
    "public_launch_authorized",
    "publishing_authorized",
    "record_generation_authorized",
    "type_generation_authorized",
  ];
  equal(
    Object.keys(activation.authorization_flags).sort().join(","),
    expectedKeys.join(","),
    "authorization flag key set",
  );
  for (const [key, value] of Object.entries(activation.authorization_flags)) {
    if (value !== false) throw new Error(`${key} is not false`);
  }
  function visit(value, location) {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      const childLocation = `${location}.${key}`;
      if (key.endsWith("_authorized") && child !== false) {
        throw new Error(`${childLocation} is not false`);
      }
      visit(child, childLocation);
    }
  }
  visit(activation, "activation");
});

check("PHASE29.GATE.FILE", () => regularMode0644(paths.gate));
check("PHASE29.GATE.NONSELF_IDENTITIES", () => {
  const gate = text(paths.gate);
  const identityRows = new Map();
  const rowPattern =
    /^\| `([^`]+)` \| (?:modified|created) \| `([a-f0-9]{64})` \| (\d+) \| `0644` \|$/gm;
  for (const match of gate.matchAll(rowPattern)) {
    if (identityRows.has(match[1])) throw new Error(`duplicate gate identity row: ${match[1]}`);
    identityRows.set(match[1], { sha256: match[2], bytes: Number(match[3]) });
  }
  const nonselfPaths = [
    paths.config,
    paths.layout,
    paths.robots,
    paths.sitemap,
    paths.manifest,
    paths.architecture,
    paths.activation,
    paths.icon192,
    paths.icon512,
    paths.iconMaskable,
    paths.security,
    paths.assertions,
  ];
  equal(identityRows.size, nonselfPaths.length, "gate non-self identity row count");
  for (const path of nonselfPaths) {
    const identity = identityRows.get(path);
    if (!identity) throw new Error(`missing gate identity row: ${path}`);
    regularMode0644(path);
    equal(identity.sha256, sha256(bytes(path)), `${path} gate SHA-256`);
    equal(identity.bytes, bytes(path).length, `${path} gate byte count`);
  }
});
check("PHASE29.GATE.BINDINGS", () => {
  const gate = text(paths.gate);
  for (const required of [
    CURRENT_BASELINE,
    AUDIT_CCR_SHA256,
    AUDIT_LEDGER_SHA256,
    CANONICAL_ORIGIN,
    SECURITY_CONTACT,
    SECURITY_CANONICAL,
    SECURITY_EXPIRES,
    RENEWAL_OWNER,
    RENEWAL_DUE,
    "MIXED_PUBLIC_AND_ACCESS_GATED",
    "UNATTRIBUTED",
    "FIGMA_NEW_MASTER",
    "MASTER_1024",
    "CORE_MARK",
    "SAFE_ZONE_80_PERCENT",
    "EXPORT_192_ANY",
    "EXPORT_512_ANY",
    "EXPORT_512_MASKABLE",
  ]) includes(gate, required, "Phase-29 gate binding");
});
check("PHASE29.GATE.DENIALS", () => {
  const gate = text(paths.gate);
  for (const required of [
    "OFFLINE_OR_FULL_PWA_READY=false",
    "DEPLOYMENT_CONTROL_AUTHORIZED=false",
    "DATABASE_ACCESS_AUTHORIZED=false",
    "LIVE_READINESS=false",
  ]) includes(gate, required, "Phase-29 denial");
});
check("PHASE29.GATE.NO_RAW_FIGMA_IDENTIFIER", () => {
  const gate = text(paths.gate);
  if (/https:\/\/(?:www\.)?figma\.com\/design\/[A-Za-z0-9]+/.test(gate)) {
    throw new Error("raw Figma design URL retained");
  }
  if (/\bfile[_ -]?key\s*[:=]\s*[A-Za-z0-9]{10,}/i.test(gate)) {
    throw new Error("raw Figma file key retained");
  }
});
check("PHASE29.GATE.NO_FULL_PWA_CLAIM", () => {
  const gate = text(paths.gate);
  excludes(gate, "OFFLINE_OR_FULL_PWA_READY=true", "offline/full-PWA claim");
  includes(gate, "MANIFEST_INSTALLABILITY_CANDIDATE", "bounded PWA classification");
});
let finalizationBindings;
const expectedFinalizationBindings = {
  PHASE_29AU_29BF_AUTHORIZATION: IMPLEMENTATION_TOKEN,
  PHASE_29AU_29BF_AUTHORIZATION_STATE:
    "SPENT_FOR_IMPLEMENTATION_AND_REVIEW_ONLY_NO_STAGE_COMMIT_PUSH",
  PHASE_29BG_29BN_AUTHORIZATION: FINALIZATION_TOKEN,
  PHASE_29BG_29BN_AUTHORIZATION_STATE:
    "CONSUMED_EXACTLY_ONCE_SPENT_NON_REUSABLE",
  PHASE_29BG_29BN_AUTHORIZED_WORKFLOW:
    "FINAL_REVIEW_STABLE_REBIND_EXACT_13_PATH_STAGE_ONE_COMMIT_ONE_PUSH_AUTOMATIC_GIT_INTEGRATION_PRODUCTION_DEPLOYMENT_SIDE_EFFECT_GITHUB_VERCEL_READ_ONLY_CORRELATION_AND_BOUNDED_UNAUTHENTICATED_POST_DEPLOY_VERIFICATION",
  PARENT_PRECOMMIT_BASELINE: CURRENT_BASELINE,
  RESULTING_COMMIT: "EXTERNALLY_BOUND_BY_GIT_AND_FINAL_CCR",
  COMMIT_SUBJECT: FINALIZATION_SUBJECT,
  TRACKED_MODIFICATIONS: "0",
  INDEX: "EMPTY",
  EXCLUDED_UNTRACKED: "3",
  AHEAD_BEHIND: "0/0",
  DIRECT_VERCEL_WRITE_AUTHORIZED: "false",
  AUTOMATIC_GIT_INTEGRATION_PRODUCTION_DEPLOYMENT_SIDE_EFFECT_IS_SOLE_AUTHORIZED_VERCEL_WRITE:
    "true",
  BOUNDED_POST_DEPLOY_READ_ONLY_VERIFICATION_WAS_AUTHORIZED: "true",
  OFFLINE_OR_FULL_PWA_READY: "false",
  DATABASE_ACCESS_AUTHORIZED: "false",
  SUPABASE_ACCESS_AUTHORIZED: "false",
  LIVE_READINESS: "false",
  OPERATIONAL_REACTIVATION_AUTHORIZED: "false",
  PUBLIC_LAUNCH_AUTHORIZED: "false",
  SUBSEQUENT_REPOSITORY_OR_PLATFORM_MUTATION_REQUIRES_NEW_GEMINI_REVIEW_AND_EXACT_AUTHORIZATION:
    "true",
};
check("PHASE29.GATE.FINALIZATION_AUTHORITY", () => {
  finalizationBindings = parseExactBindingBlock(
    text(paths.gate),
    FINALIZATION_BLOCK_BEGIN,
    FINALIZATION_BLOCK_END,
  );
  equal(
    Object.keys(finalizationBindings).sort().join(","),
    Object.keys(expectedFinalizationBindings).sort().join(","),
    "Phase-29 finalization binding key set",
  );
  for (const [key, expected] of Object.entries(expectedFinalizationBindings)) {
    equal(finalizationBindings[key], expected, `Phase-29 finalization binding ${key}`);
  }
});
check("PHASE29.GATE.STABLE_POST_COMMIT_STATE", () => {
  if (!finalizationBindings) throw new Error("finalization bindings unavailable");
  for (const key of [
    "TRACKED_MODIFICATIONS",
    "INDEX",
    "EXCLUDED_UNTRACKED",
    "AHEAD_BEHIND",
    "DIRECT_VERCEL_WRITE_AUTHORIZED",
    "AUTOMATIC_GIT_INTEGRATION_PRODUCTION_DEPLOYMENT_SIDE_EFFECT_IS_SOLE_AUTHORIZED_VERCEL_WRITE",
    "OFFLINE_OR_FULL_PWA_READY",
    "DATABASE_ACCESS_AUTHORIZED",
    "OPERATIONAL_REACTIVATION_AUTHORIZED",
    "PUBLIC_LAUNCH_AUTHORIZED",
    "SUBSEQUENT_REPOSITORY_OR_PLATFORM_MUTATION_REQUIRES_NEW_GEMINI_REVIEW_AND_EXACT_AUTHORIZATION",
  ]) equal(
    finalizationBindings[key],
    expectedFinalizationBindings[key],
    `stable binding ${key}`,
  );
});
check("PHASE29.GATE.NO_PENDING_REVIEW_STATE", () => {
  const gate = text(paths.gate);
  excludes(
    gate,
    "PHASE_29AU_29BF_EXACT_13_PATH_PRODUCTION_PERIMETER_REPAIR_IMPLEMENTED_PENDING_EXTERNAL_REVIEW",
    "pre-commit pending-review classification",
  );
});
check("HARNESS.PHASE29AU_ASSERTION_INVENTORY_PRESERVED", () => {
  const expectedIds = [
    "CANONICAL.layout.ASSIGNED",
    "CANONICAL.layout.OLD_ORIGIN_ABSENT",
    "CANONICAL.robots.ASSIGNED",
    "CANONICAL.robots.OLD_ORIGIN_ABSENT",
    "CANONICAL.sitemap.ASSIGNED",
    "CANONICAL.sitemap.OLD_ORIGIN_ABSENT",
    "GOVERNANCE.ACCESS_VS_RETENTION",
    "GOVERNANCE.ACTIVATION_JSON_UNIQUE_KEYS",
    "GOVERNANCE.ARCHITECTURE_IDENTITY",
    "GOVERNANCE.HISTORICAL_VERCEL_COMMIT",
    "GOVERNANCE.HISTORICAL_VERCEL_SCOPE",
    "GOVERNANCE.HISTORICAL_VERCEL_STAGE",
    "GOVERNANCE.OPERATIONAL_FLAGS_FALSE",
    "HEADERS.EXACT_RULE_GRAPH",
    "HEADERS.PROXY_UNCHANGED",
    "MANIFEST.BACKGROUND_COLOR",
    "MANIFEST.DISPLAY",
    "MANIFEST.EXACT_ICON_OBJECTS",
    "MANIFEST.ID",
    "MANIFEST.SCOPE",
    "MANIFEST.START_URL",
    "MANIFEST.THEME_COLOR",
    "PHASE29.GATE.BINDINGS",
    "PHASE29.GATE.DENIALS",
    "PHASE29.GATE.FILE",
    "PHASE29.GATE.FINALIZATION_AUTHORITY",
    "PHASE29.GATE.NONSELF_IDENTITIES",
    "PHASE29.GATE.NO_FULL_PWA_CLAIM",
    "PHASE29.GATE.NO_PENDING_REVIEW_STATE",
    "PHASE29.GATE.NO_RAW_FIGMA_IDENTIFIER",
    "PHASE29.GATE.STABLE_POST_COMMIT_STATE",
    "PNG.192_ANY.FILE",
    "PNG.192_ANY.IDENTITY",
    "PNG.192_ANY.OPAQUE",
    "PNG.192_ANY.STRUCTURE",
    "PNG.512_ANY.FILE",
    "PNG.512_ANY.IDENTITY",
    "PNG.512_ANY.OPAQUE",
    "PNG.512_ANY.STRUCTURE",
    "PNG.512_MASKABLE.FILE",
    "PNG.512_MASKABLE.IDENTITY",
    "PNG.512_MASKABLE.OPAQUE",
    "PNG.512_MASKABLE.STRUCTURE",
    "SECURITY.ASCII_BOUNDED",
    "SECURITY.EXACT_CONTENT",
    "SECURITY.FILE",
    "SITEMAP.CANONICAL_SLUG_FILTER",
    "SITEMAP.DYNAMIC_ONLY",
    "SITEMAP.NO_PRIVATE_URLS",
    "SITEMAP.PERSISTED_DATE_CONSTRUCTION",
    "SITEMAP.PERSISTED_TIMESTAMPS_ONLY",
  ];
  const actualIds = results.map((result) => result.id);
  equal(new Set(actualIds).size, actualIds.length, "assertion ID uniqueness");
  equal(
    [...actualIds].sort().join(","),
    [...expectedIds].sort().join(","),
    "preserved assertion ID inventory",
  );
});

const passCount = results.filter((result) => result.status === "PASS").length;
const failCount = results.length - passCount;
for (const result of results) {
  const suffix = result.reason ? ` ${result.reason}` : "";
  process.stdout.write(`${result.status} ${result.id}${suffix}\n`);
}
process.stdout.write(
  `AIFINDER_PHASE_29AU_29BF_STATIC_ASSERTIONS total=${results.length} pass=${passCount} fail=${failCount}\n`,
);
process.exitCode = failCount === 0 ? 0 : 1;
