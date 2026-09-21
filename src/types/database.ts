/**
 * Hand-maintained types for the OTAKUVERSE schema.
 * Keep in sync with /supabase/migrations.
 */

export type Gender = "male" | "female" | "prefer_not_to_say";

export interface Profile {
  id: string; // auth.users.id — the permanent identity
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;

  // Private by default
  email: string | null;
  phone_e164: string | null;
  date_of_birth: string | null;

  gender: Gender | null;

  continent_code: string | null;
  country_code: string | null;
  state_id: string | null;
  city_id: string | null;
  local_area_id: string | null;

  favorite_anime: string[];
  favorite_characters: string[];
  favorite_genres: string[];
  anime_watchlist: string[];
  manga_list: string[];

  xp: number;
  level: number;
  reputation: number;
  follower_count: number;
  following_count: number;

  created_at: string;
}

/** Shape returned by the public_profiles view (no private fields). */
export interface PublicProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  gender: Gender | null;
  continent_code: string | null;
  country_code: string | null;
  city_id: string | null;
  age: number | null;
  favorite_anime: string[];
  favorite_characters: string[];
  favorite_genres: string[];
  anime_watchlist: string[];
  manga_list: string[];
  xp: number;
  level: number;
  reputation: number;
  follower_count: number;
  following_count: number;
  created_at: string;
}

export interface Badge {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export interface Achievement {
  code: string;
  name: string;
  description: string | null;
  xp_reward: number;
}

/** Space 2 — geography reference (matches migrations). */
export interface Continent {
  code: string;
  name: string;
  member_count_cached?: number;
}

export interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string | null;
  continent_code: string | null;
  lat: number | null;
  lng: number | null;
  member_count_cached?: number;
}

export interface StateProvince {
  id: string;
  country_code: string;
  name: string;
  code: string | null;
  lat: number | null;
  lng: number | null;
}

export interface City {
  id: string;
  country_code: string;
  state_id: string | null;
  name: string;
  lat: number | null;
  lng: number | null;
}

export interface LocalArea {
  id: string;
  city_id: string;
  name: string;
}
