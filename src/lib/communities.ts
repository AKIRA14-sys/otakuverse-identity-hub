import { requireSupabase } from "./supabase";

export type CommunityType =
  | "country"
  | "state"
  | "city"
  | "local_area"
  | "school"
  | "university"
  | "anime"
  | "manga"
  | "gaming"
  | "cosplay"
  | "language"
  | "interest"
  | "custom";

export type CommunityPrivacy = "public" | "private" | "restricted";
export type MembershipRole = "member" | "moderator" | "admin" | "owner";
export type MembershipStatus = "active" | "pending" | "banned" | "left";
export type VerificationStatus = "none" | "pending" | "verified" | "rejected";

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: CommunityType;
  privacy: CommunityPrivacy;
  avatar_url: string | null;
  banner_url: string | null;
  country_code: string | null;
  state_id: string | null;
  city_id: string | null;
  local_area_id: string | null;
  owner_id: string;
  verification: VerificationStatus;
  member_count: number;
  post_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MembershipInfo {
  role: MembershipRole;
  status: MembershipStatus;
  joined_at: string;
}

export interface CommunityMember {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: MembershipRole;
  joined_at: string;
}

export interface CommunityPost {
  id: string;
  community_id: string;
  author_id: string;
  body: string;
  image_urls: string[];
  link_url: string | null;
  moderation: string;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface Society {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  owner_id: string;
  verification: VerificationStatus;
  member_count: number;
  is_active: boolean;
  created_at: string;
}

export interface Clan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  owner_id: string;
  parent_community_id: string | null;
  parent_society_id: string | null;
  verification: VerificationStatus;
  member_count: number;
  is_active: boolean;
  created_at: string;
}

export const COMMUNITY_TYPES: { value: CommunityType; label: string }[] = [
  { value: "anime", label: "Anime" },
  { value: "manga", label: "Manga" },
  { value: "gaming", label: "Gaming" },
  { value: "cosplay", label: "Cosplay" },
  { value: "language", label: "Language" },
  { value: "interest", label: "Interest" },
  { value: "country", label: "Country" },
  { value: "city", label: "City" },
  { value: "school", label: "School" },
  { value: "university", label: "University" },
  { value: "custom", label: "Custom" },
];

export async function searchCommunities(
  q = "",
  type?: CommunityType | null,
  limit = 20,
): Promise<Community[]> {
  const { data, error } = await requireSupabase().rpc("search_communities", {
    q,
    p_type: type ?? null,
    result_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data as Community[]) ?? [];
}

export async function fetchTrendingCommunities(limit = 10): Promise<Community[]> {
  const { data, error } = await requireSupabase().rpc("get_trending_communities", {
    result_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data as Community[]) ?? [];
}

export async function fetchNearbyCommunities(limit = 12): Promise<Community[]> {
  const { data, error } = await requireSupabase().rpc("nearby_communities_for_me", {
    result_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data as Community[]) ?? [];
}

export async function fetchCommunityBySlug(slug: string): Promise<Community | null> {
  const { data, error } = await requireSupabase().rpc("get_community_by_slug", {
    p_slug: slug,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return (row as Community) ?? null;
}

export async function joinCommunity(communityId: string) {
  const { data, error } = await requireSupabase().rpc("join_community", {
    p_community_id: communityId,
  });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean; status?: string; error?: string; already?: boolean };
}

export async function leaveCommunity(communityId: string) {
  const { data, error } = await requireSupabase().rpc("leave_community", {
    p_community_id: communityId,
  });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean; error?: string };
}

export async function createCommunity(input: {
  name: string;
  type: CommunityType;
  description?: string;
  privacy?: CommunityPrivacy;
  country_code?: string;
}) {
  const { data, error } = await requireSupabase().rpc("create_community", {
    p_name: input.name,
    p_type: input.type,
    p_description: input.description ?? null,
    p_privacy: input.privacy ?? "public",
    p_country_code: input.country_code ?? null,
  });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean; id?: string; slug?: string; error?: string };
}

export async function fetchMyMembership(communityId: string): Promise<MembershipInfo | null> {
  const { data, error } = await requireSupabase().rpc("get_my_membership", {
    p_community_id: communityId,
  });
  if (error) throw new Error(error.message);
  if (data == null) return null;
  return data as MembershipInfo;
}

export async function listCommunityMembers(
  communityId: string,
  limit = 30,
): Promise<CommunityMember[]> {
  const { data, error } = await requireSupabase().rpc("list_community_members", {
    p_community_id: communityId,
    result_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data as CommunityMember[]) ?? [];
}

export async function listCommunityPosts(
  communityId: string,
  limit = 20,
): Promise<CommunityPost[]> {
  const { data, error } = await requireSupabase().rpc("list_community_posts", {
    p_community_id: communityId,
    result_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data as CommunityPost[]) ?? [];
}

export async function createCommunityPost(
  communityId: string,
  body: string,
  linkUrl?: string,
) {
  const { data, error } = await requireSupabase().rpc("create_community_post", {
    p_community_id: communityId,
    p_body: body,
    p_link_url: linkUrl ?? null,
  });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean; id?: string; error?: string };
}

export async function searchSocieties(q = "", limit = 20): Promise<Society[]> {
  const { data, error } = await requireSupabase().rpc("search_societies", {
    q,
    result_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data as Society[]) ?? [];
}

export async function searchClans(q = "", limit = 20): Promise<Clan[]> {
  const { data, error } = await requireSupabase().rpc("search_clans", {
    q,
    result_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data as Clan[]) ?? [];
}

export function formatMembers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
