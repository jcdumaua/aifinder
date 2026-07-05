# AiFinder Discovery Engine — Phase 25AM Query-Shape Local Review Result Documentation Gate

## Phase

Phase 25AM — Query-Shape Local Review Result Documentation Gate

## Status

Documentation artifact only.

This phase documents the Phase 25AL local query-shape review result and formally records the `eq_status_column_count=0` anomaly.

It does not modify the inspection script.

It does not execute the inspection script.

It does not perform any live database read.

## Current baseline

- Latest pushed baseline before this documentation gate: Phase 25AL.
- Baseline commit: `7af4550`
- Baseline subject: `Document Phase 25AL query shape review result`
- Full baseline commit is verified at runtime by this gate from local Git state.

## Phase 25AL committed result summary

Phase 25AL was reported committed and pushed with commit `7af4550`.

The Gemini-approved key findings were:

```text
select_id_count=1
select_status_column_count=0
eq_status_column_count=0
head_true_count=2
classification=Classification Q5 — query-shape evidence inconclusive
primary_anomaly=eq_status_column_count=0
```

## Phase 25AM local query-block summary

```text
select_id_count=1
select_status_column_count=0
select_star_count=0
eq_status_column_count=0
in_status_column_count=0
filter_status_column_count=0
head_true_count=2
exact_count_count=2
rpc_count=0
filter_pattern_summary=no static eq/in/filter statusColumn pattern detected
primary_anomaly=eq_status_column_count=0
```

## Structural interpretation

The local review currently supports this corrected interpretation:

1. The Phase 25AL automated counters recorded `eq_status_column_count=0`.
2. The exact local evidence block shows that this counter was a false negative caused by a brittle static pattern.
3. The actual source-status count query does include an explicit filter:

```text
.select(item.statusColumn, { count: 'exact', head: true })
.eq(item.statusColumn, statusValue)
```

4. The Phase 25AL search pattern looked for a literal `statusColumn` argument shape and did not match the object-property form `item.statusColumn`.
5. Therefore, the query should not be described as missing an explicit filter.
6. The live failure should not be treated as proven environment drift yet.
7. The next likely diagnostic target is the specific Supabase/PostgREST query shape that combines `select(item.statusColumn, { count: 'exact', head: true })` with `.eq(item.statusColumn, statusValue)`.
8. A future planning gate should decide whether to change the selected column to a safer projection such as `id`, improve static verification to recognize `item.statusColumn`, or add a separate metadata-safe diagnostic.
9. No script change is approved in Phase 25AM.

## Corrected meaning of the Phase 25AL anomaly

The `eq_status_column_count=0` anomaly is still important, but its meaning is corrected:

```text
Incorrect meaning: the source-status query has no explicit filter.
Corrected meaning: the Phase 25AL static detector failed to recognize the existing `.eq(item.statusColumn, statusValue)` filter.
```

The false negative should be documented because it affects future static verification design.

Future static verification must recognize at least these filter forms:

```text
.eq(statusColumn, statusValue)
.eq(item.statusColumn, statusValue)
.eq(<resolved status column variable>, <status value variable>)
```

It should also separately verify the selected-column/projection shape.

## Exact local query-shape evidence block

