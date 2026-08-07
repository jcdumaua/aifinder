import ts from 'typescript';
import { compareUtf8, deepFreeze, parseStrictJson } from './canonical.mjs';
import { DiagnosticError, diagnostic } from './error-catalog.mjs';

export const DEPENDENCY_CLASSIFICATIONS = Object.freeze(['DECLARED_AND_MATCHED', 'DECLARED_BUT_UNPROVEN', 'UNDECLARED', 'UNRESOLVED_INDIRECTION']);
export const RUNNER_ADAPTERS_V1 = deepFreeze({ version: 1, adapters: [] });

const MAX_SOURCE_BYTES = 64 * 1024;
const MAX_EDGES = 2048;
const MAX_GRAPH_FILES = 256;
const MAX_NPM_DEPTH = 8;
const MAX_NPM_SCRIPTS = 64;
const MAX_NPM_VECTORS = 256;
const PATH_SUFFIX = /\.(?:c?js|mjs|ts|json|md|sh|txt|ya?ml)$/u;
const FS_METHODS = new Map([
  ['access', [{ index: 0, access: 'READ' }]], ['accessSync', [{ index: 0, access: 'READ' }]],
  ['appendFile', [{ index: 0, access: 'WRITE' }]], ['appendFileSync', [{ index: 0, access: 'WRITE' }]],
  ['chmod', [{ index: 0, access: 'WRITE' }]], ['chmodSync', [{ index: 0, access: 'WRITE' }]],
  ['copyFile', [{ index: 0, access: 'READ' }, { index: 1, access: 'WRITE' }]], ['copyFileSync', [{ index: 0, access: 'READ' }, { index: 1, access: 'WRITE' }]],
  ['createReadStream', [{ index: 0, access: 'READ' }]], ['createWriteStream', [{ index: 0, access: 'WRITE' }]],
  ['lstat', [{ index: 0, access: 'READ' }]], ['lstatSync', [{ index: 0, access: 'READ' }]],
  ['mkdir', [{ index: 0, access: 'WRITE' }]], ['mkdirSync', [{ index: 0, access: 'WRITE' }]],
  ['readFile', [{ index: 0, access: 'READ' }]], ['readFileSync', [{ index: 0, access: 'READ' }]],
  ['readdir', [{ index: 0, access: 'READ' }]], ['readdirSync', [{ index: 0, access: 'READ' }]],
  ['realpath', [{ index: 0, access: 'READ' }]], ['realpathSync', [{ index: 0, access: 'READ' }]],
  ['rename', [{ index: 0, access: 'WRITE' }, { index: 1, access: 'WRITE' }]], ['renameSync', [{ index: 0, access: 'WRITE' }, { index: 1, access: 'WRITE' }]],
  ['rm', [{ index: 0, access: 'WRITE' }]], ['rmSync', [{ index: 0, access: 'WRITE' }]],
  ['stat', [{ index: 0, access: 'READ' }]], ['statSync', [{ index: 0, access: 'READ' }]],
  ['unlink', [{ index: 0, access: 'WRITE' }]], ['unlinkSync', [{ index: 0, access: 'WRITE' }]],
  ['writeFile', [{ index: 0, access: 'WRITE' }]], ['writeFileSync', [{ index: 0, access: 'WRITE' }]],
]);
const CHILD_METHODS = new Set(['execFile', 'execFileSync', 'fork', 'spawn', 'spawnSync']);
const SHELL_METHODS = new Set(['exec', 'execSync']);
export const EXECUTABLE_PROFILE_VERSION = 1;
export const EXECUTABLE_PROFILE_IDENTITY = 'AIFINDER_EXECUTABLE_PROFILE_V1';
export const EXECUTABLE_PROFILE_V1 = deepFreeze({
  version: EXECUTABLE_PROFILE_VERSION,
  identity: EXECUTABLE_PROFILE_IDENTITY,
  paths: {
    '/bin/bash': 'bash', '/bin/dash': 'dash', '/bin/sh': 'sh', '/bin/test': 'test', '/bin/zsh': 'zsh',
    '/opt/homebrew/bin/gh': 'gh', '/opt/homebrew/bin/node': 'node', '/opt/homebrew/bin/npm': 'npm', '/opt/homebrew/bin/supabase': 'supabase', '/opt/homebrew/bin/vercel': 'vercel', '/opt/homebrew/bin/wget': 'wget',
    '/usr/bin/curl': 'curl', '/usr/bin/git': 'git', '/usr/bin/node': 'node', '/usr/bin/printf': 'printf', '/usr/bin/shasum': 'shasum', '/usr/bin/stat': 'stat', '/usr/bin/test': 'test', '/usr/bin/true': 'true', '/usr/bin/wc': 'wc', '/usr/bin/wget': 'wget',
    '/usr/local/bin/gh': 'gh', '/usr/local/bin/node': 'node', '/usr/local/bin/npm': 'npm', '/usr/local/bin/supabase': 'supabase', '/usr/local/bin/vercel': 'vercel', '/usr/local/bin/wget': 'wget',
  },
});
const EXECUTABLE_PATH_TO_NAME = new Map(Object.entries(EXECUTABLE_PROFILE_V1.paths));
const SAFE_MODULE_METHODS = new Map([
  ['node:assert', new Set(['deepEqual', 'doesNotMatch', 'doesNotReject', 'doesNotThrow', 'equal', 'fail', 'ifError', 'match', 'notDeepEqual', 'notEqual', 'ok', 'rejects', 'strictEqual', 'throws'])],
  ['node:assert/strict', new Set(['deepEqual', 'doesNotMatch', 'doesNotReject', 'doesNotThrow', 'equal', 'fail', 'ifError', 'match', 'notDeepEqual', 'notEqual', 'ok', 'rejects', 'strictEqual', 'throws'])],
  ['node:crypto', new Set(['createHash'])],
  ['node:path', new Set(['basename', 'delimiter', 'dirname', 'extname', 'format', 'isAbsolute', 'join', 'normalize', 'parse', 'relative', 'resolve', 'sep', 'toNamespacedPath'])],
  ['node:url', new Set(['fileURLToPath', 'pathToFileURL'])],
  ['node:util', new Set(['promisify'])],
]);
const AMBIGUOUS = /(?:^|\/)(?:02-Codex-Package-and-Prompt(?:\([^/]+\))?\.md|cleanup\.sh|run\.sh)$/u;

function unique(values) { return [...new Set(values)].sort(compareUtf8); }
function sortDiagnostics(records) { return records.sort((a, b) => compareUtf8(a.code, b.code) || compareUtf8(a.location_json_pointer, b.location_json_pointer) || compareUtf8(a.command_id_or_null ?? '', b.command_id_or_null ?? '')); }
function directoryOf(path) { const index = path.lastIndexOf('/'); return index === -1 ? '' : path.slice(0, index); }

function normalizeSegments(value, base = '') {
  if (typeof value !== 'string' || value === '' || value.startsWith('/') || value.includes('\\') || value.includes('\u0000')) return null;
  const rootRelative = !(value.startsWith('./') || value.startsWith('../'));
  const combined = rootRelative ? value : `${base}/${value}`;
  const output = [];
  for (const segment of combined.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') { if (output.length === 0) return null; output.pop(); } else output.push(segment);
  }
  return output.join('/');
}

