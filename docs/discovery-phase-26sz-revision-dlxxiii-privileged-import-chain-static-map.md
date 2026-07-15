# Phase 26SZ — Privileged Import-Chain Static Map

## Bound baseline

`686e2da84773e58001612cfe125025d27acbf9fc`

## Inspection boundary

Committed JavaScript and TypeScript imports were inspected statically.

No build, bundle analyzer, source execution, server, route, database, network service, environment value, credential, or production system was accessed.

## Privileged modules

```text
app/api/submit-tool/route.ts
lib/discovery/discovery-supabase-admin.ts
lib/supabase-admin.ts
```

## Direct importer candidates

```text
app/api/admin/audit-logs/route.ts
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts
app/api/admin/discovery/discovered-tools/[id]/route.ts
app/api/admin/discovery/discovered-tools/bulk-status/route.ts
app/api/admin/discovery/discovered-tools/route.ts
app/api/admin/discovery/intake/route.ts
app/api/admin/discovery/runs/manual/claim/route.ts
app/api/admin/discovery/runs/manual/route.ts
app/api/admin/discovery/runs/route.ts
app/api/admin/discovery/sources/[id]/route.ts
app/api/admin/discovery/sources/route.ts
app/api/admin/submissions/route.ts
app/api/admin/tools/route.ts
app/api/admin/upload-logo/route.ts
app/api/submit-tool/route.ts
app/api/upload-logo/route.ts
app/category/[slug]/page.tsx
app/compare/page.tsx
app/sitemap.ts
app/tool/[slug]/page.tsx
lib/admin-audit-log.ts
lib/discovery/discovery-candidate-preview-provider.ts
lib/discovery/discovery-candidate-staging-admin.ts
lib/homepage-control-admin.ts
lib/homepage-control-public.ts
```

- Direct importer candidates: `26`
- Direct importer files carrying a top-level client directive: `0`

## Client-directive overlap

```text

```

Interpretation:

- Empty overlap is favorable static evidence.
- It does not prove transitive client exclusion.
- Framework-generated bundles and indirect re-export chains remain unverified.

## Import evidence sample

```text
app/api/admin/audit-logs/route.ts:4:import { supabaseAdmin } from "../../../../lib/supabase-admin";
app/api/admin/discovery/candidate-staging-queue/route.ts:249:  const { supabaseAdmin } = await import("../../../../../lib/supabase-admin");
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:11:import { supabaseAdmin } from "../../../../../../../lib/supabase-admin";
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:11:import { supabaseAdmin } from "../../../../../../../lib/supabase-admin";
app/api/admin/discovery/discovered-tools/[id]/route.ts:8:import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:11:import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
app/api/admin/discovery/discovered-tools/route.ts:3:import { supabaseAdmin } from "../../../../../lib/supabase-admin";
app/api/admin/discovery/intake/route.ts:11:import { supabaseAdmin } from "../../../../../lib/supabase-admin";
app/api/admin/discovery/runs/manual/claim/route.ts:42:import { supabaseAdmin } from "../../../../../../../lib/supabase-admin";
app/api/admin/discovery/runs/manual/route.ts:17:import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
app/api/admin/discovery/runs/route.ts:6:import { supabaseAdmin } from "../../../../../lib/supabase-admin";
app/api/admin/discovery/sources/[id]/route.ts:11:import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
app/api/admin/discovery/sources/route.ts:11:import { supabaseAdmin } from "../../../../../lib/supabase-admin";
app/api/admin/submissions/route.ts:7:import { supabaseAdmin } from "../../../../lib/supabase-admin";
app/api/admin/tools/route.ts:7:import { supabaseAdmin } from "../../../../lib/supabase-admin";
app/api/admin/upload-logo/route.ts:8:import { supabaseAdmin } from "../../../../lib/supabase-admin";
app/api/submit-tool/route.ts:1:import { NextResponse } from "next/server";
app/api/submit-tool/route.ts:2:import { createClient, type SupabaseClient } from "@supabase/supabase-js";
app/api/upload-logo/route.ts:2:import { supabaseAdmin } from "../../../lib/supabase-admin";
app/category/[slug]/page.tsx:7:import { supabaseAdmin } from "../../../lib/supabase-admin";
app/compare/page.tsx:6:import { supabaseAdmin } from "../../lib/supabase-admin";
app/sitemap.ts:2:import { supabaseAdmin } from "../lib/supabase-admin";
app/tool/[slug]/page.tsx:3:import { supabaseAdmin } from "../../../lib/supabase-admin";
lib/admin-audit-log.ts:1:import { supabaseAdmin } from "./supabase-admin";
lib/discovery/discovery-candidate-decision-admin.ts:135:  const { supabaseAdmin } = await import("../supabase-admin");
lib/discovery/discovery-candidate-preview-provider.ts:4:import type { DiscoverySupabaseAdminClient } from "./discovery-supabase-admin";
lib/discovery/discovery-candidate-staging-admin.ts:5:import type { DiscoverySupabaseAdminClient } from "./discovery-supabase-admin";
lib/discovery/discovery-supabase-admin.ts:3:import { createClient } from "@supabase/supabase-js";
lib/discovery/discovery-supabase-admin.ts:4:import type { Database } from "@/lib/supabase/database.types";
lib/homepage-control-admin.ts:16:import { supabaseAdmin } from "./supabase-admin";
lib/homepage-control-public.ts:4:import { supabaseAdmin } from "./supabase-admin";
lib/supabase-admin.ts:1:import { createClient } from "@supabase/supabase-js";
```

## Required closure proof

1. Every privileged module is server-only by file placement, directive, or framework boundary.
2. No client component directly imports a privileged module.
3. No client component imports a re-exporting module that exposes a privileged symbol.
4. Every privileged call site is inventoried.
5. Build-time bundle evidence later confirms no privileged reference enters client chunks.
6. Gemini independently approves the final import-chain conclusion.

## Current determination

`NO_DIRECT_CLIENT_IMPORT_IDENTIFIED_TRANSITIVE_AND_BUNDLE_PROOF_MISSING`
