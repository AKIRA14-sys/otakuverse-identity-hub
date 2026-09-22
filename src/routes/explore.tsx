import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { Panel, Screen, Spinner } from "@/components/otk/shell";
import { searchUsers, type SocialUser } from "@/lib/social";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/explore")({
  ssr: false,
  head: () => ({ meta: [{ title: "Explore — OTAKUVERSE" }] }),
  component: ExplorePage,
});

function ExplorePage() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || q.trim().length < 2) {
      setUsers([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      searchUsers(q)
        .then(setUsers)
        .catch(() => setUsers([]))
        .finally(() => setLoading(false));
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <Screen eyebrow="EXPLORE" withNav>
      <section className="mt-8">
        <h1 className="font-display text-3xl font-bold">Explore</h1>
        <p className="mt-2 text-sm text-mist">Find people, places, and communities.</p>
      </section>

      <ConnectionGuard>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/world"
            className="rounded-full bg-panel2 px-3 py-2 text-xs font-semibold text-neon ring-1 ring-line"
          >
            World
          </Link>
          <Link
            to="/communities"
            className="rounded-full bg-panel2 px-3 py-2 text-xs font-semibold text-neon ring-1 ring-line"
          >
            Communities
          </Link>
          <Link
            to="/societies"
            className="rounded-full bg-panel2 px-3 py-2 text-xs font-semibold text-neon ring-1 ring-line"
          >
            Societies
          </Link>
          <Link
            to="/clans"
            className="rounded-full bg-panel2 px-3 py-2 text-xs font-semibold text-neon ring-1 ring-line"
          >
            Clans
          </Link>
        </div>

        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search users…"
          className="mt-5 w-full rounded-2xl bg-panel2 px-4 py-3 text-sm ring-1 ring-line outline-none focus:ring-neon"
        />

        {loading ? <Spinner label="Searching…" /> : null}

        <div className="mt-4 space-y-2">
          {users.map((u) => (
            <Link
              key={u.id}
              to="/u/$username"
              params={{ username: u.username }}
              className="block rounded-2xl bg-panel2 px-4 py-3 ring-1 ring-line"
            >
              <p className="font-display text-sm font-semibold text-snow">
                {u.display_name || u.username}
              </p>
              <p className="text-[11px] text-mist">
                @{u.username}
                {u.follower_count != null ? ` · ${u.follower_count} followers` : ""}
              </p>
            </Link>
          ))}
          {q.trim().length >= 2 && !loading && users.length === 0 ? (
            <Panel>
              <p className="text-sm text-mist">No users found.</p>
            </Panel>
          ) : null}
        </div>
      </ConnectionGuard>
    </Screen>
  );
}
