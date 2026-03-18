import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  className?: string;
}

export default function StatCard({ label, value, sublabel, className }: StatCardProps) {
  return (
    <div className={cn("bg-card/96 rounded-2xl border border-border/70 p-5", className)}>
      <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl lg:text-3xl font-display font-semibold text-foreground">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-muted-foreground font-body">{sublabel}</p>}
    </div>
  );
}
