import { Link } from "@tanstack/react-router";

import avatarDefault from "@/assets/avatar-default.jpg";
import { cn } from "@/lib/utils";

export function Avatar({
  src,
  alt = "",
  size = 40,
  className,
}: {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={src || avatarDefault}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("shrink-0 rounded-2xl object-cover ring-1 ring-line", className)}
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
        <p className="truncate text-xs text-mist">
          {subtitle ?? (username ? `@${username}` : "")}
        </p>
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
