import { cn } from "@/lib/utils";

interface ConceptBadgeProps {
  label: string;
  type?: "exact" | "synonym" | "related" | "manual";
  className?: string;
}

const typeStyles = {
  exact: "bg-accent text-accent-foreground border-primary/20",
  synonym: "bg-sage-light text-sage-dark border-sage/20",
  related: "bg-warm text-warm-dark border-warm-dark/20",
  manual: "bg-secondary text-secondary-foreground border-border",
};

export default function ConceptBadge({ label, type = "exact", className }: ConceptBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-body font-medium border",
        typeStyles[type],
        className
      )}
    >
      {label}
    </span>
  );
}
