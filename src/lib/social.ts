import { requireSupabase } from "./supabase";

/* ------------------------------------------------------------------ */
/* Types — kept loose where the backend may return extra columns.      */
/* ------------------------------------------------------------------ */

export type PostVisibility = "public" | "followers" | "friends" | "community" | "private";

export interface SocialPost {
  id: string;
  author_id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  body: string;
  media_urls?: string[] | null;
  image_urls?: string[] | null;
  visibility?: PostVisibility | string | null;
  community_id?: string | null;
  community_name?: string | null;
  reaction_count?: number | null;
  comment_count?: number | null;
  my_reaction?: string | null;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  body: string;
  parent_id?: string | null;
  created_at: string;
}

export interface SocialUser {
  id?: string;
  user_id?: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  follower_count?: number | null;
  is_following?: boolean | null;
  friend_status?: string | null;
  level?: number | null;
}

export interface Conversation {
  id?: string;
  conversation_id?: string;
  other_user_id?: string | null;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count?: number | null;
}

export interface DmMessage {
  id: string;
  conversation_id?: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at?: string | null;
}

export interface AppNotification {
  id: string;
  type: string;
  actor_id?: string | null;
  actor_username?: string | null;
  actor_display_name?: string | null;
  actor_avatar_url?: string | null;
  entity_id?: string | null;
  body?: string | null;
  message?: string | null;
  is_read?: boolean | null;
  read_at?: string | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* RPC helper — tolerant of small argument-name differences.           */
/* ------------------------------------------------------------------ */

type Args = Record<string, unknown>;

function isSignatureMismatch(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("could not find the function") ||
    m.includes("does not exist") ||
    m.includes("without parameters") ||
    m.includes("no function matches")
  );
}

/** Calls an RPC, trying each argument shape until one is accepted. */
async function rpc<T>(name: string, variants: Args[]): Promise<T> {
  const client = requireSupabase();
  let lastError = "";
  for (const args of variants) {
    const { data, error } = await client.rpc(name, args);
    if (!error) return data as T;
    lastError = error.message;
    if (!isSignatureMismatch(error.message)) throw new Error(error.message);
  }
  throw new Error(lastError || `${name} is not available.`);
}

function rows<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const maybe = (data as Record<string, unknown>)["items"];
    if (Array.isArray(maybe)) return maybe as T[];
  }
  return [];
}

/* ------------------------------------------------------------------ */
/* Feed & posts                                                        */
/* ------------------------------------------------------------------ */

export async function getSocialFeed(limit = 20, offset = 0): Promise<SocialPost[]> {
  const data = await rpc<unknown>("get_social_feed", [
    { result_limit: limit, result_offset: offset },
    { result_limit: limit },
    { p_limit: limit, p_offset: offset },
    {},
  ]);
  return rows<SocialPost>(data);
}

export async function createSocialPost(input: {
  body: string;
  visibility?: string;
  communityId?: string | null;
  mediaUrls?: string[];
}) {
  const media = input.mediaUrls ?? [];
  const vis = input.visibility ?? "public";
  const data = await rpc<unknown>("create_social_post", [
    {
      p_body: input.body,
      p_visibility: vis,
      p_community_id: input.communityId ?? null,
      p_media_urls: media,
    },
    {
      p_body: input.body,
      p_visibility: vis,
      p_community_id: input.communityId ?? null,
      p_image_urls: media,
    },
    { p_body: input.body, p_visibility: vis, p_community_id: input.communityId ?? null },
    { p_body: input.body },
  ]);
  return data as { ok?: boolean; id?: string; error?: string } | null;
}

export async function reactToPost(postId: string, reaction = "like") {
  return rpc<unknown>("react_to_post", [
    { p_post_id: postId, p_reaction: reaction },
    { p_post_id: postId, p_reaction_type: reaction },
    { p_post_id: postId },
  ]);
}

export async function removePostReaction(postId: string) {
  return rpc<unknown>("remove_post_reaction", [{ p_post_id: postId }]);
}

export async function listPostComments(postId: string, limit = 50): Promise<PostComment[]> {
  const data = await rpc<unknown>("list_post_comments", [
    { p_post_id: postId, result_limit: limit },
    { p_post_id: postId, p_limit: limit },
    { p_post_id: postId },
  ]);
  return rows<PostComment>(data);
}

export async function commentOnPost(postId: string, body: string, parentId?: string | null) {
  return rpc<unknown>("comment_on_post", [
    { p_post_id: postId, p_body: body, p_parent_id: parentId ?? null },
    { p_post_id: postId, p_body: body, p_parent_comment_id: parentId ?? null },
    { p_post_id: postId, p_body: body },
  ]);
}

/* ------------------------------------------------------------------ */
/* Connections                                                         */
/* ------------------------------------------------------------------ */

