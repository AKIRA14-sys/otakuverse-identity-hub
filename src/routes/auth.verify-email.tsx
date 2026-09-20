import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import { OtkButton } from "@/components/otk/button";
import { Notice, Panel, Screen } from "@/components/otk/shell";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/auth/verify-email")({
  ssr: false,
  validateSearch: z.object({ email: z.string().email().optional() }),
  head: () => ({
    meta: [
      { title: "Verify your email — OTAKUVERSE" },
      { name: "description", content: "Confirm your email address to activate your OTAKUVERSE account." },
      { property: "og:title", content: "Verify your email — OTAKUVERSE" },
      { property: "og:description", content: "Confirm your email address to activate your account." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email } = Route.useSearch();
  const { resendVerification } = useAuth();
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    if (!email) return;
    setError(null);
    setState("sending");
    try {
      await resendVerification(email);
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the email.");
      setState("idle");
    }
  }

  return (
    <Screen eyebrow="VERIFY">
      <section className="mt-9">
        <h1 className="font-display text-5xl font-bold leading-none text-balance">
          Check your
          <br />
          inbox.
        </h1>
        <p className="mt-4 text-sm text-mist">
          We sent a confirmation link{email ? ` to ${email}` : ""}. Your account activates the moment
          you open it.
        </p>
      </section>

      <Panel className="mt-6">
        {state === "sent" ? (
          <Notice tone="success">Sent again. Give it a minute, and check spam.</Notice>
        ) : null}
        {error ? <Notice>{error}</Notice> : null}
        <OtkButton
          type="button"
          size="block"
          variant="panel"
          className="mt-4"
          onClick={resend}
          disabled={!email || state === "sending" || !isSupabaseConfigured}
        >
          {state === "sending" ? "Resending…" : "Resend confirmation email"}
        </OtkButton>
        <div className="mt-4 text-center text-xs">
          <Link to="/auth/login" className="font-semibold text-neon">
            I've confirmed — sign in
          </Link>
        </div>
      </Panel>
    </Screen>
  );
}
