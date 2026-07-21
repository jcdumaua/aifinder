#!/usr/bin/env bash
# Candidate-only review artifact.  NOT authorized for execution.
# AIFINDER_AUTORUN_SCRIPT_V1
# This immutable inert stop precedes argument parsing, FD access, temp files,
# subprocesses, environment activation, and every other operational action.
exit 78

# UNREACHABLE REFERENCE IMPLEMENTATION.  A separately reviewed replacement
# must be created for any future execution; deleting either guard is never an
# authorization.  No environment variable can activate this candidate.
future_authorized_live_preflight() {
  # Secondary immutable guard for a hypothetical source/invocation path.
  return 78

  # Nonsecret interface only:
  # --auth-fd <already-open-rw-fd> --service-fd <already-open-read-fd>
  # --environment <LOCAL|PREVIEW|STAGING|PRODUCTION> --output <absolute-outside-repo-path>
  python3 - "$@" <<'PY'
import datetime as dt
import errno
import fcntl
import hashlib
import json
import os
import re
import selectors
import signal
import shutil
import stat
import subprocess
import sys
import tempfile
import time
from pathlib import Path

REPO = Path('/Users/jamescarlodumaua/aifinder').resolve()
CONSTRUCTION_BASELINE = '9cc9d08330ec2579c74a1db3094330f4bc458ed6'
SQL_REL = 'scripts/_drafts/discovery-phase-27ng-27nl-secret-safe-live-preflight-candidate.sql'
WRAPPER_REL = 'scripts/_drafts/discovery-phase-27ng-27nl-secret-safe-live-preflight-wrapper-candidate.sh'
MANIFEST_REL = 'scripts/_drafts/discovery-phase-27ng-27nl-static-identity-manifest.json'
MAX_AUTH = 8192
MAX_SERVICE = 4096
MAX_BYTES = 16384
MAX_LINES = 56
TTL_SECONDS = 300
ENVIRONMENTS = {'LOCAL', 'PREVIEW', 'STAGING', 'PRODUCTION'}
EXPECTED_RELATION_IDENTITIES = {'public.admin_audit_archives','public.admin_audit_logs','public.discovered_tools','public.discovery_audit_events','public.discovery_candidate_preview_artifacts','public.discovery_candidate_tools','public.discovery_duplicate_candidates','public.discovery_evidence','public.discovery_runs','public.discovery_sources','public.homepage_control_audit_events','public.homepage_control_checklist_runs','public.homepage_control_configs','public.submitted_tools','public.tools'}
EXPECTED_POLICY_IDENTITIES = {'public.discovery_candidate_tools::Deny all access to discovery_candidate_tools','public.discovery_sources::Deny all access to discovery_sources','public.discovery_runs::Deny all access to discovery_runs','public.discovered_tools::Deny all access to discovered_tools','public.discovery_evidence::Deny all access to discovery_evidence','public.discovery_duplicate_candidates::Deny all access to discovery_duplicate_candidates','public.discovery_audit_events::Deny all access to discovery_audit_events','public.homepage_control_configs::Admin can read homepage control configs','public.homepage_control_configs::Admin can write homepage control configs','public.homepage_control_audit_events::Admin can read homepage control audit events','public.homepage_control_audit_events::Admin can insert homepage control audit events','public.homepage_control_checklist_runs::Admin can read homepage control checklist runs','public.homepage_control_checklist_runs::Admin can write homepage control checklist runs','public.tools::Allow public read access to approved tools','public.discovery_candidate_preview_artifacts::Deny all access to discovery_candidate_preview_artifacts'}
EXPECTED_MIGRATION_PAIRS = {('supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql','20260602000100'),('supabase/migrations/20260602000200_create_discovered_tools_queue.sql','20260602000200'),('supabase/migrations/20260612000100_create_homepage_control_room.sql','20260612000100'),('supabase/migrations/20260612000200_harden_discovered_tools_access.sql','20260612000200'),('supabase/migrations/20260612000300_publish_homepage_control_config.sql','20260612000300'),('supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql','20260614000100'),('supabase/migrations/20260615001110_updated-preview-checklist.sql','20260615001110'),('supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql','20260615002000'),('supabase/migrations/20260616002151_finalize_public_safe_tools_schema_patch.sql','20260616002151'),('supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql','20260616002251'),('supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql','20260616003000'),('supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql','20260617003000'),('supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql','20260617004000'),('supabase/migrations/20260617004500_seed_discovery_queue_smoke_test.sql','20260617004500'),('supabase/migrations/20260617005500_cleanup_discovery_queue_smoke_test.sql','20260617005500'),('supabase/migrations/20260625171333_create_discovery_candidate_tools.sql','20260625171333'),('supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql','20260626171330'),('supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql','20260628150430'),('supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql','20260628164230'),('supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql','20260701190000'),('supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql','20260702190000'),('supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql','20260705120607')}
EXPECTED_QUARANTINED_PAIRS = {('supabase/migrations/20260715_rls_drift_reconciliation_forward_candidate.sql','supabase/migrations/_drafts/20260715_rls_drift_reconciliation_forward_candidate.sql'),('supabase/migrations/20260715_rls_drift_reconciliation_rollback_candidate.sql','supabase/migrations/_drafts/20260715_rls_drift_reconciliation_rollback_candidate.sql')}
EXPECTED_GUARD_PATHS = {'supabase/migrations/20260715_rls_drift_reconciliation_forward_candidate.sql','supabase/migrations/20260715_rls_drift_reconciliation_rollback_candidate.sql','supabase/migrations/_drafts/20260715_rls_drift_reconciliation_forward_candidate.sql','supabase/migrations/_drafts/20260715_rls_drift_reconciliation_rollback_candidate.sql'}
EXPECTED_CONTROL_PATHS = {'supabase/migrations/20260715_rls_drift_reconciliation_forward_candidate.sql','supabase/migrations/20260715_rls_drift_reconciliation_rollback_candidate.sql','supabase/migrations/_drafts/20260715_rls_drift_reconciliation_forward_candidate.sql','supabase/migrations/_drafts/20260715_rls_drift_reconciliation_rollback_candidate.sql','docs/discovery-phase-27mw-27mz-active-migration-guard-divergence-containment-gate.md','docs/discovery-phase-27mn-27mq-database-rls-migration-static-reconciliation-planning-gate.md','docs/discovery-phase-27mr-27mv-database-rls-migration-static-reconciliation-inspection-gate.md','docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md','docs/discovery-phase-26xw-guard-removal-and-rls-remediation-execution-readiness-planning-gate.md','docs/discovery-phase-25cj-supabase-type-generation-execution-result-documentation-gate.md','scripts/discovery-rls-drift-catalog-ddl-metadata-query-candidate.sql','scripts/discovery-admin-audit-sequence-metadata-query-candidate.sql','scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sql','lib/supabase/database.types.ts'}
AUTH_KEYS = {
    'authorization_version', 'authorization_record_path', 'authorization_lock_path', 'authorization_nonce',
    'output_path', 'construction_baseline', 'repository_head', 'sql_path', 'sql_sha256', 'wrapper_path',
    'wrapper_sha256', 'manifest_path', 'manifest_sha256',
    'environment_classification', 'output_contract_sha256', 'issued_at',
    'expires_at', 'consumed_state', 'read_only', 'migration_execution',
    'sql_mutation', 'type_generation',
}
SERVICE_KEYS = {'host', 'port', 'dbname', 'user', 'password', 'sslmode'}
IDENTIFIER = re.compile(r'(?i)(?:postgres(?:ql)?://|https?://|\b(?:select|insert|update|delete|alter|create|drop|grant|revoke)\b|\b(?:password|token|secret|apikey|api_key|bearer)\b|[A-Za-z_][A-Za-z0-9_]{31,})')
SECRETISH = re.compile(r'(?i)(?:eyJ[A-Za-z0-9_-]{8,}|(?:sk|pk|sbp|supabase)[_-][A-Za-z0-9_-]{8,}|-----BEGIN|[A-Za-z0-9+/]{40,}={0,2})')
RFC3339_MS = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$')
SHA256 = re.compile(r'^[0-9a-f]{64}$')
CLEANUP_PATHS = set()

class Failure(Exception):
    def __init__(self, category): self.category = category

def fail(category):
    raise Failure(category)

def broad_failure(category):
    # Fixed broad classes only: no raw database output, identifiers, paths,
    # SQLSTATE, exception text, arguments, descriptor contents, or secrets.
    allowed = {'AUTH', 'BASELINE', 'MANIFEST', 'CONNECTION', 'OUTPUT', 'IO'}
    sys.stderr.write('PREFLIGHT_' + (category if category in allowed else 'FAILED') + '_FAILED\n')

def parse_args(argv):
    if len(argv) != 8 or set(argv[::2]) != {'--auth-fd','--service-fd','--environment','--output'}:
        fail('AUTH')
    d = dict(zip(argv[::2], argv[1::2]))
    if not re.fullmatch(r'[0-9]+', d['--auth-fd']) or not re.fullmatch(r'[0-9]+', d['--service-fd']): fail('AUTH')
    auth_fd, service_fd = int(d['--auth-fd']), int(d['--service-fd'])
    if auth_fd == service_fd or auth_fd < 3 or service_fd < 3: fail('AUTH')
    if d['--environment'] not in ENVIRONMENTS: fail('AUTH')
    output = Path(d['--output'])
    if not output.is_absolute() or REPO == output.resolve() or REPO in output.resolve().parents: fail('IO')
    return auth_fd, service_fd, d['--environment'], output

def exact_json(raw, exact_keys, category):
    try:
        def unique(pairs):
            d = {}
            for k, v in pairs:
                if k in d: raise ValueError('duplicate')
                d[k] = v
            return d
        value = json.loads(raw.decode('utf-8'), object_pairs_hook=unique)
    except Exception:
        fail(category)
    if not isinstance(value, dict) or set(value) != exact_keys: fail(category)
    return value

def fd_regular(fd, mode, writable=False):
    try:
        s = os.fstat(fd)
        flags = fcntl.fcntl(fd, fcntl.F_GETFL)
    except OSError: fail('AUTH')
    if not stat.S_ISREG(s.st_mode) or s.st_uid != os.getuid() or stat.S_IMODE(s.st_mode) != mode or s.st_nlink != 1: fail('AUTH')
    if writable and (flags & os.O_ACCMODE) == os.O_RDONLY: fail('AUTH')
    if not writable and (flags & os.O_ACCMODE) == os.O_WRONLY: fail('CONNECTION')

def read_limited_fd(fd, limit, category):
    try:
        os.lseek(fd, 0, os.SEEK_SET)
        chunks, left = [], limit + 1
        while left:
            part = os.read(fd, left)
            if not part: break
            chunks.append(part); left -= len(part)
        raw = b''.join(chunks)
    except OSError: fail(category)
    if len(raw) > limit or b'\0' in raw: fail(category)
    try: raw.decode('utf-8')
    except UnicodeDecodeError: fail(category)
    return raw

def read_limited_stream(fd, limit, category):
    # Connection material may be an already-open pipe or regular descriptor;
    # unlike authorization, it is never rewound, locked, or persisted raw.
    try:
        chunks, left = [], limit + 1
        while left:
            part = os.read(fd, left)
            if not part: break
            chunks.append(part); left -= len(part)
        raw = b''.join(chunks)
    except OSError: fail(category)
    if len(raw) > limit or b'\0' in raw: fail(category)
    try: raw.decode('utf-8')
    except UnicodeDecodeError: fail(category)
    return raw

def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(65536), b''): h.update(block)
    return h.hexdigest()

