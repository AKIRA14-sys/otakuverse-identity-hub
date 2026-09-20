import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Connects to YOUR Supabase project via environment variables.
 * Set these in .env (see .env.example):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY   (publishable / anon key — never the service role key)
 */
const url = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
const key = (import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ??
  import.meta.env['VITE_SUPABASE_ANON_KEY']) as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, key as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "OTAKUVERSE is not connected to a database yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your environment.",
    );
  }
  return supabase;
}
