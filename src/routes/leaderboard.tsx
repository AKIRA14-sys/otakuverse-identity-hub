import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { UserIdentity } from "@/components/otk/avatar";
import { Panel, Screen, Spinner } from "@/components/otk/shell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/leaderboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Leaderboards — OTAKUVERSE" }] }),
  component: LeaderboardPage,
});

interface LeaderboardUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_frame?: string | null;
  country_code: string | null;
  xp: number;
  level: number;
  reputation: number;
}

function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_global_leaderboard", {
          result_limit: 50,
        });
        if (!error && data) {
          setUsers(data as LeaderboardUser[]);
        }
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <Screen eyebrow="LEADERBOARD" withNav>
      <section className="mt-8">
        <h1 className="font-display text-3xl font-bold">Global Leaderboard</h1>
        <p className="mt-2 text-sm text-mist">Top otaku power levels in the verse.</p>
      </section>

      <ConnectionGuard>
        {loading ? <Spinner label="Loading rankings…" /> : null}

        {!loading && users.length === 0 ? (
          <Panel className="mt-6">
            <p className="text-sm text-mist">
              No ranked users yet. Apply migration `20260321000000_unfinished_and_cool_features.sql`
              to enable.
            </p>
          </Panel>
        ) : null}

        <div className="mt-6 space-y-2">
          {users.map((u, i) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-2xl bg-panel2 p-3.5 ring-1 ring-line"
            >
              <span
                className={`font-mono text-sm font-bold ${
                  i === 0
                    ? "text-amber-400"
                    : i === 1
                      ? "text-slate-300"
                      : i === 2
                        ? "text-amber-600"
                        : "text-mist"
                }`}
              >
                #{i + 1}
              </span>
              <UserIdentity
                username={u.username}
                displayName={u.display_name}
                avatarUrl={u.avatar_url}
                subtitle={`LVL ${u.level} · ${u.xp.toLocaleString()} XP`}
              />
              {u.country_code ? (
                <span className="rounded-full bg-panel px-2.5 py-1 text-[10px] font-semibold text-mist ring-1 ring-line">
                  {u.country_code}
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <Link to="/explore" className="mt-6 inline-block text-xs font-semibold text-neon">
          ← Back to Explore
        </Link>
      </ConnectionGuard>
    </Screen>
  );
}
