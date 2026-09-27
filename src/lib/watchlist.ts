import { requireSupabase, supabase } from "./supabase";

export type WatchlistStatus = "watching" | "completed" | "plan_to_watch" | "dropped" | "on_hold";
export type MediaType = "anime" | "manga";

export interface WatchlistEntry {
  id: string;
  user_id: string;
  title: string;
  media_type: MediaType;
  status: WatchlistStatus;
  progress_count: number;
  total_count: number | null;
  score: number | null;
  cover_image: string | null;
  anilist_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface AniListSearchResult {
  id: number;
  title: string;
  media_type: MediaType;
  totalEpisodesOrChapters: number | null;
  coverImage: string | null;
  description: string | null;
}

/**
 * Searches AniList GraphQL API for anime or manga titles.
 */
export async function searchAniList(
  query: string,
  type: MediaType = "anime",
): Promise<AniListSearchResult[]> {
  if (!query.trim()) return [];

  const gqlQuery = `
    query ($search: String, $type: MediaType) {
      Page(perPage: 10) {
        media(search: $search, type: $type) {
          id
          title {
            romaji
            english
            native
          }
          episodes
          chapters
          coverImage {
            medium
            large
          }
          description
        }
      }
    }
  `;

  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: gqlQuery,
        variables: { search: query, type: type.toUpperCase() },
      }),
    });

    if (!res.ok) return [];
    const json = await res.json();
    const mediaList = json.data?.Page?.media ?? [];

    return mediaList.map(
      (m: {
        id: number;
        title: { english?: string; romaji?: string; native?: string };
        episodes?: number;
        chapters?: number;
        coverImage?: { medium?: string; large?: string };
        description?: string;
      }) => ({
        id: m.id,
        title: m.title.english || m.title.romaji || m.title.native || "Unknown Title",
        media_type: type,
        totalEpisodesOrChapters: type === "anime" ? (m.episodes ?? null) : (m.chapters ?? null),
        coverImage: m.coverImage?.medium || m.coverImage?.large || null,
        description: m.description ?? null,
      }),
    );
  } catch {
    return [];
  }
}

/**
 * Fetches user's watchlist entries from Supabase.
 */
export async function fetchUserWatchlist(userId: string): Promise<WatchlistEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("watchlist_entries")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    // If table not created yet in user's Supabase project, return empty list gracefully
    return [];
  }
  return (data as WatchlistEntry[]) ?? [];
}

/**
 * Adds or updates a watchlist item.
 */
export async function upsertWatchlistEntry(entry: {
  title: string;
  media_type: MediaType;
  status: WatchlistStatus;
  progress_count: number;
  total_count?: number | null;
  score?: number | null;
  cover_image?: string | null;
  anilist_id?: number | null;
}): Promise<{ ok: boolean; error?: string }> {
  const client = requireSupabase();
  const { data: user } = await client.auth.getUser();
  if (!user.user) throw new Error("Authentication required.");

  const { error } = await client.from("watchlist_entries").upsert(
    {
      user_id: user.user.id,
      title: entry.title,
      media_type: entry.media_type,
      status: entry.status,
      progress_count: entry.progress_count,
      total_count: entry.total_count ?? null,
      score: entry.score ?? null,
      cover_image: entry.cover_image ?? null,
      anilist_id: entry.anilist_id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,media_type,title" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Deletes a watchlist entry.
 */
export async function deleteWatchlistEntry(id: string): Promise<{ ok: boolean }> {
  const client = requireSupabase();
  const { error } = await client.from("watchlist_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