def nofollow_file_identity(rel, expected_sha, expected_bytes, expected_mode, expected_git_mode):
    path = REPO / rel
    try:
        fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
        try:
            info = os.fstat(fd)
            if not stat.S_ISREG(info.st_mode) or info.st_size != expected_bytes or stat.S_IMODE(info.st_mode) != expected_mode: fail('MANIFEST')
            digest = hashlib.sha256()
            while True:
                block = os.read(fd, 65536)
                if not block: break
                digest.update(block)
            if digest.hexdigest() != expected_sha: fail('MANIFEST')
        finally: os.close(fd)
    except OSError: fail('MANIFEST')
    listing = run_readonly('git','ls-files','-s','--',rel).split()
    if len(listing) < 1 or listing[0] != expected_git_mode: fail('MANIFEST')

def run_readonly(*args):
    try:
        return subprocess.run(args, cwd=REPO, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                              stderr=subprocess.DEVNULL, check=True, text=True).stdout.strip()
    except Exception: fail('BASELINE')

def current_clean_exact_execution_state():
    if Path.cwd().resolve() != REPO: fail('BASELINE')
    if run_readonly('git','rev-parse','--show-toplevel') != str(REPO): fail('BASELINE')
    if run_readonly('git','rev-parse','--abbrev-ref','HEAD') != 'main': fail('BASELINE')
    current_head = run_readonly('git','rev-parse','HEAD')
    if not re.fullmatch(r'[0-9a-f]{40}', current_head): fail('BASELINE')
    if run_readonly('git','diff','--quiet') != '': fail('BASELINE')
    if run_readonly('git','diff','--cached','--quiet') != '': fail('BASELINE')
    if run_readonly('git','status','--porcelain=v1','--untracked-files=all') != '': fail('BASELINE')
    return current_head

