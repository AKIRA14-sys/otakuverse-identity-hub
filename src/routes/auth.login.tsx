import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { OtkButton } from "@/components/otk/button";
import { ConnectionGuard } from "@/components/otk/connection-guard";
import { TextField } from "@/components/otk/field";
import { Notice, Panel, Screen } from "@/components/otk/shell";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/auth/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — OTAKUVERSE" },
      { name: "description", content: "Sign in to your OTAKUVERSE account." },
      { property: "og:title", content: "Sign in — OTAKUVERSE" },
      { property: "og:description", content: "Sign in to your OTAKUVERSE account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/profile", replace: true });
  }, [loading, user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate({ to: "/profile", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign you in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen eyebrow="SIGN IN">
      <section className="mt-9">
        <h1 className="font-display text-5xl font-bold leading-none text-balance">Welcome back.</h1>
        <p className="mt-4 text-sm text-mist">Your saga continues where you left it.</p>
      </section>

      <ConnectionGuard>
        <form onSubmit={onSubmit} className="mt-6">
          <Panel>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {error ? <Notice>{error}</Notice> : null}

            <OtkButton
              type="submit"
              size="block"
              className="mt-5"
              disabled={submitting || !isSupabaseConfigured}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </OtkButton>

            <div className="mt-4 flex items-center justify-between text-xs">
              <Link to="/auth/forgot-password" className="text-mist hover:text-snow">
                Forgot password?
              </Link>
              <Link to="/auth/signup" className="font-semibold text-neon">
                Create profile
              </Link>
            </div>
          </Panel>
        </form>
      </ConnectionGuard>
    </Screen>
  );
}
