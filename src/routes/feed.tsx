import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { Notice, Panel, Screen, Spinner } from "@/components/otk/shell";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  createPost,
  fetchFeed,
  reactToPost,
  removeReaction,
  timeAgo,
  type FeedPost,
  type ReactionKind,
} from "@/lib/social";

export const Route = createFileRoute("/feed")({
  ssr: false,
  head: () => ({ meta: [{ title: "Feed — OTAKUVERSE" }] }),
  component: FeedPage,
});

function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPosts(await fetchFeed(25));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onPost() {
    if (!user || !body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await createPost({ body: body.trim() });
      if (res.error) setError(res.error);
      else {
        setBody("");
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Post failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onReact(post: FeedPost, kind: ReactionKind = "like") {
    if (!user) return;
    try {
      if (post.my_reaction === kind) await removeReaction(post.id);
      else await reactToPost(post.id, kind);
      await load();
    } catch {
      /* ignore */
    }
  }

  return (
    <Screen eyebrow="FEED" withNav>
      <section className="mt-8">
        <h1 className="font-display text-3xl font-bold">Home</h1>
        <p className="mt-2 text-sm text-mist">Your OTAKUVERSE social feed.</p>
      </section>

      <ConnectionGuard>
        {error ? <Notice>{error}</Notice> : null}

        {user ? (
          <Panel className="mt-5">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Share something with the verse…"
              className="w-full resize-none rounded-xl bg-panel2 px-3 py-2 text-sm text-snow ring-1 ring-line outline-none focus:ring-neon"
            />
            <button
              type="button"
              disabled={busy || !body.trim()}
              onClick={() => void onPost()}
              className="mt-2 rounded-full bg-neon/15 px-4 py-2 text-xs font-semibold text-neon ring-1 ring-neon/40 disabled:opacity-40"
            >
              {busy ? "Posting…" : "Post"}
            </button>
          </Panel>
        ) : (
          <Panel className="mt-5">
            <p className="text-sm text-mist">
              <Link to="/auth/login" className="font-semibold text-neon">
                Log in
              </Link>{" "}
              to post.
            </p>
          </Panel>
        )}

        {loading ? <Spinner label="Loading feed…" /> : null}

        {!loading && posts.length === 0 ? (
          <Panel className="mt-4">
            <p className="text-sm text-mist">No posts yet. Be the first.</p>
          </Panel>
        ) : null}

        <div className="mt-4 space-y-3">
          {posts.map((p) => (
            <Panel key={p.id}>
              <div className="flex items-center gap-2">
                <Link
                  to="/u/$username"
                  params={{ username: p.author_username }}
                  className="font-display text-sm font-semibold text-snow"
                >
                  {p.author_display_name || p.author_username}
                </Link>
                <span className="text-[11px] text-mist">@{p.author_username}</span>
                <span className="ml-auto text-[11px] text-mist">{timeAgo(p.created_at)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-snow">{p.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-mist">
                <button
                  type="button"
                  onClick={() => void onReact(p, "like")}
                  className={p.my_reaction ? "font-semibold text-neon" : ""}
                >
                  ♥ {p.reaction_count}
                </button>
                <span>💬 {p.comment_count}</span>
                <Link
                  to="/u/$username"
                  params={{ username: p.author_username }}
                  className="text-neon"
                >
                  Profile
                </Link>
              </div>
            </Panel>
          ))}
        </div>
      </ConnectionGuard>
    </Screen>
  );
}
