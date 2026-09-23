import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[6px] bg-[var(--surface-2)]", className)}
      {...props}
    />
  );
}

export { Skeleton };
