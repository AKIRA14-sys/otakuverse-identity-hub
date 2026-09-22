import { useCallback, useState } from "react";

import { OtkButton } from "@/components/otk/button";
import { UserIdentity } from "@/components/otk/avatar";
import { Notice, Spinner } from "@/components/otk/shell";
import {
  commentOnPost,
  listPostComments,
  postMedia,
  reactToPost,
  removePostReaction,
  timeAgo,
  type PostComment,
  type SocialPost,
} from "@/lib/social";

function VisibilityTag({ value }: { value?: string | null }) {
  if (!value) return null;
  return (
    <span className="rounded-full bg-panel2 px-2 py-0.5 text-[10px] font-medium text-mist ring-1 ring-line">
      {value}
    </span>
  );
}

export function PostCard({
  post,
  canInteract,
  onChanged,
}: {
  post: SocialPost;
  canInteract: boolean;
  onChanged?: () => void;
}) {
  const [reacted, setReacted] = useState(Boolean(post.my_reaction));
  const [count, setCount] = useState(post.reaction_count ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);
  const [sending, setSending] = useState(false);

  const media = postMedia(post);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    setCommentError(null);
    try {
      setComments(await listPostComments(post.id));
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Could not load comments.");
    } finally {
      setLoadingComments(false);
    }
  }, [post.id]);

  async function toggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) await loadComments();
  }

  async function toggleReaction() {
    if (!canInteract || busy) return;
    setBusy(true);
    setError(null);
    const was = reacted;
    setReacted(!was);
    setCount((c) => Math.max(0, c + (was ? -1 : 1)));
    try {
      if (was) await removePostReaction(post.id);
      else await reactToPost(post.id);
      onChanged?.();
    } catch (err) {
      setReacted(was);
      setCount((c) => Math.max(0, c + (was ? 1 : -1)));
      setError(err instanceof Error ? err.message : "Reaction failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    setCommentError(null);
    try {
      await commentOnPost(post.id, draft.trim(), replyTo?.id ?? null);
      setDraft("");
      setReplyTo(null);
      await loadComments();
      onChanged?.();
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Could not post comment.");
    } finally {
      setSending(false);
    }
  }

  const topLevel = (comments ?? []).filter((c) => !c.parent_id);
  const repliesOf = (id: string) => (comments ?? []).filter((c) => c.parent_id === id);

  return (
    <article className="panel-card p-4">
      <header className="flex items-center gap-2">
        <UserIdentity
          username={post.username}
          displayName={post.display_name}
          avatarUrl={post.avatar_url}
          subtitle={`${post.username ? `@${post.username} · ` : ""}${timeAgo(post.created_at)}`}
          size={36}
        />
        <VisibilityTag value={post.visibility} />
      </header>

      {post.community_name ? (
        <p className="mt-2 text-[11px] text-neon">in {post.community_name}</p>
      ) : null}

      <p className="mt-3 whitespace-pre-wrap text-pretty text-sm text-snow">{post.body}</p>

      {media.length > 0 ? (
        <div
          className={`mt-3 grid gap-2 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {media.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              loading="lazy"
              className="max-h-80 w-full rounded-2xl object-cover ring-1 ring-line"
            />
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <OtkButton
          type="button"
          variant={reacted ? "outlineNeon" : "subtle"}
          size="sm"
          onClick={() => void toggleReaction()}
          disabled={!canInteract || busy}
          aria-pressed={reacted}
          aria-label={reacted ? "Remove reaction" : "React to post"}
        >
          ♥ {count}
        </OtkButton>
        <OtkButton
          type="button"
          variant="subtle"
          size="sm"
          onClick={() => void toggleComments()}
          aria-expanded={showComments}
        >
          💬 {post.comment_count ?? 0}
        </OtkButton>
      </div>

      {error ? <Notice>{error}</Notice> : null}

      {showComments ? (
        <section className="mt-4 border-t border-line pt-4">
          {loadingComments ? <Spinner label="Loading comments…" /> : null}
          {commentError ? <Notice>{commentError}</Notice> : null}
          {!loadingComments && topLevel.length === 0 && !commentError ? (
            <p className="text-xs text-mist">No comments yet. Be the first.</p>
          ) : null}

          <ul className="space-y-3">
            {topLevel.map((c) => (
              <li key={c.id}>
                <CommentRow
                  comment={c}
                  canInteract={canInteract}
                  onReply={() => setReplyTo(c)}
                />
                {repliesOf(c.id).length > 0 ? (
                  <ul className="mt-2 space-y-2 border-l border-line pl-3">
                    {repliesOf(c.id).map((r) => (
                      <li key={r.id}>
                        <CommentRow comment={r} canInteract={false} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>

          {canInteract ? (
            <form onSubmit={submitComment} className="mt-4">
              {replyTo ? (
                <p className="mb-2 text-[11px] text-mist">
                  Replying to @{replyTo.username ?? "user"} ·{" "}
                  <button
                    type="button"
                    className="text-neon underline"
                    onClick={() => setReplyTo(null)}
                  >
                    cancel
                  </button>
                </p>
              ) : null}
              <div className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a comment…"
                  aria-label="Write a comment"
                  className="min-w-0 flex-1 rounded-2xl bg-panel2 px-4 py-2.5 text-sm text-snow ring-1 ring-line outline-none placeholder:text-mist/60 focus:ring-2 focus:ring-neon"
                />
                <OtkButton type="submit" size="sm" disabled={sending || !draft.trim()}>
                  {sending ? "…" : "Send"}
                </OtkButton>
              </div>
            </form>
          ) : (
            <p className="mt-3 text-xs text-mist">Sign in to join the conversation.</p>
          )}
        </section>
      ) : null}
    </article>
  );
}

function CommentRow({
  comment,
  canInteract,
  onReply,
}: {
  comment: PostComment;
  canInteract: boolean;
  onReply?: () => void;
}) {
  return (
    <div className="rounded-2xl bg-panel2 p-3">
      <div className="flex items-center gap-2">
        <UserIdentity
          username={comment.username}
          displayName={comment.display_name}
          avatarUrl={comment.avatar_url}
          subtitle={timeAgo(comment.created_at)}
          size={28}
        />
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-snow">{comment.body}</p>
      {canInteract && onReply ? (
        <button
          type="button"
          onClick={onReply}
          className="mt-2 text-[11px] font-semibold text-neon"
        >
          Reply
        </button>
      ) : null}
    </div>
  );
}
