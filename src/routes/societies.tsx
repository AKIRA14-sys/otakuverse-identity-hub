import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { Panel, Screen, Spinner } from "@/components/otk/shell";
import { formatMembers, searchSocieties, type Society } from "@/lib/communities";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/societies")({
  ssr: false,
  head: () => ({ meta: [{ title: "Societies — OTAKUVERSE" }] }),
  component: SocietiesPage,
});

function SocietiesPage() {
  const [items, setItems] = useState<Society[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      searchSocieties(query, 30)
        .then(setItems)
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <Screen eyebrow="SOCIETIES" withNav>
      <section className="mt-8">
        <h1 className="font-display text-3xl font-bold">Societies</h1>
        <p className="mt-2 text-sm text-mist">Larger organized groups across OTAKUVERSE.</p>
      </section>
      <ConnectionGuard>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search societies…"
          className="mt-5 w-full rounded-2xl bg-panel2 px-4 py-3 text-sm ring-1 ring-line outline-none focus:ring-neon"
        />
        {loading ? <Spinner label="Loading…" /> : null}
        <div className="mt-4 space-y-2">
          {!loading && items.length === 0 ? (
            <Panel>
              <p className="text-sm text-mist">No societies yet. They can be created after SQL is applied.</p>
            </Panel>
          ) : (
            items.map((s) => (
              <Link
                key={s.id}
                to="/societies/$slug"
                params={{ slug: s.slug }}
                className="block rounded-2xl bg-panel2 px-4 py-3 ring-1 ring-line"
              >
                <p className="font-display text-sm font-semibold">{s.name}</p>
                <p className="text-[11px] text-mist">
                  {formatMembers(s.member_count)} members
                  {s.verification === "verified" ? " · verified" : ""}
                </p>
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
