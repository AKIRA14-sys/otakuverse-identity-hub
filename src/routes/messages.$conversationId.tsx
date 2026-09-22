import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { Notice, Panel, Screen, Spinner } from "@/components/otk/shell";
import { useAuth } from "@/lib/auth";
import {
  listDmMessages,
  markDmRead,
  sendDm,
  timeAgo,
  type DmMessage,
} from "@/lib/social";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/messages/$conversationId")({
  ssr: false,
  component: ConversationPage,
});

function ConversationPage() {
  const { conversationId } = Route.useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setMessages(await listDmMessages(conversationId));
      await markDmRead(conversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load chat.");
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSend() {
    if (!body.trim()) return;
    setBusy(true);
    try {
      const res = await sendDm(conversationId, body.trim());
      if (res.error) setError(res.error);
      else {
        setBody("");
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen eyebrow="CHAT" withNav>
      <div className="mt-6 flex items-center justify-between">
        <Link to="/messages" className="text-xs font-semibold text-neon">
          ← Messages
        </Link>
      </div>

      <ConnectionGuard>
        {error ? <Notice>{error}</Notice> : null}
        {loading ? <Spinner /> : null}

        <div className="mt-4 space-y-2 pb-4">
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? "ml-auto bg-neon/20 text-snow" : "bg-panel2 text-snow ring-1 ring-line"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.is_deleted ? "Message deleted" : m.body}</p>
                <p className="mt-1 text-[10px] text-mist">{timeAgo(m.created_at)}</p>
              </div>
            );
          })}
          {!loading && messages.length === 0 ? (
            <Panel>
              <p className="text-sm text-mist">No messages yet. Say hi.</p>
            </Panel>
          ) : null}
        </div>

        {user ? (
          <div className="sticky bottom-24 flex gap-2">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Message…"
              className="flex-1 rounded-2xl bg-panel2 px-4 py-3 text-sm ring-1 ring-line outline-none focus:ring-neon"
              onKeyDown={(e) => {
                if (e.key === "Enter") void onSend();
              }}
            />
            <button
              type="button"
              disabled={busy || !body.trim()}
              onClick={() => void onSend()}
              className="rounded-2xl bg-neon/20 px-4 py-3 text-xs font-semibold text-neon ring-1 ring-neon/40 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        ) : null}
      </ConnectionGuard>
    </Screen>
  );
}