file=testing/discovery-read-only-live-inspection.mjs
line_window=20-615
```text
    20	 * - does not add row-level status enumeration
    21	 * - does not broaden inspection scope
    22	 */
    23
    24	import { execFileSync } from 'node:child_process';
    25	import process from 'node:process';
    26
    27	const EXPECTED_REPO = 'https://github.com/jcdumaua/aifinder.git';
    28	const EXPECTED_BRANCH = 'main';
    29	const REQUIRED_MODE = 'aggregate-only';
    30	const REQUIRED_GUARD = 'AIFINDER_RUN_DISCOVERY_READ_ONLY_LIVE_INSPECTION';
    31	const REQUIRED_GUARD_VALUE = '1';
    32	const REQUIRED_ENV_NAMES = [
    33	  'NEXT_PUBLIC_SUPABASE_URL',
    34	  'SUPABASE_SERVICE_ROLE_KEY',
    35	];
    36
    37	const SUMMARY_LIMIT = 240;
    38
    39	const ALLOWED_TABLES = [
    40	  {
    41	    schema: 'public',
    42	    table: 'discovery_sources',
    43	    label: 'public.discovery_sources',
    44	    timestampColumns: ['created_at', 'updated_at'],
    45	    statusColumn: 'status',
    46	    statusValues: ['active', 'inactive', 'paused', 'blocked'],
    47	  },
    48	  {
    49	    schema: 'public',
    50	    table: 'discovery_runs',
    51	    label: 'public.discovery_runs',
    52	    timestampColumns: ['created_at', 'updated_at'],
    53	    statusColumn: 'status',
    54	    statusValues: ['queued', 'running', 'completed', 'failed', 'blocked'],
    55	  },
    56	];
    57
    58	const DENIED_TABLES = [
    59	  'public.discovery_candidate_tools',
    60	  'public.discovered_tools',
    61	  'public.tools',
    62	];
    63
    64	const DENIED_SQL_TOKENS = [
    65	  'insert',
    66	  'update',
    67	  'delete',
    68	  'upsert',
    69	  'truncate',
    70	  'merge',
    71	  'alter',
    72	  'drop',
    73	  'create',
    74	  'grant',
    75	  'revoke',
    76	  'call',
    77	];
    78
    79	function printSection(title) {
    80	  console.log('');
    81	  console.log(`=== ${title} ===`);
    82	}
    83
    84	function fail(message) {
    85	  console.error(`FAILED: ${sanitizeSummary(message, SUMMARY_LIMIT)}`);
    86	  process.exitCode = 1;
    87	  throw new Error(message);
    88	}
    89
    90	function runGit(args) {
    91	  return execFileSync('git', args, {
    92	    encoding: 'utf8',
    93	    stdio: ['ignore', 'pipe', 'pipe'],
    94	  }).trim();
    95	}
    96
    97	function safeOneLine(value) {
    98	  if (value === undefined || value === null) {
    99	    return 'unavailable';
   100	  }
   101
   102	  let text = '';
   103
   104	  if (typeof value === 'string') {
   105	    text = value;
   106	  } else if (
   107	    typeof value === 'number' ||
   108	    typeof value === 'boolean' ||
   109	    typeof value === 'bigint'
   110	  ) {
   111	    text = String(value);
   112	  } else {
   113	    return 'unavailable';
   114	  }
   115
   116	  const oneLine = text.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
   117	  return oneLine.length > 0 ? oneLine : 'unavailable';
   118	}
   119
   120	function redactKnownSecrets(text) {
   121	  let sanitized = safeOneLine(text);
   122
   123	  for (const name of [...REQUIRED_ENV_NAMES, REQUIRED_GUARD]) {
   124	    const value = process.env[name];
   125	    if (value && value.length >= 8) {
   126	      sanitized = sanitized.split(value).join(`[redacted:${name}]`);
   127	    }
   128	  }
   129
   130	  sanitized = sanitized.replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{16,}\b/gi, 'Bearer [redacted:token]');
   131	  sanitized = sanitized.replace(/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g, '[redacted:jwt]');
   132	  sanitized = sanitized.replace(/\b[A-Za-z0-9_-]{32,}\.[A-Za-z0-9_-]{32,}\.[A-Za-z0-9_-]{32,}\b/g, '[redacted:token]');
   133
   134	  return sanitized;
   135	}
   136
   137	function sanitizeSummary(value, maxLength = SUMMARY_LIMIT) {
   138	  const redacted = redactKnownSecrets(value);
   139
   140	  if (redacted === 'unavailable') {
   141	    return redacted;
   142	  }
   143
   144	  if (redacted.length <= maxLength) {
   145	    return redacted;
   146	  }
   147
   148	  const marker = ' [truncated]';
   149	  return `${redacted.slice(0, Math.max(0, maxLength - marker.length))}${marker}`;
   150	}
   151
   152	function safeErrorField(error, fieldName) {
   153	  if (!error || typeof error !== 'object') {
   154	    return 'unavailable';
   155	  }
   156
   157	  return sanitizeSummary(error[fieldName], SUMMARY_LIMIT);
   158	}
   159
   160	function serializeSupabaseError(error) {
   161	  return {
   162	    error_present: Boolean(error),
   163	    error_name: safeErrorField(error, 'name'),
   164	    error_code: safeErrorField(error, 'code'),
   165	    error_message_summary: safeErrorField(error, 'message'),
   166	    error_details_summary: safeErrorField(error, 'details'),
   167	    error_hint_summary: safeErrorField(error, 'hint'),
   168	  };
   169	}
   170
   171	function noErrorFields() {
   172	  return {
   173	    error_present: false,
   174	    error_name: 'unavailable',
   175	    error_code: 'unavailable',
   176	    error_message_summary: 'unavailable',
   177	    error_details_summary: 'unavailable',
   178	    error_hint_summary: 'unavailable',
   179	  };
   180	}
   181
   182	function failedAggregateResult({ table, check, legacyCheck, statusColumn, statusValue, error }) {
   183	  const result = {
   184	    table,
   185	    check,
   186	    ok: false,
   187	    actual_query_succeeded: false,
   188	    actual_count_if_succeeded: 'unavailable',
   189	    ...serializeSupabaseError(error),
   190	  };
   191
   192	  if (legacyCheck) {
   193	    result.legacy_check = legacyCheck;
   194	  }
   195	  if (statusColumn) {
   196	    result.status_column = statusColumn;
   197	  }
   198	  if (statusValue) {
   199	    result.status_value = statusValue;
   200	  }
   201
   202	  return result;
   203	}
   204
   205	function successfulAggregateResult({ table, check, legacyCheck, statusColumn, statusValue, count }) {
   206	  const result = {
   207	    table,
   208	    check,
   209	    ok: true,
   210	    actual_query_succeeded: true,
   211	    actual_count_if_succeeded: count,
   212	    ...noErrorFields(),
   213	  };
   214
   215	  if (legacyCheck) {
   216	    result.legacy_check = legacyCheck;
   217	  }
   218	  if (statusColumn) {
   219	    result.status_column = statusColumn;
   220	  }
   221	  if (statusValue) {
   222	    result.status_value = statusValue;
   223	  }
   224
   225	  return result;
   226	}
   227
   228	function parseArgs(argv) {
   229	  const args = {
   230	    expectedHead: '',
   231	    expectedSubject: '',
   232	    mode: '',
   233	    maxOutputLines: 300,
   234	  };
   235
   236	  const allowed = new Set([
   237	    '--expected-head',
   238	    '--expected-subject',
   239	    '--mode',
   240	    '--max-output-lines',
   241	  ]);
   242
   243	  for (let i = 0; i < argv.length; i += 1) {
   244	    const flag = argv[i];
   245	    if (!allowed.has(flag)) {
   246	      fail(`unknown CLI flag: ${flag}`);
   247	    }
   248
   249	    const value = argv[i + 1];
   250	    if (!value || value.startsWith('--')) {
   251	      fail(`missing value for ${flag}`);
   252	    }
   253
   254	    if (flag === '--expected-head') {
   255	      args.expectedHead = value;
   256	    } else if (flag === '--expected-subject') {
   257	      args.expectedSubject = value;
   258	    } else if (flag === '--mode') {
   259	      args.mode = value;
   260	    } else if (flag === '--max-output-lines') {
   261	      const parsed = Number(value);
   262	      if (!Number.isInteger(parsed) || parsed < 50 || parsed > 600) {
   263	        fail('--max-output-lines must be an integer between 50 and 600');
   264	      }
   265	      args.maxOutputLines = parsed;
   266	    }
   267
   268	    i += 1;
   269	  }
   270
   271	  if (!args.expectedHead) {
   272	    fail('--expected-head is required');
   273	  }
   274	  if (!args.expectedSubject) {
   275	    fail('--expected-subject is required');
   276	  }
   277	  if (args.mode !== REQUIRED_MODE) {
   278	    fail(`--mode must be ${REQUIRED_MODE}`);
   279	  }
   280
   281	  return args;
   282	}
   283
   284	function assertNoUnexpectedDiscoveryOptIns() {
   285	  const discoveryEnvNames = Object.keys(process.env)
   286	    .filter((name) => name.startsWith('AIFINDER_RUN_DISCOVERY_'))
   287	    .sort();
   288
   289	  const unexpected = discoveryEnvNames.filter((name) => name !== REQUIRED_GUARD);
   290	  if (unexpected.length > 0) {
   291	    fail(`unexpected AIFINDER_RUN_DISCOVERY_* variables set: ${unexpected.join(', ')}`);
   292	  }
   293
   294	  if (process.env[REQUIRED_GUARD] !== REQUIRED_GUARD_VALUE) {
   295	    fail(`${REQUIRED_GUARD} must be set to ${REQUIRED_GUARD_VALUE}`);
   296	  }
   297
   298	  console.log(`allowed_guard_present=true :: ${REQUIRED_GUARD}`);
   299	}
   300
   301	function assertRequiredEnvNamesPresent() {
   302	  for (const name of REQUIRED_ENV_NAMES) {
   303	    if (!process.env[name]) {
   304	      fail(`required environment variable is missing: ${name}`);
   305	    }
   306	    console.log(`env_name_present=true :: ${name}`);
   307	  }
   308	}
   309
   310	function assertRepoState(expectedHead, expectedSubject) {
   311	  const origin = runGit(['config', '--get', 'remote.origin.url']);
   312	  const branch = runGit(['branch', '--show-current']);
   313	  const actualHeadShort = runGit(['rev-parse', '--short', 'HEAD']);
   314	  const actualHeadFull = runGit(['rev-parse', 'HEAD']);
   315	  const actualSubject = runGit(['log', '-1', '--format=%s']);
   316
   317	  console.log(`origin=${origin}`);
   318	  console.log(`branch=${branch}`);
   319	  console.log(`expected_head=${expectedHead}`);
   320	  console.log(`expected_subject=${expectedSubject}`);
   321	  console.log(`actual_head_short=${actualHeadShort}`);
   322	  console.log(`actual_head_full=${actualHeadFull}`);
   323	  console.log(`actual_subject=${actualSubject}`);
   324
   325	  if (origin !== EXPECTED_REPO) {
   326	    fail('repo origin mismatch');
   327	  }
   328	  if (branch !== EXPECTED_BRANCH) {
   329	    fail('branch mismatch');
   330	  }
   331	  if (actualHeadShort !== expectedHead && actualHeadFull !== expectedHead) {
   332	    fail('expected HEAD check failed');
   333	  }
   334	  if (actualSubject !== expectedSubject) {
   335	    fail('expected subject check failed');
   336	  }
   337
   338	  const counts = runGit(['rev-list', '--left-right', '--count', 'origin/main...HEAD']);
   339	  const [behindRaw, aheadRaw] = counts.split(/\s+/);
   340	  const behind = Number(behindRaw);
   341	  const ahead = Number(aheadRaw);
   342
   343	  console.log(`ahead_count=${ahead}`);
   344	  console.log(`behind_count=${behind}`);
   345
   346	  if (ahead !== 0 || behind !== 0) {
   347	    fail('branch must be synced with origin/main before live inspection');
   348	  }
   349
   350	  const status = runGit(['status', '--porcelain', '--untracked-files=all']);
   351	  if (status) {
   352	    console.log(status);
   353	    fail('working tree must be clean before live inspection');
   354	  }
   355
   356	  console.log('repo_state_check=passed');
   357	}
   358
   359	function assertAllowlistIsSafe() {
   360	  const seen = new Set();
   361
   362	  for (const item of ALLOWED_TABLES) {
   363	    if (item.schema !== 'public') {
   364	      fail(`table is outside public schema: ${item.label}`);
   365	    }
   366	    if (!/^[a-z_][a-z0-9_]*$/.test(item.table)) {
   367	      fail(`unsafe table name: ${item.label}`);
   368	    }
   369	    if (DENIED_TABLES.includes(item.label)) {
   370	      fail(`denied application payload table is allowlisted: ${item.label}`);
   371	    }
   372	    if (seen.has(item.label)) {
   373	      fail(`duplicate allowlist table: ${item.label}`);
   374	    }
   375	    seen.add(item.label);
   376	  }
   377
   378	  console.log('probe_scope=infrastructure_only');
   379	  console.log(`table_allowlist_count=${ALLOWED_TABLES.length}`);
   380	  for (const item of ALLOWED_TABLES) {
   381	    console.log(`table_allowlisted=true :: ${item.label}`);
   382	  }
   383	  for (const table of DENIED_TABLES) {
   384	    console.log(`table_denied=true :: ${table}`);
   385	  }
   386	}
   387
   388	function assertQueryTextSafe(text) {
   389	  const lowered = text.toLowerCase();
   390	  for (const token of DENIED_SQL_TOKENS) {
   391	    const pattern = new RegExp(`\\b${token}\\b`, 'i');
   392	    if (pattern.test(lowered)) {
   393	      fail(`denied query token detected: ${token}`);
   394	    }
   395	  }
   396	  if (/\*/.test(text)) {
   397	    fail('broad star selector is denied');
   398	  }
   399	}
   400
   401	async function loadSupabaseClient() {
   402	  const mod = await import('@supabase/supabase-js');
   403	  const { createClient } = mod;
   404
   405	  return createClient(
   406	    process.env.NEXT_PUBLIC_SUPABASE_URL,
   407	    process.env.SUPABASE_SERVICE_ROLE_KEY,
   408	    {
   409	      auth: {
   410	        persistSession: false,
   411	        autoRefreshToken: false,
   412	      },
   413	      global: {
   414	        headers: {
   415	          'x-aifinder-inspection-mode': 'read-only-aggregate-infrastructure',
   416	        },
   417	      },
   418	    },
   419	  );
   420	}
   421
   422	async function countRows(client, item) {
   423	  const queryText = `${item.label}:count`;
   424	  assertQueryTextSafe(queryText);
   425
   426	  const { count, error } = await client
   427	    .from(item.table)
   428	    .select('id', { count: 'exact', head: true });
   429
   430	  if (error) {
   431	    return failedAggregateResult({
   432	      table: item.label,
   433	      check: 'total_count',
   434	      error,
   435	    });
   436	  }
   437
   438	  return successfulAggregateResult({
   439	    table: item.label,
   440	    check: 'total_count',
   441	    count,
   442	  });
   443	}
   444
   445	async function latestTimestamp(client, item, column) {
   446	  const queryText = `${item.label}:latest:${column}`;
   447	  assertQueryTextSafe(queryText);
   448
   449	  const { data, error } = await client
   450	    .from(item.table)
   451	    .select(column)
   452	    .order(column, { ascending: false, nullsFirst: false })
   453	    .limit(1);
   454
   455	  if (error) {
   456	    return {
   457	      table: item.label,
   458	      check: `latest_${column}`,
   459	      ok: false,
   460	      actual_query_succeeded: false,
   461	      value_present: 'unavailable',
   462	      ...serializeSupabaseError(error),
   463	    };
   464	  }
   465
   466	  return {
   467	    table: item.label,
   468	    check: `latest_${column}`,
   469	    ok: true,
   470	    actual_query_succeeded: true,
   471	    value_present: Array.isArray(data) && data.length > 0 && Boolean(data[0]?.[column]),
   472	    ...noErrorFields(),
   473	  };
   474	}
   475
   476	async function statusCount(client, item, statusValue) {
   477	  if (!item.statusColumn) {
   478	    return null;
   479	  }
   480
   481	  const queryText = `${item.label}:status:${item.statusColumn}:${statusValue}`;
   482	  assertQueryTextSafe(queryText);
   483
   484	  const legacyCheck = `status_count:${item.statusColumn}:${statusValue}`;
   485	  const { count, error } = await client
   486	    .from(item.table)
   487	    .select(item.statusColumn, { count: 'exact', head: true })
   488	    .eq(item.statusColumn, statusValue);
   489
   490	  if (error) {
   491	    return failedAggregateResult({
   492	      table: item.label,
   493	      check: 'status_count',
   494	      legacyCheck,
   495	      statusColumn: item.statusColumn,
   496	      statusValue,
   497	      error,
   498	    });
   499	  }
   500
   501	  return successfulAggregateResult({
   502	    table: item.label,
   503	    check: 'status_count',
   504	    legacyCheck,
   505	    statusColumn: item.statusColumn,
   506	    statusValue,
   507	    count,
   508	  });
   509	}
   510
   511	async function runAggregateInspection() {
   512	  const client = await loadSupabaseClient();
   513	  const results = [];
   514
   515	  for (const item of ALLOWED_TABLES) {
   516	    results.push(await countRows(client, item));
   517
   518	    for (const column of item.timestampColumns) {
   519	      results.push(await latestTimestamp(client, item, column));
   520	    }
   521
   522	    for (const statusValue of item.statusValues) {
   523	      const result = await statusCount(client, item, statusValue);
   524	      if (result) {
   525	        results.push(result);
   526	      }
   527	    }
   528	  }
   529
   530	  return results;
   531	}
   532
   533	async function main() {
   534	  const args = parseArgs(process.argv.slice(2));
   535
   536	  console.log('=== AiFinder Discovery Read-Only Live Inspection ===');
   537	  console.log('terminal_workflow=read_only_live_inspection');
   538	  console.log('operational_mode=aggregate_only');
   539	  console.log('probe_scope=infrastructure_only');
   540	  console.log('error_serialization=structured_safe_summaries');
   541	  console.log('no_mutation=true');
   542	  console.log('no_admin_api_invocation=true');
   543	  console.log('no_local_server_startup=true');
   544	  console.log('no_crawler_extraction_candidate_or_publishing_execution=true');
   545
   546	  printSection('Boundary');
   547	  console.log('Aggregate read-only infrastructure inspection only.');
   548	  console.log('No application payload tables.');
   549	  console.log('No DB mutation.');
   550	  console.log('No admin API invocation.');
   551	  console.log('No local server startup.');
   552	  console.log('No crawler execution.');
   553	  console.log('No extraction execution.');
   554	  console.log('No LLM execution.');
   555	  console.log('No evidence acquisition.');
   556	  console.log('No candidate staging.');
   557	  console.log('No candidate decision execution.');
   558	  console.log('No approve_for_draft.');
   559	  console.log('No public tools writes.');
   560	  console.log('No discovered_tools writes.');
   561	  console.log('No row-level status enumeration.');
   562
   563	  printSection('Repo preflight');
   564	  assertRepoState(args.expectedHead, args.expectedSubject);
   565
   566	  printSection('Environment preflight');
   567	  assertNoUnexpectedDiscoveryOptIns();
   568	  assertRequiredEnvNamesPresent();
   569
   570	  printSection('Allowlist preflight');
   571	  assertAllowlistIsSafe();
   572
   573	  printSection('Aggregate read-only infrastructure results');
   574	  const results = await runAggregateInspection();
   575
   576	  for (const result of results) {
   577	    console.log(JSON.stringify(result));
   578	  }
   579
   580	  const failed = results.filter((result) => !result.ok);
   581	  console.log(`aggregate_result_count=${results.length}`);
   582	  console.log(`aggregate_error_count=${failed.length}`);
   583
   584	  if (failed.length > 0) {
   585	    fail('one or more aggregate read-only infrastructure checks returned errors');
   586	  }
   587
   588	  printSection('Script result');
   589	  console.log('PASSED: Discovery read-only live infrastructure inspection completed safely.');
   590	}
   591
   592	main().catch((error) => {
   593	  if (!process.exitCode) {
   594	    process.exitCode = 1;
   595	  }
   596	  console.error(`FAILED: ${sanitizeSummary(error?.message ?? error, SUMMARY_LIMIT)}`);
   597	});
```

