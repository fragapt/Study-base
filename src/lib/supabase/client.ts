"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

// Note: we intentionally do not pass the generated <Database> generic here.
// This postgrest-js version mis-resolves hand-written schema types on writes
// (insert payloads collapse to `never`). Row shapes are applied via casts to
// the interfaces in ./types instead. Runtime correctness is set by the SQL
// migration in supabase/migrations.
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
