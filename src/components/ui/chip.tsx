import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "met" | "partial" | "not_met";
}

export function Chip({
  className,
  variant = "default",
  children,
  ...props
}: ChipProps) {
  const variantStyles = {
    default: "bg-[var(--surface-2)] text-[var(--ink)]",
    met: "bg-[var(--teal-subtle)] text-[var(--teal)]",
    partial: "bg-[var(--amber-subtle)] text-[var(--amber)]",
    not_met: "bg-[var(--red-subtle)] text-[var(--red)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[13px] font-medium leading-none select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
