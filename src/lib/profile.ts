import { requireSupabase } from "./supabase";
import type { Profile, PublicProfile } from "@/types/database";

/** Columns a user is allowed to edit on their own profile. */
export type EditableProfileFields = Partial<
  Pick<
    Profile,
    | "display_name"
    | "avatar_url"
    | "bio"
    | "gender"
    | "continent_code"
    | "country_code"
    | "state_id"
    | "city_id"
    | "local_area_id"
    | "favorite_anime"
    | "favorite_characters"
    | "favorite_genres"
    | "anime_watchlist"
    | "manga_list"
  >
>;

/** Full own profile, including private fields (security-definer RPC, own row only). */
export async function fetchMyProfile(): Promise<Profile | null> {
  const { data, error } = await requireSupabase().rpc("get_my_profile");
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return (row as Profile) ?? null;
}

/** Public profile of any user — private fields are never exposed. */
export async function fetchPublicProfile(username: string): Promise<PublicProfile | null> {
  const { data, error } = await requireSupabase()
    .from("public_profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PublicProfile) ?? null;
}

export async function updateMyProfile(userId: string, patch: EditableProfileFields) {
  const { error } = await requireSupabase().from("profiles").update(patch).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function isUsernameAvailable(candidate: string): Promise<boolean> {
  const { data, error } = await requireSupabase().rpc("is_username_available", { candidate });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export function xpForLevel(level: number): number {
  return level * 250;
}

export function levelProgress(xp: number, level: number) {
  const needed = xpForLevel(level);
  const floor = xpForLevel(level - 1);
  const into = Math.max(0, xp - floor);
  const span = Math.max(1, needed - floor);
  return { into, span, pct: Math.min(100, Math.round((into / span) * 100)) };
}
