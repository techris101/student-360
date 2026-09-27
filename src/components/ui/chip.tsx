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
    default: "bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--line)]/50",
    met: "bg-[var(--teal-subtle)] text-[var(--teal)] border border-[var(--teal)]/15 font-medium",
    partial: "bg-[var(--amber-subtle)] text-[var(--amber)] border border-[var(--amber)]/15 font-medium",
    not_met: "bg-[var(--red-subtle)] text-[var(--red)] border border-[var(--red)]/15 font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-xs font-medium leading-normal select-none transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
