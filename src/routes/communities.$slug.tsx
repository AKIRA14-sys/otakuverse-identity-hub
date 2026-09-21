import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { Chip, Notice, Panel, Screen, Spinner } from "@/components/otk/shell";
import { useAuth } from "@/lib/auth";
import {
  createCommunityPost,
  fetchCommunityBySlug,
  fetchMyMembership,
  formatMembers,
  joinCommunity,
  leaveCommunity,
  listCommunityMembers,
  listCommunityPosts,
  type Community,
  type CommunityMember,
  type CommunityPost,
  type MembershipInfo,
} from "@/lib/communities";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/communities/$slug")({
  ssr: false,
  head: ({ params }) => ({
    meta: [{ title: `${params.slug} — Community` }],
  }),
  component: CommunityDetailPage,
});

type Tab = "overview" | "posts" | "members" | "about";

function CommunityDetailPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [postBody, setPostBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const c = await fetchCommunityBySlug(slug);
      setCommunity(c);
      if (c) {
        const [p, m] = await Promise.all([
          listCommunityPosts(c.id, 20),
          listCommunityMembers(c.id, 40),
        ]);
        setPosts(p);
        setMembers(m);
        if (user) {
          const mem = await fetchMyMembership(c.id);
          setMembership(mem);
        } else {
          setMembership(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load community.");
    } finally {
      setLoading(false);
    }
  }, [slug, user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onJoin() {
    if (!community || !user) return;
    setActionBusy(true);
    setNotice(null);
    try {
      const res = await joinCommunity(community.id);
      if (res.error) setNotice(res.error);
      else setNotice(res.status === "pending" ? "Join request sent." : "Joined!");
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Join failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function onLeave() {
    if (!community || !user) return;
    setActionBusy(true);
    setNotice(null);
    try {
      const res = await leaveCommunity(community.id);
      if (res.error) setNotice(res.error);
      else setNotice("Left community.");
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Leave failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function onPost() {
    if (!community || !postBody.trim()) return;
    setActionBusy(true);
    setNotice(null);
    try {
      const res = await createCommunityPost(community.id, postBody.trim());
      if (res.error) setNotice(res.error);
      else {
        setPostBody("");
        const p = await listCommunityPosts(community.id, 20);
        setPosts(p);
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Post failed.");
    } finally {
      setActionBusy(false);
    }
  }

  const isActiveMember = membership?.status === "active";

  return (
    <Screen eyebrow="COMMUNITY" withNav>
      <ConnectionGuard>
        {loading ? <Spinner label="Loading community…" /> : null}
        {error ? <Notice>{error}</Notice> : null}
        {!loading && !community && !error ? (
          <Panel className="mt-8">
            <p className="text-sm text-mist">Community not found or private.</p>
            <Link to="/communities" className="mt-3 inline-block text-xs font-semibold text-neon">
              ← Back to communities
            </Link>
          </Panel>
        ) : null}

        {community ? (
          <>
            <div className="mt-6 overflow-hidden rounded-3xl bg-panel ring-1 ring-line">
              <div className="h-24 bg-gradient-to-br from-neon/20 to-panel2" />
              <div className="px-4 pb-4">
                <div className="-mt-8 flex size-16 items-center justify-center rounded-2xl bg-panel text-2xl ring-2 ring-ink">
                  {community.avatar_url ? (
                    <img
                      src={community.avatar_url}
                      alt=""
                      className="size-16 rounded-2xl object-cover"
                    />
                  ) : (
                    "⚡"
                  )}
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <h1 className="font-display text-2xl font-bold">
                      {community.name}
                      {community.verification === "verified" ? (
                        <span className="ml-2 text-sm text-neon">Verified</span>
                      ) : null}
                    </h1>
                    <p className="mt-1 text-xs text-mist">
                      {community.type} · {formatMembers(community.member_count)} members ·{" "}
                      {community.privacy}
                    </p>
                  </div>
                </div>
                {community.description ? (
                  <p className="mt-3 text-sm text-mist">{community.description}</p>
                ) : null}

                <div className="mt-4">
                  {!user ? (
                    <Link
                      to="/auth/login"
                      className="inline-block rounded-full bg-neon/15 px-4 py-2 text-xs font-semibold text-neon ring-1 ring-neon/40"
                    >
                      Log in to join
                    </Link>
                  ) : isActiveMember ? (
                    <button
                      type="button"
                      disabled={actionBusy || membership?.role === "owner"}
                      onClick={() => void onLeave()}
                      className="rounded-full bg-panel2 px-4 py-2 text-xs font-semibold text-mist ring-1 ring-line disabled:opacity-40"
                    >
                      {membership?.role === "owner" ? "Owner" : "Leave"}
                    </button>
                  ) : membership?.status === "pending" ? (
                    <span className="text-xs text-mist">Join request pending</span>
                  ) : (
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => void onJoin()}
                      className="rounded-full bg-neon/15 px-4 py-2 text-xs font-semibold text-neon ring-1 ring-neon/40 disabled:opacity-40"
                    >
                      {community.privacy === "public" ? "Join" : "Request to join"}
                    </button>
                  )}
                </div>
                {notice ? <p className="mt-2 text-xs text-mist">{notice}</p> : null}
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto">
              {(["overview", "posts", "members", "about"] as Tab[]).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)}>
                  <Chip active={tab === t}>{t}</Chip>
                </button>
              ))}
            </div>

            {tab === "overview" || tab === "posts" ? (
              <div className="mt-4 space-y-3">
                {isActiveMember ? (
                  <Panel>
                    <textarea
                      value={postBody}
                      onChange={(e) => setPostBody(e.target.value)}
                      rows={3}
                      placeholder="Share something with the community…"
                      className="w-full resize-none rounded-xl bg-panel2 px-3 py-2 text-sm text-snow ring-1 ring-line outline-none focus:ring-neon"
                    />
                    <button
                      type="button"
                      disabled={actionBusy || !postBody.trim()}
                      onClick={() => void onPost()}
                      className="mt-2 rounded-full bg-neon/15 px-4 py-2 text-xs font-semibold text-neon ring-1 ring-neon/40 disabled:opacity-40"
                    >
                      Post
                    </button>
                  </Panel>
                ) : null}
                {posts.length === 0 ? (
                  <Panel>
                    <p className="text-sm text-mist">No posts yet.</p>
                  </Panel>
                ) : (
                  posts.map((p) => (
                    <Panel key={p.id}>
                      <p className="whitespace-pre-wrap text-sm text-snow">{p.body}</p>
                      <p className="mt-2 text-[11px] text-mist">
                        {new Date(p.created_at).toLocaleString()} · {p.reaction_count} reactions ·{" "}
                        {p.comment_count} comments
                      </p>
                    </Panel>
                  ))
                )}
              </div>
            ) : null}

            {tab === "members" ? (
              <div className="mt-4 space-y-2">
                {members.length === 0 ? (
                  <Panel>
                    <p className="text-sm text-mist">No members to show.</p>
                  </Panel>
                ) : (
                  members.map((m) => (
                    <Link
                      key={m.user_id}
                      to="/u/$username"
                      params={{ username: m.username }}
                      className="flex items-center justify-between rounded-2xl bg-panel2 px-4 py-3 ring-1 ring-line"
                    >
                      <span className="text-sm text-snow">
                        {m.display_name || m.username}
                        <span className="ml-2 text-[11px] text-mist">@{m.username}</span>
                      </span>
                      <span className="text-[11px] text-mist">{m.role}</span>
                    </Link>
                  ))
                )}
              </div>
            ) : null}

            {tab === "about" ? (
              <Panel className="mt-4">
                <p className="text-xs text-mist">Slug: {community.slug}</p>
                <p className="mt-1 text-xs text-mist">Type: {community.type}</p>
                <p className="mt-1 text-xs text-mist">Privacy: {community.privacy}</p>
                {community.country_code ? (
                  <p className="mt-1 text-xs text-mist">Country: {community.country_code}</p>
                ) : null}
                <p className="mt-1 text-xs text-mist">
                  Created: {new Date(community.created_at).toLocaleDateString()}
                </p>
                <p className="mt-3 text-[11px] text-mist">
                  Chat rooms, events, and voice rooms are prepared in the database. Live voice needs
                  a provider later — not enabled yet.
                </p>
              </Panel>
            ) : null}

            <Link
              to="/communities"
              className="mt-6 inline-block text-xs font-semibold text-neon"
            >
              ← All communities
            </Link>
          </>
        ) : null}
      </ConnectionGuard>
    </Screen>
  );
}
