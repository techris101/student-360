import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus-visible:ring-offset-2 active:scale-[0.985] rounded-[6px]";

    const variantStyles = {
      primary:
        "bg-[var(--teal)] text-white hover:brightness-105 active:brightness-95 shadow-sm font-medium",
      secondary:
        "bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)] active:bg-[var(--surface-2)] shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
      outline:
        "bg-transparent text-[var(--ink)] border border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]",
      ghost:
        "bg-transparent text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] active:bg-[var(--surface-2)]",
      destructive:
        "bg-[var(--red)] text-white hover:brightness-105 active:brightness-95 shadow-sm",
    };

    const sizeStyles = {
      default: "h-10 min-h-[40px] px-4 py-2 sm:h-10",
      sm: "h-8 px-3 text-xs",
      lg: "h-11 px-6 text-base",
      icon: "h-10 w-10 p-0",
    };

    return (
      <Comp
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
