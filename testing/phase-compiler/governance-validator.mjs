import ts from 'typescript';
import { compareUtf8, deepFreeze, parseStrictJson } from './canonical.mjs';
import { diagnostic } from './error-catalog.mjs';

function sortDiagnostics(records) {
  return records.sort((left, right) => compareUtf8(left.code, right.code) || compareUtf8(left.location_json_pointer, right.location_json_pointer) || compareUtf8(left.command_id_or_null ?? '', right.command_id_or_null ?? ''));
}

function add(records, code, location, evidence = {}, commandId = null) {
  records.push(diagnostic(code, { location_json_pointer: location, command_id_or_null: commandId, sanitized_evidence: evidence }));
}

function snapshotDocument(snapshot, path, diagnostics, kind) {
  if (path === '') return null;
  const record = snapshot.paths.find((candidate) => candidate.path === path);
  if (record?.content_utf8 === undefined) {
    add(diagnostics, 'COMMAND_DEPENDENCY_DECLARED_BUT_UNPROVEN', `/governance/${kind}_path`, { path });
    return null;
  }
  try {
    return parseStrictJson(Buffer.from(record.content_utf8));
  } catch {
    add(diagnostics, 'MANIFEST_COUNT_MISMATCH', `/governance/${kind}_path`, { path, reason: 'governance source is not strict JSON' });
    return null;
  }
}

function deriveManifest(spec, snapshot, diagnostics) {
  const document = snapshotDocument(snapshot, spec.governance.manifest_path, diagnostics, 'manifest');
  if (document === null) return null;
  if (!Array.isArray(document.entries)) {
    add(diagnostics, 'MANIFEST_COUNT_MISMATCH', '/governance/manifest_path', { reason: 'entries array absent' });
    return null;
  }
  const entries = new Map();
  for (const entry of document.entries) {
    if (typeof entry?.path !== 'string' || !['DENY', 'RUN_POLICY', 'VALIDATE_ONLY'].includes(entry.ci_disposition) || entries.has(entry.path)) {
      add(diagnostics, 'MANIFEST_COUNT_MISMATCH', '/governance/manifest_path', { reason: 'invalid or duplicate manifest entry' });
      return null;
    }
    entries.set(entry.path, entry.ci_disposition);
  }
  for (const transition of spec.governance.manifest_transitions) {
    const before = entries.get(transition.path);
    const beforeMatches = transition.before_disposition === 'ABSENT' ? before === undefined : before === transition.before_disposition;
    if (!beforeMatches) add(diagnostics, 'MANIFEST_COUNT_MISMATCH', '/governance/manifest_transitions', { path: transition.path, reason: 'before disposition or existence mismatch' });
    else entries.set(transition.path, transition.after_disposition);
  }
  return entries;
}

function verifyManifestRequirements(spec, derivedManifest, diagnostics) {
  spec.commands.forEach((command, index) => {
    for (const state of command.required_manifest_state) {
      if (/^MANIFEST_(?:BEFORE|AFTER|ADD|REMOVE|EXPECT)_TOTAL:/u.test(state)) {
        add(diagnostics, 'SPEC_DERIVED_FIELD_AUTHORED', `/commands/${index}/required_manifest_state`, { field: 'manifest_total' }, command.id);
        continue;
      }
      const match = /^MANIFEST_ENTRY:([^:]+):(DENY|RUN_POLICY|VALIDATE_ONLY)$/u.exec(state);
      if (match === null || derivedManifest === null || derivedManifest.get(match[1]) !== match[2]) add(diagnostics, 'MANIFEST_COUNT_MISMATCH', `/commands/${index}/required_manifest_state`, { reason: 'required entry differs from derived after-state' }, command.id);
    }
  });
}

