import { requireSupabase } from "./supabase";

export type GeoKind = "earth" | "continent" | "country" | "state" | "city" | "local_area";

export interface GeoSearchHit {
  kind: Exclude<GeoKind, "earth">;
  id: string;
  name: string;
  subtitle: string | null;
  continent_code: string | null;
  country_code: string | null;
  flag: string | null;
  lat: number | null;
  lng: number | null;
}

export interface ContinentRow {
  code: string;
  name: string;
  member_count: number | null;
}

export interface CountryRow {
  code: string;
  name: string;
  flag: string | null;
  dial: string | null;
  lat: number | null;
  lng: number | null;
  member_count: number | null;
}

export interface WorldOverview {
  total_members: number | null;
  total_members_raw_bucket: "sparse" | "growing" | "active";
  continents: Array<{ code: string; name: string; member_count: number | null }>;
}

export interface GeoChild {
  id: string;
  name: string;
  kind: string;
  flag?: string | null;
  member_count: number | null;
}

export interface GeoStats {
  meta: Record<string, unknown> & {
    kind?: string;
    name?: string;
    code?: string;
    flag?: string;
    continent_code?: string;
    country_code?: string;
    lat?: number | null;
    lng?: number | null;
  };
  member_count: number | null;
  member_status: "ok" | "not_enough_data";
  children: GeoChild[];
  popular_genres: string[];
  error?: string;
}

export interface TrendingLocation {
  kind: string;
  id: string;
  name: string;
  flag: string | null;
  continent_code: string | null;
  member_count: number | null;
}

export async function searchGeography(query: string, limit = 20): Promise<GeoSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await requireSupabase().rpc("search_geography", {
    q,
    result_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data as GeoSearchHit[]) ?? [];
}

export async function fetchWorldOverview(): Promise<WorldOverview> {
  const { data, error } = await requireSupabase().rpc("get_world_overview");
  if (error) throw new Error(error.message);
  return data as WorldOverview;
}

export async function fetchGeoStats(kind: Exclude<GeoKind, "earth">, id: string): Promise<GeoStats> {
  const { data, error } = await requireSupabase().rpc("get_geo_stats", {
    p_kind: kind,
    p_id: id,
  });
  if (error) throw new Error(error.message);
  const stats = data as GeoStats;
  if (!Array.isArray(stats?.popular_genres)) stats.popular_genres = [];
  if (!Array.isArray(stats?.children)) stats.children = [];
  return stats;
}

export async function fetchTrendingLocations(limit = 8): Promise<TrendingLocation[]> {
  const { data, error } = await requireSupabase().rpc("get_trending_locations", {
    result_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data as TrendingLocation[]) ?? [];
}

export async function fetchContinents(): Promise<ContinentRow[]> {
  const { data, error } = await requireSupabase().rpc("list_continents");
  if (error) throw new Error(error.message);
  return (data as ContinentRow[]) ?? [];
}

export async function fetchCountriesByContinent(continentCode: string): Promise<CountryRow[]> {
  const { data, error } = await requireSupabase().rpc("list_countries_by_continent", {
    p_continent: continentCode,
  });
  if (error) throw new Error(error.message);
  return (data as CountryRow[]) ?? [];
}

export function formatMemberCount(count: number | null | undefined): string {
  if (count == null) return "Not enough data";
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k members`;
  return `${count} member${count === 1 ? "" : "s"}`;
}
