import { createFileRoute, Link } from "@tanstack/react-router";

import { ConnectionGuard } from "@/components/otk/connection-guard";
import { Chip, GlowBackdrop, Logo, XPBar } from "@/components/otk/shell";
import { otkButtonVariants } from "@/components/otk/button";
import { useAuth } from "@/lib/auth";
import cover from "@/assets/profile-cover.jpg";
import avatar from "@/assets/avatar-default.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OTAKUVERSE — Pick a character" },
      {
        name: "description",
        content:
          "OTAKUVERSE is the global social home for anime and manga fans. Create your profile, level up, and find your people.",
      },
      { property: "og:title", content: "OTAKUVERSE — Pick a character" },
      {
        property: "og:description",
        content: "The social home for people who ship, tag and burn through volumes.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-snow">
      <GlowBackdrop />
      <div className="relative mx-auto max-w-[26.25rem] px-5 pt-6 pb-16">
        <header className="flex items-center justify-between">
          <Logo />
          <span className="font-display text-[10px] font-semibold tracking-[0.25em] text-mist">
            ID · 01 / 06
          </span>
        </header>

        <section className="mt-9">
          <h1 className="font-display text-6xl font-bold leading-none text-balance">
            Pick a
            <br />
            character.
          </h1>
          <p className="mt-4 text-pretty text-sm text-mist">
            The social home for people who ship, tag and burn through volumes.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex -space-x-3">
              <span className="grid size-8 place-items-center rounded-full border-2 border-ink bg-panel2 font-display text-[11px] font-semibold">
                K
              </span>
              <span className="grid size-8 place-items-center rounded-full border-2 border-ink bg-panel2 font-display text-[11px] font-semibold">
                M
              </span>
              <span className="grid size-8 place-items-center rounded-full border-2 border-ink bg-neon/20 font-display text-[11px] font-semibold text-neon">
                +
              </span>
            </div>
            <span className="text-xs text-mist">Your account, your permanent ID.</span>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {user && !loading ? (
            <Link to="/profile" className={otkButtonVariants({ variant: "neon", size: "lg" }) + " col-span-2"}>
              Go to your profile
            </Link>
          ) : (
            <>
              <Link to="/auth/signup" className={otkButtonVariants({ variant: "neon", size: "lg" })}>
                <span className="size-4 shrink-0 rounded-full border-2 border-ink/40" />
                Create profile
              </Link>
              <Link to="/auth/login" className={otkButtonVariants({ variant: "panel", size: "lg" })}>
                Sign in
              </Link>
            </>
          )}
        </div>

        <ConnectionGuard>
          <span className="sr-only">Connected</span>
        </ConnectionGuard>

        <div className="mt-9">
          <div className="flex items-center justify-between">
            <span className="font-display text-xs font-semibold tracking-[0.2em] text-mist">
              PROFILE CARD
            </span>
            <span className="size-3 rounded-full bg-neon shadow-[0_0_10px_color-mix(in_oklab,var(--neon)_70%,transparent)]" />
          </div>

          <div className="mt-3 overflow-hidden rounded-3xl bg-panel ring-1 ring-line">
            <img
              src={cover}
              alt=""
              width={1152}
              height={576}
              className="aspect-[16/7] w-full object-cover"
            />
            <div className="px-5 pb-5">
              <div className="-mt-9 flex items-end justify-between">
                <img
                  src={avatar}
                  alt=""
                  loading="lazy"
                  width={816}
                  height={816}
                  className="size-18 rounded-2xl object-cover ring-4 ring-panel"
                />
                <span className="mb-1 rounded-full bg-neon/15 px-4 py-2 font-display text-xs font-semibold text-neon ring-1 ring-neon/50">
                  Example
                </span>
              </div>

              <div className="mt-3">
                <h2 className="font-display text-xl font-bold">Kaito Morimoto</h2>
                <p className="text-sm text-neon">@kaito</p>
                <p className="mt-2 text-pretty text-sm text-mist">
                  Weekend speedrunner of long sagas. Collector of holo cards and rainy-day manga.
                </p>
              </div>

              <div className="mt-4">
                <XPBar into={340} span={750} level={12} />
              </div>

              <div className="mt-4 flex gap-6">
                {[
                  ["1,204", "Followers"],
                  ["318", "Following"],
                  ["47", "Badges"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <p className="font-display text-base font-bold">{value}</p>
                    <p className="text-[11px] text-mist">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Chip>Cyberpunk</Chip>
                <Chip>Isekai</Chip>
                <Chip>Slice of Life</Chip>
                <Chip active>Action</Chip>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-mist">
            Sample card — real cards are built from your own profile.
          </p>
        </div>
      </div>
    </div>
  );
}