function pathLike(value) { return value.startsWith('./') || value.startsWith('../') || value.includes('/') || PATH_SUFFIX.test(value); }
function executableIdentity(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.includes('\\') || value.includes('\u0000') || value.includes('//')) return null;
  const segments = value.slice(1).split('/');
  if (segments.length < 2 || segments.some((segment) => segment === '' || segment === '.' || segment === '..')) return null;
  const name = EXECUTABLE_PATH_TO_NAME.get(value);
  return name === undefined ? null : { path: value, name, profile_identity: EXECUTABLE_PROFILE_IDENTITY, profile_version: EXECUTABLE_PROFILE_VERSION };
}
function exactScriptBinding(argv, context, { allowCheck = false, analyzerKind } = {}) {
  const scriptIndex = allowCheck && argv[1] === '--check' ? 2 : 1;
  if (argv.length !== scriptIndex + 1) return false;
  const script = runtimePath(argv[scriptIndex] ?? '', context.commandCwd ?? '');
  if (script === null) return false;
  return context.sourceReferences?.has(script) === true && context.analyzedSourceKinds?.get(script) === analyzerKind;
}
function exactSafeUrl(value) { return /^https:\/\/[A-Za-z0-9.-]+(?::[0-9]+)?(?:[/?#][^\s{}\[\]\\]*)?$/u.test(value ?? ''); }
function hasAny(argv, patterns) { return argv.some((argument) => patterns.some((pattern) => typeof pattern === 'string' ? argument === pattern : pattern.test(argument))); }
function curlSurfaceSupported(argv) {
  let urls = 0;
  for (let index = 1; index < argv.length; index += 1) {
    const argument = argv[index];
    if (exactSafeUrl(argument)) { urls += 1; continue; }
    if (['-I', '--head', '--fail', '--silent', '--show-error', '-s', '-S'].includes(argument)) continue;
    if (['-X', '--request'].includes(argument)) { if (!['GET', 'HEAD'].includes(argv[index + 1])) return false; index += 1; continue; }
    if (/^--request=(?:GET|HEAD)$/u.test(argument)) continue;
    return false;
  }
  return urls === 1;
}
function ghGroupSurfaceSupported(argv) {
  if (!(['pr', 'run'].includes(argv[1]) && ['checks', 'list', 'view'].includes(argv[2]))) return false;
  for (let index = 3; index < argv.length; index += 1) {
    const argument = argv[index];
    if (/^(?:[0-9]+|[0-9a-f]{40})$/u.test(argument)) continue;
    if (['--json', '--jq', '--repo', '--limit'].includes(argument)) {
      const value = argv[index + 1];
      if (value === undefined || (argument === '--repo' && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(value)) || (argument === '--limit' && !/^[1-9][0-9]*$/u.test(value))) return false;
      index += 1; continue;
    }
    return false;
  }
  return true;
}
function ghApiSurfaceSupported(argv) {
  if (argv[1] !== 'api') return false;
  let endpointCount = 0;
  for (let index = 2; index < argv.length; index += 1) {
    const argument = argv[index];
    if (/^\/[A-Za-z0-9_./{}:-]+(?:\?[A-Za-z0-9_.,%=&{}:-]+)?$/u.test(argument)) { endpointCount += 1; continue; }
    if (['-X', '--method'].includes(argument)) { if (argv[index + 1] !== 'GET') return false; index += 1; continue; }
    if (argument === '--method=GET') continue;
    return false;
  }
  return endpointCount === 1;
}

export function deriveExecutableEffectVector(vector, context = {}) {
  const argv = [...vector];
  const executable = argv[0] ?? '';
  const executableProfile = executableIdentity(executable); const executableName = executableProfile?.name ?? '';
  const charges = { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 };
  const externalMutations = [];
  const localReads = []; const localWrites = [];
  const shellIdentity = ['bash', 'dash', 'sh', 'zsh'].includes(executableName);
  const nodeIdentity = executableName === 'node';
  const shellEval = shellIdentity && argv.slice(1).some((argument) => argument === '--command' || /^-[^-]*[cC]/u.test(argument));
  const nodeEval = nodeIdentity && hasAny(argv.slice(1), ['-e', '--eval', '-p', '--print']);
  if (shellEval || nodeEval) charges.compiled_commands += 1;
  let prohibitedGit = false;
  let supported = false;
  if (executableName === 'true') supported = argv.length === 1;
  else if (nodeIdentity) {
    const hooks = hasAny(argv.slice(1), ['-r', '--require', '--import', '--loader', '--experimental-loader', /^--(?:require|import|loader|experimental-loader)=/u]);
    supported = nodeEval || (!hooks && exactScriptBinding(argv, context, { allowCheck: true, analyzerKind: 'NODE' }));
  } else if (shellIdentity) supported = shellEval || exactScriptBinding(argv, context, { analyzerKind: 'SHELL' });
  else if (executableName === 'npm') supported = argv.length === 3 && argv[1] === 'run' && /^[A-Za-z0-9:_-]+$/u.test(argv[2]);
  else if (executableName === 'printf') supported = argv.length >= 2 && !hasAny(argv.slice(1), [/[|;&<>`]/u, /\$\(/u]);
  else if (executableName === 'stat') supported = argv.length >= 2 && argv.slice(1).every((argument) => !argument.startsWith('-') || ['-f', '-L'].includes(argument) || /^%[A-Za-z%:._-]+$/u.test(argument));
  else if (executableName === 'shasum') supported = argv.length >= 2 && argv.slice(1).every((argument, index) => !argument.startsWith('-') || argument === '-a' || (index > 0 && argv[index] === '-a' && argument === '256'));
  else if (executableName === 'test') supported = argv.length >= 2 && argv.slice(1).every((argument) => !/[|;&<>`]/u.test(argument) && !argument.includes('$('));
  else if (executableName === 'wc') supported = argv.length >= 2 && argv.slice(1).every((argument) => !argument.startsWith('-') || ['-c', '-l', '-w'].includes(argument));
  if (executableName === 'git') {
    const subcommand = argv[1] ?? '';
    const push = subcommand === 'push'; const commit = subcommand === 'commit';
    if (push) { charges.git_pushes += 1; charges.network += 1; }
    if (commit) charges.git_commits += 1;
    const force = argv.some((argument) => ['--force', '-f', '--force-with-lease', '--force-if-includes'].includes(argument) || /^--force(?:-with-lease|-if-includes)?=/u.test(argument) || /^-[^-]*f/iu.test(argument) || (push && /^\+.+/u.test(argument)));
    const destructive = (argv.includes('reset') && argv.includes('--hard')) || (argv.includes('clean') && argv.some((argument) => /^-[a-z]*f/iu.test(argument))) || (argv.includes('branch') && argv.includes('-D')) || (push && argv.includes('--delete'));
    prohibitedGit = force || destructive;
    const statusRead = subcommand === 'status' && argv.slice(2).every((argument) => ['--short', '--branch', '--porcelain', '--porcelain=v1', '--porcelain=v2'].includes(argument));
    const diffRead = subcommand === 'diff' && argv.slice(2).every((argument) => ['--cached', '--check', '--exit-code', '--name-only', '--name-status', '--no-ext-diff', '--no-textconv', '--numstat', '--quiet', '--stat'].includes(argument));
    const revParseRead = subcommand === 'rev-parse' && ((argv.length === 3 && ['HEAD', '--show-toplevel', '--is-inside-work-tree'].includes(argv[2])) || (argv.length === 4 && argv[2] === '--verify' && /^(?:HEAD|origin\/main|[0-9a-f]{40})$/u.test(argv[3])));
    const revListRead = subcommand === 'rev-list' && ((argv.length === 4 && argv[2] === '--count' && /^(?:HEAD|origin\/main|HEAD\.\.\.origin\/main)$/u.test(argv[3])) || (argv.length === 5 && argv[2] === '--left-right' && argv[3] === '--count' && argv[4] === 'HEAD...origin/main'));
    const showRead = subcommand === 'show' && argv.length >= 3 && argv.slice(2).every((argument) => ['-s', '--format=%H', '--format=%T', 'HEAD', 'origin/main'].includes(argument) || /^[0-9a-f]{40}(?:\^\{tree\})?$/u.test(argument));
    const lsFilesRead = subcommand === 'ls-files' && argv.slice(2).every((argument) => ['--cached', '--exclude-standard', '--others', '--stage'].includes(argument));
    const readOnly = statusRead || diffRead || revParseRead || revListRead || showRead || lsFilesRead;
    const exactCommit = argv.length === 4 && subcommand === 'commit' && argv[2] === '-m' && argv[3] !== '';
    const exactPush = argv.length === 4 && subcommand === 'push' && argv[2] === 'origin' && ['main', 'HEAD:main'].includes(argv[3]);
    const exactInitTarget = subcommand === 'init' && argv.length === 3 ? runtimePath(argv[2], context.commandCwd ?? '') : null;
    if (exactInitTarget !== null) localWrites.push(exactInitTarget);
    supported = !prohibitedGit && (readOnly || exactCommit || exactPush || exactInitTarget !== null);
  }
  if (executableName === 'curl') {
    charges.network += 1;
    supported = curlSurfaceSupported(argv);
  }
  if (executableName === 'wget') {
    charges.network += 1;
    const unsafe = hasAny(argv.slice(1), [/^--post-/u, '--method', /^--method=/u, '--body-data', /^--body-data=/u, '--body-file', /^--body-file=/u]);
    const urls = argv.slice(1).filter(exactSafeUrl);
    supported = !unsafe && urls.length === 1 && argv.slice(1).every((argument) => exactSafeUrl(argument) || ['--quiet', '-q', '--spider', '--server-response'].includes(argument));
  }
  if (executableName === 'gh') {
    charges.network += 1;
    supported = ghGroupSurfaceSupported(argv) || ghApiSurfaceSupported(argv);
  }
  if (executableName === 'vercel') {
    charges.network += 1;
    const subcommand = argv[1] ?? '';
    if (['deploy', 'remove', 'rm'].includes(subcommand)) {
      charges.deployments += 1;
      externalMutations.push('DEPLOYMENT');
    }
    supported = (argv.length === 2 && ['deploy', 'inspect'].includes(subcommand)) || (argv.length === 3 && ['remove', 'rm'].includes(subcommand) && /^[A-Za-z0-9][A-Za-z0-9._:/-]{3,239}$/u.test(argv[2]));
  }
  if (executableName === 'supabase') {
    const remote = argv.includes('--linked') || ['db', 'migration', 'functions'].includes(argv[1]);
    if (remote) charges.network += 1;
    const databaseMutation = argv[1] === 'db' && argv[2] === 'push';
    const deploymentMutation = argv[1] === 'functions' && argv[2] === 'deploy';
    if (databaseMutation) {
      charges.database += 1;
      externalMutations.push('DATABASE');
    }
    if (deploymentMutation || (argv.includes('functions') && argv.includes('deploy'))) {
      charges.deployments += 1;
      externalMutations.push('DEPLOYMENT');
    }
    if (argv.includes('db') && argv.includes('push') && !databaseMutation) { charges.database += 1; externalMutations.push('DATABASE'); }
    supported = (databaseMutation && argv.length === 4 && argv[3] === '--linked') ||
      (deploymentMutation && [3, 4].includes(argv.length) && (argv.length === 3 || argv[3] === '--linked')) ||
      (argv[1] === 'migration' && argv[2] === 'list' && argv.length === 4 && argv[3] === '--linked');
  }
  if (executableProfile === null) supported = false;
  return deepFreeze({ argv: [...argv], executable, executable_profile_identity: EXECUTABLE_PROFILE_IDENTITY, executable_profile_version: EXECUTABLE_PROFILE_VERSION, charges, injection: shellEval || nodeEval, prohibited_git: prohibitedGit, supported, external_mutations: unique(externalMutations), local_reads: unique(localReads), local_writes: unique(localWrites) });
}
function runtimePath(value, cwd) {
  if (!pathLike(value) || typeof value !== 'string' || value.startsWith('/') || value.includes('\\') || value.includes('\u0000')) return null;
  const base = normalizeSegments(cwd === '' ? '.' : cwd);
  if (base === null) return null;
  return normalizeSegments(`./${value}`, base);
}
function importPath(value, sourcePath) {
  if (value.startsWith('node:') || (!value.startsWith('.') && !value.startsWith('/'))) return undefined;
  return normalizeSegments(value, directoryOf(sourcePath));
}
function pushEdge(edges, edge) {
  if (edges.length >= MAX_EDGES) {
    if (edges.boundAdded !== true) {
      Object.defineProperty(edges, 'boundAdded', { value: true, writable: false, enumerable: false });
      edges.push({ kind: 'SOURCE', reference: '[extraction-edge-bound]', source_path: edge.source_path ?? '[bound]', unresolved: true });
    }
    return;
  }
  edges.push(edge);
}

function lexicalScope(node) {
  let current = node;
  while (current !== undefined && !ts.isSourceFile(current) && !ts.isBlock(current) && !ts.isFunctionLike(current)) current = current.parent;
  return current;
}

function buildLexicalResolver(sourceFile) {
  const bindings = new Map(); const mutatedBindings = new Set();
  function scopeBindings(scope) { if (!bindings.has(scope)) bindings.set(scope, new Map()); return bindings.get(scope); }
  function collectBindings(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const declarationList = node.parent;
      const isConst = ts.isVariableDeclarationList(declarationList) && (declarationList.flags & ts.NodeFlags.Const) !== 0;
      const scope = lexicalScope(node);
      const byName = scopeBindings(scope);
      if (!byName.has(node.name.text)) byName.set(node.name.text, []);
      byName.get(node.name.text).push({ node, isConst });
    }
    if (ts.isParameter(node) && ts.isIdentifier(node.name)) {
      const scope = lexicalScope(node.parent);
      const byName = scopeBindings(scope);
      if (!byName.has(node.name.text)) byName.set(node.name.text, []);
      byName.get(node.name.text).push({ node, isConst: false });
    }
    ts.forEachChild(node, collectBindings);
  }
  collectBindings(sourceFile);
  function candidateFor(identifier) {
    let scope = lexicalScope(identifier);
    while (scope !== undefined) {
      const candidates = bindings.get(scope)?.get(identifier.text) ?? [];
      const prior = candidates.filter((candidate) => candidate.node.pos < identifier.pos);
      if (prior.length > 0) return prior.at(-1);
      scope = lexicalScope(scope.parent);
    }
    return null;
  }
  function collectMutations(node) {
    let identifier = null;
    if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment && ts.isIdentifier(node.left)) identifier = node.left;
    if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment && (ts.isPropertyAccessExpression(node.left) || ts.isElementAccessExpression(node.left)) && ts.isIdentifier(node.left.expression)) identifier = node.left.expression;
    if ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) && ts.isIdentifier(node.operand) && [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator)) identifier = node.operand;
    const candidate = identifier === null ? null : candidateFor(identifier);
    if (candidate !== null) mutatedBindings.add(candidate.node);
    ts.forEachChild(node, collectMutations);
  }
  collectMutations(sourceFile);
  function resolveExpression(node, seen = new Set()) {
    if (!ts.isIdentifier(node)) return node;
    if (seen.has(node.text)) return null;
    let scope = lexicalScope(node);
    while (scope !== undefined) {
      const candidates = bindings.get(scope)?.get(node.text) ?? [];
      const prior = candidates.filter((candidate) => candidate.node.pos < node.pos);
      if (prior.length > 0) {
        const candidate = prior.at(-1);
        if (prior.length !== 1 || !candidate.isConst || candidate.node.initializer === undefined || mutatedBindings.has(candidate.node)) return null;
        return resolveExpression(candidate.node.initializer, new Set([...seen, node.text]));
      }
      scope = lexicalScope(scope.parent);
    }
    return null;
  }
  function resolve(identifier, seen = new Set()) {
    const expression = resolveExpression(identifier, seen);
    return expression === null ? null : staticString(expression, resolve, 1, seen);
  }
  resolve.expression = resolveExpression;
  return resolve;
}

