import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { Notice, Panel, Screen } from "@/components/otk/shell";
import { useAuth } from "@/lib/auth";
import {
  COMMUNITY_TYPES,
  createCommunity,
  type CommunityPrivacy,
  type CommunityType,
} from "@/lib/communities";

export const Route = createFileRoute("/communities/create")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Create community — OTAKUVERSE" }],
  }),
  component: CreateCommunityPage,
});

function CreateCommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CommunityType>("anime");
  const [privacy, setPrivacy] = useState<CommunityPrivacy>("public");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("Log in to create a community.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await createCommunity({
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        privacy,
      });
      if (res.error || !res.slug) {
        setError(res.error ?? "Could not create community.");
        return;
      }
      void navigate({ to: "/communities/$slug", params: { slug: res.slug } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen eyebrow="CREATE" withNav>
      <section className="mt-8">
        <h1 className="font-display text-3xl font-bold">Create community</h1>
        <p className="mt-2 text-sm text-mist">You become the owner. Verification is admin-only.</p>
      </section>

      <ConnectionGuard>
        {!user ? (
          <Panel className="mt-6">
            <p className="text-sm text-mist">You need an account.</p>
            <Link to="/auth/login" className="mt-3 inline-block text-xs font-semibold text-neon">
              Log in
            </Link>
          </Panel>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
            {error ? <Notice>{error}</Notice> : null}

            <label className="block">
              <span className="text-xs text-mist">Name</span>
              <input
                required
                minLength={2}
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-2xl bg-panel2 px-4 py-3 text-sm ring-1 ring-line outline-none focus:ring-neon"
              />
            </label>

            <label className="block">
              <span className="text-xs text-mist">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                className="mt-1 w-full rounded-2xl bg-panel2 px-4 py-3 text-sm ring-1 ring-line outline-none focus:ring-neon"
              />
            </label>

            <label className="block">
              <span className="text-xs text-mist">Type</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CommunityType)}
                className="mt-1 w-full rounded-2xl bg-panel2 px-4 py-3 text-sm ring-1 ring-line outline-none"
              >
                {COMMUNITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-mist">Privacy</span>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as CommunityPrivacy)}
                className="mt-1 w-full rounded-2xl bg-panel2 px-4 py-3 text-sm ring-1 ring-line outline-none"
              >
                <option value="public">Public — anyone can join</option>
                <option value="restricted">Restricted — request to join</option>
                <option value="private">Private — request to join, limited discovery</option>
              </select>
            </label>

            <button
              type="submit"
              disabled={busy || name.trim().length < 2}
              className="w-full rounded-2xl bg-neon/20 py-3 font-display text-sm font-semibold text-neon ring-1 ring-neon/40 disabled:opacity-40"
            >
              {busy ? "Creating…" : "Create community"}
            </button>
          </form>
        )}
      </ConnectionGuard>
    </Screen>
  );
}
