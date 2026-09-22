import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-lg font-bold tracking-tight text-snow", className)}>
      OTAKU<span className="text-neon">VERSE</span>
    </span>
  );
}

export function GlowBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full"
      style={{
        background:
          "radial-gradient(circle, color-mix(in oklab, var(--neon) 22%, transparent), transparent 70%)",
      }}
    />
  );
}

export function Screen({
  children,
  eyebrow,
  withNav = false,
}: {
  children: ReactNode;
  eyebrow?: string;
  withNav?: boolean;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-snow">
      <GlowBackdrop />
      <div className={cn("relative mx-auto max-w-[26.25rem] px-5 pt-6", withNav ? "pb-28" : "pb-12")}>
        <header className="flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          {eyebrow ? (
            <span className="font-display text-[10px] font-semibold tracking-[0.25em] text-mist">
              {eyebrow}
            </span>
          ) : null}
        </header>
        {children}
      </div>
      {withNav ? <BottomNav /> : null}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("panel-card p-5", className)}>{children}</div>;
}

export function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-1 flex-1 rounded-full bg-line">
        <div
          className="h-1 rounded-full bg-neon transition-all duration-500"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
      <span className="font-display text-xs font-semibold text-neon">
        Step {step} of {total}
      </span>
    </div>
  );
}

export function XPBar({ into, span, level }: { into: number; span: number; level: number }) {
  const pct = Math.min(100, Math.max(0, (into / Math.max(1, span)) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-display font-semibold text-snow">LV. {level}</span>
        <span className="text-mist">
          {into.toLocaleString()} / {span.toLocaleString()} XP
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-panel2">
        <div
          className="xp-fill h-full origin-left rounded-full"
          style={{ width: `${pct}%`, backgroundImage: "var(--gradient-xp)" }}
        />
      </div>
    </div>
  );
}

export function Chip({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium",
        active
          ? "bg-neon/15 text-neon ring-1 ring-neon/40"
          : "bg-panel2 text-snow ring-1 ring-line",
      )}
    >
      {children}
    </span>
  );
}

export function Notice({
  tone = "error",
  children,
}: {
  tone?: "error" | "info" | "success";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-4 rounded-2xl px-4 py-3 text-xs leading-relaxed ring-1",
        tone === "error" && "bg-ember/10 text-ember ring-ember/30",
        tone === "info" && "bg-panel2 text-mist ring-line",
        tone === "success" && "bg-neon/10 text-neon ring-neon/30",
      )}
    >
      {children}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-xs text-mist">
      <span className="size-4 animate-spin rounded-full border-2 border-line border-t-neon" />
      {label ?? "Loading…"}
    </div>
  );
}

export function BottomNav() {
  const item =
    "flex flex-col items-center gap-1 rounded-2xl px-2.5 py-2 text-mist sm:px-3";
  const active = "bg-neon/15 text-neon ring-1 ring-neon/40";
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10">
      <div className="mx-auto max-w-[26.25rem] px-3 pb-5 sm:px-5">
        <div className="flex items-center justify-between rounded-3xl bg-panel/90 px-1.5 py-2 ring-1 ring-line shadow-[0_-8px_30px_rgba(0,0,0,0.4)] backdrop-blur sm:px-2">
          <Link to="/feed" className={item} activeProps={{ className: active }}>
            <span className="size-4 shrink-0 rounded-md border-2 border-current" />
            <span className="font-display text-[9px] font-semibold sm:text-[10px]">Home</span>
          </Link>
          <Link to="/explore" className={item} activeProps={{ className: active }}>
            <span className="size-4 shrink-0 rounded-full border-2 border-current" />
            <span className="font-display text-[9px] font-semibold sm:text-[10px]">Explore</span>
          </Link>
          <Link to="/create" className={item} activeProps={{ className: active }}>
            <span className="size-4 shrink-0 rounded-md border-2 border-current" />
            <span className="font-display text-[9px] font-semibold sm:text-[10px]">Create</span>
          </Link>
          <Link to="/messages" className={item} activeProps={{ className: active }}>
            <span className="size-4 shrink-0 rounded-full border-2 border-current" />
            <span className="font-display text-[9px] font-semibold sm:text-[10px]">Inbox</span>
          </Link>
          <Link to="/profile" className={item} activeProps={{ className: active }}>
            <span className="size-4 shrink-0 rounded-md border-2 border-current" />
            <span className="font-display text-[9px] font-semibold sm:text-[10px]">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