function childShellOptionState(call, resolveIdentifier) {
  const trailing = call.arguments.slice(1);
  if (trailing.length === 0) return false;
  if (!ts.isArrayLiteralExpression(trailing[0])) return null;
  if (trailing.length === 1) return false;
  if (trailing.length !== 2 || !ts.isObjectLiteralExpression(trailing[1])) return null;
  const properties = trailing[1].properties;
  if (properties.length === 0) return false;
  if (properties.every((property) => ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) && property.name.text !== '__proto__') && properties.some((property) => property.name.text !== 'shell')) return 'UNRESOLVED';
  if (properties.length !== 1) return null;
  const property = properties[0];
  if (!ts.isPropertyAssignment(property) || ts.isComputedPropertyName(property.name) || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) || property.name.text !== 'shell') return null;
  const value = resolveIdentifier.expression(property.initializer);
  if (value?.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (value?.kind === ts.SyntaxKind.FalseKeyword) return false;
  return null;
}

function staticString(node, resolveIdentifier, depth = 0, seen = new Set()) {
  if (node === undefined || depth > 12) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isIdentifier(node)) return resolveIdentifier(node, seen);
  if (ts.isParenthesizedExpression(node)) return staticString(node.expression, resolveIdentifier, depth + 1, seen);
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = staticString(node.left, resolveIdentifier, depth + 1, seen); const right = staticString(node.right, resolveIdentifier, depth + 1, seen);
    return left === null || right === null ? null : left + right;
  }
  if (ts.isTemplateExpression(node)) {
    let value = node.head.text;
    for (const span of node.templateSpans) { const part = staticString(span.expression, resolveIdentifier, depth + 1, seen); if (part === null) return null; value += part + span.literal.text; }
    return value;
  }
  return null;
}

function accessName(expression, resolveIdentifier) {
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  if (ts.isElementAccessExpression(expression)) return staticString(expression.argumentExpression, resolveIdentifier);
  return null;
}

function accessBase(expression) {
  return ts.isPropertyAccessExpression(expression) || ts.isElementAccessExpression(expression) ? expression.expression : null;
}

function globalExpression(expression, aliases) {
  return ts.isIdentifier(expression) && (expression.text === 'globalThis' || expression.text === 'global' || aliases.globalNamespaces.has(expression.text));
}
function globalRootedExpression(expression, aliases) {
  if (globalExpression(expression, aliases)) return true;
  const base = accessBase(expression);
  return base !== null && globalRootedExpression(base, aliases);
}

function processExpression(expression, aliases, resolveIdentifier) {
  if (ts.isIdentifier(expression) && (expression.text === 'process' || aliases.processNamespaces.has(expression.text))) return true;
  const base = accessBase(expression);
  return base !== null && globalExpression(base, aliases) && accessName(expression, resolveIdentifier) === 'process';
}

function environmentExpression(expression, aliases, resolveIdentifier) {
  if (ts.isIdentifier(expression) && aliases.environmentNamespaces.has(expression.text)) return true;
  const base = accessBase(expression);
  return base !== null && processExpression(base, aliases, resolveIdentifier) && accessName(expression, resolveIdentifier) === 'env';
}

function exactProcessEnvironmentAccess(expression, resolveIdentifier) {
  if (!(ts.isPropertyAccessExpression(expression) || ts.isElementAccessExpression(expression))) return false;
  const environmentName = accessName(expression, resolveIdentifier);
  const environment = accessBase(expression);
  return environmentName !== null && /^[A-Z_][A-Z0-9_]*$/u.test(environmentName) &&
    environment !== null && (ts.isPropertyAccessExpression(environment) || ts.isElementAccessExpression(environment)) &&
    accessName(environment, resolveIdentifier) === 'env' && ts.isIdentifier(accessBase(environment)) && accessBase(environment).text === 'process';
}

function exactProcessOutputCall(call, resolveIdentifier) {
  if (!ts.isCallExpression(call) || call.arguments.length !== 1 || !(ts.isPropertyAccessExpression(call.expression) || ts.isElementAccessExpression(call.expression))) return false;
  if (accessName(call.expression, resolveIdentifier) !== 'write') return false;
  const stream = accessBase(call.expression);
  if (!(ts.isPropertyAccessExpression(stream) || ts.isElementAccessExpression(stream)) || !['stdout', 'stderr'].includes(accessName(stream, resolveIdentifier))) return false;
  if (!ts.isIdentifier(accessBase(stream)) || accessBase(stream).text !== 'process') return false;
  return staticString(call.arguments[0], resolveIdentifier) !== null || exactProcessEnvironmentAccess(call.arguments[0], resolveIdentifier);
}

function withinExactProcessSurface(node, resolveIdentifier) {
  let current = node;
  while (current !== undefined && !ts.isSourceFile(current)) {
    if (exactProcessEnvironmentAccess(current, resolveIdentifier) || (ts.isCallExpression(current) && exactProcessOutputCall(current, resolveIdentifier))) return true;
    current = current.parent;
  }
  return false;
}

function networkExpression(expression, aliases, resolveIdentifier) {
  if (ts.isIdentifier(expression) && (expression.text === 'fetch' || aliases.networkMethods.has(expression.text))) return true;
  const base = accessBase(expression);
  return base !== null && globalExpression(base, aliases) && accessName(expression, resolveIdentifier) === 'fetch';
}

function evaluationExpression(expression, aliases, resolveIdentifier) {
  if (ts.isIdentifier(expression) && (['eval', 'Function'].includes(expression.text) || aliases.evaluationMethods.has(expression.text))) return true;
  const base = accessBase(expression);
  return base !== null && globalExpression(base, aliases) && ['eval', 'Function'].includes(accessName(expression, resolveIdentifier));
}
function alternateLoaderReference(expression, aliases, resolveIdentifier) {
  const base = accessBase(expression); const name = accessName(expression, resolveIdentifier);
  if (base === null || !['binding', 'dlopen', 'getBuiltinModule', 'require'].includes(name)) return false;
  return processExpression(base, aliases, resolveIdentifier) || (ts.isIdentifier(base) && base.text === 'module') || globalExpression(base, aliases);
}
function hasDynamicControlAncestor(node) {
  let current = node.parent;
  while (current !== undefined && !ts.isSourceFile(current)) {
    if (ts.isFunctionLike(current) || ts.isForStatement(current) || ts.isForInStatement(current) || ts.isForOfStatement(current) || ts.isWhileStatement(current) || ts.isDoStatement(current) || ts.isIfStatement(current) || ts.isConditionalExpression(current) || ts.isSwitchStatement(current) || ts.isCaseClause(current) || ts.isDefaultClause(current) || ts.isTryStatement(current) || ts.isCatchClause(current)) return true;
    if (ts.isBinaryExpression(current) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(current.operatorToken.kind)) return true;
    current = current.parent;
  }
  return false;
}
function isTopLevelLinearCall(node) {
  let current = node;
  while (ts.isParenthesizedExpression(current.parent) || ts.isAwaitExpression(current.parent)) current = current.parent;
  return ts.isExpressionStatement(current.parent) && ts.isSourceFile(current.parent.parent);
}

function collectApiAliases(sourceFile, resolveIdentifier) {
  const aliases = {
    fsNamespaces: new Set(), fsMethods: new Map(), childNamespaces: new Set(), childMethods: new Map(),
    environmentNamespaces: new Set(), globalNamespaces: new Set(), processNamespaces: new Set(), networkMethods: new Set(), evaluationMethods: new Set(), requireMethods: new Set(['require']),
    moduleNamespaces: new Map(), moduleMethods: new Map(),
  };
  function registerModule(moduleName, local, imported = null) {
    if (typeof moduleName !== 'string') return;
    if (imported === null || imported === 'default') aliases.moduleNamespaces.set(local, moduleName);
    else aliases.moduleMethods.set(local, { moduleName, method: imported });
    const fsModule = ['fs', 'node:fs', 'node:fs/promises'].includes(moduleName);
    const childModule = ['child_process', 'node:child_process'].includes(moduleName);
    if (fsModule) { if (imported === null || imported === 'default' || imported === 'promises') aliases.fsNamespaces.add(local); else aliases.fsMethods.set(local, imported); }
    if (childModule) { if (imported === null || imported === 'default') aliases.childNamespaces.add(local); else aliases.childMethods.set(local, imported); }
  }
  function copyAlias(local, initializer) {
    if (ts.isIdentifier(initializer)) {
      if (initializer.text === 'globalThis' || initializer.text === 'global' || aliases.globalNamespaces.has(initializer.text)) aliases.globalNamespaces.add(local);
      if (initializer.text === 'process' || aliases.processNamespaces.has(initializer.text)) aliases.processNamespaces.add(local);
      if (aliases.fsNamespaces.has(initializer.text)) aliases.fsNamespaces.add(local);
      if (aliases.childNamespaces.has(initializer.text)) aliases.childNamespaces.add(local);
      if (aliases.environmentNamespaces.has(initializer.text)) aliases.environmentNamespaces.add(local);
      if (aliases.fsMethods.has(initializer.text)) aliases.fsMethods.set(local, aliases.fsMethods.get(initializer.text));
      if (aliases.childMethods.has(initializer.text)) aliases.childMethods.set(local, aliases.childMethods.get(initializer.text));
      if (initializer.text === 'fetch' || aliases.networkMethods.has(initializer.text)) aliases.networkMethods.add(local);
      if (['eval', 'Function'].includes(initializer.text) || aliases.evaluationMethods.has(initializer.text)) aliases.evaluationMethods.add(local);
    }
    if (globalExpression(initializer, aliases)) aliases.globalNamespaces.add(local);
    if (processExpression(initializer, aliases, resolveIdentifier)) aliases.processNamespaces.add(local);
    if (environmentExpression(initializer, aliases, resolveIdentifier)) aliases.environmentNamespaces.add(local);
    const method = resolvedApiMethod(initializer, aliases, resolveIdentifier);
    if (FS_METHODS.has(method)) aliases.fsMethods.set(local, method);
    if (CHILD_METHODS.has(method) || SHELL_METHODS.has(method)) aliases.childMethods.set(local, method);
    const base = accessBase(initializer); const name = accessName(initializer, resolveIdentifier);
    if (base !== null && globalExpression(base, aliases) && name === 'fetch') aliases.networkMethods.add(local);
    if (base !== null && globalExpression(base, aliases) && ['eval', 'Function'].includes(name)) aliases.evaluationMethods.add(local);
  }
  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.importClause !== undefined) {
      const moduleName = node.moduleSpecifier.text;
      if (node.importClause.name !== undefined) registerModule(moduleName, node.importClause.name.text, 'default');
      const bindings = node.importClause.namedBindings;
      if (bindings !== undefined && ts.isNamespaceImport(bindings)) registerModule(moduleName, bindings.name.text);
      if (bindings !== undefined && ts.isNamedImports(bindings)) for (const element of bindings.elements) registerModule(moduleName, element.name.text, element.propertyName?.text ?? element.name.text);
    }
    if (ts.isVariableDeclaration(node) && node.initializer !== undefined) {
      if (ts.isIdentifier(node.name)) copyAlias(node.name.text, node.initializer);
      const moduleName = requiredModuleName(node.initializer, aliases, resolveIdentifier);
      if (moduleName !== null) {
        if (ts.isIdentifier(node.name)) registerModule(moduleName, node.name.text);
        if (ts.isObjectBindingPattern(node.name)) for (const element of node.name.elements) if (ts.isIdentifier(element.name)) registerModule(moduleName, element.name.text, element.propertyName?.getText(sourceFile) ?? element.name.text);
      }
      if (ts.isObjectBindingPattern(node.name) && ts.isIdentifier(node.initializer) && (aliases.fsNamespaces.has(node.initializer.text) || aliases.childNamespaces.has(node.initializer.text))) {
        const moduleNameForAlias = aliases.fsNamespaces.has(node.initializer.text) ? 'node:fs' : 'node:child_process';
        for (const element of node.name.elements) if (ts.isIdentifier(element.name)) registerModule(moduleNameForAlias, element.name.text, element.propertyName?.getText(sourceFile) ?? element.name.text);
      }
      if (ts.isObjectBindingPattern(node.name) && environmentExpression(node.initializer, aliases, resolveIdentifier)) {
        // Environment destructuring is classified by the extraction visitor; no namespace alias is created.
      }
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment && ts.isIdentifier(node.left)) copyAlias(node.left.text, node.right);
    ts.forEachChild(node, visit);
  }
  visit(sourceFile); return aliases;
}

