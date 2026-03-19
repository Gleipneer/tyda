import { cn } from "@/lib/utils";
import type { Synlighet } from "@/types/posts";

const styles: Record<Synlighet, string> = {
  privat: "bg-secondary text-secondary-foreground border-border",
  publik: "bg-accent text-accent-foreground border-primary/20",
};

const labels: Record<Synlighet, string> = {
  privat: "Privat",
  publik: "Publik",
};

export default function VisibilityBadge({
  value,
  className,
}: {
  value: Synlighet;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-body font-medium",
        styles[value],
        className
      )}
    >
      {labels[value]}
    </span>
  );
}
