import { cn } from "@/lib/utils";
import type { Synlighet } from "@/types/posts";

const styles: Record<Synlighet, string> = {
  privat: "bg-secondary text-secondary-foreground border-border",
  delad: "bg-warm text-warm-dark border-warm-dark/20",
  publik: "bg-accent text-accent-foreground border-primary/20",
};

const labels: Record<Synlighet, string> = {
  privat: "Privat",
  delad: "Delad",
  publik: "Offentlig",
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