function requiredModuleName(expression, aliases, resolveIdentifier) {
  let candidate = expression;
  while (ts.isParenthesizedExpression(candidate) || ts.isAwaitExpression(candidate)) candidate = candidate.expression;
  if (!ts.isCallExpression(candidate)) return null;
  const directRequire = ts.isIdentifier(candidate.expression) && aliases.requireMethods.has(candidate.expression.text);
  if (!directRequire && candidate.expression.kind !== ts.SyntaxKind.ImportKeyword) return null;
  return staticString(candidate.arguments[0], resolveIdentifier);
}

function resolvedApiMethod(expression, aliases, resolveIdentifier) {
  if (ts.isIdentifier(expression)) return aliases.fsMethods.get(expression.text) ?? aliases.childMethods.get(expression.text) ?? null;
  if (!ts.isPropertyAccessExpression(expression)) return null;
  const base = accessBase(expression); const name = accessName(expression, resolveIdentifier);
  if (base !== null && name !== null) {
    if (ts.isIdentifier(base) && (aliases.fsNamespaces.has(base.text) || aliases.childNamespaces.has(base.text))) return name;
    const moduleName = requiredModuleName(base, aliases, resolveIdentifier);
    if (['fs', 'node:fs', 'node:fs/promises', 'child_process', 'node:child_process'].includes(moduleName)) return name;
    const nestedBase = accessBase(base); const nestedName = accessName(base, resolveIdentifier);
    if (nestedBase !== null && nestedName === 'promises' && ts.isIdentifier(nestedBase) && aliases.fsNamespaces.has(nestedBase.text)) return name;
  }
  return null;
}

function addStaticPath(edges, value, { kind = 'PATH', base = '', sourcePath, unresolvedLabel, allowBare = false, access = null }) {
  if (value === null) { pushEdge(edges, { kind, reference: unresolvedLabel, source_path: sourcePath, unresolved: true }); return; }
  if (allowBare && executableIdentity(value) !== null) return;
  const normalized = kind === 'SOURCE' ? importPath(value, sourcePath) : runtimePath(value, base);
  if (normalized === undefined) return;
  if (normalized === null) pushEdge(edges, { kind, reference: unresolvedLabel, source_path: sourcePath, unresolved: true });
  else pushEdge(edges, { kind, reference: normalized, source_path: sourcePath, ...(access === null ? {} : { access }) });
}

function unsupportedModule(moduleName) {
  if (moduleName === null || moduleName.startsWith('.') || moduleName.startsWith('/')) return false;
  if (['fs', 'node:fs', 'node:fs/promises', 'child_process', 'node:child_process'].includes(moduleName)) return false;
  if (SAFE_MODULE_METHODS.has(moduleName)) return false;
  return true;
}

function moduleCallIdentity(expression, aliases, resolveIdentifier) {
  if (ts.isIdentifier(expression)) return aliases.moduleMethods.get(expression.text) ?? (aliases.moduleNamespaces.has(expression.text) ? { moduleName: aliases.moduleNamespaces.get(expression.text), method: 'default' } : null);
  if (!ts.isPropertyAccessExpression(expression)) return null;
  if (!ts.isIdentifier(expression.expression)) return null;
  const moduleName = aliases.moduleNamespaces.get(expression.expression.text);
  return moduleName === undefined ? null : { moduleName, method: expression.name.text };
}

function exactModuleCallAllowed(identity) {
  if (identity === null) return false;
  if (identity.moduleName.startsWith('.') || identity.moduleName.startsWith('/')) return true;
  if (['fs', 'node:fs', 'node:fs/promises'].includes(identity.moduleName)) return FS_METHODS.has(identity.method);
  if (['child_process', 'node:child_process'].includes(identity.moduleName)) return CHILD_METHODS.has(identity.method) || SHELL_METHODS.has(identity.method);
  return SAFE_MODULE_METHODS.get(identity.moduleName)?.has(identity.method) === true;
}

function knownApiNamespace(expression, aliases, resolveIdentifier) {
  if (ts.isIdentifier(expression) && (aliases.fsNamespaces.has(expression.text) || aliases.childNamespaces.has(expression.text))) return true;
  if (['fs', 'node:fs', 'node:fs/promises', 'child_process', 'node:child_process'].includes(requiredModuleName(expression, aliases, resolveIdentifier))) return true;
  const base = accessBase(expression); const name = accessName(expression, resolveIdentifier);
  if (base !== null && name === 'promises' && ts.isIdentifier(base) && aliases.fsNamespaces.has(base.text)) return true;
  return false;
}

function unresolvedCapability(edges, sourcePath, reference = '[unsupported-capability]') {
  pushEdge(edges, { kind: 'CAPABILITY', reference, source_path: sourcePath, unresolved: true });
}

function modeledHashExpression(call, aliases, resolveIdentifier) {
  if (!ts.isCallExpression(call) || !call.arguments.every((argument) => staticString(argument, resolveIdentifier) !== null)) return false;
  const identity = moduleCallIdentity(call.expression, aliases, resolveIdentifier);
  if (identity?.moduleName === 'node:crypto' && identity.method === 'createHash') return call.arguments.length === 1;
  if (!(ts.isPropertyAccessExpression(call.expression) || ts.isElementAccessExpression(call.expression))) return false;
  const method = accessName(call.expression, resolveIdentifier);
  return ['update', 'digest'].includes(method) && ts.isCallExpression(accessBase(call.expression)) && modeledHashExpression(accessBase(call.expression), aliases, resolveIdentifier);
}
function withinTopLevelModeledHash(node, aliases, resolveIdentifier) {
  let current = node;
  while (current.parent !== undefined && !ts.isSourceFile(current.parent)) current = current.parent;
  return ts.isExpressionStatement(current) && ts.isCallExpression(current.expression) && modeledHashExpression(current.expression, aliases, resolveIdentifier);
}

