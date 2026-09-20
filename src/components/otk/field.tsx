import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <label className={cn("block text-xs font-medium text-mist", className)}>{children}</label>;
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs text-ember">{children}</p>;
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
  prefix?: ReactNode;
  trailing?: ReactNode;
}

export function TextField({
  label,
  error,
  hint,
  prefix,
  trailing,
  className,
  ...props
}: TextFieldProps) {
  return (
    <div className={cn("mt-4 first:mt-0", className)}>
      <FieldLabel>{label}</FieldLabel>
      <div
        className={cn(
          "mt-2 flex items-center gap-2 rounded-2xl bg-panel2 px-4 py-3 ring-1 ring-line transition-shadow focus-within:ring-2 focus-within:ring-neon focus-within:shadow-[0_0_20px_color-mix(in_oklab,var(--neon)_25%,transparent)]",
          error && "ring-ember/70",
        )}
      >
        {prefix}
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-snow outline-none placeholder:text-mist/60"
          {...props}
        />
        {trailing}
      </div>
      {hint && !error ? <p className="mt-1.5 text-xs text-mist">{hint}</p> : null}
      <FieldError>{error}</FieldError>
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export function SelectField({ label, error, className, children, ...props }: SelectFieldProps) {
  return (
    <div className={cn("mt-4 first:mt-0", className)}>
      <FieldLabel>{label}</FieldLabel>
      <div
        className={cn(
          "mt-2 rounded-2xl bg-panel2 px-4 py-3 ring-1 ring-line focus-within:ring-2 focus-within:ring-neon",
          error && "ring-ember/70",
        )}
      >
        <select
          className="w-full bg-transparent font-display text-sm font-semibold text-snow outline-none [&>option]:bg-panel2 [&>option]:text-snow"
          {...props}
        >
          {children}
        </select>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}