function deriveRunner(spec, snapshot, diagnostics) {
  if (spec.governance.runner_path === '') return null;
  const record = snapshot.paths.find((candidate) => candidate.path === spec.governance.runner_path);
  if (record?.content_utf8 === undefined) {
    add(diagnostics, 'COMMAND_DEPENDENCY_DECLARED_BUT_UNPROVEN', '/governance/runner_path', { path: spec.governance.runner_path });
    return null;
  }
  const sourceFile = ts.createSourceFile(spec.governance.runner_path, record.content_utf8, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const children = new Set(); let topologyArrays = 0; let invalid = false;
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement) || (statement.declarationList.flags & ts.NodeFlags.Const) === 0) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !/CHILD/iu.test(declaration.name.text) || !ts.isArrayLiteralExpression(declaration.initializer)) continue;
      topologyArrays += 1;
      for (const element of declaration.initializer.elements) {
        if (ts.isStringLiteral(element) || ts.isNoSubstitutionTemplateLiteral(element)) children.add(element.text);
        else if (ts.isObjectLiteralExpression(element)) {
          const pathProperty = element.properties.find((property) => ts.isPropertyAssignment(property) && ['id', 'path'].includes(property.name.getText(sourceFile).replace(/['"]/gu, '')));
          if (pathProperty !== undefined && ts.isPropertyAssignment(pathProperty) && (ts.isStringLiteral(pathProperty.initializer) || ts.isNoSubstitutionTemplateLiteral(pathProperty.initializer))) children.add(pathProperty.initializer.text);
          else invalid = true;
        } else invalid = true;
      }
    }
  }
  if (topologyArrays === 0 || invalid) {
    add(diagnostics, 'RUNNER_TOPOLOGY_MISMATCH', '/governance/runner_path', { reason: 'runner .mjs child topology is not bounded literal const data' });
    return null;
  }
  for (const removal of spec.governance.runner_removals) {
    if (!children.has(removal)) add(diagnostics, 'RUNNER_TOPOLOGY_MISMATCH', '/governance/runner_removals', { child_id: removal, reason: 'removal absent before transition' });
    else children.delete(removal);
  }
  for (const addition of spec.governance.runner_additions) {
    if (children.has(addition)) add(diagnostics, 'RUNNER_TOPOLOGY_MISMATCH', '/governance/runner_additions', { child_id: addition, reason: 'addition already present before transition' });
    else children.add(addition);
  }
  return children;
}

function verifyRunner(spec, children, diagnostics, runnerAdapters) {
  spec.commands.forEach((command, index) => {
    for (const state of command.required_runner_state) {
      const adapter = /^RUNNER_ADAPTER_V(\d+):([A-Z0-9_-]+)$/u.exec(state);
      if (adapter !== null) {
        const matched = command.context === 'RUNNER_CHILD' && runnerAdapters.version === Number(adapter[1]) && runnerAdapters.adapters.some((item) => item.id === adapter[2]);
        if (!matched) add(diagnostics, 'RUNNER_TOPOLOGY_MISMATCH', `/commands/${index}/required_runner_state`, { adapter_id: adapter[2], version: Number(adapter[1]) }, command.id);
        continue;
      }
      const child = /^RUNNER_CHILD:([A-Z0-9_-]+)$/u.exec(state);
      if (child !== null && (command.context !== 'RUNNER_CHILD' || children === null || !children.has(child[1]))) add(diagnostics, 'RUNNER_TOPOLOGY_MISMATCH', `/commands/${index}/required_runner_state`, { child_id: child[1] }, command.id);
    }
    if (children !== null && command.context === 'RUNNER_CHILD' && command.required_runner_state.some((state) => state.startsWith('RUNNER_CHILD:')) === false) add(diagnostics, 'RUNNER_TOPOLOGY_MISMATCH', `/commands/${index}/required_runner_state`, { reason: 'runner child lacks derived topology membership' }, command.id);
  });
}

export function validateGovernance({ spec, snapshot = { paths: [] }, runnerAdapters = { version: 1, adapters: [] } }) {
  const diagnostics = [];
  const manifest = deriveManifest(spec, snapshot, diagnostics);
  verifyManifestRequirements(spec, manifest, diagnostics);
  const runner = deriveRunner(spec, snapshot, diagnostics);
  verifyRunner(spec, runner, diagnostics, runnerAdapters);
  const sorted = sortDiagnostics(diagnostics);
  const manifestCounts = { total: manifest?.size ?? 0, DENY: 0, RUN_POLICY: 0, VALIDATE_ONLY: 0 };
  if (manifest !== null) for (const disposition of manifest.values()) manifestCounts[disposition] += 1;
  return deepFreeze({
    valid: sorted.length === 0,
    manifest_entries: manifest === null ? [] : [...manifest.entries()].sort(([left], [right]) => compareUtf8(left, right)),
    manifest_counts: manifestCounts,
    runner_children: runner === null ? [] : [...runner].sort(compareUtf8),
    diagnostics: sorted,
  });
}