export async function followUser(userId: string) {
  return rpc<unknown>("follow_user", [{ p_user_id: userId }, { p_target_id: userId }]);
}

export async function unfollowUser(userId: string) {
  return rpc<unknown>("unfollow_user", [{ p_user_id: userId }, { p_target_id: userId }]);
}

export async function sendFriendRequest(userId: string) {
  return rpc<unknown>("send_friend_request", [{ p_user_id: userId }, { p_target_id: userId }]);
}

export async function respondFriendRequest(requestId: string, accept: boolean) {
  return rpc<unknown>("respond_friend_request", [
    { p_request_id: requestId, p_accept: accept },
    { p_request_id: requestId, p_response: accept ? "accepted" : "declined" },
    { p_user_id: requestId, p_accept: accept },
  ]);
}

export async function blockUser(userId: string) {
  return rpc<unknown>("block_user", [{ p_user_id: userId }, { p_target_id: userId }]);
}

export async function getFollowers(userId?: string | null, limit = 50): Promise<SocialUser[]> {
  const data = await rpc<unknown>("get_followers", [
    { p_user_id: userId ?? null, result_limit: limit },
    { p_user_id: userId ?? null },
    { result_limit: limit },
    {},
  ]);
  return rows<SocialUser>(data);
}

export async function getFollowing(userId?: string | null, limit = 50): Promise<SocialUser[]> {
  const data = await rpc<unknown>("get_following", [
    { p_user_id: userId ?? null, result_limit: limit },
    { p_user_id: userId ?? null },
    { result_limit: limit },
    {},
  ]);
  return rows<SocialUser>(data);
}

export async function searchUsers(q: string, limit = 25): Promise<SocialUser[]> {
  const data = await rpc<unknown>("search_users", [
    { q, result_limit: limit },
    { p_query: q, result_limit: limit },
    { q },
  ]);
  return rows<SocialUser>(data);
}

/* ------------------------------------------------------------------ */
/* Direct messages                                                     */
/* ------------------------------------------------------------------ */

export async function listMyConversations(limit = 50): Promise<Conversation[]> {
  const data = await rpc<unknown>("list_my_conversations", [{ result_limit: limit }, {}]);
  return rows<Conversation>(data);
}

export async function getOrCreateDm(userId: string): Promise<string | null> {
  const data = await rpc<unknown>("get_or_create_dm", [
    { p_user_id: userId },
    { p_other_user_id: userId },
    { p_target_id: userId },
  ]);
  if (typeof data === "string") return data;
  const row = Array.isArray(data) ? data[0] : data;
  if (row && typeof row === "object") {
    const r = row as Record<string, unknown>;
    const id = r["conversation_id"] ?? r["id"];
    if (typeof id === "string") return id;
  }
  return null;
}

export async function listDmMessages(conversationId: string, limit = 60): Promise<DmMessage[]> {
  const data = await rpc<unknown>("list_dm_messages", [
    { p_conversation_id: conversationId, result_limit: limit },
    { p_conversation_id: conversationId, p_limit: limit },
    { p_conversation_id: conversationId },
  ]);
  return rows<DmMessage>(data);
}

export async function sendDm(conversationId: string, body: string) {
  return rpc<unknown>("send_dm", [
    { p_conversation_id: conversationId, p_body: body },
    { p_conversation_id: conversationId, p_message: body },
  ]);
}

export async function markDmRead(conversationId: string) {
  return rpc<unknown>("mark_dm_read", [{ p_conversation_id: conversationId }]);
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export async function getMyNotifications(limit = 50): Promise<AppNotification[]> {
  const data = await rpc<unknown>("get_my_notifications", [{ result_limit: limit }, {}]);
  return rows<AppNotification>(data);
}

export async function markNotificationsRead(ids?: string[]) {
  return rpc<unknown>("mark_notifications_read", [
    { p_notification_ids: ids ?? null },
    { p_ids: ids ?? null },
    {},
  ]);
}

/* ------------------------------------------------------------------ */
/* Media upload (Supabase Storage)                                     */
/* ------------------------------------------------------------------ */

export const MEDIA_BUCKET =
  (import.meta.env['VITE_SUPABASE_MEDIA_BUCKET'] as string | undefined) ?? "post-media";

export async function uploadPostMedia(file: File, userId: string): Promise<string> {
  const client = requireSupabase();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await client.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) {
    throw new Error(
      `Upload failed (${error.message}). Make sure a storage bucket named "${MEDIA_BUCKET}" exists and allows uploads.`,
    );
  }
  const { data } = client.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

export function postMedia(post: SocialPost): string[] {
  return post.media_urls ?? post.image_urls ?? [];
}

export function userId(u: SocialUser): string {
  return (u.id ?? u.user_id ?? "") as string;
}

export function conversationId(c: Conversation): string {
  return (c.id ?? c.conversation_id ?? "") as string;
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.max(1, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return `${secs}s`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

export function clockTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
