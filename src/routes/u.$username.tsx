import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { Chip, Notice, Panel, Screen, Spinner, XPBar } from "@/components/otk/shell";
import avatarDefault from "@/assets/avatar-default.jpg";
import coverDefault from "@/assets/profile-cover.jpg";
import { fetchPublicProfile, levelProgress } from "@/lib/profile";
import type { PublicProfile } from "@/types/database";

export const Route = createFileRoute("/u/$username")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — OTAKUVERSE` },
      {
        name: "description",
        content: `Public profile for @${params.username} on OTAKUVERSE.`,
      },
      { property: "og:title", content: `@${params.username} — OTAKUVERSE` },
    ],
  }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { username } = Route.useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPublicProfile(username)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load profile.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <Screen eyebrow="PUBLIC">
        <Spinner label="Loading profile…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen eyebrow="PUBLIC">
        <Panel className="mt-9">
          <Notice>{error}</Notice>
          <Link
            to="/"
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-neon px-4 py-3 font-display text-sm font-semibold text-ink"
          >
            Go home
          </Link>
        </Panel>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen eyebrow="PUBLIC">
        <Panel className="mt-9">
          <Notice tone="info">No public profile found for @{username}.</Notice>
          <Link
            to="/"
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-neon px-4 py-3 font-display text-sm font-semibold text-ink"
          >
            Go home
          </Link>
        </Panel>
      </Screen>
    );
  }

  const progress = levelProgress(profile.xp, profile.level);
  const avatar = profile.avatar_url || avatarDefault;

  return (
    <Screen eyebrow="PUBLIC">
      <ConnectionGuard>
        <div className="mt-6 overflow-hidden rounded-3xl bg-panel ring-1 ring-line">
          <img
            src={coverDefault}
            alt=""
            className="aspect-[16/7] w-full object-cover"
            width={1152}
            height={576}
          />
          <div className="px-5 pb-5">
            <div className="-mt-9 flex items-end justify-between">
              <img
                src={avatar}
                alt=""
                className="size-18 rounded-2xl object-cover ring-4 ring-panel"
                width={72}
                height={72}
              />
              {profile.age != null ? (
                <span className="mb-1 rounded-full bg-panel2 px-3 py-1.5 text-xs text-mist ring-1 ring-line">
                  {profile.age}
                </span>
              ) : null}
            </div>

            <div className="mt-3">
              <h1 className="font-display text-xl font-bold">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-sm text-neon">@{profile.username}</p>
              {profile.bio ? (
                <p className="mt-2 text-pretty text-sm text-mist">{profile.bio}</p>
              ) : null}
            </div>

            <div className="mt-4">
              <XPBar into={progress.into} span={progress.span} level={profile.level} />
            </div>

            <div className="mt-4 flex gap-6">
              {[
                [profile.follower_count.toLocaleString(), "Followers"],
                [profile.following_count.toLocaleString(), "Following"],
                [String(profile.reputation), "Rep"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="font-display text-base font-bold">{value}</p>
                  <p className="text-[11px] text-mist">{label}</p>
                </div>
              ))}
            </div>

            {(profile.favorite_genres?.length ?? 0) > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.favorite_genres.map((g) => (
                  <Chip key={g} active>
                    {g}
                  </Chip>
                ))}
              </div>
            ) : null}

            {(profile.favorite_anime?.length ?? 0) > 0 ? (
              <div className="mt-4">
                <p className="font-display text-[11px] font-semibold tracking-[0.15em] text-mist">
                  FAVORITE ANIME
                </p>
                <p className="mt-1 text-sm text-snow">{profile.favorite_anime.join(" · ")}</p>
              </div>
            ) : null}

            {(profile.favorite_characters?.length ?? 0) > 0 ? (
              <div className="mt-3">
                <p className="font-display text-[11px] font-semibold tracking-[0.15em] text-mist">
                  FAVORITE CHARACTERS
                </p>
                <p className="mt-1 text-sm text-snow">
                  {profile.favorite_characters.join(" · ")}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-mist">
          Public view — email, phone, and exact date of birth are never shown here.
        </p>

        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-mist hover:text-snow">
            Back home
          </Link>
        </div>
      </ConnectionGuard>
    </Screen>
  );
}
