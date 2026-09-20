import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { OtkButton } from "@/components/otk/button";
import { ConnectionGuard } from "@/components/otk/connection-guard";
import { TextField } from "@/components/otk/field";
import {
  Chip,
  Notice,
  Panel,
  Screen,
  Spinner,
  XPBar,
} from "@/components/otk/shell";
import avatarDefault from "@/assets/avatar-default.jpg";
import coverDefault from "@/assets/profile-cover.jpg";
import { ageFromDob } from "@/lib/age";
import { useAuth } from "@/lib/auth";
import {
  fetchMyProfile,
  levelProgress,
  updateMyProfile,
  type EditableProfileFields,
} from "@/lib/profile";
import type { Profile } from "@/types/database";

export const Route = createFileRoute("/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your profile — OTAKUVERSE" },
      { name: "description", content: "Your OTAKUVERSE identity and private profile." },
      { property: "og:title", content: "Your profile — OTAKUVERSE" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  const [draft, setDraft] = useState({
    display_name: "",
    bio: "",
    gender: "" as string,
    favorite_genres: "",
    favorite_anime: "",
    favorite_characters: "",
  });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const p = await fetchMyProfile();
      setProfile(p);
      if (p) {
        setDraft({
          display_name: p.display_name ?? "",
          bio: p.bio ?? "",
          gender: p.gender ?? "",
          favorite_genres: (p.favorite_genres ?? []).join(", "),
          favorite_anime: (p.favorite_anime ?? []).join(", "),
          favorite_characters: (p.favorite_characters ?? []).join(", "),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth/login", replace: true });
      return;
    }
    void load();
  }, [authLoading, user, navigate, load]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    setSaveError(null);
    setSaveOk(false);
    try {
      const split = (s: string) =>
        s
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

      const patch: EditableProfileFields = {
        display_name: draft.display_name.trim() || null,
        bio: draft.bio.trim() || null,
        gender: (draft.gender as Profile["gender"]) || null,
        favorite_genres: split(draft.favorite_genres),
        favorite_anime: split(draft.favorite_anime),
        favorite_characters: split(draft.favorite_characters),
      };
      await updateMyProfile(user.id, patch);
      setSaveOk(true);
      setEditing(false);
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function onSignOut() {
    await signOut();
    navigate({ to: "/", replace: true });
  }

  if (authLoading || loading) {
    return (
      <Screen eyebrow="PROFILE" withNav>
        <Spinner label="Loading your profile…" />
      </Screen>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !profile) {
    return (
      <Screen eyebrow="PROFILE" withNav>
        <Panel className="mt-9">
          <Notice>{error ?? "Profile not found yet. Try signing out and back in."}</Notice>
          <OtkButton type="button" size="block" className="mt-4" onClick={() => void load()}>
            Retry
          </OtkButton>
          <OtkButton
            type="button"
            variant="panel"
            size="block"
            className="mt-2"
            onClick={() => void onSignOut()}
          >
            Sign out
          </OtkButton>
        </Panel>
      </Screen>
    );
  }

  const progress = levelProgress(profile.xp, profile.level);
  const age = ageFromDob(profile.date_of_birth);
  const avatar = profile.avatar_url || avatarDefault;

  return (
    <Screen eyebrow="YOUR ID" withNav>
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
              <div className="mb-1 flex gap-2">
                <OtkButton
                  type="button"
                  variant="outlineNeon"
                  size="sm"
                  onClick={() => {
                    setEditing((v) => !v);
                    setSaveOk(false);
                    setSaveError(null);
                  }}
                >
                  {editing ? "Cancel" : "Edit"}
                </OtkButton>
              </div>
            </div>

            <div className="mt-3">
              <h1 className="font-display text-xl font-bold">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-sm text-neon">@{profile.username}</p>
              {profile.bio ? (
                <p className="mt-2 text-pretty text-sm text-mist">{profile.bio}</p>
              ) : (
                <p className="mt-2 text-sm text-mist">No bio yet.</p>
              )}
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
          </div>
        </div>

        {/* Private details — only visible to the owner */}
        <Panel className="mt-4">
          <p className="font-display text-xs font-semibold tracking-[0.2em] text-mist">
            PRIVATE DETAILS
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-mist">Email</dt>
              <dd className="text-right text-snow">{profile.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-mist">Phone</dt>
              <dd className="text-right text-snow">{profile.phone_e164 ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-mist">Date of birth</dt>
              <dd className="text-right text-snow">{profile.date_of_birth ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-mist">Age (derived)</dt>
              <dd className="text-right text-snow">{age ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-mist">Gender</dt>
              <dd className="text-right text-snow">
                {profile.gender === "prefer_not_to_say"
                  ? "Prefer not to say"
                  : profile.gender
                    ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
                    : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-mist">Country</dt>
              <dd className="text-right text-snow">{profile.country_code ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-mist">User ID</dt>
              <dd className="truncate text-right font-mono text-[11px] text-mist">
                {profile.id}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-[11px] text-mist">
            Email, phone, and exact DOB are never shown on public profiles.
          </p>
        </Panel>

        {editing ? (
          <form onSubmit={onSave} className="mt-4">
            <Panel>
              <p className="font-display text-xs font-semibold tracking-[0.2em] text-mist">
                EDIT PROFILE
              </p>
              <TextField
                label="Display name"
                value={draft.display_name}
                onChange={(e) => setDraft((d) => ({ ...d, display_name: e.target.value }))}
                placeholder="How you appear"
              />
              <TextField
                label="Bio"
                value={draft.bio}
                onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                placeholder="A short intro"
              />
              <label className="mt-4 block">
                <span className="font-display text-xs font-semibold text-mist">Gender</span>
                <select
                  className="mt-2 w-full rounded-2xl bg-panel2 px-4 py-3 text-sm text-snow ring-1 ring-line outline-none"
                  value={draft.gender}
                  onChange={(e) => setDraft((d) => ({ ...d, gender: e.target.value }))}
                >
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </label>
              <TextField
                label="Favorite genres (comma-separated)"
                value={draft.favorite_genres}
                onChange={(e) => setDraft((d) => ({ ...d, favorite_genres: e.target.value }))}
                placeholder="Isekai, Slice of Life"
              />
              <TextField
                label="Favorite anime (comma-separated)"
                value={draft.favorite_anime}
                onChange={(e) => setDraft((d) => ({ ...d, favorite_anime: e.target.value }))}
                placeholder="Cowboy Bebop, …"
              />
              <TextField
                label="Favorite characters (comma-separated)"
                value={draft.favorite_characters}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, favorite_characters: e.target.value }))
                }
                placeholder="Spike Spiegel, …"
              />
              {saveError ? <Notice>{saveError}</Notice> : null}
              {saveOk ? <Notice tone="success">Saved.</Notice> : null}
              <OtkButton type="submit" size="block" className="mt-5" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </OtkButton>
            </Panel>
          </form>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          <Link
            to="/u/$username"
            params={{ username: profile.username }}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-panel px-4 py-3 font-display text-sm font-semibold text-snow ring-1 ring-line"
          >
            View public profile
          </Link>
          <OtkButton type="button" variant="subtle" size="block" onClick={() => void onSignOut()}>
            Sign out
          </OtkButton>
        </div>
      </ConnectionGuard>
    </Screen>
  );
}
