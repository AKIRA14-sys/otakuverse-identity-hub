import type { ReactNode } from "react";

import { isSupabaseConfigured } from "@/lib/supabase";
import { Notice } from "./shell";

/**
 * Shown until the app is pointed at a Supabase project via environment variables.
 * Prevents silent failures and never fakes an authenticated state.
 */
export function ConnectionGuard({ children }: { children: ReactNode }) {
  if (isSupabaseConfigured) return <>{children}</>;
  return (
    <Notice tone="info">
      <p className="font-display text-sm font-semibold text-snow">Database not connected</p>
      <p className="mt-1.5">
        Add <code className="text-neon">VITE_SUPABASE_URL</code> and{" "}
        <code className="text-neon">VITE_SUPABASE_PUBLISHABLE_KEY</code> to your environment, then
        apply the SQL in <code className="text-neon">/supabase/migrations</code>. Sign up and sign in
        stay disabled until then — no demo accounts exist.
      </p>
    </Notice>
  );
}
