import { useRef, useState } from "react";
import { OtkButton } from "@/components/otk/button";

export function CardExporter({
  username,
  displayName,
  level,
  xp,
  country,
  title = "Isekai Veteran",
}: {
  username: string;
  displayName?: string | null;
  level: number;
  xp: number;
  country?: string | null;
  title?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"neon" | "cyber" | "ink">("neon");

  const bgStyles = {
    neon: "from-panel via-panel2 to-neon/20 border-neon/50 text-snow",
    cyber: "from-purple-900/80 via-black to-cyan-900/60 border-cyan-400/50 text-cyan-100",
    ink: "from-neutral-900 via-stone-900 to-amber-950/40 border-amber-500/40 text-amber-100",
  };

  return (
    <div className="rounded-3xl bg-panel2 p-5 ring-1 ring-line">
      <div className="flex items-center justify-between">
        <p className="font-display text-xs font-semibold tracking-[0.2em] text-mist">
          CHARACTER ID CARD GENERATOR
        </p>
        <div className="flex gap-2">
          {(["neon", "cyber", "ink"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`rounded-full px-3 py-1 text-[10px] font-semibold capitalize ring-1 ${
                theme === t ? "bg-neon/20 text-neon ring-neon/40" : "bg-panel text-mist ring-line"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={cardRef}
        className={`mt-4 relative overflow-hidden rounded-2xl bg-gradient-to-br border-2 p-5 shadow-2xl transition-all ${bgStyles[theme]}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="font-display text-[10px] font-semibold tracking-[0.25em] opacity-70">
              OTAKUVERSE // ID CARD
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold">{displayName || username}</h2>
            <p className="font-mono text-xs opacity-80">@{username}</p>
          </div>
          <span className="rounded-full bg-black/40 px-3 py-1 font-display text-xs font-bold ring-1 ring-white/20">
            LVL {level}
          </span>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
          <div>
            <p className="text-[10px] uppercase opacity-60">Title</p>
            <p className="font-semibold">{title}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase opacity-60">Region</p>
            <p className="font-semibold">{country || "GLOBAL"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase opacity-60">Total XP</p>
            <p className="font-mono font-bold">{xp.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-mist">
        Custom character ID card ready for sharing across social platforms.
      </p>
    </div>
  );
}
