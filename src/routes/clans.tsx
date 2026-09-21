import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { Panel, Screen, Spinner } from "@/components/otk/shell";
import { formatMembers, searchClans, type Clan } from "@/lib/communities";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/clans")({
  ssr: false,
  head: () => ({ meta: [{ title: "Clans — OTAKUVERSE" }] }),
  component: ClansPage,
});

function ClansPage() {
  const [items, setItems] = useState<Clan[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      searchClans(query, 30)
        .then(setItems)
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <Screen eyebrow="CLANS" withNav>
      <section className="mt-8">
        <h1 className="font-display text-3xl font-bold">Clans</h1>
        <p className="mt-2 text-sm text-mist">Smaller organized groups — not GPS-based.</p>
      </section>
      <ConnectionGuard>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clans…"
          className="mt-5 w-full rounded-2xl bg-panel2 px-4 py-3 text-sm ring-1 ring-line outline-none focus:ring-neon"
        />
        {loading ? <Spinner label="Loading…" /> : null}
        <div className="mt-4 space-y-2">
          {!loading && items.length === 0 ? (
            <Panel>
              <p className="text-sm text-mist">No clans yet.</p>
            </Panel>
          ) : (
            items.map((c) => (
              <Link
                key={c.id}
                to="/clans/$slug"
                params={{ slug: c.slug }}
                className="block rounded-2xl bg-panel2 px-4 py-3 ring-1 ring-line"
              >
                <p className="font-display text-sm font-semibold">{c.name}</p>
                <p className="text-[11px] text-mist">{formatMembers(c.member_count)} members</p>
              </Link>
            ))
          )}
        </div>
        <Link to="/communities" className="mt-6 inline-block text-xs font-semibold text-neon">
          ← Communities
        </Link>
      </ConnectionGuard>
    </Screen>
  );
}
