import { Link } from "@tanstack/react-router";

import avatarDefault from "@/assets/avatar-default.jpg";
import { cn } from "@/lib/utils";

export type AvatarFrameStyle = "none" | "neon_glow" | "cyber_ring" | "gold_aura";

const FRAME_CLASSES: Record<AvatarFrameStyle, string> = {
  none: "ring-1 ring-line",
  neon_glow: "ring-2 ring-neon shadow-[0_0_12px_color-mix(in_oklab,var(--neon)_60%,transparent)]",
  cyber_ring: "ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]",
  gold_aura: "ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]",
};

export function Avatar({
  src,
  alt = "",
  size = 40,
  frame = "none",
  className,
}: {
  src?: string | null;
  alt?: string;
  size?: number;
  frame?: AvatarFrameStyle | string | null;
  className?: string;
}) {
  const frameClass = FRAME_CLASSES[(frame as AvatarFrameStyle) || "none"] ?? FRAME_CLASSES.none;

  return (
    <img
      src={src || avatarDefault}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("shrink-0 rounded-2xl object-cover transition-all", frameClass, className)}
    />
  );
}

export function UserIdentity({
  username,
  displayName,
  avatarUrl,
  subtitle,
  size = 40,
  link = true,
}: {
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  subtitle?: string | null;
  size?: number;
  link?: boolean;
}) {
  const body = (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar src={avatarUrl} size={size} />
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-semibold text-snow">
          {displayName || (username ? `@${username}` : "Unknown")}
        </p>
        <p className="truncate text-xs text-mist">{subtitle ?? (username ? `@${username}` : "")}</p>
      </div>
    </div>
  );

  if (link && username) {
    return (
      <Link to="/u/$username" params={{ username }} className="min-w-0 flex-1">
        {body}
      </Link>
    );
  }
  return <div className="min-w-0 flex-1">{body}</div>;
}