## Boundary preserved

- Documentation-only gate.
- Local file read only.
- No script execution.
- No script modification.
- No live inspection retry.
- No live DB read.
- No Supabase client instantiation.
- No Supabase dashboard SQL.
- No DB mutation.
- No row-level enumeration.
- No live status enumeration.
- No grouped live status counts.
- No `.env` scanning.
- No broadening beyond `public.discovery_sources` and `public.discovery_runs`.
- No application payload tables.
- No source app/API/UI/helper changes.
- No schema/migration/typegen changes.
- No package or lockfile changes.
- No verifier rerun.
- No crawler execution.
- No extraction execution.
- No LLM execution.
- No evidence acquisition.
- No candidate staging.
- No candidate decision execution.
- No `approve_for_draft`.
- No public `tools` writes.
- No `discovered_tools` writes.
- No commit in this gate.
- No push in this gate.

## Recommended next phase

Recommended next phase:

```text
Phase 25AN — Source Status Query-Shape Fix Planning Gate
```

Scope should be planning-only.

It should decide whether to:

1. update the source-status count helper to apply an explicit status filter,
2. add an internal assertion that every configured status check has an actual filter expression,
3. add static tests or local static verification for `.eq(statusColumn, statusValue)`,
4. improve comments around the lightweight `id` selection with `count: 'exact'` and `head: true`,
5. defer any live retry until the script update is planned, reviewed, implemented, committed, and explicitly approved.

## Required Gemini review questions

1. Does Phase 25AM accurately document the Phase 25AL result and the `eq_status_column_count=0` anomaly?
2. Does the local query-block evidence support the corrected conclusion that `.eq(item.statusColumn, statusValue)` is present and the Phase 25AL `eq_status_column_count=0` metric was a false negative?
3. Is it correct not to treat the problem as environment drift yet, given that the explicit filter exists locally and the remaining concern is query-shape behavior or static detector brittleness?
4. Should the next phase be a planning gate for a targeted query-shape/static-verifier fix rather than a live retry?
5. Should future implementation require static verification that recognizes object-property filters such as `.eq(item.statusColumn, statusValue)`?
6. Is it correct to avoid script modification in Phase 25AM?
7. Is it safe to commit this documentation after James approval?

## Phase 25AM conclusion

Phase 25AM documents the local query-shape anomaly.

The next step is not a live retry.

The next step is not a script change in this phase.

The recommended next step is a targeted query-shape and static-verifier fix planning gate.
