import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { Panel, Screen, Spinner } from "@/components/otk/shell";
import { formatMembers, searchSocieties, type Society } from "@/lib/communities";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/societies/$slug")({
  ssr: false,
  component: SocietyDetailPage,
});

function SocietyDetailPage() {
  const { slug } = Route.useParams();
  const [society, setSociety] = useState<Society | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    searchSocieties(slug, 50)
      .then((list) => setSociety(list.find((s) => s.slug === slug) ?? null))
      .catch(() => setSociety(null))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <Screen eyebrow="SOCIETY" withNav>
      <ConnectionGuard>
        {loading ? <Spinner /> : null}
        {!loading && !society ? (
          <Panel className="mt-8">
            <p className="text-sm text-mist">Society not found.</p>
          </Panel>
        ) : null}
        {society ? (
          <div className="mt-8">
            <h1 className="font-display text-3xl font-bold">{society.name}</h1>
            <p className="mt-2 text-sm text-mist">
              {formatMembers(society.member_count)} members
              {society.verification === "verified" ? " · verified" : ""}
            </p>
            {society.description ? (
              <p className="mt-4 text-sm text-mist">{society.description}</p>
            ) : null}
            <Panel className="mt-4">
              <p className="text-xs text-mist">
                Societies can link multiple communities. Full admin tools arrive in a later pass.
              </p>
            </Panel>
          </div>
        ) : null}
        <Link to="/societies" className="mt-6 inline-block text-xs font-semibold text-neon">
          ← Societies
        </Link>
      </ConnectionGuard>
    </Screen>
  );
}
