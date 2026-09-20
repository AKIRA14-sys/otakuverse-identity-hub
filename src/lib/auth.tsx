import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { isSupabaseConfigured, requireSupabase, supabase } from "./supabase";
import { toE164 } from "./phone";
import type { Gender } from "@/types/database";

export interface SignUpInput {
  email: string;
  password: string;
  username: string;
  displayName: string;
  countryCode: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
  signUp: (input: SignUpInput) => Promise<{ needsEmailVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      configured: isSupabaseConfigured,

      async signUp(input) {
        const client = requireSupabase();
        const phoneE164 = toE164(input.phone, input.countryCode);
        if (!phoneE164) throw new Error("That phone number isn't valid for the selected country.");

        const { data: available, error: rpcError } = await client.rpc("is_username_available", {
          candidate: input.username,
        });
        if (rpcError) throw new Error(rpcError.message);
        if (available === false) throw new Error("That username is already taken.");

        const { data, error } = await client.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              username: input.username.toLowerCase(),
              display_name: input.displayName || input.username,
              country_code: input.countryCode,
              phone_e164: phoneE164,
              date_of_birth: input.dateOfBirth,
              gender: input.gender,
            },
          },
        });
        if (error) throw new Error(error.message);
        return { needsEmailVerification: data.session === null };
      },

      async signIn(email, password) {
        const client = requireSupabase();
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
      },

      async signOut() {
        const client = requireSupabase();
        const { error } = await client.auth.signOut();
        if (error) throw new Error(error.message);
      },

      async requestPasswordReset(email) {
        const client = requireSupabase();
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) throw new Error(error.message);
      },

      async updatePassword(password) {
        const client = requireSupabase();
        const { error } = await client.auth.updateUser({ password });
        if (error) throw new Error(error.message);
      },

      async resendVerification(email) {
        const client = requireSupabase();
        const { error } = await client.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw new Error(error.message);
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
