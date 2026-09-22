import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { Notice, Panel, Screen } from "@/components/otk/shell";
import { useAuth } from "@/lib/auth";
import { createPost, type PostVisibility } from "@/lib/social";

export const Route = createFileRoute("/create")({
  ssr: false,
  head: () => ({ meta: [{ title: "Create — OTAKUVERSE" }] }),
  component: CreatePage,
});

function CreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("Log in to post.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await createPost({ body: body.trim(), visibility });
      if (res.error) setError(res.error);
      else void navigate({ to: "/feed" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen eyebrow="CREATE" withNav>
      <section className="mt-8">
        <h1 className="font-display text-3xl font-bold">Create post</h1>
        <p className="mt-2 text-sm text-mist">Share with the OTAKUVERSE.</p>
      </section>

      <ConnectionGuard>
        {!user ? (
          <Panel className="mt-6">
            <Link to="/auth/login" className="text-sm font-semibold text-neon">
              Log in to create
            </Link>
          </Panel>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
            {error ? <Notice>{error}</Notice> : null}
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={5000}
              placeholder="What's on your mind?"
              className="w-full rounded-2xl bg-panel2 px-4 py-3 text-sm ring-1 ring-line outline-none focus:ring-neon"
            />
            <label className="block text-xs text-mist">
              Visibility
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as PostVisibility)}
                className="mt-1 w-full rounded-2xl bg-panel2 px-4 py-3 text-sm ring-1 ring-line"
              >
                <option value="public">Public</option>
                <option value="followers">Followers</option>
                <option value="friends">Friends</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={busy || !body.trim()}
              className="w-full rounded-2xl bg-neon/20 py-3 font-display text-sm font-semibold text-neon ring-1 ring-neon/40 disabled:opacity-40"
            >
              {busy ? "Posting…" : "Publish"}
            </button>
            <p className="text-center text-[11px] text-mist">
              <Link to="/communities/create" className="text-neon">
                Create a community instead
              </Link>
            </p>
          </form>
        )}
      </ConnectionGuard>
    </Screen>
  );
}