def canonical_contract(contract):
    return json.dumps(contract, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode('ascii')

def validate_manifest(auth):
    path = REPO / MANIFEST_REL
    try:
        manifest_fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
        try:
            info = os.fstat(manifest_fd)
            if not stat.S_ISREG(info.st_mode) or stat.S_IMODE(info.st_mode) != 0o644: fail('MANIFEST')
            chunks = []
            while True:
                block = os.read(manifest_fd, 65536)
                if not block: break
                chunks.append(block)
            manifest_raw = b''.join(chunks)
        finally: os.close(manifest_fd)
    except OSError: fail('MANIFEST')
    if hashlib.sha256(manifest_raw).hexdigest() != auth['manifest_sha256']: fail('MANIFEST')
    # File 3 is a deterministic identity manifest, not an output-contract-only
    # convenience file.  Require its complete approved schema before extracting
    # the output contract; absence during this static phase remains fail-closed.
    required = {'manifest_version','phase','repository','authorized_file_scope','artifacts','output_contract',
                'expected_relations','expected_migrations','quarantined_candidates','expected_policies',
                'expected_grant_classes','audit_identities','function_security_categories',
                'trigger_dependency_categories','ownership_expectation','generated_type_target',
                'guard_identities','migration_inventory_summary','phase_27na_planning_authorities',
                'controlling_inputs','authorization_flags'}
    manifest = exact_json(manifest_raw, required, 'MANIFEST')
    if manifest['manifest_version'] != 1 or manifest['phase'] != 'PHASE_27NG_27NL_SECRET_SAFE_LIVE_PREFLIGHT_STATIC_REPAIR': fail('MANIFEST')
    repo = manifest['repository']
    if not isinstance(repo, dict) or set(repo) != {'path','construction_baseline','parent','subject','branch'}: fail('MANIFEST')
    if repo['path'] != str(REPO) or repo['construction_baseline'] != CONSTRUCTION_BASELINE or repo['branch'] != 'main': fail('MANIFEST')
    if not all(isinstance(repo[k], str) and repo[k] for k in ('parent','subject')): fail('MANIFEST')
    if not repo['parent'].startswith('f8e6') or run_readonly('git','show','-s','--format=%P',CONSTRUCTION_BASELINE) != repo['parent'] or run_readonly('git','show','-s','--format=%s',CONSTRUCTION_BASELINE) != repo['subject']: fail('MANIFEST')
    scope = manifest['authorized_file_scope']
    exact_scope = [SQL_REL, WRAPPER_REL, MANIFEST_REL,
                   'docs/discovery-phase-27ng-27nl-secret-safe-live-preflight-static-repair-gate.md']
    if scope != exact_scope: fail('MANIFEST')
    artifacts = manifest['artifacts']
    if not isinstance(artifacts, dict) or set(artifacts) != {'sql_candidate','wrapper_candidate'}: fail('MANIFEST')
    for name, rel in (('sql_candidate', SQL_REL), ('wrapper_candidate', WRAPPER_REL)):
        item = artifacts[name]
        if not isinstance(item, dict) or set(item) != {'path','sha256','bytes','git_mode','filesystem_mode'}: fail('MANIFEST')
        if item['path'] != rel or not SHA256.fullmatch(item['sha256']) or not isinstance(item['bytes'], int) or item['bytes'] < 0: fail('MANIFEST')
        if item['git_mode'] != '100644' or item['filesystem_mode'] != '0644': fail('MANIFEST')
        nofollow_file_identity(rel, item['sha256'], item['bytes'], 0o644, '100644')
    contract = manifest['output_contract']
    if not isinstance(contract, dict) or set(contract) != {'expected_keys_in_order','format_rules','categorical_allowlists','mandatory_negative_assertions'}: fail('MANIFEST')
    keys, rules, allow, negatives = (contract['expected_keys_in_order'], contract['format_rules'], contract['categorical_allowlists'], contract['mandatory_negative_assertions'])
    if not (isinstance(keys, list) and len(keys) == 56 and len(set(keys)) == 56 and all(isinstance(x,str) and re.fullmatch(r'[A-Z][A-Z0-9_]*',x) for x in keys)): fail('MANIFEST')
    if not (isinstance(rules, dict) and set(rules) == set(keys) and isinstance(allow, dict) and isinstance(negatives, dict)): fail('MANIFEST')
    negative_expected = {'ROW_VALUES_PRINTED','RAW_CATALOG_ROWS_PRINTED','RAW_MIGRATION_HISTORY_ROWS_PRINTED','POLICY_EXPRESSIONS_PRINTED','GRANT_ROWS_PRINTED','OWNER_IDENTITIES_PRINTED','FUNCTION_BODIES_PRINTED','TRIGGER_DEFINITIONS_PRINTED','INDEX_DEFINITIONS_PRINTED','CONSTRAINT_DEFINITIONS_PRINTED','DATABASE_URL_PRINTED','HOSTNAMES_PRINTED','PROJECT_REFERENCE_PRINTED','CREDENTIALS_PRINTED','SECRETS_PRINTED','RAW_ERROR_TEXT_PRINTED','UNAPPROVED_DATABASE_IDENTIFIERS_PRINTED'}
    if set(negatives) != negative_expected or any(v != 'false' for v in negatives.values()): fail('MANIFEST')
    for key in keys:
        rule = rules[key]
        kind = rule if isinstance(rule, str) else rule.get('kind') if isinstance(rule, dict) else None
        if kind not in {'integer','integer_or_unavailable','literal','categorical','timestamp','fixed_false'}: fail('MANIFEST')
        if isinstance(rule, dict) and set(rule) != ({'kind','value'} if kind == 'literal' else {'kind'}): fail('MANIFEST')
        if kind == 'literal' and (not isinstance(rule, dict) or not isinstance(rule['value'], str) or not rule['value']): fail('MANIFEST')
        if (key in negative_expected) != (kind == 'fixed_false'): fail('MANIFEST')
        if kind == 'categorical':
            if not isinstance(allow.get(key), list) or not allow[key] or len(allow[key]) != len(set(allow[key])) or not all(isinstance(x,str) and re.fullmatch(r'[A-Z0-9_]+',x) for x in allow[key]): fail('MANIFEST')
        elif key in allow: fail('MANIFEST')
    if set(allow) - set(keys): fail('MANIFEST')
    # All static identity collections are mandatory nonempty structured data;
    # their details remain in File 3 and are bound by its auth SHA-256.
    relations = manifest['expected_relations']
    if not isinstance(relations,list) or len(relations) != 15 or relations != sorted(relations,key=lambda x:x.get('repository_identity','') if isinstance(x,dict) else ''): fail('MANIFEST')
    if not all(isinstance(x,dict) and set(x)=={'repository_identity','identity_sha256','rls_enabled','rls_forced'} and isinstance(x['repository_identity'],str) and SHA256.fullmatch(x['identity_sha256']) and x['rls_enabled'] is True and x['rls_forced'] is False for x in relations): fail('MANIFEST')
    if {x['repository_identity'] for x in relations} != EXPECTED_RELATION_IDENTITIES: fail('MANIFEST')
    if any(x['identity_sha256'] != hashlib.sha256(x['repository_identity'].encode('utf-8')).hexdigest() for x in relations): fail('MANIFEST')
    migrations = manifest['expected_migrations']
    if not isinstance(migrations,list) or len(migrations)!=22 or migrations != sorted(migrations,key=lambda x:x.get('version','') if isinstance(x,dict) else ''): fail('MANIFEST')
    if not all(isinstance(x,dict) and set(x)=={'path','version','prefix_classification','sha256','git_blob','bytes','git_mode','eligibility_class'} and isinstance(x['path'],str) and re.fullmatch(r'[0-9]{14}',x['version']) and x['prefix_classification']=='CANONICAL_14_DIGIT_PREFIX' and SHA256.fullmatch(x['sha256']) and re.fullmatch(r'[0-9a-f]{40}',x['git_blob']) and isinstance(x['bytes'],int) and x['bytes']>=0 and x['git_mode']=='100644' and x['eligibility_class']=='EXPECTED_HISTORY_IDENTITY' for x in migrations): fail('MANIFEST')
    if {(x['path'],x['version']) for x in migrations} != EXPECTED_MIGRATION_PAIRS: fail('MANIFEST')
    for item in migrations:
        nofollow_file_identity(item['path'], item['sha256'], item['bytes'], 0o644, item['git_mode'])
        if run_readonly('git','ls-files','-s','--',item['path']).split()[1] != item['git_blob']: fail('MANIFEST')
    quarantined = manifest['quarantined_candidates']
    if not isinstance(quarantined,list) or len(quarantined)!=2: fail('MANIFEST')
    if not all(isinstance(x,dict) and set(x)=={'path','version','prefix_classification','sha256','git_blob','bytes','git_mode','eligibility_class','draft_path','draft_sha256','active_draft_byte_identical'} and isinstance(x['path'],str) and isinstance(x['draft_path'],str) and x['version']=='20260715' and x['prefix_classification']=='NONSTANDARD_8_DIGIT_DATE_PREFIX' and SHA256.fullmatch(x['sha256']) and SHA256.fullmatch(x['draft_sha256']) and re.fullmatch(r'[0-9a-f]{40}',x['git_blob']) and isinstance(x['bytes'],int) and x['bytes']>=0 and x['git_mode']=='100644' and x['active_draft_byte_identical'] is True and x['eligibility_class']=='QUARANTINED_NONSTANDARD_CANDIDATE' for x in quarantined): fail('MANIFEST')
    if {(x['path'],x['draft_path']) for x in quarantined} != EXPECTED_QUARANTINED_PAIRS: fail('MANIFEST')
    for item in quarantined:
        nofollow_file_identity(item['path'], item['sha256'], item['bytes'], 0o644, item['git_mode'])
        nofollow_file_identity(item['draft_path'], item['draft_sha256'], item['bytes'], 0o644, item['git_mode'])
        if item['draft_sha256'] != item['sha256']: fail('MANIFEST')
        if run_readonly('git','ls-files','-s','--',item['path']).split()[1] != item['git_blob']: fail('MANIFEST')
    if manifest['migration_inventory_summary'] != {'active_count':24,'expected_history_identity_count':22,'quarantined_nonstandard_candidate_count':2,'canonical_active_count':22,'nonstandard_active_count':2}: fail('MANIFEST')
    policies = manifest['expected_policies']
    if not isinstance(policies,list) or len(policies)!=15 or policies != sorted(policies,key=lambda x:x.get('repository_identity','') if isinstance(x,dict) else ''): fail('MANIFEST')
    if not all(isinstance(x,dict) and set(x)=={'repository_identity','identity_sha256','semantic_class'} and isinstance(x['repository_identity'],str) and SHA256.fullmatch(x['identity_sha256']) and x['semantic_class']=='EXACT_REPOSITORY_POLICY' for x in policies): fail('MANIFEST')
    if {x['repository_identity'] for x in policies} != EXPECTED_POLICY_IDENTITIES: fail('MANIFEST')
    if any(x['identity_sha256'] != hashlib.sha256(x['repository_identity'].encode('utf-8')).hexdigest() for x in policies): fail('MANIFEST')
    grants = manifest['expected_grant_classes']
    if grants != [{'role_class':'ANON','expectation':'EXPECTED_NONE'}, {'role_class':'AUTHENTICATED','expectation':'EXPECTED_NONE'}, {'role_class':'PUBLIC','expectation':'EXPECTED_NONE'}, {'role_class':'SERVICE_ROLE','expectation':'SUFFICIENT'}]: fail('MANIFEST')
    audit = manifest['audit_identities']
    audit_expected = [{'repository_identity':'public.admin_audit_archives','identity_sha256':hashlib.sha256(b'public.admin_audit_archives').hexdigest()}, {'repository_identity':'public.admin_audit_logs','identity_sha256':hashlib.sha256(b'public.admin_audit_logs').hexdigest()}]
    sequence_expected = {'repository_identity':'public.admin_audit_logs_id_seq','identity_sha256':hashlib.sha256(b'public.admin_audit_logs_id_seq').hexdigest()}
    if audit != {'table_identities':audit_expected,'sequence_identity':sequence_expected}: fail('MANIFEST')
    categories = {'function_security_categories': ['UNAVAILABLE','EXPECTED_MATCH','MISSING','UNSAFE_DEFINER_OR_SEARCH_PATH','UNEXPECTED_EXECUTE_GRANT'], 'trigger_dependency_categories': ['UNAVAILABLE','EXPECTED_MATCH','MISSING','UNEXPECTED']}
    if any(manifest[k] != v for k,v in categories.items()): fail('MANIFEST')
    if manifest['ownership_expectation'] != {'classification':'UNAVAILABLE','identity_disclosure':False}: fail('MANIFEST')
    target = manifest['generated_type_target']
    if not isinstance(target, dict) or set(target) != {'path','sha256','bytes','git_mode','filesystem_mode'} or target['path'] != 'lib/supabase/database.types.ts' or not SHA256.fullmatch(target['sha256']) or not isinstance(target['bytes'],int) or target['git_mode'] != '100644' or target['filesystem_mode'] != '0600': fail('MANIFEST')
    nofollow_file_identity(target['path'], target['sha256'], target['bytes'], 0o600, '100644')
    guards = manifest['guard_identities']
    if not isinstance(guards, list) or len(guards)!=4 or guards != sorted(guards, key=lambda x: x.get('transaction_order',-1) if isinstance(x,dict) else -1): fail('MANIFEST')
    if not all(isinstance(x,dict) and set(x) == {'path','sha256','bytes','git_mode','filesystem_mode','guard_count','guard_before_transaction','transaction_order'} and isinstance(x['path'],str) and SHA256.fullmatch(x['sha256']) and isinstance(x['bytes'],int) and x['git_mode']=='100644' and x['filesystem_mode']=='0644' and x['guard_count']==1 and x['guard_before_transaction'] is True and isinstance(x['transaction_order'],int) for x in guards): fail('MANIFEST')
    if {x['transaction_order'] for x in guards} != {1,2,3,4} or len({x['path'] for x in guards}) != 4: fail('MANIFEST')
    if {x['path'] for x in guards} != EXPECTED_GUARD_PATHS: fail('MANIFEST')
    for item in guards:
        nofollow_file_identity(item['path'], item['sha256'], item['bytes'], 0o644, '100644')
    planning_authorities = [
        {'path':'/private/tmp/aifinder-phase-27na-27nf-static-readiness-20260721T004200Z/01-migration-filename-placement-disposition.md','sha256':'8083bcea9a395e44d52e82daa7f011488ee8e0e34270470d98d9bee61c02a23a','bytes':6109,'filesystem_mode':'0644'},
        {'path':'/private/tmp/aifinder-phase-27na-27nf-static-readiness-20260721T004200Z/02-migration-history-evidence-contract.md','sha256':'165b5dcd9129a13069ec336b3e8d623662fbc6be7e636e79f4af134817582a0a','bytes':5109,'filesystem_mode':'0644'},
        {'path':'/private/tmp/aifinder-phase-27na-27nf-static-readiness-20260721T004200Z/03-audit-grant-dependency-map.md','sha256':'9a6b532ef341d87105ba5db414d2c2524cea0fb1d249c92568fc638975043bdc','bytes':5467,'filesystem_mode':'0644'},
        {'path':'/private/tmp/aifinder-phase-27na-27nf-static-readiness-20260721T004200Z/04-secret-safe-live-preflight-design.md','sha256':'292d982c95e39ee0663035c57b6b5a5f7ee2867aff72260c13b541ddacbf074b','bytes':4832,'filesystem_mode':'0644'},
        {'path':'/private/tmp/aifinder-phase-27na-27nf-static-readiness-20260721T004200Z/05-failure-rollback-contract.md','sha256':'7bf0109221c3357ff8256b121fec4ac79249596d284259cfd9d85d9234111765','bytes':3811,'filesystem_mode':'0644'},
        {'path':'/private/tmp/aifinder-phase-27na-27nf-static-readiness-20260721T004200Z/06-type-generation-dependency-order.md','sha256':'31d39d96edbbee4bb59a3f85596dea750ee4ae39ec3374158e8ca3093bb1202d','bytes':2363,'filesystem_mode':'0644'},
    ]
    if manifest['phase_27na_planning_authorities'] != planning_authorities: fail('MANIFEST')
    controls = manifest['controlling_inputs']
    if controls != sorted(controls, key=lambda x: x.get('path','') if isinstance(x,dict) else ''): fail('MANIFEST')
    if not isinstance(controls,list) or len(controls) != 14: fail('MANIFEST')
    if not all(isinstance(x,dict) and set(x) == {'path','sha256','bytes','git_mode','filesystem_mode'} and isinstance(x['path'],str) and SHA256.fullmatch(x['sha256']) and isinstance(x['bytes'],int) and x['git_mode'] == '100644' and x['filesystem_mode'] in {'0600','0644'} for x in controls): fail('MANIFEST')
    if {x['path'] for x in controls} != EXPECTED_CONTROL_PATHS or len({x['path'] for x in controls}) != 14: fail('MANIFEST')
    for item in controls:
        allowed_mode = '0600' if item['path'] == 'lib/supabase/database.types.ts' else '0644'
        if item['filesystem_mode'] != allowed_mode: fail('MANIFEST')
        nofollow_file_identity(item['path'], item['sha256'], item['bytes'], int(allowed_mode, 8), '100644')
    flags = manifest['authorization_flags']
    if not isinstance(flags, dict) or set(flags) != {'execution_authorized','live_access_authorized','migration_execution_authorized','type_generation_authorized'} or any(v is not False for v in flags.values()): fail('MANIFEST')
    digest = hashlib.sha256(canonical_contract(contract)).hexdigest()
    if digest != auth['output_contract_sha256']: fail('MANIFEST')
    return contract

def parse_utc(value):
    if not isinstance(value, str) or not RFC3339_MS.fullmatch(value): fail('AUTH')
    try: return dt.datetime.strptime(value, '%Y-%m-%dT%H:%M:%S.%fZ').replace(tzinfo=dt.timezone.utc)
    except ValueError: fail('AUTH')

def validate_auth(auth, environment, current_head, output):
    exact = {'authorization_version':1, 'construction_baseline':CONSTRUCTION_BASELINE,
             'repository_head':current_head, 'sql_path':SQL_REL, 'wrapper_path':WRAPPER_REL, 'manifest_path':MANIFEST_REL,
             'environment_classification':environment, 'output_path':str(output), 'consumed_state':'UNUSED', 'read_only':True,
             'migration_execution':False, 'sql_mutation':False, 'type_generation':False}
    for key, value in exact.items():
        if auth.get(key) != value: fail('AUTH')
    if not isinstance(auth['authorization_record_path'], str) or not Path(auth['authorization_record_path']).is_absolute(): fail('AUTH')
    if not isinstance(auth['authorization_lock_path'], str) or not Path(auth['authorization_lock_path']).is_absolute(): fail('AUTH')
    if not isinstance(auth['authorization_nonce'], str) or not re.fullmatch(r'[0-9a-f]{32,128}', auth['authorization_nonce']): fail('AUTH')
    for key in ('sql_sha256','wrapper_sha256','manifest_sha256','output_contract_sha256'):
        if not isinstance(auth[key],str) or not SHA256.fullmatch(auth[key]): fail('AUTH')
    issued, expires, now = parse_utc(auth['issued_at']), parse_utc(auth['expires_at']), dt.datetime.now(dt.timezone.utc)
    if expires < issued or expires - issued > dt.timedelta(seconds=TTL_SECONDS) or now < issued or now > expires: fail('AUTH')
    if sha(REPO / SQL_REL) != auth['sql_sha256'] or sha(REPO / WRAPPER_REL) != auth['wrapper_sha256']: fail('BASELINE')

def consume_auth(inherited_fd, auth, original):
    # Replacing the complete canonical record is crash-safe: a private same-dir
    # file is fsync'd, atomically renamed, then the parent directory is fsync'd.
    # Any mismatch/rename/re-read ambiguity is deliberately treated as consumed.
    record = Path(auth['authorization_record_path'])
    lock_path = Path(auth['authorization_lock_path'])
    if record.is_symlink() or lock_path.is_symlink() or not record.parent.is_dir() or lock_path.parent != record.parent: fail('AUTH')
    try:
        lock_fd = os.open(lock_path, os.O_RDWR | os.O_NOFOLLOW)
        try:
            fd_regular(lock_fd, 0o600, writable=True)
            fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            record_fd = os.open(record, os.O_RDWR | os.O_NOFOLLOW)
            try:
                fd_regular(record_fd, 0o600, writable=True)
                inherited = os.fstat(inherited_fd); opened = os.fstat(record_fd)
                if (inherited.st_dev, inherited.st_ino) != (opened.st_dev, opened.st_ino): fail('AUTH')
                current = read_limited_fd(record_fd, MAX_AUTH, 'AUTH')
                if current != original: fail('AUTH')
                parsed = exact_json(current, AUTH_KEYS, 'AUTH')
                if parsed != auth or parsed['consumed_state'] != 'UNUSED': fail('AUTH')
                changed = dict(parsed); changed['consumed_state'] = 'USED__'
                encoded = json.dumps(changed, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode('ascii')
                if len(encoded) > MAX_AUTH: fail('AUTH')
                tmp_fd, tmp_name = tempfile.mkstemp(prefix='.aifinder-auth-', dir=record.parent)
                CLEANUP_PATHS.add(Path(tmp_name))
                try:
                    os.fchmod(tmp_fd, 0o600); os.write(tmp_fd, encoded); os.fsync(tmp_fd)
                finally: os.close(tmp_fd)
                try:
                    os.replace(tmp_name, record); CLEANUP_PATHS.discard(Path(tmp_name)); tmp_name = None
                    parent_fd = os.open(record.parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
                    try: os.fsync(parent_fd)
                    finally: os.close(parent_fd)
                finally:
                    if tmp_name:
                        try: os.unlink(tmp_name)
                        except OSError: pass
                        CLEANUP_PATHS.discard(Path(tmp_name))
                verify_fd = os.open(record, os.O_RDONLY | os.O_NOFOLLOW)
                try:
                    fd_regular(verify_fd, 0o600, writable=False)
                    reread = exact_json(read_limited_fd(verify_fd, MAX_AUTH, 'AUTH'), AUTH_KEYS, 'AUTH')
                    if reread != changed or reread['consumed_state'] != 'USED__': fail('AUTH')
                finally: os.close(verify_fd)
            finally: os.close(record_fd)
        finally: os.close(lock_fd)
    except Failure: raise
    except OSError: fail('AUTH')

def validate_service_descriptor(fd):
    # Read and validate the already-open, regular descriptor in bounded memory;
    # rewind it for libpq afterwards.  Service material is never written to a
    # temporary file, command argument, process listing, or environment value.
    fd_regular(fd, 0o600, writable=False)
    raw = read_limited_fd(fd, MAX_SERVICE, 'CONNECTION')
    try: text = raw.decode('utf-8')
    except UnicodeDecodeError: fail('CONNECTION')
    if '\r' in text or not text.endswith('\n') or text.count('[aifinder_preflight]') != 1: fail('CONNECTION')
    lines = text.splitlines()
    if not lines or lines[0] != '[aifinder_preflight]' or len(lines) != 7: fail('CONNECTION')
    values = {}
    for line in lines[1:]:
        if line.count('=') != 1: fail('CONNECTION')
        key, value = line.split('=', 1)
        if key in values or key not in SERVICE_KEYS or not value or any(c in value for c in '\n\r\0') or re.search(r'(?i)(://|\s|service|options|;|--)', value): fail('CONNECTION')
        values[key] = value
    if set(values) != SERVICE_KEYS or not re.fullmatch(r'[0-9]{1,5}', values['port']) or values['sslmode'] != 'verify-full': fail('CONNECTION')
    try: os.lseek(fd, 0, os.SEEK_SET)
    except OSError: fail('CONNECTION')
    return fd

def parse_output_timestamp(value):
    if not RFC3339_MS.fullmatch(value): fail('OUTPUT')
    try: dt.datetime.strptime(value, '%Y-%m-%dT%H:%M:%S.%fZ')
    except ValueError: fail('OUTPUT')

def normalize(stdout, stderr, manifest):
    if stderr or not stdout.endswith(b'\n') or len(stdout) > MAX_BYTES or stdout.count(b'\n') != MAX_LINES or b'\0' in stdout: fail('OUTPUT')
    try: lines = stdout.decode('utf-8').splitlines()
    except UnicodeDecodeError: fail('OUTPUT')
    keys, rules, allow, negatives = (manifest['expected_keys_in_order'], manifest['format_rules'], manifest['categorical_allowlists'], manifest['mandatory_negative_assertions'])
    if len(lines) != 56: fail('OUTPUT')
    normalized = []
    for expected, line in zip(keys, lines):
        if line.count('|') != 1: fail('OUTPUT')
        key, value = line.split('|', 1)
        if key != expected or not value: fail('OUTPUT')
        rule = rules[key]
        kind = rule if isinstance(rule, str) else rule['kind']
        if key in negatives:
            if value != 'false': fail('OUTPUT')
        elif kind == 'integer':
            if not re.fullmatch(r'(?:0|[1-9][0-9]*)', value): fail('OUTPUT')
        elif kind == 'integer_or_unavailable':
            if value != 'UNAVAILABLE' and not re.fullmatch(r'(?:0|[1-9][0-9]*)', value): fail('OUTPUT')
        elif kind == 'timestamp':
            parse_output_timestamp(value)
        elif kind == 'literal':
            if value != rule['value']: fail('OUTPUT')
        elif kind == 'fixed_false':
            if value != 'false': fail('OUTPUT')
        elif kind == 'categorical':
            if value not in allow[key]: fail('OUTPUT')
        else: fail('OUTPUT')
        # Type/allowlist checks happen first so valid SHA-like/category values
        # cannot be rejected merely for their approved shape.
        if kind not in {'categorical'} and (IDENTIFIER.search(value) or SECRETISH.search(value)): fail('OUTPUT')
        normalized.append(key + '|' + value + '\n')
    return ''.join(normalized).encode('utf-8')

def require_unexpired(auth):
    # This is intentionally repeated immediately before the one psql launch.
    now = dt.datetime.now(dt.timezone.utc)
    if now > parse_utc(auth['expires_at']) or now < parse_utc(auth['issued_at']): fail('AUTH')

def invoke_once(service_fd, environment, manifest, auth):
    env = {'PATH': os.defpath, 'HOME': '/nonexistent', 'PGSERVICEFILE': '/dev/fd/' + str(service_fd),
           'PGSERVICE': 'aifinder_preflight', 'PGPASSFILE': os.devnull, 'LC_ALL': 'C', 'LANG': 'C'}
    command = ['psql','--no-psqlrc','--no-password','-qAt','-F','|','-d','service=aifinder_preflight',
               '-v','AIFINDER_REVIEWED_WRAPPER=PHASE_27NG_27NL_REVIEWED_WRAPPER',
               '-v','AIFINDER_SECRET_SAFE_LIVE_PREFLIGHT_ACTIVATED=PHASE_27NG_27NL_ONE_USE_AUTHORIZATION_CONSUMED',
               '-v','AIFINDER_TARGET_ENVIRONMENT_CLASSIFICATION=' + environment, '-f', str(REPO / SQL_REL)]
    require_unexpired(auth)
    try: proc = subprocess.Popen(command, cwd=REPO, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env, close_fds=True, pass_fds=(service_fd,))
    except OSError: fail('CONNECTION')
    streams, selector = {proc.stdout: bytearray(), proc.stderr: bytearray()}, selectors.DefaultSelector()
    deadline = time.monotonic() + 30.0
    try:
        for stream in streams: selector.register(stream, selectors.EVENT_READ)
        while selector.get_map():
            remaining = deadline - time.monotonic()
            if remaining <= 0: fail('OUTPUT')
            for key, _ in selector.select(remaining):
                chunk = os.read(key.fileobj.fileno(), 4096)
                if not chunk:
                    selector.unregister(key.fileobj)
                    continue
                streams[key.fileobj].extend(chunk)
                aggregate = b''.join(bytes(v) for v in streams.values())
                if len(aggregate) > MAX_BYTES or aggregate.count(b'\n') > MAX_LINES: fail('OUTPUT')
        if proc.wait(timeout=max(0.0, deadline - time.monotonic())) != 0: fail('OUTPUT')
        return normalize(bytes(streams[proc.stdout]), bytes(streams[proc.stderr]), manifest)
    except subprocess.TimeoutExpired: fail('OUTPUT')
    finally:
        if proc.poll() is None:
            proc.kill()
        try: proc.wait(timeout=1)
        except Exception: pass
        selector.close()
        for stream in streams:
            try: stream.close()
            except Exception: pass

def persist_exclusive(path, canonical):
    evidence = canonical + b'BOUNDED_EVIDENCE_SHA256|' + hashlib.sha256(canonical).hexdigest().encode('ascii') + b'\n'
    parent = path.parent
    if path.is_symlink() or parent.is_symlink() or not parent.is_dir() or parent.resolve() != parent or REPO == parent.resolve() or REPO in parent.resolve().parents: fail('IO')
    tmp_name = None
    try:
        fd, tmp_name = tempfile.mkstemp(prefix='.aifinder-evidence-', dir=parent)
        CLEANUP_PATHS.add(Path(tmp_name))
        try:
            os.fchmod(fd, 0o600)
            written = 0
            while written < len(evidence):
                count = os.write(fd, evidence[written:])
                if count <= 0: fail('IO')
                written += count
            os.fsync(fd)
        finally: os.close(fd)
        # link() is an atomic no-overwrite publication: it fails if final exists.
        os.link(tmp_name, path, follow_symlinks=False)
        parent_fd = os.open(parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try: os.fsync(parent_fd)
        finally: os.close(parent_fd)
        os.unlink(tmp_name); CLEANUP_PATHS.discard(Path(tmp_name)); tmp_name = None
    except (Failure, OSError):
        if tmp_name:
            try: os.unlink(tmp_name)
            except OSError: pass
            CLEANUP_PATHS.discard(Path(tmp_name))
        fail('IO')

def main():
    auth_fd, service_fd, environment, output = parse_args(sys.argv[1:])
    # Registry and signal handlers exist before any authorization read/consume;
    # each entry is optional so early signals cannot dereference absent temps.
    CLEANUP_PATHS.clear()
    cleanup_state = {'private': None, 'service': None}
    def cleanup():
        try:
            for pending in tuple(CLEANUP_PATHS):
                if pending.exists(): pending.unlink()
                CLEANUP_PATHS.discard(pending)
            service_path = cleanup_state['service']
            if service_path is not None and service_path.exists(): service_path.unlink()
            private_path = cleanup_state['private']
            if private_path is not None and private_path.exists(): private_path.rmdir()
            if private_path is not None and private_path.exists(): fail('IO')
        except OSError: fail('IO')
    def on_signal(signum, frame):
        try: cleanup()
        except Failure: pass
        raise SystemExit(1)
    old_handlers = {sig: signal.signal(sig, on_signal) for sig in (signal.SIGHUP, signal.SIGINT, signal.SIGTERM)}
    fd_regular(auth_fd, 0o600, writable=True)
    auth_raw = read_limited_fd(auth_fd, MAX_AUTH, 'AUTH')
    auth = exact_json(auth_raw, AUTH_KEYS, 'AUTH')
    current_head = current_clean_exact_execution_state()
    validate_auth(auth, environment, current_head, output)
    manifest = validate_manifest(auth)
    consume_auth(auth_fd, auth, auth_raw)
    try:
        validated_service_fd = validate_service_descriptor(service_fd)
        persist_exclusive(output, invoke_once(validated_service_fd, environment, manifest, auth))
    finally:
        try:
            cleanup()
        finally:
            for sig, handler in old_handlers.items(): signal.signal(sig, handler)

try:
    main()
except Failure as failure:
    broad_failure(failure.category)
    sys.exit(1)
except Exception:
    broad_failure('FAILED')
    sys.exit(1)
PY
}
