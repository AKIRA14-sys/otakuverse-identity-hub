import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { Chip, Notice, Panel, Screen, Spinner } from "@/components/otk/shell";
import { WorldMap } from "@/components/otk/world-map";
import { useAuth } from "@/lib/auth";
import { fetchMyProfile } from "@/lib/profile";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  fetchContinents,
  fetchCountriesByContinent,
  fetchGeoStats,
  fetchTrendingLocations,
  fetchWorldOverview,
  formatMemberCount,
  searchGeography,
  type ContinentRow,
  type CountryRow,
  type GeoKind,
  type GeoSearchHit,
  type GeoStats,
  type TrendingLocation,
  type WorldOverview,
} from "@/lib/world";
import type { Profile } from "@/types/database";

export const Route = createFileRoute("/world")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "OTAKUVERSE WORLD" },
      {
        name: "description",
        content: "Explore the otaku community across the planet.",
      },
      { property: "og:title", content: "OTAKUVERSE WORLD" },
    ],
  }),
  component: WorldPage,
});

type Crumb = { kind: GeoKind; id: string; label: string };

function WorldPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<WorldOverview | null>(null);
  const [continents, setContinents] = useState<ContinentRow[]>([]);
  const [trending, setTrending] = useState<TrendingLocation[]>([]);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [stats, setStats] = useState<GeoStats | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);

  const [crumbs, setCrumbs] = useState<Crumb[]>([{ kind: "earth", id: "earth", label: "Earth" }]);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<GeoSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [panelLoading, setPanelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected: Crumb = crumbs[crumbs.length - 1] ?? {
    kind: "earth",
    id: "earth",
    label: "Earth",
  };
  const selectedContinent =
    selected.kind === "continent"
      ? selected.id
      : crumbs.find((c) => c.kind === "continent")?.id ?? null;

  const loadBase = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [ov, cont, trend] = await Promise.all([
        fetchWorldOverview(),
        fetchContinents(),
        fetchTrendingLocations(8),
      ]);
      setOverview(ov);
      setContinents(cont);
      setTrending(trend);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load world data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (!user) {
      setMyProfile(null);
      return;
    }
    fetchMyProfile()
      .then(setMyProfile)
      .catch(() => setMyProfile(null));
  }, [user]);

  // Debounced geography search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      searchGeography(q, 16)
        .then(setHits)
        .catch(() => setHits([]))
        .finally(() => setSearching(false));
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  const openNode = useCallback(async (kind: Exclude<GeoKind, "earth">, id: string, label: string) => {
    setPanelLoading(true);
    setError(null);
    setQuery("");
    setHits([]);
    try {
      const s = await fetchGeoStats(kind, id);
      if (s.error) {
        setError(s.error === "not_found" ? "Location not found." : s.error);
        setStats(null);
        return;
      }
      setStats(s);
      setCrumbs((prev) => {
        const earth = prev[0] ?? { kind: "earth" as const, id: "earth", label: "Earth" };
        const next: Crumb[] = [earth];
        if (kind === "continent") {
          next.push({ kind, id, label });
        } else if (kind === "country") {
          const cc = (s.meta.continent_code as string) || undefined;
          if (cc) next.push({ kind: "continent", id: cc, label: cc });
          next.push({ kind, id, label });
        } else {
          // keep previous path up to parent level when drilling from children list
          const withoutLeaf = prev.filter((c) => c.kind !== kind);
          return [...withoutLeaf, { kind, id, label }];
        }
        return next;
      });
      if (kind === "continent") {
        const list = await fetchCountriesByContinent(id);
        setCountries(list);
      } else {
        setCountries([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load location.");
    } finally {
      setPanelLoading(false);
    }
  }, []);

  const goCrumb = useCallback(
    async (index: number) => {
      const target = crumbs[index];
      if (!target) return;
      if (target.kind === "earth") {
        setCrumbs([{ kind: "earth", id: "earth", label: "Earth" }]);
        setStats(null);
        setCountries([]);
        return;
      }
      setCrumbs(crumbs.slice(0, index + 1));
      await openNode(target.kind as Exclude<GeoKind, "earth">, target.id, target.label);
    },
    [crumbs, openNode],
  );

  const myLocationLabel = useMemo(() => {
    if (!myProfile) return null;
    const parts = [
      myProfile.country_code,
      // state/city ids are UUIDs — show codes we have
      myProfile.continent_code,
    ].filter(Boolean);
    if (!myProfile.country_code && !myProfile.continent_code) return null;
    return {
      country: myProfile.country_code,
      continent: myProfile.continent_code,
    };
  }, [myProfile]);

  return (
    <Screen eyebrow="WORLD" withNav>
      <section className="mt-8">
        <h1 className="font-display text-4xl font-bold leading-none tracking-tight">
          OTAKUVERSE WORLD
        </h1>
        <p className="mt-3 text-sm text-mist">Explore the otaku community across the planet.</p>
      </section>

      <ConnectionGuard>
        {loading ? (
          <Spinner label="Loading the world…" />
        ) : (
          <>
            {error ? <Notice>{error}</Notice> : null}

            {/* Search */}
            <div className="mt-5">
              <label className="block text-xs font-medium text-mist">Search geography</label>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nigeria, Lagos, Tokyo…"
                className="mt-2 w-full rounded-2xl bg-panel2 px-4 py-3 text-sm text-snow ring-1 ring-line outline-none placeholder:text-mist/60 focus:ring-2 focus:ring-neon"
                autoComplete="off"
              />
              {searching ? (
                <p className="mt-2 text-[11px] text-mist">Searching…</p>
              ) : null}
              {query.trim().length >= 2 && !searching && hits.length === 0 ? (
                <p className="mt-2 text-[11px] text-mist">No results.</p>
              ) : null}
              {hits.length > 0 ? (
                <ul className="mt-2 max-h-48 overflow-auto rounded-2xl bg-panel ring-1 ring-line">
                  {hits.map((h) => (
                    <li key={`${h.kind}-${h.id}`}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-panel2"
                        onClick={() => void openNode(h.kind, h.id, h.name)}
                      >
                        <span className="text-lg">{h.flag ?? "📍"}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-snow">{h.name}</span>
                          <span className="block truncate text-[11px] text-mist">
                            {h.kind}
                            {h.subtitle ? ` · ${h.subtitle}` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {/* Breadcrumbs */}
            <nav className="mt-4 flex flex-wrap items-center gap-1 text-xs" aria-label="Geography path">
              {crumbs.map((c, i) => (
                <span key={`${c.kind}-${c.id}`} className="flex items-center gap-1">
                  {i > 0 ? <span className="text-mist">→</span> : null}
                  <button
                    type="button"
                    onClick={() => void goCrumb(i)}
                    className={
                      i === crumbs.length - 1
                        ? "font-semibold text-neon"
                        : "text-mist hover:text-snow"
                    }
                  >
                    {c.kind === "earth" ? "🌍 Earth" : c.label}
                  </button>
                </span>
              ))}
            </nav>

            {/* Map */}
            <div className="mt-4">
              <WorldMap
                continents={continents}
                selectedContinent={selectedContinent}
                onSelectContinent={(code) => {
                  const name = continents.find((c) => c.code === code)?.name ?? code;
                  void openNode("continent", code, name);
                }}
              />
            </div>

            {/* Earth overview */}
            {selected.kind === "earth" && overview ? (
              <Panel className="mt-4">
                <p className="font-display text-xs font-semibold tracking-[0.2em] text-mist">
                  EARTH ACTIVITY
                </p>
                <p className="mt-2 font-display text-2xl font-bold">
                  {formatMemberCount(overview.total_members)}
                </p>
                <p className="mt-1 text-[11px] text-mist">
                  Community pulse: {overview.total_members_raw_bucket}. Counts under 5 stay hidden.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(overview.continents ?? []).map((c) => (
                    <button key={c.code} type="button" onClick={() => void openNode("continent", c.code, c.name)}>
                      <Chip active={false}>
                        {c.name}
                        {c.member_count != null ? ` · ${c.member_count}` : ""}
                      </Chip>
                    </button>
                  ))}
                </div>
              </Panel>
            ) : null}

            {/* Selected geo panel */}
            {panelLoading ? <Spinner label="Loading place…" /> : null}

            {!panelLoading && stats && selected.kind !== "earth" ? (
              <Panel className="mt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xs font-semibold tracking-[0.2em] text-mist">
                      {(stats.meta.kind as string)?.toUpperCase() ?? "PLACE"}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-bold">
                      {stats.meta.flag ? `${stats.meta.flag} ` : ""}
                      {(stats.meta.name as string) ?? selected.label}
                    </h2>
                  </div>
                </div>
                <p className="mt-3 text-sm text-snow">{formatMemberCount(stats.member_count)}</p>
                {stats.member_status === "not_enough_data" ? (
                  <p className="mt-1 text-[11px] text-mist">
                    Not enough members here to show a public count (privacy).
                  </p>
                ) : null}

                {(stats.popular_genres?.length ?? 0) > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stats.popular_genres.map((g) => (
                      <Chip key={g} active>
                        {g}
                      </Chip>
                    ))}
                  </div>
                ) : null}

                {(stats.children?.length ?? 0) > 0 ? (
                  <div className="mt-4">
                    <p className="font-display text-[11px] font-semibold tracking-[0.15em] text-mist">
                      EXPLORE
                    </p>
                    <ul className="mt-2 space-y-1">
                      {stats.children.map((ch) => (
                        <li key={ch.id}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-panel2"
                            onClick={() =>
                              void openNode(ch.kind as Exclude<GeoKind, "earth">, ch.id, ch.name)
                            }
                          >
                            <span className="text-sm text-snow">
                              {ch.flag ? `${ch.flag} ` : ""}
                              {ch.name}
                            </span>
                            <span className="text-[11px] text-mist">
                              {formatMemberCount(ch.member_count)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Panel>
            ) : null}

            {/* Countries under continent (extra list from dedicated RPC) */}
            {!panelLoading && selected.kind === "continent" && countries.length > 0 ? (
              <Panel className="mt-4">
                <p className="font-display text-xs font-semibold tracking-[0.2em] text-mist">
                  COUNTRIES
                </p>
                <ul className="mt-2 max-h-56 space-y-1 overflow-auto">
                  {countries.map((co) => (
                    <li key={co.code}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-panel2"
                        onClick={() => void openNode("country", co.code, co.name)}
                      >
                        <span className="text-sm text-snow">
                          {co.flag ? `${co.flag} ` : ""}
                          {co.name}
                        </span>
                        <span className="text-[11px] text-mist">
                          {formatMemberCount(co.member_count)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}

            {/* Trending */}
            {selected.kind === "earth" && trending.length > 0 ? (
              <Panel className="mt-4">
                <p className="font-display text-xs font-semibold tracking-[0.2em] text-mist">
                  TRENDING LOCATIONS
                </p>
                <ul className="mt-2 space-y-1">
                  {trending.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-panel2"
                        onClick={() => void openNode("country", t.id, t.name)}
                      >
                        <span className="text-sm text-snow">
                          {t.flag ? `${t.flag} ` : ""}
                          {t.name}
                        </span>
                        <span className="text-[11px] text-mist">
                          {formatMemberCount(t.member_count)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}

            {selected.kind === "earth" && trending.length === 0 && !loading ? (
              <Panel className="mt-4">
                <p className="text-sm text-mist">
                  No trending locations yet. Trending needs at least 5 members in a country
                  (privacy threshold).
                </p>
              </Panel>
            ) : null}

            {/* Your location from profile — no GPS */}
            {myLocationLabel ? (
              <Panel className="mt-4">
                <p className="font-display text-xs font-semibold tracking-[0.2em] text-mist">
                  YOUR OTAKUVERSE LOCATION
                </p>
                <p className="mt-2 text-sm text-snow">
                  {[myLocationLabel.continent, myLocationLabel.country].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 text-[11px] text-mist">
                  From your profile only — no GPS, no live tracking.
                </p>
                {myLocationLabel.country ? (
                  <button
                    type="button"
                    className="mt-3 text-xs font-semibold text-neon"
                    onClick={() =>
                      void openNode("country", myLocationLabel.country!, myLocationLabel.country!)
                    }
                  >
                    Open on map
                  </button>
                ) : null}
              </Panel>
            ) : user ? (
              <Panel className="mt-4">
                <p className="text-sm text-mist">
                  Set a country on your{" "}
                  <Link to="/profile" className="font-semibold text-neon">
                    profile
                  </Link>{" "}
                  to see your OTAKUVERSE location here.
                </p>
              </Panel>
            ) : null}

            <p className="mt-6 pb-2 text-center text-[11px] text-mist">
              Privacy-first: no exact addresses, GPS, or individual map markers.
            </p>
          </>
        )}
      </ConnectionGuard>
    </Screen>
  );
}