function extractTypeScript(source, sourcePath, commandCwd) {
  if (Buffer.byteLength(source) > MAX_SOURCE_BYTES) return { edges: [{ kind: 'SOURCE', reference: '[source-bound]', source_path: sourcePath, unresolved: true }], vectors: [] };
  const scriptKind = sourcePath.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS;
  const sourceFile = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, scriptKind);
  const resolveIdentifier = buildLexicalResolver(sourceFile);
  const aliases = collectApiAliases(sourceFile, resolveIdentifier);
  const edges = []; const vectors = [];
  if (sourceFile.parseDiagnostics.length > 0) unresolvedCapability(edges, sourcePath, '[source-parse-diagnostic]');
  function moduleReference(node) {
    const value = staticString(node, resolveIdentifier);
    if (value === null) unresolvedCapability(edges, sourcePath, '[computed-import]');
    else if (unsupportedModule(value)) unresolvedCapability(edges, sourcePath, '[unsupported-external-module]');
    return value;
  }
  function pushEnvironment(name) {
    if (name === null) pushEdge(edges, { kind: 'ENVIRONMENT', reference: '[computed-environment]', source_path: sourcePath, unresolved: true });
    else pushEdge(edges, { kind: 'ENVIRONMENT', reference: name, source_path: sourcePath });
  }
  function visit(node) {
    if (ts.isFunctionLike(node) || ts.isClassDeclaration(node) || ts.isClassExpression(node) || ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node) || ts.isWhileStatement(node) || ts.isDoStatement(node) || ts.isIfStatement(node) || ts.isConditionalExpression(node) || ts.isSwitchStatement(node) || ts.isTryStatement(node) || ts.isCatchClause(node)) unresolvedCapability(edges, sourcePath, '[source-language-subset]');
    if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) unresolvedCapability(edges, sourcePath, '[source-language-assignment]');
    if (ts.isMetaProperty(node)) unresolvedCapability(edges, sourcePath, '[runtime-meta-capability]');
    if (ts.isImportEqualsDeclaration(node)) unresolvedCapability(edges, sourcePath, '[alternate-module-loader]');
    if (ts.isExportDeclaration(node)) unresolvedCapability(edges, sourcePath, '[capability-re-export]');
    if (ts.isExportAssignment(node) && (knownApiNamespace(node.expression, aliases, resolveIdentifier) || moduleCallIdentity(node.expression, aliases, resolveIdentifier) !== null || globalExpression(node.expression, aliases) || processExpression(node.expression, aliases, resolveIdentifier))) unresolvedCapability(edges, sourcePath, '[capability-export]');
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier !== undefined) {
      const moduleName = moduleReference(node.moduleSpecifier);
      addStaticPath(edges, moduleName, { kind: 'SOURCE', sourcePath, unresolvedLabel: '[computed-import]' });
    }
    if ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) && environmentExpression(node.expression, aliases, resolveIdentifier)) pushEnvironment(accessName(node, resolveIdentifier));
    if (environmentExpression(node, aliases, resolveIdentifier)) {
      const parentUsesStaticMember = (ts.isPropertyAccessExpression(node.parent) || ts.isElementAccessExpression(node.parent)) && node.parent.expression === node;
      const parentDestructures = ts.isVariableDeclaration(node.parent) && ts.isObjectBindingPattern(node.parent.name) && node.parent.initializer === node;
      if (!parentUsesStaticMember && !parentDestructures) pushEdge(edges, { kind: 'ENVIRONMENT', reference: '[unbounded-environment-namespace]', source_path: sourcePath, unresolved: true });
    }
    if (ts.isVariableDeclaration(node) && node.initializer !== undefined && ts.isObjectBindingPattern(node.name) && environmentExpression(node.initializer, aliases, resolveIdentifier)) {
      for (const element of node.name.elements) {
        const environmentName = element.propertyName?.getText(sourceFile) ?? element.name.getText(sourceFile);
        if (/^[A-Z_][A-Z0-9_]*$/u.test(environmentName)) pushEdge(edges, { kind: 'ENVIRONMENT', reference: environmentName, source_path: sourcePath });
        else pushEdge(edges, { kind: 'ENVIRONMENT', reference: '[computed-environment-destructure]', source_path: sourcePath, unresolved: true });
      }
    }
    if (ts.isVariableDeclaration(node) && node.initializer !== undefined && ts.isObjectBindingPattern(node.name) && (globalExpression(node.initializer, aliases) || processExpression(node.initializer, aliases, resolveIdentifier))) unresolvedCapability(edges, sourcePath, '[destructured-global-capability]');
    if (ts.isVariableDeclaration(node) && node.initializer !== undefined && ts.isObjectBindingPattern(node.name) && ts.isIdentifier(node.initializer) && aliases.moduleNamespaces.has(node.initializer.text) && !aliases.fsNamespaces.has(node.initializer.text) && !aliases.childNamespaces.has(node.initializer.text)) unresolvedCapability(edges, sourcePath, '[destructured-module-capability]');
    if (ts.isVariableDeclaration(node) && node.initializer !== undefined && ts.isIdentifier(node.initializer) && (node.initializer.text === 'require' || aliases.moduleNamespaces.has(node.initializer.text) || aliases.moduleMethods.has(node.initializer.text))) unresolvedCapability(edges, sourcePath, '[aliased-module-capability]');
    if (ts.isVariableDeclaration(node) && node.initializer !== undefined && ts.isIdentifier(node.name) && (globalExpression(node.initializer, aliases) || processExpression(node.initializer, aliases, resolveIdentifier) || environmentExpression(node.initializer, aliases, resolveIdentifier))) unresolvedCapability(edges, sourcePath, '[aliased-global-capability]');
    if (ts.isVariableDeclaration(node) && node.initializer !== undefined && ts.isIdentifier(node.name)) {
      const copiedMethod = resolvedApiMethod(node.initializer, aliases, resolveIdentifier);
      if (FS_METHODS.has(copiedMethod) || CHILD_METHODS.has(copiedMethod) || SHELL_METHODS.has(copiedMethod) || moduleCallIdentity(node.initializer, aliases, resolveIdentifier) !== null || networkExpression(node.initializer, aliases, resolveIdentifier) || evaluationExpression(node.initializer, aliases, resolveIdentifier)) unresolvedCapability(edges, sourcePath, '[aliased-capability-method]');
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment && (ts.isObjectLiteralExpression(node.left) || ts.isArrayLiteralExpression(node.left))) {
      if (knownApiNamespace(node.right, aliases, resolveIdentifier) || globalExpression(node.right, aliases) || processExpression(node.right, aliases, resolveIdentifier)) unresolvedCapability(edges, sourcePath, '[destructuring-capability-assignment]');
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) {
      const assignedMethod = resolvedApiMethod(node.right, aliases, resolveIdentifier);
      if (FS_METHODS.has(assignedMethod) || CHILD_METHODS.has(assignedMethod) || SHELL_METHODS.has(assignedMethod) || moduleCallIdentity(node.right, aliases, resolveIdentifier) !== null || networkExpression(node.right, aliases, resolveIdentifier) || evaluationExpression(node.right, aliases, resolveIdentifier)) unresolvedCapability(edges, sourcePath, '[assigned-capability-alias]');
    }
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const escapedMethod = resolvedApiMethod(node, aliases, resolveIdentifier);
      const capabilityReference = FS_METHODS.has(escapedMethod) || CHILD_METHODS.has(escapedMethod) || SHELL_METHODS.has(escapedMethod) || networkExpression(node, aliases, resolveIdentifier) || evaluationExpression(node, aliases, resolveIdentifier);
      const directCallee = ts.isCallExpression(node.parent) && node.parent.expression === node;
      const copiedAlias = (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name) && node.parent.initializer === node) || (ts.isBinaryExpression(node.parent) && node.parent.right === node && ts.isIdentifier(node.parent.left));
      const invocationAdapter = (ts.isPropertyAccessExpression(node.parent) || ts.isElementAccessExpression(node.parent)) && node.parent.expression === node && ['bind', 'call', 'apply'].includes(accessName(node.parent, resolveIdentifier));
      if (capabilityReference && !directCallee && !copiedAlias && !invocationAdapter) unresolvedCapability(edges, sourcePath, '[escaped-capability-reference]');
      if (ts.isElementAccessExpression(node) && (knownApiNamespace(node.expression, aliases, resolveIdentifier) || globalExpression(node.expression, aliases) || processExpression(node.expression, aliases, resolveIdentifier) || environmentExpression(node.expression, aliases, resolveIdentifier) || (ts.isIdentifier(node.expression) && aliases.moduleNamespaces.has(node.expression.text)))) unresolvedCapability(edges, sourcePath, '[computed-capability-access]');
      if (node.questionDotToken !== undefined && (knownApiNamespace(node.expression, aliases, resolveIdentifier) || globalExpression(node.expression, aliases) || processExpression(node.expression, aliases, resolveIdentifier) || (ts.isIdentifier(node.expression) && aliases.moduleNamespaces.has(node.expression.text)))) unresolvedCapability(edges, sourcePath, '[optional-capability-access]');
      const directModuleIdentity = moduleCallIdentity(node, aliases, resolveIdentifier);
      const directModuleCallee = ts.isCallExpression(node.parent) && node.parent.expression === node;
      if (directModuleIdentity !== null && !directModuleCallee) unresolvedCapability(edges, sourcePath, '[escaped-module-capability]');
      if (alternateLoaderReference(node, aliases, resolveIdentifier)) unresolvedCapability(edges, sourcePath, '[alternate-module-loader]');
    }
    if (ts.isIdentifier(node)) {
      const capabilityIdentifier = aliases.fsMethods.has(node.text) || aliases.childMethods.has(node.text) || aliases.moduleMethods.has(node.text) || aliases.networkMethods.has(node.text) || aliases.evaluationMethods.has(node.text) || ['fetch', 'eval', 'Function'].includes(node.text);
      const declarationName = (ts.isVariableDeclaration(node.parent) && node.parent.name === node) || (ts.isBindingElement(node.parent) && (node.parent.name === node || node.parent.propertyName === node)) || (ts.isImportSpecifier(node.parent) && (node.parent.name === node || node.parent.propertyName === node)) || (ts.isImportClause(node.parent) && node.parent.name === node) || (ts.isNamespaceImport(node.parent) && node.parent.name === node) || (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) || (ts.isPropertyAssignment(node.parent) && node.parent.name === node);
      const directCallee = ts.isCallExpression(node.parent) && node.parent.expression === node;
      const copiedAlias = (ts.isVariableDeclaration(node.parent) && node.parent.initializer === node) || (ts.isBinaryExpression(node.parent) && node.parent.right === node && ts.isIdentifier(node.parent.left));
      if (capabilityIdentifier && !declarationName && !directCallee && !copiedAlias) unresolvedCapability(edges, sourcePath, '[escaped-capability-reference]');
      const moduleNamespaceUse = aliases.moduleNamespaces.has(node.text) && !declarationName;
      const directModuleBase = (ts.isPropertyAccessExpression(node.parent) || ts.isElementAccessExpression(node.parent)) && node.parent.expression === node;
      if (moduleNamespaceUse && !directModuleBase) unresolvedCapability(edges, sourcePath, '[escaped-module-namespace]');
      if (['Bun', 'Deno', 'EventSource', 'Function', 'Object', 'Proxy', 'Reflect', 'WebSocket', 'Worker', 'XMLHttpRequest', 'eval', 'fetch', 'global', 'globalThis', 'module', 'require'].includes(node.text) || (node.text === 'process' && !withinExactProcessSurface(node, resolveIdentifier))) unresolvedCapability(edges, sourcePath, '[categorical-runtime-capability]');
    }
    if (ts.isCallExpression(node)) {
      const directRequire = ts.isIdentifier(node.expression) && aliases.requireMethods.has(node.expression.text);
      const requireBase = accessBase(node.expression); const requireName = accessName(node.expression, resolveIdentifier);
      const globalRequire = requireBase !== null && globalExpression(requireBase, aliases) && requireName === 'require';
      const alternateRequire = (ts.isPropertyAccessExpression(node.expression) || ts.isElementAccessExpression(node.expression)) && accessName(node.expression, resolveIdentifier) === 'require' && !globalRequire;
      if (alternateRequire || globalRequire) unresolvedCapability(edges, sourcePath, '[alternate-module-loader]');
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword || directRequire) {
        const moduleName = moduleReference(node.arguments[0]);
        addStaticPath(edges, moduleName, { kind: 'SOURCE', sourcePath, unresolvedLabel: '[computed-import]' });
      }
      const method = resolvedApiMethod(node.expression, aliases, resolveIdentifier);
      if (FS_METHODS.has(method)) {
        for (const operand of FS_METHODS.get(method)) addStaticPath(edges, staticString(node.arguments[operand.index], resolveIdentifier), { base: commandCwd, sourcePath, unresolvedLabel: `[computed-fs-${method}]`, access: operand.access });
      }
      if (CHILD_METHODS.has(method)) {
        const executable = staticString(node.arguments[0], resolveIdentifier);
        addStaticPath(edges, executable, { base: commandCwd, sourcePath, unresolvedLabel: '[computed-child-executable]', allowBare: true });
        const argv = node.arguments[1];
        const values = [];
        if (argv !== undefined) {
          if (!ts.isArrayLiteralExpression(argv)) pushEdge(edges, { kind: 'PATH', reference: '[computed-child-argv]', source_path: sourcePath, unresolved: true });
          else for (const argument of argv.elements) {
            const value = staticString(argument, resolveIdentifier);
            if (value === null) pushEdge(edges, { kind: 'PATH', reference: '[computed-child-argv]', source_path: sourcePath, unresolved: true });
            else { values.push(value); if (pathLike(value)) addStaticPath(edges, value, { base: commandCwd, sourcePath, unresolvedLabel: '[computed-child-argv]' }); }
          }
        }
        if (executable !== null) vectors.push([executable, ...values]);
        const shellState = childShellOptionState(node, resolveIdentifier);
        if (shellState !== false) {
          if (shellState === 'UNRESOLVED') pushEdge(edges, { kind: 'COMMAND', reference: '[unresolved-child-options]', source_path: sourcePath, unresolved: true });
          else {
            pushEdge(edges, { kind: 'COMMAND', reference: shellState === true ? '[child-shell-true]' : '[unresolved-child-options]', source_path: sourcePath, injection: true });
            if (shellState === null) pushEdge(edges, { kind: 'COMMAND', reference: '[unresolved-child-options]', source_path: sourcePath, unresolved: true });
            vectors.push(['/bin/sh', '-c', shellState === true ? '[child-shell-true]' : '[unresolved-child-options]']);
          }
        }
      } else if (SHELL_METHODS.has(method)) {
        pushEdge(edges, { kind: 'COMMAND', reference: '[shell-command-string]', source_path: sourcePath, injection: true });
        vectors.push(['/bin/sh', '-c', staticString(node.arguments[0], resolveIdentifier) ?? '[unresolved-shell-command]']);
      } else if (!FS_METHODS.has(method)) {
        const calleeBase = accessBase(node.expression);
        const knownNamespace = calleeBase !== null && knownApiNamespace(calleeBase, aliases, resolveIdentifier);
        const knownMethodAlias = ts.isIdentifier(node.expression) && (aliases.fsMethods.has(node.expression.text) || aliases.childMethods.has(node.expression.text));
        if (knownNamespace || knownMethodAlias) unresolvedCapability(edges, sourcePath, '[unsupported-capability-method]');
      }
      if ((FS_METHODS.has(method) || CHILD_METHODS.has(method) || SHELL_METHODS.has(method) || networkExpression(node.expression, aliases, resolveIdentifier) || evaluationExpression(node.expression, aliases, resolveIdentifier)) && hasDynamicControlAncestor(node)) unresolvedCapability(edges, sourcePath, '[dynamic-effect-multiplicity]');
      const importedCall = moduleCallIdentity(node.expression, aliases, resolveIdentifier);
      if (importedCall !== null && !exactModuleCallAllowed(importedCall)) unresolvedCapability(edges, sourcePath, '[unsupported-module-method]');
      const exactDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1 && staticString(node.arguments[0], resolveIdentifier) !== null;
      const exactOutputCall = exactProcessOutputCall(node, resolveIdentifier);
      const exactHashCall = withinTopLevelModeledHash(node, aliases, resolveIdentifier);
      const exactModeledCall = FS_METHODS.has(method) || CHILD_METHODS.has(method) || SHELL_METHODS.has(method) || exactOutputCall || exactHashCall || (importedCall !== null && exactModuleCallAllowed(importedCall) && !importedCall.moduleName.startsWith('.') && !importedCall.moduleName.startsWith('/')) || exactDynamicImport;
      if (!exactModeledCall || (!isTopLevelLinearCall(node) && !exactHashCall)) unresolvedCapability(edges, sourcePath, '[source-language-call]');
      const callResultBase = accessBase(node.expression);
      if (!exactHashCall && (ts.isCallExpression(node.expression) || (callResultBase !== null && ts.isNewExpression(callResultBase)) || (callResultBase !== null && ts.isCallExpression(callResultBase)))) unresolvedCapability(edges, sourcePath, '[unmodeled-call-result-callee]');
      const chainedBase = accessBase(node.expression);
      if ((chainedBase !== null && requiredModuleName(chainedBase, aliases, resolveIdentifier) !== null) || (ts.isCallExpression(node.expression) && requiredModuleName(node.expression, aliases, resolveIdentifier) !== null)) unresolvedCapability(edges, sourcePath, '[chained-module-loader-result]');
      const globalBase = accessBase(node.expression); const globalName = accessName(node.expression, resolveIdentifier);
      const networkCall = networkExpression(node.expression, aliases, resolveIdentifier);
      const evaluationCall = evaluationExpression(node.expression, aliases, resolveIdentifier);
      if (networkCall) vectors.push(['/usr/bin/curl', staticString(node.arguments[0], resolveIdentifier) ?? '[dynamic-network-target]']);
      if (evaluationCall) {
        pushEdge(edges, { kind: 'COMMAND', reference: '[global-evaluation]', source_path: sourcePath, injection: true });
        vectors.push(['/usr/bin/node', '-e', '[global-evaluation]']);
      }
      const unsupportedGlobal = globalBase !== null && ts.isIdentifier(globalBase) && ['Bun', 'Deno'].includes(globalBase.text);
      const unknownGlobalCall = globalBase !== null && globalExpression(globalBase, aliases) && !networkCall && !evaluationCall && globalName !== 'require';
      const processBinding = globalBase !== null && processExpression(globalBase, aliases, resolveIdentifier) && globalName === 'binding';
      const directProcessCapability = globalBase !== null && processExpression(globalBase, aliases, resolveIdentifier) && !exactOutputCall;
      const adapterName = accessName(node.expression, resolveIdentifier); const adapterTarget = accessBase(node.expression);
      const adapterMethod = adapterTarget === null ? null : resolvedApiMethod(adapterTarget, aliases, resolveIdentifier);
      const unsupportedCapabilityAdapter = ['bind', 'call', 'apply'].includes(adapterName) && adapterTarget !== null && (FS_METHODS.has(adapterMethod) || CHILD_METHODS.has(adapterMethod) || SHELL_METHODS.has(adapterMethod) || networkExpression(adapterTarget, aliases, resolveIdentifier) || evaluationExpression(adapterTarget, aliases, resolveIdentifier) || moduleCallIdentity(adapterTarget, aliases, resolveIdentifier) !== null);
      const unknownOptionalOrComputed = (node.questionDotToken !== undefined || (ts.isElementAccessExpression(node.expression) && globalName === null)) && !networkCall && method === null;
      if (unsupportedGlobal || unknownGlobalCall || processBinding || directProcessCapability || (globalRootedExpression(node.expression, aliases) && !networkCall && !evaluationCall) || unsupportedCapabilityAdapter || unknownOptionalOrComputed) unresolvedCapability(edges, sourcePath, '[unsupported-capability-call]');
    }
    if (ts.isNewExpression(node)) {
      const importedConstructor = moduleCallIdentity(node.expression, aliases, resolveIdentifier);
      const globalConstructor = ts.isIdentifier(node.expression) && ['EventSource', 'Function', 'Proxy', 'WebSocket', 'XMLHttpRequest'].includes(node.expression.text);
      if (importedConstructor !== null || globalConstructor || globalRootedExpression(node.expression, aliases)) unresolvedCapability(edges, sourcePath, '[unsupported-capability-constructor]');
      unresolvedCapability(edges, sourcePath, '[source-language-constructor]');
    }
    if ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) && globalExpression(node.expression, aliases) && ['Object', 'Proxy', 'Reflect'].includes(accessName(node, resolveIdentifier))) unresolvedCapability(edges, sourcePath, '[reflection-capability]');
    if ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) && globalExpression(node.expression, aliases) && !['Function', 'eval', 'fetch', 'process'].includes(accessName(node, resolveIdentifier))) unresolvedCapability(edges, sourcePath, '[unknown-global-capability]');
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return { edges, vectors };
}

