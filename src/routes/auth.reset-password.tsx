import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { OtkButton } from "@/components/otk/button";
import { ConnectionGuard } from "@/components/otk/connection-guard";
import { TextField } from "@/components/otk/field";
import { Notice, Panel, Screen, Spinner } from "@/components/otk/shell";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/auth/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — OTAKUVERSE" },
      { name: "description", content: "Choose a new password for your OTAKUVERSE account." },
      { property: "og:title", content: "Set a new password — OTAKUVERSE" },
      { property: "og:description", content: "Choose a new password for your account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { updatePassword, session, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!done) return undefined;
    const t = setTimeout(() => navigate({ to: "/profile", replace: true }), 1600);
    return () => clearTimeout(t);
  }, [done, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Those passwords don't match.");
    setSubmitting(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen eyebrow="NEW PASSWORD">
      <section className="mt-9">
        <h1 className="font-display text-5xl font-bold leading-none text-balance">Set a new one.</h1>
      </section>

      <ConnectionGuard>
        {loading ? (
          <Spinner label="Checking your reset link…" />
        ) : (
          <form onSubmit={onSubmit} className="mt-6">
            <Panel>
              {!session ? (
                <Notice>
                  This reset link is missing or expired. Request a new one from the forgot password
                  page.
                </Notice>
              ) : done ? (
                <Notice tone="success">Password updated. Taking you to your profile…</Notice>
              ) : (
                <>
                  <TextField
                    label="New password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                  <TextField
                    label="Confirm new password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat it"
                  />
                  {error ? <Notice>{error}</Notice> : null}
                  <OtkButton
                    type="submit"
                    size="block"
                    className="mt-5"
                    disabled={submitting || !isSupabaseConfigured}
                  >
                    {submitting ? "Saving…" : "Update password"}
                  </OtkButton>
                </>
              )}
              <div className="mt-4 text-center text-xs">
                <Link to="/auth/forgot-password" className="text-mist hover:text-snow">
                  Request a new link
                </Link>
              </div>
            </Panel>
          </form>
        )}
      </ConnectionGuard>
    </Screen>
  );
}
