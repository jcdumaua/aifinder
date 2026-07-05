#!/usr/bin/env node

/**
 * AiFinder Discovery Engine read-only live inspection.
 *
 * Boundary:
 * - aggregate-only live readiness inspection
 * - infrastructure tables only for the first live probe
 * - no application payload tables
 * - no mutation
 * - no admin API invocation
 * - no local server startup
 * - no crawler, extraction, LLM, evidence acquisition, candidate staging,
 *   candidate decision, approve_for_draft, public tools writes, or
 *   discovered_tools writes
 *
 * This script is implemented in Phase 25W but must not be executed until a
 * separate approved execution gate.
 */

import { execFileSync } from 'node:child_process';
import process from 'node:process';

const EXPECTED_REPO = 'https://github.com/jcdumaua/aifinder.git';
const EXPECTED_BRANCH = 'main';
const REQUIRED_MODE = 'aggregate-only';
const REQUIRED_GUARD = 'AIFINDER_RUN_DISCOVERY_READ_ONLY_LIVE_INSPECTION';
const REQUIRED_GUARD_VALUE = '1';
const REQUIRED_ENV_NAMES = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const ALLOWED_TABLES = [
  {
    schema: 'public',
    table: 'discovery_sources',
    label: 'public.discovery_sources',
    timestampColumns: ['created_at', 'updated_at'],
    statusColumn: 'status',
    statusValues: ['active', 'inactive', 'paused', 'blocked'],
  },
  {
    schema: 'public',
    table: 'discovery_runs',
    label: 'public.discovery_runs',
    timestampColumns: ['created_at', 'updated_at'],
    statusColumn: 'status',
    statusValues: ['queued', 'running', 'completed', 'failed', 'blocked'],
  },
];

const DENIED_TABLES = [
  'public.discovery_candidate_tools',
  'public.discovered_tools',
  'public.tools',
];

const DENIED_SQL_TOKENS = [
  'insert',
  'update',
  'delete',
  'upsert',
  'truncate',
  'merge',
  'alter',
  'drop',
  'create',
  'grant',
  'revoke',
  'call',
];

function printSection(title) {
  console.log('');
  console.log(`=== ${title} ===`);
}

function fail(message) {
  console.error(`FAILED: ${message}`);
  process.exitCode = 1;
  throw new Error(message);
}

function runGit(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function parseArgs(argv) {
  const args = {
    expectedHead: '',
    expectedSubject: '',
    mode: '',
    maxOutputLines: 300,
  };

  const allowed = new Set([
    '--expected-head',
    '--expected-subject',
    '--mode',
    '--max-output-lines',
  ]);

  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (!allowed.has(flag)) {
      fail(`unknown CLI flag: ${flag}`);
    }

    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      fail(`missing value for ${flag}`);
    }

    if (flag === '--expected-head') {
      args.expectedHead = value;
    } else if (flag === '--expected-subject') {
      args.expectedSubject = value;
    } else if (flag === '--mode') {
      args.mode = value;
    } else if (flag === '--max-output-lines') {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 50 || parsed > 600) {
        fail('--max-output-lines must be an integer between 50 and 600');
      }
      args.maxOutputLines = parsed;
    }

    i += 1;
  }

  if (!args.expectedHead) {
    fail('--expected-head is required');
  }
  if (!args.expectedSubject) {
    fail('--expected-subject is required');
  }
  if (args.mode !== REQUIRED_MODE) {
    fail(`--mode must be ${REQUIRED_MODE}`);
  }

  return args;
}

function assertNoUnexpectedDiscoveryOptIns() {
  const discoveryEnvNames = Object.keys(process.env)
    .filter((name) => name.startsWith('AIFINDER_RUN_DISCOVERY_'))
    .sort();

  const unexpected = discoveryEnvNames.filter((name) => name !== REQUIRED_GUARD);
  if (unexpected.length > 0) {
    fail(`unexpected AIFINDER_RUN_DISCOVERY_* variables set: ${unexpected.join(', ')}`);
  }

  if (process.env[REQUIRED_GUARD] !== REQUIRED_GUARD_VALUE) {
    fail(`${REQUIRED_GUARD} must be set to ${REQUIRED_GUARD_VALUE}`);
  }

  console.log(`allowed_guard_present=true :: ${REQUIRED_GUARD}`);
}

