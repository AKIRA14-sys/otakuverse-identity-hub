import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { OtkButton } from "@/components/otk/button";
import { ConnectionGuard } from "@/components/otk/connection-guard";
import { TextField } from "@/components/otk/field";
import { Notice, Panel, Screen } from "@/components/otk/shell";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/auth/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset your password — OTAKUVERSE" },
      { name: "description", content: "Request a password reset link for your OTAKUVERSE account." },
      { property: "og:title", content: "Reset your password — OTAKUVERSE" },
      { property: "og:description", content: "Request a password reset link." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen eyebrow="RECOVERY">
      <section className="mt-9">
        <h1 className="font-display text-5xl font-bold leading-none text-balance">
          Lost the
          <br />
          key.
        </h1>
        <p className="mt-4 text-sm text-mist">We'll email you a link to set a new password.</p>
      </section>

      <ConnectionGuard>
        <form onSubmit={onSubmit} className="mt-6">
          <Panel>
            {sent ? (
              <Notice tone="success">
                If an account exists for {email}, a reset link is on its way. The link opens the
                password reset page.
              </Notice>
            ) : (
              <>
                <TextField
                  label="Email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                {error ? <Notice>{error}</Notice> : null}
                <OtkButton
                  type="submit"
                  size="block"
                  className="mt-5"
                  disabled={submitting || !isSupabaseConfigured}
                >
                  {submitting ? "Sending…" : "Send reset link"}
                </OtkButton>
              </>
            )}
            <div className="mt-4 text-center text-xs">
              <Link to="/auth/login" className="text-mist hover:text-snow">
                Back to sign in
              </Link>
            </div>
          </Panel>
        </form>
      </ConnectionGuard>
    </Screen>
  );
}
