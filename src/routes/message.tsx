import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { Notice, Panel, Screen, Spinner } from "@/components/otk/shell";
import { useAuth } from "@/lib/auth";
import { listConversations, timeAgo, type ConversationRow } from "@/lib/social";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/messages")({
  ssr: false,
  head: () => ({ meta: [{ title: "Messages — OTAKUVERSE" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(await listConversations());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load messages.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen eyebrow="MESSAGES" withNav>
      <section className="mt-8">
        <h1 className="font-display text-3xl font-bold">Messages</h1>
        <p className="mt-2 text-sm text-mist">Private 1-to-1 chats.</p>
      </section>

      <ConnectionGuard>
        {!user ? (
          <Panel className="mt-6">
            <p className="text-sm text-mist">
              <Link to="/auth/login" className="font-semibold text-neon">
                Log in
              </Link>{" "}
              to view messages.
            </p>
          </Panel>
        ) : null}

        {error ? <Notice>{error}</Notice> : null}
        {loading ? <Spinner label="Loading…" /> : null}

        {!loading && user && rows.length === 0 ? (
          <Panel className="mt-4">
            <p className="text-sm text-mist">
              No conversations yet. Open a profile and start a chat.
            </p>
          </Panel>
        ) : null}

        <div className="mt-4 space-y-2">
          {rows.map((r) => (
            <Link
              key={r.conversation_id}
              to="/messages/$conversationId"
              params={{ conversationId: r.conversation_id }}
              className="block rounded-2xl bg-panel2 px-4 py-3 ring-1 ring-line"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-sm font-semibold text-snow">
                  {r.other_display_name || r.other_username}
                  {r.unread ? <span className="ml-2 text-[10px] text-neon">●</span> : null}
                </p>
                <span className="text-[11px] text-mist">
                  {r.last_at ? timeAgo(r.last_at) : ""}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-mist">{r.last_body ?? "—"}</p>
            </Link>
          ))}
        </div>
      </ConnectionGuard>
    </Screen>
  );
}
