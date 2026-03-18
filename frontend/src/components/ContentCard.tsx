import { cn } from "@/lib/utils";

interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export default function ContentCard({ children, className, padding = "md" }: ContentCardProps) {
  const paddingMap = {
    sm: "p-4",
    md: "p-5 lg:p-6",
    lg: "p-6 lg:p-8",
  };

  return (
    <div
      className={cn(
        "bg-card/96 rounded-2xl border border-border/70 shadow-[0_8px_30px_rgba(26,36,28,0.04)]",
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