function shellLineHasUnmodeledCompound(line) {
  let quote = null;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quote !== null) { if (character === quote && line[index - 1] !== '\\') quote = null; continue; }
    if (character === "'" || character === '"') { quote = character; continue; }
    if (character === '`' || character === ';' || character === '<' || character === '>' || character === '|') return true;
    if (character === '&') return true;
    if (character === '$' && line[index + 1] === '(') return true;
  }
  return false;
}
function shellTokens(line) {
  const tokens = line.match(/(?:"[^"\\]*"|'[^']*'|[^\s'"\\]+)/gu) ?? [];
  return tokens.join(' ').length === line.length - (line.match(/\s/gu) ?? []).length + Math.max(0, tokens.length - 1) ? tokens : null;
}

function literalShellAssignment(line) {
  const match = /^([A-Za-z_][A-Za-z0-9_]*)=(?:'([^']*)'|"([^"$`\\]*)"|([A-Za-z0-9_./:@%+,=-]+))$/u.exec(line);
  return match === null ? null : { name: match[1], value: match[2] ?? match[3] ?? match[4] };
}

function expandShellArgument(token, definitions) {
  if (token.startsWith("'") && token.endsWith("'")) return token.slice(1, -1);
  if (token.startsWith('"') && token.endsWith('"')) {
    let unresolved = false;
    const value = token.slice(1, -1).replace(/\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))/gu, (match, braced, plain) => {
      const name = braced ?? plain;
      if (!definitions.has(name)) { unresolved = true; return match; }
      return definitions.get(name);
    });
    return unresolved || value.includes('$') ? null : value;
  }
  if (token.includes('$') || /[?*\[]/u.test(token) || token.startsWith('~') || /\{[^}\n]*,[^}\n]*\}/u.test(token)) return null;
  return token;
}

