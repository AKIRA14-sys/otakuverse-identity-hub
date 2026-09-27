import { useState } from "react";

export interface BadgeItem {
  code: string;
  name: string;
  description: string;
  icon: string;
  unlocked?: boolean;
}

const DEFAULT_BADGES: BadgeItem[] = [
  {
    code: "pioneer",
    name: "Pioneer",
    description: "Joined during the early phase of OTAKUVERSE.",
    icon: "⚡",
    unlocked: true,
  },
  {
    code: "speedrunner",
    name: "Speedrunner",
    description: "Logged over 50 completed series on their watchlist.",
    icon: "🏃",
    unlocked: false,
  },
  {
    code: "socialite",
    name: "Socialite",
    description: "Connected with 10+ followers in the verse.",
    icon: "🌐",
    unlocked: true,
  },
  {
    code: "globe_trotter",
    name: "Globe Trotter",
    description: "Explored geography across continents.",
    icon: "🗺️",
    unlocked: true,
  },
  {
    code: "community_hero",
    name: "Community Hero",
    description: "Active contributor in multiple communities.",
    icon: "🏆",
    unlocked: false,
  },
];

export function BadgesShowcase({ badges = DEFAULT_BADGES }: { badges?: BadgeItem[] }) {
  const [open, setOpen] = useState(false);

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl bg-panel2 px-4 py-2.5 text-xs font-semibold text-snow ring-1 ring-line hover:ring-neon"
      >
        <span>🏆 Badges & Achievements</span>
        <span className="rounded-full bg-neon/20 px-2 py-0.5 font-mono text-[10px] text-neon">
          {unlockedCount}/{badges.length}
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-panel p-6 ring-1 ring-line shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-snow">Badges & Achievements</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="size-8 rounded-full bg-panel2 font-bold text-mist hover:text-snow"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
              {badges.map((b) => (
                <div
                  key={b.code}
                  className={`flex items-center gap-3 rounded-2xl p-3 ring-1 transition-all ${
                    b.unlocked
                      ? "bg-panel2 text-snow ring-neon/40 shadow-[0_0_12px_color-mix(in_oklab,var(--neon)_15%,transparent)]"
                      : "bg-panel2/40 text-mist/60 ring-line/50 grayscale"
                  }`}
                >
                  <span className="text-2xl">{b.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-sm font-semibold">{b.name}</p>
                      <span className="text-[10px] uppercase tracking-wider font-semibold">
                        {b.unlocked ? "Unlocked" : "Locked"}
                      </span>
                    </div>
                    <p className="text-xs opacity-80">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
