import assert from "node:assert/strict";
import test from "node:test";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

test("creates a typed Discovery Supabase admin client without database operations", async () => {
  const { createDiscoverySupabaseAdminClient } = await import(
    "../lib/discovery/discovery-supabase-admin.ts"
  );

  const client = createDiscoverySupabaseAdminClient();

  assert.ok(client);
});