function analyzeShell(source, sourcePath, commandCwd) {
  if (Buffer.byteLength(source) > MAX_SOURCE_BYTES) return { edges: [{ kind: 'SOURCE', reference: '[source-bound]', source_path: sourcePath, unresolved: true }], vectors: [] };
  const edges = []; const vectors = []; const definitions = new Map();
  for (const [lineIndex, rawLine] of source.split('\n').entries()) {
    const line = rawLine.trim(); if (line === '' || line.startsWith('#')) continue;
    const lineNumber = lineIndex + 1;
    if (shellLineHasUnmodeledCompound(line)) { pushEdge(edges, { kind: 'COMMAND', reference: '[unmodeled-shell-compound]', source_path: sourcePath, line: lineNumber, unresolved: true }); continue; }
    if (/(?:\$\(|`|<\(|>\(|(?:^|\s)(?:eval|sh\s+-c|bash\s+-c)(?:\s|$))/u.test(line)) { pushEdge(edges, { kind: 'COMMAND', reference: '[shell-evaluation]', source_path: sourcePath, line: lineNumber, injection: true }); continue; }
    const assignment = literalShellAssignment(line);
    if (assignment !== null) { definitions.set(assignment.name, assignment.value); continue; }
    const tokens = shellTokens(line);
    if (tokens === null || tokens.length === 0) { pushEdge(edges, { kind: 'COMMAND', reference: '[unsupported-shell-line]', source_path: sourcePath, line: lineNumber, unresolved: true }); continue; }
    const expanded = tokens.map((token) => expandShellArgument(token, definitions));
    if (expanded.some((token) => token === null)) {
      for (const match of line.matchAll(/\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))/gu)) {
        const name = match[1] ?? match[2];
        if (!definitions.has(name)) pushEdge(edges, { kind: 'VARIABLE', reference: name, source_path: sourcePath, line: lineNumber, unbound: true });
      }
      pushEdge(edges, { kind: 'COMMAND', reference: '[unmodeled-shell-expansion]', source_path: sourcePath, line: lineNumber, unresolved: true });
      continue;
    }
    const sourceLine = ['source', '.'].includes(expanded[0]);
    if (sourceLine) {
      if (expanded.length !== 2) pushEdge(edges, { kind: 'SOURCE', reference: '[computed-source]', source_path: sourcePath, line: lineNumber, unresolved: true });
      else {
        const normalizedSource = runtimePath(expanded[1], commandCwd);
        if (normalizedSource === null) pushEdge(edges, { kind: 'SOURCE', reference: '[computed-source]', source_path: sourcePath, line: lineNumber, unresolved: true });
        else pushEdge(edges, { kind: 'SOURCE', reference: normalizedSource, source_path: sourcePath, line: lineNumber });
      }
      continue;
    }
    vectors.push(expanded);
    for (const argument of expanded.slice(1)) if (!exactSafeUrl(argument) && pathLike(argument)) addStaticPath(edges, argument, { base: commandCwd, sourcePath, unresolvedLabel: '[computed-shell-path]' });
  }
  return { edges, vectors };
}

function extractShell(source, sourcePath, commandCwd) { return analyzeShell(source, sourcePath, commandCwd).edges; }
function shellCapabilityVectors(source, sourcePath, commandCwd) { return analyzeShell(source, sourcePath, commandCwd).vectors; }

export function deriveSourceCapabilities({ content, sourcePath, commandCwd, environmentNames = [] }) {
  void environmentNames;
  if (sourcePath.endsWith('.sh')) return deepFreeze({ ...analyzeShell(content, sourcePath, commandCwd), analyzer_kind: 'SHELL' });
  if (/\.(?:c?js|mjs|ts)$/u.test(sourcePath)) return deepFreeze({ ...extractTypeScript(content, sourcePath, commandCwd), analyzer_kind: 'NODE' });
  return deepFreeze({ edges: [], vectors: [], analyzer_kind: null });
}

export function deriveCommandSourceGraph({ command, snapshotByPath, commandCwd = command.cwd }) {
  const declaredSources = new Set(command.source_references); const analyzedSourceKinds = new Map();
  const edges = []; const vectors = []; const queue = [...command.source_references]; const visited = new Set(); const shellAdjacency = new Map();
  while (queue.length > 0 && visited.size < MAX_GRAPH_FILES) {
    const sourcePath = queue.shift(); if (visited.has(sourcePath)) continue; visited.add(sourcePath);
    const content = snapshotByPath.get(sourcePath)?.content_utf8;
    if (content === undefined) continue;
    const capability = deriveSourceCapabilities({ content, sourcePath, commandCwd, environmentNames: command.environment_names });
    if (capability.analyzer_kind !== null && !capability.edges.some((edge) => edge.unresolved)) analyzedSourceKinds.set(sourcePath, capability.analyzer_kind);
    for (const edge of capability.edges) {
      if (edge.kind !== 'SOURCE' || edge.unresolved) { pushEdge(edges, edge); continue; }
      const referencedKind = edge.reference.endsWith('.sh') ? 'SHELL' : /\.(?:c?js|mjs|ts)$/u.test(edge.reference) ? 'NODE' : null;
      if (referencedKind !== capability.analyzer_kind) {
        pushEdge(edges, { ...edge, unresolved: true });
        continue;
      }
      if (capability.analyzer_kind === 'SHELL') {
        if (!shellAdjacency.has(sourcePath)) shellAdjacency.set(sourcePath, []);
        shellAdjacency.get(sourcePath).push(edge.reference);
      }
      if (!declaredSources.has(edge.reference)) { pushEdge(edges, { kind: 'SOURCE', reference: edge.reference, source_path: sourcePath, unresolved: true }); continue; }
      pushEdge(edges, edge);
      if (snapshotByPath.get(edge.reference)?.content_utf8 !== undefined) queue.push(edge.reference);
    }
    for (const argv of capability.vectors) vectors.push({ argv, source_path: sourcePath, cwd: commandCwd });
  }
  if (queue.length > 0) pushEdge(edges, { kind: 'SOURCE', reference: '[source-graph-bound]', source_path: '[graph]', unresolved: true });
  const colors = new Map(); let shellCycle = false;
  function visitShell(path) {
    if (colors.get(path) === 'GRAY') { shellCycle = true; return; }
    if (colors.get(path) === 'BLACK') return;
    colors.set(path, 'GRAY');
    for (const reference of shellAdjacency.get(path) ?? []) visitShell(reference);
    colors.set(path, 'BLACK');
  }
  for (const path of [...shellAdjacency.keys()].sort(compareUtf8)) visitShell(path);
  if (shellCycle) pushEdge(edges, { kind: 'SOURCE', reference: '[shell-source-cycle]', source_path: '[graph]', unresolved: true });
  return deepFreeze({ edges, vectors, analyzed_source_paths: [...analyzedSourceKinds.keys()].sort(compareUtf8), analyzed_source_kinds: [...analyzedSourceKinds.entries()].sort(([left], [right]) => compareUtf8(left, right)).map(([path, kind]) => ({ path, kind })) });
}

function extractSource(content, sourcePath, command) {
  return deriveSourceCapabilities({ content, sourcePath, commandCwd: command.cwd, environmentNames: command.environment_names }).edges;
}

export function deriveNpmScriptCapabilities({ command, snapshotByPath }) {
  if (!(command.argv.length === 3 && executableIdentity(command.argv[0])?.name === 'npm' && command.argv[1] === 'run' && command.argv[2] !== undefined)) return deepFreeze({ edges: [], vectors: [], vector_cwds: [], package_cwd: null });
  const normalizedCwd = normalizeSegments(command.cwd === '' ? '.' : command.cwd);
  const cwdSegments = normalizedCwd === null || normalizedCwd === '' ? [] : normalizedCwd.split('/');
  const packageCandidates = [];
  for (let length = cwdSegments.length; length >= 0; length -= 1) packageCandidates.push(`${cwdSegments.slice(0, length).join('/')}${length === 0 ? '' : '/'}package.json`);
  const packageRecord = packageCandidates.map((path) => snapshotByPath.get(path)).find((record) => record !== undefined);
  const packageCwd = packageRecord === undefined ? null : directoryOf(packageRecord.path);
  if (packageRecord?.content_utf8 === undefined) return deepFreeze({ edges: [{ kind: 'SOURCE', reference: '[npm-package-json]', source_path: '[npm]', unresolved: true }], vectors: [], vector_cwds: [], package_cwd: packageCwd });
  try {
    const scripts = parseStrictJson(Buffer.from(packageRecord.content_utf8))?.scripts;
    if (scripts === null || typeof scripts !== 'object' || Array.isArray(scripts)) throw new TypeError('scripts absent');
    const edges = [{ kind: 'PATH', reference: packageRecord.path, source_path: '[npm]' }]; const vectors = []; const vectorCwds = []; let expandedScripts = 0;
    const scriptValue = (name) => Object.hasOwn(scripts, name) ? scripts[name] : undefined;
    const unresolved = (reference) => pushEdge(edges, { kind: 'COMMAND', reference, source_path: packageRecord.path, unresolved: true });
    function expandRawScript(name, depth, activeTargets) {
      if (depth > MAX_NPM_DEPTH || expandedScripts >= MAX_NPM_SCRIPTS) { unresolved('[npm-expansion-bound]'); return; }
      const script = scriptValue(name);
      if (typeof script !== 'string') { unresolved('[npm-script]'); return; }
      expandedScripts += 1;
      const shellCapability = analyzeShell(script, packageRecord.path, packageCwd);
      for (const edge of shellCapability.edges) pushEdge(edges, edge);
      for (const vector of shellCapability.vectors) {
        if (executableIdentity(vector[0])?.name === 'npm') {
          if (!(vector.length === 3 && vector[1] === 'run' && /^[A-Za-z0-9:_-]+$/u.test(vector[2]))) { unresolved('[unsupported-nested-npm-command]'); continue; }
          expandLifecycle(vector[2], depth + 1, activeTargets);
          continue;
        }
        if (vectors.length >= MAX_NPM_VECTORS) { unresolved('[npm-vector-bound]'); continue; }
        vectors.push(vector); vectorCwds.push(packageCwd);
      }
    }
    function expandLifecycle(name, depth, activeTargets) {
      if (depth > MAX_NPM_DEPTH) { unresolved('[npm-expansion-bound]'); return; }
      if (activeTargets.has(name)) { unresolved('[npm-script-cycle]'); return; }
      if (typeof scriptValue(name) !== 'string') { unresolved('[npm-script]'); return; }
      const nextActive = new Set(activeTargets); nextActive.add(name);
      for (const lifecycleName of [`pre${name}`, name, `post${name}`]) if (typeof scriptValue(lifecycleName) === 'string') expandRawScript(lifecycleName, depth, nextActive);
    }
    expandLifecycle(command.argv[2], 0, new Set());
    return deepFreeze({ edges, vectors, vector_cwds: vectorCwds, package_cwd: packageCwd });
  } catch { return deepFreeze({ edges: [{ kind: 'SOURCE', reference: '[npm-script]', source_path: '[npm]', unresolved: true }], vectors: [], vector_cwds: [], package_cwd: packageCwd }); }
}

function classificationCode(value) {
  return { DECLARED_BUT_UNPROVEN: 'COMMAND_DEPENDENCY_DECLARED_BUT_UNPROVEN', UNDECLARED: 'COMMAND_DEPENDENCY_UNDECLARED', UNRESOLVED_INDIRECTION: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION' }[value] ?? null;
}

function analyzeCommand(command, commandIndex, spec, snapshot, runnerAdapters) {
  const snapshotByPath = new Map(snapshot.paths.map((record) => [record.path, record]));
  const declaredPaths = new Set([...command.reads, ...command.writes, ...command.source_references]);
  const declaredEnvironment = new Set(command.environment_names);
  const edges = []; const diagnostics = [];
  const npmCapability = deriveNpmScriptCapabilities({ command, snapshotByPath });
  const sourceCommandCwd = npmCapability.package_cwd ?? command.cwd;
  const sourceGraph = deriveCommandSourceGraph({ command, snapshotByPath, commandCwd: sourceCommandCwd });
  const analyzedSourceKinds = new Map(sourceGraph.analyzed_source_kinds.map((entry) => [entry.path, entry.kind]));
  const executionContext = { commandCwd: command.cwd, sourceReferences: new Set(command.source_references), analyzedSourceKinds };
  const executableEffect = deriveExecutableEffectVector(command.argv, executionContext);
  for (const reference of executableEffect.local_reads) pushEdge(edges, { kind: 'PATH', reference, source_path: '[argv]', access: 'READ' });
  for (const reference of executableEffect.local_writes) pushEdge(edges, { kind: 'PATH', reference, source_path: '[argv]', access: 'WRITE' });
  if (executableEffect.injection) diagnostics.push(diagnostic('COMMAND_INJECTION_SURFACE', { location_json_pointer: `/commands/${commandIndex}/argv`, command_id_or_null: command.id, sanitized_evidence: { reason: 'shell or eval invocation vector' } }));
  if (executableEffect.prohibited_git) diagnostics.push(diagnostic('PROHIBITED_GIT_MUTATION', { location_json_pointer: `/commands/${commandIndex}/argv`, command_id_or_null: command.id, sanitized_evidence: { reason: 'force or destructive Git mutation' } }));
  if (!executableEffect.supported) diagnostics.push(diagnostic('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION', { location_json_pointer: `/commands/${commandIndex}/argv/0`, command_id_or_null: command.id, sanitized_evidence: { reason: 'unsupported executable capability' } }));
  for (const [argumentIndex, argument] of command.argv.entries()) {
    if (argument.includes('*') || argument.includes('?') || /(?:ls\s+-t|head\s+-1|newest|latest)/iu.test(argument) || AMBIGUOUS.test(argument)) diagnostics.push(diagnostic('AMBIGUOUS_EXECUTABLE_FILENAME', { location_json_pointer: `/commands/${commandIndex}/argv`, command_id_or_null: command.id, sanitized_evidence: { reason: 'ambiguous executable selection' } }));
    if (/(?:\$\(|`|(?:^|\s)(?:eval|sh\s+-c|bash\s+-c)(?:\s|$))/u.test(argument)) diagnostics.push(diagnostic('COMMAND_INJECTION_SURFACE', { location_json_pointer: `/commands/${commandIndex}/argv`, command_id_or_null: command.id, sanitized_evidence: { reason: 'shell evaluation surface' } }));
    if (pathLike(argument) && !(argumentIndex === 0 && executableIdentity(argument) !== null)) addStaticPath(edges, argument, { base: command.cwd, sourcePath: '[argv]', unresolvedLabel: '[argv-path]' });
  }
  for (const edge of npmCapability.edges) pushEdge(edges, edge);
  for (const [vectorIndex, vector] of npmCapability.vectors.entries()) {
    const effect = deriveExecutableEffectVector(vector, { ...executionContext, commandCwd: npmCapability.vector_cwds[vectorIndex] });
    for (const reference of effect.local_reads) pushEdge(edges, { kind: 'PATH', reference, source_path: '[npm]', access: 'READ' });
    for (const reference of effect.local_writes) pushEdge(edges, { kind: 'PATH', reference, source_path: '[npm]', access: 'WRITE' });
    if (!effect.supported) pushEdge(edges, { kind: 'COMMAND', reference: '[unsupported-npm-script-command]', source_path: '[npm]', unresolved: true });
    if (effect.injection) pushEdge(edges, { kind: 'COMMAND', reference: '[npm-script-injection]', source_path: '[npm]', injection: true });
  }

  for (const edge of sourceGraph.edges) pushEdge(edges, edge);
  for (const vector of sourceGraph.vectors) {
    const effect = deriveExecutableEffectVector(vector.argv, { ...executionContext, commandCwd: vector.cwd });
    for (const reference of effect.local_reads) pushEdge(edges, { kind: 'PATH', reference, source_path: vector.source_path, access: 'READ' });
    for (const reference of effect.local_writes) pushEdge(edges, { kind: 'PATH', reference, source_path: vector.source_path, access: 'WRITE' });
    if (!effect.supported) pushEdge(edges, { kind: 'COMMAND', reference: '[unsupported-source-command]', source_path: vector.source_path, unresolved: true });
    if (effect.injection) pushEdge(edges, { kind: 'COMMAND', reference: '[source-command-injection]', source_path: vector.source_path, injection: true });
  }

  const classifications = []; const matched = new Set(); const seenEdges = new Set();
  for (const edge of edges) {
    const key = `${edge.kind}\u0000${edge.access ?? ''}\u0000${edge.reference}`; if (seenEdges.has(key)) continue; seenEdges.add(key);
    if (edge.unbound) { diagnostics.push(diagnostic('COMMAND_UNBOUND_VARIABLE', { location_json_pointer: `/commands/${commandIndex}/source_references`, command_id_or_null: command.id, sanitized_evidence: { variable_name: edge.reference, source_path: edge.source_path } })); continue; }
    if (edge.injection) { diagnostics.push(diagnostic('COMMAND_INJECTION_SURFACE', { location_json_pointer: `/commands/${commandIndex}/source_references`, command_id_or_null: command.id, sanitized_evidence: { source_path: edge.source_path } })); continue; }
    let classification;
    if (edge.unresolved) classification = 'UNRESOLVED_INDIRECTION';
    else if (edge.kind === 'ENVIRONMENT') classification = declaredEnvironment.has(edge.reference) ? 'DECLARED_AND_MATCHED' : 'UNDECLARED';
    else if (edge.kind === 'PATH' && edge.access === 'READ') classification = command.reads.includes(edge.reference) ? 'DECLARED_AND_MATCHED' : 'UNDECLARED';
    else if (edge.kind === 'PATH' && edge.access === 'WRITE') classification = command.writes.includes(edge.reference) ? 'DECLARED_AND_MATCHED' : 'UNDECLARED';
    else classification = declaredPaths.has(edge.reference) ? 'DECLARED_AND_MATCHED' : 'UNDECLARED';
    classifications.push({ command_id: command.id, kind: edge.kind, reference: edge.reference, classification, ...(edge.access === undefined ? {} : { access: edge.access }) });
    if (classification === 'DECLARED_AND_MATCHED') { matched.add(`${edge.kind}\u0000${edge.reference}`); matched.add(key); }
    const code = classificationCode(classification); if (code !== null) diagnostics.push(diagnostic(code, { location_json_pointer: `/commands/${commandIndex}`, command_id_or_null: command.id, sanitized_evidence: { classification, kind: edge.kind, reference: edge.reference } }));
  }
  for (const sourcePath of command.source_references) {
    const classification = snapshotByPath.get(sourcePath)?.content_utf8 !== undefined && (matched.has(`PATH\u0000${sourcePath}`) || matched.has(`SOURCE\u0000${sourcePath}`)) ? 'DECLARED_AND_MATCHED' : 'DECLARED_BUT_UNPROVEN';
    classifications.push({ command_id: command.id, kind: 'SOURCE', reference: sourcePath, classification });
    if (classification !== 'DECLARED_AND_MATCHED') diagnostics.push(diagnostic('COMMAND_DEPENDENCY_DECLARED_BUT_UNPROVEN', { location_json_pointer: `/commands/${commandIndex}/source_references`, command_id_or_null: command.id, sanitized_evidence: { classification, reference: sourcePath } }));
  }
  for (const [kind, references] of [['PATH', [...command.reads, ...command.writes]], ['ENVIRONMENT', command.environment_names]]) for (const reference of unique(references)) {
    if (matched.has(`${kind}\u0000${reference}`) || matched.has(`SOURCE\u0000${reference}`)) continue;
    classifications.push({ command_id: command.id, kind, reference, classification: 'DECLARED_BUT_UNPROVEN' });
    diagnostics.push(diagnostic('COMMAND_DEPENDENCY_DECLARED_BUT_UNPROVEN', { location_json_pointer: `/commands/${commandIndex}`, command_id_or_null: command.id, sanitized_evidence: { classification: 'DECLARED_BUT_UNPROVEN', kind, reference } }));
  }
  const mutableScope = new Set([...spec.scope.create_paths, ...spec.scope.modify_paths]); const allScope = new Set([...mutableScope, ...spec.scope.preserve_paths]);
  if (command.context === 'DIRECT') {
    for (const dependency of unique([...command.reads, ...command.writes])) if (!allScope.has(dependency) || (command.writes.includes(dependency) && !mutableScope.has(dependency))) diagnostics.push(diagnostic('SCOPE_DIRECT_COMMAND_DEPENDENCY', { location_json_pointer: `/commands/${commandIndex}`, command_id_or_null: command.id, sanitized_evidence: { dependency } }));
    if (command.required_runner_state.some((state) => /^RUNNER_ADAPTER_V\d+:/u.test(state))) diagnostics.push(diagnostic('RUNNER_TOPOLOGY_MISMATCH', { location_json_pointer: `/commands/${commandIndex}/required_runner_state`, command_id_or_null: command.id, sanitized_evidence: { reason: 'runner adapter applied to direct command' } }));
  } else for (const state of command.required_runner_state) {
    const match = /^RUNNER_ADAPTER_V(\d+):([A-Z0-9_-]+)$/u.exec(state); if (match !== null && !(runnerAdapters.version === Number(match[1]) && runnerAdapters.adapters.some((adapter) => adapter.id === match[2]))) diagnostics.push(diagnostic('RUNNER_TOPOLOGY_MISMATCH', { location_json_pointer: `/commands/${commandIndex}/required_runner_state`, command_id_or_null: command.id, sanitized_evidence: { adapter_id: match[2], version: Number(match[1]) } }));
  }
  return { classifications, diagnostics };
}

export function canonicalDependencyFacts(classifications) {
  const seen = new Set(); const facts = [];
  for (const entry of classifications) {
    const fact = { command_id: entry.command_id, reference: entry.reference, classification: entry.classification };
    const key = `${fact.command_id}\u0000${fact.reference}\u0000${fact.classification}`;
    if (seen.has(key)) continue;
    seen.add(key); facts.push(fact);
  }
  return deepFreeze(facts.sort((left, right) => compareUtf8(left.command_id, right.command_id) || compareUtf8(left.reference, right.reference) || compareUtf8(left.classification, right.classification)));
}

export function validateCommandDependencies({ spec, snapshot, runnerAdapters = RUNNER_ADAPTERS_V1, requireSnapshotFacts = false }) {
  const classifications = []; const diagnostics = [];
  spec.commands.forEach((command, index) => { const result = analyzeCommand(command, index, spec, snapshot, runnerAdapters); classifications.push(...result.classifications); diagnostics.push(...result.diagnostics); });
  classifications.sort((a, b) => compareUtf8(a.command_id, b.command_id) || compareUtf8(a.kind, b.kind) || compareUtf8(a.reference, b.reference) || compareUtf8(a.classification, b.classification));
  const derivedDependencyFacts = canonicalDependencyFacts(classifications);
  if (requireSnapshotFacts) {
    const snapshotFacts = canonicalDependencyFacts((snapshot.derived_dependency_facts ?? []).map((fact) => ({ ...fact, kind: '' })));
    if (JSON.stringify(snapshotFacts) !== JSON.stringify(derivedDependencyFacts)) diagnostics.push(diagnostic('REPOSITORY_SNAPSHOT_STALE', { location_json_pointer: '/derived_dependency_facts', sanitized_evidence: { reason: 'snapshot facts differ from independent closure derivation' } }));
  }
  const sorted = sortDiagnostics(diagnostics);
  return deepFreeze({ valid: sorted.length === 0 && classifications.every((entry) => entry.classification === 'DECLARED_AND_MATCHED'), classifications, derived_dependency_facts: derivedDependencyFacts, diagnostics: sorted });
}

export function assertCommandDependencies(input) {
  const result = validateCommandDependencies(input); if (result.valid) return result;
  const first = result.diagnostics[0]; throw new DiagnosticError(first?.code ?? 'COMMAND_DEPENDENCY_DECLARED_BUT_UNPROVEN', first);
}
