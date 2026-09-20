import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Screen, Spinner } from "@/components/otk/shell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Confirming — OTAKUVERSE" },
      { name: "description", content: "Finishing your OTAKUVERSE email confirmation." },
      { property: "og:title", content: "Confirming — OTAKUVERSE" },
      { property: "og:description", content: "Finishing your email confirmation." },
    ],
  }),
  component: CallbackPage,
});

/** Landing spot for email confirmation links; the Supabase client parses the URL. */
function CallbackPage() {
  const { loading, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    navigate({ to: session ? "/profile" : "/auth/login", replace: true });
  }, [loading, session, navigate]);

  return (
    <Screen eyebrow="CONFIRMING">
      <Spinner label="Confirming your account…" />
    </Screen>
  );
}
