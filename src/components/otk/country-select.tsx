import { useMemo, useState } from "react";

import { COUNTRIES, COUNTRY_BY_CODE } from "@/data/countries";
import { cn } from "@/lib/utils";
import { FieldError, FieldLabel } from "./field";

interface CountrySelectProps {
  value: string | null;
  onChange: (code: string) => void;
  label?: string;
  error?: string;
}

/** Country must be chosen before the phone number so the calling code is known. */
export function CountrySelect({ value, onChange, label = "Country", error }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = value ? COUNTRY_BY_CODE[value] : undefined;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase() === q,
    );
  }, [query]);

  return (
    <div className="mt-4 first:mt-0">
      <FieldLabel>{label}</FieldLabel>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "mt-2 flex w-full items-center gap-3 rounded-2xl bg-panel2 px-4 py-3 text-left ring-1 ring-line",
          selected && "ring-2 ring-neon shadow-[0_0_20px_color-mix(in_oklab,var(--neon)_25%,transparent)]",
          error && "ring-ember/70",
        )}
      >
        <span className="text-xl">{selected?.flag ?? "🌐"}</span>
        <span className="flex-1">
          <span className="block font-display text-sm font-semibold text-snow">
            {selected?.name ?? "Select your country"}
          </span>
          <span className="block text-xs text-mist">{selected?.dial ?? "Required before phone"}</span>
        </span>
        <span className="size-4 shrink-0 translate-y-0.5 rotate-45 rounded-full border-2 border-mist" />
      </button>

      {open ? (
        <div className="mt-2 overflow-hidden rounded-2xl bg-panel ring-1 ring-line">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries…"
            className="w-full bg-panel2 px-4 py-3 text-sm text-snow outline-none placeholder:text-mist/60"
          />
          <ul className="max-h-64 overflow-y-auto">
            {results.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c.code);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-panel2",
                    c.code === value && "bg-neon/10",
                  )}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="flex-1 truncate text-sm text-snow">{c.name}</span>
                  <span className="font-display text-xs font-semibold text-mist">{c.dial}</span>
                </button>
              </li>
            ))}
            {results.length === 0 ? (
              <li className="px-4 py-4 text-sm text-mist">No country matches “{query}”.</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <FieldError>{error}</FieldError>
    </div>
  );
}