function assertRequiredEnvNamesPresent() {
  for (const name of REQUIRED_ENV_NAMES) {
    if (!process.env[name]) {
      fail(`required environment variable is missing: ${name}`);
    }
    console.log(`env_name_present=true :: ${name}`);
  }
}

function assertRepoState(expectedHead, expectedSubject) {
  const origin = runGit(['config', '--get', 'remote.origin.url']);
  const branch = runGit(['branch', '--show-current']);
  const actualHeadShort = runGit(['rev-parse', '--short', 'HEAD']);
  const actualHeadFull = runGit(['rev-parse', 'HEAD']);
  const actualSubject = runGit(['log', '-1', '--format=%s']);

  console.log(`origin=${origin}`);
  console.log(`branch=${branch}`);
  console.log(`expected_head=${expectedHead}`);
  console.log(`expected_subject=${expectedSubject}`);
  console.log(`actual_head_short=${actualHeadShort}`);
  console.log(`actual_head_full=${actualHeadFull}`);
  console.log(`actual_subject=${actualSubject}`);

  if (origin !== EXPECTED_REPO) {
    fail('repo origin mismatch');
  }
  if (branch !== EXPECTED_BRANCH) {
    fail('branch mismatch');
  }
  if (actualHeadShort !== expectedHead && actualHeadFull !== expectedHead) {
    fail('expected HEAD check failed');
  }
  if (actualSubject !== expectedSubject) {
    fail('expected subject check failed');
  }

  const counts = runGit(['rev-list', '--left-right', '--count', 'origin/main...HEAD']);
  const [behindRaw, aheadRaw] = counts.split(/\s+/);
  const behind = Number(behindRaw);
  const ahead = Number(aheadRaw);

  console.log(`ahead_count=${ahead}`);
  console.log(`behind_count=${behind}`);

  if (ahead !== 0 || behind !== 0) {
    fail('branch must be synced with origin/main before live inspection');
  }

  const status = runGit(['status', '--porcelain', '--untracked-files=all']);
  if (status) {
    console.log(status);
    fail('working tree must be clean before live inspection');
  }

  console.log('repo_state_check=passed');
}

function assertAllowlistIsSafe() {
  const seen = new Set();

  for (const item of ALLOWED_TABLES) {
    if (item.schema !== 'public') {
      fail(`table is outside public schema: ${item.label}`);
    }
    if (!/^[a-z_][a-z0-9_]*$/.test(item.table)) {
      fail(`unsafe table name: ${item.label}`);
    }
    if (DENIED_TABLES.includes(item.label)) {
      fail(`denied application payload table is allowlisted: ${item.label}`);
    }
    if (seen.has(item.label)) {
      fail(`duplicate allowlist table: ${item.label}`);
    }
    seen.add(item.label);
  }

  console.log('probe_scope=infrastructure_only');
  console.log(`table_allowlist_count=${ALLOWED_TABLES.length}`);
  for (const item of ALLOWED_TABLES) {
    console.log(`table_allowlisted=true :: ${item.label}`);
  }
  for (const table of DENIED_TABLES) {
    console.log(`table_denied=true :: ${table}`);
  }
}

function assertQueryTextSafe(text) {
  const lowered = text.toLowerCase();
  for (const token of DENIED_SQL_TOKENS) {
    const pattern = new RegExp(`\\b${token}\\b`, 'i');
    if (pattern.test(lowered)) {
      fail(`denied query token detected: ${token}`);
    }
  }
  if (/\*/.test(text)) {
    fail('broad star selector is denied');
  }
}

function redactKnownSecrets(text) {
  let sanitized = String(text);

  for (const name of REQUIRED_ENV_NAMES) {
    const value = process.env[name];
    if (value) {
      sanitized = sanitized.split(value).join(`[redacted:${name}]`);
    }
  }

  return sanitized;
}

function summarizeError(error) {
  if (!error) {
    return 'none';
  }

  const message = typeof error.message === 'string' ? error.message : String(error);
  return redactKnownSecrets(message).slice(0, 240);
}

async function loadSupabaseClient() {
  const mod = await import('@supabase/supabase-js');
  const { createClient } = mod;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'x-aifinder-inspection-mode': 'read-only-aggregate-infrastructure',
        },
      },
    },
  );
}

