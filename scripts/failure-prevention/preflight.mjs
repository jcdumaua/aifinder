#!/usr/bin/env node
/**
 * AiFinder offline failure-prevention preflight.
 * Usage: node scripts/failure-prevention/preflight.mjs <task-manifest.json>
 * No repository, Git, credential, network, provider, DB or native workload actions.
 * Manifest is descriptive evidence, NEVER an executable command.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const registryPath = resolve(here, '../../docs/governance/failure-prevention/failure-registry.json');
const validOps = new Set(['read', 'write', 'execute', 'network', 'database', 'deployment', 'git-mutation', 'credential-access', 'sandbox-profile-change', 'test']);
const protectedOps = new Set(['database', 'deployment', 'git-mutation', 'credential-access', 'sandbox-profile-change']);
const results = new Set(['PASS', 'REPAIR', 'BLOCKED']);
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const stringList = x => Array.isArray(x) && x.every(s => typeof s === 'string' && s.length > 0);
const permitted = new Set(['task', 'operations', 'commands', 'files', 'dependencies', 'output_contract', 'authority', 'preflight_evidence', 'known_failure_ids']);
const required = ['task', 'operations', 'commands', 'files', 'dependencies', 'output_contract', 'authority', 'preflight_evidence'];
function analyze(manifest, registry) {
  const findings = [];
  const add = (severity, code, detail, rule_ids = []) => findings.push({ severity, code, detail, rule_ids });
  if (!plain(registry) || !Array.isArray(registry.entries) || !registry.entries.length
      || registry.entries.some(e => !plain(e) || !/^AF-[0-9]{3}$/.test(e.id)
          || typeof e.preflight_rule !== 'string')) {
    return { result:'BLOCKED', findings:[{severity:'BLOCKED',code:'REGISTRY_INVALID',detail:'Validated registry entries unavailable',rule_ids:[]}] };
  }
  const rules = new Map(registry.entries.map(e => [e.id,e]));
  if (rules.size !== registry.entries.length) add('BLOCKED','REGISTRY_DUPLICATE_IDS','Registry IDs are not unique');
  if (!plain(manifest)) return { result:'BLOCKED',findings:[{severity:'BLOCKED',code:'MANIFEST_INVALID',detail:'Expected a JSON object',rule_ids:[]}] };
  for (const k of Object.keys(manifest)) if (!permitted.has(k)) add('BLOCKED','UNKNOWN_MANIFEST_FIELD',k);
  for (const k of required) if (!(k in manifest)) add('BLOCKED','MISSING_MANIFEST_FIELD',k);
  if (typeof manifest.task !== 'string' || !manifest.task.trim()) add('BLOCKED','TASK_MISSING','Task description required');
  if (!stringList(manifest.operations) || manifest.operations.some(o => !validOps.has(o)))
    add('BLOCKED','OPERATIONS_INVALID','All operations must use the documented operation vocabulary');
  if (!stringList(manifest.commands)) add('BLOCKED','COMMANDS_INVALID','Command descriptions required, not runnable shell source');
  if (!stringList(manifest.files)) add('BLOCKED','FILES_INVALID','File access paths/descriptions required');
  if (!stringList(manifest.dependencies)) add('BLOCKED','DEPENDENCIES_INVALID','Explicit dependency inventory required');
  if (!plain(manifest.output_contract) || !['verified', 'not-applicable'].includes(manifest.output_contract.status))
    add('BLOCKED','OUTPUT_CONTRACT_UNVERIFIED','Output grammar must be independently verified or justified as not applicable',['AF-005','AF-006']);
  if (!plain(manifest.authority) || manifest.authority.owner_approved !== true ||
      !stringList(manifest.authority.scope) || !Array.isArray(manifest.operations) ||
      manifest.operations.some(o => !manifest.authority.scope.includes(o)))
    add('BLOCKED','AUTHORITY_NOT_BOUND','Explicit owner approval and exact covered operation classes required');
  if (!plain(manifest.preflight_evidence) ||
      manifest.preflight_evidence.launcher_checked !== true ||
      manifest.preflight_evidence.sandbox_profile_checked !== true ||
      manifest.preflight_evidence.dependencies_checked !== true ||
      manifest.preflight_evidence.capture_before_parse !== true ||
      manifest.preflight_evidence.script_syntax_checked !== true)
    add('REPAIR','PREFLIGHT_EVIDENCE_INCOMPLETE','Check launcher, profile, dependency closure, capture order, script syntax',['AF-004','AF-005','AF-006']);
  if (!stringList(manifest.known_failure_ids) && manifest.known_failure_ids !== undefined)
    add('BLOCKED','KNOWN_IDS_INVALID','Expected an array of registry IDs');
  for (const id of Array.isArray(manifest.known_failure_ids)?manifest.known_failure_ids:[]) {
    if (!rules.has(id)) add('BLOCKED','UNKNOWN_FAILURE_ID',id);
    else {
      const r = rules.get(id);
      add('REPAIR','KNOWN_FAILURE_REQUIRES_REVIEW',id+': '+r.preflight_rule,[id]);
    }
  }
  if (Array.isArray(manifest.operations) && manifest.operations.some(o=>protectedOps.has(o)))
    add('BLOCKED','PROTECTED_ACTION_EXTERNAL_GATE','A registry result cannot authorize protected actions; separate active authority verification required');
  if (Array.isArray(manifest.operations) && manifest.operations.includes('network'))
    add('BLOCKED','NETWORK_EXTERNAL_GATE','Offline checker cannot verify provider/network authorization or runtime permissions');
  // Never imply that these static data validations tested the host or macOS.
  const result = findings.some(f=>f.severity==='BLOCKED') ? 'BLOCKED' :
                 findings.some(f=>f.severity==='REPAIR') ? 'REPAIR' : 'PASS';
  if (!results.has(result)) throw Error('unreachable disposition');
  return {result, registry_version:'v2', task:manifest.task, findings,
    limitations:['Static manifest check only','No filesystem permissions or native runtime tested',
      'PASS does not grant execution authority or override owner/platform reviews']};
}
export { analyze };
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw Error('Expected exactly one task-manifest JSON path');
    const registry = JSON.parse(readFileSync(registryPath,'utf8'));
    const manifest = JSON.parse(readFileSync(resolve(process.argv[2]),'utf8'));
    const report = analyze(manifest,registry);
    process.stdout.write(JSON.stringify(report,null,2)+'\n');
    process.exitCode = report.result === 'PASS' ? 0 : report.result === 'REPAIR' ? 2 : 3;
  } catch(e) {
    process.stdout.write(JSON.stringify({result:'BLOCKED', findings:[{severity:'BLOCKED',code:'PREFLIGHT_INPUT_ERROR',detail:e.name}],limitations:['No commands executed']})+'\n');
    process.exitCode=3;
  }
}
