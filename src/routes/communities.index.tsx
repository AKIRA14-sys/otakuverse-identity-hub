import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { Chip, Notice, Panel, Screen, Spinner } from "@/components/otk/shell";
import { useAuth } from "@/lib/auth";
import {
  COMMUNITY_TYPES,
  fetchNearbyCommunities,
  fetchTrendingCommunities,
  formatMembers,
  searchCommunities,
  type Community,
  type CommunityType,
} from "@/lib/communities";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/communities/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Communities — OTAKUVERSE" },
      { name: "description", content: "Discover anime communities, societies, and clans." },
    ],
  }),
  component: CommunitiesPage,
});

function CommunityCard({ c }: { c: Community }) {
  return (
    <Link
      to="/communities/$slug"
      params={{ slug: c.slug }}
      className="block rounded-2xl bg-panel2 px-4 py-3 ring-1 ring-line transition hover:ring-neon/40"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-panel text-lg ring-1 ring-line">
          {c.avatar_url ? (
            <img src={c.avatar_url} alt="" className="size-11 rounded-xl object-cover" />
          ) : (
            "⚡"
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-display text-sm font-semibold text-snow">{c.name}</p>
            {c.verification === "verified" ? (
              <span className="text-[10px] text-neon">✓</span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-mist">
            {c.type} · {formatMembers(c.member_count)} members · {c.privacy}
          </p>
          {c.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-mist">{c.description}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function CommunitiesPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<CommunityType | null>(null);
  const [results, setResults] = useState<Community[]>([]);
  const [trending, setTrending] = useState<Community[]>([]);
  const [nearby, setNearby] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBase = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [t, n] = await Promise.all([
        fetchTrendingCommunities(8),
        user ? fetchNearbyCommunities(8).catch(() => []) : Promise.resolve([]),
      ]);
      setTrending(t);
      setNearby(n);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load communities.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1 && !type) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      searchCommunities(q, type, 24)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 280);
    return () => clearTimeout(t);
  }, [query, type]);

  return (
    <Screen eyebrow="COMMUNITIES" withNav>
      <section className="mt-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold leading-none tracking-tight">
              Communities
            </h1>
            <p className="mt-2 text-sm text-mist">Find your people across OTAKUVERSE.</p>
          </div>
          <Link
            to="/communities/create"
            className="shrink-0 rounded-full bg-neon/15 px-3 py-2 font-display text-[11px] font-semibold text-neon ring-1 ring-neon/40"
          >
            Create
          </Link>
        </div>
      </section>

      <ConnectionGuard>
        {error ? <Notice>{error}</Notice> : null}

        <div className="mt-5">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search communities…"
            className="w-full rounded-2xl bg-panel2 px-4 py-3 text-sm text-snow ring-1 ring-line outline-none placeholder:text-mist/60 focus:ring-2 focus:ring-neon"
            autoComplete="off"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button type="button" onClick={() => setType(null)}>
            <Chip active={type === null}>All</Chip>
          </button>
          {COMMUNITY_TYPES.slice(0, 8).map((t) => (
            <button key={t.value} type="button" onClick={() => setType(t.value)}>
              <Chip active={type === t.value}>{t.label}</Chip>
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-3 text-xs">
          <Link to="/societies" className="font-semibold text-neon">
            Societies
          </Link>
          <span className="text-mist">·</span>
          <Link to="/clans" className="font-semibold text-neon">
            Clans
          </Link>
        </div>

        {loading ? <Spinner label="Loading communities…" /> : null}

        {!loading && (query.trim() || type) ? (
          <div className="mt-5 space-y-2">
            <p className="font-display text-[11px] font-semibold tracking-[0.15em] text-mist">
              {searching ? "SEARCHING…" : "RESULTS"}
            </p>
            {results.length === 0 && !searching ? (
              <Panel>
                <p className="text-sm text-mist">No communities found.</p>
              </Panel>
            ) : (
              results.map((c) => <CommunityCard key={c.id} c={c} />)
            )}
          </div>
        ) : null}

        {!loading && !query.trim() && !type ? (
          <>
            {nearby.length > 0 ? (
              <div className="mt-6 space-y-2">
                <p className="font-display text-[11px] font-semibold tracking-[0.15em] text-mist">
                  NEAR YOUR PROFILE
                </p>
                <p className="text-[11px] text-mist">Based on your profile country/city — no GPS.</p>
                {nearby.map((c) => (
                  <CommunityCard key={c.id} c={c} />
                ))}
              </div>
            ) : null}

            <div className="mt-6 space-y-2">
              <p className="font-display text-[11px] font-semibold tracking-[0.15em] text-mist">
                TRENDING
              </p>
              {trending.length === 0 ? (
                <Panel>
                  <p className="text-sm text-mist">
                    No trending communities yet (needs 5+ members). Create one to start.
                  </p>
                </Panel>
              ) : (
                trending.map((c) => <CommunityCard key={c.id} c={c} />)
              )}
            </div>
          </>
        ) : null}
      </ConnectionGuard>
    </Screen>
  );
}
