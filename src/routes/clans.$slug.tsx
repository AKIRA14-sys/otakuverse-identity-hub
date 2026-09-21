import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { Panel, Screen, Spinner } from "@/components/otk/shell";
import { formatMembers, searchClans, type Clan } from "@/lib/communities";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/clans/$slug")({
  ssr: false,
  component: ClanDetailPage,
});

function ClanDetailPage() {
  const { slug } = Route.useParams();
  const [clan, setClan] = useState<Clan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    searchClans(slug, 50)
      .then((list) => setClan(list.find((c) => c.slug === slug) ?? null))
      .catch(() => setClan(null))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <Screen eyebrow="CLAN" withNav>
      <ConnectionGuard>
        {loading ? <Spinner /> : null}
        {!loading && !clan ? (
          <Panel className="mt-8">
            <p className="text-sm text-mist">Clan not found.</p>
          </Panel>
        ) : null}
        {clan ? (
          <div className="mt-8">
            <h1 className="font-display text-3xl font-bold">{clan.name}</h1>
            <p className="mt-2 text-sm text-mist">{formatMembers(clan.member_count)} members</p>
            {clan.description ? (
              <p className="mt-4 text-sm text-mist">{clan.description}</p>
            ) : null}
          </div>
        ) : null}
        <Link to="/clans" className="mt-6 inline-block text-xs font-semibold text-neon">
          ← Clans
        </Link>
      </ConnectionGuard>
    </Screen>
  );
}
