import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {analyze} from './preflight.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const reg=JSON.parse(readFileSync(resolve(here,'../../docs/governance/failure-prevention/failure-registry.json'),'utf8'));
const base=()=>({task:'offline governed source audit',operations:['read','test'],commands:['read-only static helper'],
 files:['task-local fixture'],dependencies:['node:fs'],output_contract:{status:'verified'},
 authority:{owner_approved:true,scope:['read','test']},
 preflight_evidence:{launcher_checked:true,sandbox_profile_checked:true,dependencies_checked:true,capture_before_parse:true,script_syntax_checked:true}});
test('registry has unique evidence-bound rules',()=>{assert.ok(reg.entries.length>=20);assert.equal(new Set(reg.entries.map(e=>e.id)).size,reg.entries.length)});
test('safe complete manifest PASS does not authorize execution',()=>{const r=analyze(base(),reg);assert.equal(r.result,'PASS');assert.match(r.limitations.join(' '),/does not grant execution authority/)});
test('known C08 contract defect requires review',()=>{const m=base();m.known_failure_ids=['AF-005'];const r=analyze(m,reg);assert.equal(r.result,'REPAIR');assert.ok(r.findings.some(f=>f.rule_ids.includes('AF-005')))});
test('known C06 sandbox abort requires review, not global permission',()=>{const m=base();m.known_failure_ids=['AF-002'];assert.equal(analyze(m,reg).result,'REPAIR')});
test('no authority fails closed',()=>{const m=base();m.authority.owner_approved=false;assert.equal(analyze(m,reg).result,'BLOCKED')});
test('deployment cannot be granted by static checker',()=>{const m=base();m.operations=['deployment'];m.authority.scope=['deployment'];assert.equal(analyze(m,reg).result,'BLOCKED')});
test('missing source closure evidence REPAIR',()=>{const m=base();m.preflight_evidence.dependencies_checked=false;assert.equal(analyze(m,reg).result,'REPAIR')});
test('missing producer contract BLOCKED',()=>{const m=base();m.output_contract={status:'unknown'};assert.equal(analyze(m,reg).result,'BLOCKED')});
test('unknown inputs fail closed',()=>{const m=base();m.shell_payload='opaque';assert.equal(analyze(m,reg).result,'BLOCKED')});
test('unknown registry id fails closed',()=>{const m=base();m.known_failure_ids=['AF-999'];assert.equal(analyze(m,reg).result,'BLOCKED')});
test('broken registry fails closed',()=>assert.equal(analyze(base(),{entries:[]}).result,'BLOCKED'));
