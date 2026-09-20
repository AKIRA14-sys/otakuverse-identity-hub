import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const otkButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl font-display font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        neon: "bg-neon text-ink ring-1 ring-neon/60 glow-ring hover:bg-glow",
        panel: "bg-panel text-snow ring-1 ring-line hover:bg-panel2",
        subtle: "bg-panel2 text-mist ring-1 ring-line hover:text-snow",
        ghost: "text-mist hover:text-snow",
        outlineNeon: "bg-neon/15 text-neon ring-1 ring-neon/50 hover:bg-neon/25",
      },
      size: {
        sm: "px-4 py-2 text-xs",
        md: "px-4 py-3 text-sm",
        lg: "px-5 py-3.5 text-sm",
        block: "w-full py-3.5 text-sm",
      },
    },
    defaultVariants: { variant: "neon", size: "md" },
  },
);

export interface OtkButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof otkButtonVariants> {}

export function OtkButton({ className, variant, size, ...props }: OtkButtonProps) {
  return <button className={cn(otkButtonVariants({ variant, size }), className)} {...props} />;
}