async function countRows(client, item) {
  const queryText = `${item.label}:count`;
  assertQueryTextSafe(queryText);

  const { count, error } = await client
    .from(item.table)
    .select('id', { count: 'exact', head: true });

  if (error) {
    return {
      table: item.label,
      check: 'total_count',
      ok: false,
      error_class: summarizeError(error),
    };
  }

  return {
    table: item.label,
    check: 'total_count',
    ok: true,
    count,
  };
}

async function latestTimestamp(client, item, column) {
  const queryText = `${item.label}:latest:${column}`;
  assertQueryTextSafe(queryText);

  const { data, error } = await client
    .from(item.table)
    .select(column)
    .order(column, { ascending: false, nullsFirst: false })
    .limit(1);

  if (error) {
    return {
      table: item.label,
      check: `latest_${column}`,
      ok: false,
      error_class: summarizeError(error),
    };
  }

  return {
    table: item.label,
    check: `latest_${column}`,
    ok: true,
    value_present: Array.isArray(data) && data.length > 0 && Boolean(data[0]?.[column]),
  };
}

async function statusCount(client, item, statusValue) {
  if (!item.statusColumn) {
    return null;
  }

  const queryText = `${item.label}:status:${item.statusColumn}:${statusValue}`;
  assertQueryTextSafe(queryText);

  const { count, error } = await client
    .from(item.table)
    .select(item.statusColumn, { count: 'exact', head: true })
    .eq(item.statusColumn, statusValue);

  if (error) {
    return {
      table: item.label,
      check: `status_count:${item.statusColumn}:${statusValue}`,
      ok: false,
      error_class: summarizeError(error),
    };
  }

  return {
    table: item.label,
    check: `status_count:${item.statusColumn}:${statusValue}`,
    ok: true,
    count,
  };
}

async function runAggregateInspection() {
  const client = await loadSupabaseClient();
  const results = [];

  for (const item of ALLOWED_TABLES) {
    results.push(await countRows(client, item));

    for (const column of item.timestampColumns) {
      results.push(await latestTimestamp(client, item, column));
    }

    for (const statusValue of item.statusValues) {
      const result = await statusCount(client, item, statusValue);
      if (result) {
        results.push(result);
      }
    }
  }

  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log('=== AiFinder Discovery Read-Only Live Inspection ===');
  console.log('terminal_workflow=read_only_live_inspection');
  console.log('operational_mode=aggregate_only');
  console.log('probe_scope=infrastructure_only');
  console.log('no_mutation=true');
  console.log('no_admin_api_invocation=true');
  console.log('no_local_server_startup=true');
  console.log('no_crawler_extraction_candidate_or_publishing_execution=true');

  printSection('Boundary');
  console.log('Aggregate read-only infrastructure inspection only.');
  console.log('No application payload tables.');
  console.log('No DB mutation.');
  console.log('No admin API invocation.');
  console.log('No local server startup.');
  console.log('No crawler execution.');
  console.log('No extraction execution.');
  console.log('No LLM execution.');
  console.log('No evidence acquisition.');
  console.log('No candidate staging.');
  console.log('No candidate decision execution.');
  console.log('No approve_for_draft.');
  console.log('No public tools writes.');
  console.log('No discovered_tools writes.');

  printSection('Repo preflight');
  assertRepoState(args.expectedHead, args.expectedSubject);

  printSection('Environment preflight');
  assertNoUnexpectedDiscoveryOptIns();
  assertRequiredEnvNamesPresent();

  printSection('Allowlist preflight');
  assertAllowlistIsSafe();

  printSection('Aggregate read-only infrastructure results');
  const results = await runAggregateInspection();

  for (const result of results) {
    console.log(JSON.stringify(result));
  }

  const failed = results.filter((result) => !result.ok);
  console.log(`aggregate_result_count=${results.length}`);
  console.log(`aggregate_error_count=${failed.length}`);

  if (failed.length > 0) {
    fail('one or more aggregate read-only infrastructure checks returned errors');
  }

  printSection('Script result');
  console.log('PASSED: Discovery read-only live infrastructure inspection completed safely.');
}

main().catch((error) => {
  if (!process.exitCode) {
    process.exitCode = 1;
  }
  console.error(`FAILED: ${summarizeError(error)}`);
});
