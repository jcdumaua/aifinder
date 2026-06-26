import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Discovery Engine Supabase environment variables");
}

const discoverySupabaseUrl: string = supabaseUrl;
const discoverySupabaseServiceRoleKey: string = supabaseServiceRoleKey;

/**
 * Creates a typed service-role Supabase client for future server-side
 * Discovery Engine infrastructure.
 *
 * This helper is intentionally not imported by application code yet and does
 * not perform database operations.
 */
export function createDiscoverySupabaseAdminClient() {
  return createClient<Database>(
    discoverySupabaseUrl,
    discoverySupabaseServiceRoleKey
  );
}

export type DiscoverySupabaseAdminClient = ReturnType<
  typeof createDiscoverySupabaseAdminClient
>;
