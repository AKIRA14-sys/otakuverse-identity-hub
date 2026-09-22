import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { Notice, Panel, Screen, Spinner } from "@/components/otk/shell";
import { useAuth } from "@/lib/auth";
import {
  getNotifications,
  markNotificationsRead,
  timeAgo,
  type NotificationRow,
} from "@/lib/social";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/notifications")({
  ssr: false,
  head: () => ({ meta: [{ title: "Notifications — OTAKUVERSE" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getNotifications();
      setItems(list);
      await markNotificationsRead();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen eyebrow="ALERTS" withNav>
      <section className="mt-8">
        <h1 className="font-display text-3xl font-bold">Notifications</h1>
      </section>

      <ConnectionGuard>
        {!user ? (
          <Panel className="mt-6">
            <p className="text-sm text-mist">
              <Link to="/auth/login" className="font-semibold text-neon">
                Log in
              </Link>{" "}
              to see alerts.
            </p>
          </Panel>
        ) : null}
        {error ? <Notice>{error}</Notice> : null}
        {loading ? <Spinner /> : null}
        {!loading && user && items.length === 0 ? (
          <Panel className="mt-4">
            <p className="text-sm text-mist">No notifications yet.</p>
          </Panel>
        ) : null}
        <div className="mt-4 space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl px-4 py-3 ring-1 ring-line ${
                n.is_read ? "bg-panel2" : "bg-neon/10"
              }`}
            >
              <p className="text-sm text-snow">
                <span className="font-semibold capitalize">{n.type.replace(/_/g, " ")}</span>
                {n.body ? ` — ${n.body}` : ""}
              </p>
              <p className="mt-1 text-[11px] text-mist">{timeAgo(n.created_at)}</p>
            </div>
          ))}
        </div>
      </ConnectionGuard>
    </Screen>
  );
}
