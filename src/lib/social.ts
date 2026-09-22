import { requireSupabase } from "./supabase";

export type PostVisibility = "public" | "followers" | "friends" | "community";
export type ReactionKind = "like" | "love" | "laugh" | "amazing" | "sad" | "angry";

export interface FeedPost {
  id: string;
  author_id: string;
  author_username: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  body: string;
  media_urls: string[];
  visibility: PostVisibility;
  reaction_count: number;
  comment_count: number;
  repost_count: number;
  created_at: string;
  my_reaction: ReactionKind | null;
}

export interface PostComment {
  id: string;
  author_id: string;
  author_username: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  parent_id: string | null;
  body: string;
  reaction_count: number;
  created_at: string;
}

export interface SocialUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  follower_count?: number;
}

export interface ConversationRow {
  conversation_id: string;
  other_user_id: string;
  other_username: string;
  other_display_name: string | null;
  other_avatar_url: string | null;
  last_body: string | null;
  last_at: string;
  unread: boolean;
}

export interface DmMessage {
  id: string;
  sender_id: string;
  body: string;
  reply_to_id: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

export const REACTION_LABELS: { kind: ReactionKind; label: string }[] = [
  { kind: "like", label: "Like" },
  { kind: "love", label: "Love" },
  { kind: "laugh", label: "Laugh" },
  { kind: "amazing", label: "Amazing" },
  { kind: "sad", label: "Sad" },
  { kind: "angry", label: "Angry" },
];

export async function fetchFeed(limit = 20, before?: string): Promise<FeedPost[]> {
  const { data, error } = await requireSupabase().rpc("get_social_feed", {
    result_limit: limit,
    p_before: before ?? null,
  });
  if (error) throw new Error(error.message);
  return (data as FeedPost[]) ?? [];
}

export async function createPost(input: {
  body: string;
  visibility?: PostVisibility;
  media_urls?: string[];
}) {
  const { data, error } = await requireSupabase().rpc("create_social_post", {
    p_body: input.body,
    p_visibility: input.visibility ?? "public",
    p_media_urls: input.media_urls ?? [],
    p_community_id: null,
  });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean; id?: string; error?: string };
}

export async function reactToPost(postId: string, kind: ReactionKind = "like") {
  const { data, error } = await requireSupabase().rpc("react_to_post", {
    p_post_id: postId,
    p_kind: kind,
  });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean; error?: string };
}

export async function removeReaction(postId: string) {
  const { data, error } = await requireSupabase().rpc("remove_post_reaction", {
    p_post_id: postId,
  });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean };
}

export async function commentOnPost(postId: string, body: string, parentId?: string) {
  const { data, error } = await requireSupabase().rpc("comment_on_post", {
    p_post_id: postId,
    p_body: body,
    p_parent_id: parentId ?? null,
  });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean; id?: string; error?: string };
}

export async function listComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await requireSupabase().rpc("list_post_comments", {
    p_post_id: postId,
    result_limit: 50,
  });
  if (error) throw new Error(error.message);
  return (data as PostComment[]) ?? [];
}

export async function followUser(userId: string) {
  const { data, error } = await requireSupabase().rpc("follow_user", { p_user_id: userId });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean; error?: string };
}

export async function unfollowUser(userId: string) {
  const { data, error } = await requireSupabase().rpc("unfollow_user", { p_user_id: userId });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean };
}

export async function sendFriendRequest(userId: string) {
  const { data, error } = await requireSupabase().rpc("send_friend_request", {
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean; error?: string };
}

export async function respondFriendRequest(requesterId: string, accept: boolean) {
  const { data, error } = await requireSupabase().rpc("respond_friend_request", {
    p_requester_id: requesterId,
    p_accept: accept,
  });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean; error?: string };
}

export async function getFollowers(userId: string) {
  const { data, error } = await requireSupabase().rpc("get_followers", {
    p_user_id: userId,
    result_limit: 40,
  });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFollowing(userId: string) {
  const { data, error } = await requireSupabase().rpc("get_following", {
    p_user_id: userId,
    result_limit: 40,
  });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function searchUsers(q: string): Promise<SocialUser[]> {
  if (!q.trim()) return [];
  const { data, error } = await requireSupabase().rpc("search_users", {
    q,
    result_limit: 20,
  });
  if (error) throw new Error(error.message);
  return (data as SocialUser[]) ?? [];
}

export async function getOrCreateDm(otherUserId: string) {
  const { data, error } = await requireSupabase().rpc("get_or_create_dm", {
    p_other_user: otherUserId,
  });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean; conversation_id?: string; error?: string };
}

export async function listConversations(): Promise<ConversationRow[]> {
  const { data, error } = await requireSupabase().rpc("list_my_conversations", {
    result_limit: 30,
  });
  if (error) throw new Error(error.message);
  return (data as ConversationRow[]) ?? [];
}

export async function listDmMessages(conversationId: string): Promise<DmMessage[]> {
  const { data, error } = await requireSupabase().rpc("list_dm_messages", {
    p_conversation_id: conversationId,
    result_limit: 80,
  });
  if (error) throw new Error(error.message);
  return (data as DmMessage[]) ?? [];
}

export async function sendDm(conversationId: string, body: string) {
  const { data, error } = await requireSupabase().rpc("send_dm", {
    p_conversation_id: conversationId,
    p_body: body,
    p_reply_to: null,
  });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean; id?: string; error?: string };
}

export async function markDmRead(conversationId: string) {
  await requireSupabase().rpc("mark_dm_read", { p_conversation_id: conversationId });
}

export async function getNotifications(): Promise<NotificationRow[]> {
  const { data, error } = await requireSupabase().rpc("get_my_notifications", {
    result_limit: 40,
  });
  if (error) throw new Error(error.message);
  return (data as NotificationRow[]) ?? [];
}

export async function markNotificationsRead(ids?: string[]) {
  const { data, error } = await requireSupabase().rpc("mark_notifications_read", {
    p_ids: ids ?? null,
  });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean };
}

export async function blockUser(userId: string) {
  const { data, error } = await requireSupabase().rpc("block_user", { p_user_id: userId });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean; error?: string };
}

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
