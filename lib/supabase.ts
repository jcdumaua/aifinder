import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

// Capture the exact construction input, including the build-inlined public URL.
// Never reconstruct this observation from a later environment lookup.
export const supabaseConstructionObservation = Object.freeze({
  runId: process.env.AIFINDER_VALIDATION_RUN_ID,
  projectRef: process.env.AIFINDER_VALIDATION_PROJECT_REF,
  origin: supabaseUrl,
});
